"use client";

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
        className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
          selected === null
            ? "bg-primary text-white shadow-sm"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-dark-text"
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
            selected === cat
              ? "bg-primary text-white shadow-sm"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-dark-text"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
