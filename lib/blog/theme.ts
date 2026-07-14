// Moolah IQ v2 blog — system lookups (Handoff Spec §1.2, §1.3, §1.4, §5.2, §5.3).
// SINGLE SOURCE OF TRUTH for the blog's per-category and per-level colours.
// These are consumed at runtime via inline styles by the blog components — they
// are deliberately NOT Tailwind tokens (tailwind.config holds only the blog's
// STATIC chrome). Do not duplicate these values into tailwind.config or
// lib/categories.ts (which is the separate homepage-pillar palette).

import type { Category, Level } from "./types";

export const CATEGORY: Record<
  Category,
  { label: string; gradFrom: string; gradTo: string; dot: string; text: string }
> = {
  // Spec §1.2/§1.3 — the four the v2 mock defined, exact values.
  earn: { label: "EARN", gradFrom: "#1BA46E", gradTo: "#0C7A4C", dot: "#12a06a", text: "#0b6640" },
  invest: { label: "INVEST", gradFrom: "#1C9BA0", gradTo: "#0E6F86", dot: "#12909a", text: "#0b6068" },
  save: { label: "SAVE", gradFrom: "#264A86", gradTo: "#14264B", dot: "#3f5a92", text: "#2c3f72" },
  spend: { label: "SPEND", gradFrom: "#E0A64C", gradTo: "#C07E2E", dot: "#c07e2e", text: "#8a5f1c" },
  // Extra four — derived from the pillar palette (lib/categories.ts tokens:
  // -icon → gradient start + dot, -grad2 → gradient end, -text → label). Ensures
  // a future optimize/protect/milestones/legacy post renders on-brand, not broken.
  optimize: { label: "OPTIMIZE", gradFrom: "#7A9A4E", gradTo: "#5C743B", dot: "#7A9A4E", text: "#465E26" },
  protect: { label: "PROTECT", gradFrom: "#BE7343", gradTo: "#8F5632", dot: "#BE7343", text: "#743E1D" },
  milestones: { label: "MILESTONES", gradFrom: "#4B84B8", gradTo: "#38638A", dot: "#4B84B8", text: "#264E70" },
  legacy: { label: "LEGACY", gradFrom: "#D4AF37", gradTo: "#9F8329", dot: "#D4AF37", text: "#6D5607" },
};

// All category card panels share direction 150deg.
export const categoryGradient = (c: Category) =>
  `linear-gradient(150deg, ${CATEGORY[c].gradFrom} 0%, ${CATEGORY[c].gradTo} 100%)`;

export const LEVEL: Record<
  Level,
  { label: string; count: number; fill: string; text: string }
> = {
  beginner: { label: "Beginner", count: 1, fill: "#17a06a", text: "#0b6640" },
  intermediate: { label: "Intermediate", count: 2, fill: "#d69a3a", text: "#b07d1e" },
  advanced: { label: "Advanced", count: 3, fill: "#264A86", text: "#2c3f72" },
};

export const TRACK = "#eae3d5"; // empty complexity segment

export const HERO_PANEL_GRADIENT = "linear-gradient(155deg, #173a63 0%, #0b1f3d 100%)";

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
