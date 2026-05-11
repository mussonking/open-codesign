import { lookup as dnsLookup } from 'node:dns/promises';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import type {
  ImportedWebAssetFile,
  ImportWebAssetKind,
  ImportWebAssetRequest,
  ImportWebAssetResult,
} from '@open-codesign/core';
import { CodesignError, ERROR_CODES } from '@open-codesign/shared';
import type { BrowserWindow } from 'electron';
import {
  type ExternalResourcePermissionRequestInput,
  requestExternalResourcePermission,
} from './external-resource-permission-ipc';
import { getLogger } from './logger';
import { resolveSafeWorkspaceChildPath } from './workspace-reader';

const log = getLogger('external-web-asset');

const MAX_DIRECT_BYTES = 10 * 1024 * 1024;
const MAX_STYLESHEET_BYTES = 256 * 1024;
const MAX_GOOGLE_FONT_FILES = 12;
const MAX_REDIRECTS = 3;
const SVG_ACTIVE_ELEMENTS = [
  'script',
  'foreignObject',
  'iframe',
  'frame',
  'object',
  'embed',
  'audio',
  'video',
  'canvas',
  'link',
  'meta',
  'base',
].join('|');

const FONT_EXTENSIONS = new Set(['.woff2', '.woff', '.ttf', '.otf']);
const IMAGE_EXTENSIONS = new Set([
  '.avif',
  '.bmp',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.png',
  '.webp',
]);

