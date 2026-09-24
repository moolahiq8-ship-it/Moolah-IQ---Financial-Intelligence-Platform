"use client";

import { CATEGORY } from "@/lib/blog/theme";
import { PILLARS, MORE_TOPICS } from "@/lib/pillars";

interface CategoryFilterProps {
  /** show the "More topics" pill (posts in no pillar) */
  hasMoreTopics: boolean;
  selected: string | null;
  onSelect: (pillar: string | null) => void;
}

// v2 blog filter pills (Spec §5.4 / §1.3 / §1.5). "All" = navy; since 2026-09-23 the
// pills are the three pillars (lib/pillars.ts, a grouping over existing categories)
// plus "More topics" for earlier articles outside them. Colours from lib/blog/theme.
export default function CategoryFilter({ hasMoreTopics, selected, onSelect }: CategoryFilterProps) {
  const pill = "rounded-pill border px-4 py-2 font-blog-sans text-[13.5px] font-bold transition-colors";
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter articles by pillar">
      <button
        type="button"
        aria-pressed={selected === null}
        onClick={() => onSelect(null)}
        className={`rounded-pill px-4 py-2 font-blog-sans text-[13.5px] font-bold transition-colors ${
          selected === null ? "bg-navy text-white" : "border border-line bg-surface text-body hover:text-ink"
        }`}
      >
        All
      </button>
      {PILLARS.map((p) => {
        const c = CATEGORY[p.theme];
        const active = selected === p.slug;
        return (
          <button
            key={p.slug}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(p.slug)}
            className={pill}
            style={
              active
                ? { background: c.dot, color: "#fff", borderColor: c.dot }
                : { background: "#fffdf8", color: c.text, borderColor: "#e6e0d4" }
            }
          >
            {p.label}
          </button>
        );
      })}
      {hasMoreTopics && (
        <button
          type="button"
          aria-pressed={selected === MORE_TOPICS}
          onClick={() => onSelect(MORE_TOPICS)}
          className={`${pill} ${
            selected === MORE_TOPICS ? "border-navy bg-navy text-white" : "border-line bg-surface text-body hover:text-ink"
          }`}
        >
          More topics
        </button>
      )}
    </div>
  );
}
