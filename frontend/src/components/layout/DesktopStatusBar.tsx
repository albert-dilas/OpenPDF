'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Search,
  Blocks,
  ShieldCheck,
  Lock,
  Heart,
} from 'lucide-react';
import { useSystemStore } from '@/store/useSystemStore';

export function DesktopFooter() {
  const immersiveMode = useSystemStore((s) => s.immersiveMode);
  if (immersiveMode) return null;

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-gray-200/80 dark:border-slate-800 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-3 text-gray-500 dark:text-slate-400 text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold text-gray-800 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              OpenPDF Local-First
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-brand" />
              Tus archivos se procesan en tu máquina
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="inline-flex items-center gap-1">
              Creado con <Heart size={14} className="text-brand fill-brand" /> código abierto
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-gray-500 dark:text-slate-400">
            <Link href="/" className="hover:text-brand dark:hover:text-brand transition-colors">
              Herramientas
            </Link>
            <Link
              href="/privacidad"
              className="hover:text-brand dark:hover:text-brand transition-colors"
            >
              Privacidad Local
            </Link>
            <Link
              href="/terminos"
              className="hover:text-brand dark:hover:text-brand transition-colors"
            >
              Términos y Licencia MIT
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function DesktopStatusBar() {
  const {
    online,
    hasCheckedOnce,
    version,
    capabilities,
    immersiveMode,
    toggleImmersiveMode,
    setModulesModalOpen,
    setCommandPaletteOpen,
  } = useSystemStore();

  const isOffline = hasCheckedOnce && !online;

  return (
    <div
      role="region"
      aria-label="Barra de estado de escritorio"
      className="fixed bottom-0 inset-x-0 z-40 h-7 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 px-3 sm:px-5 flex items-center justify-between text-[11px] font-medium text-gray-600 dark:text-slate-400 select-none"
    >
      {/* Left: Local Engine & Version */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              isOffline ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          />
          <span className="font-semibold text-gray-800 dark:text-slate-200 truncate">
            {isOffline ? '127.0.0.1 · Desconectado' : '127.0.0.1 · Local-First Activo'}
          </span>
        </div>

        <span className="text-gray-300 dark:text-slate-700">|</span>

        <span className="font-mono text-[10px] text-gray-500 dark:text-slate-400">
          v{version || '2.2.0'}
        </span>

        {/* Quick Module Indicators */}
        <button
          type="button"
          onClick={() => setModulesModalOpen(true)}
          title="Abrir Centro de Módulos Opcionales"
          className="hidden md:inline-flex items-center gap-2.5 px-2 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-colors"
        >
          <span className="inline-flex items-center gap-1">
            <Blocks className="w-3 h-3 text-brand" />
            <span>OCR:</span>
            {capabilities.ocr ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-amber-500" />
            )}
          </span>
          <span className="inline-flex items-center gap-1">
            <span>Word-&gt;PDF:</span>
            {capabilities.word_to_pdf ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-amber-500" />
            )}
          </span>
        </button>
      </div>

      {/* Right: Shortcuts & Immersive Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800/80 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <Search className="w-3 h-3 text-brand" />
          <span>Ctrl+K Paleta rápida</span>
        </button>

        <span className="hidden sm:inline text-gray-300 dark:text-slate-700">|</span>

        <button
          type="button"
          onClick={toggleImmersiveMode}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-semibold transition-colors ${
            immersiveMode
              ? 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-red-400'
              : 'hover:bg-gray-100 dark:hover:bg-slate-800/80 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {immersiveMode ? (
            <>
              <Minimize2 className="w-3 h-3" />
              <span>Salir de Modo Inmersivo</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3 h-3" />
              <span>Modo Inmersivo</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
