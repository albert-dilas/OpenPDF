'use client';

import React, { useId, useRef, useState } from 'react';
import { SystemCapabilities } from '@/lib/api';
import { ThreeDLevel } from '@/lib/appearance';

export type EngineOrbState = 'idle' | 'running' | 'offline';

interface EngineOrb3DProps {
  state: EngineOrbState;
  threeDLevel: ThreeDLevel;
  reduceAnimations?: boolean;
  size?: number;
  capabilities?: SystemCapabilities;
  activeJobsCount?: number;
  activeProgress?: number;
  onDropFiles?: (files: File[]) => void;
  onClick?: () => void;
  ariaLabel?: string;
}

const ENGINE_KEYS: (keyof SystemCapabilities)[] = [
  'ocr',
  'word_to_pdf',
  'ffmpeg',
  'yt_dlp',
  'rembg_onnx',
  'whisper_cpu',
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x.toFixed(
    2
  )} ${end.y.toFixed(2)}`;
}

export default function EngineOrb3D({
  state,
  threeDLevel,
  reduceAnimations = false,
  size = 92,
  capabilities,
  activeJobsCount = 0,
  activeProgress,
  onDropFiles,
  onClick,
  ariaLabel = 'Precision local engine indicator',
}: EngineOrb3DProps) {
  const uid = useId().replace(/:/g, '');
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const enable3D = threeDLevel === 'full' && !reduceAnimations;
  const allowMotion = !reduceAnimations && threeDLevel !== 'performance';

  const cx = 48;
  const cy = 48;
  const outerR = 42;
  const innerTrackR = 33;
  const coreR = 23;

  const readyEngines = capabilities
    ? ENGINE_KEYS.map((k) => Boolean(capabilities[k]))
    : [false, false, false, false, false, false];

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!enable3D || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -py * 12, ry: px * 12 });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    if (!onDropFiles) return;
    e.preventDefault();
    e.stopPropagation();
    if (!dragOver) setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    if (!onDropFiles) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer?.files ?? []);
    if (dropped.length > 0) {
      onDropFiles(dropped);
    }
  };

  const pct =
    typeof activeProgress === 'number' && Number.isFinite(activeProgress)
      ? Math.max(4, Math.min(100, Math.round(activeProgress)))
      : undefined;
  const circumference = 2 * Math.PI * innerTrackR;
  const progressDash =
    pct !== undefined ? `${(pct / 100) * circumference} ${circumference}` : `${circumference * 0.34} ${circumference}`;

  const statusColor =
    state === 'offline' ? '#D97706' : state === 'running' ? '#10B981' : '#E04826';

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label={ariaLabel}
      style={{
        width: size,
        height: size,
        transform: enable3D
          ? `perspective(420px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`
          : undefined,
        transition: 'transform 160ms ease-out',
      }}
      className={`group relative inline-flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shrink-0 cursor-pointer ${
        dragOver ? 'scale-[1.06]' : 'hover:scale-[1.03]'
      }`}
    >
      <svg viewBox="0 0 96 96" className="w-full h-full overflow-visible" aria-hidden="true">
        <defs>
          <radialGradient id={`core-grad-${uid}`} cx="34%" cy="28%" r="74%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
            <stop offset="55%" stopColor="rgba(17,18,20,0.92)" />
            <stop offset="100%" stopColor="#0C0C0E" />
          </radialGradient>
        </defs>

        {/* Subtle Drop Zone Halo */}
        {dragOver && (
          <circle
            cx={cx}
            cy={cy}
            r={46}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        )}

        {/* 6 Precision Engine Segments around Outer Perimeter */}
        {ENGINE_KEYS.map((key, idx) => {
          const gapDeg = 9;
          const spanDeg = 60 - gapDeg;
          const startAngle = idx * 60 + gapDeg / 2;
          const endAngle = startAngle + spanDeg;
          const isReady = readyEngines[idx];
          return (
            <path
              key={key}
              d={describeArc(cx, cy, outerR, startAngle, endAngle)}
              fill="none"
              stroke={
                state === 'offline'
                  ? 'rgba(217, 119, 6, 0.45)'
                  : isReady
                  ? '#10B981'
                  : 'var(--border-strong)'
              }
              strokeOpacity={state === 'offline' ? 0.55 : isReady ? 0.85 : 0.35}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          );
        })}

        {/* Inner Calibrated Track Ring */}
        <circle
          cx={cx}
          cy={cy}
          r={innerTrackR}
          fill="none"
          stroke="var(--border)"
          strokeWidth="1.25"
        />

        {/* Running Progress / Telemetry Arc */}
        {state === 'running' ? (
          <circle
            cx={cx}
            cy={cy}
            r={innerTrackR}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray={progressDash}
            transform={`rotate(-90 ${cx} ${cy})`}
            className={pct === undefined && allowMotion ? 'origin-center animate-spin' : undefined}
            style={
              pct === undefined && allowMotion
                ? { animationDuration: '2.2s', transformOrigin: '48px 48px' }
                : undefined
            }
          />
        ) : (
          /* Minimalist cardinal ticks */
          [0, 90, 180, 270].map((deg) => {
            const p1 = polarToCartesian(cx, cy, innerTrackR - 2.2, deg);
            const p2 = polarToCartesian(cx, cy, innerTrackR + 2.2, deg);
            return (
              <line
                key={deg}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={state === 'offline' ? '#D97706' : 'var(--fg-muted)'}
                strokeOpacity="0.45"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            );
          })
        )}

        {/* Central Tactile Precision Disc */}
        <circle
          cx={cx}
          cy={cy}
          r={coreR}
          fill={threeDLevel === 'performance' ? 'var(--surface)' : '#111214'}
          stroke={
            dragOver
              ? 'var(--accent)'
              : state === 'running'
              ? 'rgba(16, 185, 129, 0.5)'
              : 'rgba(255, 255, 255, 0.14)'
          }
          strokeWidth="1.2"
        />

        {threeDLevel !== 'performance' && (
          <circle
            cx={cx}
            cy={cy}
            r={coreR - 1}
            fill={`url(#core-grad-${uid})`}
          />
        )}

        {/* Center Indicator: Live Progress / Active Count or Architectural T + Calibration Dot */}
        {state === 'running' ? (
          <text
            x={cx}
            y={cy + 3.5}
            textAnchor="middle"
            className="font-mono font-semibold"
            fontSize="10.5"
            fill={threeDLevel === 'performance' ? 'var(--fg)' : '#FFFFFF'}
          >
            {pct !== undefined ? `${pct}%` : `${Math.max(1, activeJobsCount)}`}
          </text>
        ) : (
          <>
            <rect
              x={cx - 7.5}
              y={cy - 7}
              width="15"
              height="2.6"
              rx="0.9"
              fill={threeDLevel === 'performance' ? 'var(--fg)' : '#FFFFFF'}
              fillOpacity="0.92"
            />
            <rect
              x={cx - 1.4}
              y={cy - 4.6}
              width="2.8"
              height="11.5"
              rx="0.9"
              fill={threeDLevel === 'performance' ? 'var(--fg)' : '#FFFFFF'}
              fillOpacity="0.92"
            />
            <circle
              cx={cx + 6.2}
              cy={cy + 5.2}
              r="2.4"
              fill={statusColor}
              className={allowMotion && state === 'idle' ? 'group-hover:scale-110 transition-transform' : undefined}
            />
          </>
        )}
      </svg>
    </button>
  );
}
