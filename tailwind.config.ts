import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
      colors: {
        // theme-aware tokens — values live in globals.css as RGB channels so they
        // flip between light/dark and still support Tailwind opacity modifiers.
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        ink: { DEFAULT: "rgb(var(--ink) / <alpha-value>)", soft: "rgb(var(--ink-soft) / <alpha-value>)" },
        muted: { DEFAULT: "rgb(var(--muted) / <alpha-value>)", soft: "rgb(var(--muted-soft) / <alpha-value>)" },
        line: { DEFAULT: "rgb(var(--line) / <alpha-value>)", soft: "rgb(var(--line-soft) / <alpha-value>)" },
        // sidebar (elegant near-black — stays dark in both themes)
        nav: { DEFAULT: "#15161a", hover: "#212328", muted: "#8a8f9a" },
        // brand — refined gold
        brand: { DEFAULT: "rgb(var(--brand) / <alpha-value>)", dark: "rgb(var(--brand-dark) / <alpha-value>)", soft: "rgb(var(--brand-soft) / <alpha-value>)" },
        gold: { DEFAULT: "rgb(var(--brand) / <alpha-value>)", dark: "rgb(var(--brand-dark) / <alpha-value>)", soft: "rgb(var(--brand-soft) / <alpha-value>)" },
        // semantic
        success: { DEFAULT: "rgb(var(--success) / <alpha-value>)", soft: "rgb(var(--success-soft) / <alpha-value>)" },
        warn: { DEFAULT: "rgb(var(--warn) / <alpha-value>)", soft: "rgb(var(--warn-soft) / <alpha-value>)" },
        danger: { DEFAULT: "rgb(var(--danger) / <alpha-value>)", soft: "rgb(var(--danger-soft) / <alpha-value>)" },
        info: { DEFAULT: "rgb(var(--info) / <alpha-value>)", soft: "rgb(var(--info-soft) / <alpha-value>)" },
        // chart series (validated, colorblind-safe)
        c1: "#2a78d6", c2: "#eb6834", c3: "#1baf7a", c4: "#eda100",
        c5: "#e87ba4", c6: "#008300", c7: "#4a3aa7", c8: "#e34948",
      },
      borderRadius: { xl: "0.75rem", "2xl": "1rem" },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
        pop: "0 8px 24px rgba(16,24,40,0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
