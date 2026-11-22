import { create } from 'zustand';
import {
  apiClient,
  applySelfUpdate,
  BinaryModuleId,
  cancelSelfUpdateDownload,
  DesktopConfig,
  extractErrorMessage,
  FeedbackPayload,
  fetchDesktopConfig,
  fetchSelfUpdateStatus,
  InstallableModuleId,
  isOfflineError,
  ModuleId,
  SelfUpdateStatus,
  startSelfUpdateDownload,
  SystemCapabilities,
  SystemMetricsInfo,
  SystemModulesInfo,
  SystemStatusResponse,
  SystemUpdateResponse,
  updateDesktopConfig,
} from '@/lib/api';
import {
  AsyncResourceState,
  getResourceData,
  MutationState,
} from '@/lib/fsm';

export interface SystemSnapshot {
  version: string;
  capabilities: SystemCapabilities;
  ocrLanguages: string[];
  maxFileSizeMb: number;
  modules: SystemModulesInfo | null;
  systemMetrics: SystemMetricsInfo | null;
  desktop: DesktopConfig | null;
}

export type ModuleMutationKey = ModuleId | 'ocr_lang_spa' | 'detect';

const DEFAULT_SELF_UPDATE_STATUS: SelfUpdateStatus = {
  status: 'idle',
  target_version: null,
  asset_name: null,
  downloaded_bytes: 0,
  total_bytes: 0,
  percent: 0,
  sha256_expected: null,
  sha256_actual: null,
  verified: false,
  file_path: null,
  install_kind: null,
  error: null,
};

interface SystemState {
  engineState: AsyncResourceState<SystemSnapshot>;
  updateState: AsyncResourceState<SystemUpdateResponse>;
  desktopConfigState: AsyncResourceState<DesktopConfig>;
  desktopConfigMutation: MutationState;
  selfUpdateStatus: SelfUpdateStatus;
  moduleMutations: Partial<Record<ModuleMutationKey, MutationState>>;
  modulesModalOpen: boolean;
  updateModalOpen: boolean;
  feedbackModalOpen: boolean;
  commandPaletteOpen: boolean;
  immersiveMode: boolean;
  updateDismissed: boolean;
  setModulesModalOpen: (open: boolean) => void;
  setUpdateModalOpen: (open: boolean) => void;
  setFeedbackModalOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setImmersiveMode: (enabled: boolean) => void;
  toggleImmersiveMode: () => void;
  checkStatus: () => Promise<SystemSnapshot | null>;
  loadDesktopConfig: () => Promise<DesktopConfig | null>;
  saveDesktopConfig: (patch: Partial<DesktopConfig>) => Promise<DesktopConfig>;
  detectModules: () => Promise<SystemStatusResponse | null>;
  configureModule: (module: ModuleId, path: string) => Promise<SystemStatusResponse>;
  pickModuleBinary: (
    module: BinaryModuleId
  ) => Promise<{ selected: boolean; path: string | null }>;
  installModule: (module: InstallableModuleId) => Promise<void>;
  checkUpdatesOnce: () => Promise<SystemUpdateResponse | null>;
  checkForUpdatesRealtime: () => Promise<SystemUpdateResponse>;
  refreshSelfUpdateStatus: () => Promise<SelfUpdateStatus>;
  beginSelfUpdateDownload: (info?: SystemUpdateResponse) => Promise<SelfUpdateStatus | null>;
  cancelSelfUpdate: () => Promise<SelfUpdateStatus>;
  applyVerifiedUpdate: () => Promise<{ applied: boolean; dry_run?: boolean }>;
  submitFeedback: (
    payload: FeedbackPayload
  ) => Promise<{ status: string; message: string; stored_locally?: boolean }>;
  dismissUpdate: () => void;
}

const UPDATE_CHECKED_KEY = 'tornio-update-checked-data';
const UPDATE_DISMISSED_KEY = 'tornio-update-dismissed';

