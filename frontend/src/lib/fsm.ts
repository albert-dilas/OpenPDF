export type AsyncResourceState<T, E = string> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'revalidating'; data: T }
  | { status: 'fetchingNextPage'; data: T; total?: number }
  | { status: 'optimistic'; data: T; previousData: T; pendingLabel?: string }
  | { status: 'empty' }
  | {
      status: 'ready';
      data: T;
      total?: number;
      hasMore?: boolean;
      nextOffset?: number | null;
    }
  | { status: 'paused'; data?: T; reason: 'offline' | 'user' }
  | { status: 'offline'; data?: T; error?: E }
  | { status: 'aborted'; data?: T }
  | { status: 'error'; error: E; data?: T };

export type MutationState<T = void, E = string> =
  | { status: 'idle' }
  | { status: 'pending'; label?: string }
  | { status: 'optimistic'; label?: string; data?: T }
  | { status: 'success'; data: T }
  | { status: 'aborted' }
  | { status: 'offline'; error?: E }
  | { status: 'error'; error: E };

export type StreamConnectionState =
  | 'idle'
  | 'connecting'
  | 'live'
  | 'reconnecting'
  | 'paused'
  | 'offline'
  | 'error';

export function getResourceData<T, E>(state: AsyncResourceState<T, E>): T | undefined {
  switch (state.status) {
    case 'revalidating':
    case 'fetchingNextPage':
    case 'optimistic':
    case 'ready':
      return state.data;
    case 'paused':
    case 'offline':
    case 'aborted':
    case 'error':
      return state.data;
    case 'idle':
    case 'loading':
    case 'empty':
      return undefined;
  }
}

export function isResourceBusy<T, E>(state: AsyncResourceState<T, E>): boolean {
  return (
    state.status === 'loading' ||
    state.status === 'revalidating' ||
    state.status === 'fetchingNextPage' ||
    state.status === 'optimistic'
  );
}

export function isResourceStale<T, E>(state: AsyncResourceState<T, E>): boolean {
  return state.status === 'revalidating' || state.status === 'fetchingNextPage';
}

export function hasMorePages<T, E>(state: AsyncResourceState<T, E>): boolean {
  return state.status === 'ready' && Boolean(state.hasMore);
}

export function getResourceNextOffset<T, E>(state: AsyncResourceState<T, E>): number | null {
  if (state.status === 'ready') {
    return typeof state.nextOffset === 'number' ? state.nextOffset : null;
  }
  return null;
}

export function getResourceTotal<T, E>(state: AsyncResourceState<T, E>): number | undefined {
  if (state.status === 'ready' || state.status === 'fetchingNextPage') {
    return state.total;
  }
  return undefined;
}

export function isMutationPending<T, E>(state?: MutationState<T, E>): boolean {
  return state?.status === 'pending' || state?.status === 'optimistic';
}
