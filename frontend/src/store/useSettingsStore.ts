import { create } from 'zustand';
import {
  ALL_STUDIO_TOOLS,
  DEFAULT_STUDIO_ORDER,
  StudioId,
  WORKSPACE_PROFILES,
} from '@/config/studios';
import {
  AppLocale,
  AppSkin,
  applyAppearanceToDocument,
  CornerRadiusPreset,
  normalizeHex,
  ThreeDLevel,
  UiDensity,
  WorkspaceProfileId,
} from '@/lib/appearance';

export type AppTheme = 'light' | 'dark' | 'system';
export type CompressionLevel = 'low' | 'medium' | 'high';
export type OcrLanguage = 'spa' | 'eng';
export type PdfToJpgDpi = 300 | 150 | 72;

export interface UserSettings {
  locale: AppLocale;
  skin: AppSkin;
  accentColor: string;
  threeDLevel: ThreeDLevel;
  cornerRadius: CornerRadiusPreset;
  density: UiDensity;
  workspaceProfile: WorkspaceProfileId;
  enabledStudios: StudioId[];
  studioOrder: StudioId[];
  pinnedToolIds: string[];
  sidebarCollapsed: boolean;
  jobDrawerOpen: boolean;

  // Backwards-compatible & processing defaults
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
  hydrationState: 'ssr' | 'hydrated';
  hydrateFromStorage: () => void;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  resetDefaults: () => void;
  exportProfileJson: () => string;
  importProfileJson: (raw: string) => { ok: boolean; error?: string };
  toggleStudio: (id: StudioId) => void;
  moveStudio: (id: StudioId, dir: 'up' | 'down') => void;
  togglePinTool: (id: string) => void;
  applyWorkspaceProfile: (profileId: WorkspaceProfileId) => void;
}

const SETTINGS_STORAGE_KEY = 'tornio-user-settings-v3';
const LEGACY_SETTINGS_KEY = 'openpdf-user-settings-v1';

const VALID_STUDIOS = new Set<StudioId>(DEFAULT_STUDIO_ORDER);
const VALID_TOOL_IDS = new Set<string>(ALL_STUDIO_TOOLS.map((t) => t.id));

