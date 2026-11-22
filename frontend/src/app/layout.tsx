import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import AppShell from "@/components/shell/AppShell";

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
  title: "Tornio | Local File Studio",
  description:
    "Estudio local-first para documentos PDF, edición de video con FFmpeg y utilidades en tu equipo.",
  icons: {
    icon: [
      { url: "/icon.png?v=3", type: "image/png" },
      { url: "/favicon.ico?v=3" },
    ],
    shortcut: "/favicon.ico?v=3",
    apple: "/icon.png?v=3",
  },
};

const appearanceInitScript = `
(function() {
  try {
    var raw = localStorage.getItem('tornio-user-settings-v3') || localStorage.getItem('openpdf-user-settings-v1');
    var parsed = raw ? JSON.parse(raw) : {};
    var skin = parsed.skin;
    if (!skin) {
      if (parsed.theme === 'dark') skin = 'carbon';
      else if (parsed.theme === 'light') skin = 'porcelain';
      else skin = 'system';
    }
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = (skin === 'porcelain' || skin === 'carbon' || skin === 'swiss')
      ? skin
      : (prefersDark ? 'carbon' : 'porcelain');
    var isDark = resolved === 'carbon';
    var root = document.documentElement;
    root.setAttribute('data-skin', resolved);
    root.setAttribute('data-radius', parsed.cornerRadius || 'balanced');
    root.setAttribute('data-density', parsed.density || (parsed.compactGrid ? 'compact' : 'standard'));
    root.lang = parsed.locale === 'en' ? 'en' : 'es';
    if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
    if (parsed.reduceAnimations) root.classList.add('reduce-motion'); else root.classList.remove('reduce-motion');

    var accent = parsed.accentColor;
    var validHex = (typeof accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(accent))
      ? accent.toUpperCase()
      : (isDark ? '#F4F4F6' : '#111114');
    var r = parseInt(validHex.slice(1, 3), 16);
    var g = parseInt(validHex.slice(3, 5), 16);
    var b = parseInt(validHex.slice(5, 7), 16);
    var lin = function(v) {
      var c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    var lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    var fg = lum > 0.25 ? '#0A0A0B' : '#FFFFFF';
    root.style.setProperty('--accent', validHex);
    root.style.setProperty('--accent-rgb', r + ' ' + g + ' ' + b);
    root.style.setProperty('--accent-fg', fg);
    root.style.setProperty('--accent-soft', 'rgba(' + r + ',' + g + ',' + b + ',' + (isDark ? '0.16' : '0.07') + ')');
    root.style.setProperty('--accent-border', 'rgba(' + r + ',' + g + ',' + b + ',' + (isDark ? '0.34' : '0.22') + ')');
    if (fg === '#FFFFFF') {
      root.style.setProperty('--brand-rgb', r + ' ' + g + ' ' + b);
    } else {
      root.style.setProperty('--brand-rgb', isDark ? '232 93 63' : '17 17 20');
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
        <script dangerouslySetInnerHTML={{ __html: appearanceInitScript }} />
      </head>
      <body className="font-sans antialiased bg-[var(--bg)] text-[var(--fg)] min-h-screen transition-colors">
        <AppShell>{children}</AppShell>

        <Toaster
          position="bottom-center"
          toastOptions={{
            className:
              "!bg-[var(--surface)] !text-[var(--fg)] !border !border-[var(--border)] !shadow-xl !rounded-[var(--radius-control)] !text-xs !font-medium !mb-4",
          }}
        />
      </body>
    </html>
  );
}
