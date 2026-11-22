import type { ToolIconId } from '@/components/ui/ToolIcon';
import type { WorkspaceProfileId } from '@/lib/appearance';

export type StudioId =
  | 'documents'
  | 'video'
  | 'audio'
  | 'images'
  | 'files-dev'
  | 'ai-local'
  | 'web-online';

export type ToolStatus = 'active' | 'phase2';

export type ModuleRequirement =
  | 'ocr'
  | 'word_to_pdf'
  | 'ffmpeg'
  | 'yt_dlp'
  | 'rembg_onnx'
  | 'whisper_cpu';

export interface StudioDefinition {
  id: StudioId;
  primaryHref: string;
  defaultOrder: number;
  phase: 'phase1' | 'phase2';
}

export interface StudioToolItem {
  id: string;
  studio: StudioId;
  category: string;
  iconName: ToolIconId;
  href: string;
  status: ToolStatus;
  requiredCapability?: ModuleRequirement;
  requiresInternet?: boolean;
  isNew?: boolean;
  accepts?: string[];
  phaseTarget?: 'v3.1' | 'v3.2' | 'v3.3';
}

export const STUDIOS: StudioDefinition[] = [
  { id: 'documents', primaryHref: '/studios/documents', defaultOrder: 0, phase: 'phase1' },
  { id: 'video', primaryHref: '/studios/video', defaultOrder: 1, phase: 'phase1' },
  { id: 'audio', primaryHref: '/studios/audio', defaultOrder: 2, phase: 'phase1' },
  { id: 'images', primaryHref: '/studios/images', defaultOrder: 3, phase: 'phase1' },
  { id: 'files-dev', primaryHref: '/studios/files-dev', defaultOrder: 4, phase: 'phase1' },
  { id: 'ai-local', primaryHref: '/studios/ai-local', defaultOrder: 5, phase: 'phase1' },
  { id: 'web-online', primaryHref: '/studios/web-online', defaultOrder: 6, phase: 'phase1' },
];

export const DEFAULT_STUDIO_ORDER: StudioId[] = STUDIOS.map((s) => s.id);

export interface WorkspaceProfilePreset {
  id: WorkspaceProfileId;
  studioOrder: StudioId[];
  pinnedToolIds: string[];
}

export const WORKSPACE_PROFILES: Record<WorkspaceProfileId, WorkspaceProfilePreset> = {
  all: {
    id: 'all',
    studioOrder: ['documents', 'images', 'video', 'audio', 'ai-local', 'files-dev', 'web-online'],
    pinnedToolIds: [
      'merge-pdf',
      'compress-pdf',
      'image-bg-remove',
      'video-studio',
      'ai-transcribe',
      'word-to-pdf',
    ],
  },
  office: {
    id: 'office',
    studioOrder: ['documents', 'files-dev', 'ai-local', 'images', 'web-online', 'audio', 'video'],
    pinnedToolIds: [
      'merge-pdf',
      'compress-pdf',
      'sign-pdf',
      'redact-pdf',
      'pdf-to-word',
      'pdf-tables-csv',
    ],
  },
  student: {
    id: 'student',
    studioOrder: ['documents', 'ai-local', 'web-online', 'images', 'audio', 'video', 'files-dev'],
    pinnedToolIds: [
      'ocr-pdf',
      'ai-transcribe',
      'ai-doc-summary',
      'pdf-to-markdown',
      'merge-pdf',
      'ai-tts-local',
    ],
  },
  creator: {
    id: 'creator',
    studioOrder: ['images', 'video', 'audio', 'ai-local', 'web-online', 'documents', 'files-dev'],
    pinnedToolIds: [
      'video-studio',
      'image-bg-remove',
      'image-convert',
      'audio-trim',
      'video-to-gif',
      'yt-dlp-capture',
    ],
  },
  developer: {
    id: 'developer',
    studioOrder: ['files-dev', 'ai-local', 'web-online', 'documents', 'images', 'video', 'audio'],
    pinnedToolIds: [
      'data-transform',
      'file-hash-verify',
      'regex-diff-lab',
      'file-vault',
      'web-headers-ssl',
      'ai-doc-chunks',
    ],
  },
};

