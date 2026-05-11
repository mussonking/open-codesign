import { describe, expect, it, vi } from 'vitest';
import { type ImportWebAssetFn, makeImportWebAssetTool } from './import-web-asset.js';

describe('import_web_asset tool', () => {
  it('passes normalized request fields to the host bridge', async () => {
    const bridge = vi.fn<ImportWebAssetFn>(async (request) => ({
      path: 'assets/fonts/demo.woff2',
      paths: ['assets/fonts/demo.woff2'],
      kind: request.kind,
      sourceUrl: request.url,
      mimeType: 'font/woff2',
      bytes: 128,
      css: '@font-face { font-family: "Demo"; }',
      files: [
        {
          path: 'assets/fonts/demo.woff2',
          sourceUrl: request.url,
          mimeType: 'font/woff2',
          bytes: 128,
        },
      ],
    }));
    const tool = makeImportWebAssetTool(bridge);

    const result = await tool.execute('tool-1', {
      url: ' https://example.com/demo.woff2 ',
      kind: 'font',
      usage: 'Headline typography',
      filenameHint: 'Demo',
      sourceName: 'Demo Font',
      licenseLabel: 'User confirmed',
    });

    expect(bridge).toHaveBeenCalledWith(
      {
        url: 'https://example.com/demo.woff2',
        kind: 'font',
        usage: 'Headline typography',
        filenameHint: 'Demo',
        sourceName: 'Demo Font',
        licenseLabel: 'User confirmed',
      },
      undefined,
    );
    const text = result.content[0]?.type === 'text' ? result.content[0].text : '';
    expect(text).toContain('assets/fonts/demo.woff2');
    expect(text).toContain('@font-face');
    expect(result.details.css).toContain('Demo');
  });

  it('rejects empty usage before the host bridge runs', async () => {
    const bridge = vi.fn<ImportWebAssetFn>();
    const tool = makeImportWebAssetTool(bridge);

    await expect(
      tool.execute('tool-2', {
        url: 'https://example.com/logo.svg',
        kind: 'svg',
        usage: ' ',
      }),
    ).rejects.toThrow(/usage/);
    expect(bridge).not.toHaveBeenCalled();
  });
});
