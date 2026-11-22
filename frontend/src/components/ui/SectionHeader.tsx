import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}

export default function SectionHeader({
  title,
  subtitle,
  eyebrow,
  actions,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <div className="space-y-0.5 min-w-0">
        {eyebrow && (
          <span className="block text-[10px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
            {eyebrow}
          </span>
        )}
        <h2 className="text-sm font-semibold text-[var(--fg)] tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--fg-muted)]">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
