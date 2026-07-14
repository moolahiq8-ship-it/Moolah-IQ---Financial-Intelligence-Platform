import Link from "next/link";
import type { Post } from "@/lib/blog/types";
import { CATEGORY, LEVEL } from "@/lib/blog/theme";
import { HeroStatPanel } from "./HeroChart";

/**
 * FeaturedHero — the featured article hero (Handoff Spec §2).
 * Whole hero is one link. Two columns; if the post has no heroStat the
 * copy column spans full width (Spec §2.3 / §4).
 * Adapted for scoping: gold* → bgold*; font-serif → font-blog-serif; href → /blog/.
 */
export function FeaturedHero({ post }: { post: Post }) {
  const cat = CATEGORY[post.category];
  const lvl = LEVEL[post.level];
  const hasStat = Boolean(post.heroStat);

  return (
    <section>
      {/* section eyebrow */}
      <div className="mb-5 flex items-center gap-3">
        <span className="h-0.5 w-[26px] bg-bgold-rule" />
        <span className="text-[12px] font-extrabold tracking-[0.16em] text-bgold-ink">
          FEATURED ARTICLE
        </span>
      </div>

      <Link
        href={`/blog/${post.slug}`}
        className={`group grid overflow-hidden rounded-hero bg-navy shadow-hero ${
          hasStat ? "grid-cols-1 md:grid-cols-[1fr_1.02fr]" : "grid-cols-1"
        }`}
      >
        {/* left copy column */}
        <div className="flex flex-col px-[46px] pb-[42px] pt-[46px] text-white">
          {/* eyebrow (reversed colours over navy, Spec §1.3) */}
          <div className="mb-[22px] flex items-center gap-2.5 text-[12px] font-bold tracking-[0.05em]">
            <span className="flex items-center gap-[7px]" style={{ color: "#7fe3b1" }}>
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: "#22c184" }} />
              {cat.label}
            </span>
            <span className="text-white/40">·</span>
            <span className="text-white/65">
              {post.tier} · {lvl.label} · {post.readingTime} min read
            </span>
          </div>

          <h1 className="mb-[18px] font-blog-serif text-[40px] font-bold leading-[1.1] tracking-[-0.01em]">
            {post.title}
          </h1>
          <p className="mb-[26px] text-[16.5px] leading-[1.6] text-white/[0.78]">{post.dek}</p>

          {post.tldr && (
            <div className="border-t border-white/[0.14] pt-5 text-[14px] leading-[1.6] text-white/[0.72]">
              <span className="font-bold tracking-[0.03em] text-bgold">TL;DR</span>&nbsp;{post.tldr}
            </div>
          )}

          <div className="mt-auto pt-[30px]">
            <span className="inline-flex items-center gap-[9px] rounded-pill bg-bgold px-[22px] py-3 text-[15px] font-bold text-navy transition-colors duration-150 group-hover:bg-[#d49f3a]">
              Read article <span className="text-[17px]">→</span>
            </span>
          </div>
        </div>

        {/* right stat panel — per-post; omitted when no heroStat */}
        {post.heroStat && <HeroStatPanel stat={post.heroStat} />}
      </Link>
    </section>
  );
}
