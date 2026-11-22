'use client';

import React, { useId, useRef, useState } from 'react';
import { StudioId } from '@/config/studios';
import { ThreeDLevel } from '@/lib/appearance';
import { STUDIO_PALETTES } from '@/lib/studio-palettes';

interface StudioTile3DProps {
  studioId: StudioId;
  title: string;
  tagline: string;
  threeDLevel: ThreeDLevel;
  reduceAnimations?: boolean;
  isSelected?: boolean;
  onClick: () => void;
}

export function SculptedStudioGlyph({
  studioId,
  size = 'md',
}: {
  studioId: StudioId;
  size?: 'md' | 'lg';
}) {
  const uid = useId().replace(/:/g, '');
  const pal = STUDIO_PALETTES[studioId];
  const dimClass = size === 'lg' ? 'w-14 h-14' : 'w-12 h-12';

  const frameFill = 'rgba(130, 136, 150, 0.14)';
  const frameStroke = 'rgba(150, 156, 170, 0.34)';

  switch (studioId) {
    case 'documents':
      return (
        <svg viewBox="0 0 56 56" className={dimClass} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`sg-doc-${uid}`} x1="12" y1="10" x2="44" y2="46" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={pal.primary} stopOpacity="0.22" />
              <stop offset="100%" stopColor={pal.primary} stopOpacity="0.06" />
            </linearGradient>
          </defs>
          <rect
            x="17"
            y="8"
            width="25"
            height="34"
            rx="5"
            transform="rotate(4 29 25)"
            fill={frameFill}
            stroke={frameStroke}
            strokeWidth="1.15"
          />
          <path
            d="M13 15C13 12.7909 14.7909 11 17 11H31.5L39 18.5V43C39 45.2091 37.2091 47 35 47H17C14.7909 47 13 45.2091 13 43V15Z"
            fill={`url(#sg-doc-${uid})`}
            stroke={pal.primary}
            strokeWidth="1.35"
            strokeLinejoin="round"
          />
          <path
            d="M31.5 11V17C31.5 17.8284 32.1716 18.5 33 18.5H39"
            stroke={pal.primary}
            strokeOpacity="0.65"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <rect x="18" y="24" width="15.5" height="2.4" rx="1.2" fill={pal.primary} />
          <rect x="18" y="30" width="12" height="2.2" rx="1.1" fill="currentColor" fillOpacity="0.38" />
          <rect x="18" y="36" width="8.5" height="2.2" rx="1.1" fill="currentColor" fillOpacity="0.25" />
        </svg>
      );

    case 'video':
      return (
        <svg viewBox="0 0 56 56" className={dimClass} fill="none" aria-hidden="true">
          <rect
            x="9"
            y="13"
            width="38"
            height="30"
            rx="6.5"
            fill={frameFill}
            stroke={frameStroke}
            strokeWidth="1.2"
          />
          <rect
            x="13"
            y="17"
            width="30"
            height="22"
            rx="3.5"
            fill={pal.tintLight}
            stroke={pal.primary}
            strokeOpacity="0.7"
            strokeWidth="1.2"
          />
          <circle cx="17" cy="21" r="1.4" fill={pal.primary} />
          <path d="M25.5 23.5L33.5 28L25.5 32.5V23.5Z" fill={pal.primary} />
        </svg>
      );

    case 'audio':
      return (
        <svg viewBox="0 0 56 56" className={dimClass} fill="none" aria-hidden="true">
          <circle
            cx="28"
            cy="28"
            r="19"
            fill={frameFill}
            stroke={frameStroke}
            strokeWidth="1.2"
          />
          <circle
            cx="28"
            cy="28"
            r="14"
            fill={pal.tintLight}
            stroke={pal.primary}
            strokeOpacity="0.45"
            strokeWidth="1.1"
          />
          <rect x="17" y="25" width="2.8" height="6" rx="1.4" fill={pal.primary} fillOpacity="0.55" />
          <rect x="21.8" y="20.5" width="2.8" height="15" rx="1.4" fill={pal.primary} fillOpacity="0.82" />
          <rect x="26.6" y="16" width="2.8" height="24" rx="1.4" fill={pal.primary} />
          <rect x="31.4" y="21" width="2.8" height="14" rx="1.4" fill={pal.primary} fillOpacity="0.82" />
          <rect x="36.2" y="24.5" width="2.8" height="7" rx="1.4" fill={pal.primary} fillOpacity="0.55" />
        </svg>
      );

    case 'images':
      return (
        <svg viewBox="0 0 56 56" className={dimClass} fill="none" aria-hidden="true">
          <rect
            x="10"
            y="14"
            width="28"
            height="24"
            rx="5"
            fill={frameFill}
            stroke={frameStroke}
            strokeWidth="1.15"
          />
          <rect
            x="18"
            y="18"
            width="28"
            height="24"
            rx="5"
            fill={pal.tintLight}
            stroke={pal.primary}
            strokeWidth="1.3"
          />
          <circle cx="32" cy="30" r="6" stroke={pal.primary} strokeWidth="1.35" />
          <circle cx="32" cy="30" r="2.2" fill={pal.primary} />
        </svg>
      );

    case 'files-dev':
      return (
        <svg viewBox="0 0 56 56" className={dimClass} fill="none" aria-hidden="true">
          <rect
            x="10"
            y="11"
            width="36"
            height="34"
            rx="7"
            fill={frameFill}
            stroke={frameStroke}
            strokeWidth="1.2"
          />
          <path
            d="M22 22L16.5 28L22 34"
            stroke={pal.primary}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M34 22L39.5 28L34 34"
            stroke={pal.primary}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="29.5"
            y1="20.5"
            x2="26.5"
            y2="35.5"
            stroke="currentColor"
            strokeOpacity="0.65"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'ai-local':
      return (
        <svg viewBox="0 0 56 56" className={dimClass} fill="none" aria-hidden="true">
          <rect
            x="11"
            y="11"
            width="34"
            height="34"
            rx="8"
            fill={frameFill}
            stroke={frameStroke}
            strokeWidth="1.2"
          />
          <rect
            x="19"
            y="19"
            width="18"
            height="18"
            rx="4.5"
            fill={pal.tintLight}
            stroke={pal.primary}
            strokeWidth="1.35"
          />
          <circle cx="28" cy="28" r="3.4" fill={pal.primary} />
          <path
            d="M28 14V19M28 37V42M14 28H19M37 28H42"
            stroke={pal.primary}
            strokeOpacity="0.6"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'web-online':
      return (
        <svg viewBox="0 0 56 56" className={dimClass} fill="none" aria-hidden="true">
          <circle
            cx="28"
            cy="28"
            r="17.5"
            fill={frameFill}
            stroke={frameStroke}
            strokeWidth="1.2"
          />
          <circle
            cx="28"
            cy="28"
            r="17.5"
            fill={pal.tintLight}
            stroke={pal.primary}
            strokeOpacity="0.6"
            strokeWidth="1.2"
          />
          <ellipse cx="28" cy="28" rx="8" ry="17.5" stroke={pal.primary} strokeOpacity="0.55" strokeWidth="1.15" />
          <line x1="10.5" y1="28" x2="45.5" y2="28" stroke={pal.primary} strokeOpacity="0.55" strokeWidth="1.15" />
          <circle cx="39.5" cy="16.5" r="3.8" fill={pal.primary} stroke="var(--surface)" strokeWidth="1.4" />
        </svg>
      );
  }
}

export default function StudioTile3D({
  studioId,
  title,
  tagline,
  threeDLevel,
  reduceAnimations = false,
  isSelected = false,
  onClick,
}: StudioTile3DProps) {
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 50, my: 50, hovered: false });

  const pal = STUDIO_PALETTES[studioId];
  const enable3D = threeDLevel === 'full' && !reduceAnimations;
  const enableSubtle = threeDLevel === 'subtle' && !reduceAnimations;

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!enable3D || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const ry = (px - 0.5) * 8;
    const rx = (0.5 - py) * 8;
    setTilt({
      rx,
      ry,
      mx: Math.round(px * 100),
      my: Math.round(py * 100),
      hovered: true,
    });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 0, ry: 0, mx: 50, my: 50, hovered: false });
  };

  const transformStyle = enable3D
    ? `perspective(900px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) translateZ(${
        tilt.hovered ? '3px' : '0px'
      })`
    : undefined;

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        transform: transformStyle,
        borderRadius: 'var(--radius-card)',
        transition: tilt.hovered
          ? 'transform 90ms ease-out, border-color 160ms ease, box-shadow 160ms ease'
          : 'transform 260ms ease-out, border-color 160ms ease, box-shadow 220ms ease',
      }}
      className={`group relative overflow-hidden text-left p-5 border bg-[var(--surface)] flex flex-col justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
        isSelected
          ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]'
          : 'border-[var(--border)] hover:border-[var(--border-strong)] hover:shadow-sm'
      } ${enableSubtle ? 'hover:-translate-y-0.5' : ''}`}
    >
      {enable3D && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-200"
          style={{
            opacity: tilt.hovered ? 1 : 0,
            background: `radial-gradient(240px circle at ${tilt.mx}% ${tilt.my}%, ${pal.tintLight}, transparent 72%)`,
          }}
        />
      )}

      <div className="relative flex items-center justify-start pt-0.5">
        <div
          className="relative transition-transform duration-200 group-hover:scale-[1.05]"
          style={{ transform: enable3D && tilt.hovered ? 'translateZ(12px)' : undefined }}
        >
          <SculptedStudioGlyph studioId={studioId} size="md" />
        </div>
      </div>

      <div className="relative space-y-1 w-full">
        <h3 className="text-sm font-semibold text-[var(--fg)] tracking-tight truncate">
          {title}
        </h3>
        <p className="text-xs text-[var(--fg-muted)] line-clamp-1">{tagline}</p>
      </div>
    </button>
  );
}
