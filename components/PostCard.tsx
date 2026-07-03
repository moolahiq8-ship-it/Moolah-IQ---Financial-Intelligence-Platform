import Link from "next/link";
import Image from "next/image";
import { PostFrontmatter } from "@/lib/posts";
import { iqTier, iqBadgeLabel, IQ_BADGE_CLASSES, IqTier } from "@/lib/iq";
import CardIllustration from "./CardIllustration";
import { categoryColor } from "@/lib/categories";

// Complexity meter styling per tier (tier derives from iqScore via lib/iq)
const iqConfig: Record<IqTier, { bg: string; bar: string; label: string }> = {
  Foundations: {
    bg: "bg-emerald-500",
    bar: "bg-emerald-200",
    label: "Beginner",
  },
  Strategy: {
    bg: "bg-gold",
    bar: "bg-[#F0DFA0]",
    label: "Intermediate",
  },
  Mastery: {
    bg: "bg-primary",
    bar: "bg-blue-200",
    label: "Advanced",
  },
};

export default function PostCard({ post }: { post: PostFrontmatter }) {
  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const c = categoryColor(post.category);

  const tier = iqTier(post.iqScore);
  const iq = iqConfig[tier];
  const barPercent = Math.min(((post.iqScore - 70) / 80) * 100, 100);

  return (
    <article className="group rounded-2xl p-3 -m-3 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(212,175,55,0.12),0_2px_8px_rgba(0,0,0,0.06)]">
      {/* Cover image */}
      <Link href={`/blog/${post.slug}`} className="block mb-4 relative">
        {post.coverImage ? (
          <div className="aspect-[16/10] overflow-hidden rounded-xl relative">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        ) : (
          <div
            className={`aspect-[16/10] bg-gradient-to-br ${c.thumb} rounded-xl flex items-center justify-center overflow-hidden`}
          >
            <div className="group-hover:scale-105 transition-transform duration-500 flex items-center justify-center w-full h-full">
              <CardIllustration slug={post.slug} category={post.category} />
            </div>
          </div>
        )}
        {/* IQ difficulty badge overlay — homepage badge treatment */}
        <div className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold shadow-lg transition-all duration-300 group-hover:scale-110 ${IQ_BADGE_CLASSES[tier]}`}>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6c0 2.04 1.02 3.84 2.57 4.93L6 18h8l-.57-5.07A5.97 5.97 0 0016 8a6 6 0 00-6-6zm-1 14h2v1H9v-1z" />
          </svg>
          {iqBadgeLabel(post.iqScore)}
        </div>
      </Link>

      {/* Content */}
      <div>
        {/* Category badge + meta */}
        <div className="flex items-center gap-3 mb-3">
          <Link
            href={`/category/${post.category.toLowerCase()}`}
            className={`text-[11px] font-bold uppercase tracking-[0.06em] px-2.5 py-1 rounded-md ${c.tint} ${c.text} hover:opacity-80 transition-opacity`}
          >
            {post.category}
          </Link>
          <span className="text-xs text-gray-700 font-medium">
            {post.readingTime}
          </span>
        </div>

        {/* Title */}
        <Link href={`/blog/${post.slug}`}>
          <h2 className="text-base font-bold text-dark-text group-hover:text-primary transition-colors mb-2 leading-snug line-clamp-2">
            {post.title}
          </h2>
        </Link>

        {/* Excerpt */}
        <p className="text-gray-700 text-sm leading-relaxed line-clamp-2 mb-4">
          {post.excerpt}
        </p>

        {/* IQ Complexity */}
        <div className="mb-4 p-3 rounded-lg bg-gray-100 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${IQ_BADGE_CLASSES[tier]}`}>
              {iqBadgeLabel(post.iqScore)}
            </span>
          </div>
          <div className={`h-1.5 rounded-full ${iq.bar} overflow-hidden`}>
            <div
              className={`h-full rounded-full ${iq.bg} transition-all duration-500`}
              style={{ width: `${barPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-700 mt-1.5 font-medium">{iq.label} level complexity</p>
        </div>

        {/* Author + date */}
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <span className="font-medium">{post.author}</span>
          <span>&middot;</span>
          <time dateTime={post.date}>{formattedDate}</time>
        </div>
      </div>
    </article>
  );
}
