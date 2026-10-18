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
  SunMoon,
  CornerDownLeft,
  Settings,
} from 'lucide-react';
import { tools, ToolItem } from '@/config/tools';
import ToolIcon from '@/components/pdf/ToolIcon';
import { useSystemStore } from '@/store/useSystemStore';
import { useSettingsStore } from '@/store/useSettingsStore';

interface QuickActionItem {
  id: string;
  label: string;
  description: string;
  onSelect: () => void;
  icon: React.ReactNode;
}

export default function CommandPalette() {
  const router = useRouter();
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setModulesModalOpen,
    immersiveMode,
    toggleImmersiveMode,
  } = useSystemStore();

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
        id: 'action-modules',
        label: 'Abrir Centro de Módulos Opcionales',
        description: 'Instalar o conectar Tesseract OCR y LibreOffice / Word en 1 clic',
        onSelect: () => {
          setCommandPaletteOpen(false);
          setModulesModalOpen(true);
        },
        icon: <Blocks className="w-4 h-4 text-brand" />,
      },
      {
        id: 'action-immersive',
        label: immersiveMode
          ? 'Desactivar Modo Inmersivo (Pantalla Completa)'
          : 'Activar Modo Inmersivo (Pantalla Completa)',
        description: 'Maximiza el espacio vertical de trabajo estilo aplicación de escritorio',
        onSelect: () => {
          setCommandPaletteOpen(false);
          toggleImmersiveMode();
        },
        icon: immersiveMode ? (
          <Minimize2 className="w-4 h-4 text-brand" />
        ) : (
          <Maximize2 className="w-4 h-4 text-brand" />
        ),
      },
      {
        id: 'action-theme',
        label: 'Cambiar Tema Claro/Oscuro',
        description: 'Alterna la apariencia visual de OpenPDF inmediatamente',
        onSelect: () => {
          setCommandPaletteOpen(false);
          const root = document.documentElement;
          const nextDark = !root.classList.contains('dark');
          useSettingsStore.getState().updateSetting('theme', nextDark ? 'dark' : 'light');
        },
        icon: <SunMoon className="w-4 h-4 text-brand" />,
      },
      {
        id: 'action-settings',
        label: 'Ajustes y Personalización',
        description: 'Personalizar tema, compresión, comprobar actualizaciones y dar opiniones',
        onSelect: () => {
          setCommandPaletteOpen(false);
          router.push('/settings');
        },
        icon: <Settings className="w-4 h-4 text-brand" />,
      },
    ],
    [immersiveMode, router, setCommandPaletteOpen, setModulesModalOpen, toggleImmersiveMode]
  );

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [query]);

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
      const tool: ToolItem | undefined = filteredTools[index];
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
      aria-label="Paleta rápida de herramientas y comandos"
      className="fixed inset-0 z-[110] flex items-start justify-center pt-14 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) setCommandPaletteOpen(false);
      }}
    >
      <div
        onKeyDown={handleKeyDown}
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Search Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-brand shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ir a herramienta o ejecutar comando (ej. OCR, firmar, módulos, pantalla completa)..."
            aria-label="Buscar herramienta o comando"
            className="w-full bg-transparent text-sm sm:text-base text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-200"
              aria-label="Limpiar texto"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[62vh] overflow-y-auto p-2 space-y-3">
          {totalCount === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500 dark:text-slate-400">
              No se encontraron herramientas ni acciones para &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <>
              {filteredTools.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                    Herramientas PDF ({filteredTools.length})
                  </div>
                  <div className="space-y-0.5">
                    {filteredTools.map((tool, idx) => {
                      const active = selectedIndex === idx;
                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onMouseEnter={() => setSelectedIndex(idx)}
                          onClick={() => triggerAtIndex(idx)}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                            active
                              ? 'bg-red-50/90 dark:bg-slate-800 text-brand'
                              : 'text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <ToolIcon tool={tool} size="sm" />
                            <div className="min-w-0">
                              <div className="text-sm font-bold truncate">{tool.name}</div>
                              <div className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                {tool.description}
                              </div>
                            </div>
                          </div>
                          <ArrowRight
                            className={`w-4 h-4 shrink-0 ${
                              active ? 'text-brand' : 'text-gray-300 dark:text-slate-600'
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
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                    Acciones Rápidas del Sistema
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
                          className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                            active
                              ? 'bg-red-50/90 dark:bg-slate-800 text-brand'
                              : 'text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              {act.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold truncate">{act.label}</div>
                              <div className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                {act.description}
                              </div>
                            </div>
                          </div>
                          <CornerDownLeft
                            className={`w-4 h-4 shrink-0 ${
                              active ? 'text-brand' : 'text-gray-300 dark:text-slate-600'
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

        {/* Footer Hints */}
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-950/80 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400">
          <span>Usa las flechas Arriba/Abajo para navegar y Enter para abrir</span>
          <span className="font-mono">Ctrl+K</span>
        </div>
      </div>
    </div>
  );
}
