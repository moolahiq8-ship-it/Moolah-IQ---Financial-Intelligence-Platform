"use client";

import { useState } from "react";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import { PostFrontmatter } from "@/lib/posts";
import { iqBadgeLabel } from "@/lib/iq";
import { categoryColor } from "@/lib/categories";

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

  const featured = posts[0];
  const c = featured ? categoryColor(featured.category) : categoryColor("invest");

  return (
    <>
    {/* Dark Navy Hero */}
    <section className="relative overflow-hidden bg-primary neural-bg">
      {/* Mesh gradient blobs */}
      <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-gold rounded-full blur-3xl opacity-20" />
      <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-accent rounded-full blur-3xl opacity-20" />
      {/* Dot grid pattern */}
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Blog
        </h1>
        <p className="text-lg text-white/70 max-w-2xl leading-relaxed">
          Browse all articles on personal finance, investing, and building wealth.
        </p>
      </div>
    </section>

    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">

      {/* Featured Article */}
      {featured && (
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-gold mb-4">Featured Article</p>
          <Link href={`/blog/${featured.slug}`} className="group block">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-xl border border-gray-100/50">
              {/* Image / gradient side */}
              <div className={`relative bg-gradient-to-br ${c.thumb} p-8 md:p-10 flex flex-col justify-end min-h-[240px]`}>
                {/* Dot pattern overlay */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="relative">
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${c.tint} ${c.text} mb-3`}>
                    {featured.category}
                  </span>
                  <p className="text-white/60 text-sm font-medium">{iqBadgeLabel(featured.iqScore)} &middot; {featured.readingTime}</p>
                </div>
              </div>
              {/* Content side */}
              <div className="bg-white p-8 md:p-10 flex flex-col justify-center">
                <h2 className="text-2xl md:text-3xl font-extrabold text-primary mb-3 group-hover:text-accent transition-colors tracking-tight">
                  {featured.title}
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">{featured.excerpt}</p>
                {featured.tldr && (
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100 mb-4">
                    <span className="font-bold text-primary">TL;DR:</span> {featured.tldr}
                  </p>
                )}
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold group-hover:text-gold-dark transition-colors">
                  Read article
                  <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}

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
          <p className="text-gray-700 text-lg">No posts found.</p>
        </div>
      )}
    </section>
    </>
  );
}
