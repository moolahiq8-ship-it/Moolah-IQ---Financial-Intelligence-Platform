import Link from "next/link";
import type { Post } from "@/lib/blog/types";
import { CATEGORY, LEVEL, TRACK, categoryGradient, formatDate } from "@/lib/blog/theme";
import { CardIllustration, panelClassFor } from "./CardIllustration";

/**
 * ArticleCard — one card in the grid (Handoff Spec §3).
 * Whole card is a single link; hover lifts it. Static tokens come from
 * tailwind.config §1.7; per-category/level colours come from lib/blog/theme.
 * Adapted for scoping: font-serif → font-blog-serif; href → /blog/.
 */
export function ArticleCard({ post }: { post: Post }) {
  const cat = CATEGORY[post.category];
  const lvl = LEVEL[post.level];

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-line-card bg-surface shadow-card transition-[transform,box-shadow] duration-[180ms] hover:-translate-y-[5px] hover:shadow-card-hover"
    >
      {/* image panel */}
      <div
        className={`h-[168px] p-[22px] ${panelClassFor(post.illustration.variant)}`}
        style={{ background: categoryGradient(post.category) }}
      >
        <CardIllustration art={post.illustration} />
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col px-[22px] pb-[22px] pt-5">
        {/* eyebrow */}
        <div className="mb-[13px] flex items-center gap-2.5 text-[12px] font-bold">
          <span className="flex items-center gap-1.5" style={{ color: cat.text }}>
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: cat.dot }} />
            {cat.label}
          </span>
          <span className="text-[#cfc8ba]">·</span>
          <span className="font-medium text-muted">{post.readingTime} min read</span>
        </div>

        {/* title */}
        <h3 className="mb-2.5 font-blog-serif text-[20px] font-bold leading-[1.24] text-navy">
          {post.title}
        </h3>

        {/* dek */}
        <p className="mb-5 text-[14px] leading-[1.55] text-body">{post.dek}</p>

        {/* complexity meter (pushed to bottom) */}
        <div className="mt-auto">
          <div className="mb-[7px] flex items-center justify-between">
            <span className="text-[12px] font-bold" style={{ color: lvl.text }}>
              {lvl.label}
            </span>
            <span className="text-[11px] tracking-[0.04em] text-muted-3">COMPLEXITY</span>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-[5px] flex-1 rounded-[3px]"
                style={{ background: i < lvl.count ? lvl.fill : TRACK }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* footer */}
      <div className="border-t border-line-divider px-[22px] py-[13px] text-[12.5px] font-semibold text-muted">
        {post.author} · {formatDate(post.date)}
      </div>
    </Link>
  );
}
