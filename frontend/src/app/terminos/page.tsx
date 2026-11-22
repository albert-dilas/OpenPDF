import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Scale, ShieldAlert, FileCode2, Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Términos de Uso y Licencia Apache 2.0 — Tornio',
  description:
    'Condiciones de uso, licencia Apache License 2.0 y avisos de componentes de terceros de Tornio.',
};

export default function TerminosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al inicio
        </Link>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-card)] p-6 sm:p-10 space-y-6">
        <div className="border-b border-[var(--border)] pb-6">
          <h1 className="text-3xl font-bold text-[var(--fg)] tracking-tight">
            Términos de Uso
          </h1>
          <p className="mt-2 text-sm text-[var(--fg-muted)]">
            Software libre y de código abierto distribuido bajo Apache License, Version 2.0.
          </p>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-[var(--fg-muted)] leading-relaxed">
          <section className="p-5 rounded-[var(--radius-control)] bg-[var(--bg)] border border-[var(--border)] space-y-2">
            <div className="flex items-center gap-2 text-[var(--fg)] font-semibold">
              <Scale className="w-4 h-4" />
              <h2>1. Uso Legítimo y Responsabilidad</h2>
            </div>
            <p>
              Tornio está diseñado para el procesamiento local de documentos, audio, video,
              imágenes y utilidades de archivo en tu equipo. El usuario es responsable de contar con
              los derechos y permisos necesarios sobre todo el material que procesa.
            </p>
          </section>

          <section className="p-5 rounded-[var(--radius-control)] bg-[var(--bg)] border border-[var(--border)] space-y-2">
            <div className="flex items-center gap-2 text-[var(--fg)] font-semibold">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <h2>2. Exclusión de Garantías</h2>
            </div>
            <p>
              El software se proporciona tal cual (<em>as is</em>), sin garantías expresas o
              implícitas, conforme a las secciones 7 y 8 de la Apache License 2.0. Conserva copias
              de respaldo de tus archivos originales antes de aplicar transformaciones irreversibles.
            </p>
          </section>

          <section className="p-5 rounded-[var(--radius-control)] bg-[var(--bg)] border border-[var(--border)] space-y-2">
            <div className="flex items-center gap-2 text-[var(--fg)] font-semibold">
              <FileCode2 className="w-4 h-4 text-emerald-500" />
              <h2>3. Licencia Apache 2.0 y Marca</h2>
            </div>
            <p>
              El código original de Tornio está licenciado bajo{' '}
              <a
                href="https://github.com/albert-dilas/Tornio/blob/main/LICENSE"
                className="font-semibold text-[var(--fg)] underline"
                target="_blank"
                rel="noreferrer"
              >
                Apache License, Version 2.0
              </a>
              . Eres libre de estudiar, auditar, modificar y redistribuir el código conforme a sus
              términos, respetando los derechos de marca y el archivo{' '}
              <a
                href="https://github.com/albert-dilas/Tornio/blob/main/NOTICE"
                className="font-semibold text-[var(--fg)] underline"
                target="_blank"
                rel="noreferrer"
              >
                NOTICE
              </a>
              .
            </p>
          </section>

          <section className="p-5 rounded-[var(--radius-control)] bg-[var(--bg)] border border-[var(--border)] space-y-2">
            <div className="flex items-center gap-2 text-[var(--fg)] font-semibold">
              <Layers className="w-4 h-4" />
              <h2>4. Componentes de Terceros</h2>
            </div>
            <p>
              Las distribuciones compiladas incorporan bibliotecas de terceros bajo sus propias
              licencias (incluyendo PyMuPDF y pymupdf4llm bajo GNU AGPL v3.0, cuyo código fuente
              correspondiente se publica íntegramente en el repositorio oficial). Consulta el
              inventario completo y transparente en{' '}
              <a
                href="https://github.com/albert-dilas/Tornio/blob/main/THIRD_PARTY_NOTICES.md"
                className="font-semibold text-[var(--fg)] underline"
                target="_blank"
                rel="noreferrer"
              >
                THIRD_PARTY_NOTICES.md
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