const DEFAULT_OCR_LANGUAGES: string[] = ['spa', 'eng'];

const DEFAULT_CAPABILITIES: SystemCapabilities = {
  ocr: false,
  word_to_pdf: false,
  ffmpeg: false,
  yt_dlp: false,
  rembg_onnx: false,
  whisper_cpu: false,
};

let installPollTimer: ReturnType<typeof setInterval> | null = null;
let updateDownloadPollTimer: ReturnType<typeof setInterval> | null = null;

function mapStatusToSnapshot(data: SystemStatusResponse): SystemSnapshot {
  return {
    version: data.version || '3.0.0',
    capabilities: {
      ocr: Boolean(data.capabilities?.ocr),
      word_to_pdf: Boolean(data.capabilities?.word_to_pdf),
      ffmpeg: Boolean(data.capabilities?.ffmpeg),
      yt_dlp: Boolean(data.capabilities?.yt_dlp),
      rembg_onnx: Boolean(data.capabilities?.rembg_onnx),
      whisper_cpu: Boolean(data.capabilities?.whisper_cpu),
    },
    ocrLanguages:
      Array.isArray(data.ocr_languages) && data.ocr_languages.length > 0
        ? data.ocr_languages
        : DEFAULT_OCR_LANGUAGES,
    maxFileSizeMb:
      typeof data.max_file_size_mb === 'number' && data.max_file_size_mb > 0
        ? data.max_file_size_mb
        : 100,
    modules: data.modules ?? null,
    systemMetrics: data.system ?? null,
    desktop: data.desktop ?? null,
  };
}

function anyModuleInstalling(mods: SystemModulesInfo | null): boolean {
  if (!mods) return false;
  return (
    mods.ocr?.install_status === 'installing' ||
    mods.word_to_pdf?.install_status === 'installing' ||
    mods.ffmpeg?.install_status === 'installing' ||
    mods.yt_dlp?.install_status === 'installing' ||
    mods.rembg_onnx?.install_status === 'installing' ||
    mods.whisper_cpu?.install_status === 'installing'
  );
}

// Pure selector helpers
export const selectEngineSnapshot = (s: SystemState): SystemSnapshot | undefined =>
  getResourceData(s.engineState);

export const selectHasCheckedEngine = (s: SystemState): boolean =>
  s.engineState.status !== 'idle' && s.engineState.status !== 'loading';

export const selectIsEngineOnline = (s: SystemState): boolean =>
  s.engineState.status === 'ready' ||
  s.engineState.status === 'revalidating' ||
  s.engineState.status === 'fetchingNextPage' ||
  s.engineState.status === 'optimistic';

export const selectIsEngineOffline = (s: SystemState): boolean =>
  s.engineState.status === 'offline' || s.engineState.status === 'error';

export const selectIsEngineChecking = (s: SystemState): boolean =>
  s.engineState.status === 'loading' || s.engineState.status === 'revalidating';

export const selectEngineVersion = (s: SystemState): string =>
  getResourceData(s.engineState)?.version ?? '3.0.0';

export const selectEngineCapabilities = (s: SystemState): SystemCapabilities =>
  getResourceData(s.engineState)?.capabilities ?? DEFAULT_CAPABILITIES;

export const selectOcrLanguages = (s: SystemState): string[] =>
  getResourceData(s.engineState)?.ocrLanguages ?? DEFAULT_OCR_LANGUAGES;

export const selectMaxFileSizeMb = (s: SystemState): number =>
  getResourceData(s.engineState)?.maxFileSizeMb ?? 100;

export const selectModules = (s: SystemState): SystemModulesInfo | null =>
  getResourceData(s.engineState)?.modules ?? null;

export const selectSystemMetrics = (s: SystemState): SystemMetricsInfo | null =>
  getResourceData(s.engineState)?.systemMetrics ?? null;

export const selectUpdateInfo = (s: SystemState): SystemUpdateResponse | null =>
  getResourceData(s.updateState) ?? null;

