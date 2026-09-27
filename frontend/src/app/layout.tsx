import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Toaster } from "react-hot-toast";

function GithubIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export const metadata: Metadata = {
  title: "OpenPDF | Herramientas PDF online gratis",
  description: "Alternativa self-hosted a iLovePDF. Une, divide, comprime y convierte PDFs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased text-gray-900 bg-gray-50 flex flex-col min-h-screen">
        <header className="bg-white/90 backdrop-blur-md shadow-sm fixed w-full top-0 z-50 border-b border-gray-100 transition-all">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black tracking-tighter group-hover:scale-105 transition-transform">
                Open<span className="text-brand">PDF</span>
              </span>
            </Link>
            <div className="hidden md:flex gap-6">
              <Link href="/merge-pdf" className="text-sm font-bold text-gray-700 hover:text-brand transition-colors">Unir PDF</Link>
              <Link href="/split-pdf" className="text-sm font-bold text-gray-700 hover:text-brand transition-colors">Dividir PDF</Link>
              <Link href="/compress-pdf" className="text-sm font-bold text-gray-700 hover:text-brand transition-colors">Comprimir PDF</Link>
              <Link href="/pdf-to-word" className="text-sm font-bold text-gray-700 hover:text-brand transition-colors">Convertir PDF</Link>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://github.com/albert-dilas/OpenPDF" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                <GithubIcon size={20} />
              </a>
            </div>
          </nav>
        </header>

        <main className="flex-grow flex flex-col pt-16">
          {children}
        </main>

        <Toaster position="bottom-center" />

        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <span>© {new Date().getFullYear()} OpenPDF. Creado con</span>
                <Heart size={16} className="text-brand fill-brand" />
                <span>para el mundo.</span>
              </div>
              <div className="flex gap-6 text-sm text-gray-500">
                <Link href="/" className="hover:text-brand transition-colors">Inicio</Link>
                <Link href="/privacidad" className="hover:text-brand transition-colors">Política de Privacidad</Link>
                <Link href="/terminos" className="hover:text-brand transition-colors">Términos de Uso</Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
