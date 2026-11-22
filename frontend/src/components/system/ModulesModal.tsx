'use client';

import { useEffect, useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Download,
  Search,
  FolderOpen,
  Loader2,
  ScanText,
  FileOutput,
  Film,
  DownloadCloud,
  Sparkles,
  Mic,
  ChevronDown,
  RotateCcw,
  ShieldCheck,
  Languages,
  Cpu,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  selectEngineCapabilities,
  selectIsEngineChecking,
  selectModules,
  selectOcrLanguages,
  selectSystemMetrics,
  useSystemStore,
} from '@/store/useSystemStore';
import {
  BinaryModuleId,
  extractErrorMessage,
  InstallableModuleId,
  ModuleId,
  ModuleStatusInfo,
} from '@/lib/api';
import { isMutationPending } from '@/lib/fsm';
import { useI18n } from '@/i18n';

const MODULE_ORDER: ModuleId[] = [
  'ocr',
  'word_to_pdf',
  'ffmpeg',
  'yt_dlp',
  'rembg_onnx',
  'whisper_cpu',
];

const BINARY_MODULES = new Set<ModuleId>(['ocr', 'word_to_pdf', 'ffmpeg', 'yt_dlp']);

const MODULE_ICONS: Record<ModuleId, React.ComponentType<{ className?: string }>> = {
  ocr: ScanText,
  word_to_pdf: FileOutput,
  ffmpeg: Film,
  yt_dlp: DownloadCloud,
  rembg_onnx: Sparkles,
  whisper_cpu: Mic,
};

function formatEngineLabel(engine: string | null | undefined, fallback: string): string {
  if (engine === 'tesseract') return 'Tesseract OCR';
  if (engine === 'msword') return 'Microsoft Word (COM)';
  if (engine === 'libreoffice') return 'LibreOffice Headless';
  if (engine === 'ffmpeg') return 'FFmpeg + ffprobe';
  if (engine === 'yt-dlp' || engine === 'yt_dlp') return 'yt-dlp';
  if (engine === 'onnxruntime' || engine === 'rembg_onnx') return 'ONNX Runtime (u2netp)';
  if (engine === 'faster-whisper' || engine === 'whisper_cpu') return 'faster-whisper (CPU)';
  return engine || fallback;
}

