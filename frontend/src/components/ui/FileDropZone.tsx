'use client';

import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  AlertCircle,
  WifiOff,
  FilePlus,
  X,
} from 'lucide-react';
import { ProgressBar, ProgressRing } from '@/components/ui/Loaders';

export type DropZoneVariant = 'bar' | 'canvas' | 'compact';
export type DropZoneInteractionState =
  | 'idle'
  | 'dragging'
  | 'pending'
  | 'offline'
  | 'error';

interface FileDropZoneProps {
  variant?: DropZoneVariant;
  interactionState?: DropZoneInteractionState;
  onFilesSelected: (files: File[]) => void;
  onAbort?: () => void;
  accept?: string;
  multiple?: boolean;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  pendingLabel?: string;
  abortLabel?: string;
  hint?: string;
  errorMessage?: string | null;
  offlineMessage?: string;
  ariaLabel?: string;
  footerSlot?: React.ReactNode;
}

export default function FileDropZone({
  variant = 'canvas',
  interactionState = 'idle',
  onFilesSelected,
  onAbort,
  accept,
  multiple = true,
  title,
  subtitle,
  buttonLabel = 'Browse',
  pendingLabel = 'Processing...',
  abortLabel = 'Cancel',
  hint,
  errorMessage,
  offlineMessage = 'Local engine offline',
  ariaLabel = 'Drop or select files',
  footerSlot,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [localDragging, setLocalDragging] = useState(false);

  const effectiveState: DropZoneInteractionState =
    interactionState === 'idle' && localDragging ? 'dragging' : interactionState;

  const isPending = effectiveState === 'pending';
  const isDragging = effectiveState === 'dragging';
  const isOffline = effectiveState === 'offline';
  const isError = effectiveState === 'error';

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setLocalDragging(true);
    } else if (e.type === 'dragleave') {
      setLocalDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLocalDragging(false);
    if (isPending) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const list = Array.from(e.dataTransfer.files);
      onFilesSelected(multiple ? list : [list[0]]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const list = Array.from(e.target.files);
      onFilesSelected(multiple ? list : [list[0]]);
      e.target.value = '';
    }
  };

  const borderClass = isError
    ? 'border-red-500/60 bg-red-500/5'
    : isOffline
    ? 'border-amber-500/50 bg-amber-500/5'
    : isDragging
    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
    : 'border-[var(--border-strong)] bg-[var(--surface)] hover:border-[var(--fg-muted)]';

  if (variant === 'bar') {
    return (
      <div className="space-y-2">
        <div
          role="button"
          tabIndex={0}
          aria-label={ariaLabel}
          onClick={() => !isPending && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !isPending) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`rounded-[var(--radius-card)] border border-dashed px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${borderClass}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            className="hidden"
            onChange={handleChange}
          />

          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] shrink-0 flex items-center justify-center">
              {isPending ? (
                <ProgressRing size={18} indeterminate />
              ) : isOffline ? (
                <WifiOff className="w-4 h-4 text-amber-500" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              {title && (
                <p className="text-xs font-semibold text-[var(--fg)] truncate">{title}</p>
              )}
              <p className="text-xs text-[var(--fg-muted)] truncate">
                {isPending
                  ? pendingLabel
                  : isOffline
                  ? offlineMessage
                  : subtitle || hint}
              </p>
              {isPending && <ProgressBar indeterminate className="max-w-xs" />}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isPending && onAbort ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAbort();
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] text-xs font-medium text-[var(--fg)] hover:border-red-500/50"
              >
                <X className="w-3.5 h-3.5" />
                <span>{abortLabel}</span>
              </button>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] text-xs font-semibold"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>{buttonLabel}</span>
              </span>
            )}
          </div>
        </div>

        {isError && errorMessage && (
          <div
            role="alert"
            className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-[var(--radius-control)] px-3 py-2"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        <div
          role="button"
          tabIndex={0}
          aria-label={ariaLabel}
          onClick={() => !isPending && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !isPending) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`rounded-[var(--radius-card)] border border-dashed p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${borderClass}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            className="hidden"
            onChange={handleChange}
          />
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {isPending ? (
              <ProgressRing size={20} indeterminate />
            ) : (
              <UploadCloud className="w-4 h-4 text-[var(--fg-muted)] shrink-0" />
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-medium text-[var(--fg)] truncate">
                {isPending ? pendingLabel : title || subtitle}
              </p>
              {isPending ? (
                <ProgressBar indeterminate className="max-w-xs" />
              ) : (
                hint && (
                  <p className="text-[11px] font-mono text-[var(--fg-muted)] truncate">{hint}</p>
                )
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            {footerSlot}
            {isPending && onAbort ? (
              <button
                type="button"
                onClick={onAbort}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] text-xs font-medium text-[var(--fg)]"
              >
                <X className="w-3.5 h-3.5" />
                {abortLabel}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] text-xs font-semibold"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
              >
                <FilePlus className="w-3.5 h-3.5" />
                {buttonLabel}
              </button>
            )}
          </div>
        </div>
        {isError && errorMessage && (
          <div
            role="alert"
            className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-[var(--radius-control)] px-3 py-2"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // Default: 'canvas'
  return (
    <div className="w-full space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onClick={() => !isPending && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isPending) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`group rounded-[var(--radius-card)] border border-dashed p-10 sm:p-14 flex flex-col items-center justify-center text-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${borderClass}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleChange}
        />

        <div className="mb-4 p-3.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--fg)] transition-transform duration-200 group-hover:scale-105">
          {isPending ? (
            <ProgressRing size={30} indeterminate />
          ) : isOffline ? (
            <WifiOff className="w-8 h-8 text-amber-500" />
          ) : (
            <UploadCloud className="w-8 h-8" />
          )}
        </div>

        {title && (
          <h2 className="text-base font-semibold text-[var(--fg)] mb-1">{title}</h2>
        )}
        {subtitle && (
          <p className="text-xs text-[var(--fg-muted)] max-w-md mb-5">{subtitle}</p>
        )}

        {isPending && (
          <ProgressBar indeterminate className="max-w-[220px] mb-4" />
        )}

        {isPending && onAbort ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAbort();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] text-xs sm:text-sm font-semibold text-[var(--fg)]"
          >
            <X className="w-4 h-4" />
            <span>{abortLabel}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius-control)] text-xs sm:text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            <FilePlus className="w-4 h-4 shrink-0" />
            <span>{isPending ? pendingLabel : buttonLabel}</span>
          </button>
        )}

        {hint && (
          <div className="mt-4 text-[11px] font-mono text-[var(--fg-muted)]">{hint}</div>
        )}
        {footerSlot && <div className="mt-4">{footerSlot}</div>}
      </div>

      {isError && errorMessage && (
        <div
          role="alert"
          className="flex items-center justify-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-[var(--radius-control)] px-4 py-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
