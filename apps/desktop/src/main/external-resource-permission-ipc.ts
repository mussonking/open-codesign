import { randomUUID } from 'node:crypto';
import type { ImportWebAssetKind } from '@open-codesign/core';
import { CodesignError, ERROR_CODES } from '@open-codesign/shared';
import type { BrowserWindow } from 'electron';
import { ipcMain } from './electron-runtime';
import { getLogger } from './logger';

const log = getLogger('external-resource-permission-ipc');

export type ExternalResourcePermissionScope = 'once' | 'always' | 'deny';

export interface ExternalResourcePermissionRequestInput {
  url: string;
  origin: string;
  kind: ImportWebAssetKind;
  destinationPath: string;
  usage: string;
  sourceName?: string | undefined;
  licenseLabel?: string | undefined;
}

export interface ExternalResourcePermissionResolution {
  scope: ExternalResourcePermissionScope;
}

export interface ExternalResourcePermissionPayload extends ExternalResourcePermissionRequestInput {
  requestId: string;
  sessionId: string;
}

interface PendingRequest {
  resolve: (decision: ExternalResourcePermissionResolution) => void;
  reject: (reason?: unknown) => void;
  sessionId: string;
  input: ExternalResourcePermissionRequestInput;
}

const pending = new Map<string, PendingRequest>();

export function registerExternalResourcePermissionIpc(): void {
  ipcMain.handle('external-resource-permission:resolve', (_event, raw: unknown) => {
    const requestId = readRequestId(raw, 'external-resource-permission:resolve');
    const entry = pending.get(requestId);
    if (!entry) {
      throw new CodesignError(
        `external-resource-permission:resolve called with unknown requestId "${requestId}"`,
        ERROR_CODES.IPC_BAD_INPUT,
      );
    }
    let parsed: { requestId: string; scope: ExternalResourcePermissionScope };
    try {
      parsed = parseResolveInput(raw);
    } catch (err) {
      pending.delete(requestId);
      entry.reject(err);
      throw err;
    }
    pending.delete(requestId);
    log.info('external_resource_permission.resolve', {
      sessionId: entry.sessionId,
      requestId,
      scope: parsed.scope,
      origin: entry.input.origin,
      kind: entry.input.kind,
    });
    entry.resolve({ scope: parsed.scope });
  });
}

export function requestExternalResourcePermission(
  sessionId: string,
  input: ExternalResourcePermissionRequestInput,
  getMainWindow: () => BrowserWindow | null,
): Promise<ExternalResourcePermissionResolution> {
  const requestId = `resource-${randomUUID()}`;
  return new Promise<ExternalResourcePermissionResolution>((resolve, reject) => {
    pending.set(requestId, { resolve, reject, sessionId, input });
    const win = getMainWindow();
    if (!win || win.isDestroyed()) {
      pending.delete(requestId);
      log.warn('external_resource_permission.no_window', {
        sessionId,
        origin: input.origin,
        kind: input.kind,
      });
      resolve({ scope: 'deny' });
      return;
    }
    const payload: ExternalResourcePermissionPayload = { requestId, sessionId, ...input };
    win.webContents.send('external-resource-permission:request', payload);
  });
}

export function cancelPendingExternalResourcePermissionRequests(sessionId: string): void {
  for (const [id, entry] of pending) {
    if (entry.sessionId !== sessionId) continue;
    pending.delete(id);
    entry.resolve({ scope: 'deny' });
  }
}

function parseResolveInput(raw: unknown): {
  requestId: string;
  scope: ExternalResourcePermissionScope;
} {
  const requestId = readRequestId(raw, 'external-resource-permission:resolve');
  const obj = raw as Record<string, unknown>;
  const unsupported = Object.keys(obj).find((key) => key !== 'requestId' && key !== 'scope');
  if (unsupported !== undefined) {
    throw new CodesignError(
      `external-resource-permission:resolve contains unsupported field "${unsupported}"`,
      ERROR_CODES.IPC_BAD_INPUT,
    );
  }
  const scope = obj['scope'];
  if (scope !== 'once' && scope !== 'always' && scope !== 'deny') {
    throw new CodesignError(
      'external-resource-permission:resolve scope must be "once", "always", or "deny"',
      ERROR_CODES.IPC_BAD_INPUT,
    );
  }
  return { requestId, scope };
}

function readRequestId(raw: unknown, channel: string): string {
  if (!raw || typeof raw !== 'object') {
    throw new CodesignError(`${channel} expects an object payload`, ERROR_CODES.IPC_BAD_INPUT);
  }
  const obj = raw as Record<string, unknown>;
  const requestId = obj['requestId'];
  if (typeof requestId !== 'string' || requestId.trim().length === 0) {
    throw new CodesignError(`${channel} requires a non-empty requestId`, ERROR_CODES.IPC_BAD_INPUT);
  }
  return requestId;
}
