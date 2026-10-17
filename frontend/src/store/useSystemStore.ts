import { create } from 'zustand';
import {
  apiClient,
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
  updateInfo: SystemUpdateResponse | null;
  updateDismissed: boolean;
  checkStatus: () => Promise<void>;
  checkUpdatesOnce: () => Promise<void>;
  dismissUpdate: () => void;
}

const UPDATE_CHECKED_KEY = 'openpdf-update-checked-data';
const UPDATE_DISMISSED_KEY = 'openpdf-update-dismissed';

export const useSystemStore = create<SystemState>((set, get) => ({
  online: true,
  checking: true,
  hasCheckedOnce: false,
  version: '1.0.0',
  capabilities: {
    ocr: true,
    word_to_pdf: true,
  },
  ocrLanguages: ['spa', 'eng'],
  maxFileSizeMb: 100,
  updateInfo: null,
  updateDismissed: false,

  checkStatus: async () => {
    try {
      const { data } = await apiClient.get<SystemStatusResponse>('/system/status', {
        timeout: 4000,
      });
      set({
        online: true,
        checking: false,
        hasCheckedOnce: true,
        version: data.version || '1.0.0',
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
      });
    } catch {
      set({
        online: false,
        checking: false,
        hasCheckedOnce: true,
      });
    }
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

      if (get(). updateInfo) return;

      const { data } = await apiClient.get<SystemUpdateResponse>('/system/updates', {
        timeout: 4500,
      });
      sessionStorage.setItem(UPDATE_CHECKED_KEY, JSON.stringify(data));
      set({ updateInfo: data });
    } catch {
      // Silencio total si falla o no hay red
    }
  },

  dismissUpdate: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(UPDATE_DISMISSED_KEY, 'true');
    }
    set({ updateDismissed: true });
  },
}));
