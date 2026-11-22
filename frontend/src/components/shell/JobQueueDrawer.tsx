'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  Ban,
  Trash2,
  FolderInput,
  Film,
  Activity,
  Pause,
  Play,
} from 'lucide-react';
import StateView from '@/components/ui/StateView';
import {
  InlineSpinner,
  ProgressBar,
  PulseDots,
  SkeletonJobCard,
} from '@/components/ui/Loaders';
import { selectJobs, useJobsStore } from '@/store/useJobsStore';
import { selectAssets, useWorkspaceStore } from '@/store/useWorkspaceStore';
import { formatBytes, formatDuration, JobRecord } from '@/lib/api';
import { useI18n } from '@/i18n';

interface JobQueueDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function JobQueueDrawer({ open, onClose }: JobQueueDrawerProps) {
  const router = useRouter();
  const { t } = useI18n();

  const streamState = useJobsStore((s) => s.streamState);
  const jobsState = useJobsStore((s) => s.jobsState);
  const jobs = useJobsStore(selectJobs);
  const loadJobs = useJobsStore((s) => s.loadJobs);
  const loadNextJobsPage = useJobsStore((s) => s.loadNextJobsPage);
  const pauseStream = useJobsStore((s) => s.pauseStream);
  const resumeStream = useJobsStore((s) => s.resumeStream);
  const cancelJob = useJobsStore((s) => s.cancelJob);
  const deleteJob = useJobsStore((s) => s.deleteJob);
  const downloadUrl = useJobsStore((s) => s.downloadUrl);

  const assets = useWorkspaceStore(selectAssets);
  const chainAssetToTool = useWorkspaceStore((s) => s.chainAssetToTool);
  const loadAssets = useWorkspaceStore((s) => s.loadAssets);

  if (!open) return null;

  const isPaused = streamState === 'paused';
  const isLive = streamState === 'live';
  const isConnecting = streamState === 'connecting' || streamState === 'reconnecting';
  const pendingRowId =
    jobsState.status === 'optimistic' ? jobsState.pendingLabel : undefined;

  const handleChainToTool = async (job: JobRecord, targetHref: string) => {
    if (!job.output_asset_id) return;
    let asset = assets.find((a) => a.id === job.output_asset_id);
    if (!asset) {
      await loadAssets();
      asset = selectAssets(useWorkspaceStore.getState()).find(
        (a) => a.id === job.output_asset_id
      );
    }
    if (asset) {
      chainAssetToTool(asset, targetHref, (path) => router.push(path));
    } else {
      router.push('/workspace');
    }
  };

