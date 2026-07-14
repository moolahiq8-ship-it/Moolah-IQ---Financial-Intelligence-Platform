// Money IQ tier system — single source of truth for tier naming and
// badge styling. Tiers by score: 95–109 Foundations, 110–139 Strategy,
// 140+ Mastery. (Replaces the legacy Foundational/Market/Strategic/Alpha
// IQ names still present in post frontmatter — display always derives
// from iqScore via these helpers.)

export type IqTier = "Foundations" | "Strategy" | "Mastery";

export function iqTier(score: number): IqTier {
  if (score >= 140) return "Mastery";
  if (score >= 110) return "Strategy";
  return "Foundations";
}

export function iqBadgeLabel(score: number): string {
  return `${score} · ${iqTier(score)}`;
}

// Reader level (beginner/intermediate/advanced) derived from the same score —
// used by the v2 blog complexity meter. No `level` frontmatter field: tier maps
// 1:1 (Foundations→beginner, Strategy→intermediate, Mastery→advanced).
export function iqLevel(score: number): "beginner" | "intermediate" | "advanced" {
  const t = iqTier(score);
  return t === "Mastery" ? "advanced" : t === "Strategy" ? "intermediate" : "beginner";
}

// Homepage badge treatment: deepened tinted fills with WCAG-AA text.
// Mint #A7F3D0 = emerald-200; warm gold #F0DFA0 is custom (no token).
export const IQ_BADGE_CLASSES: Record<IqTier, string> = {
  Foundations: "bg-emerald-200 text-emerald-800",
  Strategy: "bg-[#F0DFA0] text-yellow-800",
  Mastery: "bg-primary text-gold-light",
};
