import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "@/components/layout/Header";
import CommandPalette from "@/components/layout/CommandPalette";
import DesktopStatusBar, { DesktopFooter } from "@/components/layout/DesktopStatusBar";
import ModulesModal from "@/components/system/ModulesModal";

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
      <body className="font-sans antialiased text-gray-900 dark:text-slate-100 bg-slate-50 dark:bg-[#090d16] flex flex-col min-h-screen pb-7 transition-colors">
        <Header />

        <main className="flex-grow flex flex-col">{children}</main>

        <ModulesModal />
        <CommandPalette />

        <Toaster
          position="bottom-center"
          toastOptions={{
            className:
              "!bg-white dark:!bg-slate-800 !text-gray-900 dark:!text-slate-100 !border !border-gray-200 dark:!border-slate-700 !shadow-xl !rounded-xl !text-sm !font-medium !mb-6",
          }}
        />

        <DesktopFooter />
        <DesktopStatusBar />
      </body>
    </html>
  );
}
