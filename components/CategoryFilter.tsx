"use client";

interface CategoryFilterProps {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

const categoryDefaultColors: Record<string, string> = {
  Earn: "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100",
  Spend: "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100",
  Save: "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100",
  Invest: "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100",
  Optimize: "bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100",
  Protect: "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100",
  Milestones: "bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100",
  Legacy: "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100",
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
              : categoryDefaultColors[cat] || "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-dark-text"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
