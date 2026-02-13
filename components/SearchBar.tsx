"use client";

import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import { PostFrontmatter } from "@/lib/posts";

interface SearchBarProps {
  posts: PostFrontmatter[];
  onResults: (results: PostFrontmatter[]) => void;
}

export default function SearchBar({ posts, onResults }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(posts, {
        keys: [
          { name: "title", weight: 2 },
          { name: "excerpt", weight: 1.5 },
          { name: "category", weight: 1 },
          { name: "tags", weight: 1 },
        ],
        threshold: 0.3,
      }),
    [posts]
  );

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim() === "") {
      onResults(posts);
    } else {
      const results = fuse.search(value).map((r) => r.item);
      onResults(results);
    }
  };

  return (
    <div className="relative">
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search articles..."
        className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold bg-white text-dark-text placeholder-gray-300 text-sm shadow-sm transition-shadow"
      />
    </div>
  );
}
