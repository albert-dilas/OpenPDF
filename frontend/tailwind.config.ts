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
        bg: "var(--bg)",
        background: "var(--background)",
        fg: {
          DEFAULT: "var(--fg)",
          muted: "var(--fg-muted)",
        },
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "var(--surface)",
          elevated: "var(--surface-elevated)",
          muted: "var(--surface-muted)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          hover: "rgb(var(--accent-hover-rgb) / <alpha-value>)",
          fg: "var(--accent-fg)",
        },
        brand: {
          DEFAULT: "rgb(var(--brand-rgb) / <alpha-value>)",
          dark: "rgb(var(--brand-hover-rgb) / <alpha-value>)",
          light: "var(--accent-soft)",
          50: "rgb(var(--brand-rgb) / 0.06)",
          100: "rgb(var(--brand-rgb) / 0.12)",
          200: "rgb(var(--brand-rgb) / 0.24)",
          500: "rgb(var(--brand-rgb) / <alpha-value>)",
          600: "rgb(var(--brand-rgb) / <alpha-value>)",
          700: "rgb(var(--brand-hover-rgb) / <alpha-value>)",
        },
      },
      borderRadius: {
        card: "var(--radius-card)",
        control: "var(--radius-control)",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(10, 10, 11, 0.04)",
        "card-hover": "0 8px 24px -8px rgba(10, 10, 11, 0.12)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.16s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
