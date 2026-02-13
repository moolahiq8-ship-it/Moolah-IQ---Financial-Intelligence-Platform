"use client";

import { useState } from "react";
import PostCard from "@/components/PostCard";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import { PostFrontmatter } from "@/lib/posts";

interface BlogClientProps {
  posts: PostFrontmatter[];
  categories: string[];
}

export default function BlogClient({ posts, categories }: BlogClientProps) {
  const [filteredPosts, setFilteredPosts] = useState(posts);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState(posts);

  const handleSearch = (results: PostFrontmatter[]) => {
    setSearchResults(results);
    if (selectedCategory) {
      setFilteredPosts(
        results.filter(
          (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
        )
      );
    } else {
      setFilteredPosts(results);
    }
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    if (category) {
      setFilteredPosts(
        searchResults.filter(
          (p) => p.category.toLowerCase() === category.toLowerCase()
        )
      );
    } else {
      setFilteredPosts(searchResults);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-3 tracking-tight">
          Blog
        </h1>
        <p className="text-gray-400 text-lg">
          Browse all articles on personal finance, investing, and building wealth.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="space-y-6 mb-10">
        <SearchBar posts={posts} onResults={handleSearch} />
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={handleCategorySelect}
        />
      </div>

      {/* Posts grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No posts found.</p>
        </div>
      )}
    </section>
  );
}
