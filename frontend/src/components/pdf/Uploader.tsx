'use client';

import { useState, useRef } from 'react';
import { FilePlus, UploadCloud, AlertCircle, ShieldCheck } from 'lucide-react';
import { useSystemStore } from '@/store/useSystemStore';

interface UploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
}

export default function Uploader({
  onFilesSelected,
  accept = '.pdf',
  multiple = true,
}: UploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxFileSizeMb = useSystemStore((s) => s.maxFileSizeMb);

  const allowedExtensions = accept
    .split(',')
    .map((ext) => ext.trim().toLowerCase())
    .filter(Boolean);

  const validateAndSelect = (rawFiles: File[]) => {
    setValidationError(null);
    if (!rawFiles.length) return;

    const maxBytes = maxFileSizeMb * 1024 * 1024;
    const validFiles: File[] = [];

    for (const file of rawFiles) {
      const lowerName = file.name.toLowerCase();
      const matchesExt =
        allowedExtensions.length === 0 ||
        allowedExtensions.some((ext) => lowerName.endsWith(ext));

      if (!matchesExt) {
        setValidationError(
          `Formato no compatible (${file.name}). Formatos admitidos: ${allowedExtensions
            .join(', ')
            .toUpperCase()}`
        );
        continue;
      }

      if (file.size > maxBytes) {
        setValidationError(
          `El archivo "${file.name}" supera el límite de ${maxFileSizeMb} MB.`
        );
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesSelected(multiple ? validFiles : [validFiles[0]]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div className="mt-6 max-w-3xl w-full mx-auto">
      <div
        role="button"
        tabIndex={0}
        aria-label={multiple ? 'Seleccionar o arrastrar archivos' : 'Seleccionar o arrastrar un archivo'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`group relative flex flex-col items-center justify-center p-10 sm:p-14 border-2 border-dashed rounded-3xl transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 ${
          validationError
            ? 'border-red-400 bg-red-50/60 dark:border-red-700 dark:bg-red-950/20'
            : isDragging
            ? 'border-brand bg-red-50/80 dark:bg-brand/10 scale-[1.01] shadow-xl'
            : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 hover:border-brand/70 dark:hover:border-brand/70 hover:bg-red-50/20 dark:hover:bg-slate-900 shadow-card'
        }`}
      >
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleChange}
          accept={accept}
          multiple={multiple}
        />

        <div
          className={`mb-5 p-4 rounded-2xl transition-transform duration-200 group-hover:scale-105 ${
            isDragging
              ? 'bg-brand text-white'
              : 'bg-red-50 dark:bg-brand/15 text-brand'
          }`}
        >
          <UploadCloud className="w-10 h-10" />
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="bg-brand hover:bg-brand-dark text-white font-bold py-4 px-8 sm:px-10 rounded-2xl text-lg sm:text-xl mb-3 shadow-lg shadow-brand/20 flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
        >
          <FilePlus className="w-6 h-6 shrink-0" />
          <span>{multiple ? 'Seleccionar archivos' : 'Seleccionar archivo'}</span>
        </button>

        <p className="text-gray-500 dark:text-slate-400 text-sm sm:text-base font-medium">
          o arrastra y suelta {multiple ? 'tus documentos' : 'tu documento'} aquí
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-400 dark:text-slate-500">
          <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 font-semibold">
            Formatos: {allowedExtensions.join(', ').toUpperCase()}
          </span>
          <span>·</span>
          <span>Máx. {maxFileSizeMb} MB</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Local
          </span>
        </div>
      </div>

      {validationError && (
        <div
          role="alert"
          className="mt-3 flex items-center justify-center gap-2 text-xs sm:text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/70 rounded-xl px-4 py-2.5 animate-fade-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
