import { create } from 'zustand';
import {
  AssetDomain,
  clearWorkspaceAssets,
  deleteWorkspaceAsset,
  extractErrorMessage,
  fetchWorkspaceAssets,
  getWorkspaceAssetDownloadUrl,
  inspectWorkspaceFile,
  isAbortError,
  isOfflineError,
  SessionAssetRecord,
} from '@/lib/api';
import {
  AsyncResourceState,
  getResourceData,
  getResourceNextOffset,
  hasMorePages,
  MutationState,
} from '@/lib/fsm';
import { useFileStore } from '@/store/useFileStore';

export interface PendingChainedAsset {
  asset: SessionAssetRecord;
  targetHref: string;
}

const WORKSPACE_PAGE_LIMIT = 12;
const EMPTY_ASSETS: SessionAssetRecord[] = [];

let listAbortController: AbortController | null = null;
let inspectAbortController: AbortController | null = null;
let networkListenersAttached = false;

function sortAssets(list: SessionAssetRecord[]): SessionAssetRecord[] {
  return [...list].sort((a, b) => {
    const ta = Date.parse(a.created_at || '') || 0;
    const tb = Date.parse(b.created_at || '') || 0;
    return tb - ta;
  });
}

function mergeUniqueAssets(
  base: SessionAssetRecord[],
  incoming: SessionAssetRecord[]
): SessionAssetRecord[] {
  const map = new Map<string, SessionAssetRecord>();
  for (const item of base) map.set(item.id, item);
  for (const item of incoming) map.set(item.id, item);
  return sortAssets(Array.from(map.values()));
}

interface WorkspaceState {
  assetsState: AsyncResourceState<SessionAssetRecord[]>;
  inspectState: MutationState<SessionAssetRecord[]>;
  activeAssetId: string | null;
  activeDomainFilter: AssetDomain | 'all';
  pendingChainedAsset: PendingChainedAsset | null;
  setActiveDomainFilter: (domain: AssetDomain | 'all') => void;
  setActiveAssetId: (id: string | null) => void;
  loadAssets: (opts?: { domain?: AssetDomain | 'all'; silent?: boolean }) => Promise<void>;
  loadNextAssetsPage: () => Promise<void>;
  inspectAndAddFiles: (files: File[]) => Promise<SessionAssetRecord[]>;
  abortInspect: () => void;
  resetInspectState: () => void;
  removeAsset: (id: string) => Promise<void>;
  clearAssets: () => Promise<void>;
  chainAssetToTool: (
    asset: SessionAssetRecord,
    href: string,
    navigate?: (path: string) => void
  ) => void;
  clearPendingChainedAsset: () => void;
  downloadAssetUrl: (id: string, inline?: boolean) => string;
  initNetworkListeners: () => void;
}

