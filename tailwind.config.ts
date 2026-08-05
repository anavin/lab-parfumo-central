import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
      colors: {
        // neutrals
        canvas: "#f5f6f8",
        surface: "#ffffff",
        ink: { DEFAULT: "#181b21", soft: "#3d434e" },
        muted: { DEFAULT: "#697586", soft: "#98a1b0" },
        line: { DEFAULT: "#e7e9ee", soft: "#f0f2f5" },
        // sidebar (elegant near-black)
        nav: { DEFAULT: "#15161a", hover: "#212328", muted: "#8a8f9a" },
        // brand — refined gold
        brand: { DEFAULT: "#a17c48", dark: "#836234", soft: "#f4eee2" },
        gold: { DEFAULT: "#a17c48", dark: "#836234", soft: "#f4eee2" },
        // semantic
        success: { DEFAULT: "#15803d", soft: "#e8f4ec" },
        warn: { DEFAULT: "#b45309", soft: "#fbf1e3" },
        danger: { DEFAULT: "#dc2626", soft: "#fcecec" },
        info: { DEFAULT: "#2a78d6", soft: "#e9f1fc" },
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
