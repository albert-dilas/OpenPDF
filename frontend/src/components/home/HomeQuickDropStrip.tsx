'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, FileCheck2 } from 'lucide-react';
import FileDropZone, { DropZoneInteractionState } from '@/components/ui/FileDropZone';
import { formatBytes, SessionAssetRecord } from '@/lib/api';
import { formatAssetTelemetry, resolveAssetSuggestedTools } from '@/lib/workspace-routing';
import { MutationState } from '@/lib/fsm';
import { useI18n } from '@/i18n';

interface HomeQuickDropStripProps {
  inspectState: MutationState<SessionAssetRecord[]>;
  latestAsset: SessionAssetRecord | null;
  totalAssetsCount: number;
  onFilesSelected: (files: File[]) => void;
  onAbort: () => void;
  onChainToTool: (asset: SessionAssetRecord, href: string) => void;
}

export default function HomeQuickDropStrip({
  inspectState,
  latestAsset,
  totalAssetsCount,
  onFilesSelected,
  onAbort,
  onChainToTool,
}: HomeQuickDropStripProps) {
  const { t } = useI18n();

  const interactionState: DropZoneInteractionState =
    inspectState.status === 'pending'
      ? 'pending'
      : inspectState.status === 'offline'
      ? 'offline'
      : inspectState.status === 'error'
      ? 'error'
      : 'idle';

  const quickActions = latestAsset
    ? resolveAssetSuggestedTools(latestAsset, { activeOnly: true, limit: 4 })
    : [];
  const quickMeta = latestAsset ? formatAssetTelemetry(latestAsset.metadata, 3) : [];

  return (
    <section className="space-y-2.5">
      <FileDropZone
        variant="bar"
        interactionState={interactionState}
        onFilesSelected={onFilesSelected}
        onAbort={onAbort}
        title={t.home.dropzoneTitle}
        subtitle={t.home.dropzoneSubtitle}
        buttonLabel={t.home.dropzoneButton}
        pendingLabel={t.home.dropzoneInspecting}
        abortLabel={t.common.abort}
        errorMessage={inspectState.status === 'error' ? inspectState.error : null}
        offlineMessage={t.brand.engineChipOffline}
      />

      {latestAsset && (
        <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileCheck2 className="w-4 h-4 text-[var(--fg)] shrink-0" />
            <span className="text-xs font-semibold text-[var(--fg)] truncate max-w-[220px]">
              {latestAsset.filename}
            </span>
            <span className="text-[11px] font-mono text-[var(--fg-muted)] shrink-0">
              {formatBytes(latestAsset.size_bytes)}
            </span>
            {quickMeta.map((entry) => (
              <span
                key={entry.key}
                className="hidden md:inline-flex px-2 py-0.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[10px] font-mono text-[var(--fg-muted)]"
              >
                {entry.key}: {entry.value}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {quickActions.map((toolItem) => (
              <button
                key={toolItem.id}
                type="button"
                onClick={() => onChainToTool(latestAsset, toolItem.href)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)] text-xs font-medium text-[var(--fg)] transition-colors"
              >
                <span>{t.tools[toolItem.id]?.name ?? toolItem.id}</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            ))}
            <Link
              href="/workspace"
              className="px-2 py-1 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)]"
            >
              {t.home.viewAllTray} ({totalAssetsCount})
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
