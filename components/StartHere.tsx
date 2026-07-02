import Link from "next/link";
import { iqBadgeLabel, iqTier, IQ_BADGE_CLASSES } from "@/lib/iq";

const GUIDES = [
  {
    slug: "getting-started-with-budgeting",
    title: "Getting Started with Budgeting: A Beginner's Guide",
    dek: "Create your first budget with the 50/30/20 rule and a system that actually sticks.",
    category: "Spend",
    minutes: 2,
    iqScore: 95,
    stat: "50/30/20",
    caption: "needs · wants · savings",
    // Panel fills cycle mint → warm gold → blue (deepened per reference:
    // emerald-200 / #F0DFA0 / blue-200); stat text darkened for AA contrast
    panel: "bg-emerald-200",
    statColor: "text-emerald-800",
  },
  {
    slug: "vet-online-income-opportunity",
    title: "How to Vet Any Online Income Opportunity in 10 Minutes",
    dek: "A 5-point due-diligence check to tell whether any “make money online” offer is real.",
    category: "Earn",
    minutes: 6,
    iqScore: 95,
    stat: "10 min",
    caption: "5-point legitimacy check",
    panel: "bg-[#F0DFA0]",
    statColor: "text-yellow-800",
  },
  {
    slug: "investing-101",
    title: "Investing 101: How to Start Investing with Any Amount",
    dek: "The basics of stocks, index funds, and compound interest — no big balance required.",
    category: "Invest",
    minutes: 3,
    iqScore: 110,
    stat: "+18.4%",
    caption: "compound growth, illustrated",
    panel: "bg-blue-200",
    statColor: "text-primary",
  },
  {
    slug: "best-high-yield-savings-accounts-2026",
    title: "The 5 Best High-Yield Savings Accounts in 2026",
    dek: "Top high-yield savings accounts compared by rate, fees, minimums, and features.",
    category: "Save",
    minutes: 5,
    iqScore: 125,
    stat: "4.50% APY",
    caption: "top rate, verified Feb 2026",
    panel: "bg-emerald-200",
    statColor: "text-emerald-800",
  },
];

export default function StartHere() {
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
              Four guides most readers begin with
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

        {/* Cards — 4-col, gap 20px */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={`/blog/${guide.slug}`}
              className="group block bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-[180ms] ease-out hover:-translate-y-1 hover:shadow-[0_20px_36px_-24px_rgba(26,60,110,0.4)]"
            >
              {/* Top panel — typographic stat */}
              <div
                className={`min-h-[112px] px-[22px] py-6 flex flex-col items-center justify-center text-center ${guide.panel}`}
              >
                <span className={`text-[28px] font-bold leading-tight ${guide.statColor}`}>
                  {guide.stat}
                </span>
                <span className="text-xs text-slate-700 mt-1">{guide.caption}</span>
              </div>

              {/* Body */}
              <div className="p-[22px]">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-gold-dark">
                    {guide.category}
                  </span>
                  <span className="text-xs text-slate-400">· {guide.minutes} min</span>
                  <span
                    className={`ml-auto text-[11px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${IQ_BADGE_CLASSES[iqTier(guide.iqScore)]}`}
                  >
                    {iqBadgeLabel(guide.iqScore)}
                  </span>
                </div>
                <h3 className="text-lg/[1.3] font-bold text-primary mb-2">
                  {guide.title}
                </h3>
                <p className="text-sm/[1.55] text-slate-500">{guide.dek}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
