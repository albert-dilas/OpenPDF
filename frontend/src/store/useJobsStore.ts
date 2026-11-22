import { create } from 'zustand';
import {
  API_BASE_URL,
  cancelJobRequest,
  deleteJobRequest,
  extractErrorMessage,
  fetchJobs,
  getJobDownloadUrl,
  isAbortError,
  isOfflineError,
  JobRecord,
} from '@/lib/api';
import {
  AsyncResourceState,
  getResourceData,
  getResourceNextOffset,
  hasMorePages,
  StreamConnectionState,
} from '@/lib/fsm';

const JOBS_PAGE_LIMIT = 15;
const EMPTY_JOBS: JobRecord[] = [];

let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
let listAbortController: AbortController | null = null;
let networkListenersAttached = false;
let onAssetProducedCallback: ((assetId: string) => void) | null = null;

export function registerJobAssetListener(cb: ((assetId: string) => void) | null) {
  onAssetProducedCallback = cb;
}

function sortJobs(list: JobRecord[]): JobRecord[] {
  return [...list].sort((a, b) => {
    const ta = Date.parse(a.created_at || '') || 0;
    const tb = Date.parse(b.created_at || '') || 0;
    return tb - ta;
  });
}

function mergeJobs(base: JobRecord[], incoming: JobRecord[]): JobRecord[] {
  const map = new Map<string, JobRecord>();
  for (const j of base) map.set(j.id, j);
  for (const j of incoming) map.set(j.id, j);
  return sortJobs(Array.from(map.values()));
}

function upsertSingleJob(jobs: JobRecord[], incoming: JobRecord): JobRecord[] {
  return mergeJobs(jobs, [incoming]);
}

interface JobsState {
  streamState: StreamConnectionState;
  jobsState: AsyncResourceState<JobRecord[]>;
  activeCount: () => number;
  connectStream: () => void;
  disconnectStream: () => void;
  pauseStream: () => void;
  resumeStream: () => void;
  loadJobs: (opts?: { silent?: boolean }) => Promise<void>;
  loadNextJobsPage: () => Promise<void>;
  upsertJob: (job: JobRecord) => void;
  cancelJob: (id: string) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  downloadUrl: (id: string) => string;
}

export const selectJobs = (s: JobsState): JobRecord[] =>
  getResourceData(s.jobsState) ?? EMPTY_JOBS;

