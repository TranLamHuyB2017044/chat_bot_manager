import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Sidebar (forest dark, fixed across modes) ──
        sidebar: {
          deepest:   "#132820",
          base:      "#1A3328",
          active:    "#1E3D31",
          hover:     "#193028",
          navText:   "#6A9880",
          navActive: "#D0F0E4",
          navSec:    "#3A6050",
        },
        // ── Brand accent ──
        brand: {
          DEFAULT:  "#2DB87A",
          hover:    "#25A06A",
          soft:     "#DCFAEE",
          softDark: "#0D3F2A",
        },
        // ── Page surfaces — Light ──
        surface: {
          page:   "#F2F7F4",
          card:   "#FFFFFF",
          input:  "#E2EDE8",
          border: "#C8DDD4",
          chart:  "#B8DDD0",
        },
        // ── Page surfaces — Dark ──
        dark: {
          page:   "#0D1F18",
          card:   "#111E18",
          input:  "#162820",
          border: "#1E3328",
          chart:  "#1A3530",
        },
        // ── Typography — Light ──
        text: {
          primary:   "#132820",
          secondary: "#2A4838",
          muted:     "#5A7868",
        },
        // ── Typography — Dark ──
        textDark: {
          primary:   "#D0F0E4",
          secondary: "#6A9880",
          muted:     "#3A6050",
        },
        // ── Semantic ──
        success: { DEFAULT: "#28B96A", bg: "#DCFAEE", text: "#0F6840" },
        warning: { DEFAULT: "#F59E0B", bg: "#FEF3C7", text: "#92400E" },
        danger:  { DEFAULT: "#E84B4A", bg: "#FDE8E8", text: "#903030" },
        info:    { DEFAULT: "#2DB87A", bg: "#DCFAEE", text: "#0F6840" },
      },
      fontFamily: {
        sans: ["var(--font-ibm-plex-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
      borderRadius: {
        card: "12px",
        btn:  "8px",
        pill: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
