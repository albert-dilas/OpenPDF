'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useFileStore } from '@/store/useFileStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { selectAssets, useWorkspaceStore } from '@/store/useWorkspaceStore';
import Uploader from '@/components/pdf/Uploader';
import SaveDialog from '@/components/pdf/SaveDialog';
import { CapabilityWarningBanner } from '@/components/system/SystemStatus';
import { useToolProcessor } from '@/hooks/useToolProcessor';
import { formatBytes, SessionAssetRecord } from '@/lib/api';
import { isMutationPending, MutationState } from '@/lib/fsm';
import { selectDesktopConfig, useSystemStore } from '@/store/useSystemStore';
import { getToolByHref, ModuleRequirement } from '@/config/studios';
import { useI18n } from '@/i18n';
import {
  FileText,
  Settings2,
  X,
  Image as ImageIcon,
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { AsyncButton, ProgressBar } from '@/components/ui/Loaders';
import toast from 'react-hot-toast';

export interface ExtraField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'textarea';
  placeholder?: string;
  defaultValue?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  requiredMessage?: string;
}

interface ToolPageProps {
  title: string;
  description: string;
  endpoint: string;
  buttonLabel: string;
  multiple?: boolean;
  accept?: string;
  useMultipleFilesField?: boolean;
  outputExtension?: string;
  showImageIcon?: boolean;
  allowWithoutFile?: boolean;
  extraFields?: ExtraField[];
  sidebarContent?: React.ReactNode;
  capabilityRequired?: ModuleRequirement;
}

