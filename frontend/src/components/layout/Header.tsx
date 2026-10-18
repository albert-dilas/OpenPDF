'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  Search,
  Blocks,
  Maximize2,
  Minimize2,
  Settings,
} from 'lucide-react';
import { tools, TOOL_CATEGORIES, ToolCategory } from '@/config/tools';
import ToolIcon from '@/components/pdf/ToolIcon';
import {
  SystemStatusBadge,
  SystemStatusPoller,
  UpdateBanner,
} from '@/components/system/SystemStatus';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useSystemStore } from '@/store/useSystemStore';

function OpenPdfEmblem() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      className="w-9 h-9 shrink-0 shadow-sm rounded-xl group-hover:scale-105 transition-transform"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="openpdf-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#openpdf-bg)" />
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="9"
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1"
      />
      {/* White folded page */}
      <path
        d="M11 7.5h11.5L29 14v18.5a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2v-23a2 2 0 0 1 2-2z"
        fill="#ffffff"
      />
      <path d="M22.5 7.5V14H29z" fill="#fecaca" />
      {/* Dark PDF ribbon */}
      <rect x="7.5" y="21" width="25" height="9.5" rx="2.5" fill="#0f172a" />
      <text
        x="20"
        y="27.6"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="6.8"
        fontWeight="900"
        fontFamily="system-ui, sans-serif"
        letterSpacing="0.6"
      >
        PDF
      </text>
    </svg>
  );
}

function GithubIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

const NAV_CATEGORIES = TOOL_CATEGORIES.filter(
  (c): c is { id: ToolCategory; label: string } => c.id !== 'todas'
);

