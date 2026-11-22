import { getToolByHref, getToolById, StudioToolItem } from '@/config/studios';
import { SessionAssetRecord } from '@/lib/api';

export interface ResolveSuggestedToolsOptions {
  activeOnly?: boolean;
  limit?: number;
}

export function resolveAssetSuggestedTools(
  asset: SessionAssetRecord,
  options: ResolveSuggestedToolsOptions = {}
): StudioToolItem[] {
  const { activeOnly = false, limit = 5 } = options;
  const items: StudioToolItem[] = [];
  const seen = new Set<string>();

  const pushIfValid = (item: StudioToolItem | undefined) => {
    if (!item) return;
    if (activeOnly && item.status !== 'active') return;
    if (seen.has(item.id)) return;
    seen.add(item.id);
    items.push(item);
  };

  for (const raw of asset.suggested_tools || []) {
    pushIfValid(getToolByHref(raw) || getToolById(raw));
  }

  if (asset.domain === 'video') {
    pushIfValid(getToolById('video-studio'));
  }

  if (asset.domain === 'pdf') {
    for (const fallbackId of ['compress-pdf', 'organize-pdf', 'split-pdf', 'ocr-pdf']) {
      if (items.length >= limit) break;
      pushIfValid(getToolById(fallbackId));
    }
  }

  if (asset.domain === 'image') {
    pushIfValid(getToolById('jpg-to-pdf'));
  }

  return items.slice(0, limit);
}

export function formatAssetTelemetry(
  metadata: Record<string, unknown>,
  maxCount = 5
): { key: string; value: string }[] {
  const entries: { key: string; value: string }[] = [];
  for (const [k, v] of Object.entries(metadata || {})) {
    if (v === null || v === undefined || v === '') continue;
    if (typeof v === 'object') {
      if (Array.isArray(v)) {
        entries.push({ key: k, value: `${v.length}` });
      }
      continue;
    }
    entries.push({ key: k, value: String(v) });
    if (entries.length >= maxCount) break;
  }
  return entries;
}