const defaultSettings: UserSettings = {
  locale: 'es',
  skin: 'system',
  accentColor: 'adaptive',
  threeDLevel: 'full',
  cornerRadius: 'balanced',
  density: 'standard',
  workspaceProfile: 'all',
  enabledStudios: [...DEFAULT_STUDIO_ORDER],
  studioOrder: [...WORKSPACE_PROFILES.all.studioOrder],
  pinnedToolIds: [...WORKSPACE_PROFILES.all.pinnedToolIds],
  sidebarCollapsed: false,
  jobDrawerOpen: false,

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

function skinToTheme(skin: AppSkin): AppTheme {
  if (skin === 'carbon') return 'dark';
  if (skin === 'porcelain' || skin === 'swiss') return 'light';
  return 'system';
}

function themeToSkin(theme: AppTheme): AppSkin {
  if (theme === 'dark') return 'carbon';
  if (theme === 'light') return 'porcelain';
  return 'system';
}

function sanitizeStudioOrder(order: unknown): StudioId[] {
  if (!Array.isArray(order)) return [...DEFAULT_STUDIO_ORDER];
  const seen = new Set<StudioId>();
  const cleaned: StudioId[] = [];
  for (const item of order) {
    if (typeof item === 'string' && VALID_STUDIOS.has(item as StudioId) && !seen.has(item as StudioId)) {
      seen.add(item as StudioId);
      cleaned.push(item as StudioId);
    }
  }
  for (const fallback of DEFAULT_STUDIO_ORDER) {
    if (!seen.has(fallback)) cleaned.push(fallback);
  }
  return cleaned;
}

function sanitizeEnabledStudios(enabled: unknown): StudioId[] {
  if (!Array.isArray(enabled)) return [...DEFAULT_STUDIO_ORDER];
  const cleaned = enabled.filter(
    (item): item is StudioId => typeof item === 'string' && VALID_STUDIOS.has(item as StudioId)
  );
  return cleaned.length > 0 ? Array.from(new Set(cleaned)) : ['documents'];
}

function sanitizePinnedTools(pinned: unknown): string[] {
  if (!Array.isArray(pinned)) return [...defaultSettings.pinnedToolIds];
  const cleaned = pinned.filter(
    (item): item is string => typeof item === 'string' && VALID_TOOL_IDS.has(item)
  );
  return Array.from(new Set(cleaned)).slice(0, 9);
}

function sanitizeSettings(raw: Record<string, unknown>): UserSettings {
  const skin: AppSkin =
    raw.skin === 'porcelain' || raw.skin === 'carbon' || raw.skin === 'swiss' || raw.skin === 'system'
      ? raw.skin
      : raw.theme === 'dark'
      ? 'carbon'
      : raw.theme === 'light'
      ? 'porcelain'
      : 'system';

  const density: UiDensity =
    raw.density === 'compact' || raw.density === 'standard' || raw.density === 'comfortable'
      ? raw.density
      : raw.compactGrid === true
      ? 'compact'
      : 'standard';

  const workspaceProfile: WorkspaceProfileId =
    raw.workspaceProfile === 'office' ||
    raw.workspaceProfile === 'student' ||
    raw.workspaceProfile === 'creator' ||
    raw.workspaceProfile === 'developer'
      ? raw.workspaceProfile
      : 'all';

  const rawAccent = typeof raw.accentColor === 'string' ? raw.accentColor.trim() : 'adaptive';
  const accentColor = rawAccent === 'adaptive' ? 'adaptive' : normalizeHex(rawAccent) ?? 'adaptive';

  const locale: AppLocale = raw.locale === 'en' ? 'en' : 'es';
  const threeDLevel: ThreeDLevel =
    raw.threeDLevel === 'subtle' || raw.threeDLevel === 'performance' ? raw.threeDLevel : 'full';
  const cornerRadius: CornerRadiusPreset =
    raw.cornerRadius === 'sharp' || raw.cornerRadius === 'soft' ? raw.cornerRadius : 'balanced';

  const defaultCompression: CompressionLevel =
    raw.defaultCompression === 'low' || raw.defaultCompression === 'high'
      ? raw.defaultCompression
      : 'medium';
  const defaultOcrLanguage: OcrLanguage = raw.defaultOcrLanguage === 'eng' ? 'eng' : 'spa';
  const defaultPdfToJpgDpi: PdfToJpgDpi =
    raw.defaultPdfToJpgDpi === 150 || raw.defaultPdfToJpgDpi === 72 ? raw.defaultPdfToJpgDpi : 300;

  return {
    locale,
    skin,
    accentColor,
    threeDLevel,
    cornerRadius,
    density,
    workspaceProfile,
    enabledStudios: sanitizeEnabledStudios(raw.enabledStudios),
    studioOrder: sanitizeStudioOrder(raw.studioOrder),
    pinnedToolIds: sanitizePinnedTools(raw.pinnedToolIds),
    sidebarCollapsed: Boolean(raw.sidebarCollapsed),
    jobDrawerOpen: Boolean(raw.jobDrawerOpen),

    theme: skinToTheme(skin),
    immersiveByDefault: Boolean(raw.immersiveByDefault),
    compactGrid: density === 'compact',
    reduceAnimations: Boolean(raw.reduceAnimations),
    defaultCompression,
    defaultOcrLanguage,
    defaultPdfToJpgDpi,
    outputFilenamePattern:
      typeof raw.outputFilenamePattern === 'string' && raw.outputFilenamePattern.trim()
        ? raw.outputFilenamePattern
        : '{name}_procesado',
    autoCheckUpdatesOnStart:
      typeof raw.autoCheckUpdatesOnStart === 'boolean' ? raw.autoCheckUpdatesOnStart : true,
  };
}

function extractPureSettings(state: UserSettings): UserSettings {
  return {
    locale: state.locale,
    skin: state.skin,
    accentColor: state.accentColor,
    threeDLevel: state.threeDLevel,
    cornerRadius: state.cornerRadius,
    density: state.density,
    workspaceProfile: state.workspaceProfile,
    enabledStudios: state.enabledStudios,
    studioOrder: state.studioOrder,
    pinnedToolIds: state.pinnedToolIds,
    sidebarCollapsed: state.sidebarCollapsed,
    jobDrawerOpen: state.jobDrawerOpen,
    theme: state.theme,
    immersiveByDefault: state.immersiveByDefault,
    compactGrid: state.compactGrid,
    reduceAnimations: state.reduceAnimations,
    defaultCompression: state.defaultCompression,
    defaultOcrLanguage: state.defaultOcrLanguage,
    defaultPdfToJpgDpi: state.defaultPdfToJpgDpi,
    outputFilenamePattern: state.outputFilenamePattern,
    autoCheckUpdatesOnStart: state.autoCheckUpdatesOnStart,
  };
}

function loadStoredSettings(): UserSettings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const rawV3 = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (rawV3) {
      const parsed = JSON.parse(rawV3) as Record<string, unknown>;
      return sanitizeSettings(parsed);
    }

    // Silent migration from OpenPDF v1/v2 settings
    const rawLegacy = localStorage.getItem(LEGACY_SETTINGS_KEY);
    if (rawLegacy) {
      const legacyParsed = JSON.parse(rawLegacy) as Record<string, unknown>;
      const migrated = sanitizeSettings(legacyParsed);
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }

    return defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function saveStoredSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota / privacy errors
  }
}