const MIME_BY_EXTENSION = new Map<string, string>([
  ['.avif', 'image/avif'],
  ['.bmp', 'image/bmp'],
  ['.gif', 'image/gif'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.otf', 'font/otf'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.ttf', 'font/ttf'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

const EXTENSION_BY_MIME = new Map<string, string>([
  ['font/otf', '.otf'],
  ['font/ttf', '.ttf'],
  ['font/woff', '.woff'],
  ['font/woff2', '.woff2'],
  ['image/avif', '.avif'],
  ['image/bmp', '.bmp'],
  ['image/gif', '.gif'],
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/svg+xml', '.svg'],
  ['image/webp', '.webp'],
]);

export interface ImportExternalWebAssetOptions {
  sessionId: string;
  workspaceRoot: string;
  request: ImportWebAssetRequest;
  getMainWindow: () => BrowserWindow | null;
  signal?: AbortSignal | undefined;
}

type FetchKind = 'stylesheet' | ImportWebAssetKind;

interface FetchContext {
  sessionId: string;
  workspaceRoot: string;
  getMainWindow: () => BrowserWindow | null;
  signal?: AbortSignal | undefined;
  allowedForOperation: Set<string>;
}

interface FontFaceRule {
  family: string;
  style?: string | undefined;
  weight?: string | undefined;
  sourceUrl: string;
  format?: string | undefined;
}

export async function importExternalWebAsset(
  opts: ImportExternalWebAssetOptions,
): Promise<ImportWebAssetResult> {
  const parsed = parseHttpsUrl(opts.request.url);
  const context: FetchContext = {
    sessionId: opts.sessionId,
    workspaceRoot: opts.workspaceRoot,
    getMainWindow: opts.getMainWindow,
    signal: opts.signal,
    allowedForOperation: new Set(),
  };

  if (isGoogleFontsStylesheetUrl(parsed)) {
    if (opts.request.kind !== 'font') {
      throw new CodesignError(
        'Google Fonts stylesheets can only be imported as kind "font"',
        ERROR_CODES.IPC_BAD_INPUT,
      );
    }
    return importGoogleFontsStylesheet(context, parsed, opts.request);
  }

  return importDirectAsset(context, parsed, opts.request);
}

async function importDirectAsset(
  context: FetchContext,
  parsed: URL,
  request: ImportWebAssetRequest,
): Promise<ImportWebAssetResult> {
  const provisionalPath = await allocateDestinationPath(context.workspaceRoot, request, parsed);
  const response = await fetchApprovedResource(context, {
    url: parsed,
    kind: request.kind,
    destinationPath: provisionalPath,
    usage: request.usage,
    sourceName: request.sourceName,
    licenseLabel: request.licenseLabel,
    maxBytes: MAX_DIRECT_BYTES,
  });
  const mimeType = normalizeContentType(response.contentType) ?? mimeForUrl(parsed);
  const ext = extensionForMimeOrUrl(mimeType, parsed);
  const kind = effectiveKind(request.kind, mimeType, parsed);
  assertSupportedKind(request.kind, kind, parsed, mimeType);
  const destinationPath =
    path.extname(provisionalPath).toLowerCase() === ext
      ? provisionalPath
      : await allocateDestinationPath(context.workspaceRoot, request, parsed, ext);
  const writeBytes = kind === 'svg' ? sanitizeSvgAssetBytes(response.bytes) : response.bytes;
  const fileMimeType = kind === 'svg' ? 'image/svg+xml' : mimeType;
  await writeWorkspaceBytes(context.workspaceRoot, destinationPath, writeBytes);
  const file = {
    path: destinationPath,
    sourceUrl: response.finalUrl,
    mimeType: fileMimeType,
    bytes: writeBytes.byteLength,
  };
  const css = kind === 'font' ? fontFaceCss(request, file, parsed, fileMimeType) : undefined;
  return resultForFiles({
    kind,
    sourceUrl: parsed.toString(),
    files: [file],
    css,
  });
}

async function importGoogleFontsStylesheet(
  context: FetchContext,
  parsed: URL,
  request: ImportWebAssetRequest,
): Promise<ImportWebAssetResult> {
  const response = await fetchApprovedResource(context, {
    url: parsed,
    kind: 'stylesheet',
    destinationPath: 'assets/fonts/',
    usage: request.usage,
    sourceName: request.sourceName ?? 'Google Fonts',
    licenseLabel: request.licenseLabel ?? 'Google Fonts license metadata',
    maxBytes: MAX_STYLESHEET_BYTES,
  });
  const cssText = response.bytes.toString('utf8');
  const faces = parseGoogleFontFaces(cssText);
  if (faces.length === 0) {
    throw new CodesignError(
      'Google Fonts stylesheet did not include downloadable font files',
      ERROR_CODES.REFERENCE_URL_FETCH_FAILED,
    );
  }
  if (faces.length > MAX_GOOGLE_FONT_FILES) {
    throw new CodesignError(
      `Google Fonts stylesheet references ${faces.length} files; maximum is ${MAX_GOOGLE_FONT_FILES}`,
      ERROR_CODES.REFERENCE_URL_TOO_LARGE,
    );
  }

  const files: ImportedWebAssetFile[] = [];
  const cssBlocks: string[] = [];
  let index = 0;
  for (const face of faces) {
    index += 1;
    const sourceUrl = parseHttpsUrl(face.sourceUrl);
    const filenameHint = [
      face.family,
      face.style ?? 'normal',
      face.weight ?? 'regular',
      String(index),
    ].join('-');
    const destinationPath = await allocateDestinationPath(
      context.workspaceRoot,
      { ...request, filenameHint, kind: 'font' },
      sourceUrl,
      '.woff2',
    );
    const fontResponse = await fetchApprovedResource(context, {
      url: sourceUrl,
      kind: 'font',
      destinationPath,
      usage: request.usage,
      sourceName: request.sourceName ?? 'Google Fonts',
      licenseLabel: request.licenseLabel ?? 'Google Fonts license metadata',
      maxBytes: MAX_DIRECT_BYTES,
    });
    const mimeType = normalizeContentType(fontResponse.contentType) ?? 'font/woff2';
    assertSupportedKind('font', effectiveKind('font', mimeType, sourceUrl), sourceUrl, mimeType);
    await writeWorkspaceBytes(context.workspaceRoot, destinationPath, fontResponse.bytes);
    const file = {
      path: destinationPath,
      sourceUrl: fontResponse.finalUrl,
      mimeType,
      bytes: fontResponse.bytes.byteLength,
    };
    files.push(file);
    cssBlocks.push(fontFaceRuleCss(face, file));
  }

  return resultForFiles({
    kind: 'font',
    sourceUrl: parsed.toString(),
    files,
    css: cssBlocks.join('\n\n'),
  });
}

function resultForFiles(input: {
  kind: ImportWebAssetKind;
  sourceUrl: string;
  files: ImportedWebAssetFile[];
  css?: string | undefined;
}): ImportWebAssetResult {
  const first = input.files[0];
  if (first === undefined) {
    throw new CodesignError('No files imported', ERROR_CODES.REFERENCE_URL_FETCH_FAILED);
  }
  const bytes = input.files.reduce((sum, file) => sum + file.bytes, 0);
  return {
    path: first.path,
    paths: input.files.map((file) => file.path),
    kind: input.kind,
    sourceUrl: input.sourceUrl,
    mimeType: first.mimeType,
    bytes,
    files: input.files,
    ...(input.css !== undefined ? { css: input.css } : {}),
  };
}

async function fetchApprovedResource(
  context: FetchContext,
  input: {
    url: URL;
    kind: FetchKind;
    destinationPath: string;
    usage: string;
    sourceName?: string | undefined;
    licenseLabel?: string | undefined;
    maxBytes: number;
  },
): Promise<{ bytes: Buffer; contentType: string | null; finalUrl: string }> {
  let url = input.url;
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    validateHttpsUrlBeforePermission(url);
    await ensurePermission(context, {
      url: url.toString(),
      origin: url.origin,
      kind: input.kind === 'stylesheet' ? 'font' : input.kind,
      destinationPath: input.destinationPath,
      usage: input.usage,
      ...(input.sourceName !== undefined ? { sourceName: input.sourceName } : {}),
      ...(input.licenseLabel !== undefined ? { licenseLabel: input.licenseLabel } : {}),
    });
    await validateResolvedPublicHost(url);
    const response = await fetch(url, {
      redirect: 'manual',
      ...(context.signal !== undefined ? { signal: context.signal } : {}),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        throw new CodesignError(
          'Redirect missing Location header',
          ERROR_CODES.REFERENCE_URL_FETCH_FAILED,
        );
      }
      url = parseHttpsUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) {
      throw new CodesignError(
        `External resource returned HTTP ${response.status}`,
        ERROR_CODES.REFERENCE_URL_FETCH_FAILED,
      );
    }
    const declaredLength = Number(response.headers.get('content-length') ?? '0');
    if (Number.isFinite(declaredLength) && declaredLength > input.maxBytes) {
      throw new CodesignError(
        `External resource is too large (${declaredLength} bytes)`,
        ERROR_CODES.REFERENCE_URL_TOO_LARGE,
      );
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.byteLength > input.maxBytes) {
      throw new CodesignError(
        `External resource is too large (${bytes.byteLength} bytes)`,
        ERROR_CODES.REFERENCE_URL_TOO_LARGE,
      );
    }
    return {
      bytes,
      contentType: response.headers.get('content-type'),
      finalUrl: url.toString(),
    };
  }
  throw new CodesignError(
    'External resource redirected too many times',
    ERROR_CODES.REFERENCE_URL_FETCH_FAILED,
  );
}

async function ensurePermission(
  context: FetchContext,
  input: ExternalResourcePermissionRequestInput,
): Promise<void> {
  const key = `${input.origin}\n${input.kind}`;
  if (context.allowedForOperation.has(key)) return;
  if (await hasPersistedPermission(context.workspaceRoot, input.origin, input.kind)) {
    context.allowedForOperation.add(key);
    return;
  }
  const decision = await requestExternalResourcePermission(
    context.sessionId,
    input,
    context.getMainWindow,
  );
  if (decision.scope === 'deny') {
    throw new CodesignError('External resource download denied', ERROR_CODES.IPC_BAD_INPUT);
  }
  context.allowedForOperation.add(key);
  if (decision.scope === 'always') {
    await persistPermission(context.workspaceRoot, input.origin, input.kind);
  }
}

function parseHttpsUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch (cause) {
    throw new CodesignError(
      'External resource URL is invalid',
      ERROR_CODES.REFERENCE_URL_UNSUPPORTED,
      {
        cause,
      },
    );
  }
  if (parsed.protocol !== 'https:') {
    throw new CodesignError(
      'External resource URL must use https://',
      ERROR_CODES.REFERENCE_URL_UNSUPPORTED,
    );
  }
  if (parsed.username || parsed.password) {
    throw new CodesignError(
      'External resource URL must not include credentials',
      ERROR_CODES.REFERENCE_URL_UNSUPPORTED,
    );
  }
  return parsed;
}

function validateHttpsUrlBeforePermission(url: URL): void {
  if (url.protocol !== 'https:') {
    throw new CodesignError(
      'External resource URL must use https://',
      ERROR_CODES.REFERENCE_URL_UNSUPPORTED,
    );
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, '').replace(/\.+$/g, '');
  if (isPrivateHostname(hostname)) {
    throw new CodesignError(
      `External resource host "${url.hostname}" is not allowed`,
      ERROR_CODES.REFERENCE_URL_UNSUPPORTED,
    );
  }
  if (net.isIP(hostname)) return;
}

async function validateResolvedPublicHost(url: URL): Promise<void> {
  const hostname = url.hostname.replace(/^\[|\]$/g, '').replace(/\.+$/g, '');
  if (net.isIP(hostname)) return;
  const addresses = await dnsLookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some((entry) => isPrivateHostname(entry.address))) {
    throw new CodesignError(
      `External resource host "${url.hostname}" resolved to a blocked address`,
      ERROR_CODES.REFERENCE_URL_UNSUPPORTED,
    );
  }
}

