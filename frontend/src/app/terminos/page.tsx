import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Scale, ShieldAlert, FileCode2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Términos de Uso y Licencia MIT — OpenPDF',
  description: 'Condiciones de uso y licencia de código abierto MIT de OpenPDF.',
};

export default function TerminosPage() {
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

      <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-card space-y-6">
        <div className="border-b border-gray-100 dark:border-slate-800 pb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Términos de Uso
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-slate-400">
            Software libre y de código abierto bajo Licencia MIT.
          </p>
        </div>

        <div className="space-y-5 text-sm sm:text-base text-gray-600 dark:text-slate-300 leading-relaxed">
          <section className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200/60 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2.5 text-gray-900 dark:text-white font-bold">
              <Scale className="w-5 h-5 text-brand" />
              <h2>1. Uso Legítimo y Responsabilidad</h2>
            </div>
            <p>
              OpenPDF está diseñado para el procesamiento local de documentos personales,
              académicos y profesionales. El usuario es el único responsable de contar con los
              derechos y permisos necesarios sobre los documentos que procesa, desbloquea o edita
              en su equipo.
            </p>
          </section>

          <section className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200/60 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2.5 text-gray-900 dark:text-white font-bold">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <h2>2. Exclusión de Garantías</h2>
            </div>
            <p>
              El software se proporciona &ldquo;tal cual&rdquo; (<em>as is</em>), sin garantías de
              ningún tipo, expresas o implícitas. Recomendamos conservar copias de respaldo de
              documentos críticos antes de realizar modificaciones destructivas.
            </p>
          </section>

          <section className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200/60 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2.5 text-gray-900 dark:text-white font-bold">
              <FileCode2 className="w-5 h-5 text-emerald-500" />
              <h2>3. Licencia MIT</h2>
            </div>
            <p>
              OpenPDF se distribuye bajo la{' '}
              <a
                href="https://github.com/albert-dilas/OpenPDF/blob/main/LICENSE"
                className="text-brand font-semibold hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Licencia MIT
              </a>
              . Eres libre de usar, estudiar, modificar y redistribuir este software conforme a los
              términos de dicha licencia.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
