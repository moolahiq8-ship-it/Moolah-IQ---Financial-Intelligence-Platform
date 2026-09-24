"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import PostCard from "./PostCard";
import { PostFrontmatter } from "@/lib/posts";
import { PILLARS, pillarOf } from "@/lib/pillars";

// Not currently rendered on any page (kept for reuse). Since 2026-09-23 the tabs are the
// three pillars (lib/pillars.ts), a grouping over existing categories.
const TAB_CATEGORIES = [
  { label: "All", slug: null as string | null, icon: "M4 6h16M4 12h16M4 18h16" },
  ...PILLARS.map((p) => ({ label: p.name, slug: p.slug as string | null, icon: p.icon })),
]

export default function HomeTabs({ posts }: { posts: PostFrontmatter[] }) {
  const [activeTab, setActiveTab] = useState("All");

  const filtered = useMemo(() => {
    if (activeTab === "All") return posts;
    const slug = TAB_CATEGORIES.find((t) => t.label === activeTab)?.slug;
    return posts.filter((p) => pillarOf(p) === slug);
  }, [activeTab, posts]);

  return (
    <section className="-mt-20 relative z-10 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Elevated card container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50">
          {/* Category tabs */}
          <div className="px-4 sm:px-8 pt-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-px scrollbar-hide">
              {TAB_CATEGORIES.map(({ label, icon }) => (
                <button
                  key={label}
                  onClick={() => setActiveTab(label)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    activeTab === label
                      ? "bg-primary text-white shadow-md"
                      : "text-dark-text hover:bg-gray-100 hover:text-primary"
                  }`}
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={icon}
                    />
                  </svg>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-4 sm:mx-8 mt-4" />

          {/* Cards grid */}
          <div className="p-4 sm:p-8">
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {filtered.map((post) => (
                  <div key={post.slug} className="animate-[fadeIn_0.3s_ease-out]">
                    <PostCard post={post} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <p className="text-gray-700 font-medium">
                  No articles in this category yet.
                </p>
              </div>
            )}

            {/* View all link */}
            {filtered.length > 0 && (
              <div className="text-center mt-10">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-gold-dark transition-colors"
                >
                  Get the Intelligence
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
