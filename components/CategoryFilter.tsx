"use client";

interface CategoryFilterProps {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

const categoryHoverColors: Record<string, string> = {
  Earn: "hover:bg-emerald-100 hover:text-emerald-800",
  Spend: "hover:bg-amber-100 hover:text-amber-800",
  Save: "hover:bg-blue-100 hover:text-blue-800",
  Invest: "hover:bg-purple-100 hover:text-purple-800",
  Optimize: "hover:bg-yellow-100 hover:text-yellow-800",
  Protect: "hover:bg-rose-100 hover:text-rose-800",
  Milestones: "hover:bg-cyan-100 hover:text-cyan-800",
  Legacy: "hover:bg-amber-100 hover:text-amber-800",
};

const categoryActiveColors: Record<string, string> = {
  Earn: "bg-emerald-600 text-white shadow-md",
  Spend: "bg-amber-600 text-white shadow-md",
  Save: "bg-blue-600 text-white shadow-md",
  Invest: "bg-purple-600 text-white shadow-md",
  Optimize: "bg-yellow-600 text-white shadow-md",
  Protect: "bg-rose-600 text-white shadow-md",
  Milestones: "bg-cyan-600 text-white shadow-md",
  Legacy: "bg-amber-600 text-white shadow-md",
};

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
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-6 py-3 rounded-full text-sm font-semibold transition-all ${
            selected === cat
              ? categoryActiveColors[cat] || "bg-primary text-white shadow-md"
              : `bg-gray-100 text-gray-700 ${categoryHoverColors[cat] || "hover:bg-gray-200 hover:text-dark-text"}`
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
