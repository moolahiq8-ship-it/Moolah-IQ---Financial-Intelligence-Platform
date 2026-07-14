import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
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
        // Category UI (article surfaces) — shares the pillar family via
        // lib/categories.ts. -tint = lighter chip fill; -active = solid
        // darkened just enough for white text to pass AA; -grad/-grad2 =
        // thumbnail gradient endpoints (135°, solid→~25% darker). `solid`
        // reuses accent/gold/pillar-*-icon; save's dark ends reuse primary.
        "pillar-earn-tint": "#C9EAD9",
        "pillar-earn-active": "#0C865D",
        "pillar-earn-grad2": "#056F52",
        "pillar-spend-tint": "#EFD3A6",
        "pillar-spend-active": "#966E27",
        "pillar-spend-grad": "#D69B3A",
        "pillar-spend-grad2": "#A9691A",
        "pillar-save-tint": "#C4D5EC",
        "pillar-save-active": "#2E5A93",
        "pillar-invest-tint": "#BFE4E1",
        "pillar-invest-active": "#0C8479",
        "pillar-invest-grad": "#14B8A6",
        "pillar-invest-grad2": "#0E7490",
        "pillar-optimize-tint": "#D8E4C6",
        "pillar-optimize-active": "#647E40",
        "pillar-optimize-grad2": "#5C743B",
        "pillar-protect-tint": "#E8CBB2",
        "pillar-protect-active": "#A8663B",
        "pillar-protect-grad2": "#8F5632",
        "pillar-milestones-tint": "#CFE1F0",
        "pillar-milestones-active": "#4579A9",
        "pillar-milestones-grad2": "#38638A",
        "pillar-legacy-tint": "#EFDFAC",
        "pillar-legacy-active": "#8C7324",
        "pillar-legacy-grad2": "#9F8329",
        // Mortgage tool glyph — requested #96790A had no existing token match
        "pillar-legacy-glyph": "#96790A",
        // --- v2 blog design (spec §1.7) — scoped to /blog; STATIC tokens only.
        //     Per-category/level colours live in lib/blog/theme.ts, not here.
        //     Spec's `gold` renamed `bgold` to avoid clobbering the site gold.
        cream: "#f6f3ec",
        surface: "#fffdf8",
        navy: { DEFAULT: "#0f2b52", deep: "#0b1f3d", panel: "#173a63" },
        bgold: { DEFAULT: "#e2ac47", ink: "#b8842a", rule: "#c08a2d" },
        ink: "#17263b",
        body: { DEFAULT: "#5e6675", strong: "#47566a" },
        muted: { DEFAULT: "#8f887a", 2: "#a79f8e", 3: "#b3aca0" },
        line: { DEFAULT: "#e6e0d4", card: "#ebe5d8", divider: "#efe9dc", track: "#eae3d5" },
      },
      fontFamily: {
        "blog-serif": ["var(--font-spectral)", "Georgia", "serif"],
        "blog-sans": ["var(--font-libre)", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "16px", hero: "20px", pill: "8px", badge: "5px" },
      boxShadow: {
        hero: "0 26px 60px -28px rgba(15,43,82,.55)",
        card: "0 10px 30px -22px rgba(15,43,82,.4)",
        "card-hover": "0 22px 46px -20px rgba(15,43,82,.4)",
      },
      maxWidth: { container: "1200px" },
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
