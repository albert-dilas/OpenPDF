'use client';

import React from 'react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

const SPINNER_DIM: Record<SpinnerSize, { px: number; stroke: number }> = {
  xs: { px: 12, stroke: 2.2 },
  sm: { px: 15, stroke: 2.1 },
  md: { px: 19, stroke: 2 },
  lg: { px: 26, stroke: 2 },
};

export function InlineSpinner({
  size = 'sm',
  className = '',
  label,
}: {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}) {
  const { px, stroke } = SPINNER_DIM[size];
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`animate-spin shrink-0 ${className}`}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth={stroke}
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PulseDots({
  size = 'sm',
  className = '',
}: {
  size?: 'sm' | 'md';
  className?: string;
}) {
  const dim = size === 'md' ? 'w-1.5 h-1.5' : 'w-1 h-1';
  const gap = size === 'md' ? 'gap-1' : 'gap-0.5';
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center ${gap} shrink-0 ${className}`}
    >
      {[0, 160, 320].map((delay) => (
        <span
          key={delay}
          className={`${dim} rounded-full bg-current tornio-dot-pulse`}
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

export type ProgressTone = 'accent' | 'emerald' | 'amber' | 'danger';

const TONE_COLOR: Record<ProgressTone, string> = {
  accent: 'var(--accent)',
  emerald: '#10B981',
  amber: '#D97706',
  danger: '#DC2626',
};

export function ProgressBar({
  value,
  indeterminate = false,
  tone = 'accent',
  className = '',
  label,
}: {
  value?: number;
  indeterminate?: boolean;
  tone?: ProgressTone;
  className?: string;
  label?: string;
}) {
  const isIndeterminate = indeterminate || typeof value !== 'number';
  const clamped =
    typeof value === 'number' ? Math.max(0, Math.min(100, Math.round(value))) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={isIndeterminate ? undefined : clamped}
      className={`w-full h-1.5 rounded-full bg-[var(--surface-muted)] overflow-hidden ${
        isIndeterminate ? 'tornio-indeterminate' : ''
      } ${className}`}
    >
      {!isIndeterminate && (
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{
            width: `${clamped}%`,
            backgroundColor: TONE_COLOR[tone],
          }}
        />
      )}
    </div>
  );
}

export function ProgressRing({
  size = 18,
  value,
  indeterminate = false,
  className = '',
}: {
  size?: number;
  value?: number;
  indeterminate?: boolean;
  className?: string;
}) {
  const isIndeterminate = indeterminate || typeof value !== 'number';
  const strokeWidth = size <= 18 ? 2 : 2.25;
  const r = (size - strokeWidth * 2) / 2;
  const c = 2 * Math.PI * r;
  const clamped =
    typeof value === 'number' ? Math.max(4, Math.min(100, value)) : 28;
  const dashOffset = c - (clamped / 100) * c;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      aria-hidden="true"
      className={`shrink-0 ${isIndeterminate ? 'animate-spin' : '-rotate-90'} ${className}`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="var(--accent)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={dashOffset}
        className="transition-[stroke-dashoffset] duration-300 ease-out"
      />
    </svg>
  );
}

interface AsyncButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pending?: boolean;
  icon?: React.ReactNode;
  pendingLabel?: string;
  children: React.ReactNode;
}

export function AsyncButton({
  pending = false,
  icon,
  pendingLabel,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: AsyncButtonProps) {
  return (
    <button
      type={type}
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      className={`inline-flex items-center justify-center gap-2 transition-all disabled:opacity-45 ${className}`}
      {...rest}
    >
      {pending ? <InlineSpinner size="sm" /> : icon}
      <span>{pending && pendingLabel ? pendingLabel : children}</span>
    </button>
  );
}

export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-[var(--radius-control)] tornio-shimmer ${className}`}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  const widths = ['w-full', 'w-11/12', 'w-3/4', 'w-5/6', 'w-2/3'];
  return (
    <div aria-hidden="true" className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton key={idx} className={`h-3 ${widths[idx % widths.length]}`} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-2.5 w-full" />
      </div>
    </div>
  );
}

export function SkeletonAssetRow({ count = 4 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-5 space-y-2.5">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-3.5 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Skeleton className="h-8 w-8 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-2.5 w-1/3" />
              </div>
            </div>
            <Skeleton className="h-6 w-6 shrink-0" />
          </div>
        ))}
      </div>
      <div className="lg:col-span-7 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
        <div className="space-y-2 pb-4 border-b border-[var(--border)]">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

export function SkeletonJobCard({ count = 3 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="space-y-2.5">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg)] p-3.5 space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
            <Skeleton className="h-4 w-16 rounded-full shrink-0" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-2.5 w-8" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonMetadataGrid({ columns = 6 }: { columns?: number }) {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5"
    >
      {Array.from({ length: columns }).map((_, idx) => (
        <div
          key={idx}
          className="p-2.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] space-y-1.5"
        >
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonToolGrid({ count = 6 }: { count?: number }) {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
}
