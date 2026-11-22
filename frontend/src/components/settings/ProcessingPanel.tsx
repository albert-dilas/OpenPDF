'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  CompressionLevel,
  OcrLanguage,
  PdfToJpgDpi,
  useSettingsStore,
} from '@/store/useSettingsStore';
import { useI18n } from '@/i18n';

export default function ProcessingPanel() {
  const { t } = useI18n();
  const {
    defaultCompression,
    defaultOcrLanguage,
    defaultPdfToJpgDpi,
    outputFilenamePattern,
    updateSetting,
  } = useSettingsStore();

  const handleClearCache = () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.clear();
        toast.success(t.settings.processing.cacheCleared);
      } catch {
        toast.error('Unable to clear session storage.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-[var(--fg)]">
            {t.settings.processing.title}
          </h2>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            {t.settings.processing.desc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Compression */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
              {t.settings.processing.compressionLabel}
            </label>
            <p className="text-xs text-[var(--fg-muted)]">
              {t.settings.processing.compressionDesc}
            </p>
            <select
              value={defaultCompression}
              onChange={(e) =>
                updateSetting('defaultCompression', e.target.value as CompressionLevel)
              }
              className="w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-medium text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="medium">{t.settings.processing.compressionOptions.medium}</option>
              <option value="high">{t.settings.processing.compressionOptions.high}</option>
              <option value="low">{t.settings.processing.compressionOptions.low}</option>
            </select>
          </div>

          {/* OCR Language */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
              {t.settings.processing.ocrLangLabel}
            </label>
            <p className="text-xs text-[var(--fg-muted)]">
              {t.settings.processing.ocrLangDesc}
            </p>
            <select
              value={defaultOcrLanguage}
              onChange={(e) =>
                updateSetting('defaultOcrLanguage', e.target.value as OcrLanguage)
              }
              className="w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-medium text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="spa">{t.settings.processing.ocrOptions.spa}</option>
              <option value="eng">{t.settings.processing.ocrOptions.eng}</option>
            </select>
          </div>

          {/* PDF to JPG DPI */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
              {t.settings.processing.dpiLabel}
            </label>
            <p className="text-xs text-[var(--fg-muted)]">
              {t.settings.processing.dpiDesc}
            </p>
            <select
              value={defaultPdfToJpgDpi}
              onChange={(e) =>
                updateSetting('defaultPdfToJpgDpi', Number(e.target.value) as PdfToJpgDpi)
              }
              className="w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-medium text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value={300}>{t.settings.processing.dpiOptions['300']}</option>
              <option value={150}>{t.settings.processing.dpiOptions['150']}</option>
              <option value={72}>{t.settings.processing.dpiOptions['72']}</option>
            </select>
          </div>

          {/* Output Filename Pattern */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
              {t.settings.processing.patternLabel}
            </label>
            <p className="text-xs text-[var(--fg-muted)]">
              {t.settings.processing.patternDesc}
            </p>
            <input
              type="text"
              value={outputFilenamePattern}
              onChange={(e) => updateSetting('outputFilenamePattern', e.target.value)}
              placeholder="{name}_procesado"
              className="w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-mono text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <span className="text-[11px] text-[var(--fg-muted)] block">
              {t.settings.processing.previewLabel}{' '}
              <code className="font-mono font-semibold text-[var(--fg)]">
                {(outputFilenamePattern || '{name}').replace('{name}', 'documento')}.pdf
              </code>
            </span>
          </div>
        </div>

        {/* Clear Cache */}
        <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-[var(--fg)] block">
              {t.settings.processing.cacheTitle}
            </span>
            <span className="text-[11px] text-[var(--fg-muted)]">
              {t.settings.processing.cacheDesc}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearCache}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--fg)]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.settings.processing.clearCacheBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
