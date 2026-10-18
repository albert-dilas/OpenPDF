import { create } from 'zustand';

export type AppTheme = 'light' | 'dark' | 'system';
export type CompressionLevel = 'low' | 'medium' | 'high';
export type OcrLanguage = 'spa' | 'eng';
export type PdfToJpgDpi = 300 | 150 | 72;

export interface UserSettings {
  theme: AppTheme;
  immersiveByDefault: boolean;
  compactGrid: boolean;
  reduceAnimations: boolean;
  defaultCompression: CompressionLevel;
  defaultOcrLanguage: OcrLanguage;
  defaultPdfToJpgDpi: PdfToJpgDpi;
  outputFilenamePattern: string;
  autoCheckUpdatesOnStart: boolean;
}

interface SettingsState extends UserSettings {
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  resetDefaults: () => void;
}

const SETTINGS_STORAGE_KEY = 'openpdf-user-settings-v1';

const defaultSettings: UserSettings = {
  theme: 'system',
  immersiveByDefault: false,
  compactGrid: false,
  reduceAnimations: false,
  defaultCompression: 'medium',
  defaultOcrLanguage: 'spa',
  defaultPdfToJpgDpi: 300,
  outputFilenamePattern: '{name}_procesado',
  autoCheckUpdatesOnStart: true,
};

function loadStoredSettings(): UserSettings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

function saveStoredSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Silencio si el almacenamiento local esta restringido
  }
}

export function applyAnimationPreference(reduce: boolean): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (reduce) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }
}

export function applyTheme(theme: AppTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldBeDark = theme === 'dark' || (theme === 'system' && prefersDark);

  if (shouldBeDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  try {
    localStorage.setItem('openpdf-theme', shouldBeDark ? 'dark' : 'light');
  } catch {
    // Ignorar si localStorage falla
  }

  window.dispatchEvent(new Event('openpdf-theme-change'));
}

export function initializeClientSettings(): UserSettings {
  const current = loadStoredSettings();
  applyTheme(current.theme);
  applyAnimationPreference(current.reduceAnimations);
  return current;
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const initial = loadStoredSettings();

  return {
    ...initial,

    updateSetting: (key, value) => {
      set((state) => {
        const next = { ...state, [key]: value };
        const pureSettings: UserSettings = {
          theme: next.theme,
          immersiveByDefault: next.immersiveByDefault,
          compactGrid: next.compactGrid,
          reduceAnimations: next.reduceAnimations,
          defaultCompression: next.defaultCompression,
          defaultOcrLanguage: next.defaultOcrLanguage,
          defaultPdfToJpgDpi: next.defaultPdfToJpgDpi,
          outputFilenamePattern: next.outputFilenamePattern,
          autoCheckUpdatesOnStart: next.autoCheckUpdatesOnStart,
        };
        saveStoredSettings(pureSettings);
        if (key === 'theme') {
          applyTheme(value as AppTheme);
        } else if (key === 'reduceAnimations') {
          applyAnimationPreference(Boolean(value));
        }
        return next;
      });
    },

    resetDefaults: () => {
      set(() => {
        saveStoredSettings(defaultSettings);
        applyTheme(defaultSettings.theme);
        applyAnimationPreference(defaultSettings.reduceAnimations);
        return {
          ...defaultSettings,
          updateSetting: get().updateSetting,
          resetDefaults: get().resetDefaults,
        };
      });
    },
  };
});
