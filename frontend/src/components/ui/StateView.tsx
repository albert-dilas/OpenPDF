'use client';

import React from 'react';
import {
  AlertCircle,
  PauseCircle,
  RefreshCw,
  WifiOff,
  Inbox,
} from 'lucide-react';
import {
  AsyncButton,
  InlineSpinner,
  PulseDots,
  SkeletonCard,
} from '@/components/ui/Loaders';
import {
  AsyncResourceState,
  getResourceData,
  hasMorePages,
} from '@/lib/fsm';

interface StateViewProps<T> {
  state: AsyncResourceState<T, string>;
  children: (data: T) => React.ReactNode;
  isEmptyData?: (data: T) => boolean;
  skeleton?: React.ReactNode;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyAction?: React.ReactNode;
  offlineTitle?: string;
  offlineSubtitle?: string;
  pausedTitle?: string;
  pausedSubtitle?: string;
  revalidatingLabel?: string;
  retryLabel?: string;
  resumeLabel?: string;
  loadMoreLabel?: string;
  loadingMoreLabel?: string;
  onRetry?: () => void;
  onResume?: () => void;
  onLoadMore?: () => void;
}

export default function StateView<T>({
  state,
  children,
  isEmptyData,
  skeleton,
  emptyTitle = 'Nothing here yet',
  emptySubtitle = '',
  emptyAction,
  offlineTitle = 'Local engine offline',
  offlineSubtitle = 'Reconnect or start the local Tornio backend.',
  pausedTitle = 'Updates paused',
  pausedSubtitle = 'Live updates are currently paused.',
  revalidatingLabel = 'Syncing...',
  retryLabel = 'Retry',
  resumeLabel = 'Resume',
  loadMoreLabel = 'Load more',
  loadingMoreLabel = 'Loading more...',
  onRetry,
  onResume,
  onLoadMore,
}: StateViewProps<T>) {
  const data = getResourceData(state);

  if (state.status === 'idle' || state.status === 'loading') {
    if (skeleton) return <>{skeleton}</>;
    return (
      <div className="space-y-2.5 py-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const dataIsEmpty = data !== undefined && isEmptyData ? isEmptyData(data) : false;

  if (state.status === 'empty' || (data !== undefined && dataIsEmpty && state.status === 'ready')) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] px-5 py-10 text-center space-y-2.5">
        <div className="w-9 h-9 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-muted)] flex items-center justify-center text-[var(--fg-muted)] mx-auto">
          <Inbox className="w-4 h-4" />
        </div>
        <p className="text-sm font-medium text-[var(--fg)]">{emptyTitle}</p>
        {emptySubtitle && (
          <p className="text-xs text-[var(--fg-muted)] max-w-sm mx-auto leading-relaxed">
            {emptySubtitle}
          </p>
        )}
        {emptyAction && <div className="pt-2">{emptyAction}</div>}
      </div>
    );
  }

  if (data === undefined) {
    if (state.status === 'offline') {
      return (
        <div className="rounded-[var(--radius-card)] border border-amber-500/30 bg-amber-500/10 p-5 text-center space-y-2.5">
          <WifiOff className="w-5 h-5 text-amber-500 mx-auto" />
          <p className="text-xs font-semibold text-[var(--fg)]">{offlineTitle}</p>
          <p className="text-[11px] text-[var(--fg-muted)]">{state.error || offlineSubtitle}</p>
          {onRetry && (
            <AsyncButton
              onClick={onRetry}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--fg)]"
            >
              {retryLabel}
            </AsyncButton>
          )}
        </div>
      );
    }

    if (state.status === 'paused') {
      return (
        <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 text-center space-y-2.5">
          <PauseCircle className="w-5 h-5 text-[var(--fg-muted)] mx-auto" />
          <p className="text-xs font-semibold text-[var(--fg)]">{pausedTitle}</p>
          <p className="text-[11px] text-[var(--fg-muted)]">{pausedSubtitle}</p>
          {onResume && (
            <AsyncButton
              onClick={onResume}
              className="px-3 py-1.5 rounded-[var(--radius-control)] text-xs font-semibold"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
            >
              {resumeLabel}
            </AsyncButton>
          )}
        </div>
      );
    }

    if (state.status === 'aborted') {
      return (
        <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 text-center space-y-2.5">
          <p className="text-xs text-[var(--fg-muted)]">{emptyTitle}</p>
          {onRetry && (
            <AsyncButton
              onClick={onRetry}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] text-xs font-medium text-[var(--fg)]"
            >
              {retryLabel}
            </AsyncButton>
          )}
        </div>
      );
    }

    if (state.status === 'error') {
      return (
        <div className="rounded-[var(--radius-card)] border border-red-500/30 bg-red-500/10 p-5 text-center space-y-2.5">
          <AlertCircle className="w-5 h-5 text-red-500 mx-auto" />
          <p className="text-xs font-semibold text-red-600 dark:text-red-300">{state.error}</p>
          {onRetry && (
            <AsyncButton
              onClick={onRetry}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--fg)]"
            >
              {retryLabel}
            </AsyncButton>
          )}
        </div>
      );
    }

    return null;
  }

  return (
    <div className="space-y-3">
      {state.status === 'revalidating' && (
        <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--fg-muted)]">
          <PulseDots size="sm" />
          <span>{revalidatingLabel}</span>
        </div>
      )}

      {state.status === 'offline' && (
        <div className="rounded-[var(--radius-control)] border border-amber-500/30 bg-amber-500/10 px-3 py-2 flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span>{offlineTitle}</span>
          </span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-[11px] font-semibold underline text-[var(--fg)]"
            >
              {retryLabel}
            </button>
          )}
        </div>
      )}

      {state.status === 'paused' && (
        <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-[var(--fg-muted)]">
            <PauseCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{pausedTitle}</span>
          </span>
          {onResume && (
            <button
              type="button"
              onClick={onResume}
              className="text-[11px] font-semibold underline text-[var(--fg)]"
            >
              {resumeLabel}
            </button>
          )}
        </div>
      )}

      {state.status === 'error' && (
        <div className="rounded-[var(--radius-control)] border border-red-500/30 bg-red-500/10 px-3 py-2 flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-300">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{state.error}</span>
          </span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-[11px] font-semibold underline text-[var(--fg)]"
            >
              {retryLabel}
            </button>
          )}
        </div>
      )}

      {!dataIsEmpty ? (
        children(data)
      ) : (
        <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-center space-y-2">
          <p className="text-sm font-medium text-[var(--fg)]">{emptyTitle}</p>
          {emptySubtitle && <p className="text-xs text-[var(--fg-muted)]">{emptySubtitle}</p>}
          {emptyAction}
        </div>
      )}

      {state.status === 'fetchingNextPage' && (
        <div className="py-2 flex items-center justify-center gap-2 text-xs text-[var(--fg-muted)]">
          <InlineSpinner size="sm" />
          <span>{loadingMoreLabel}</span>
        </div>
      )}

      {hasMorePages(state) && onLoadMore && (
        <div className="pt-1 flex justify-center">
          <AsyncButton
            pending={state.status === 'fetchingNextPage'}
            pendingLabel={loadingMoreLabel}
            onClick={onLoadMore}
            className="px-3.5 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--fg)]"
          >
            {loadMoreLabel}
          </AsyncButton>
        </div>
      )}
    </div>
  );
}