export function applyAnimationPreference(reduce: boolean): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('reduce-motion', reduce);
}

export function applyTheme(theme: AppTheme): void {
  const current = loadStoredSettings();
  applyAppearanceToDocument({
    skin: themeToSkin(theme),
    accentColor: current.accentColor,
    cornerRadius: current.cornerRadius,
    density: current.density,
    reduceAnimations: current.reduceAnimations,
    locale: current.locale,
  });
}

let mediaListenerRegistered = false;

export function initializeClientSettings(): UserSettings {
  const current = loadStoredSettings();
  applyAppearanceToDocument({
    skin: current.skin,
    accentColor: current.accentColor,
    cornerRadius: current.cornerRadius,
    density: current.density,
    reduceAnimations: current.reduceAnimations,
    locale: current.locale,
  });

  if (typeof window !== 'undefined' && !mediaListenerRegistered) {
    mediaListenerRegistered = true;
    try {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', () => {
        const state = useSettingsStore.getState();
        if (state.skin === 'system') {
          applyAppearanceToDocument({
            skin: state.skin,
            accentColor: state.accentColor,
            cornerRadius: state.cornerRadius,
            density: state.density,
            reduceAnimations: state.reduceAnimations,
            locale: state.locale,
          });
        }
      });
    } catch {
      // Ignore environments without matchMedia listener support
    }
  }

  return current;
}

