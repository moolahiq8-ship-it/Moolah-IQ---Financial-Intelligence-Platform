// Moolah IQ v2 blog — shared types (from the handoff, Spec §5.1).
// Category covers the six brand pillars, so a future post in optimize/protect/
// legacy renders instead of crashing; their colours live in theme.ts.
// Spend and Milestones were retired in the six-pillar consolidation — Spend
// folded into Save. Narrowing this union is deliberate: a stringly-typed
// "spend" now fails to compile rather than rendering an unstyled card.

export type Category =
  | "earn"
  | "invest"
  | "save"
  | "optimize"
  | "protect"
  | "legacy";

export type Level = "beginner" | "intermediate" | "advanced";

export type IllustrationVariant =
  | "bars"
  | "line-area"
  | "check"
  | "apy"
  | "portfolio"
  | "budget";

export interface BudgetRow {
  label: string;
  pct: number;
}

export interface Illustration {
  variant: IllustrationVariant;
  apyValue?: string; // variant 'apy'
  portfolioValue?: string; // variant 'portfolio'
  portfolioDelta?: string; // variant 'portfolio'
  budget?: BudgetRow[]; // variant 'budget'
}

export interface HeroStat {
  label: string;
  value: string;
  unit?: string;
  series: number[]; // 5–8 points, ascending recommended
}

export interface Post {
  slug: string;
  title: string;
  dek: string;
  category: Category;
  level: Level;
  tier: string; // e.g. "Foundations" | "Strategy" — meta string only
  readingTime: number; // integer minutes
  author: string;
  date: string; // ISO date

  illustration: Illustration;

  // featured only
  featured?: boolean;
  tldr?: string;
  heroStat?: HeroStat;
}
