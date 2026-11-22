'use client';

import React from 'react';
import {
  Cpu,
  ScanText,
  FileOutput,
  Film,
  DownloadCloud,
  Sparkles,
  Mic,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';
import {
  selectEngineCapabilities,
  selectOcrLanguages,
  selectSystemMetrics,
  useSystemStore,
} from '@/store/useSystemStore';
import { ModuleId } from '@/lib/api';
import { useI18n } from '@/i18n';

const MODULE_ITEMS: {
  id: ModuleId;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'ocr', icon: ScanText },
  { id: 'word_to_pdf', icon: FileOutput },
  { id: 'ffmpeg', icon: Film },
  { id: 'yt_dlp', icon: DownloadCloud },
  { id: 'rembg_onnx', icon: Sparkles },
  { id: 'whisper_cpu', icon: Mic },
];

export default function ModulesPanel() {
  const { t } = useI18n();
  const capabilities = useSystemStore(selectEngineCapabilities);
  const ocrLanguages = useSystemStore(selectOcrLanguages);
  const systemMetrics = useSystemStore(selectSystemMetrics);
  const setModulesModalOpen = useSystemStore((s) => s.setModulesModalOpen);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--fg)]">
              {t.settings.modules.title}
            </h2>
            <p className="text-xs text-[var(--fg-muted)] mt-0.5">
              {t.settings.modules.desc}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModulesModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-control)] text-xs font-semibold shrink-0"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{t.settings.modules.openCenterBtn}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULE_ITEMS.map(({ id, icon: Icon }) => {
            const ready = Boolean(capabilities[id]);
            const copy = t.modulesModal.items[id];
            return (
              <div
                key={id}
                className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] p-3.5 space-y-2.5 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-[var(--fg)] truncate">
                      {copy.title}
                    </span>
                  </div>
                  {ready ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {t.common.connected}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300 shrink-0">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {t.common.pending}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed">
                  {copy.subtitle}
                </p>

                {id === 'ocr' && (
                  <div className="pt-2 border-t border-[var(--border)] text-[10px] font-mono text-[var(--fg-muted)]">
                    {(ocrLanguages || []).join(', ') || 'spa, eng'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {systemMetrics && (
          <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] p-4 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)] block">
              {t.settings.modules.telemetryTitle}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <span className="text-[var(--fg-muted)] block text-[10px]">Cores</span>
                <span className="font-semibold text-[var(--fg)]">{systemMetrics.cpu_count}</span>
              </div>
              <div>
                <span className="text-[var(--fg-muted)] block text-[10px]">{t.home.telemetryCpu}</span>
                <span className="font-semibold text-[var(--fg)]">
                  {Math.round(systemMetrics.cpu_percent)}%
                </span>
              </div>
              <div>
                <span className="text-[var(--fg-muted)] block text-[10px]">{t.home.telemetryRam}</span>
                <span className="font-semibold text-[var(--fg)]">
                  {Math.round(systemMetrics.memory_used_percent)}%
                </span>
              </div>
              <div>
                <span className="text-[var(--fg-muted)] block text-[10px]">{t.home.telemetryTemp}</span>
                <span className="font-semibold text-[var(--fg)]">
                  {systemMetrics.temp_files_count}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] p-3.5 flex items-start gap-3">
          <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-0.5">
            <p className="font-semibold text-[var(--fg)] flex items-center gap-1.5">
              <span>{t.settings.modules.localGuaranteeTitle}</span>
              <HardDrive className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
            </p>
            <p className="text-[var(--fg-muted)]">{t.settings.modules.localGuaranteeDesc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
