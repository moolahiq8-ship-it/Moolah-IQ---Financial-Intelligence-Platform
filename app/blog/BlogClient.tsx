"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import { PostFrontmatter } from "@/lib/posts";
import { FeaturedHero } from "@/components/blog/FeaturedHero";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { adaptPost } from "@/lib/blog/adaptPost";

interface BlogClientProps {
  posts: PostFrontmatter[];
  categories: string[];
}

export default function BlogClient({ posts, categories }: BlogClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState(posts);

  // Featured = newest post overall (posts is date-desc from getAllPosts).
  const featured = posts[0];

  const filtered = searchResults.filter(
    (p) => !selectedCategory || p.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  // The featured post headlines the hero — don't repeat it in the LATEST grid.
  const gridPosts = filtered.filter((p) => p.slug !== featured?.slug);

  return (
    <>
      {featured && <FeaturedHero post={adaptPost(featured, true)} />}

      {/* search + filters */}
      <div className="mt-[60px] mb-9 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="lg:max-w-[420px] lg:flex-1">
          <SearchBar posts={posts} onResults={setSearchResults} />
        </div>
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {/* LATEST section eyebrow */}
      <div className="mb-6 flex items-center gap-3">
        <span className="h-0.5 w-[26px] bg-bgold-rule" />
        <span className="text-[12px] font-extrabold tracking-[0.16em] text-bgold-ink">LATEST</span>
      </div>

      {gridPosts.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {gridPosts.map((p) => (
            <ArticleCard key={p.slug} post={adaptPost(p)} />
          ))}
        </div>
      ) : (
        <p className="text-body">No articles found.</p>
      )}
    </>
  );
}