function syncDomFromSettings(settings: UserSettings) {
  applyAppearanceToDocument({
    skin: settings.skin,
    accentColor: settings.accentColor,
    cornerRadius: settings.cornerRadius,
    density: settings.density,
    reduceAnimations: settings.reduceAnimations,
    locale: settings.locale,
  });
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,
  hydrationState: 'ssr',

  hydrateFromStorage: () => {
    if (get().hydrationState === 'hydrated') return;
    const loaded = initializeClientSettings();
    set((state) => ({
      ...state,
      ...loaded,
      hydrationState: 'hydrated',
    }));
  },

  updateSetting: (key, value) => {
      set((state) => {
        const next: UserSettings = {
          ...extractPureSettings(state),
          [key]: value,
        };

        if (key === 'skin') {
          next.theme = skinToTheme(value as AppSkin);
        } else if (key === 'theme') {
          next.skin = themeToSkin(value as AppTheme);
        } else if (key === 'density') {
          next.compactGrid = value === 'compact';
        } else if (key === 'compactGrid') {
          next.density = value ? 'compact' : 'standard';
        } else if (key === 'accentColor') {
          const str = String(value).trim();
          next.accentColor = str === 'adaptive' ? 'adaptive' : normalizeHex(str) ?? 'adaptive';
        }

        saveStoredSettings(next);
        syncDomFromSettings(next);
        return { ...state, ...next };
      });
    },

    resetDefaults: () => {
      const fresh = {
        ...defaultSettings,
        enabledStudios: [...DEFAULT_STUDIO_ORDER],
        studioOrder: [...DEFAULT_STUDIO_ORDER],
        pinnedToolIds: [...defaultSettings.pinnedToolIds],
      };
      saveStoredSettings(fresh);
      syncDomFromSettings(fresh);
      set((state) => ({ ...state, ...fresh }));
    },

    exportProfileJson: () => {
      const pure = extractPureSettings(get());
      return JSON.stringify(
        {
          schema: 'tornio-profile-v3',
          exportedAt: new Date().toISOString(),
          settings: pure,
        },
        null,
        2
      );
    },

    importProfileJson: (raw: string) => {
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (!parsed || typeof parsed !== 'object') {
          return { ok: false, error: 'Invalid JSON profile payload.' };
        }
        const candidate =
          parsed.settings && typeof parsed.settings === 'object'
            ? (parsed.settings as Record<string, unknown>)
            : parsed;

        const clean = sanitizeSettings(candidate);
        saveStoredSettings(clean);
        syncDomFromSettings(clean);
        set((state) => ({ ...state, ...clean }));
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Unable to parse JSON profile.',
        };
      }
    },

    toggleStudio: (id: StudioId) => {
      set((state) => {
        const exists = state.enabledStudios.includes(id);
        let nextEnabled: StudioId[];
        if (exists) {
          if (state.enabledStudios.length <= 1) {
            return state;
          }
          nextEnabled = state.enabledStudios.filter((s) => s !== id);
        } else {
          nextEnabled = [...state.enabledStudios, id];
        }
        const next = { ...extractPureSettings(state), enabledStudios: nextEnabled };
        saveStoredSettings(next);
        return { ...state, ...next };
      });
    },

    moveStudio: (id: StudioId, dir: 'up' | 'down') => {
      set((state) => {
        const order = [...state.studioOrder];
        const idx = order.indexOf(id);
        if (idx === -1) return state;
        const target = dir === 'up' ? idx - 1 : idx + 1;
        if (target < 0 || target >= order.length) return state;
        const [item] = order.splice(idx, 1);
        order.splice(target, 0, item);
        const next = { ...extractPureSettings(state), studioOrder: order };
        saveStoredSettings(next);
        return { ...state, ...next };
      });
    },

    togglePinTool: (id: string) => {
      if (!VALID_TOOL_IDS.has(id)) return;
      set((state) => {
        const exists = state.pinnedToolIds.includes(id);
        let nextPinned: string[];
        if (exists) {
          nextPinned = state.pinnedToolIds.filter((t) => t !== id);
        } else {
          nextPinned = [...state.pinnedToolIds, id].slice(0, 9);
        }
        const next = { ...extractPureSettings(state), pinnedToolIds: nextPinned };
        saveStoredSettings(next);
        return { ...state, ...next };
      });
    },

    applyWorkspaceProfile: (profileId: WorkspaceProfileId) => {
      const preset = WORKSPACE_PROFILES[profileId] ?? WORKSPACE_PROFILES.all;
      set((state) => {
        const next: UserSettings = {
          ...extractPureSettings(state),
          workspaceProfile: profileId,
          enabledStudios: [...DEFAULT_STUDIO_ORDER],
          studioOrder: [...preset.studioOrder],
          pinnedToolIds: [...preset.pinnedToolIds],
        };
        saveStoredSettings(next);
        return { ...state, ...next };
      });
    },
}));
