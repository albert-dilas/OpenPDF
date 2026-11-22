'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Inbox,
  Trash2,
  Download,
  Copy,
  Check,
  ArrowUpRight,
  FileText,
  Film,
  Music,
  Image as ImageIcon,
  Archive,
  Database,
  File as FileIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import FileDropZone, { DropZoneInteractionState } from '@/components/ui/FileDropZone';
import StateView from '@/components/ui/StateView';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { InlineSpinner, SkeletonAssetRow } from '@/components/ui/Loaders';
import { selectAssets, useWorkspaceStore } from '@/store/useWorkspaceStore';
import {
  AssetDomain,
  extractErrorMessage,
  formatBytes,
  SessionAssetRecord,
} from '@/lib/api';
import { resolveAssetSuggestedTools } from '@/lib/workspace-routing';
import { useI18n } from '@/i18n';

const DOMAIN_ICONS: Record<AssetDomain, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  video: Film,
  audio: Music,
  image: ImageIcon,
  archive: Archive,
  data: Database,
  other: FileIcon,
};

export default function WorkspacePage() {
  const router = useRouter();
  const { t, locale } = useI18n();

  const assetsState = useWorkspaceStore((s) => s.assetsState);
  const inspectState = useWorkspaceStore((s) => s.inspectState);
  const assets = useWorkspaceStore(selectAssets);
  const activeAssetId = useWorkspaceStore((s) => s.activeAssetId);
  const activeDomainFilter = useWorkspaceStore((s) => s.activeDomainFilter);
  const setActiveDomainFilter = useWorkspaceStore((s) => s.setActiveDomainFilter);
  const setActiveAssetId = useWorkspaceStore((s) => s.setActiveAssetId);
  const loadAssets = useWorkspaceStore((s) => s.loadAssets);
  const loadNextAssetsPage = useWorkspaceStore((s) => s.loadNextAssetsPage);
  const inspectAndAddFiles = useWorkspaceStore((s) => s.inspectAndAddFiles);
  const abortInspect = useWorkspaceStore((s) => s.abortInspect);
  const removeAsset = useWorkspaceStore((s) => s.removeAsset);
  const clearAssets = useWorkspaceStore((s) => s.clearAssets);
  const chainAssetToTool = useWorkspaceStore((s) => s.chainAssetToTool);
  const downloadAssetUrl = useWorkspaceStore((s) => s.downloadAssetUrl);

  const [copiedSha, setCopiedSha] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const selectedAsset: SessionAssetRecord | null = useMemo(() => {
    if (!assets.length) return null;
    if (activeAssetId) {
      const found = assets.find((a) => a.id === activeAssetId);
      if (found) return found;
    }
    return assets[0];
  }, [activeAssetId, assets]);

  const handleUpload = async (fileList: File[]) => {
    if (!fileList.length) return;
    try {
      const added = await inspectAndAddFiles(fileList);
      if (added.length > 0) {
        toast.success(
          locale === 'en'
            ? `Added ${added.length} file(s) to Live Tray`
            : `${added.length} archivo(s) inspeccionados en Bandeja Viva`
        );
      }
    } catch (err) {
      const msg = await extractErrorMessage(err, 'No se pudo inspeccionar el archivo.');
      toast.error(msg);
    }
  };

  const handleCopySha = async (sha: string) => {
    try {
      await navigator.clipboard.writeText(sha);
      setCopiedSha(sha);
      toast.success(t.common.copied);
      setTimeout(() => setCopiedSha(null), 1800);
    } catch {
      toast.error('Clipboard unavailable.');
    }
  };

  const domains: (AssetDomain | 'all')[] = [
    'all',
    'pdf',
    'video',
    'audio',
    'image',
    'archive',
    'data',
    'other',
  ];

  const dropInteractionState: DropZoneInteractionState =
    inspectState.status === 'pending'
      ? 'pending'
      : inspectState.status === 'offline'
      ? 'offline'
      : inspectState.status === 'error'
      ? 'error'
      : 'idle';

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border)]">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)]">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--fg)] tracking-tight">
              {t.workspace.title}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--fg-muted)] mt-0.5">
              {t.workspace.subtitle}
            </p>
          </div>
        </div>

        {assets.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmClearOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] hover:border-red-500/50 hover:text-red-500 text-xs font-medium text-[var(--fg)] transition-colors shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.workspace.clearAll}</span>
          </button>
        )}
      </div>

      {/* Compact FileDropZone + Domain Filter */}
      <div className="space-y-3">
        <FileDropZone
          variant="compact"
          interactionState={dropInteractionState}
          onFilesSelected={handleUpload}
          onAbort={abortInspect}
          title={t.home.dropzoneTitle}
          hint={t.home.dropzoneFormatsHint}
          buttonLabel={t.workspace.uploadMore}
          pendingLabel={t.home.dropzoneInspecting}
          abortLabel={t.common.abort}
          errorMessage={inspectState.status === 'error' ? inspectState.error : null}
          offlineMessage={t.brand.engineChipOffline}
        />

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {domains.map((dom) => {
            const active = activeDomainFilter === dom;
            return (
              <button
                key={dom}
                type="button"
                onClick={() => setActiveDomainFilter(dom)}
                className={`px-2.5 py-1 rounded-[var(--radius-control)] text-xs font-medium border whitespace-nowrap transition-colors ${
                  active
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--fg)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                {dom === 'all' ? t.workspace.filterAll : t.workspace.domains[dom]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main StateView Split View */}
      <StateView
        state={assetsState}
        isEmptyData={(items) => items.length === 0}
        skeleton={<SkeletonAssetRow count={4} />}
        emptyTitle={t.workspace.emptyTitle}
        emptySubtitle={t.workspace.emptySubtitle}
        offlineTitle={t.brand.engineChipOffline}
        revalidatingLabel={t.common.revalidating}
        retryLabel={t.common.retry}
        loadMoreLabel={t.common.loadMore}
        loadingMoreLabel={t.common.loadingMore}
        onRetry={() => loadAssets()}
        onLoadMore={() => loadNextAssetsPage()}
      >
        {(items) => (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-5 space-y-2.5">
              {items.map((asset) => {
                const Icon = DOMAIN_ICONS[asset.domain] || FileIcon;
                const isSelected = selectedAsset?.id === asset.id;
                const isRowPending =
                  assetsState.status === 'optimistic' &&
                  assetsState.pendingLabel === asset.id;
                return (
                  <div
                    key={asset.id}
                    onClick={() => setActiveAssetId(asset.id)}
                    className={`rounded-[var(--radius-card)] border p-3.5 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isRowPending ? 'opacity-55 pointer-events-none' : ''
                    } ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--surface)] ring-1 ring-[var(--accent)]'
                        : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--fg)] truncate">
                          {asset.filename}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--fg-muted)] mt-0.5">
                          <span>{t.workspace.domains[asset.domain] ?? asset.domain}</span>
                          <span>·</span>
                          <span>{formatBytes(asset.size_bytes)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isRowPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAsset(asset.id);
                      }}
                      aria-label={t.workspace.deleteAsset}
                      className="p-1.5 rounded-[var(--radius-control)] text-[var(--fg-muted)] hover:text-red-500 hover:bg-[var(--surface-muted)]"
                    >
                      {isRowPending ? (
                        <InlineSpinner size="xs" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {selectedAsset && (
              <div className="lg:col-span-7 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[var(--border)]">
                  <div className="min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono uppercase border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--fg-muted)] mb-1.5">
                      {selectedAsset.mime_type}
                    </span>
                    <h2 className="text-lg font-bold text-[var(--fg)] break-all">
                      {selectedAsset.filename}
                    </h2>
                    <p className="text-xs font-mono text-[var(--fg-muted)] mt-0.5">
                      {formatBytes(selectedAsset.size_bytes)} · ID {selectedAsset.id.slice(0, 8)}
                    </p>
                  </div>

                  <a
                    href={downloadAssetUrl(selectedAsset.id)}
                    download={selectedAsset.filename}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--fg)]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t.workspace.downloadAsset}
                  </a>
                </div>

                {/* Primary 1-Click Recommended Tools */}
                <div className="space-y-2.5">
                  <span className="block text-xs font-semibold text-[var(--fg)]">
                    {t.workspace.suggestedToolsLabel}
                  </span>

                  {(() => {
                    const activeTargets = resolveAssetSuggestedTools(selectedAsset, {
                      activeOnly: true,
                      limit: 8,
                    });
                    if (activeTargets.length === 0) {
                      return (
                        <p className="text-xs text-[var(--fg-muted)] p-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)]">
                          {t.workspace.noSuggestedActive}
                        </p>
                      );
                    }
                    return (
                      <div className="flex flex-wrap gap-2">
                        {activeTargets.map((toolItem) => (
                          <button
                            key={toolItem.id}
                            type="button"
                            onClick={() =>
                              chainAssetToTool(selectedAsset, toolItem.href, (p) =>
                                router.push(p)
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--bg)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] text-xs font-semibold text-[var(--fg)] transition-colors"
                          >
                            <span>{t.tools[toolItem.id]?.name ?? toolItem.id}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Collapsible Technical Details (SHA-256 & Raw Metadata) for Engineers/IT */}
                <details className="group rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] p-3.5">
                  <summary className="cursor-pointer text-xs font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] select-none flex items-center justify-between">
                    <span>
                      {locale === 'en'
                        ? 'Technical details & SHA-256 checksum'
                        : 'Ver detalles técnicos y huella SHA-256'}
                    </span>
                    <span className="text-[10px] font-mono uppercase">SHA-256 · JSON</span>
                  </summary>

                  <div className="pt-3.5 mt-3 border-t border-[var(--border)] space-y-3">
                    {selectedAsset.sha256 && (
                      <div className="space-y-1.5">
                        <span className="block text-[10px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
                          {t.workspace.sha256Label}
                        </span>
                        <div className="flex items-center gap-2 p-2.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)]">
                          <code className="text-[11px] font-mono text-[var(--fg)] truncate flex-1">
                            {selectedAsset.sha256}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopySha(selectedAsset.sha256 || '')}
                            className="p-1 rounded text-[var(--fg-muted)] hover:text-[var(--fg)]"
                          >
                            {copiedSha === selectedAsset.sha256 ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
                        {t.workspace.metadataTitle}
                      </span>
                      <pre className="p-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[11px] font-mono text-[var(--fg)] overflow-x-auto max-h-56 scrollbar-thin">
                        {JSON.stringify(selectedAsset.metadata || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                </details>
              </div>
            )}
          </div>
        )}
      </StateView>

      <ConfirmDialog
        open={confirmClearOpen}
        title={t.common.confirmTitle}
        message={t.workspace.confirmClearAll}
        confirmLabel={t.workspace.clearAll}
        cancelLabel={t.common.cancel}
        destructive
        onConfirm={() => {
          setConfirmClearOpen(false);
          clearAssets();
        }}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </div>
  );
}