function isPrivateHostname(rawHostname: string): boolean {
  const hostname = rawHostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    return true;
  }
  const ipVersion = net.isIP(hostname);
  if (ipVersion === 4) return isPrivateIpv4(hostname);
  if (ipVersion === 6) return isPrivateIpv6(hostname);
  return false;
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.').map((part) => Number(part));
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return true;
  }
  const [a, b, c] = parts;
  if (a === undefined || b === undefined || c === undefined) return true;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isPrivateIpv6(hostname: string): boolean {
  if (hostname === '::' || hostname === '::1') return true;
  if (hostname.startsWith('fc') || hostname.startsWith('fd')) return true;
  if (/^fe[89ab]/.test(hostname)) return true;
  if (hostname.startsWith('ff')) return true;
  if (hostname.startsWith('2001:db8')) return true;
  return false;
}

function isGoogleFontsStylesheetUrl(url: URL): boolean {
  return (
    url.hostname === 'fonts.googleapis.com' && (url.pathname === '/css2' || url.pathname === '/css')
  );
}

function parseGoogleFontFaces(css: string): FontFaceRule[] {
  const out: FontFaceRule[] = [];
  const blockRe = /@font-face\s*\{([\s\S]*?)\}/gi;
  let match = blockRe.exec(css);
  while (match !== null) {
    const body = match[1] ?? '';
    const sourceUrl = /src:\s*url\(([^)]+)\)(?:\s*format\(([^)]+)\))?/i.exec(body);
    const family = readCssProperty(body, 'font-family');
    if (family !== null && sourceUrl?.[1]) {
      out.push({
        family: stripCssQuotes(family),
        style: readCssProperty(body, 'font-style') ?? undefined,
        weight: readCssProperty(body, 'font-weight') ?? undefined,
        sourceUrl: stripCssQuotes(sourceUrl[1].trim()),
        format: sourceUrl[2] ? stripCssQuotes(sourceUrl[2].trim()) : undefined,
      });
    }
    match = blockRe.exec(css);
  }
  return out;
}

