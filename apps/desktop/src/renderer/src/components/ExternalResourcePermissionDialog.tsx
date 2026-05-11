import { Download, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
  ExternalResourcePermissionRequest,
  ExternalResourcePermissionScope,
} from '../../../preload/index';
import { LAYER_CLASS } from '../lib/layers';

export function ExternalResourcePermissionDialog() {
  const [pending, setPending] = useState<ExternalResourcePermissionRequest | null>(null);

  useEffect(() => {
    const off = window.codesign?.externalResourcePermission?.onRequest?.((req) => setPending(req));
    return () => {
      off?.();
    };
  }, []);

  if (!pending) return null;

  function decide(scope: ExternalResourcePermissionScope) {
    if (!pending) return;
    void window.codesign?.externalResourcePermission?.resolve?.(pending.requestId, scope);
    setPending(null);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="external-resource-permission-title"
      className={`fixed inset-0 ${LAYER_CLASS.blockingModal} flex items-center justify-center bg-[var(--color-overlay-scrim)]`}
    >
      <div className="w-[min(34rem,calc(100vw-2rem))] rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-[var(--space-6)] shadow-[var(--shadow-overlay)]">
        <header className="mb-[var(--space-4)] flex items-start gap-[var(--space-3)]">
          <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]">
            <Download className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2
              id="external-resource-permission-title"
              className="m-0 text-[var(--text-base)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]"
            >
              Download external design resource?
            </h2>
            <p className="m-0 mt-1 text-[var(--text-sm)] leading-[var(--leading-ui)] text-[var(--color-text-secondary)]">
              The agent wants to copy this web resource into the current workspace.
            </p>
          </div>
        </header>

        <dl className="mb-[var(--space-5)] grid grid-cols-[7rem_minmax(0,1fr)] gap-x-[var(--space-3)] gap-y-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--color-border-muted)] bg-[var(--color-surface)] p-[var(--space-4)] text-[var(--text-sm)]">
          <dt className="text-[var(--color-text-muted)]">Type</dt>
          <dd className="m-0 text-[var(--color-text-primary)]">{pending.kind}</dd>
          <dt className="text-[var(--color-text-muted)]">Source</dt>
          <dd className="m-0 min-w-0 break-all text-[var(--color-text-primary)]">
            {pending.origin}
          </dd>
          <dt className="text-[var(--color-text-muted)]">Save to</dt>
          <dd className="m-0 min-w-0 break-all font-[var(--font-mono)] text-[var(--color-text-primary)]">
            {pending.destinationPath}
          </dd>
          <dt className="text-[var(--color-text-muted)]">Usage</dt>
          <dd className="m-0 min-w-0 text-[var(--color-text-primary)]">{pending.usage}</dd>
          <dt className="text-[var(--color-text-muted)]">License</dt>
          <dd className="m-0 min-w-0 text-[var(--color-text-primary)]">
            {pending.licenseLabel ?? 'Not specified'}
          </dd>
        </dl>

        <div className="mb-[var(--space-5)] flex items-start gap-[var(--space-2)] rounded-[var(--radius-md)] bg-[var(--color-surface-raised)] p-[var(--space-3)] text-[var(--text-xs)] leading-[var(--leading-ui)] text-[var(--color-text-secondary)]">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>Always allow applies only to this domain and resource type for this design.</span>
        </div>

        <div className="flex justify-end gap-[var(--space-2)]">
          <button
            type="button"
            onClick={() => decide('deny')}
            className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-[var(--space-4)] py-[var(--space-2)] text-[var(--text-sm)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
          >
            Deny
          </button>
          <button
            type="button"
            onClick={() => decide('once')}
            className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-[var(--space-4)] py-[var(--space-2)] text-[var(--text-sm)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)]"
          >
            Download once
          </button>
          <button
            type="button"
            onClick={() => decide('always')}
            className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-[var(--space-4)] py-[var(--space-2)] text-[var(--text-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-on-accent)] hover:opacity-90"
          >
            Always allow domain
          </button>
        </div>
      </div>
    </div>
  );
}