export const useJobsStore = create<JobsState>((set, get) => ({
  streamState: 'idle',
  jobsState: { status: 'idle' },

  activeCount: () => {
    const items = getResourceData(get().jobsState) ?? EMPTY_JOBS;
    return items.filter((j) => j.status === 'queued' || j.status === 'running').length;
  },

  loadJobs: async (opts) => {
    listAbortController?.abort();
    const controller = new AbortController();
    listAbortController = controller;

    const existing = getResourceData(get().jobsState);
    if (!opts?.silent) {
      set({
        jobsState: existing
          ? { status: 'revalidating', data: existing }
          : { status: 'loading' },
      });
    }

    try {
      const page = await fetchJobs({
        limit: JOBS_PAGE_LIMIT,
        offset: 0,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (page.items.length === 0) {
        set({ jobsState: { status: 'empty' } });
      } else {
        set({
          jobsState: {
            status: 'ready',
            data: sortJobs(page.items),
            total: page.total,
            hasMore: page.hasMore,
            nextOffset: page.nextOffset,
          },
        });
      }
    } catch (err) {
      if (isAbortError(err)) return;
      const msg = await extractErrorMessage(err, 'Unable to load job queue.');
      set({
        jobsState: isOfflineError(err)
          ? { status: 'offline', data: existing, error: msg }
          : { status: 'error', error: msg, data: existing },
      });
    } finally {
      if (listAbortController === controller) {
        listAbortController = null;
      }
    }
  },

  loadNextJobsPage: async () => {
    const currentState = get().jobsState;
    if (!hasMorePages(currentState)) return;
    const currentItems = getResourceData(currentState) ?? [];
    const nextOffset = getResourceNextOffset(currentState);
    if (nextOffset === null) return;

    set({
      jobsState: {
        status: 'fetchingNextPage',
        data: currentItems,
        total: currentState.status === 'ready' ? currentState.total : undefined,
      },
    });

    try {
      const page = await fetchJobs({ limit: JOBS_PAGE_LIMIT, offset: nextOffset });
      const merged = mergeJobs(currentItems, page.items);
      set({
        jobsState: {
          status: 'ready',
          data: merged,
          total: page.total,
          hasMore: page.hasMore,
          nextOffset: page.nextOffset,
        },
      });
    } catch (err) {
      const msg = await extractErrorMessage(err, 'Unable to load next jobs page.');
      set({
        jobsState: isOfflineError(err)
          ? { status: 'offline', data: currentItems, error: msg }
          : { status: 'error', error: msg, data: currentItems },
      });
    }
  },

  upsertJob: (job: JobRecord) => {
    set((state) => {
      const existing = getResourceData(state.jobsState) ?? [];
      const merged = upsertSingleJob(existing, job);
      const prevTotal =
        state.jobsState.status === 'ready' ? state.jobsState.total ?? existing.length : existing.length;
      return {
        jobsState: {
          status: 'ready',
          data: merged,
          total: Math.max(merged.length, prevTotal),
          hasMore: state.jobsState.status === 'ready' ? state.jobsState.hasMore : false,
          nextOffset: state.jobsState.status === 'ready' ? state.jobsState.nextOffset : null,
        },
      };
    });
  },

  pauseStream: () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    const existing = getResourceData(get().jobsState);
    set({
      streamState: 'paused',
      jobsState: {
        status: 'paused',
        data: existing,
        reason: 'user',
      },
    });
  },

  resumeStream: () => {
    set({ streamState: 'connecting' });
    get().loadJobs().catch(() => {});
    get().connectStream();
  },

  connectStream: () => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
    if (get().streamState === 'paused') return;

    if (!networkListenersAttached) {
      networkListenersAttached = true;
      window.addEventListener('offline', () => {
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        const existing = getResourceData(get().jobsState);
        set({
          streamState: 'offline',
          jobsState: { status: 'offline', data: existing },
        });
      });

      window.addEventListener('online', () => {
        if (get().streamState !== 'paused') {
          reconnectAttempt = 0;
          get().resumeStream();
        }
      });
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      const existing = getResourceData(get().jobsState);
      set({
        streamState: 'offline',
        jobsState: { status: 'offline', data: existing },
      });
      return;
    }

    if (eventSource && eventSource.readyState !== EventSource.CLOSED) return;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    set({
      streamState: reconnectAttempt > 0 ? 'reconnecting' : 'connecting',
    });

    if (get().jobsState.status === 'idle') {
      get().loadJobs().catch(() => {});
    }

    try {
      const es = new EventSource(`${API_BASE_URL}/jobs/stream`);
      eventSource = es;

      es.onopen = () => {
        reconnectAttempt = 0;
        set({ streamState: 'live' });
      };

      es.addEventListener('snapshot', (ev) => {
        if (get().streamState === 'paused') return;
        try {
          const parsed = JSON.parse((ev as MessageEvent).data);
          const list: JobRecord[] = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed?.jobs)
            ? parsed.jobs
            : [];
          const sorted = sortJobs(list);
          const sliced = sorted.slice(0, JOBS_PAGE_LIMIT);
          set({
            streamState: 'live',
            jobsState:
              sorted.length === 0
                ? { status: 'empty' }
                : {
                    status: 'ready',
                    data: sliced,
                    total: sorted.length,
                    hasMore: sorted.length > sliced.length,
                    nextOffset: sorted.length > sliced.length ? sliced.length : null,
                  },
          });
        } catch {
          // Ignore malformed snapshot frame
        }
      });

      es.addEventListener('job_updated', (ev) => {
        if (get().streamState === 'paused') return;
        try {
          const parsed = JSON.parse((ev as MessageEvent).data);
          const job: JobRecord | null =
            parsed && typeof parsed === 'object'
              ? parsed.job ?? (typeof parsed.id === 'string' ? parsed : null)
              : null;
          if (!job) return;

          const existing = getResourceData(get().jobsState) ?? [];
          const prev = existing.find((j) => j.id === job.id);

          set((state) => {
            const cur = getResourceData(state.jobsState) ?? [];
            const merged = upsertSingleJob(cur, job);
            const prevTotal =
              state.jobsState.status === 'ready' ? state.jobsState.total ?? cur.length : cur.length;
            return {
              streamState: 'live',
              jobsState: {
                status: 'ready',
                data: merged,
                total: Math.max(merged.length, prevTotal),
                hasMore: state.jobsState.status === 'ready' ? state.jobsState.hasMore : false,
                nextOffset: state.jobsState.status === 'ready' ? state.jobsState.nextOffset : null,
              },
            };
          });

          if (
            job.status === 'completed' &&
            job.output_asset_id &&
            prev?.output_asset_id !== job.output_asset_id
          ) {
            onAssetProducedCallback?.(job.output_asset_id);
          }
        } catch {
          // Ignore malformed event frame
        }
      });

      es.addEventListener('ping', () => {
        if (get().streamState !== 'paused') {
          set({ streamState: 'live' });
        }
      });

      es.onerror = () => {
        es.close();
        if (eventSource === es) {
          eventSource = null;
        }
        if (get().streamState === 'paused') return;

        const offlineNow =
          typeof navigator !== 'undefined' && navigator.onLine === false;
        const existing = getResourceData(get().jobsState);

        set({
          streamState: offlineNow ? 'offline' : 'reconnecting',
          jobsState: offlineNow
            ? { status: 'offline', data: existing }
            : existing
            ? { status: 'revalidating', data: existing }
            : { status: 'offline' },
        });

        const delayMs = Math.min(20000, 2500 * Math.pow(1.6, reconnectAttempt));
        reconnectAttempt += 1;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          if (get().streamState !== 'paused') {
            get().connectStream();
          }
        }, delayMs);
      };
    } catch {
      const existing = getResourceData(get().jobsState);
      set({
        streamState: 'error',
        jobsState: { status: 'error', error: 'SSE stream error', data: existing },
      });
    }
  },

  disconnectStream: () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    set({ streamState: 'idle' });
  },

  cancelJob: async (id: string) => {
    const prevState = get().jobsState;
    const previousData = getResourceData(prevState) ?? [];
    const optimisticData = previousData.map((j) =>
      j.id === id ? { ...j, status: 'cancelled' as const, can_cancel: false } : j
    );

    set({
      jobsState: {
        status: 'optimistic',
        data: optimisticData,
        previousData,
        pendingLabel: id,
      },
    });

    try {
      const updated = await cancelJobRequest(id);
      const nextData = upsertSingleJob(previousData, updated);
      set({
        jobsState: {
          status: 'ready',
          data: nextData,
          total: prevState.status === 'ready' ? prevState.total : nextData.length,
          hasMore: prevState.status === 'ready' ? prevState.hasMore : false,
          nextOffset: prevState.status === 'ready' ? prevState.nextOffset : null,
        },
      });
    } catch (err) {
      const msg = await extractErrorMessage(err, 'Unable to cancel job.');
      set({
        jobsState: { status: 'error', error: msg, data: previousData },
      });
    }
  },

  deleteJob: async (id: string) => {
    const prevState = get().jobsState;
    const previousData = getResourceData(prevState) ?? [];
    const filtered = previousData.filter((j) => j.id !== id);

    set({
      jobsState: {
        status: 'optimistic',
        data: previousData,
        previousData,
        pendingLabel: id,
      },
    });

    try {
      await deleteJobRequest(id);
      set({
        jobsState:
          filtered.length === 0
            ? { status: 'empty' }
            : {
                status: 'ready',
                data: filtered,
                total:
                  prevState.status === 'ready' && typeof prevState.total === 'number'
                    ? Math.max(filtered.length, prevState.total - 1)
                    : filtered.length,
                hasMore: prevState.status === 'ready' ? prevState.hasMore : false,
                nextOffset: prevState.status === 'ready' ? prevState.nextOffset : null,
              },
      });
    } catch (err) {
      const msg = await extractErrorMessage(err, 'Unable to remove job.');
      set({
        jobsState: { status: 'error', error: msg, data: previousData },
      });
    }
  },

  downloadUrl: (id: string) => getJobDownloadUrl(id),
}));