function readCssProperty(body: string, property: string): string | null {
  const re = new RegExp(`${property}\\s*:\\s*([^;]+)`, 'i');
  return re.exec(body)?.[1]?.trim() ?? null;
}

function stripCssQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, '');
}

function normalizeContentType(contentType: string | null): string | null {
  if (contentType === null) return null;
  return contentType.split(';', 1)[0]?.trim().toLowerCase() || null;
}

function mimeForUrl(url: URL): string {
  const ext = path.extname(url.pathname).toLowerCase();
  return MIME_BY_EXTENSION.get(ext) ?? 'application/octet-stream';
}

function extensionForMimeOrUrl(mimeType: string, url: URL): string {
  const fromMime = EXTENSION_BY_MIME.get(mimeType);
  if (fromMime !== undefined) return fromMime;
  const ext = path.extname(url.pathname).toLowerCase();
  return MIME_BY_EXTENSION.has(ext) ? ext : '.bin';
}

function effectiveKind(
  requested: ImportWebAssetKind,
  mimeType: string,
  url: URL,
): ImportWebAssetKind {
  const ext = path.extname(url.pathname).toLowerCase();
  if (mimeType.startsWith('font/') || FONT_EXTENSIONS.has(ext)) return 'font';
  if (mimeType === 'image/svg+xml' || ext === '.svg') return 'svg';
  if (mimeType.startsWith('image/') || IMAGE_EXTENSIONS.has(ext)) return 'image';
  return requested;
}