export const ALL_STUDIO_TOOLS: StudioToolItem[] = [
  // ========================
  // 1. DOCUMENTS & PDF (24 active tools)
  // ========================
  {
    id: 'merge-pdf',
    studio: 'documents',
    category: 'organizar',
    iconName: 'combine',
    href: '/merge-pdf',
    status: 'active',
    accepts: ['.pdf'],
  },
  {
    id: 'split-pdf',
    studio: 'documents',
    category: 'organizar',
    iconName: 'scissors',
    href: '/split-pdf',
    status: 'active',
    accepts: ['.pdf'],
  },
  {
    id: 'organize-pdf',
    studio: 'documents',
    category: 'organizar',
    iconName: 'layout-grid',
    href: '/organize-pdf',
    status: 'active',
    accepts: ['.pdf'],
  },
  {
    id: 'rotate-pdf',
    studio: 'documents',
    category: 'organizar',
    iconName: 'rotate-cw',
    href: '/rotate-pdf',
    status: 'active',
    accepts: ['.pdf'],
  },
  {
    id: 'compress-pdf',
    studio: 'documents',
    category: 'optimizar',
    iconName: 'file-down',
    href: '/compress-pdf',
    status: 'active',
    accepts: ['.pdf'],
  },
  {
    id: 'ocr-pdf',
    studio: 'documents',
    category: 'optimizar',
    iconName: 'scan-text',
    href: '/ocr-pdf',
    status: 'active',
    requiredCapability: 'ocr',
    accepts: ['.pdf'],
  },
  {
    id: 'pdf-repair',
    studio: 'documents',
    category: 'optimizar',
    iconName: 'wrench',
    href: '/pdf-repair',
    status: 'active',
    isNew: true,
    accepts: ['.pdf'],
  },
  {
    id: 'pdf-to-word',
    studio: 'documents',
    category: 'convertir',
    iconName: 'file-text',
    href: '/pdf-to-word',
    status: 'active',
    accepts: ['.pdf'],
  },
  {
    id: 'word-to-pdf',
    studio: 'documents',
    category: 'convertir',
    iconName: 'file-output',
    href: '/word-to-pdf',
    status: 'active',
    requiredCapability: 'word_to_pdf',
    accepts: ['.doc', '.docx'],
  },
  {
    id: 'jpg-to-pdf',
    studio: 'documents',
    category: 'convertir',
    iconName: 'image-plus',
    href: '/jpg-to-pdf',
    status: 'active',
    accepts: ['.jpg', '.jpeg', '.png'],
  },
  {
    id: 'pdf-to-jpg',
    studio: 'documents',
    category: 'convertir',
    iconName: 'images',
    href: '/pdf-to-jpg',
    status: 'active',
    accepts: ['.pdf'],
  },
  {
    id: 'pdf-to-markdown',
    studio: 'documents',
    category: 'convertir',
    iconName: 'file-code-2',
    href: '/pdf-to-markdown',
    status: 'active',
    accepts: ['.pdf'],
  },
  {
    id: 'pdf-tables-csv',
    studio: 'documents',
    category: 'convertir',
    iconName: 'table',
    href: '/pdf-tables-csv',
    status: 'active',
    isNew: true,
    accepts: ['.pdf'],
  },
  {
    id: 'url-to-pdf',
    studio: 'documents',
    category: 'convertir',
    iconName: 'globe',
    href: '/url-to-pdf',
    status: 'active',
    requiresInternet: true,
  },
  {
    id: 'translate-pdf',
    studio: 'documents',
    category: 'convertir',
    iconName: 'languages',
    href: '/translate-pdf',
    status: 'active',
    requiresInternet: true,
    accepts: ['.pdf'],
  },
  {
    id: 'watermark-pdf',
    studio: 'documents',
    category: 'editar',
    iconName: 'stamp',
    href: '/watermark-pdf',
    status: 'active',
    accepts: ['.pdf'],
  },
  {
    id: 'page-numbers-pdf',
    studio: 'documents',
    category: 'editar',
    iconName: 'hash',
    href: '/page-numbers-pdf',
    status: 'active',
    accepts: ['.pdf'],
  },
  {
    id: 'metadata-pdf',
    studio: 'documents',
    category: 'editar',
    iconName: 'sliders-horizontal',
    href: '/metadata-pdf',
    status: 'active',
    accepts: ['.pdf'],
  },
  {
    id: 'qr-pdf',
    studio: 'documents',
    category: 'editar',
    iconName: 'qr-code',
    href: '/qr-pdf',
    status: 'active',
    requiresInternet: true,
    accepts: ['.pdf'],
  },
  {
    id: 'pdf-diff',
    studio: 'documents',
    category: 'editar',
    iconName: 'git-compare',
    href: '/pdf-diff',
    status: 'active',
    isNew: true,
    accepts: ['.pdf'],
  },
  {
    id: 'sign-pdf',
    studio: 'documents',
    category: 'seguridad',
    iconName: 'pen-tool',
    href: '/sign-pdf',
    status: 'active',
    accepts: ['.pdf'],
  },
  {
    id: 'redact-pdf',
    studio: 'documents',
    category: 'seguridad',
    iconName: 'eye-off',
    href: '/redact-pdf',
    status: 'active',
    accepts: ['.pdf'],
  },
  {
    id: 'protect-pdf',
    studio: 'documents',
    category: 'seguridad',
    iconName: 'lock',
    href: '/protect-pdf',
    status: 'active',
    accepts: ['.pdf'],
  },
  {
    id: 'unlock-pdf',
    studio: 'documents',
    category: 'seguridad',
    iconName: 'unlock',
    href: '/unlock-pdf',
    status: 'active',
    accepts: ['.pdf'],
  },

  // ========================
  // 2. VIDEO STUDIO (8 active tools)
  // ========================
  {
    id: 'video-studio',
    studio: 'video',
    category: 'video-core',
    iconName: 'film',
    href: '/video-studio',
    status: 'active',
    requiredCapability: 'ffmpeg',
    isNew: true,
    accepts: ['.mp4', '.mov', '.mkv', '.webm', '.avi', '.m4v'],
  },
  {
    id: 'video-to-gif',
    studio: 'video',
    category: 'convertir',
    iconName: 'clapperboard',
    href: '/video-to-gif',
    status: 'active',
    requiredCapability: 'ffmpeg',
    accepts: ['.mp4', '.mov', '.mkv', '.webm'],
  },
  {
    id: 'video-extract-audio',
    studio: 'video',
    category: 'convertir',
    iconName: 'audio-lines',
    href: '/video-extract-audio',
    status: 'active',
    requiredCapability: 'ffmpeg',
    accepts: ['.mp4', '.mov', '.mkv', '.webm'],
  },
  {
    id: 'video-compress',
    studio: 'video',
    category: 'optimizar',
    iconName: 'gauge',
    href: '/video-compress',
    status: 'active',
    requiredCapability: 'ffmpeg',
    accepts: ['.mp4', '.mov', '.mkv', '.webm'],
  },
  {
    id: 'video-thumbnails',
    studio: 'video',
    category: 'editar',
    iconName: 'grid',
    href: '/video-thumbnails',
    status: 'active',
    accepts: ['.mp4', '.mov', '.mkv', '.webm'],
  },
  {
    id: 'video-burn-subtitles',
    studio: 'video',
    category: 'editar',
    iconName: 'captions',
    href: '/video-burn-subtitles',
    status: 'active',
    requiredCapability: 'ffmpeg',
    accepts: ['.mp4', '.mkv', '.mov', '.webm'],
  },
  {
    id: 'video-merge',
    studio: 'video',
    category: 'organizar',
    iconName: 'layers',
    href: '/video-merge',
    status: 'active',
    requiredCapability: 'ffmpeg',
    accepts: ['.mp4', '.mov', '.mkv', '.webm'],
  },
  {
    id: 'video-speed',
    studio: 'video',
    category: 'editar',
    iconName: 'fast-forward',
    href: '/video-speed',
    status: 'active',
    requiredCapability: 'ffmpeg',
    accepts: ['.mp4', '.mov', '.mkv', '.webm'],
  },

  // ========================
  // 3. AUDIO STUDIO (6 active tools)
  // ========================
  {
    id: 'audio-convert',
    studio: 'audio',
    category: 'convertir',
    iconName: 'disc-3',
    href: '/audio-convert',
    status: 'active',
    requiredCapability: 'ffmpeg',
    accepts: ['.mp3', '.wav', '.flac', '.ogg', '.m4a'],
  },
  {
    id: 'audio-trim',
    studio: 'audio',
    category: 'editar',
    iconName: 'scissors',
    href: '/audio-trim',
    status: 'active',
    requiredCapability: 'ffmpeg',
    accepts: ['.mp3', '.wav', '.flac', '.ogg', '.m4a'],
  },
  {
    id: 'audio-normalize',
    studio: 'audio',
    category: 'optimizar',
    iconName: 'sliders-horizontal',
    href: '/audio-normalize',
    status: 'active',
    requiredCapability: 'ffmpeg',
    accepts: ['.mp3', '.wav', '.flac', '.m4a'],
  },
  {
    id: 'audio-denoise',
    studio: 'audio',
    category: 'optimizar',
    iconName: 'waveform',
    href: '/audio-denoise',
    status: 'active',
    requiredCapability: 'ffmpeg',
    accepts: ['.mp3', '.wav', '.flac', '.m4a'],
  },
  {
    id: 'audio-merge',
    studio: 'audio',
    category: 'organizar',
    iconName: 'combine',
    href: '/audio-merge',
    status: 'active',
    requiredCapability: 'ffmpeg',
    accepts: ['.mp3', '.wav', '.flac', '.m4a'],
  },
  {
    id: 'audio-metadata',
    studio: 'audio',
    category: 'editar',
    iconName: 'tags',
    href: '/audio-metadata',
    status: 'active',
    requiredCapability: 'ffmpeg',
    accepts: ['.mp3', '.flac', '.m4a', '.ogg'],
  },

  // ========================
  // 4. IMAGES STUDIO (7 active tools)
  // ========================
  {
    id: 'image-convert',
    studio: 'images',
    category: 'convertir',
    iconName: 'images',
    href: '/image-convert',
    status: 'active',
    isNew: true,
    accepts: ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.bmp', '.tiff'],
  },
  {
    id: 'image-compress',
    studio: 'images',
    category: 'optimizar',
    iconName: 'minimize-2',
    href: '/image-compress',
    status: 'active',
    accepts: ['.png', '.jpg', '.jpeg', '.webp'],
  },
  {
    id: 'image-resize-crop',
    studio: 'images',
    category: 'editar',
    iconName: 'crop',
    href: '/image-resize-crop',
    status: 'active',
    accepts: ['.png', '.jpg', '.jpeg', '.webp'],
  },
  {
    id: 'image-exif-strip',
    studio: 'images',
    category: 'seguridad',
    iconName: 'shield-off',
    href: '/image-exif-strip',
    status: 'active',
    accepts: ['.jpg', '.jpeg', '.png', '.tiff', '.webp'],
  },
  {
    id: 'image-bg-remove',
    studio: 'images',
    category: 'editar',
    iconName: 'eraser',
    href: '/image-bg-remove',
    status: 'active',
    isNew: true,
    accepts: ['.png', '.jpg', '.jpeg', '.webp'],
  },
  {
    id: 'image-ico-favicon',
    studio: 'images',
    category: 'convertir',
    iconName: 'app-window',
    href: '/image-ico-favicon',
    status: 'active',
    accepts: ['.png', '.svg', '.jpg', '.jpeg', '.webp'],
  },
  {
    id: 'image-palette',
    studio: 'images',
    category: 'editar',
    iconName: 'palette',
    href: '/image-palette',
    status: 'active',
    accepts: ['.png', '.jpg', '.jpeg', '.webp'],
  },

  // ========================
  // 5. FILES & DEV LAB (6 active tools)
  // ========================
  {
    id: 'archive-pack',
    studio: 'files-dev',
    category: 'organizar',
    iconName: 'archive',
    href: '/archive-pack',
    status: 'active',
    accepts: ['.zip', '.tar', '.gz', '.pdf', '.txt', '.json', '.csv', '.png', '.jpg'],
  },
  {
    id: 'file-hash-verify',
    studio: 'files-dev',
    category: 'seguridad',
    iconName: 'fingerprint',
    href: '/file-hash-verify',
    status: 'active',
  },
  {
    id: 'file-vault',
    studio: 'files-dev',
    category: 'seguridad',
    iconName: 'key-round',
    href: '/file-vault',
    status: 'active',
    isNew: true,
  },
  {
    id: 'data-transform',
    studio: 'files-dev',
    category: 'convertir',
    iconName: 'braces',
    href: '/data-transform',
    status: 'active',
    accepts: ['.json', '.yaml', '.yml', '.csv', '.xml'],
  },
  {
    id: 'regex-diff-lab',
    studio: 'files-dev',
    category: 'editar',
    iconName: 'file-diff',
    href: '/regex-diff-lab',
    status: 'active',
    accepts: ['.txt', '.md', '.json', '.csv', '.log'],
  },
  {
    id: 'qr-barcode-batch',
    studio: 'files-dev',
    category: 'editar',
    iconName: 'qr-code',
    href: '/qr-barcode-batch',
    status: 'active',
    accepts: ['.txt', '.csv'],
  },

  // ========================
  // 6. LOCAL AI STUDIO (4 active tools)
  // ========================
  {
    id: 'ai-transcribe',
    studio: 'ai-local',
    category: 'ai',
    iconName: 'mic',
    href: '/ai-transcribe',
    status: 'active',
    isNew: true,
    accepts: ['.mp3', '.wav', '.m4a', '.mp4', '.mkv', '.ogg'],
  },
  {
    id: 'ai-tts-local',
    studio: 'ai-local',
    category: 'ai',
    iconName: 'volume-2',
    href: '/ai-tts-local',
    status: 'active',
    isNew: true,
    accepts: ['.txt', '.md', '.pdf'],
  },
  {
    id: 'ai-doc-summary',
    studio: 'ai-local',
    category: 'ai',
    iconName: 'file-search',
    href: '/ai-doc-summary',
    status: 'active',
    isNew: true,
    accepts: ['.pdf', '.md', '.txt'],
  },
  {
    id: 'ai-doc-chunks',
    studio: 'ai-local',
    category: 'ai',
    iconName: 'blocks',
    href: '/ai-doc-chunks',
    status: 'active',
    accepts: ['.pdf', '.md', '.txt'],
  },

  // ========================
  // 7. WEB & ONLINE CAPTURE (3 active tools)
  // ========================
  {
    id: 'yt-dlp-capture',
    studio: 'web-online',
    category: 'online',
    iconName: 'download-cloud',
    href: '/yt-dlp-capture',
    status: 'active',
    requiredCapability: 'yt_dlp',
    requiresInternet: true,
  },
  {
    id: 'web-markdown-clip',
    studio: 'web-online',
    category: 'online',
    iconName: 'file-code-2',
    href: '/web-markdown-clip',
    status: 'active',
    requiresInternet: true,
  },
  {
    id: 'web-headers-ssl',
    studio: 'web-online',
    category: 'online',
    iconName: 'shield-check',
    href: '/web-headers-ssl',
    status: 'active',
    requiresInternet: true,
  },
];

