import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/config/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "var(--surface)",
          elevated: "var(--surface-elevated)",
          muted: "var(--surface-muted)",
        },
        border: {
          DEFAULT: "var(--border)",
        },
        brand: {
          DEFAULT: "#e5322d",
          dark: "#cc2c28",
          light: "#fef2f2",
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          500: "#ef4444",
          600: "#e5322d",
          700: "#cc2c28",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.06)",
        "card-hover": "0 12px 28px -6px rgba(229, 50, 45, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.08)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.18s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
