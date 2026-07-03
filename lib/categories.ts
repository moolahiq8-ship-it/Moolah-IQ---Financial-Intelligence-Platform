// Single source of truth for article-category + pillar colors.
// Both the About-page pillar grid and all article UI (filter pills, card
// category tags, thumbnail gradients) read from this ONE map. Values are
// complete Tailwind class strings so JIT detects them (lib/ is in the
// content globs). Backed by the pillar-* tokens in tailwind.config.ts.
//
// NOTE: this is CATEGORY/pillar color only. IQ tiers ("95 · Foundations")
// live entirely in lib/iq.ts and are untouched here.

export type CategorySlug =
  | "earn"
  | "spend"
  | "save"
  | "invest"
  | "optimize"
  | "protect"
  | "milestones"
  | "legacy";

export interface CategoryColor {
  /** Pillar card fill — gradient stops (use with `bg-gradient-to-br`). */
  bg: string;
  /** Pillar card/icon ring. */
  ring: string;
  /** Lighter chip fill — inactive filter pills + card category tags. */
  tint: string;
  /** Saturated brand fill — pillar icon tile. */
  solid: string;
  /** Active filter pill fill — `solid` darkened just enough for white AA. */
  active: string;
  /** Label text — pillar heading + category tag/pill text. */
  text: string;
  /** Article thumbnail gradient — 135° solid→darker (use `bg-gradient-to-br`). */
  thumb: string;
}

export const CATEGORY_COLORS: Record<CategorySlug, CategoryColor> = {
  earn: {
    bg: "from-pillar-earn-bg to-pillar-earn-bg2",
    ring: "ring-accent/25",
    tint: "bg-pillar-earn-tint",
    solid: "bg-accent",
    active: "bg-pillar-earn-active",
    text: "text-pillar-earn-text",
    thumb: "from-accent to-pillar-earn-grad2",
  },
  spend: {
    bg: "from-pillar-spend-bg to-pillar-spend-bg2",
    ring: "ring-pillar-spend-icon/25",
    tint: "bg-pillar-spend-tint",
    solid: "bg-pillar-spend-icon",
    active: "bg-pillar-spend-active",
    text: "text-pillar-spend-text",
    thumb: "from-pillar-spend-grad to-pillar-spend-grad2",
  },
  save: {
    bg: "from-pillar-save-bg to-pillar-save-bg2",
    ring: "ring-pillar-save-icon/25",
    tint: "bg-pillar-save-tint",
    solid: "bg-pillar-save-icon",
    active: "bg-pillar-save-active",
    text: "text-pillar-save-text",
    thumb: "from-pillar-save-icon to-primary",
  },
  invest: {
    bg: "from-pillar-invest-bg to-pillar-invest-bg2",
    ring: "ring-pillar-invest-icon/25",
    tint: "bg-pillar-invest-tint",
    solid: "bg-pillar-invest-icon",
    active: "bg-pillar-invest-active",
    text: "text-pillar-invest-text",
    thumb: "from-pillar-invest-grad to-pillar-invest-grad2",
  },
  optimize: {
    bg: "from-pillar-optimize-bg to-pillar-optimize-bg2",
    ring: "ring-pillar-optimize-icon/25",
    tint: "bg-pillar-optimize-tint",
    solid: "bg-pillar-optimize-icon",
    active: "bg-pillar-optimize-active",
    text: "text-pillar-optimize-text",
    thumb: "from-pillar-optimize-icon to-pillar-optimize-grad2",
  },
  protect: {
    bg: "from-pillar-protect-bg to-pillar-protect-bg2",
    ring: "ring-pillar-protect-icon/25",
    tint: "bg-pillar-protect-tint",
    solid: "bg-pillar-protect-icon",
    active: "bg-pillar-protect-active",
    text: "text-pillar-protect-text",
    thumb: "from-pillar-protect-icon to-pillar-protect-grad2",
  },
  milestones: {
    bg: "from-pillar-milestones-bg to-pillar-milestones-bg2",
    ring: "ring-pillar-milestones-icon/25",
    tint: "bg-pillar-milestones-tint",
    solid: "bg-pillar-milestones-icon",
    active: "bg-pillar-milestones-active",
    text: "text-pillar-milestones-text",
    thumb: "from-pillar-milestones-icon to-pillar-milestones-grad2",
  },
  legacy: {
    bg: "from-pillar-legacy-bg to-pillar-legacy-bg2",
    ring: "ring-gold/25",
    tint: "bg-pillar-legacy-tint",
    solid: "bg-gold",
    active: "bg-pillar-legacy-active",
    text: "text-pillar-legacy-text",
    thumb: "from-gold to-pillar-legacy-grad2",
  },
};

/** Ordered slugs, matching the 8-pillar narrative order. */
export const CATEGORY_SLUGS: CategorySlug[] = [
  "earn",
  "spend",
  "save",
  "invest",
  "optimize",
  "protect",
  "milestones",
  "legacy",
];

/** Resolve a category name (any case) to its color set; falls back to invest. */
export function categoryColor(category: string): CategoryColor {
  const slug = category.toLowerCase() as CategorySlug;
  return CATEGORY_COLORS[slug] ?? CATEGORY_COLORS.invest;
}
