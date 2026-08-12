// Adapter: PostFrontmatter (markdown) → the v2 blog `Post` shape the handoff
// components consume. This is why a new article needs NO new frontmatter:
// dek←excerpt, level/tier←iqScore, readingTime←parsed int, variant←category
// default, heroStat←only if authored (else copy-only hero).

import type { PostFrontmatter } from "@/lib/posts";
import { iqLevel, iqTier } from "@/lib/iq";
import type { Category, IllustrationVariant, Post } from "./types";

// Deviation #1: variant defaults from category — no per-post design decision.
// bars & line-area need no data. Extra pillars get a sensible default too.
const DEFAULT_VARIANT: Record<Category, IllustrationVariant> = {
  earn: "bars",
  save: "bars",
  invest: "line-area",
  optimize: "bars",
  protect: "line-area",
  legacy: "bars",
};

function minutes(readingTime: string): number {
  const m = /\d+/.exec(readingTime);
  return m ? parseInt(m[0], 10) : 1;
}

export function adaptPost(fm: PostFrontmatter, featured = false): Post {
  const category = fm.category.toLowerCase() as Category;
  return {
    slug: fm.slug,
    title: fm.title,
    dek: fm.excerpt,
    category,
    level: iqLevel(fm.iqScore),
    tier: iqTier(fm.iqScore),
    readingTime: minutes(fm.readingTime),
    author: fm.author,
    date: fm.date,
    illustration: fm.illustration ?? { variant: DEFAULT_VARIANT[category] ?? "bars" },
    featured,
    tldr: fm.tldr,
    heroStat: fm.heroStat, // omit → copy-only hero (deviation #2; never fabricated)
  };
}
