import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1A3C6E",
        accent: "#10B981",
        gold: {
          DEFAULT: "#D4AF37",
          light: "#FFD700",
          dark: "#B8960C",
        },
        "light-bg": "#F8FAFC",
        "dark-text": "#1E293B",
        // 8-pillar palette (About page) — on-brand cool→warm family derived
        // from navy/emerald/gold. Per pillar: -bg = card fill, -bg2 =
        // 6%-lighter gradient bottom, -icon = tile fill (white glyph),
        // -text = heading label (all AA-verified vs their fill).
        // Earn icon reuses `accent`; Legacy icon reuses `gold`.
        "pillar-earn-bg": "#A9DDC4",
        "pillar-earn-bg2": "#AEDFC8",
        "pillar-earn-text": "#065F46",
        "pillar-spend-bg": "#E6C488",
        "pillar-spend-bg2": "#E8C88F",
        "pillar-spend-icon": "#C79233",
        "pillar-spend-text": "#754B11",
        "pillar-save-bg": "#A9C2E0",
        "pillar-save-bg2": "#AEC6E2",
        "pillar-save-icon": "#2E5A93",
        "pillar-save-text": "#15315C",
        "pillar-invest-bg": "#9FD6D1",
        "pillar-invest-bg2": "#A5D8D4",
        "pillar-invest-icon": "#0E9488",
        "pillar-invest-text": "#0B5F59",
        "pillar-optimize-bg": "#C3D6A8",
        "pillar-optimize-bg2": "#C7D8AD",
        "pillar-optimize-icon": "#7A9A4E",
        "pillar-optimize-text": "#465E26",
        "pillar-protect-bg": "#DDB595",
        "pillar-protect-bg2": "#DFB99B",
        "pillar-protect-icon": "#BE7343",
        "pillar-protect-text": "#743E1D",
        "pillar-milestones-bg": "#B4CFE8",
        "pillar-milestones-bg2": "#B9D2E9",
        "pillar-milestones-icon": "#4B84B8",
        "pillar-milestones-text": "#264E70",
        "pillar-legacy-bg": "#E6CE8A",
        "pillar-legacy-bg2": "#E8D191",
        "pillar-legacy-text": "#6D5607",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "#1E293B",
            fontWeight: "450",
            a: {
              color: "#1A3C6E",
              fontWeight: "600",
              "&:hover": {
                color: "#10B981",
              },
            },
            h1: { color: "#1A3C6E" },
            h2: { color: "#1A3C6E" },
            h3: { color: "#1A3C6E" },
            h4: { color: "#1A3C6E" },
            strong: { color: "#0f172a" },
            li: {
              color: "#1E293B",
              fontWeight: "450",
            },
            "ul > li::marker": {
              color: "#1A3C6E",
            },
            "ol > li::marker": {
              color: "#1A3C6E",
              fontWeight: "600",
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
