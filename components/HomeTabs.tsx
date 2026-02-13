"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import PostCard from "./PostCard";
import { PostFrontmatter } from "@/lib/posts";

const TAB_CATEGORIES = [
  { label: "All", icon: "M4 6h16M4 12h16M4 18h16" },
  { label: "Earn", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Spend", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { label: "Save", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
  { label: "Invest", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
  { label: "Protect", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
];

export default function HomeTabs({ posts }: { posts: PostFrontmatter[] }) {
  const [activeTab, setActiveTab] = useState("All");

  const filtered = useMemo(() => {
    if (activeTab === "All") return posts;
    return posts.filter(
      (p) => p.category.toLowerCase() === activeTab.toLowerCase()
    );
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
                      : "text-dark-text hover:bg-gray-50 hover:text-primary"
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
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <p className="text-gray-400 font-medium">
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
