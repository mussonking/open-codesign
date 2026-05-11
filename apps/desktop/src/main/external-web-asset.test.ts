import { mkdir, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requestExternalResourcePermission } from './external-resource-permission-ipc';
import { importExternalWebAsset, sanitizeSvgAssetText } from './external-web-asset';

vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(async () => [{ address: '93.184.216.34', family: 4 }]),
}));

vi.mock('./external-resource-permission-ipc', () => ({
  requestExternalResourcePermission: vi.fn(async () => ({ scope: 'once' })),
}));

const permissionMock = vi.mocked(requestExternalResourcePermission);

describe('importExternalWebAsset', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'codesign-external-web-asset-'));
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(new Uint8Array([0x77, 0x4f, 0x46, 0x32]), {
            status: 200,
            headers: { 'content-type': 'font/woff2', 'content-length': '4' },
          }),
      ),
    );
    permissionMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('downloads approved direct fonts into assets/fonts', async () => {
    const result = await importExternalWebAsset({
      sessionId: 'session-1',
      workspaceRoot: root,
      getMainWindow: () => null,
      request: {
        url: 'https://example.com/fonts/demo.woff2',
        kind: 'font',
        usage: 'Headline font',
        sourceName: 'Demo',
      },
    });

    expect(result.path).toBe('assets/fonts/demo.woff2');
    expect(result.css).toContain('@font-face');
    expect(permissionMock).toHaveBeenCalledOnce();
    await expect(readFile(path.join(root, 'assets', 'fonts', 'demo.woff2'))).resolves.toEqual(
      Buffer.from([0x77, 0x4f, 0x46, 0x32]),
    );
  });

  it('sanitizes imported SVGs before writing them to the workspace', async () => {
    const unsafeSvg = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 10 10">',
      '<defs><linearGradient id="g"><stop offset="0" stop-color="#fff"/></linearGradient><path id="shape" d="M0 0h10v10H0z"/></defs>',
      '<style>@import url("https://evil.example/style.css"); .safe { fill: url(#g); } .bad { filter: url(https://evil.example/filter.svg); }</style>',
      '<script>alert("x")</script>',
      '<foreignObject><iframe src="https://evil.example/frame"></iframe></foreignObject>',
      '<a xlink:href="https://evil.example/" target="_blank"><rect onclick="alert(1)" fill="url(#g)" width="10" height="10"/></a>',
      '<use xlink:href="#shape"/>',
      '<image href="https://evil.example/pixel.png"/>',
      '<circle style="fill: url(https://evil.example/fill.svg)" r="4"/>',
      '</svg>',
    ].join('');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(unsafeSvg, {
            status: 200,
            headers: {
              'content-type': 'image/svg+xml',
              'content-length': String(Buffer.byteLength(unsafeSvg)),
            },
          }),
      ),
    );

    const result = await importExternalWebAsset({
      sessionId: 'session-svg',
      workspaceRoot: root,
      getMainWindow: () => null,
      request: {
        url: 'https://example.com/assets/logo.svg',
        kind: 'svg',
        usage: 'Logo',
      },
    });

    const saved = await readFile(path.join(root, result.path), 'utf8');
    expect(result.path).toBe('assets/logo.svg');
    expect(result.mimeType).toBe('image/svg+xml');
    expect(saved).not.toContain('<script');
    expect(saved).not.toContain('<foreignObject');
    expect(saved).not.toContain('<iframe');
    expect(saved).not.toContain('onclick');
    expect(saved).not.toContain('target=');
    expect(saved).not.toContain('https://evil.example');
    expect(saved).not.toContain('@import');
    expect(saved).toContain('fill="url(#g)"');
    expect(saved).toContain('xlink:href="#shape"');
  });

  it('keeps inert SVG structure and namespace references while stripping active wrappers', () => {
    const safe = sanitizeSvgAssetText(
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a href="https://example.com"><use xlink:href="#icon"/></a><style>.icon{fill:url(#paint)}</style></svg>',
    );

    expect(safe).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
    expect(safe).toContain('<use xlink:href="#icon"/>');
    expect(safe).toContain('fill:url(#paint)');
    expect(safe).not.toContain('<a ');
    expect(safe).not.toContain('href="https://example.com"');
  });

  it('persists always-allow decisions per origin and kind', async () => {
    permissionMock.mockResolvedValueOnce({ scope: 'always' });
    await mkdir(path.join(root, '.codesign'), { recursive: true });

    await importExternalWebAsset({
      sessionId: 'session-2',
      workspaceRoot: root,
      getMainWindow: () => null,
      request: {
        url: 'https://example.com/fonts/demo.woff2',
        kind: 'font',
        usage: 'Headline font',
      },
    });
    await importExternalWebAsset({
      sessionId: 'session-2',
      workspaceRoot: root,
      getMainWindow: () => null,
      request: {
        url: 'https://example.com/fonts/demo.woff2',
        kind: 'font',
        usage: 'Headline font',
      },
    });

    expect(permissionMock).toHaveBeenCalledOnce();
    const settings = JSON.parse(
      await readFile(path.join(root, '.codesign', 'settings.json'), 'utf8'),
    ) as { externalResourcePermissions?: unknown[] };
    expect(settings.externalResourcePermissions).toHaveLength(1);
  });

  it('rejects non-https urls before requesting permission', async () => {
    await expect(
      importExternalWebAsset({
        sessionId: 'session-3',
        workspaceRoot: root,
        getMainWindow: () => null,
        request: {
          url: 'http://example.com/fonts/demo.woff2',
          kind: 'font',
          usage: 'Headline font',
        },
      }),
    ).rejects.toThrow(/https/);
    expect(permissionMock).not.toHaveBeenCalled();
  });
});
