import type { AgentTool, AgentToolResult } from '@mariozechner/pi-agent-core';
import { Type } from '@sinclair/typebox';

const ImportWebAssetParams = Type.Object({
  url: Type.String(),
  kind: Type.Union([
    Type.Literal('font'),
    Type.Literal('image'),
    Type.Literal('svg'),
    Type.Literal('other-asset'),
  ]),
  usage: Type.String(),
  filenameHint: Type.Optional(Type.String()),
  sourceName: Type.Optional(Type.String()),
  licenseLabel: Type.Optional(Type.String()),
});

export type ImportWebAssetKind = 'font' | 'image' | 'svg' | 'other-asset';

export interface ImportWebAssetRequest {
  url: string;
  kind: ImportWebAssetKind;
  usage: string;
  filenameHint?: string | undefined;
  sourceName?: string | undefined;
  licenseLabel?: string | undefined;
}

export interface ImportedWebAssetFile {
  path: string;
  sourceUrl: string;
  mimeType: string;
  bytes: number;
}

export interface ImportWebAssetResult {
  path: string;
  paths: string[];
  kind: ImportWebAssetKind;
  sourceUrl: string;
  mimeType: string;
  bytes: number;
  css?: string | undefined;
  files: ImportedWebAssetFile[];
}

export interface ImportWebAssetDetails extends ImportWebAssetResult {}

export type ImportWebAssetFn = (
  request: ImportWebAssetRequest,
  signal?: AbortSignal,
) => Promise<ImportWebAssetResult>;

export function makeImportWebAssetTool(
  importWebAsset: ImportWebAssetFn,
): AgentTool<typeof ImportWebAssetParams, ImportWebAssetDetails> {
  return {
    name: 'import_web_asset',
    label: 'Import web asset',
    description:
      'Import an approved external design resource into the local workspace. ' +
      'Use this only after asking the user in chat when the resource is optional. ' +
      'Supports direct HTTPS font/image/SVG asset URLs and Google Fonts CSS2 URLs. ' +
      'The host asks for download permission, copies the files locally under assets/... ' +
      'or assets/fonts/..., and returns local paths plus @font-face CSS for fonts. ' +
      'Do not hotlink the original URL in App.jsx/CSS; reference the returned local path.',
    parameters: ImportWebAssetParams,
    async execute(_toolCallId, params, signal): Promise<AgentToolResult<ImportWebAssetDetails>> {
      const url = params.url.trim();
      const usage = params.usage.trim();
      if (url.length === 0) throw new Error('import_web_asset requires a non-empty url');
      if (usage.length === 0) throw new Error('import_web_asset requires a non-empty usage');
      const result = await importWebAsset(
        {
          url,
          kind: params.kind,
          usage,
          ...(params.filenameHint !== undefined ? { filenameHint: params.filenameHint } : {}),
          ...(params.sourceName !== undefined ? { sourceName: params.sourceName } : {}),
          ...(params.licenseLabel !== undefined ? { licenseLabel: params.licenseLabel } : {}),
        },
        signal,
      );
      const cssNote = result.css ? `\n\nCSS to paste into the design:\n${result.css}` : '';
      return {
        content: [
          {
            type: 'text',
            text:
              `Imported ${result.files.length} local ${result.kind} resource(s): ` +
              `${result.paths.join(', ')}. Reference local workspace paths only.${cssNote}`,
          },
        ],
        details: result,
      };
    },
  };
}
