'use client';

import React from 'react';
import { Film, Inbox } from 'lucide-react';
import { formatBytes, SessionAssetRecord } from '@/lib/api';
import { useI18n } from '@/i18n';

interface VideoTrayPickerProps {
  assets: SessionAssetRecord[];
  onSelect: (asset: SessionAssetRecord) => void;
}

export default function VideoTrayPicker({ assets, onSelect }: VideoTrayPickerProps) {
  const { t } = useI18n();
  if (assets.length === 0) return null;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-[var(--fg)]">
        <Inbox className="w-4 h-4" />
        <span>{t.videoStudio.pickFromTray}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {assets.map((asset) => (
          <button
            key={asset.id}
            type="button"
            onClick={() => onSelect(asset)}
            className="p-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)] flex items-center justify-between gap-3 text-left transition-colors"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--fg)] truncate">
                {asset.filename}
              </p>
              <p className="text-[11px] font-mono text-[var(--fg-muted)]">
                {formatBytes(asset.size_bytes)}
              </p>
            </div>
            <Film className="w-4 h-4 text-[var(--fg-muted)] shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