export const EXPLICIT_TOOL_ROUTE_IDS = new Set<string>([
  'merge-pdf',
  'split-pdf',
  'organize-pdf',
  'rotate-pdf',
  'compress-pdf',
  'ocr-pdf',
  'pdf-to-word',
  'word-to-pdf',
  'jpg-to-pdf',
  'pdf-to-jpg',
  'pdf-to-markdown',
  'url-to-pdf',
  'translate-pdf',
  'watermark-pdf',
  'page-numbers-pdf',
  'metadata-pdf',
  'qr-pdf',
  'sign-pdf',
  'redact-pdf',
  'protect-pdf',
  'unlock-pdf',
  'video-studio',
]);

export const DYNAMIC_STUDIO_TOOL_IDS: string[] = ALL_STUDIO_TOOLS.map((t) => t.id).filter(
  (id) => !EXPLICIT_TOOL_ROUTE_IDS.has(id)
);

export const TOOL_COUNT = ALL_STUDIO_TOOLS.length; // 58
export const ACTIVE_STUDIO_TOOLS = ALL_STUDIO_TOOLS.filter((t) => t.status === 'active');

export function getStudioById(id: string): StudioDefinition | undefined {
  return STUDIOS.find((s) => s.id === id);
}

export function getToolsByStudio(studio: StudioId): StudioToolItem[] {
  return ALL_STUDIO_TOOLS.filter((t) => t.studio === studio);
}

export function getToolById(id: string): StudioToolItem | undefined {
  return ALL_STUDIO_TOOLS.find((t) => t.id === id);
}

export function getToolByHref(href: string): StudioToolItem | undefined {
  const normalized = href.replace(/\/+$/, '') || '/';
  return ALL_STUDIO_TOOLS.find((t) => t.href === normalized);
}