export default function ToolPage({
  title,
  description,
  endpoint,
  buttonLabel,
  multiple = false,
  accept = '.pdf',
  useMultipleFilesField = false,
  outputExtension = '.pdf',
  showImageIcon = false,
  allowWithoutFile = false,
  extraFields = [],
  sidebarContent,
  capabilityRequired,
}: ToolPageProps) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { t } = useI18n();
  const { files, addFiles, removeFile, clearFiles } = useFileStore();

  const sessionAssets = useWorkspaceStore(selectAssets);
  const pendingChainedAsset = useWorkspaceStore((s) => s.pendingChainedAsset);
  const clearPendingChainedAsset = useWorkspaceStore((s) => s.clearPendingChainedAsset);
  const downloadAssetUrl = useWorkspaceStore((s) => s.downloadAssetUrl);
  const inspectAndAddFiles = useWorkspaceStore((s) => s.inspectAndAddFiles);

  const desktopConfig = useSystemStore(selectDesktopConfig);

  const {
    status,
    isProcessing,
    uploadProgress,
    processStatus,
    error,
    pendingBlob,
    defaultFileName,
    process,
    cancel,
    handleSave,
    handleSaveFixedFolder,
    dismissSave,
  } = useToolProcessor();

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(extraFields.map((f) => [f.key, f.defaultValue ?? '']))
  );
  const [sessionMutation, setSessionMutation] = useState<MutationState>({ status: 'idle' });
  const [fixedSaveMutation, setFixedSaveMutation] = useState<MutationState>({ status: 'idle' });

  const matchedTool = useMemo(() => getToolByHref(pathname), [pathname]);
  const backHref = matchedTool ? `/studios/${matchedTool.studio}` : '/studios/documents';
  const backLabel = matchedTool
    ? `${t.studios[matchedTool.studio]?.name ?? 'Estudio'}`
    : t.studios.documents.name;

  // Filter session assets compatible with this tool's accept list
  const compatibleSessionAssets = useMemo(() => {
    if (!sessionAssets.length) return [];
    const exts = accept
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.startsWith('.'));
    if (exts.length === 0) return sessionAssets.slice(0, 6);
    return sessionAssets
      .filter((a) => exts.some((ext) => a.filename.toLowerCase().endsWith(ext)))
      .slice(0, 6);
  }, [accept, sessionAssets]);

  const handleLoadSessionAsset = async (asset: SessionAssetRecord) => {
    try {
      const res = await fetch(downloadAssetUrl(asset.id));
      if (!res.ok) throw new Error('No se pudo cargar el archivo de la sesión.');
      const blob = await res.blob();
      const loadedFile = new File([blob], asset.filename, {
        type: asset.mime_type || blob.type || 'application/octet-stream',
      });
      addFiles([loadedFile]);
      toast.success(`Cargado desde la sesión: ${asset.filename}`);
    } catch {
      toast.error('No se pudo recuperar el archivo de la sesión.');
    }
  };

  // Automatically consume pending chained asset when navigating from Home or Session Files
  useEffect(() => {
    if (!pendingChainedAsset) return;
    const cleanPath = pathname.replace(/\/+$/, '') || '/';
    if (pendingChainedAsset.targetHref === cleanPath) {
      const targetAsset = pendingChainedAsset.asset;
      clearPendingChainedAsset();
      handleLoadSessionAsset(targetAsset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, pendingChainedAsset]);

  useEffect(() => {
    return () => {
      clearFiles();
    };
  }, [clearFiles]);

  const handleSaveToSessionAndContinue = async (fileName: string) => {
    if (!pendingBlob) return;
    setSessionMutation({ status: 'pending' });
    try {
      const fileObj = new File([pendingBlob], fileName, {
        type: pendingBlob.type || 'application/octet-stream',
      });
      await inspectAndAddFiles([fileObj]);
      setSessionMutation({ status: 'success', data: undefined });
      dismissSave();
      clearFiles();
      toast.success(`Guardado en Archivos de Sesión: ${fileName}`);
      router.push('/workspace');
    } catch {
      setSessionMutation({ status: 'error', error: 'session_save_failed' });
      toast.error('No se pudo guardar el resultado en Archivos de Sesión.');
    }
  };

  const handleSaveFixedAndReset = async (fileName: string) => {
    setFixedSaveMutation({ status: 'pending' });
    const ok = await handleSaveFixedFolder(fileName, clearFiles);
    setFixedSaveMutation(ok ? { status: 'success', data: undefined } : { status: 'error', error: 'fixed_save_failed' });
    return ok;
  };

  const handleProcess = async () => {
    if (!allowWithoutFile && files.length === 0) return;

    for (const field of extraFields) {
      const val = fieldValues[field.key] ?? field.defaultValue ?? '';
      if (field.required && !val.trim()) {
        toast.error(field.requiredMessage ?? `El campo "${field.label}" es obligatorio.`);
        return;
      }
    }

    const formData = new FormData();
    if (files.length > 0) {
      if (useMultipleFilesField) {
        files.forEach((file) => formData.append('files', file));
      } else {
        formData.append('file', files[0]);
      }
    }

    for (const field of extraFields) {
      const val = fieldValues[field.key] ?? field.defaultValue ?? '';
      if (val) {
        formData.append(field.key, val);
      }
    }

    const baseName =
      files.length > 0 ? files[0].name.replace(/\.[^.]+$/, '') : matchedTool?.id ?? 'resultado';
    const pattern = useSettingsStore.getState().outputFilenamePattern || '{name}_procesado';
    const formattedName = pattern.includes('{name}')
      ? pattern.replace('{name}', baseName)
      : `${baseName}_${pattern}`;

    const totalInputBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);

    await process({
      endpoint,
      formData,
      fallbackFileName: `${formattedName}${outputExtension}`,
      inputBytes: totalInputBytes,
    });
  };

  if (!allowWithoutFile && files.length === 0) {
    return (
      <div className="flex-grow px-4 py-10 sm:py-12 bg-[var(--bg)] text-[var(--fg)]">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <div className="flex justify-center">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{backLabel}</span>
            </Link>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--fg)] tracking-tight mb-2.5">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-[var(--fg-muted)] max-w-2xl mx-auto">
              {description}
            </p>
          </div>

          <CapabilityWarningBanner capability={capabilityRequired} />

          <Uploader onFilesSelected={addFiles} multiple={multiple} accept={accept} />

          {/* 1-Click Picker from Session Files */}
          {compatibleSessionAssets.length > 0 && (
            <div className="max-w-2xl mx-auto rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 text-left space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--fg)] inline-flex items-center gap-1.5">
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Cargar en 1 clic desde Archivos de la Sesión:</span>
                </span>
                <Link
                  href="/workspace"
                  className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] underline"
                >
                  Ver todos
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {compatibleSessionAssets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => handleLoadSessionAsset(asset)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)] text-xs font-medium text-[var(--fg)] transition-colors"
                  >
                    <span className="truncate max-w-[200px]">{asset.filename}</span>
                    <span className="text-[10px] font-mono text-[var(--fg-muted)]">
                      {formatBytes(asset.size_bytes)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {pendingBlob && (
        <SaveDialog
          defaultName={defaultFileName}
          blobSize={pendingBlob.size}
          onConfirm={(fileName) => handleSave(fileName, clearFiles)}
          onSaveToSession={handleSaveToSessionAndContinue}
          savingToSession={isMutationPending(sessionMutation)}
          onSaveFixedFolder={handleSaveFixedAndReset}
          savingToFixedFolder={isMutationPending(fixedSaveMutation)}
          saveMode={desktopConfig?.save_mode ?? 'ask'}
          defaultOutputDir={desktopConfig?.default_output_dir}
          onCancel={dismissSave}
        />
      )}

      <div className="flex-grow flex flex-col lg:flex-row bg-[var(--bg)] text-[var(--fg)]">
        {/* Main Workspace */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-7">
          <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{backLabel}</span>
                </Link>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--fg)] tracking-tight">
                  {title}
                </h1>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5">{description}</p>
              </div>

              {files.length > 0 && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={clearFiles}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] text-xs font-medium text-[var(--fg)] bg-[var(--surface)] border border-[var(--border)] hover:border-red-500/50 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Quitar {files.length > 1 ? 'todos' : 'archivo'}
                </button>
              )}
            </div>

            <CapabilityWarningBanner capability={capabilityRequired} />

            {files.length === 0 && allowWithoutFile ? (
              <div className="space-y-4">
                <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 text-xs text-[var(--fg-muted)]">
                  Completa los parámetros en el panel derecho para ejecutar <strong className="text-[var(--fg)]">{title}</strong> directamente, o carga un archivo opcional a continuación:
                </div>
                <Uploader onFilesSelected={addFiles} multiple={multiple} accept={accept} />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {files.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className={`relative group bg-[var(--surface)] rounded-[var(--radius-card)] p-5 flex flex-col items-center justify-center border transition-all ${
                      isProcessing
                        ? 'border-[var(--border)] opacity-60'
                        : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--fg-muted)]">
                      #{idx + 1}
                    </span>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => removeFile(idx)}
                      className="absolute top-2.5 right-2.5 bg-[var(--surface-muted)] hover:bg-red-500 text-[var(--fg-muted)] hover:text-white rounded-[var(--radius-control)] p-1.5 transition-colors"
                      aria-label={`Eliminar archivo ${file.name}`}
                    >
                      <X size={14} />
                    </button>

                    <div className="p-3.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-muted)] my-3 text-[var(--fg)]">
                      {showImageIcon ? (
                        <ImageIcon className="w-8 h-8" />
                      ) : (
                        <FileText className="w-8 h-8" />
                      )}
                    </div>

                    <p
                      className="text-xs sm:text-sm text-center font-medium text-[var(--fg)] truncate w-full px-1"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <span className="mt-1 text-[11px] font-mono text-[var(--fg-muted)]">
                      {formatBytes(file.size)}
                    </span>
                  </div>
                ))}

                {multiple && (
                  <label className="border border-dashed border-[var(--border-strong)] rounded-[var(--radius-card)] bg-[var(--surface)] flex flex-col items-center justify-center p-6 min-h-[176px] cursor-pointer hover:border-[var(--accent)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept={accept}
                      disabled={isProcessing}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          addFiles(Array.from(e.target.files));
                          e.target.value = '';
                        }
                      }}
                    />
                    <Plus className="w-6 h-6 mb-2" />
                    <span className="text-xs font-medium">Añadir más archivos</span>
                  </label>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Options Inspector */}
        <aside className="w-full lg:w-96 bg-[var(--surface)] border-t lg:border-t-0 lg:border-l border-[var(--border)] flex flex-col shrink-0">
          <div className="p-5 border-b border-[var(--border)] flex items-center gap-2.5">
            <Settings2 className="w-4 h-4 text-[var(--fg)]" />
            <h2 className="text-sm font-semibold text-[var(--fg)]">Configuración</h2>
          </div>

          <div className="p-5 flex-1 space-y-4 overflow-y-auto">
            {extraFields.length === 0 && !sidebarContent && (
              <div className="text-xs text-[var(--fg-muted)] bg-[var(--bg)] p-3.5 rounded-[var(--radius-control)] border border-[var(--border)]">
                Listo para procesar localmente. Pulsa{' '}
                <strong className="text-[var(--fg)]">{buttonLabel}</strong> para generar el
                archivo.
              </div>
            )}

            {extraFields.map((field) => {
              const currentValue = fieldValues[field.key] ?? field.defaultValue ?? '';
              return (
                <div key={field.key}>
                  <label
                    htmlFor={`field-${field.key}`}
                    className="block text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)] mb-1.5"
                  >
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      id={`field-${field.key}`}
                      value={currentValue}
                      onChange={(e) =>
                        setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className="w-full border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] rounded-[var(--radius-control)] p-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    >
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      id={`field-${field.key}`}
                      rows={4}
                      value={currentValue}
                      onChange={(e) =>
                        setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className="w-full border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] rounded-[var(--radius-control)] p-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input
                      id={`field-${field.key}`}
                      type={field.type}
                      value={currentValue}
                      onChange={(e) =>
                        setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className="w-full border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] rounded-[var(--radius-control)] p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              );
            })}

            {sidebarContent}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-[var(--radius-control)] p-3 text-xs text-red-600 dark:text-red-300"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="p-5 bg-[var(--bg)] border-t border-[var(--border)] space-y-3">
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-[var(--fg-muted)]">
                  <span>
                    {status === 'uploading'
                      ? 'Subiendo archivo...'
                      : 'Procesando en motor local...'}
                  </span>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <span className="font-mono font-semibold text-[var(--fg)]">
                      {uploadProgress}%
                    </span>
                  )}
                </div>
                <ProgressBar
                  value={status === 'uploading' ? uploadProgress : undefined}
                  indeterminate={status === 'processing'}
                />
                <button
                  type="button"
                  onClick={cancel}
                  className="w-full py-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--fg)] hover:border-[var(--border-strong)] transition-colors"
                >
                  Cancelar operación
                </button>
              </div>
            )}

            <AsyncButton
              pending={isProcessing}
              pendingLabel={processStatus || 'Procesando...'}
              onClick={handleProcess}
              className="w-full font-semibold py-3.5 rounded-[var(--radius-control)] text-sm hover:opacity-90"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-fg)',
              }}
            >
              {buttonLabel}
            </AsyncButton>
          </div>
        </aside>
      </div>
    </>
  );
}
