'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  ShieldCheck,
  HardDrive,
  Code2,
  AlertTriangle,
  ArrowUpRight,
  Globe,
} from 'lucide-react';
import { tools, TOOL_CATEGORIES, ToolCategory } from '@/config/tools';
import ToolIcon from '@/components/pdf/ToolIcon';
import { useSystemStore } from '@/store/useSystemStore';

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  organizar: 'Organizar',
  optimizar: 'Optimizar',
  convertir: 'Convertir',
  editar: 'Editar',
  seguridad: 'Seguridad',
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'todas'>('todas');
  const { hasCheckedOnce, online, capabilities } = useSystemStore();

  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tools.filter((tool) => {
      const matchesCategory =
        selectedCategory === 'todas' || tool.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      const internetKeyword = tool.requiresInternet ? 'online internet red web' : 'offline local';
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        CATEGORY_LABELS[tool.category].toLowerCase().includes(q) ||
        internetKeyword.includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="flex-grow">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-200/70 dark:border-slate-800/80 bg-gradient-to-b from-white via-slate-50/70 to-slate-50 dark:from-slate-900 dark:via-[#0b111e] dark:to-[#090d16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 md:pt-14 md:pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-brand/15 border border-red-200/70 dark:border-brand/30 text-brand dark:text-red-400 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>100% Local-First · Procesamiento en tu equipo + utilidades Online opcionales</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight text-balance max-w-4xl mx-auto leading-[1.1]">
            Toda herramienta para <span className="text-brand">PDF</span>,{' '}
            <span className="underline decoration-brand/30 decoration-4 underline-offset-8">
              en tu propia máquina
            </span>
          </h1>

          <p className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-gray-600 dark:text-slate-400 leading-relaxed">
            Une, divide, firma, censura datos sensibles, comprime, traduce y captura páginas web a
            PDF con privacidad estricta y control total.
          </p>

          {/* Search & Category Filter Bar */}
          <div className="mt-8 max-w-3xl mx-auto space-y-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar herramienta (ej. firmar, censurar, traducir, URL, QR, comprimir, online)..."
                aria-label="Buscar herramienta PDF"
                className="w-full pl-12 pr-11 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-sm sm:text-base transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div
              role="tablist"
              aria-label="Filtrar herramientas por categoría"
              className="flex items-center justify-center gap-2 flex-wrap"
            >
              {TOOL_CATEGORIES.map((cat) => {
                const count =
                  cat.id === 'todas'
                    ? tools.length
                    : tools.filter((t) => t.category === cat.id).length;
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                      active
                        ? 'bg-brand text-white shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-800 hover:border-brand/50 hover:text-brand dark:hover:text-white'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        {filteredTools.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto">
            <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              No encontramos herramientas para &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
              Prueba con otro término o muestra todas las categorías disponibles.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('todas');
              }}
              className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-semibold transition-colors"
            >
              Ver todas las herramientas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTools.map((tool) => {
              const missingCap =
                tool.requiredCapability &&
                hasCheckedOnce &&
                online &&
                !capabilities[tool.requiredCapability];

              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-200 border border-gray-200/80 dark:border-slate-800 hover:border-brand/50 dark:hover:border-brand/60 flex flex-col h-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="group-hover:scale-105 transition-transform duration-200">
                      <ToolIcon tool={tool} size="lg" />
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {tool.requiresInternet && (
                        <span
                          title="Esta herramienta realiza consultas puntuales a Internet"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200/80 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800/70"
                        >
                          <Globe className="w-2.5 h-2.5" />
                          Online
                        </span>
                      )}
                      {tool.isNew && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand/10 text-brand dark:bg-brand/20 dark:text-red-400">
                          Nuevo
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400">
                        {CATEGORY_LABELS[tool.category]}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-brand dark:group-hover:text-brand-500 transition-colors">
                      {tool.name}
                    </h2>
                    <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-slate-600 group-hover:text-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                  </div>

                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed flex-grow">
                    {tool.description}
                  </p>

                  {missingCap && (
                    <div className="mt-4 pt-3 border-t border-amber-100 dark:border-amber-900/50 flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {tool.requiredCapability === 'ocr'
                          ? 'Requiere Tesseract instalado localmente'
                          : 'Requiere LibreOffice instalado localmente'}
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Privacy & Architecture Trust Strip */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-gray-200/80 dark:border-slate-800/80">
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-gray-200/60 dark:border-slate-800/80">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Privacidad Local Garantizada
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                Tus contratos, facturas y documentos confidenciales se procesan directamente en tu
                CPU y disco local sin pasar por servidores externos.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-gray-200/60 dark:border-slate-800/80">
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-brand/15 text-brand shrink-0">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Funciona 100% Sin Internet
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                Sin colas de espera, sin marcas de agua forzadas ni suscripciones. Velocidad nativa
                impulsada por PyMuPDF en tu propio equipo.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-gray-200/60 dark:border-slate-800/80">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Software Libre y Auditable
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                Distribuido bajo licencia MIT. Archivos temporales limpiados automáticamente tras
                cada operación.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
