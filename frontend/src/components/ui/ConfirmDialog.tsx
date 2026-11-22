'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 space-y-4 text-[var(--fg)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-[var(--radius-control)] border shrink-0 ${
                destructive
                  ? 'border-red-500/30 bg-red-500/10 text-red-500'
                  : 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--fg)]'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 id="confirm-dialog-title" className="text-sm font-semibold text-[var(--fg)]">
                {title}
              </h3>
              <p className="text-xs text-[var(--fg-muted)] mt-1 leading-relaxed">{message}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label={cancelLabel}
            className="p-1 rounded-[var(--radius-control)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] text-xs font-medium text-[var(--fg)]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-3.5 py-1.5 rounded-[var(--radius-control)] text-xs font-semibold ${
              destructive ? 'bg-red-600 text-white hover:bg-red-700' : ''
            }`}
            style={
              destructive
                ? undefined
                : { backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
