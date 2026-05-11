import { mkdir, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requestExternalResourcePermission } from './external-resource-permission-ipc';
import { importExternalWebAsset } from './external-web-asset';

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
