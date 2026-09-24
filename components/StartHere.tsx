import Link from "next/link";
import { iqBadgeLabel, iqTier, IQ_BADGE_CLASSES } from "@/lib/iq";
import { getAllPosts } from "@/lib/posts";
import { getPillar, pillarOf } from "@/lib/pillars";

// The four featured guides (2026-09-23), in display order. Title, summary, reading time
// and level come from each article's own metadata (content/posts/*.md) at build time;
// only the panel's topic label is written here - a topic, never an invented statistic.
const FEATURED = [
  {
    slug: "investing-101",
    topic: "How compounding works",
    caption: "stocks · index funds · any amount",
    panel: "bg-blue-200",
    topicColor: "text-primary",
  },
  {
    slug: "size-your-first-investments",
    topic: "Position sizing",
    caption: "the asymmetric-risk rule",
    panel: "bg-[#F0DFA0]",
    topicColor: "text-yellow-800",
  },
  {
    slug: "ask-credit-card-issuer-for-lower-rate",
    topic: "Ask for a lower rate",
    caption: "what to say on the call",
    panel: "bg-emerald-200",
    topicColor: "text-emerald-800",
  },
  {
    slug: "three-ways-pay-off-mortgage-years-early-without-refinancing",
    topic: "Pay off your mortgage early",
    caption: "without refinancing",
    panel: "bg-blue-200",
    topicColor: "text-primary",
  },
];

function featuredGuides() {
  const posts = getAllPosts();
  return FEATURED.map((f) => {
    const post = posts.find((p) => p.slug === f.slug);
    if (!post) throw new Error(`StartHere: featured article ${f.slug} not found in content/posts`);
    const pillarSlug = pillarOf(post);
    return {
      ...f,
      title: post.title,
      dek: post.excerpt,
      readingTime: post.readingTime,
      iqScore: post.iqScore,
      pillar: pillarSlug ? getPillar(pillarSlug)?.label ?? post.category : post.category,
    };
  });
}

export default function StartHere() {
  const GUIDES = featuredGuides();
  return (
    <section id="start" className="bg-white scroll-mt-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-14 py-16 lg:py-20">
        {/* Section header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-9">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gold-dark mb-2">
              Start here
            </p>
            <h2
              className="text-3xl md:text-[38px]/[1.2] font-extrabold text-primary"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Four guides to start with
            </h2>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-accent hover:text-primary transition-colors"
          >
            Browse all guides
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Cards — 1 col, 2 col from sm, 4 col from xl (at 1024px four columns were ~209px wide), gap 20px */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={`/blog/${guide.slug}`}
              className="group block bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-[180ms] ease-out hover:-translate-y-1 hover:shadow-[0_20px_36px_-24px_rgba(26,60,110,0.4)]"
            >
              {/* Top panel — topic label */}
              <div
                className={`min-h-[112px] px-[22px] py-6 flex flex-col items-center justify-center text-center ${guide.panel}`}
              >
                <span className={`text-[22px] font-bold leading-tight ${guide.topicColor}`}>
                  {guide.topic}
                </span>
                <span className="text-xs text-slate-700 mt-1">{guide.caption}</span>
              </div>

              {/* Body */}
              <div className="p-[22px]">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-gold-dark">
                    {guide.pillar}
                  </span>
                  <span className="text-xs text-slate-500">· {guide.readingTime}</span>
                  <span
                    className={`ml-auto text-[11px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${IQ_BADGE_CLASSES[iqTier(guide.iqScore)]}`}
                  >
                    {iqBadgeLabel(guide.iqScore)}
                  </span>
                </div>
                <h3 className="text-lg/[1.3] font-bold text-primary mb-2">
                  {guide.title}
                </h3>
                <p className="text-sm/[1.55] text-slate-500 line-clamp-4">{guide.dek}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
