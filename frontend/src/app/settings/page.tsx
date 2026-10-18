'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Sparkles,
  Cpu,
  ScanText,
  FileOutput,
  Copy,
  ExternalLink,
  MessageSquare,
  Bug,
  Lightbulb,
  SlidersHorizontal,
  Layers,
  ShieldCheck,
  Check,
  RotateCcw,
  Trash2,
  ChevronRight,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettingsStore, CompressionLevel, OcrLanguage, PdfToJpgDpi } from '@/store/useSettingsStore';
import { useSystemStore } from '@/store/useSystemStore';
import { GithubIcon } from '@/components/BrandIcons';
import UpdateModal from '@/components/system/UpdateModal';
import { SystemUpdateResponse } from '@/lib/api';

type SettingsTab = 'general' | 'processing' | 'modules' | 'updates' | 'feedback';
type FeedbackCategory = 'feature' | 'bug' | 'opinion';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Settings store
  const {
    theme,
    immersiveByDefault,
    compactGrid,
    reduceAnimations,
    defaultCompression,
    defaultOcrLanguage,
    defaultPdfToJpgDpi,
    outputFilenamePattern,
    autoCheckUpdatesOnStart,
    updateSetting,
    resetDefaults,
  } = useSettingsStore();

  // System store
  const {
    version,
    online,
    capabilities,
    ocrLanguages,
    maxFileSizeMb,
    checkForUpdatesRealtime,
    submitFeedback,
    setModulesModalOpen,
  } = useSystemStore();

  // Update check state
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState<SystemUpdateResponse | null>(null);

  // Feedback form state
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>('feature');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Trigger real-time update check
  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true);
    setUpdateModalOpen(true);
    try {
      const res = await checkForUpdatesRealtime();
      setUpdateResult(res);
    } catch {
      setUpdateResult({
        current: version || '2.2.0',
        latest: null,
        update_available: false,
        online: false,
        url: 'https://github.com/albert-dilas/OpenPDF/releases',
      });
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // Build GitHub issue markdown template
  const generateMarkdownReport = () => {
    const categoryLabel =
      feedbackCategory === 'feature'
        ? '[Propuesta de Función]'
        : feedbackCategory === 'bug'
        ? '[Reporte de Error]'
        : '[Opinión / Sugerencia]';

    const diagnosticBlock = includeDiagnostics
      ? `\n### Diagnóstico del Entorno Local\n- **Versión de OpenPDF:** v${version || '2.2.0'}\n- **Modo:** 100% Local-First\n- **OCR (Tesseract):** ${capabilities.ocr ? 'Conectado' : 'No disponible'}\n- **Word a PDF:** ${capabilities.word_to_pdf ? 'Conectado' : 'No disponible'}\n- **Idiomas OCR:** ${(ocrLanguages || []).join(', ') || 'N/A'}\n- **Límite de archivo:** ${maxFileSizeMb} MB\n- **Navegador / Plataforma:** ${typeof navigator !== 'undefined' ? navigator.userAgent : 'Desconocido'}\n`
      : '';

    return `## ${categoryLabel} ${feedbackTitle.trim() || 'Sin título'}

### Descripción
${feedbackDescription.trim() || 'Sin descripción detallada.'}
${diagnosticBlock}
---
*Generado desde la sección de Ajustes de OpenPDF.*`;
  };

  // Submit feedback locally
  const handleSubmitLocalFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTitle.trim() || !feedbackDescription.trim()) {
      toast.error('Por favor, completa el título y la descripción del reporte.');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      await submitFeedback({
        category: feedbackCategory,
        title: feedbackTitle.trim(),
        description: feedbackDescription.trim(),
        email: feedbackEmail.trim(),
        system_info: includeDiagnostics
          ? {
              version: version || '2.2.0',
              ocr: capabilities.ocr,
              word_to_pdf: capabilities.word_to_pdf,
              max_file_size_mb: maxFileSizeMb,
            }
          : {},
      });
      toast.success('Comentario registrado en el sistema local con éxito.');
      setFeedbackTitle('');
      setFeedbackDescription('');
    } catch {
      toast.error('No se pudo registrar en el motor local. Puedes abrir un Issue en GitHub.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Open GitHub issue with pre-filled content
  const handleOpenGitHubIssue = () => {
    if (!feedbackTitle.trim()) {
      toast.error('Indica un título para el reporte antes de abrir GitHub.');
      return;
    }

    const titlePrefix =
      feedbackCategory === 'feature'
        ? 'feat: '
        : feedbackCategory === 'bug'
        ? 'fix: '
        : 'feedback: ';

    const rawReport = generateMarkdownReport();
    const encodedBody = encodeURIComponent(rawReport);
    const fullTitle = encodeURIComponent(`${titlePrefix}${feedbackTitle.trim()}`);

    // If report is too long for browser URL limits, copy to clipboard and open with title only
    if (encodedBody.length > 2500) {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(rawReport).catch(() => {});
      }
      toast.success(
        'El reporte es extenso: se ha copiado automáticamente al portapapeles en formato Markdown para que puedas pegarlo en la incidencia.'
      );
      const shortUrl = `https://github.com/albert-dilas/OpenPDF/issues/new?title=${fullTitle}`;
      if (typeof window !== 'undefined') {
        window.open(shortUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    const githubUrl = `https://github.com/albert-dilas/OpenPDF/issues/new?title=${fullTitle}&body=${encodedBody}`;

    if (typeof window !== 'undefined') {
      window.open(githubUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Copy report to clipboard
  const handleCopyMarkdown = async () => {
    const report = generateMarkdownReport();
    try {
      await navigator.clipboard.writeText(report);
      toast.success('Reporte copiado al portapapeles en formato Markdown.');
    } catch {
      toast.error('No se pudo copiar automáticamente.');
    }
  };

  // Clear cache action
  const handleClearCache = () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.clear();
        toast.success('Caché temporal de la sesión limpiada correctamente.');
      } catch {
        toast.error('Error al limpiar la caché temporal.');
      }
    }
  };

  return (
    <div className="flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      {/* Breadcrumb & Navigation */}
      <nav aria-label="Ruta de navegación" className="mb-6 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
        <Link href="/" className="hover:text-brand transition-colors font-medium">
          Inicio
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900 dark:text-slate-200">Ajustes</span>
      </nav>

      {/* Main Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-brand/10 dark:bg-brand/20 text-brand shadow-sm">
            <SettingsIcon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Ajustes y Personalización
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Personaliza la experiencia de OpenPDF a tu gusto, comprueba actualizaciones en tiempo real y comparte tus ideas para mejorar la herramienta.
            </p>
          </div>
        </div>

        {/* Quick Check for Updates Header Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCheckForUpdates}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check for Updates</span>
          </button>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="mt-6 flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-gray-200/80 dark:border-slate-800 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
            activeTab === 'general'
              ? 'bg-red-50 text-brand dark:bg-slate-800 dark:text-red-400'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>General y Apariencia</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('processing')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
            activeTab === 'processing'
              ? 'bg-red-50 text-brand dark:bg-slate-800 dark:text-red-400'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Procesamiento de Archivos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('modules')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
            activeTab === 'modules'
              ? 'bg-red-50 text-brand dark:bg-slate-800 dark:text-red-400'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Motores y Módulos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('updates')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
            activeTab === 'updates'
              ? 'bg-red-50 text-brand dark:bg-slate-800 dark:text-red-400'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Actualizaciones</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('feedback')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
            activeTab === 'feedback'
              ? 'bg-red-50 text-brand dark:bg-slate-800 dark:text-red-400'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Opiniones y Soporte</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="mt-8 space-y-6">
        {/* ================= TAB 1: GENERAL Y APARIENCIA ================= */}
        {activeTab === 'general' && (
          <div className="space-y-6 animate-fade-in">
            {/* Theme Selector Card */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Tema y Apariencia Visual
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Selecciona la paleta de colores para la interfaz de OpenPDF.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* Light Mode */}
                <button
                  type="button"
                  onClick={() => updateSetting('theme', 'light')}
                  className={`p-4 rounded-xl border flex flex-col items-start gap-3 transition-all text-left ${
                    theme === 'light'
                      ? 'border-brand bg-red-50/40 dark:bg-brand/10 ring-2 ring-brand'
                      : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                      <Sun className="w-5 h-5" />
                    </div>
                    {theme === 'light' && <Check className="w-4 h-4 text-brand" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      Modo Claro
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400">
                      Fondo blanco de alto contraste
                    </span>
                  </div>
                </button>

                {/* Dark Mode */}
                <button
                  type="button"
                  onClick={() => updateSetting('theme', 'dark')}
                  className={`p-4 rounded-xl border flex flex-col items-start gap-3 transition-all text-left ${
                    theme === 'dark'
                      ? 'border-brand bg-red-50/40 dark:bg-brand/10 ring-2 ring-brand'
                      : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="p-2 rounded-lg bg-slate-800 text-slate-200">
                      <Moon className="w-5 h-5" />
                    </div>
                    {theme === 'dark' && <Check className="w-4 h-4 text-brand" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      Modo Oscuro
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400">
                      Diseño en gris grafito profundo
                    </span>
                  </div>
                </button>

                {/* System Mode */}
                <button
                  type="button"
                  onClick={() => updateSetting('theme', 'system')}
                  className={`p-4 rounded-xl border flex flex-col items-start gap-3 transition-all text-left ${
                    theme === 'system'
                      ? 'border-brand bg-red-50/40 dark:bg-brand/10 ring-2 ring-brand'
                      : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300">
                      <Monitor className="w-5 h-5" />
                    </div>
                    {theme === 'system' && <Check className="w-4 h-4 text-brand" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      Automático (Sistema)
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400">
                      Sincroniza con Windows
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Display & Layout Preferences */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800/80 shadow-sm">
              {/* Immersive Mode Toggle */}
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-brand" />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      Modo inmersivo predeterminado al abrir
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xl">
                    Maximiza el área vertical de la aplicación reduciendo márgenes para una experiencia de escritorio óptima.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={immersiveByDefault}
                  onChange={(e) => updateSetting('immersiveByDefault', e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-brand focus:ring-brand cursor-pointer"
                  aria-label="Activar modo inmersivo predeterminado"
                />
              </div>

              {/* Compact Grid Toggle */}
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-bold text-gray-900 dark:text-white block">
                    Cuadrícula compacta de herramientas
                  </span>
                  <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xl">
                    Reduce el espaciado entre tarjetas para ver mayor número de herramientas sin necesidad de desplazarse.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={compactGrid}
                  onChange={(e) => updateSetting('compactGrid', e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-brand focus:ring-brand cursor-pointer"
                  aria-label="Activar cuadrícula compacta"
                />
              </div>

              {/* Reduce Animations Toggle */}
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-bold text-gray-900 dark:text-white block">
                    Reducir animaciones de interfaz
                  </span>
                  <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xl">
                    Desactiva transiciones y efectos visuales para maximizar la velocidad en equipos con especificaciones modestas.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={reduceAnimations}
                  onChange={(e) => updateSetting('reduceAnimations', e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-brand focus:ring-brand cursor-pointer"
                  aria-label="Reducir animaciones"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: PROCESAMIENTO ================= */}
        {activeTab === 'processing' && (
          <div className="space-y-6 animate-fade-in">
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-6 shadow-sm">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Valores Predeterminados para Herramientas PDF
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Configura los ajustes por defecto que se aplicarán al procesar tus documentos sin tener que elegirlos cada vez.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Default Compression Level */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Nivel de compresión predeterminado
                  </label>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Ajuste por defecto en la herramienta Comprimir PDF.
                  </p>
                  <select
                    value={defaultCompression}
                    onChange={(e) => updateSetting('defaultCompression', e.target.value as CompressionLevel)}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="medium">Media / Recomendada (Equilibrio óptimo entre compresión y legibilidad)</option>
                    <option value="high">Alta (Máxima reducción de peso con optimización de imágenes)</option>
                    <option value="low">Baja (Rápida, máxima fidelidad visual sin compresión destructiva)</option>
                  </select>
                </div>

                {/* Default OCR Language */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Idioma predeterminado para OCR
                  </label>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Modelo de lenguaje principal para reconocimiento de texto escaneado.
                  </p>
                  <select
                    value={defaultOcrLanguage}
                    onChange={(e) => updateSetting('defaultOcrLanguage', e.target.value as OcrLanguage)}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="spa">Español (spa)</option>
                    <option value="eng">Inglés (eng)</option>
                  </select>
                </div>

                {/* Default PDF to JPG DPI */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Resolución de exportación PDF a JPG
                  </label>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Densidad de píxeles al generar imágenes rasterizadas.
                  </p>
                  <select
                    value={defaultPdfToJpgDpi}
                    onChange={(e) => updateSetting('defaultPdfToJpgDpi', Number(e.target.value) as PdfToJpgDpi)}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value={300}>300 DPI (Alta resolución para impresión o archivo legal)</option>
                    <option value={150}>150 DPI (Equilibrada para visualización digital)</option>
                    <option value={72}>72 DPI (Rápida / Tamaño mínimo para web)</option>
                  </select>
                </div>

                {/* Output Filename Pattern */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Patrón de nombre de archivo descargado
                  </label>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Usa &ldquo;{'{name}'}&rdquo; como comodín para el nombre original.
                  </p>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={outputFilenamePattern}
                      onChange={(e) => updateSetting('outputFilenamePattern', e.target.value)}
                      placeholder="{name}_procesado"
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <span className="text-[11px] text-gray-400 dark:text-slate-500">
                      Vista previa:{' '}
                      <code className="text-brand font-mono font-semibold">
                        {(outputFilenamePattern || '{name}').replace('{name}', 'documento')}.pdf
                      </code>
                    </span>
                  </div>
                </div>
              </div>

              {/* Cache Management Action */}
              <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-900 dark:text-white block">
                    Caché temporal de procesamiento
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    Limpia los identificadores de sesión y datos temporales almacenados en el navegador.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-300 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                  <span>Limpiar caché temporal</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: MODULOS LOCALES ================= */}
        {activeTab === 'modules' && (
          <div className="space-y-6 animate-fade-in">
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    Estado de Motores Locales
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    OpenPDF utiliza motores locales instalados en tu sistema para realizar tareas complejas sin enviar datos a la nube.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModulesModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold shadow-sm transition-all shrink-0"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Gestionar e Instalar Módulos</span>
                </button>
              </div>

              {/* Modules State Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Tesseract OCR Card */}
                <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        <ScanText className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        Tesseract OCR
                      </span>
                    </div>
                    {capabilities.ocr ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5" /> Pendiente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-slate-400">
                    Reconocimiento de texto en documentos escaneados y PDFs con imágenes.
                  </p>
                  <div className="text-[11px] text-gray-500 dark:text-slate-400 pt-1 border-t border-gray-200/60 dark:border-slate-800">
                    Idiomas disponibles:{' '}
                    <span className="font-mono font-semibold text-gray-800 dark:text-slate-200">
                      {(ocrLanguages || []).join(', ') || 'spa, eng'}
                    </span>
                  </div>
                </div>

                {/* Word to PDF Engine Card */}
                <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        <FileOutput className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        Motor Word a PDF
                      </span>
                    </div>
                    {capabilities.word_to_pdf ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5" /> Pendiente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-slate-400">
                    Conversión de documentos .docx y .doc a PDF vía LibreOffice o Microsoft Word nativo.
                  </p>
                  <div className="text-[11px] text-gray-500 dark:text-slate-400 pt-1 border-t border-gray-200/60 dark:border-slate-800">
                    Modo de operación:{' '}
                    <span className="font-semibold text-gray-800 dark:text-slate-200">
                      {capabilities.word_to_pdf ? 'Activo en equipo' : 'Requiere vinculación'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Local-First Guarantee Notice */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200/80 dark:border-slate-800 p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-gray-600 dark:text-slate-300 space-y-1">
                  <p className="font-bold text-gray-900 dark:text-white">
                    Garantía Local-First 127.0.0.1
                  </p>
                  <p>
                    Ningún archivo subido a OpenPDF se transfiere a la red. Todo el procesamiento se realiza en local en tu procesador y disco duro.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: ACTUALIZACIONES ("Check for Updates") ================= */}
        {activeTab === 'updates' && (
          <div className="space-y-6 animate-fade-in">
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-red-50 dark:bg-brand/10 text-brand">
                      <Download className="w-5 h-5" />
                    </span>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                      Comprobación de Actualizaciones
                    </h2>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xl">
                    Consulta en tiempo real el repositorio oficial en GitHub Releases para asegurarte de tener la versión más reciente con las últimas mejoras.
                  </p>
                </div>

                {/* Primary Real-Time Check Button */}
                <button
                  type="button"
                  onClick={handleCheckForUpdates}
                  disabled={isCheckingUpdate}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold shadow-md shadow-brand/20 transition-all disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                  <span>{isCheckingUpdate ? 'Buscando en GitHub...' : 'Check for Updates'}</span>
                </button>
              </div>

              {/* Version & Status Card */}
              <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-slate-400 block font-medium">Versión instalada:</span>
                    <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                      v{version || '2.2.0'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-slate-400 block font-medium">Canal oficial:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      GitHub Releases
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-slate-400 block font-medium">Estado de conexión:</span>
                    <span className={`text-sm font-semibold ${online ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {online ? 'Servidor local activo' : 'Modo fuera de línea'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Auto-check preference toggle */}
              <div className="pt-2 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-900 dark:text-white block">
                    Comprobar actualizaciones automáticamente al iniciar
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    Realiza una comprobación silenciosa de 1 segundo al arrancar la app y muestra un aviso solo si hay una nueva versión.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoCheckUpdatesOnStart}
                  onChange={(e) => updateSetting('autoCheckUpdatesOnStart', e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-brand focus:ring-brand cursor-pointer"
                  aria-label="Comprobar actualizaciones automáticamente"
                />
              </div>

              {/* Direct Link to GitHub Releases */}
              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-slate-400">
                  ¿Prefieres descargar manualmente el instalador o los paquetes portables?
                </span>
                <a
                  href="https://github.com/albert-dilas/OpenPDF/releases"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                >
                  <span>Ver todas las versiones</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: OPINIONES Y SOPORTE (FEEDBACK) ================= */}
        {activeTab === 'feedback' && (
          <div className="space-y-6 animate-fade-in">
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-6 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-red-50 dark:bg-brand/10 text-brand">
                    <MessageSquare className="w-5 h-5" />
                  </span>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    Opiniones, Sugerencias y Reporte de Errores
                  </h2>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xl">
                  Comparte tu experiencia, propón nuevas funciones o reporta incidentes técnicos. Puedes registrarlo en el sistema local o publicarlo directamente en GitHub.
                </p>
              </div>

              {/* Category Selector Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Proponer nueva función */}
                <button
                  type="button"
                  onClick={() => setFeedbackCategory('feature')}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all text-left ${
                    feedbackCategory === 'feature'
                      ? 'border-brand bg-red-50/50 dark:bg-brand/10 ring-2 ring-brand'
                      : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      Proponer Función
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400">
                      Sugerir nuevas herramientas
                    </span>
                  </div>
                </button>

                {/* Reportar error */}
                <button
                  type="button"
                  onClick={() => setFeedbackCategory('bug')}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all text-left ${
                    feedbackCategory === 'bug'
                      ? 'border-brand bg-red-50/50 dark:bg-brand/10 ring-2 ring-brand'
                      : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                    <Bug className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      Reportar Error
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400">
                      Informar fallo técnico
                    </span>
                  </div>
                </button>

                {/* Dar opinión */}
                <button
                  type="button"
                  onClick={() => setFeedbackCategory('opinion')}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all text-left ${
                    feedbackCategory === 'opinion'
                      ? 'border-brand bg-red-50/50 dark:bg-brand/10 ring-2 ring-brand'
                      : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      Dar Opinión
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400">
                      Comentarios y diseño
                    </span>
                  </div>
                </button>
              </div>

              {/* Feedback Form */}
              <form onSubmit={handleSubmitLocalFeedback} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Título del reporte o propuesta
                  </label>
                  <input
                    type="text"
                    required
                    value={feedbackTitle}
                    onChange={(e) => setFeedbackTitle(e.target.value)}
                    placeholder={
                      feedbackCategory === 'feature'
                        ? 'Ej. Soporte para extracción de tablas tabulares a Excel'
                        : feedbackCategory === 'bug'
                        ? 'Ej. Error al convertir PDF escaneado con fuentes poco comunes'
                        : 'Ej. La interfaz es muy rápida y cómoda'
                    }
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Descripción detallada
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={feedbackDescription}
                    onChange={(e) => setFeedbackDescription(e.target.value)}
                    placeholder={
                      feedbackCategory === 'feature'
                        ? 'Explica cómo te gustaría que funcione la herramienta y en qué casos sería útil...'
                        : feedbackCategory === 'bug'
                        ? 'Pasos para reproducir el error, comportamiento esperado y mensaje observado...'
                        : 'Escribe tus opiniones, sugerencias o mejoras generales...'
                    }
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                      Correo de contacto (opcional)
                    </label>
                    <input
                      type="email"
                      value={feedbackEmail}
                      onChange={(e) => setFeedbackEmail(e.target.value)}
                      placeholder="tu-correo@ejemplo.com"
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="diag-check"
                      checked={includeDiagnostics}
                      onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand cursor-pointer"
                    />
                    <label htmlFor="diag-check" className="text-xs text-gray-700 dark:text-slate-300 cursor-pointer select-none">
                      Incluir información del sistema (versión de OpenPDF y estado de módulos)
                    </label>
                  </div>
                </div>

                {/* Dual Action Buttons */}
                <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="submit"
                      disabled={isSubmittingFeedback}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSubmittingFeedback ? 'Registrando...' : 'Registrar opinión localmente'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenGitHubIssue}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold shadow-sm transition-all"
                    >
                      <GithubIcon className="w-3.5 h-3.5" />
                      <span>Abrir Issue en GitHub</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyMarkdown}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-300 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                    <span>Copiar formato Markdown</span>
                  </button>
                </div>
              </form>

              {/* Community and Documentation Links */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-4 border border-gray-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-gray-900 dark:text-white block">
                  Comunidad y Enlaces Útiles
                </span>
                <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-600 dark:text-slate-400">
                  <a
                    href="https://github.com/albert-dilas/OpenPDF/discussions"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-brand inline-flex items-center gap-1"
                  >
                    <span>Discusiones en GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span>·</span>
                  <a
                    href="https://github.com/albert-dilas/OpenPDF/issues"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-brand inline-flex items-center gap-1"
                  >
                    <span>Seguimiento de problemas (Issues)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span>·</span>
                  <a
                    href="https://github.com/albert-dilas/OpenPDF"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-brand inline-flex items-center gap-1"
                  >
                    <span>Código fuente del proyecto</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Reset Settings Button */}
        <div className="pt-6 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
            <Info className="w-4 h-4 text-gray-400" />
            <span>Los cambios de ajustes se guardan automáticamente en tu dispositivo.</span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (confirm('¿Deseas restablecer todos los ajustes a los valores iniciales de fábrica?')) {
                resetDefaults();
                toast.success('Ajustes restablecidos a los valores por defecto.');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer valores por defecto</span>
          </button>
        </div>
      </div>

      {/* Real-time GitHub Update Modal */}
      <UpdateModal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        isLoading={isCheckingUpdate}
        updateData={updateResult}
        onCheckAgain={handleCheckForUpdates}
      />
    </div>
  );
}
