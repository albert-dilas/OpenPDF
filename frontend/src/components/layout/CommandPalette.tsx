'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  ArrowRight,
  Blocks,
  Maximize2,
  Minimize2,
  Palette,
  CornerDownLeft,
  Settings,
  Inbox,
  Film,
  Activity,
  Languages,
} from 'lucide-react';
import { ALL_STUDIO_TOOLS, StudioToolItem } from '@/config/studios';
import { useSystemStore } from '@/store/useSystemStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { AppSkin } from '@/lib/appearance';
import { useI18n } from '@/i18n';

interface QuickActionItem {
  id: string;
  label: string;
  description: string;
  onSelect: () => void;
  icon: React.ReactNode;
}

const SKIN_CYCLE: AppSkin[] = ['porcelain', 'carbon', 'swiss'];

export default function CommandPalette() {
  const router = useRouter();
  const { t, toggleLocale } = useI18n();
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setModulesModalOpen,
    immersiveMode,
    toggleImmersiveMode,
  } = useSystemStore();
  const { skin, jobDrawerOpen, updateSetting } = useSettingsStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!useSystemStore.getState().commandPaletteOpen);
      } else if (e.key === 'Escape' && useSystemStore.getState().commandPaletteOpen) {
        e.preventDefault();
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 20);
    }
  }, [commandPaletteOpen]);

  const quickActions: QuickActionItem[] = useMemo(
    () => [
      {
        id: 'action-workspace',
        label: t.commandPalette.actions.workspace.label,
        description: t.commandPalette.actions.workspace.description,
        onSelect: () => {
          setCommandPaletteOpen(false);
          router.push('/workspace');
        },
        icon: <Inbox className="w-4 h-4" />,
      },
      {
        id: 'action-video',
        label: t.commandPalette.actions.videoStudio.label,
        description: t.commandPalette.actions.videoStudio.description,
        onSelect: () => {
          setCommandPaletteOpen(false);
          router.push('/video-studio');
        },
        icon: <Film className="w-4 h-4" />,
      },
      {
        id: 'action-modules',
        label: t.commandPalette.actions.modules.label,
        description: t.commandPalette.actions.modules.description,
        onSelect: () => {
          setCommandPaletteOpen(false);
          setModulesModalOpen(true);
        },
        icon: <Blocks className="w-4 h-4" />,
      },
      {
        id: 'action-jobs',
        label: t.commandPalette.actions.jobDrawer.label,
        description: t.commandPalette.actions.jobDrawer.description,
        onSelect: () => {
          setCommandPaletteOpen(false);
          updateSetting('jobDrawerOpen', !jobDrawerOpen);
        },
        icon: <Activity className="w-4 h-4" />,
      },
      {
        id: 'action-locale',
        label: t.commandPalette.actions.toggleLocale.label,
        description: t.commandPalette.actions.toggleLocale.description,
        onSelect: () => {
          setCommandPaletteOpen(false);
          toggleLocale();
        },
        icon: <Languages className="w-4 h-4" />,
      },
      {
        id: 'action-skin',
        label: t.commandPalette.actions.cycleSkin.label,
        description: t.commandPalette.actions.cycleSkin.description,
        onSelect: () => {
          setCommandPaletteOpen(false);
          const idx = SKIN_CYCLE.indexOf(skin === 'system' ? 'porcelain' : skin);
          updateSetting('skin', SKIN_CYCLE[(idx + 1) % SKIN_CYCLE.length]);
        },
        icon: <Palette className="w-4 h-4" />,
      },
      {
        id: 'action-immersive',
        label: immersiveMode
          ? t.commandPalette.actions.immersiveOff.label
          : t.commandPalette.actions.immersiveOn.label,
        description: immersiveMode
          ? t.commandPalette.actions.immersiveOff.description
          : t.commandPalette.actions.immersiveOn.description,
        onSelect: () => {
          setCommandPaletteOpen(false);
          toggleImmersiveMode();
        },
        icon: immersiveMode ? (
          <Minimize2 className="w-4 h-4" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        ),
      },
      {
        id: 'action-settings',
        label: t.commandPalette.actions.settings.label,
        description: t.commandPalette.actions.settings.description,
        onSelect: () => {
          setCommandPaletteOpen(false);
          router.push('/settings');
        },
        icon: <Settings className="w-4 h-4" />,
      },
    ],
    [
      immersiveMode,
      jobDrawerOpen,
      router,
      setCommandPaletteOpen,
      setModulesModalOpen,
      skin,
      t,
      toggleImmersiveMode,
      toggleLocale,
      updateSetting,
    ]
  );

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...ALL_STUDIO_TOOLS].sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === 'active' ? -1 : 1;
    });
    if (!q) return sorted;
    return sorted.filter((tool) => {
      const copy = t.tools[tool.id];
      const studioName = t.studios[tool.studio].name.toLowerCase();
      return (
        tool.id.toLowerCase().includes(q) ||
        (copy?.name.toLowerCase().includes(q) ?? false) ||
        (copy?.description.toLowerCase().includes(q) ?? false) ||
        studioName.includes(q) ||
        tool.category.toLowerCase().includes(q)
      );
    });
  }, [query, t]);

  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quickActions;
    return quickActions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    );
  }, [query, quickActions]);

  const totalCount = filteredTools.length + filteredActions.length;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!commandPaletteOpen) return null;

  const triggerAtIndex = (index: number) => {
    if (index < filteredTools.length) {
      const tool: StudioToolItem | undefined = filteredTools[index];
      if (tool) {
        setCommandPaletteOpen(false);
        router.push(tool.href);
      }
    } else {
      const action = filteredActions[index - filteredTools.length];
      if (action) {
        action.onSelect();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (totalCount === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalCount) % totalCount);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      triggerAtIndex(selectedIndex);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.commandPalette.ariaLabel}
      className="fixed inset-0 z-[110] flex items-start justify-center pt-14 sm:pt-20 px-4 bg-black/60 backdrop-blur-[2px] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) setCommandPaletteOpen(false);
      }}
    >
      <div
        onKeyDown={handleKeyDown}
        className="w-full max-w-2xl rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden text-[var(--fg)]"
      >
        {/* Search Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Search className="w-4 h-4 text-[var(--fg-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.commandPalette.placeholder}
            aria-label={t.commandPalette.ariaLabel}
            className="w-full bg-transparent text-sm text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-[var(--radius-control)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
              aria-label={t.commandPalette.clearInput}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold text-[var(--fg-muted)] bg-[var(--surface-muted)] rounded border border-[var(--border)]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3 scrollbar-thin">
          {totalCount === 0 ? (
            <div className="py-10 text-center text-xs text-[var(--fg-muted)]">
              {t.commandPalette.noResults} &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <>
              {filteredTools.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
                    {t.commandPalette.toolsGroup} ({filteredTools.length})
                  </div>
                  <div className="space-y-0.5">
                    {filteredTools.map((tool, idx) => {
                      const active = selectedIndex === idx;
                      const copy = t.tools[tool.id];
                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onMouseEnter={() => setSelectedIndex(idx)}
                          onClick={() => triggerAtIndex(idx)}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-[var(--radius-control)] text-left transition-colors ${
                            active
                              ? 'bg-[var(--accent-soft)] text-[var(--fg)]'
                              : 'text-[var(--fg)] hover:bg-[var(--surface-muted)]'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold truncate">
                                {copy?.name ?? tool.id}
                              </span>
                              <span className="text-[10px] font-mono text-[var(--fg-muted)]">
                                {t.studios[tool.studio].name}
                              </span>
                              {tool.status === 'phase2' && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono uppercase border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--fg-muted)]">
                                  {tool.phaseTarget || t.common.phase2}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--fg-muted)] truncate mt-0.5">
                              {copy?.description ?? ''}
                            </p>
                          </div>
                          <ArrowRight
                            className={`w-3.5 h-3.5 shrink-0 ${
                              active ? 'text-[var(--fg)]' : 'text-[var(--fg-muted)] opacity-50'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredActions.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
                    {t.commandPalette.actionsGroup}
                  </div>
                  <div className="space-y-0.5">
                    {filteredActions.map((act, i) => {
                      const idx = filteredTools.length + i;
                      const active = selectedIndex === idx;
                      return (
                        <button
                          key={act.id}
                          type="button"
                          onMouseEnter={() => setSelectedIndex(idx)}
                          onClick={() => triggerAtIndex(idx)}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-[var(--radius-control)] text-left transition-colors ${
                            active
                              ? 'bg-[var(--accent-soft)] text-[var(--fg)]'
                              : 'text-[var(--fg)] hover:bg-[var(--surface-muted)]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center shrink-0">
                              {act.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold truncate">{act.label}</div>
                              <div className="text-[11px] text-[var(--fg-muted)] truncate">
                                {act.description}
                              </div>
                            </div>
                          </div>
                          <CornerDownLeft
                            className={`w-3.5 h-3.5 shrink-0 ${
                              active ? 'text-[var(--fg)]' : 'text-[var(--fg-muted)] opacity-50'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[var(--bg)] border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--fg-muted)]">
          <span>{t.commandPalette.footerHint}</span>
          <span className="font-mono">Ctrl+K</span>
        </div>
      </div>
    </div>
  );
}
