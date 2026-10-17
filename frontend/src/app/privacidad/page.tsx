import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, HardDrive, EyeOff, Code2, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Privacidad Local — OpenPDF',
  description:
    'OpenPDF procesa todos tus documentos 100% localmente en tu equipo. Sin subida de archivos a servidores externos.',
};

export default function PrivacidadPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-500 dark:text-slate-400 hover:text-brand transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a las herramientas
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-card space-y-8">
        <div className="border-b border-gray-100 dark:border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-3">
            <ShieldCheck className="w-4 h-4" />
            Arquitectura 100% Local-First
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Política de Privacidad
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-slate-400">
            Diseñado desde cero para que tus documentos confidenciales jamás abandonen tu ordenador.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200/60 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2.5 text-gray-900 dark:text-white font-bold">
              <HardDrive className="w-5 h-5 text-brand" />
              <h2>Procesamiento 100% Local</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
              OpenPDF ejecuta su motor PDF directamente en tu dispositivo. Ningún documento,
              imagen, contraseña o metadato es transmitido a servidores en la nube ni a terceros.
            </p>
          </section>

          <section className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200/60 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2.5 text-gray-900 dark:text-white font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h2>Limpieza Automática de Temporales</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
              Durante cada operación se utilizan archivos temporales en tu disco local que se
              eliminan inmediatamente al terminar la tarea y mediante barridos periódicos de
              seguridad.
            </p>
          </section>

          <section className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200/60 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2.5 text-gray-900 dark:text-white font-bold">
              <EyeOff className="w-5 h-5 text-indigo-500" />
              <h2>Cero Telemetría o Rastreo</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
              OpenPDF no incluye analítica web, cookies de rastreo ni envío de estadísticas de uso.
              Incluso las tipografías e iconos están integrados localmente para operar 100% sin
              conexión a internet.
            </p>
          </section>

          <section className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200/60 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2.5 text-gray-900 dark:text-white font-bold">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2>Comprobación de Actualizaciones</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
              La única consulta externa opcional comprueba en GitHub Releases si existe una versión
              más reciente de OpenPDF. Si trabajas sin conexión, se omite silenciosamente.
            </p>
          </section>
        </div>

        <section className="pt-4 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Code2 className="w-6 h-6 text-brand shrink-0" />
            <p className="text-sm text-gray-600 dark:text-slate-300">
              Código fuente 100% abierto y auditable públicamente.
            </p>
          </div>
          <a
            href="https://github.com/albert-dilas/OpenPDF"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-slate-800 text-white text-xs sm:text-sm font-semibold hover:bg-brand dark:hover:bg-brand transition-colors"
          >
            Auditar en GitHub
          </a>
        </section>
      </div>
    </div>
  );
}
