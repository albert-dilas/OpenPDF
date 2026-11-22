import type { StudioId } from '@/config/studios';

export interface StudioPalette {
  id: StudioId;
  primary: string;
  secondary: string;
  tintLight: string;
  tintDark: string;
  border: string;
  glow: string;
}

export const STUDIO_PALETTES: Record<StudioId, StudioPalette> = {
  documents: {
    id: 'documents',
    primary: '#E85D3F',
    secondary: '#F59E0B',
    tintLight: 'rgba(232, 93, 63, 0.10)',
    tintDark: 'rgba(232, 93, 63, 0.16)',
    border: 'rgba(232, 93, 63, 0.28)',
    glow: 'rgba(232, 93, 63, 0.22)',
  },
  video: {
    id: 'video',
    primary: '#3B82F6',
    secondary: '#6366F1',
    tintLight: 'rgba(59, 130, 246, 0.10)',
    tintDark: 'rgba(99, 102, 241, 0.16)',
    border: 'rgba(59, 130, 246, 0.28)',
    glow: 'rgba(59, 130, 246, 0.22)',
  },
  audio: {
    id: 'audio',
    primary: '#0D9488',
    secondary: '#34D399',
    tintLight: 'rgba(13, 148, 136, 0.10)',
    tintDark: 'rgba(52, 211, 153, 0.16)',
    border: 'rgba(13, 148, 136, 0.28)',
    glow: 'rgba(13, 148, 136, 0.22)',
  },
  images: {
    id: 'images',
    primary: '#EC4899',
    secondary: '#F43F5E',
    tintLight: 'rgba(236, 72, 153, 0.10)',
    tintDark: 'rgba(236, 72, 153, 0.16)',
    border: 'rgba(236, 72, 153, 0.28)',
    glow: 'rgba(236, 72, 153, 0.22)',
  },
  'files-dev': {
    id: 'files-dev',
    primary: '#D97706',
    secondary: '#FBBF24',
    tintLight: 'rgba(217, 119, 6, 0.10)',
    tintDark: 'rgba(251, 191, 36, 0.16)',
    border: 'rgba(217, 119, 6, 0.28)',
    glow: 'rgba(217, 119, 6, 0.22)',
  },
  'ai-local': {
    id: 'ai-local',
    primary: '#7C3AED',
    secondary: '#38BDF8',
    tintLight: 'rgba(124, 58, 237, 0.10)',
    tintDark: 'rgba(124, 58, 237, 0.16)',
    border: 'rgba(124, 58, 237, 0.28)',
    glow: 'rgba(124, 58, 237, 0.22)',
  },
  'web-online': {
    id: 'web-online',
    primary: '#0284C7',
    secondary: '#38BDF8',
    tintLight: 'rgba(2, 132, 199, 0.10)',
    tintDark: 'rgba(56, 189, 248, 0.16)',
    border: 'rgba(2, 132, 199, 0.28)',
    glow: 'rgba(2, 132, 199, 0.22)',
  },
};

export function getStudioPalette(id: StudioId): StudioPalette {
  return STUDIO_PALETTES[id];
}
