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
