'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Sun, Moon, Layers, Monitor, Box, Maximize2 } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  ACCENT_PRESETS,
  AppLocale,
  AppSkin,
  contrastRatio,
  CornerRadiusPreset,
  normalizeHex,
  resolveAccentTokens,
  ResolvedSkin,
  resolveSkin,
  ThreeDLevel,
  UiDensity,
} from '@/lib/appearance';
import { useI18n } from '@/i18n';

export default function AppearancePanel() {
  const { t } = useI18n();
  const {
    hydrationState,
    locale,
    skin,
    accentColor,
    threeDLevel,
    cornerRadius,
    density,
    reduceAnimations,
    immersiveByDefault,
    updateSetting,
  } = useSettingsStore();

  const [appearanceTick, setAppearanceTick] = useState(0);

  useEffect(() => {
    const onAppearanceChange = () => setAppearanceTick((v) => v + 1);
    window.addEventListener('tornio-appearance-change', onAppearanceChange);
    return () => window.removeEventListener('tornio-appearance-change', onAppearanceChange);
  }, []);

  const resolvedSkin: ResolvedSkin = useMemo(() => {
    void appearanceTick;
    return hydrationState === 'hydrated'
      ? resolveSkin(skin)
      : skin === 'carbon'
      ? 'carbon'
      : skin === 'swiss'
      ? 'swiss'
      : 'porcelain';
  }, [appearanceTick, hydrationState, skin]);
  const accentTokens = useMemo(
    () => resolveAccentTokens(accentColor, resolvedSkin),
    [accentColor, resolvedSkin]
  );

  const wcagRatio = useMemo(
    () => contrastRatio(accentTokens.hex, accentTokens.fg).toFixed(2),
    [accentTokens.fg, accentTokens.hex]
  );

  const skinOptions: {
    id: AppSkin;
    icon: React.ComponentType<{ className?: string }>;
    swatchBg: string;
    swatchSurface: string;
  }[] = [
    { id: 'porcelain', icon: Sun, swatchBg: '#F7F7F8', swatchSurface: '#FFFFFF' },
    { id: 'carbon', icon: Moon, swatchBg: '#0A0A0B', swatchSurface: '#121215' },
    { id: 'swiss', icon: Layers, swatchBg: '#EFEFF1', swatchSurface: '#FAFAFA' },
    { id: 'system', icon: Monitor, swatchBg: '#E4E4E9', swatchSurface: '#18181C' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Skin Selector */}
      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--fg)]">
            {t.settings.appearance.skinTitle}
          </h2>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            {t.settings.appearance.skinDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {skinOptions.map((opt) => {
            const Icon = opt.icon;
            const active = skin === opt.id;
            const copy = t.settings.appearance.skins[opt.id];
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateSetting('skin', opt.id)}
                className={`p-3.5 rounded-[var(--radius-control)] border text-left transition-colors space-y-3 ${
                  active
                    ? 'border-[var(--accent)] ring-1 ring-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-md border border-black/15 inline-flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${opt.swatchBg} 50%, ${opt.swatchSurface} 50%)`,
                      }}
                    >
                      <Icon className="w-3 h-3 text-zinc-500" />
                    </span>
                  </div>
                  {active && <Check className="w-4 h-4 text-[var(--fg)]" />}
                </div>
                <div>
                  <span className="text-xs font-semibold text-[var(--fg)] block">
                    {copy.name}
                  </span>
                  <span className="text-[11px] text-[var(--fg-muted)]">{copy.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent Color + Auto Contrast */}
      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--fg)]">
              {t.settings.appearance.accentTitle}
            </h2>
            <p className="text-xs text-[var(--fg-muted)] mt-0.5">
              {t.settings.appearance.accentDesc}
            </p>
          </div>

          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-control)] text-xs font-mono font-semibold border border-[var(--border)]"
            style={{
              backgroundColor: accentTokens.hex,
              color: accentTokens.fg,
            }}
          >
            <span>{accentTokens.hex}</span>
            <span>·</span>
            <span>{wcagRatio}:1</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {ACCENT_PRESETS.map((preset) => {
            const active =
              preset.value === 'adaptive'
                ? accentColor === 'adaptive'
                : normalizeHex(accentColor) === preset.value;
            const label =
              t.settings.appearance.presets[
                preset.id as keyof typeof t.settings.appearance.presets
              ];
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => updateSetting('accentColor', preset.value)}
                className={`p-2.5 rounded-[var(--radius-control)] border text-left flex items-center gap-2.5 transition-colors ${
                  active
                    ? 'border-[var(--accent)] ring-1 ring-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)]'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-black/15 shrink-0"
                  style={{
                    backgroundColor:
                      preset.value === 'adaptive'
                        ? resolvedSkin === 'carbon'
                          ? '#F4F4F5'
                          : '#111113'
                        : preset.previewHex,
                  }}
                />
                <span className="text-xs font-medium text-[var(--fg)] truncate">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-2 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
          <label
            htmlFor="custom-accent-picker"
            className="text-xs font-medium text-[var(--fg)] flex items-center gap-2.5"
          >
            <span>{t.settings.appearance.customHexLabel}:</span>
            <input
              id="custom-accent-picker"
              type="color"
              value={accentTokens.hex}
              onChange={(e) => updateSetting('accentColor', e.target.value.toUpperCase())}
              className="h-8 w-12 rounded border border-[var(--border)] bg-transparent cursor-pointer"
            />
            <span className="font-mono text-xs text-[var(--fg-muted)]">{accentTokens.hex}</span>
          </label>
          <span className="text-[11px] font-mono text-[var(--fg-muted)]">
            {t.settings.appearance.contrastCheck}: {wcagRatio}:1 ({accentTokens.fg})
          </span>
        </div>
      </div>

      {/* 3D Engine Level */}
      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
        <div className="flex items-start gap-2.5">
          <Box className="w-4 h-4 text-[var(--fg)] mt-0.5" />
          <div>
            <h2 className="text-sm font-semibold text-[var(--fg)]">
              {t.settings.appearance.threeDTitle}
            </h2>
            <p className="text-xs text-[var(--fg-muted)] mt-0.5">
              {t.settings.appearance.threeDDesc}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['full', 'subtle', 'performance'] as ThreeDLevel[]).map((lvl) => {
            const active = threeDLevel === lvl;
            const copy = t.settings.appearance.threeDLevels[lvl];
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => updateSetting('threeDLevel', lvl)}
                className={`p-3.5 rounded-[var(--radius-control)] border text-left transition-colors ${
                  active
                    ? 'border-[var(--accent)] ring-1 ring-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--fg)]">{copy.name}</span>
                  {active && <Check className="w-3.5 h-3.5 text-[var(--fg)]" />}
                </div>
                <p className="text-[11px] text-[var(--fg-muted)] mt-1">{copy.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Geometry, Density, Locale & Motion */}
      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-[var(--fg)]">
            {t.settings.appearance.geometryTitle}
          </h2>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            {t.settings.appearance.geometryDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Corner Radius */}
          <div className="space-y-2">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
              {t.settings.appearance.radiusLabel}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['sharp', 'balanced', 'soft'] as CornerRadiusPreset[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => updateSetting('cornerRadius', r)}
                  className={`py-2 px-2 rounded-[var(--radius-control)] border text-[11px] font-medium ${
                    cornerRadius === r
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--fg)]'
                      : 'border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)]'
                  }`}
                >
                  {t.settings.appearance.radii[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Density */}
          <div className="space-y-2">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
              {t.settings.appearance.densityLabel}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['compact', 'standard', 'comfortable'] as UiDensity[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => updateSetting('density', d)}
                  className={`py-2 px-1.5 rounded-[var(--radius-control)] border text-[11px] font-medium truncate ${
                    density === d
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--fg)]'
                      : 'border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)]'
                  }`}
                >
                  {t.settings.appearance.densities[d]}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
              {t.settings.appearance.localeLabel}
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['es', 'en'] as AppLocale[]).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => updateSetting('locale', loc)}
                  className={`py-2 px-2 rounded-[var(--radius-control)] border text-xs font-mono font-semibold uppercase ${
                    locale === loc
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--fg)]'
                      : 'border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)]'
                  }`}
                >
                  {loc === 'es' ? 'ES · Español' : 'EN · English'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-[var(--border)] border-t border-[var(--border)] pt-2">
          <label className="py-3 flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-[var(--fg)] block">
                {t.settings.appearance.reduceMotionLabel}
              </span>
              <span className="text-[11px] text-[var(--fg-muted)]">
                {t.settings.appearance.reduceMotionDesc}
              </span>
            </div>
            <input
              type="checkbox"
              checked={reduceAnimations}
              onChange={(e) => updateSetting('reduceAnimations', e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-strong)]"
            />
          </label>

          <label className="py-3 flex items-center justify-between gap-4 cursor-pointer">
            <div className="flex items-start gap-2">
              <Maximize2 className="w-3.5 h-3.5 text-[var(--fg)] mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[var(--fg)] block">
                  {t.settings.appearance.immersiveLabel}
                </span>
                <span className="text-[11px] text-[var(--fg-muted)]">
                  {t.settings.appearance.immersiveDesc}
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={immersiveByDefault}
              onChange={(e) => updateSetting('immersiveByDefault', e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-strong)]"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
