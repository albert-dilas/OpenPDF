import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Link from "next/link";
import { Heart, ShieldCheck, Lock } from "lucide-react";
import { Toaster } from "react-hot-toast";
import Header from "@/components/layout/Header";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "OpenPDF | Herramientas PDF 100% Locales y Privadas",
  description:
    "Suite de herramientas PDF local-first y de código abierto. Une, divide, organiza, comprime y convierte tus documentos PDF sin que salgan de tu equipo.",
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('openpdf-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased text-gray-900 dark:text-slate-100 bg-slate-50 dark:bg-[#090d16] flex flex-col min-h-screen transition-colors">
        <Header />

        <main className="flex-grow flex flex-col">{children}</main>

        <Toaster
          position="bottom-center"
          toastOptions={{
            className:
              "!bg-white dark:!bg-slate-800 !text-gray-900 dark:!text-slate-100 !border !border-gray-200 dark:!border-slate-700 !shadow-xl !rounded-xl !text-sm !font-medium",
          }}
        />

        <footer className="bg-white dark:bg-slate-900 border-t border-gray-200/80 dark:border-slate-800 mt-auto transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </body>
    </html>
  );
}
