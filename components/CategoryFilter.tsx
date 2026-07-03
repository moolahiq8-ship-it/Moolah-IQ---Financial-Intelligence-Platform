"use client";

import { categoryColor } from "@/lib/categories";

interface CategoryFilterProps {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export default function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`px-6 py-3 rounded-full text-sm font-semibold transition-all ${
          selected === null
            ? "bg-primary text-white shadow-md"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-dark-text"
        }`}
      >
        All
      </button>
      {categories.map((cat) => {
        const c = categoryColor(cat);
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`px-6 py-3 rounded-full text-sm font-semibold transition-all ${
              selected === cat
                ? `${c.active} text-white shadow-md`
                : `${c.tint} ${c.text} hover:brightness-95`
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