export default function Header() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ToolCategory | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const {
    capabilities,
    hasCheckedOnce,
    online,
    immersiveMode,
    toggleImmersiveMode,
    setModulesModalOpen,
    setCommandPaletteOpen,
  } = useSystemStore();

  const allModulesReady =
    !hasCheckedOnce || !online || (capabilities.ocr && capabilities.word_to_pdf);

  useEffect(() => {
    const syncTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    syncTheme();
    window.addEventListener('openpdf-theme-change', syncTheme);
    return () => window.removeEventListener('openpdf-theme-change', syncTheme);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveCategory(null);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveCategory(null);
      }
    };
    if (activeCategory) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeCategory]);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextDark = !root.classList.contains('dark');
    useSettingsStore.getState().updateSetting('theme', nextDark ? 'dark' : 'light');
    setIsDark(nextDark);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200/80 dark:border-slate-800 transition-colors">
      <SystemStatusPoller />
      <UpdateBanner />

      <nav
        aria-label="Navegación principal"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg"
          >
            <OpenPdfEmblem />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                Open<span className="text-brand">PDF</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                <ShieldCheck className="w-3 h-3 text-brand" />
                Local
              </span>
            </div>
          </Link>

          {/* Desktop Category Navigation */}
          <div className="hidden xl:flex items-center gap-1" ref={navRef}>
            {NAV_CATEGORIES.map((cat) => {
              const catTools = tools.filter((t) => t.category === cat.id);
              const isOpen = activeCategory === cat.id;
              return (
                <div key={cat.id} className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveCategory((prev) => (prev === cat.id ? null : cat.id))
                    }
                    aria-expanded={isOpen}
                    className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                      isOpen
                        ? 'bg-red-50 text-brand dark:bg-slate-800 dark:text-brand-500'
                        : 'text-gray-700 dark:text-slate-300 hover:text-brand dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    {cat.label}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-brand' : 'text-gray-400'
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-fade-in">
                      <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                        {cat.label} PDF ({catTools.length})
                      </div>
                      <div className="space-y-1">
                        {catTools.map((tool) => (
                          <Link
                            key={tool.id}
                            href={tool.href}
                            onClick={() => setActiveCategory(null)}
                            className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                              pathname === tool.href
                                ? 'bg-red-50/90 dark:bg-slate-800 text-brand'
                                : 'hover:bg-gray-50 dark:hover:bg-slate-800/70 text-gray-900 dark:text-slate-100'
                            }`}
                          >
                            <ToolIcon tool={tool} size="sm" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold truncate">
                                  {tool.name}
                                </span>
                                {tool.requiresInternet && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300">
                                    Online
                                  </span>
                                )}
                                {tool.isNew && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-brand/10 text-brand dark:bg-brand/20">
                                    Nuevo
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1">
                                {tool.description}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Command Palette Trigger */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            aria-label="Abrir buscador rápido de herramientas (Ctrl+K)"
            title="Buscar herramienta o comando (Ctrl+K)"
            className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-gray-500 dark:text-slate-400 bg-gray-100/80 dark:bg-slate-800/80 hover:bg-gray-200/70 dark:hover:bg-slate-800 border border-gray-200/80 dark:border-slate-700/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Search className="w-3.5 h-3.5 text-brand" />
            <span className="hidden md:inline">Buscar...</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 rounded border border-gray-200 dark:border-slate-700">
              Ctrl+K
            </kbd>
          </button>

          {/* Modules Center Button */}
          <button
            type="button"
            onClick={() => setModulesModalOpen(true)}
            aria-label="Abrir Centro de Módulos Opcionales"
            title="Configurar o instalar módulos locales (OCR y Word a PDF)"
            className="relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200/80 dark:border-slate-700/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Blocks className="w-3.5 h-3.5 text-brand" />
            <span className="hidden sm:inline">Módulos</span>
            <span
              className={`h-2 w-2 rounded-full ${
                allModulesReady ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
            />
          </button>

          <SystemStatusBadge />

          {/* Immersive Mode Toggle */}
          <button
            type="button"
            onClick={toggleImmersiveMode}
            aria-label={
              immersiveMode ? 'Salir de modo inmersivo' : 'Activar modo inmersivo'
            }
            title={
              immersiveMode
                ? 'Salir de modo inmersivo (Pantalla completa)'
                : 'Modo inmersivo de escritorio (Pantalla completa)'
            }
            className={`hidden sm:inline-flex p-2 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              immersiveMode
                ? 'bg-brand text-white border-brand'
                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 border-gray-200/80 dark:border-slate-700/80'
            }`}
          >
            {immersiveMode ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
            className="p-2 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200/80 dark:border-slate-700/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Settings Page Button */}
          <Link
            href="/settings"
            aria-label="Ajustes y Personalización"
            title="Ajustes de la aplicación y comprobación de actualizaciones"
            className={`p-2 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              pathname === '/settings'
                ? 'bg-brand text-white border-brand'
                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 border-gray-200/80 dark:border-slate-700/80'
            }`}
          >
            <Settings className="w-4 h-4" />
          </Link>

          <a
            href="https://github.com/albert-dilas/OpenPDF"
            target="_blank"
            rel="noreferrer"
            aria-label="Repositorio en GitHub"
            title="Ver código fuente en GitHub"
            className="hidden sm:inline-flex p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <GithubIcon size={18} />
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Cerrar menú de herramientas' : 'Abrir menú de herramientas'}
            aria-expanded={mobileMenuOpen}
            className="xl:hidden p-2 rounded-xl text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-h-[80vh] overflow-y-auto px-4 py-5 space-y-6 shadow-2xl animate-fade-in">
          {NAV_CATEGORIES.map((cat) => {
            const catTools = tools.filter((t) => t.category === cat.id);
            return (
              <div key={cat.id} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 px-2">
                  {cat.label}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {catTools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={tool.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                        pathname === tool.href
                          ? 'bg-red-50 dark:bg-slate-800 text-brand'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-800/70 text-gray-800 dark:text-slate-200'
                      }`}
                    >
                      <ToolIcon tool={tool} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold">{tool.name}</span>
                          {tool.isNew && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-brand/10 text-brand">
                              Nuevo
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Settings in Mobile Drawer */}
          <div className="pt-4 border-t border-gray-200 dark:border-slate-800">
            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 p-3 rounded-2xl transition-colors ${
                pathname === '/settings'
                  ? 'bg-red-50 dark:bg-slate-800 text-brand'
                  : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-800 dark:text-slate-200'
              }`}
            >
              <div className="p-2 rounded-xl bg-brand/10 text-brand">
                <Settings className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold">Ajustes y Personalización</div>
                <div className="text-xs text-gray-500 dark:text-slate-400">
                  Comprobar actualizaciones, personalizar tema y soporte
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
