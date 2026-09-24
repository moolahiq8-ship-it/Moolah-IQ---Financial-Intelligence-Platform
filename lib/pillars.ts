// The three content pillars (2026-09-23): GROW, PROTECT, OPTIMIZE.
//
// A PRESENTATION/GROUPING LAYER over the existing article categories - nothing here
// changes an article's `category` frontmatter, its slug or any /category/* route.
// Mapping rules:
//   - Invest   -> GROW (trading and investing)
//   - Protect  -> PROTECT
//   - Optimize -> OPTIMIZE
//   - older Save / Earn / Legacy articles join a pillar ONLY where their actual subject fits
//     (listed by slug in SLUG_PILLAR); everything else stays reachable through All Articles
//     and its existing /category/* route, and is shown as "More topics".
// Colours reuse the shared CATEGORY theme (lib/blog/theme.ts) read-only: GROW uses the
// existing INVEST palette.

import type { Category } from "@/lib/blog/types";

export type PillarSlug = "grow" | "protect" | "optimize";

export interface Pillar {
  slug: PillarSlug;
  label: string; // display label, e.g. "GROW"
  name: string; // title case, e.g. "Grow"
  description: string;
  theme: Category; // palette key in lib/blog/theme.ts
  icon: string; // heroicons outline path (the site's existing inline-SVG icon system)
}

export const PILLARS: Pillar[] = [
  {
    slug: "grow",
    label: "GROW",
    name: "Grow",
    description:
      "Trading and investing: technical analysis, futures day trading, options swing trading, and long-term investing, with honest breakdowns of setups, strategies, and risk.",
    theme: "invest",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  },
  {
    slug: "protect",
    label: "PROTECT",
    name: "Protect",
    description: "Safeguard your family and assets with practical insurance knowledge and fraud prevention.",
    theme: "protect",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    slug: "optimize",
    label: "OPTIMIZE",
    name: "Optimize",
    description:
      "Make your finances work more efficiently: mortgage and debt payoff, credit management, and cutting interest, fees, and hidden costs.",
    theme: "optimize",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

const CATEGORY_PILLAR: Record<string, PillarSlug> = {
  invest: "grow",
  protect: "protect",
  optimize: "optimize",
};

// Older articles whose actual subject fits a pillar. Anything not listed (and not in a
// pillar category) stays in the archive: the side-hustle automation series, the
// high-yield savings comparison.
const SLUG_PILLAR: Record<string, PillarSlug> = {
  "vet-online-income-opportunity": "protect", // fraud / scam vetting
  "getting-started-with-budgeting": "optimize", // budgeting
  "cut-three-bills-without-giving-anything-up": "optimize", // cost reduction
  "subscriptions-still-charging-after-cancel": "optimize", // cost reduction
};

export function pillarOf(post: { slug: string; category: string }): PillarSlug | null {
  return SLUG_PILLAR[post.slug] ?? CATEGORY_PILLAR[post.category.toLowerCase()] ?? null;
}

export function getPillar(slug: string): Pillar | undefined {
  return PILLARS.find((p) => p.slug === slug);
}

/** Filter key for posts in no pillar (kept visible as the archive). */
export const MORE_TOPICS = "more";
