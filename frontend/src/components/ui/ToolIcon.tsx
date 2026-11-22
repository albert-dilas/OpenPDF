import React from 'react';
import {
  Activity,
  AppWindow,
  Archive,
  AudioLines,
  AudioWaveform,
  Blocks,
  Braces,
  Captions,
  Clapperboard,
  Combine,
  Crop,
  Disc3,
  DownloadCloud,
  Eraser,
  EyeOff,
  FastForward,
  FileCode2,
  FileDiff,
  FileDown,
  FileOutput,
  FileSearch,
  FileSliders,
  FileText,
  Film,
  Fingerprint,
  Gauge,
  GitCompare,
  Globe,
  Grid,
  Hash,
  ImagePlus,
  Images,
  KeyRound,
  Languages,
  Layers,
  LayoutGrid,
  Lock,
  Mic,
  Minimize2,
  Palette,
  PenTool,
  QrCode,
  RotateCw,
  ScanText,
  Scissors,
  ShieldCheck,
  ShieldOff,
  SlidersHorizontal,
  Sparkles,
  Stamp,
  Table,
  Tags,
  Unlock,
  Volume2,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { StudioId } from '@/config/studios';
import { STUDIO_PALETTES } from '@/lib/studio-palettes';

export type ToolIconId =
  | 'combine'
  | 'scissors'
  | 'layout-grid'
  | 'grid'
  | 'rotate-cw'
  | 'file-down'
  | 'scan-text'
  | 'file-text'
  | 'file-output'
  | 'image-plus'
  | 'images'
  | 'file-code-2'
  | 'globe'
  | 'languages'
  | 'stamp'
  | 'hash'
  | 'sliders-horizontal'
  | 'file-sliders'
  | 'qr-code'
  | 'pen-tool'
  | 'eye-off'
  | 'lock'
  | 'unlock'
  | 'film'
  | 'clapperboard'
  | 'audio-lines'
  | 'disc-3'
  | 'waveform'
  | 'gauge'
  | 'captions'
  | 'layers'
  | 'fast-forward'
  | 'tags'
  | 'minimize-2'
  | 'crop'
  | 'shield-off'
  | 'eraser'
  | 'app-window'
  | 'palette'
  | 'file-diff'
  | 'blocks'
  | 'sparkles'
  | 'wrench'
  | 'archive'
  | 'fingerprint'
  | 'braces'
  | 'mic'
  | 'download-cloud'
  | 'shield-check'
  | 'table'
  | 'git-compare'
  | 'key-round'
  | 'volume-2'
  | 'file-search'
  | 'activity';

const TOOL_ICON_MAP: Record<ToolIconId, LucideIcon> = {
  combine: Combine,
  scissors: Scissors,
  'layout-grid': LayoutGrid,
  grid: Grid,
  'rotate-cw': RotateCw,
  'file-down': FileDown,
  'scan-text': ScanText,
  'file-text': FileText,
  'file-output': FileOutput,
  'image-plus': ImagePlus,
  images: Images,
  'file-code-2': FileCode2,
  globe: Globe,
  languages: Languages,
  stamp: Stamp,
  hash: Hash,
  'sliders-horizontal': SlidersHorizontal,
  'file-sliders': FileSliders,
  'qr-code': QrCode,
  'pen-tool': PenTool,
  'eye-off': EyeOff,
  lock: Lock,
  unlock: Unlock,
  film: Film,
  clapperboard: Clapperboard,
  'audio-lines': AudioLines,
  'disc-3': Disc3,
  waveform: AudioWaveform,
  gauge: Gauge,
  captions: Captions,
  layers: Layers,
  'fast-forward': FastForward,
  tags: Tags,
  'minimize-2': Minimize2,
  crop: Crop,
  'shield-off': ShieldOff,
  eraser: Eraser,
  'app-window': AppWindow,
  palette: Palette,
  'file-diff': FileDiff,
  blocks: Blocks,
  sparkles: Sparkles,
  wrench: Wrench,
  archive: Archive,
  fingerprint: Fingerprint,
  braces: Braces,
  mic: Mic,
  'download-cloud': DownloadCloud,
  'shield-check': ShieldCheck,
  table: Table,
  'git-compare': GitCompare,
  'key-round': KeyRound,
  'volume-2': Volume2,
  'file-search': FileSearch,
  activity: Activity,
};

export interface ToolIconProps {
  tool: {
    name?: string;
    iconUrl?: string;
    iconName: ToolIconId;
    studioId?: StudioId;
    color?: string;
  };
  size?: 'sm' | 'md' | 'lg';
}

export default function ToolIcon({ tool, size = 'lg' }: ToolIconProps) {
  const dimensions =
    size === 'sm'
      ? 'h-8 w-8 rounded-[var(--radius-control)]'
      : size === 'md'
      ? 'h-10 w-10 rounded-[var(--radius-control)]'
      : 'h-11 w-11 rounded-[var(--radius-control)]';

  const iconSize = size === 'sm' ? 16 : size === 'md' ? 19 : 21;
  const IconComponent = TOOL_ICON_MAP[tool.iconName];
  const palette = tool.studioId ? STUDIO_PALETTES[tool.studioId] : null;
  const accentColor = palette?.primary ?? 'var(--fg)';

  return (
    <div
      className={`relative overflow-hidden ${dimensions} border flex items-center justify-center shrink-0 select-none transition-transform duration-150 group-hover:scale-[1.04]`}
      style={{
        backgroundColor: palette ? palette.tintLight : 'var(--surface-muted)',
        borderColor: palette ? palette.border : 'var(--border)',
        color: accentColor,
        boxShadow:
          'inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 2px rgba(0, 0, 0, 0.05)',
      }}
      aria-hidden="true"
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 opacity-30"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 100%)',
        }}
      />
      <IconComponent size={iconSize} strokeWidth={1.7} className="relative z-10" />
      {palette && (
        <span
          className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full opacity-80"
          style={{ backgroundColor: palette.primary }}
        />
      )}
    </div>
  );
}