export default function ModulesModal() {
  const { t } = useI18n();
  const modulesModalOpen = useSystemStore((s) => s.modulesModalOpen);
  const setModulesModalOpen = useSystemStore((s) => s.setModulesModalOpen);
  const modules = useSystemStore(selectModules);
  const capabilities = useSystemStore(selectEngineCapabilities);
  const ocrLanguages = useSystemStore(selectOcrLanguages);
  const systemMetrics = useSystemStore(selectSystemMetrics);
  const checking = useSystemStore(selectIsEngineChecking);
  const moduleMutations = useSystemStore((s) => s.moduleMutations);
  const detectModules = useSystemStore((s) => s.detectModules);
  const configureModule = useSystemStore((s) => s.configureModule);
  const pickModuleBinary = useSystemStore((s) => s.pickModuleBinary);
  const installModule = useSystemStore((s) => s.installModule);

  const [manualOpenMap, setManualOpenMap] = useState<Partial<Record<ModuleId, boolean>>>({});
  const [customPaths, setCustomPaths] = useState<Partial<Record<ModuleId, string>>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modulesModalOpen) {
        setModulesModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modulesModalOpen, setModulesModalOpen]);

  if (!modulesModalOpen) return null;

  const anyMutationActive = Object.values(moduleMutations).some((m) => isMutationPending(m));

  const getModuleInfo = (modId: ModuleId): ModuleStatusInfo => {
    const existing = modules?.[modId];
    if (existing) return existing;
    const cap = capabilities[modId];
    return {
      available: Boolean(cap),
      engine: cap ? modId : null,
      binary_path: null,
      source: cap ? 'auto' : 'none',
      languages: modId === 'ocr' ? ocrLanguages : undefined,
      has_spanish: modId === 'ocr' ? ocrLanguages.includes('spa') : undefined,
      install_status: 'idle',
      install_message: null,
    };
  };

  const handleAutoDetect = async () => {
    const res = await detectModules();
    if (res) {
      toast.success(t.modulesModal.rescanDone);
    } else {
      toast.error(t.modulesModal.rescanError);
    }
  };

  const handlePickBinary = async (mod: BinaryModuleId) => {
    try {
      const res = await pickModuleBinary(mod);
      if (res.selected) {
        toast.success(t.modulesModal.binaryLinkedToast);
      }
    } catch (err) {
      const msg = await extractErrorMessage(err, t.modulesModal.installErrorToast);
      toast.error(msg);
    }
  };

  const handleManualConfigure = async (mod: ModuleId, pathValue: string) => {
    try {
      await configureModule(mod, pathValue.trim());
      toast.success(
        pathValue.trim() ? t.modulesModal.binaryLinkedToast : t.modulesModal.binaryClearedToast
      );
      setCustomPaths((prev) => ({ ...prev, [mod]: '' }));
    } catch (err) {
      const msg = await extractErrorMessage(err, t.modulesModal.installErrorToast);
      toast.error(msg);
    }
  };

  const handleOneClickInstall = async (mod: InstallableModuleId) => {
    try {
      await installModule(mod);
      toast.success(t.modulesModal.installStartedToast);
    } catch (err) {
      const msg = await extractErrorMessage(err, t.modulesModal.installErrorToast);
      toast.error(msg);
    }
  };

  const wingetAvailable = modules?.winget_available ?? true;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modules-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) setModulesModalOpen(false);
      }}
    >
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden text-[var(--fg)]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--fg)] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="modules-modal-title"
                className="text-base font-bold text-[var(--fg)] truncate"
              >
                {t.modulesModal.title}
              </h2>
              <p className="text-xs text-[var(--fg-muted)] truncate">
                {t.modulesModal.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModulesModalOpen(false)}
            aria-label={t.common.close}
            className="p-1.5 rounded-[var(--radius-control)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-muted)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* System Telemetry Strip */}
        {systemMetrics && (
          <div className="px-6 py-2.5 border-b border-[var(--border)] bg-[var(--bg)] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[var(--fg-muted)] shrink-0">
            <span className="inline-flex items-center gap-1.5 text-[var(--fg)] font-semibold">
              <Cpu className="w-3.5 h-3.5" />
              {systemMetrics.cpu_count} vCPU · {Math.round(systemMetrics.cpu_percent)}%
            </span>
            <span>RAM {Math.round(systemMetrics.memory_used_percent)}%</span>
            <span>
              {t.home.telemetryTemp}: {systemMetrics.temp_files_count}
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-3.5 scrollbar-thin">
          {!wingetAvailable && (
            <div className="rounded-[var(--radius-control)] border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-600 dark:text-amber-300">
              {t.modulesModal.wingetUnavailable}
            </div>
          )}

          {MODULE_ORDER.map((moduleKey, idx) => {
            const info = getModuleInfo(moduleKey);
            const copy = t.modulesModal.items[moduleKey];
            const Icon = MODULE_ICONS[moduleKey];
            const isOcr = moduleKey === 'ocr';
            const isBinary = BINARY_MODULES.has(moduleKey);
            const isInstalling = info.install_status === 'installing';
            const isFailed = info.install_status === 'failed';
            const manualOpen = Boolean(manualOpenMap[moduleKey]);
            const customPath = customPaths[moduleKey] ?? '';
            const modPending = isMutationPending(moduleMutations[moduleKey]);

            return (
              <div
                key={moduleKey}
                className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center shrink-0 text-[var(--fg)]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[var(--fg)]">
                        {idx + 1}. {copy.title}
                      </h3>
                      <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                        {copy.subtitle}
                      </p>
                    </div>
                  </div>

                  {info.available ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      {t.modulesModal.statusReady}
                    </span>
                  ) : isInstalling ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--fg)]">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {t.modulesModal.statusInstalling}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300">
                      <AlertTriangle className="w-3 h-3" />
                      {t.modulesModal.statusPending}
                    </span>
                  )}
                </div>

                {(isInstalling || (info.install_message && info.install_status !== 'idle')) && (
                  <div
                    className={`rounded-[var(--radius-control)] p-3 text-xs border flex items-start gap-2 ${
                      isInstalling
                        ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--fg)]'
                        : isFailed
                        ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300'
                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {isInstalling ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 mt-0.5" />
                    ) : isFailed ? (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-semibold">
                        {isInstalling
                          ? t.modulesModal.installingBanner
                          : isFailed
                          ? t.modulesModal.installNotice
                          : t.modulesModal.installComplete}
                      </p>
                      {info.install_message && (
                        <p className="opacity-85 break-words">{info.install_message}</p>
                      )}
                    </div>
                  </div>
                )}

                {info.available ? (
                  <div className="rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] p-3 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[var(--fg-muted)]">{t.modulesModal.activeEngine}:</span>
                      <span className="font-semibold text-[var(--fg)]">
                        {formatEngineLabel(info.engine, copy.title)}
                      </span>
                    </div>

                    {info.binary_path && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 border-t border-[var(--border)]">
                        <span className="text-[var(--fg-muted)] shrink-0">
                          {t.modulesModal.linkedPath}:
                        </span>
                        <code className="font-mono text-[11px] bg-[var(--surface-muted)] px-2 py-0.5 rounded truncate max-w-full">
                          {info.binary_path}
                        </code>
                      </div>
                    )}

                    {isOcr && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border)]">
                        <span className="text-[var(--fg-muted)]">
                          {t.modulesModal.detectedLangs}:
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-semibold text-[var(--fg)]">
                            {(info.languages && info.languages.length > 0
                              ? info.languages
                              : ocrLanguages
                            ).join(', ')}
                          </span>
                          {info.has_spanish === false && (
                            <button
                              type="button"
                              disabled={isInstalling || anyMutationActive}
                              onClick={() => handleOneClickInstall('ocr_lang_spa')}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-control)] text-[11px] font-semibold disabled:opacity-50"
                              style={{
                                backgroundColor: 'var(--accent)',
                                color: 'var(--accent-fg)',
                              }}
                            >
                              <Languages className="w-3 h-3" />
                              {t.modulesModal.installSpanishBtn}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {isBinary && (
                      <div className="pt-2 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setManualOpenMap((prev) => ({
                              ...prev,
                              [moduleKey]: !manualOpen,
                            }))
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              manualOpen ? 'rotate-180' : ''
                            }`}
                          />
                          {t.modulesModal.changeBinaryManual}
                        </button>

                        {info.source === 'custom' && (
                          <button
                            type="button"
                            disabled={anyMutationActive}
                            onClick={() => handleManualConfigure(moduleKey, '')}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400"
                          >
                            <RotateCcw className="w-3 h-3" />
                            {t.modulesModal.resetAutoDetect}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[var(--fg)]">
                          {t.modulesModal.optionATitle}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[var(--surface-muted)] text-[var(--fg-muted)] border border-[var(--border)]">
                          {t.modulesModal.optionABadge}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
                        {copy.installDesc}
                      </p>
                      <button
                        type="button"
                        disabled={isInstalling || anyMutationActive}
                        onClick={() => handleOneClickInstall(moduleKey)}
                        className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-[var(--radius-control)] text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{
                          backgroundColor: 'var(--accent)',
                          color: 'var(--accent-fg)',
                        }}
                      >
                        {isInstalling || modPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isInstalling
                            ? t.modulesModal.statusInstalling
                            : t.modulesModal.optionAButton}
                        </span>
                      </button>
                    </div>

                    <div className={`grid grid-cols-1 ${isBinary ? 'sm:grid-cols-2' : ''} gap-2.5`}>
                      <div className="rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] p-3 flex flex-col justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-[var(--fg)]">
                            {t.modulesModal.optionBTitle}
                          </p>
                          <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                            {t.modulesModal.optionBDesc}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={checking || anyMutationActive}
                          onClick={handleAutoDetect}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--fg)] transition-colors disabled:opacity-50"
                        >
                          {isMutationPending(moduleMutations.detect) ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Search className="w-3.5 h-3.5" />
                          )}
                          <span>{t.modulesModal.optionBButton}</span>
                        </button>
                      </div>

                      {isBinary && (
                        <div className="rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] p-3 flex flex-col justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-[var(--fg)]">
                              {t.modulesModal.optionCTitle}
                            </p>
                            <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                              {t.modulesModal.optionCDesc}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={anyMutationActive}
                              onClick={() => handlePickBinary(moduleKey as BinaryModuleId)}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--fg)] transition-colors disabled:opacity-50"
                            >
                              {modPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <FolderOpen className="w-3.5 h-3.5" />
                              )}
                              <span>{t.modulesModal.optionCButton}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setManualOpenMap((prev) => ({
                                  ...prev,
                                  [moduleKey]: !manualOpen,
                                }))
                              }
                              aria-label={t.modulesModal.manualPathLabel}
                              className="p-1.5 rounded-[var(--radius-control)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${
                                  manualOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isBinary && manualOpen && (
                  <div className="rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] p-3 space-y-2">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
                      {t.modulesModal.manualPathLabel}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={customPath}
                        onChange={(e) =>
                          setCustomPaths((prev) => ({ ...prev, [moduleKey]: e.target.value }))
                        }
                        placeholder={copy.placeholderPath}
                        className="flex-1 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs font-mono text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      />
                      <button
                        type="button"
                        disabled={!customPath.trim() || anyMutationActive}
                        onClick={() => handleManualConfigure(moduleKey, customPath)}
                        className="px-4 py-1.5 rounded-[var(--radius-control)] text-xs font-semibold disabled:opacity-40"
                        style={{
                          backgroundColor: 'var(--accent)',
                          color: 'var(--accent-fg)',
                        }}
                      >
                        {t.modulesModal.manualPathLink}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[var(--bg)] border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            disabled={checking || anyMutationActive}
            onClick={handleAutoDetect}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--fg)] transition-colors disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{t.modulesModal.rescanSystem}</span>
          </button>

          <button
            type="button"
            onClick={() => setModulesModalOpen(false)}
            className="px-4 py-1.5 rounded-[var(--radius-control)] text-xs font-semibold"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-fg)',
            }}
          >
            {t.modulesModal.doneBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
