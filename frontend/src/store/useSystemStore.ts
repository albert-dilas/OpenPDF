import { create } from 'zustand';
import {
  apiClient,
  FeedbackPayload,
  SystemModulesInfo,
  SystemStatusResponse,
  SystemUpdateResponse,
} from '@/lib/api';

interface SystemState {
  online: boolean;
  checking: boolean;
  hasCheckedOnce: boolean;
  version: string;
  capabilities: {
    ocr: boolean;
    word_to_pdf: boolean;
  };
  ocrLanguages: string[];
  maxFileSizeMb: number;
  modules: SystemModulesInfo | null;
  modulesModalOpen: boolean;
  commandPaletteOpen: boolean;
  immersiveMode: boolean;
  updateInfo: SystemUpdateResponse | null;
  updateDismissed: boolean;
  setModulesModalOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setImmersiveMode: (enabled: boolean) => void;
  toggleImmersiveMode: () => void;
  checkStatus: () => Promise<void>;
  detectModules: () => Promise<SystemStatusResponse | null>;
  configureModule: (
    module: 'ocr' | 'word_to_pdf',
    path: string
  ) => Promise<SystemStatusResponse>;
  pickModuleBinary: (
    module: 'ocr' | 'word_to_pdf'
  ) => Promise<{ selected: boolean; path: string | null }>;
  installModule: (
    module: 'ocr' | 'word_to_pdf' | 'ocr_lang_spa'
  ) => Promise<void>;
  checkUpdatesOnce: () => Promise<void>;
  checkForUpdatesRealtime: () => Promise<SystemUpdateResponse>;
  submitFeedback: (payload: FeedbackPayload) => Promise<{ status: string; message: string; stored_locally?: boolean }>;
  dismissUpdate: () => void;
}

const UPDATE_CHECKED_KEY = 'openpdf-update-checked-data';
const UPDATE_DISMISSED_KEY = 'openpdf-update-dismissed';

let installPollTimer: ReturnType<typeof setInterval> | null = null;

function mapStatusToState(data: SystemStatusResponse) {
  return {
    online: true,
    checking: false,
    hasCheckedOnce: true,
    version: data.version || '2.2.0',
    capabilities: {
      ocr: Boolean(data.capabilities?.ocr),
      word_to_pdf: Boolean(data.capabilities?.word_to_pdf),
    },
    ocrLanguages:
      Array.isArray(data.ocr_languages) && data.ocr_languages.length > 0
        ? data.ocr_languages
        : ['spa', 'eng'],
    maxFileSizeMb:
      typeof data.max_file_size_mb === 'number' && data.max_file_size_mb > 0
        ? data.max_file_size_mb
        : 100,
    modules: data.modules ?? null,
  };
}

export const useSystemStore = create<SystemState>((set, get) => ({
  online: true,
  checking: true,
  hasCheckedOnce: false,
  version: '2.2.0',
  capabilities: {
    ocr: true,
    word_to_pdf: true,
  },
  ocrLanguages: ['spa', 'eng'],
  maxFileSizeMb: 100,
  modules: null,
  modulesModalOpen: false,
  commandPaletteOpen: false,
  immersiveMode: false,
  updateInfo: null,
  updateDismissed: false,

  setModulesModalOpen: (open) => set({ modulesModalOpen: open }),

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
        // Ignorar si el navegador restringe Fullscreen API
      }
    }
  },

  toggleImmersiveMode: () => {
    const next = !get().immersiveMode;
    get().setImmersiveMode(next);
  },

  checkStatus: async () => {
    try {
      const { data } = await apiClient.get<SystemStatusResponse>('/system/status', {
        timeout: 4500,
      });
      set(mapStatusToState(data));
    } catch {
      set({
        online: false,
        checking: false,
        hasCheckedOnce: true,
      });
    }
  },

  detectModules: async () => {
    set({ checking: true });
    try {
      const { data } = await apiClient.post<SystemStatusResponse>(
        '/system/detect-modules',
        {},
        { timeout: 10000 }
      );
      set(mapStatusToState(data));
      return data;
    } catch {
      set({ checking: false });
      return null;
    }
  },

  configureModule: async (module, path) => {
    const { data } = await apiClient.post<SystemStatusResponse>(
      '/system/configure-module',
      { module, path },
      { timeout: 10000 }
    );
    set(mapStatusToState(data));
    return data;
  },

  pickModuleBinary: async (module) => {
    const { data } = await apiClient.post<
      { selected: boolean; path: string | null } & SystemStatusResponse
    >('/system/pick-module-binary', { module }, { timeout: 120000 });
    set(mapStatusToState(data));
    return { selected: Boolean(data.selected), path: data.path ?? null };
  },

  installModule: async (module) => {
    const { data } = await apiClient.post<
      { started: boolean; module: string } & SystemStatusResponse
    >('/system/install-module', { module }, { timeout: 15000 });
    set(mapStatusToState(data));

    if (installPollTimer) {
      clearInterval(installPollTimer);
      installPollTimer = null;
    }

    installPollTimer = setInterval(async () => {
      await get().checkStatus();
      const mods = get().modules;
      const stillInstalling =
        mods?.ocr?.install_status === 'installing' ||
        mods?.word_to_pdf?.install_status === 'installing';
      if (!stillInstalling && installPollTimer) {
        clearInterval(installPollTimer);
        installPollTimer = null;
      }
    }, 2500);
  },

  checkUpdatesOnce: async () => {
    if (typeof window === 'undefined') return;
    try {
      const dismissed = sessionStorage.getItem(UPDATE_DISMISSED_KEY) === 'true';
      if (dismissed) {
        set({ updateDismissed: true });
        return;
      }

      const cached = sessionStorage.getItem(UPDATE_CHECKED_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as SystemUpdateResponse;
        set({ updateInfo: parsed });
        return;
      }

      if (get().updateInfo) return;

      const { data } = await apiClient.get<SystemUpdateResponse>('/system/updates', {
        timeout: 4500,
      });
      sessionStorage.setItem(UPDATE_CHECKED_KEY, JSON.stringify(data));
      set({ updateInfo: data });
    } catch {
      // Silencio total si falla o no hay red
    }
  },

  checkForUpdatesRealtime: async () => {
    try {
      const { data } = await apiClient.get<SystemUpdateResponse>(
        '/system/updates?force=true',
        { timeout: 5000 }
      );
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(UPDATE_CHECKED_KEY, JSON.stringify(data));
        sessionStorage.removeItem(UPDATE_DISMISSED_KEY);
      }
      set({ updateInfo: data, updateDismissed: false });
      return data;
    } catch {
      const fallback: SystemUpdateResponse = {
        current: get().version || '2.2.0',
        latest: null,
        update_available: false,
        online: false,
        url: 'https://github.com/albert-dilas/OpenPDF/releases',
      };
      set({ updateInfo: fallback });
      return fallback;
    }
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
