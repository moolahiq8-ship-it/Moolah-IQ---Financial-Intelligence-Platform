import Link from "next/link";
import Image from "next/image";
import { PostFrontmatter, IqLevel } from "@/lib/posts";
import CardIllustration from "./CardIllustration";

const categoryColors: Record<string, { gradient: string; badge: string }> = {
  earn: {
    gradient: "from-emerald-400 to-teal-600",
    badge: "bg-emerald-50 text-emerald-700",
  },
  spend: {
    gradient: "from-amber-400 to-orange-600",
    badge: "bg-amber-50 text-amber-700",
  },
  save: {
    gradient: "from-blue-400 to-indigo-600",
    badge: "bg-blue-50 text-blue-700",
  },
  invest: {
    gradient: "from-purple-400 to-violet-600",
    badge: "bg-purple-50 text-purple-700",
  },
  optimize: {
    gradient: "from-yellow-400 to-amber-600",
    badge: "bg-yellow-50 text-yellow-700",
  },
  protect: {
    gradient: "from-rose-400 to-red-600",
    badge: "bg-rose-50 text-rose-700",
  },
  milestones: {
    gradient: "from-cyan-400 to-blue-600",
    badge: "bg-cyan-50 text-cyan-700",
  },
  legacy: {
    gradient: "from-amber-300 to-amber-700",
    badge: "bg-amber-50 text-amber-800",
  },
};

const defaultColors = {
  gradient: "from-gray-400 to-gray-600",
  badge: "bg-gray-50 text-gray-700",
};

const iqConfig: Record<IqLevel, { color: string; bg: string; bar: string; label: string }> = {
  "Foundational IQ": {
    color: "text-emerald-600",
    bg: "bg-emerald-500",
    bar: "bg-emerald-100",
    label: "Beginner",
  },
  "Market IQ": {
    color: "text-blue-600",
    bg: "bg-blue-500",
    bar: "bg-blue-100",
    label: "Intermediate",
  },
  "Strategic IQ": {
    color: "text-amber-600",
    bg: "bg-amber-500",
    bar: "bg-amber-100",
    label: "Advanced",
  },
  "Alpha IQ": {
    color: "text-red-600",
    bg: "bg-red-500",
    bar: "bg-red-100",
    label: "Expert",
  },
};

export default function PostCard({ post }: { post: PostFrontmatter }) {
  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const colors =
    categoryColors[post.category.toLowerCase()] || defaultColors;

  const iq = iqConfig[post.iqLevel] || iqConfig["Foundational IQ"];
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
            className={`aspect-[16/10] bg-gradient-to-br ${colors.gradient} rounded-xl flex items-center justify-center overflow-hidden`}
          >
            <div className="group-hover:scale-105 transition-transform duration-500 flex items-center justify-center w-full h-full">
              <CardIllustration slug={post.slug} category={post.category} />
            </div>
          </div>
        )}
        {/* IQ difficulty badge overlay */}
        <div className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md backdrop-blur-md text-white text-[10px] font-bold shadow-lg transition-all duration-300 group-hover:scale-110 ${
          post.iqLevel === "Foundational IQ" ? "bg-emerald-600/80 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.5)]" :
          post.iqLevel === "Market IQ" ? "bg-blue-600/80 group-hover:shadow-[0_0_12px_rgba(59,130,246,0.5)]" :
          post.iqLevel === "Strategic IQ" ? "bg-amber-600/80 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.5)]" :
          "bg-red-600/80 group-hover:shadow-[0_0_12px_rgba(239,68,68,0.5)]"
        }`}>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6c0 2.04 1.02 3.84 2.57 4.93L6 18h8l-.57-5.07A5.97 5.97 0 0016 8a6 6 0 00-6-6zm-1 14h2v1H9v-1z" />
          </svg>
          {post.iqScore} IQ
        </div>
      </Link>

      {/* Content */}
      <div>
        {/* Category badge + meta */}
        <div className="flex items-center gap-3 mb-3">
          <Link
            href={`/category/${post.category.toLowerCase()}`}
            className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${colors.badge} hover:opacity-80 transition-opacity`}
          >
            {post.category}
          </Link>
          <span className="text-xs text-gray-300 font-medium">
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
        <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-4">
          {post.excerpt}
        </p>

        {/* IQ Complexity */}
        <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <svg className={`w-3.5 h-3.5 ${iq.color}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6c0 2.04 1.02 3.84 2.57 4.93L6 18h8l-.57-5.07A5.97 5.97 0 0016 8a6 6 0 00-6-6zm-1 14h2v1H9v-1z" />
              </svg>
              <span className={`text-[11px] font-bold ${iq.color}`}>{post.iqLevel}</span>
            </div>
            <span className="text-[11px] font-extrabold text-dark-text">{post.iqScore} IQ</span>
          </div>
          <div className={`h-1.5 rounded-full ${iq.bar} overflow-hidden`}>
            <div
              className={`h-full rounded-full ${iq.bg} transition-all duration-500`}
              style={{ width: `${barPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{iq.label} level complexity</p>
        </div>

        {/* Author + date */}
        <div className="flex items-center gap-2 text-xs text-gray-300">
          <span className="font-medium">{post.author}</span>
          <span>&middot;</span>
          <time dateTime={post.date}>{formattedDate}</time>
        </div>
      </div>
    </article>
  );
}
