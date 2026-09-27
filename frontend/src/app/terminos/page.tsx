import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos de Uso — OpenPDF',
};

export default function TerminosPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Términos de Uso</h1>

      <div className="space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Uso Aceptable</h2>
          <p>
            OpenPDF está diseñado para uso personal y profesional legítimo. El usuario es
            responsable de tener los derechos necesarios sobre los documentos que procesa.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Sin Garantía</h2>
          <p>
            OpenPDF se distribuye &quot;tal cual&quot;, sin garantías de ningún tipo. El software
            es de código abierto bajo licencia MIT.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Licencia MIT</h2>
          <p>
            OpenPDF está disponible bajo la{' '}
            <a
              href="https://github.com/albert-dilas/OpenPDF/blob/main/LICENSE"
              className="text-brand hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Licencia MIT
            </a>
            . Eres libre de usar, modificar y distribuir el software según los términos de dicha licencia.
          </p>
        </section>
      </div>
    </main>
  );
}
