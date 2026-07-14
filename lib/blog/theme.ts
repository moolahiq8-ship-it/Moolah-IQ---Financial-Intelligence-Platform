// Moolah IQ v2 blog — system lookups (Handoff Spec §1.2, §1.3, §1.4, §5.2, §5.3).
// SINGLE SOURCE OF TRUTH for the SITE-WIDE per-category / per-pillar colours.
// As of 2026-07-14 this CATEGORY map is ALSO consumed by the About page's
// "The 8 Pillars" grid (app/about/page.tsx), not just the blog. So a category
// colour changed here changes it in BOTH places — do NOT treat it as blog-only.
// (File is still named blog/theme.ts for now; renaming was deferred to avoid churn.)
// These are consumed at runtime via inline styles by the blog + About components —
// they are deliberately NOT Tailwind tokens (tailwind.config holds only the blog's
// STATIC chrome). Do not duplicate these values into tailwind.config or
// lib/categories.ts (which is the separate homepage-pillar pastel palette).

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
  // Extra four — intentional values from the About "8 Pillars" handoff spec.
  // No live blog post uses these categories yet, so updating them is inert on the
  // blog TODAY; the first optimize/protect/milestones/legacy post will render with
  // these (matching the About pillars by design). `dot` tracks each new gradFrom.
  optimize: { label: "OPTIMIZE", gradFrom: "#7a9a4a", gradTo: "#556b2f", dot: "#7a9a4a", text: "#4a6329" },
  protect: { label: "PROTECT", gradFrom: "#c07a55", gradTo: "#9a5638", dot: "#c07a55", text: "#8a4a30" },
  milestones: { label: "MILESTONES", gradFrom: "#3f5a92", gradTo: "#28406e", dot: "#3f5a92", text: "#2c3f72" },
  legacy: { label: "LEGACY", gradFrom: "#e2ac47", gradTo: "#b8842a", dot: "#e2ac47", text: "#8a5f1c" },
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
