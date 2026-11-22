import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, HardDrive, EyeOff, Code2, DownloadCloud } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Privacidad Local — Tornio',
  description:
    'Tornio procesa todos tus documentos y archivos multimedia 100% localmente en tu equipo.',
};

export default function PrivacidadPage() {
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

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-card)] p-6 sm:p-10 space-y-8">
        <div className="border-b border-[var(--border)] pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4" />
            Arquitectura 100% Local-First
          </div>
          <h1 className="text-3xl font-bold text-[var(--fg)] tracking-tight">
            Política de Privacidad
          </h1>
          <p className="mt-2 text-sm text-[var(--fg-muted)]">
            Diseñado desde cero para que tus archivos confidenciales jamás abandonen tu ordenador.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="p-5 rounded-[var(--radius-control)] bg-[var(--bg)] border border-[var(--border)] space-y-2">
            <div className="flex items-center gap-2 text-[var(--fg)] font-semibold text-sm">
              <HardDrive className="w-4 h-4" />
              <h2>Procesamiento 100% Local</h2>
            </div>
            <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
              Tornio ejecuta sus motores directamente en tu dispositivo en 127.0.0.1. Ningún PDF,
              video, audio, imagen, contraseña ni metadato se transmite a servidores externos.
            </p>
          </section>

          <section className="p-5 rounded-[var(--radius-control)] bg-[var(--bg)] border border-[var(--border)] space-y-2">
            <div className="flex items-center gap-2 text-[var(--fg)] font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h2>Control de Temporales y Sesión</h2>
            </div>
            <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
              Los archivos temporales y los Archivos de Sesión residen únicamente en tu disco local y
              pueden limpiarse automáticamente al cerrar la aplicación o en 1 clic desde Ajustes.
            </p>
          </section>

          <section className="p-5 rounded-[var(--radius-control)] bg-[var(--bg)] border border-[var(--border)] space-y-2">
            <div className="flex items-center gap-2 text-[var(--fg)] font-semibold text-sm">
              <EyeOff className="w-4 h-4" />
              <h2>Cero Telemetría o Rastreo</h2>
            </div>
            <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
              Sin analítica externa, cookies de seguimiento ni CDNs obligatorios. Tipografías e
              iconos vectoriales se incluyen en local para trabajar completamente sin internet.
            </p>
          </section>

          <section className="p-5 rounded-[var(--radius-control)] bg-[var(--bg)] border border-[var(--border)] space-y-2">
            <div className="flex items-center gap-2 text-[var(--fg)] font-semibold text-sm">
              <DownloadCloud className="w-4 h-4" />
              <h2>Actualizaciones Verificadas (SHA-256)</h2>
            </div>
            <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
              Puedes elegir entre notificar y actualizar en 1 clic, descarga automática en segundo
              plano o modo Manual 100% offline. Cada descarga se verifica criptográficamente con
              SHA-256 contra GitHub Releases antes de instalarse.
            </p>
          </section>
        </div>

        <section className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-[var(--fg-muted)]">
            <Code2 className="w-5 h-5 text-[var(--fg)] shrink-0" />
            <span>Código fuente 100% abierto bajo Apache 2.0 y auditable públicamente.</span>
          </div>
          <a
            href="https://github.com/albert-dilas/OpenPDF"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-[var(--radius-control)] text-xs font-semibold"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            Auditar en GitHub
          </a>
        </section>
      </div>
    </div>
  );
}
