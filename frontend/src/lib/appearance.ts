export type AppSkin = 'porcelain' | 'carbon' | 'swiss' | 'system';
export type ResolvedSkin = 'porcelain' | 'carbon' | 'swiss';
export type ThreeDLevel = 'full' | 'subtle' | 'performance';
export type CornerRadiusPreset = 'sharp' | 'balanced' | 'soft';
export type UiDensity = 'compact' | 'standard' | 'comfortable';
export type AppLocale = 'es' | 'en';
export type WorkspaceProfileId = 'all' | 'office' | 'student' | 'creator' | 'developer';

export interface AccentPreset {
  id: string;
  value: string; // 'adaptive' or #RRGGBB
  previewHex: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'adaptive', value: 'adaptive', previewHex: '#18181B' },
  { id: 'vermilion', value: '#E04826', previewHex: '#E04826' },
  { id: 'cobalt', value: '#2563EB', previewHex: '#2563EB' },
  { id: 'emerald', value: '#059669', previewHex: '#059669' },
  { id: 'violet', value: '#7C3AED', previewHex: '#7C3AED' },
  { id: 'rose', value: '#E11D48', previewHex: '#E11D48' },
  { id: 'teal', value: '#0D9488', previewHex: '#0D9488' },
  { id: 'amber', value: '#D97706', previewHex: '#D97706' },
];

export function normalizeHex(input: string): string | null {
  if (!input) return null;
  let hex = input.trim();
  if (!hex.startsWith('#')) hex = `#${hex}`;
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toUpperCase();
  }
  return null;
}

export function hexToRgbTuple(hex: string): [number, number, number] {
  const clean = normalizeHex(hex) ?? '#111114';
  const r = parseInt(clean.slice(1, 3), 16);
  const g = parseInt(clean.slice(3, 5), 16);
  const b = parseInt(clean.slice(5, 7), 16);
  return [r, g, b];
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgbTuple(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function computeContrastForeground(hex: string): '#FFFFFF' | '#0A0A0B' {
  const lum = relativeLuminance(hex);
  return lum > 0.25 ? '#0A0A0B' : '#FFFFFF';
}

export function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

export function shiftHexLuminance(hex: string, factor: number): string {
  const [r, g, b] = hexToRgbTuple(hex);
  const adjust = (v: number) => {
    if (factor < 0) {
      return Math.max(0, Math.round(v * (1 + factor)));
    }
    return Math.min(255, Math.round(v + (255 - v) * factor));
  };
  const nr = adjust(r).toString(16).padStart(2, '0');
  const ng = adjust(g).toString(16).padStart(2, '0');
  const nb = adjust(b).toString(16).padStart(2, '0');
  return `#${nr}${ng}${nb}`.toUpperCase();
}

export function resolveSkin(skin: AppSkin): ResolvedSkin {
  if (skin === 'porcelain' || skin === 'carbon' || skin === 'swiss') {
    return skin;
  }
  if (typeof window !== 'undefined') {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'carbon'
        : 'porcelain';
    } catch {
      return 'porcelain';
    }
  }
  return 'porcelain';
}

export function resolveAccentTokens(accentColor: string, resolvedSkin: ResolvedSkin) {
  const isDark = resolvedSkin === 'carbon';
  const normalized = accentColor === 'adaptive' ? null : normalizeHex(accentColor);
  const hex = normalized ?? (isDark ? '#F4F4F6' : '#111114');
  const fg = computeContrastForeground(hex);
  const hoverHex =
    fg === '#0A0A0B' ? shiftHexLuminance(hex, -0.14) : shiftHexLuminance(hex, isDark ? 0.14 : -0.18);

  const [r, g, b] = hexToRgbTuple(hex);
  const [hr, hg, hb] = hexToRgbTuple(hoverHex);

  // Legacy PDF tool buttons use bg-brand text-white; ensure white text remains accessible
  // when user selects adaptive monochrome in Carbon dark or a very light custom hex.
  const brandHex = fg === '#FFFFFF' ? hex : isDark ? '#E85D3F' : '#111114';
  const brandHoverHex = shiftHexLuminance(brandHex, -0.15);
  const [br, bg, bb] = hexToRgbTuple(brandHex);
  const [bhr, bhg, bhb] = hexToRgbTuple(brandHoverHex);

  return {
    hex,
    fg,
    hoverHex,
    rgb: `${r} ${g} ${b}`,
    hoverRgb: `${hr} ${hg} ${hb}`,
    soft: `rgba(${r}, ${g}, ${b}, ${isDark ? 0.16 : 0.08})`,
    border: `rgba(${r}, ${g}, ${b}, ${isDark ? 0.34 : 0.25})`,
    brandRgb: `${br} ${bg} ${bb}`,
    brandHoverRgb: `${bhr} ${bhg} ${bhb}`,
  };
}

export interface AppearanceInput {
  skin: AppSkin;
  accentColor: string;
  cornerRadius: CornerRadiusPreset;
  density: UiDensity;
  reduceAnimations: boolean;
  locale: AppLocale;
}

export function applyAppearanceToDocument(input: AppearanceInput): ResolvedSkin {
  const resolvedSkin = resolveSkin(input.skin);
  if (typeof document === 'undefined') return resolvedSkin;

  const root = document.documentElement;
  root.setAttribute('data-skin', resolvedSkin);
  root.setAttribute('data-radius', input.cornerRadius);
  root.setAttribute('data-density', input.density);
  root.lang = input.locale;

  if (resolvedSkin === 'carbon') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  if (input.reduceAnimations) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }

  const tokens = resolveAccentTokens(input.accentColor, resolvedSkin);
  root.style.setProperty('--accent', tokens.hex);
  root.style.setProperty('--accent-rgb', tokens.rgb);
  root.style.setProperty('--accent-hover-rgb', tokens.hoverRgb);
  root.style.setProperty('--accent-fg', tokens.fg);
  root.style.setProperty('--accent-soft', tokens.soft);
  root.style.setProperty('--accent-border', tokens.border);
  root.style.setProperty('--brand-rgb', tokens.brandRgb);
  root.style.setProperty('--brand-hover-rgb', tokens.brandHoverRgb);

  try {
    localStorage.setItem('openpdf-theme', resolvedSkin === 'carbon' ? 'dark' : 'light');
  } catch {
    // ignore storage errors
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('openpdf-theme-change'));
    window.dispatchEvent(new Event('tornio-appearance-change'));
  }

  return resolvedSkin;
}
