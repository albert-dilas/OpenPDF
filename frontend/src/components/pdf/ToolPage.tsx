'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFileStore } from '@/store/useFileStore';
import { useSystemStore } from '@/store/useSystemStore';
import Uploader from '@/components/pdf/Uploader';
import SaveDialog from '@/components/pdf/SaveDialog';
import { CapabilityWarningBanner } from '@/components/system/SystemStatus';
import { useToolProcessor } from '@/hooks/useToolProcessor';
import { formatBytes } from '@/lib/api';
import {
  FileText,
  Settings2,
  X,
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface ExtraField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'select';
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
  extraFields?: ExtraField[];
  sidebarContent?: React.ReactNode;
  capabilityRequired?: 'ocr' | 'word_to_pdf';
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
  extraFields = [],
  sidebarContent,
  capabilityRequired,
}: ToolPageProps) {
  const { files, addFiles, removeFile, clearFiles } = useFileStore();
  const immersiveMode = useSystemStore((s) => s.immersiveMode);
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
    dismissSave,
  } = useToolProcessor();

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(extraFields.map((f) => [f.key, f.defaultValue ?? '']))
  );

  useEffect(() => {
    return () => {
      clearFiles();
    };
  }, [clearFiles]);

  const handleProcess = async () => {
    if (files.length === 0) return;

    for (const field of extraFields) {
      const val = fieldValues[field.key] ?? field.defaultValue ?? '';
      if (field.required && !val.trim()) {
        toast.error(field.requiredMessage ?? `El campo "${field.label}" es obligatorio.`);
        return;
      }
    }

    const formData = new FormData();
    if (useMultipleFilesField) {
      files.forEach((file) => formData.append('files', file));
    } else {
      formData.append('file', files[0]);
    }

    for (const field of extraFields) {
      const val = fieldValues[field.key] ?? field.defaultValue ?? '';
      if (val) {
        formData.append(field.key, val);
      }
    }

    const baseName = files[0].name.replace(/\.[^.]+$/, '');
    await process({
      endpoint,
      formData,
      fallbackFileName: `${baseName}_openpdf${outputExtension}`,
    });
  };

  if (files.length === 0) {
    return (
      <div
        className={`flex-grow px-4 transition-all ${
          immersiveMode
            ? 'py-6 sm:py-8 bg-gradient-to-b from-slate-100/70 to-slate-50 dark:from-[#0b111e] dark:to-[#070a12]'
            : 'py-10 sm:py-14'
        }`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-5 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-500 dark:text-slate-400 hover:text-brand dark:hover:text-brand transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Todas las herramientas
            </Link>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
            {title}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
            {description}
          </p>

          <CapabilityWarningBanner capability={capabilityRequired} />

          <Uploader onFilesSelected={addFiles} multiple={multiple} accept={accept} />
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
          onCancel={dismissSave}
        />
      )}

      <div
        className={`flex-grow flex flex-col lg:flex-row ${
          immersiveMode
            ? 'bg-gradient-to-br from-slate-100/70 via-slate-50 to-slate-100/50 dark:from-[#0b111e] dark:via-[#090d16] dark:to-[#060911]'
            : ''
        }`}
      >
        {/* Main Workspace */}
        <div className={`flex-1 overflow-y-auto ${immersiveMode ? 'p-4 sm:p-6' : 'p-4 sm:p-8'}`}>
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-brand mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver a herramientas
                </Link>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {title}
                </h1>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={clearFiles}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Quitar {files.length > 1 ? 'todos' : 'archivo'}
              </button>
            </div>

            <CapabilityWarningBanner capability={capabilityRequired} />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {files.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className={`relative group bg-white dark:bg-slate-900 rounded-2xl shadow-card p-5 flex flex-col items-center justify-center border transition-all ${
                    isProcessing
                      ? 'border-gray-200 dark:border-slate-800 opacity-60'
                      : 'border-gray-200/80 dark:border-slate-800 hover:border-brand/60 hover:shadow-md'
                  }`}
                >
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400">
                    #{idx + 1}
                  </span>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => removeFile(idx)}
                    className="absolute top-2.5 right-2.5 bg-red-50 dark:bg-slate-800 hover:bg-brand text-gray-500 dark:text-slate-300 hover:text-white rounded-xl p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    aria-label={`Eliminar archivo ${file.name}`}
                  >
                    <X size={15} />
                  </button>

                  <div className="p-4 rounded-2xl bg-red-50/80 dark:bg-brand/15 my-3">
                    {showImageIcon ? (
                      <ImageIcon className="text-brand w-10 h-10" />
                    ) : (
                      <FileText className="text-brand w-10 h-10" />
                    )}
                  </div>

                  <p
                    className="text-xs sm:text-sm text-center font-semibold text-gray-900 dark:text-slate-100 truncate w-full px-1"
                    title={file.name}
                  >
                    {file.name}
                  </p>
                  <span className="mt-1 text-[11px] font-medium text-gray-400 dark:text-slate-500">
                    {formatBytes(file.size)}
                  </span>
                </div>
              ))}

              {multiple && (
                <label className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center p-6 min-h-[180px] cursor-pointer hover:bg-red-50/40 dark:hover:bg-slate-900 hover:border-brand hover:text-brand text-gray-500 dark:text-slate-400 transition-all">
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
                  <Plus className="w-8 h-8 mb-2" />
                  <span className="text-xs sm:text-sm font-semibold">Añadir más archivos</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Options Sidebar (Right on Desktop, Bottom on Mobile) */}
        <aside className="w-full lg:w-96 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-slate-800 shadow-xl flex flex-col shrink-0">
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
            <Settings2 className="text-brand w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Configuración
            </h2>
          </div>

          <div className="p-5 sm:p-6 flex-1 space-y-4 overflow-y-auto">
            {extraFields.length === 0 && !sidebarContent && (
              <div className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-200/70 dark:border-slate-800">
                Listo para procesar localmente. Haz clic en <strong>{buttonLabel}</strong> para
                generar el documento.
              </div>
            )}

            {extraFields.map((field) => {
              const currentValue = fieldValues[field.key] ?? field.defaultValue ?? '';
              return (
                <div key={field.key}>
                  <label
                    htmlFor={`field-${field.key}`}
                    className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5"
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
                      className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`field-${field.key}`}
                      type={field.type}
                      value={currentValue}
                      onChange={(e) =>
                        setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
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
                className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/70 rounded-xl p-3.5 text-xs sm:text-sm text-red-700 dark:text-red-300"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="p-5 sm:p-6 bg-gray-50/80 dark:bg-slate-900/90 border-t border-gray-200 dark:border-slate-800 space-y-3">
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-medium text-gray-600 dark:text-slate-300">
                  <span>
                    {status === 'uploading'
                      ? 'Fase 1/2: Subiendo archivo...'
                      : 'Fase 2/2: Procesando en motor local...'}
                  </span>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <span className="font-mono font-bold">{uploadProgress}%</span>
                  )}
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`bg-brand h-2 rounded-full transition-all duration-300 ${
                      status === 'processing' ? 'animate-pulse w-full' : ''
                    }`}
                    style={{
                      width: status === 'processing' ? '100%' : `${uploadProgress}%`,
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={cancel}
                  className="w-full py-2 rounded-xl border border-gray-300 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar operación
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleProcess}
              className="w-full bg-brand hover:bg-brand-dark disabled:bg-gray-400 dark:disabled:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand/20 text-base sm:text-lg transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {isProcessing && <Loader2 className="animate-spin" size={20} />}
              <span>{isProcessing ? processStatus || 'Procesando...' : buttonLabel}</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
