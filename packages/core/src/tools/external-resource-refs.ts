export interface ExternalResourceRefIssue {
  message: string;
  source: string;
  lineno?: number;
}

interface RawRefIssue {
  reason: string;
  url: string;
  index: number;
}

const EXTERNAL_HTTP_RE = /^https?:\/\//i;
const CSS_URL_RE = /url\(\s*(['"]?)(https?:\/\/[^'")\s]+)\1\s*\)/gi;
const CSS_IMPORT_RE = /@import\s+(?:url\(\s*)?(['"])(https?:\/\/[^'")\s]+)\1(?:\s*\))?/gi;
const TAG_RE = /<([a-zA-Z][a-zA-Z0-9:-]*)\b([^>]*)>/g;
const ATTR_RE =
  /([:@A-Za-z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{["']([^"']*)["']\})/g;
const JS_IMPORT_RE = /\bimport\s*\(\s*(['"])(https?:\/\/[^'"]+)\1\s*\)/gi;

const RESOURCE_ATTRS = new Set(['src', 'poster', 'srcset']);

export function findExternalResourceRefIssues(
  source: string,
  path: string,
): ExternalResourceRefIssue[] {
  const issues: RawRefIssue[] = [];
  collectCssRefs(source, issues);
  collectHtmlAndJsxRefs(source, issues);
  collectDynamicImportRefs(source, issues);

  return dedupeIssues(issues).map((issue) => ({
    message:
      `Unapproved external resource ${issue.url} in ${issue.reason}. ` +
      'Ask the user first, import the asset with import_web_asset, then reference the returned local assets/... path.',
    source: path,
    lineno: lineForIndex(source, issue.index),
  }));
}

function collectCssRefs(source: string, issues: RawRefIssue[]): void {
  let match = CSS_URL_RE.exec(source);
  while (match !== null) {
    const url = match[2];
    if (url !== undefined) {
      issues.push({ reason: 'CSS url()', url, index: match.index });
    }
    match = CSS_URL_RE.exec(source);
  }

  match = CSS_IMPORT_RE.exec(source);
  while (match !== null) {
    const url = match[2];
    if (url !== undefined) {
      issues.push({ reason: 'CSS @import', url, index: match.index });
    }
    match = CSS_IMPORT_RE.exec(source);
  }
}

function collectHtmlAndJsxRefs(source: string, issues: RawRefIssue[]): void {
  let tag = TAG_RE.exec(source);
  while (tag !== null) {
    const tagName = (tag[1] ?? '').toLowerCase();
    const attrs = tag[2] ?? '';
    let attr = ATTR_RE.exec(attrs);
    while (attr !== null) {
      const rawName = attr[1] ?? '';
      const attrName = normalizeAttrName(rawName);
      const value = attr[2] ?? attr[3] ?? attr[4] ?? attr[5] ?? '';
      const attrIndex = tag.index + tag[0].indexOf(attr[0]);
      if (shouldBlockAttr(tagName, attrName, value)) {
        for (const url of externalUrlsInAttrValue(value)) {
          issues.push({
            reason: tagName === 'link' ? '<link> stylesheet/reference' : `${attrName} attribute`,
            url,
            index: attrIndex,
          });
        }
      }
      attr = ATTR_RE.exec(attrs);
    }
    tag = TAG_RE.exec(source);
  }
}

function collectDynamicImportRefs(source: string, issues: RawRefIssue[]): void {
  let match = JS_IMPORT_RE.exec(source);
  while (match !== null) {
    const url = match[2];
    if (url !== undefined) {
      issues.push({ reason: 'dynamic import()', url, index: match.index });
    }
    match = JS_IMPORT_RE.exec(source);
  }
}

function normalizeAttrName(rawName: string): string {
  if (rawName === 'xlink:href') return 'href';
  return rawName.toLowerCase();
}

function shouldBlockAttr(tagName: string, attrName: string, value: string): boolean {
  if (!valueContainsExternalUrl(value)) return false;
  if (RESOURCE_ATTRS.has(attrName)) return true;
  if (tagName === 'link' && attrName === 'href') return true;
  return false;
}

function valueContainsExternalUrl(value: string): boolean {
  return externalUrlsInAttrValue(value).length > 0;
}

function externalUrlsInAttrValue(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim().split(/\s+/, 1)[0] ?? '')
    .filter((part) => EXTERNAL_HTTP_RE.test(part));
}

function dedupeIssues(issues: RawRefIssue[]): RawRefIssue[] {
  const seen = new Set<string>();
  const out: RawRefIssue[] = [];
  for (const issue of issues) {
    const key = `${issue.reason}\n${issue.url}\n${issue.index}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(issue);
  }
  return out;
}

function lineForIndex(source: string, index: number): number {
  return source.slice(0, Math.max(0, index)).split('\n').length;
}