function assertSupportedKind(
  requested: ImportWebAssetKind,
  detected: ImportWebAssetKind,
  url: URL,
  mimeType: string,
): void {
  if (requested !== 'other-asset' && requested !== detected) {
    throw new CodesignError(
      `External resource looks like ${detected}, not ${requested}`,
      ERROR_CODES.REFERENCE_URL_UNSUPPORTED,
    );
  }
  const ext = path.extname(url.pathname).toLowerCase();
  const safe =
    detected === 'font' ||
    detected === 'svg' ||
    detected === 'image' ||
    FONT_EXTENSIONS.has(ext) ||
    IMAGE_EXTENSIONS.has(ext) ||
    ext === '.svg';
  if (!safe || /(?:javascript|text\/html|text\/css)/i.test(mimeType)) {
    throw new CodesignError(
      `External resource type "${mimeType}" is not supported for import_web_asset`,
      ERROR_CODES.REFERENCE_URL_UNSUPPORTED,
    );
  }
}

export function sanitizeSvgAssetBytes(bytes: Buffer): Buffer {
  const raw = bytes.toString('utf8').replace(/^\uFEFF/, '');
  if (!/<svg(?:\s|>)/i.test(raw)) {
    throw new CodesignError(
      'External SVG did not contain an <svg> root',
      ERROR_CODES.IPC_BAD_INPUT,
    );
  }
  const sanitized = sanitizeSvgAssetText(raw).trimStart();
  if (!/<svg(?:\s|>)/i.test(sanitized)) {
    throw new CodesignError('External SVG was empty after sanitization', ERROR_CODES.IPC_BAD_INPUT);
  }
  return Buffer.from(sanitized, 'utf8');
}

export function sanitizeSvgAssetText(raw: string): string {
  let svg = raw
    .replace(/<!doctype\b[\s\S]*?(?:\]\s*)?>/gi, '')
    .replace(/<!entity\b[^>]*>/gi, '')
    .replace(/<\?xml-stylesheet\b[^?]*\?>/gi, '');
  svg = stripSvgActiveElements(svg);
  svg = stripSvgAnchorWrappers(svg);
  svg = sanitizeSvgStyleBlocks(svg);
  return stripSvgRiskyAttributes(svg);
}

function stripSvgActiveElements(svg: string): string {
  const paired = new RegExp(
    `<\\s*(${SVG_ACTIVE_ELEMENTS})\\b[^>]*>[\\s\\S]*?<\\s*\\/\\s*\\1\\s*>`,
    'gi',
  );
  const selfClosing = new RegExp(`<\\s*(?:${SVG_ACTIVE_ELEMENTS})\\b[^>]*/\\s*>`, 'gi');
  return svg.replace(paired, '').replace(selfClosing, '');
}

function stripSvgAnchorWrappers(svg: string): string {
  return svg.replace(/<\s*a\b[^>]*>/gi, '').replace(/<\s*\/\s*a\s*>/gi, '');
}

function sanitizeSvgStyleBlocks(svg: string): string {
  return svg.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (_match, attrs, css) => {
    const safeCss = sanitizeSvgCssText(String(css));
    if (safeCss.trim().length === 0) return '';
    return `<style${String(attrs)}>${safeCss}</style>`;
  });
}