  return (
    <aside
      aria-label={t.jobs.drawerTitle}
      className="fixed inset-y-0 right-0 z-50 w-full max-w-sm lg:static lg:z-auto lg:w-[360px] border-l border-[var(--border)] bg-[var(--surface)] flex flex-col shrink-0 h-full"
    >
      {/* Drawer Header */}
      <div className="h-14 px-4 border-b border-[var(--border)] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="w-4 h-4 text-[var(--fg)] shrink-0" />
          <h2 className="text-sm font-semibold text-[var(--fg)] truncate">
            {t.jobs.drawerTitle}
          </h2>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap ${
              isLive
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--fg-muted)]'
            }`}
          >
            {isConnecting ? (
              <PulseDots size="sm" />
            ) : (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLive ? 'bg-emerald-500' : isPaused ? 'bg-zinc-400' : 'bg-amber-500'
                }`}
              />
            )}
            <span>
              {isLive
                ? t.jobs.sseLive
                : isConnecting
                ? t.common.revalidating
                : isPaused
                ? t.jobs.ssePaused
                : t.jobs.sseOffline}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => (isPaused ? resumeStream() : pauseStream())}
            title={isPaused ? t.jobs.resumeStream : t.jobs.pauseStream}
            aria-label={isPaused ? t.jobs.resumeStream : t.jobs.pauseStream}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] text-[11px] font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            <span>{isPaused ? t.jobs.resumeStream : t.jobs.pauseStream}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="p-1.5 rounded-[var(--radius-control)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-muted)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Job Queue FSM Body */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        <StateView
          state={jobsState}
          isEmptyData={(items) => items.length === 0}
          skeleton={<SkeletonJobCard count={3} />}
          emptyTitle={t.jobs.emptyTitle}
          emptySubtitle={t.jobs.emptySubtitle}
          offlineTitle={t.jobs.sseOffline}
          offlineSubtitle={t.jobs.emptySubtitle}
          pausedTitle={t.jobs.ssePaused}
          pausedSubtitle={t.jobs.emptySubtitle}
          revalidatingLabel={t.common.revalidating}
          retryLabel={t.common.retry}
          resumeLabel={t.jobs.resumeStream}
          loadMoreLabel={t.common.loadMore}
          loadingMoreLabel={t.common.loadingMore}
          onRetry={() => loadJobs()}
          onResume={() => resumeStream()}
          onLoadMore={() => loadNextJobsPage()}
        >
          {() => (
            <div className="space-y-2.5">
              {jobs.map((job) => {
                const isRunning = job.status === 'running' || job.status === 'queued';
                const isDone = job.status === 'completed';
                const isFailed = job.status === 'failed';
                const isCancelled = job.status === 'cancelled';
                const pct = Math.max(0, Math.min(100, Math.round(job.progress || 0)));
                const isRowPending = pendingRowId === job.id;

                return (
                  <div
                    key={job.id}
                    className={`rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg)] p-3.5 space-y-2.5 transition-opacity ${
                      isRowPending ? 'opacity-55 pointer-events-none' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
                          <span>{job.studio}</span>
                          <span>/</span>
                          <span className="truncate">{job.tool_id}</span>
                        </div>
                        <p className="text-xs font-semibold text-[var(--fg)] truncate mt-0.5">
                          {job.title}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 border ${
                          isDone
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : isFailed
                            ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                            : isCancelled
                            ? 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--fg-muted)]'
                            : 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--fg)]'
                        }`}
                      >
                        {(isRunning || isRowPending) && <InlineSpinner size="xs" />}
                        {!isRowPending && isDone && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {!isRowPending && isFailed && <AlertCircle className="w-2.5 h-2.5" />}
                        {!isRowPending && isCancelled && <Ban className="w-2.5 h-2.5" />}
                        <span>{t.jobs.statuses[job.status]}</span>
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-[var(--fg-muted)]">
                        <span className="truncate">
                          {job.stage || t.jobs.statuses[job.status]}
                        </span>
                        <span className="font-mono font-semibold text-[var(--fg)]">
                          {pct}%
                        </span>
                      </div>
                      <ProgressBar
                        value={isDone ? 100 : pct}
                        indeterminate={job.status === 'queued' && pct === 0}
                        tone={isFailed ? 'danger' : isDone ? 'emerald' : 'accent'}
                      />
                      {job.detail && (
                        <p className="text-[11px] font-mono text-[var(--fg-muted)] truncate">
                          {job.detail}
                        </p>
                      )}
                    </div>

                    {job.error && (
                      <p className="text-[11px] text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-control)] px-2.5 py-1.5">
                        {job.error}
                      </p>
                    )}

                    {((typeof job.elapsed_ms === 'number' && job.elapsed_ms > 0) ||
                      (typeof job.output_bytes === 'number' && job.output_bytes > 0)) && (
                      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--fg-muted)] pt-1 border-t border-[var(--border)]">
                        <span>
                          {typeof job.elapsed_ms === 'number' && job.elapsed_ms > 0
                            ? `${t.jobs.elapsed}: ${formatDuration(job.elapsed_ms / 1000)}`
                            : ''}
                        </span>
                        <span>
                          {typeof job.output_bytes === 'number' && job.output_bytes > 0
                            ? `${t.jobs.outputSize}: ${formatBytes(job.output_bytes)}`
                            : ''}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {isRunning && job.can_cancel && (
                        <button
                          type="button"
                          onClick={() => cancelJob(job.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[11px] font-medium text-[var(--fg)] transition-colors"
                        >
                          <Ban className="w-3 h-3" />
                          {t.jobs.cancelJob}
                        </button>
                      )}

                      {isDone && (
                        <>
                          <a
                            href={downloadUrl(job.id)}
                            download={job.output_filename || undefined}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-control)] text-[11px] font-semibold transition-opacity hover:opacity-90"
                            style={{
                              backgroundColor: 'var(--accent)',
                              color: 'var(--accent-fg)',
                            }}
                          >
                            <Download className="w-3 h-3" />
                            {t.common.download}
                          </a>

                          {job.output_asset_id && (
                            <button
                              type="button"
                              onClick={() => router.push('/workspace')}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[11px] font-medium text-[var(--fg)] transition-colors"
                            >
                              <FolderInput className="w-3 h-3" />
                              {t.common.sendToTray}
                            </button>
                          )}

                          {job.output_asset_id && job.studio === 'video' && (
                            <button
                              type="button"
                              onClick={() => handleChainToTool(job, '/video-studio')}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[11px] font-medium text-[var(--fg)] transition-colors"
                            >
                              <Film className="w-3 h-3" />
                              {t.jobs.chainToVideo}
                            </button>
                          )}
                        </>
                      )}

                      {!isRunning && (
                        <button
                          type="button"
                          disabled={isRowPending}
                          onClick={() => deleteJob(job.id)}
                          title={t.jobs.removeJob}
                          aria-label={t.jobs.removeJob}
                          className="ml-auto p-1 rounded-[var(--radius-control)] text-[var(--fg-muted)] hover:text-red-500 hover:bg-[var(--surface-muted)] transition-colors"
                        >
                          {isRowPending ? (
                            <InlineSpinner size="xs" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </StateView>
      </div>
    </aside>
  );
}
