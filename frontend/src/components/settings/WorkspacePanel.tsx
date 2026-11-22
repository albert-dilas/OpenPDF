'use client';

import React, { useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Pin,
  Copy,
  Download,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettingsStore } from '@/store/useSettingsStore';
import { ACTIVE_STUDIO_TOOLS, StudioId } from '@/config/studios';
import { useI18n } from '@/i18n';

export default function WorkspacePanel() {
  const { t } = useI18n();
  const {
    enabledStudios,
    studioOrder,
    pinnedToolIds,
    toggleStudio,
    moveStudio,
    togglePinTool,
    exportProfileJson,
    importProfileJson,
  } = useSettingsStore();

  const [importDraft, setImportDraft] = useState('');

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(exportProfileJson());
      toast.success(t.settings.workspace.exportCopied);
    } catch {
      toast.error('Clipboard unavailable.');
    }
  };

  const handleDownloadJson = () => {
    const content = exportProfileJson();
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tornio-profile-v3.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    if (!importDraft.trim()) return;
    const res = importProfileJson(importDraft);
    if (res.ok) {
      toast.success(t.settings.workspace.importSuccess);
      setImportDraft('');
    } else {
      toast.error(res.error || 'Invalid JSON profile.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Studio Visibility & Order */}
      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--fg)]">
            {t.settings.workspace.studiosTitle}
          </h2>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            {t.settings.workspace.studiosDesc}
          </p>
        </div>

        <div className="space-y-2">
          {studioOrder.map((studioId: StudioId, idx: number) => {
            const enabled = enabledStudios.includes(studioId);
            const copy = t.studios[studioId];
            return (
              <div
                key={studioId}
                className="flex items-center justify-between gap-3 p-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)]"
              >
                <label className="flex items-center gap-3 min-w-0 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggleStudio(studioId)}
                    className="h-4 w-4 rounded border-[var(--border-strong)]"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-[var(--fg)] block truncate">
                      {copy.name}
                    </span>
                    <span className="text-[11px] text-[var(--fg-muted)] block truncate">
                      {copy.tagline}
                    </span>
                  </div>
                </label>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveStudio(studioId, 'up')}
                    title={t.settings.workspace.moveUp}
                    aria-label={t.settings.workspace.moveUp}
                    className="p-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === studioOrder.length - 1}
                    onClick={() => moveStudio(studioId, 'down')}
                    title={t.settings.workspace.moveDown}
                    aria-label={t.settings.workspace.moveDown}
                    className="p-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pinned Tools (Alt+1..9) */}
      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-[var(--fg)]">
              {t.settings.workspace.pinnedTitle}
            </h2>
            <p className="text-xs text-[var(--fg-muted)] mt-0.5">
              {t.settings.workspace.pinnedDesc}
            </p>
          </div>
          <span className="text-[11px] font-mono text-[var(--fg-muted)]">
            {pinnedToolIds.length}/9 · {t.settings.workspace.maxPinsNote}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ACTIVE_STUDIO_TOOLS.map((tool) => {
            const pinIdx = pinnedToolIds.indexOf(tool.id);
            const isPinned = pinIdx !== -1;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => togglePinTool(tool.id)}
                className={`p-2.5 rounded-[var(--radius-control)] border text-left flex items-center justify-between gap-2 transition-colors ${
                  isPinned
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--fg)]'
                    : 'border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                <span className="text-xs font-medium truncate">
                  {t.tools[tool.id]?.name ?? tool.id}
                </span>
                {isPinned ? (
                  <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border border-[var(--accent-border)] bg-[var(--surface)] text-[var(--fg)] shrink-0">
                    Alt+{pinIdx + 1}
                  </kbd>
                ) : (
                  <Pin className="w-3 h-3 opacity-50 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Export / Import JSON */}
      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--fg)]">
            {t.settings.workspace.profileTitle}
          </h2>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            {t.settings.workspace.profileDesc}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopyJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--fg)]"
          >
            <Copy className="w-3.5 h-3.5" />
            {t.settings.workspace.exportJsonBtn}
          </button>
          <button
            type="button"
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--fg)]"
          >
            <Download className="w-3.5 h-3.5" />
            {t.settings.workspace.downloadJsonBtn}
          </button>
        </div>

        <div className="space-y-2 pt-2 border-t border-[var(--border)]">
          <textarea
            rows={4}
            value={importDraft}
            onChange={(e) => setImportDraft(e.target.value)}
            placeholder={t.settings.workspace.importPlaceholder}
            className="w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] p-3 text-xs font-mono text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <button
            type="button"
            disabled={!importDraft.trim()}
            onClick={handleImportJson}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-control)] text-xs font-semibold disabled:opacity-40"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            <Upload className="w-3.5 h-3.5" />
            {t.settings.workspace.importBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