function sanitizeSvgCssText(css: string): string {
  return css
    .replace(/@import\b[^;]+;?/gi, '')
    .replace(/url\(\s*(['"]?)(?:https?:|\/\/|data:|javascript:)[^)]+\)/gi, 'none')
    .replace(/javascript\s*:/gi, '');
}

function stripSvgRiskyAttributes(svg: string): string {
  return svg.replace(
    /\s+([:@A-Za-z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g,
    (
      match: string,
      rawName: string,
      doubleValue?: string,
      singleValue?: string,
      bareValue?: string,
    ) => {
      const name = rawName.toLowerCase();
      const value = doubleValue ?? singleValue ?? bareValue ?? '';
      if (name === 'xmlns' || name.startsWith('xmlns:')) return match;
      if (name.startsWith('on')) return '';
      if (name === 'target' || name === 'download') return '';
      if ((name === 'href' || name === 'xlink:href' || name === 'src') && isUnsafeSvgUrl(value)) {
        return '';
      }
      if (containsUnsafeSvgUrl(value)) return '';
      return match;
    },
  );
}

function isUnsafeSvgUrl(value: string): boolean {
  const normalized = normalizeSvgUrl(value);
  return (
    normalized.startsWith('http:') ||
    normalized.startsWith('https:') ||
    normalized.startsWith('//') ||
    normalized.startsWith('data:') ||
    normalized.startsWith('javascript:')
  );
}

function containsUnsafeSvgUrl(value: string): boolean {
  const normalized = normalizeSvgUrl(value);
  return (
    normalized.includes('url(http:') ||
    normalized.includes('url(https:') ||
    normalized.includes('url(//') ||
    normalized.includes('url(data:') ||
    normalized.includes('url(javascript:') ||
    normalized.includes('javascript:')
  );
}

function normalizeSvgUrl(value: string): string {
  return stripSvgUrlNoise(decodeNumericEntities(value)).toLowerCase();
}

function stripSvgUrlNoise(value: string): string {
  let out = '';
  for (const char of value) {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined || codePoint <= 0x20 || codePoint === 0x7f || /\s/.test(char)) {
      continue;
    }
    out += char;
  }
  return out;
}

function decodeNumericEntities(value: string): string {
  return value.replace(/&#(x[0-9a-fA-F]+|\d+);?/g, (match, raw: string) => {
    const codePoint =
      raw.startsWith('x') || raw.startsWith('X')
        ? Number.parseInt(raw.slice(1), 16)
        : Number.parseInt(raw, 10);
    if (!Number.isFinite(codePoint)) return match;
    try {
      return String.fromCodePoint(codePoint);
    } catch {
      return match;
    }
  });
}

async function allocateDestinationPath(
  workspaceRoot: string,
  request: ImportWebAssetRequest,
  url: URL,
  forcedExt?: string,
): Promise<string> {
  const ext = forcedExt ?? extensionForMimeOrUrl(mimeForUrl(url), url);
  const baseName = request.filenameHint?.trim() || path.basename(url.pathname) || 'web-asset';
  const parsed = path.parse(baseName);
  const stem = sanitizeStem(parsed.name || baseName || request.kind);
  const finalExt = ext.startsWith('.') ? ext : `.${ext}`;
  const dir = request.kind === 'font' ? 'assets/fonts' : 'assets';
  for (let index = 1; index < 10_000; index += 1) {
    const name = index === 1 ? `${stem}${finalExt}` : `${stem}-${index}${finalExt}`;
    const relativePath = `${dir}/${name}`;
    const absolutePath = await resolveSafeWorkspaceChildPath(workspaceRoot, relativePath);
    try {
      await stat(absolutePath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return relativePath;
      throw err;
    }
  }
  throw new CodesignError(
    'Could not allocate a unique web asset filename',
    ERROR_CODES.IPC_DB_ERROR,
  );
}

function sanitizeStem(input: string): string {
  const stem = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return stem.length > 0 ? stem : 'web-asset';
}

async function writeWorkspaceBytes(
  workspaceRoot: string,
  relativePath: string,
  bytes: Buffer,
): Promise<void> {
  const absolutePath = await resolveSafeWorkspaceChildPath(workspaceRoot, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);
  log.info('external_web_asset.write', { path: relativePath, bytes: bytes.byteLength });
}

function fontFaceCss(
  request: ImportWebAssetRequest,
  file: ImportedWebAssetFile,
  sourceUrl: URL,
  mimeType: string,
): string {
  const family = cssString(request.sourceName?.trim() || fontFamilyFromUrl(sourceUrl));
  const format = fontFormat(mimeType, file.path);
  return [
    '@font-face {',
    `  font-family: ${family};`,
    '  font-style: normal;',
    '  font-weight: 400;',
    '  font-display: swap;',
    `  src: url("${file.path}") format("${format}");`,
    '}',
  ].join('\n');
}

function fontFaceRuleCss(face: FontFaceRule, file: ImportedWebAssetFile): string {
  const format = face.format ?? fontFormat(file.mimeType, file.path);
  return [
    '@font-face {',
    `  font-family: ${cssString(face.family)};`,
    `  font-style: ${face.style ?? 'normal'};`,
    `  font-weight: ${face.weight ?? '400'};`,
    '  font-display: swap;',
    `  src: url("${file.path}") format("${format}");`,
    '}',
  ].join('\n');
}

function fontFamilyFromUrl(url: URL): string {
  const name = path.basename(url.pathname, path.extname(url.pathname)).replace(/[-_]+/g, ' ');
  return name.trim() || 'Imported Web Font';
}

function cssString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function fontFormat(mimeType: string, filePath: string): string {
  if (mimeType === 'font/woff2' || filePath.endsWith('.woff2')) return 'woff2';
  if (mimeType === 'font/woff' || filePath.endsWith('.woff')) return 'woff';
  if (mimeType === 'font/ttf' || filePath.endsWith('.ttf')) return 'truetype';
  if (mimeType === 'font/otf' || filePath.endsWith('.otf')) return 'opentype';
  return 'woff2';
}

interface WorkspaceSettings {
  externalResourcePermissions?: Array<{
    origin: string;
    kind: ImportWebAssetKind;
    grantedAt: string;
  }>;
  [key: string]: unknown;
}

async function readWorkspaceSettings(workspaceRoot: string): Promise<WorkspaceSettings> {
  const settingsPath = path.join(workspaceRoot, '.codesign', 'settings.json');
  try {
    const raw = await readFile(settingsPath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new CodesignError(
        '.codesign/settings.json must contain an object',
        ERROR_CODES.CONFIG_SCHEMA_INVALID,
      );
    }
    return parsed as WorkspaceSettings;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return { schemaVersion: 1 };
    if (err instanceof SyntaxError) {
      throw new CodesignError(
        '.codesign/settings.json is not valid JSON',
        ERROR_CODES.CONFIG_PARSE_FAILED,
        { cause: err },
      );
    }
    throw err;
  }
}

async function hasPersistedPermission(
  workspaceRoot: string,
  origin: string,
  kind: ImportWebAssetKind,
): Promise<boolean> {
  const settings = await readWorkspaceSettings(workspaceRoot);
  return (
    settings.externalResourcePermissions?.some(
      (entry) => entry.origin === origin && entry.kind === kind,
    ) === true
  );
}

async function persistPermission(
  workspaceRoot: string,
  origin: string,
  kind: ImportWebAssetKind,
): Promise<void> {
  const settings = await readWorkspaceSettings(workspaceRoot);
  const existing = settings.externalResourcePermissions ?? [];
  if (!existing.some((entry) => entry.origin === origin && entry.kind === kind)) {
    settings.externalResourcePermissions = [
      ...existing,
      { origin, kind, grantedAt: new Date().toISOString() },
    ];
  }
  const settingsDir = path.join(workspaceRoot, '.codesign');
  await mkdir(settingsDir, { recursive: true });
  await writeFile(
    path.join(settingsDir, 'settings.json'),
    `${JSON.stringify(settings, null, 2)}\n`,
    'utf8',
  );
}
