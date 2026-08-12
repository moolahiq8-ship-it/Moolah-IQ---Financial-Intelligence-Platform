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

// The LATEST grid shows six cards until the reader asks for more.
// The hero takes the newest post, so the page opens with seven visible.
const GRID_PAGE_SIZE = 6;

export default function BlogClient({ posts, categories }: BlogClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState(posts);
  const [showAll, setShowAll] = useState(false);

  // Narrowing the set must re-apply the cap. Without this a reader who expands
  // once would see every later filter or search render uncapped, because
  // showAll would still be true against a brand-new gridPosts.
  const handleResults = (results: PostFrontmatter[]) => {
    setSearchResults(results);
    setShowAll(false);
  };

  const handleSelect = (category: string | null) => {
    setSelectedCategory(category);
    setShowAll(false);
  };

  // Featured = newest post overall (posts is date-desc from getAllPosts).
  const featured = posts[0];

  const filtered = searchResults.filter(
    (p) => !selectedCategory || p.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  // The featured post headlines the hero — don't repeat it in the LATEST grid.
  const gridPosts = filtered.filter((p) => p.slug !== featured?.slug);

  const visiblePosts = showAll ? gridPosts : gridPosts.slice(0, GRID_PAGE_SIZE);
  const remaining = gridPosts.length - visiblePosts.length;

  return (
    <>
      {featured && <FeaturedHero post={adaptPost(featured, true)} />}

      {/* search + filters */}
      <div className="mt-[60px] mb-9 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="lg:max-w-[420px] lg:flex-1">
          <SearchBar posts={posts} onResults={handleResults} />
        </div>
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={handleSelect}
        />
      </div>

      {/* LATEST section eyebrow */}
      <div className="mb-6 flex items-center gap-3">
        <span className="h-0.5 w-[26px] bg-bgold-rule" />
        <span className="text-[12px] font-extrabold tracking-[0.16em] text-bgold-ink">LATEST</span>
      </div>

      {gridPosts.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {visiblePosts.map((p) => (
            <ArticleCard key={p.slug} post={adaptPost(p)} />
          ))}
        </div>
      ) : (
        <p className="text-body">No articles found.</p>
      )}

      {/* Load more — reveals in place, so a button rather than a Link. Nothing
          renders once expanded; there is deliberately no "show less". */}
      {!showAll && gridPosts.length > GRID_PAGE_SIZE && (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-2 border-b-2 border-bgold-rule pb-1 font-blog-sans text-[15px] font-bold text-bgold-ink transition-colors hover:border-bgold hover:text-navy"
          >
            Show {remaining} more {remaining === 1 ? "article" : "articles"}
            <span aria-hidden="true" className="text-[17px]">
              &rarr;
            </span>
          </button>
        </div>
      )}
    </>
  );
}