export const selectDesktopConfig = (s: SystemState): DesktopConfig | null =>
  getResourceData(s.desktopConfigState) ?? getResourceData(s.engineState)?.desktop ?? null;

function stopUpdateDownloadPolling(): void {
  if (updateDownloadPollTimer) {
    clearInterval(updateDownloadPollTimer);
    updateDownloadPollTimer = null;
  }
}

export const useSystemStore = create<SystemState>((set, get) => ({
  engineState: { status: 'idle' },
  updateState: { status: 'idle' },
  desktopConfigState: { status: 'idle' },
  desktopConfigMutation: { status: 'idle' },
  selfUpdateStatus: DEFAULT_SELF_UPDATE_STATUS,
  moduleMutations: {},
  modulesModalOpen: false,
  updateModalOpen: false,
  feedbackModalOpen: false,
  commandPaletteOpen: false,
  immersiveMode: false,
  updateDismissed: false,

  setModulesModalOpen: (open) => set({ modulesModalOpen: open }),

  setUpdateModalOpen: (open) => set({ updateModalOpen: open }),

  setFeedbackModalOpen: (open) => set({ feedbackModalOpen: open }),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  setImmersiveMode: (enabled) => {
    set({ immersiveMode: enabled });
    if (typeof document !== 'undefined') {
      try {
        if (enabled && !document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(() => {});
        } else if (!enabled && document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
      } catch {
        // Ignore if browser restricts Fullscreen API
      }
    }
  },

  toggleImmersiveMode: () => {
    const next = !get().immersiveMode;
    get().setImmersiveMode(next);
  },

  checkStatus: async () => {
    const existing = getResourceData(get().engineState);
    set({
      engineState: existing
        ? { status: 'revalidating', data: existing }
        : { status: 'loading' },
    });

    try {
      const { data } = await apiClient.get<SystemStatusResponse>('/system/status', {
        timeout: 4500,
      });
      const snapshot = mapStatusToSnapshot(data);
      set((state) => ({
        engineState: { status: 'ready', data: snapshot },
        desktopConfigState: snapshot.desktop
          ? { status: 'ready', data: snapshot.desktop }
          : state.desktopConfigState,
      }));
      return snapshot;
    } catch {
      set({
        engineState: {
          status: 'offline',
          data: existing,
          error: '127.0.0.1 unreachable',
        },
      });
      return null;
    }
  },

  loadDesktopConfig: async () => {
    const existing = getResourceData(get().desktopConfigState);
    set({
      desktopConfigState: existing
        ? { status: 'revalidating', data: existing }
        : { status: 'loading' },
    });
    try {
      const data = await fetchDesktopConfig();
      set({ desktopConfigState: { status: 'ready', data } });
      return data;
    } catch (err) {
      const msg = await extractErrorMessage(err, 'Unable to read desktop settings');
      set({
        desktopConfigState: {
          status: isOfflineError(err) ? 'offline' : 'error',
          data: existing,
          error: msg,
        },
      });
      return null;
    }
  },

  saveDesktopConfig: async (patch) => {
    set({ desktopConfigMutation: { status: 'pending' } });
    try {
      const updated = await updateDesktopConfig(patch);
      set((state) => ({
        desktopConfigState: { status: 'ready', data: updated },
        desktopConfigMutation: { status: 'success', data: undefined },
        engineState:
          state.engineState.status === 'ready'
            ? {
                status: 'ready',
                data: { ...state.engineState.data, desktop: updated },
              }
            : state.engineState,
      }));
      return updated;
    } catch (err) {
      const msg = await extractErrorMessage(err, 'Unable to save desktop settings');
      set({
        desktopConfigMutation: isOfflineError(err)
          ? { status: 'offline', error: msg }
          : { status: 'error', error: msg },
      });
      throw err;
    }
  },

  detectModules: async () => {
    const existing = getResourceData(get().engineState);
    set((state) => ({
      engineState: existing
        ? { status: 'revalidating', data: existing }
        : { status: 'loading' },
      moduleMutations: { ...state.moduleMutations, detect: { status: 'pending' } },
    }));

    try {
      const { data } = await apiClient.post<SystemStatusResponse>(
        '/system/detect-modules',
        {},
        { timeout: 10000 }
      );
      set((state) => ({
        engineState: { status: 'ready', data: mapStatusToSnapshot(data) },
        moduleMutations: { ...state.moduleMutations, detect: { status: 'success', data: undefined } },
      }));
      return data;
    } catch (err) {
      const msg = await extractErrorMessage(err, 'Detection failed');
      set((state) => ({
        engineState: existing
          ? { status: 'offline', data: existing, error: msg }
          : { status: 'offline', error: msg },
        moduleMutations: {
          ...state.moduleMutations,
          detect: isOfflineError(err) ? { status: 'offline', error: msg } : { status: 'error', error: msg },
        },
      }));
      return null;
    }
  },

  configureModule: async (module, path) => {
    set((state) => ({
      moduleMutations: { ...state.moduleMutations, [module]: { status: 'pending' } },
    }));
    try {
      const { data } = await apiClient.post<SystemStatusResponse>(
        '/system/configure-module',
        { module, path },
        { timeout: 10000 }
      );
      set((state) => ({
        engineState: { status: 'ready', data: mapStatusToSnapshot(data) },
        moduleMutations: { ...state.moduleMutations, [module]: { status: 'success', data: undefined } },
      }));
      return data;
    } catch (err) {
      const msg = await extractErrorMessage(err, 'Configuration failed');
      set((state) => ({
        moduleMutations: {
          ...state.moduleMutations,
          [module]: isOfflineError(err) ? { status: 'offline', error: msg } : { status: 'error', error: msg },
        },
      }));
      throw err;
    }
  },

  pickModuleBinary: async (module) => {
    set((state) => ({
      moduleMutations: { ...state.moduleMutations, [module]: { status: 'pending' } },
    }));
    try {
      const { data } = await apiClient.post<
        { selected: boolean; path: string | null } & SystemStatusResponse
      >('/system/pick-module-binary', { module }, { timeout: 120000 });
      set((state) => ({
        engineState: { status: 'ready', data: mapStatusToSnapshot(data) },
        moduleMutations: { ...state.moduleMutations, [module]: { status: 'success', data: undefined } },
      }));
      return { selected: Boolean(data.selected), path: data.path ?? null };
    } catch (err) {
      const msg = await extractErrorMessage(err, 'Picker failed');
      set((state) => ({
        moduleMutations: {
          ...state.moduleMutations,
          [module]: isOfflineError(err) ? { status: 'offline', error: msg } : { status: 'error', error: msg },
        },
      }));
      throw err;
    }
  },

  installModule: async (module) => {
    set((state) => ({
      moduleMutations: { ...state.moduleMutations, [module]: { status: 'pending' } },
    }));
    try {
      const { data } = await apiClient.post<
        { started: boolean; module: string } & SystemStatusResponse
      >('/system/install-module', { module }, { timeout: 15000 });
      set((state) => ({
        engineState: { status: 'ready', data: mapStatusToSnapshot(data) },
        moduleMutations: { ...state.moduleMutations, [module]: { status: 'success', data: undefined } },
      }));

      if (installPollTimer) {
        clearInterval(installPollTimer);
        installPollTimer = null;
      }

      installPollTimer = setInterval(async () => {
        await get().checkStatus();
        if (!anyModuleInstalling(selectModules(get())) && installPollTimer) {
          clearInterval(installPollTimer);
          installPollTimer = null;
        }
      }, 2500);
    } catch (err) {
      const msg = await extractErrorMessage(err, 'Install failed');
      set((state) => ({
        moduleMutations: {
          ...state.moduleMutations,
          [module]: isOfflineError(err) ? { status: 'offline', error: msg } : { status: 'error', error: msg },
        },
      }));
      throw err;
    }
  },

  checkUpdatesOnce: async () => {
    if (typeof window === 'undefined') return null;
    try {
      const dismissed = sessionStorage.getItem(UPDATE_DISMISSED_KEY) === 'true';
      if (dismissed) {
        set({ updateDismissed: true });
        return selectUpdateInfo(get());
      }

      const cached = sessionStorage.getItem(UPDATE_CHECKED_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as SystemUpdateResponse;
        set({ updateState: { status: 'ready', data: parsed } });
        return parsed;
      }

      const already = getResourceData(get().updateState);
      if (already) return already;

      set({ updateState: { status: 'loading' } });
      const { data } = await apiClient.get<SystemUpdateResponse>('/system/updates', {
        timeout: 4500,
      });
      sessionStorage.setItem(UPDATE_CHECKED_KEY, JSON.stringify(data));
      set({ updateState: { status: 'ready', data } });
      return data;
    } catch {
      set({ updateState: { status: 'offline' } });
      return null;
    }
  },

  checkForUpdatesRealtime: async () => {
    const existing = getResourceData(get().updateState);
    set({
      updateState: existing
        ? { status: 'revalidating', data: existing }
        : { status: 'loading' },
    });

    try {
      const { data } = await apiClient.get<SystemUpdateResponse>(
        '/system/updates?force=true',
        { timeout: 5000 }
      );
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(UPDATE_CHECKED_KEY, JSON.stringify(data));
        sessionStorage.removeItem(UPDATE_DISMISSED_KEY);
      }
      set({
        updateState: { status: 'ready', data },
        updateDismissed: false,
      });
      return data;
    } catch {
      const fallback: SystemUpdateResponse = {
        current: selectEngineVersion(get()),
        latest: null,
        update_available: false,
        online: false,
        url: 'https://github.com/albert-dilas/OpenPDF/releases',
      };
      set({ updateState: { status: 'offline', data: fallback } });
      return fallback;
    }
  },

  refreshSelfUpdateStatus: async () => {
    const st = await fetchSelfUpdateStatus();
    set({ selfUpdateStatus: st });
    if (st.status !== 'downloading' && st.status !== 'verifying') {
      stopUpdateDownloadPolling();
    }
    return st;
  },

  beginSelfUpdateDownload: async (explicitInfo) => {
    const info = explicitInfo ?? selectUpdateInfo(get());
    const dlUrl = info?.installer_url || info?.portable_url || info?.download_url;
    if (!info || !info.latest || !dlUrl || !info.checksums_url) {
      return null;
    }
    const st = await startSelfUpdateDownload({
      download_url: dlUrl,
      target_version: info.latest,
      asset_name: info.asset_name,
      checksums_url: info.checksums_url,
    });
    set({ selfUpdateStatus: st });

    stopUpdateDownloadPolling();
    updateDownloadPollTimer = setInterval(() => {
      get()
        .refreshSelfUpdateStatus()
        .catch(() => {
          stopUpdateDownloadPolling();
        });
    }, 650);

    return st;
  },

  cancelSelfUpdate: async () => {
    stopUpdateDownloadPolling();
    const st = await cancelSelfUpdateDownload();
    set({ selfUpdateStatus: st });
    return st;
  },

  applyVerifiedUpdate: async () => {
    const res = await applySelfUpdate();
    const refreshed = await fetchSelfUpdateStatus().catch(() => get().selfUpdateStatus);
    set({ selfUpdateStatus: refreshed });
    return res;
  },

  submitFeedback: async (payload: FeedbackPayload) => {
    const { data } = await apiClient.post<{
      status: string;
      message: string;
      stored_locally?: boolean;
    }>('/system/feedback', payload, { timeout: 5000 });
    return data;
  },

  dismissUpdate: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(UPDATE_DISMISSED_KEY, 'true');
    }
    set({ updateDismissed: true });
  },
}));
