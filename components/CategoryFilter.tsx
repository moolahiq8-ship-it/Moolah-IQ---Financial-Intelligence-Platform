"use client";

import { CATEGORY } from "@/lib/blog/theme";
import type { Category } from "@/lib/blog/types";

interface CategoryFilterProps {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

// v2 blog filter pills (Spec §5.4 / §1.3 / §1.5). "All" = navy; category pills
// take their text colour from lib/blog/theme, filled when active.
export default function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`rounded-pill px-4 py-2 font-blog-sans text-[13.5px] font-bold transition-colors ${
          selected === null
            ? "bg-navy text-white"
            : "border border-line bg-surface text-body hover:text-ink"
        }`}
      >
        All
      </button>
      {categories.map((cat) => {
        const c = CATEGORY[cat.toLowerCase() as Category];
        const active = selected === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className="rounded-pill border px-4 py-2 font-blog-sans text-[13.5px] font-bold transition-colors"
            style={
              active
                ? { background: c?.dot, color: "#fff", borderColor: c?.dot }
                : { background: "#fffdf8", color: c?.text, borderColor: "#e6e0d4" }
            }
          >
            {c?.label ?? cat}
          </button>
        );
      })}
    </div>
  );
}
