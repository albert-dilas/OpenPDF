import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad — OpenPDF',
  description: 'OpenPDF procesa todos tus documentos localmente. Sin servidores externos.',
};

export default function PrivacidadPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Procesamiento 100% Local</h2>
          <p>
            OpenPDF es una aplicación de escritorio que procesa todos tus documentos{' '}
            <strong>directamente en tu dispositivo</strong>. Ningún archivo, dato o contenido
            es enviado a servidores externos, servicios en la nube ni terceros.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Archivos Temporales</h2>
          <p>
            Durante el procesamiento, OpenPDF crea archivos temporales en tu disco local.
            Estos archivos son eliminados automáticamente al completar cada operación.
            Como medida adicional, los archivos temporales con más de 1 hora de antigüedad
            son eliminados automáticamente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Sin Telemetría</h2>
          <p>
            OpenPDF no recopila estadísticas de uso, no envía reportes de errores a
            servidores externos, y no incluye ningún tipo de tracking o analítica.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Código Abierto</h2>
          <p>
            OpenPDF es software de código abierto. Puedes auditar el código fuente completo
            en{' '}
            <a
              href="https://github.com/albert-dilas/OpenPDF"
              className="text-brand hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