export const selectAssets = (s: WorkspaceState): SessionAssetRecord[] =>
  getResourceData(s.assetsState) ?? EMPTY_ASSETS;

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  assetsState: { status: 'idle' },
  inspectState: { status: 'idle' },
  activeAssetId: null,
  activeDomainFilter: 'all',
  pendingChainedAsset: null,

  setActiveDomainFilter: (domain) => {
    set({ activeDomainFilter: domain });
    get().loadAssets({ domain }).catch(() => {});
  },

  setActiveAssetId: (id) => set({ activeAssetId: id }),

  initNetworkListeners: () => {
    if (typeof window === 'undefined' || networkListenersAttached) return;
    networkListenersAttached = true;

    window.addEventListener('offline', () => {
      const existing = getResourceData(get().assetsState);
      set({
        assetsState: {
          status: 'offline',
          data: existing,
        },
      });
    });

    window.addEventListener('online', () => {
      get().loadAssets({ silent: true }).catch(() => {});
    });
  },

  loadAssets: async (opts) => {
    const domain = opts?.domain ?? get().activeDomainFilter;
    listAbortController?.abort();
    const controller = new AbortController();
    listAbortController = controller;

    const existing = getResourceData(get().assetsState);
    if (!opts?.silent) {
      set({
        assetsState: existing
          ? { status: 'revalidating', data: existing }
          : { status: 'loading' },
      });
    }

    try {
      const page = await fetchWorkspaceAssets({
        limit: WORKSPACE_PAGE_LIMIT,
        offset: 0,
        domain,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (page.items.length === 0) {
        set({
          assetsState: { status: 'empty' },
          activeAssetId: null,
        });
      } else {
        set((state) => ({
          assetsState: {
            status: 'ready',
            data: page.items,
            total: page.total,
            hasMore: page.hasMore,
            nextOffset: page.nextOffset,
          },
          activeAssetId:
            state.activeAssetId && page.items.some((a) => a.id === state.activeAssetId)
              ? state.activeAssetId
              : page.items[0]?.id ?? null,
        }));
      }
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }
      const msg = await extractErrorMessage(err, 'Unable to load Live Tray assets.');
      set({
        assetsState: isOfflineError(err)
          ? { status: 'offline', data: existing, error: msg }
          : { status: 'error', error: msg, data: existing },
      });
    } finally {
      if (listAbortController === controller) {
        listAbortController = null;
      }
    }
  },

  loadNextAssetsPage: async () => {
    const currentState = get().assetsState;
    if (!hasMorePages(currentState)) return;
    const currentItems = getResourceData(currentState) ?? [];
    const nextOffset = getResourceNextOffset(currentState);
    if (nextOffset === null) return;

    const controller = new AbortController();
    set({
      assetsState: {
        status: 'fetchingNextPage',
        data: currentItems,
        total: currentState.status === 'ready' ? currentState.total : undefined,
      },
    });

    try {
      const page = await fetchWorkspaceAssets({
        limit: WORKSPACE_PAGE_LIMIT,
        offset: nextOffset,
        domain: get().activeDomainFilter,
        signal: controller.signal,
      });
      const merged = mergeUniqueAssets(currentItems, page.items);
      set({
        assetsState: {
          status: 'ready',
          data: merged,
          total: page.total,
          hasMore: page.hasMore,
          nextOffset: page.nextOffset,
        },
      });
    } catch (err) {
      if (isAbortError(err)) return;
      const msg = await extractErrorMessage(err, 'Unable to fetch next page.');
      set({
        assetsState: isOfflineError(err)
          ? { status: 'offline', data: currentItems, error: msg }
          : { status: 'error', error: msg, data: currentItems },
      });
    }
  },

  abortInspect: () => {
    if (inspectAbortController) {
      inspectAbortController.abort();
      inspectAbortController = null;
    }
    set({ inspectState: { status: 'aborted' } });
  },

  resetInspectState: () => set({ inspectState: { status: 'idle' } }),

  inspectAndAddFiles: async (files: File[]) => {
    if (!files.length) return [];
    inspectAbortController?.abort();
    const controller = new AbortController();
    inspectAbortController = controller;

    set({ inspectState: { status: 'pending', label: files[0].name } });
    const created: SessionAssetRecord[] = [];

    try {
      for (const file of files) {
        if (controller.signal.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }
        const asset = await inspectWorkspaceFile(file, controller.signal);
        created.push(asset);
      }

      if (created.length > 0) {
        const prevState = get().assetsState;
        const currentItems = getResourceData(prevState) ?? [];
        const merged = mergeUniqueAssets(currentItems, created);
        const prevTotal = prevState.status === 'ready' ? prevState.total ?? currentItems.length : currentItems.length;
        set({
          assetsState: {
            status: 'ready',
            data: merged,
            total: Math.max(merged.length, prevTotal + created.length),
            hasMore: prevState.status === 'ready' ? prevState.hasMore : false,
            nextOffset: prevState.status === 'ready' ? prevState.nextOffset : null,
          },
          activeAssetId: created[created.length - 1].id,
          inspectState: { status: 'success', data: created },
        });
      } else {
        set({ inspectState: { status: 'idle' } });
      }
      return created;
    } catch (err) {
      if (isAbortError(err)) {
        set({ inspectState: { status: 'aborted' } });
        return [];
      }
      const msg = await extractErrorMessage(err, 'Unable to inspect file locally.');
      set({
        inspectState: isOfflineError(err)
          ? { status: 'offline', error: msg }
          : { status: 'error', error: msg },
      });
      throw err;
    } finally {
      if (inspectAbortController === controller) {
        inspectAbortController = null;
      }
    }
  },

  removeAsset: async (id: string) => {
    const prevState = get().assetsState;
    const previousData = getResourceData(prevState) ?? [];
    const filtered = previousData.filter((a) => a.id !== id);

    set((state) => ({
      assetsState: {
        status: 'optimistic',
        data: previousData,
        previousData,
        pendingLabel: id,
      },
      activeAssetId:
        state.activeAssetId === id ? filtered[0]?.id ?? null : state.activeAssetId,
    }));

    try {
      await deleteWorkspaceAsset(id);
      set({
        assetsState:
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
      const msg = await extractErrorMessage(err, 'Unable to remove asset.');
      set({
        assetsState: {
          status: 'error',
          error: msg,
          data: previousData,
        },
      });
    }
  },

  clearAssets: async () => {
    const prevState = get().assetsState;
    const previousData = getResourceData(prevState) ?? [];

    set({
      assetsState: {
        status: 'optimistic',
        data: [],
        previousData,
      },
      activeAssetId: null,
    });

    try {
      await clearWorkspaceAssets();
      set({
        assetsState: { status: 'empty' },
        activeAssetId: null,
      });
    } catch (err) {
      const msg = await extractErrorMessage(err, 'Unable to clear tray.');
      set({
        assetsState: {
          status: 'error',
          error: msg,
          data: previousData,
        },
        activeAssetId: previousData[0]?.id ?? null,
      });
    }
  },

  chainAssetToTool: (asset, href, navigate) => {
    const cleanHref = href.split('#')[0].split('?')[0] || '/';
    if (cleanHref !== '/video-studio') {
      useFileStore.getState().clearFiles();
    }
    set({
      activeAssetId: asset.id,
      pendingChainedAsset: {
        asset,
        targetHref: cleanHref,
      },
    });
    if (navigate) {
      navigate(href);
    }
  },

  clearPendingChainedAsset: () => set({ pendingChainedAsset: null }),

  downloadAssetUrl: (id: string, inline = false) =>
    getWorkspaceAssetDownloadUrl(id, inline),
}));
