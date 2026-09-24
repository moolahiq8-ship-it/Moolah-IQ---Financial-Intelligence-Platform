import { Metadata } from "next";
import Newsletter from "@/components/Newsletter";
import { CATEGORY, categoryGradient } from "@/lib/blog/theme";
import type { Category } from "@/lib/blog/types";

export const metadata: Metadata = {
  title: "About",
  description:
    "Moolah IQ helps you grow, protect, and optimize your money through clear, research-backed personal finance and market education, with trading and investing as its main focus.",
};

// Three pillars (2026-09-23): GROW leads. Colours come from the shared CATEGORY theme
// (lib/blog/theme.ts) read-only: GROW uses the existing INVEST palette (trading and
// investing), PROTECT and OPTIMIZE their own. The theme map itself is unchanged.
const pillars: { name: string; description: string; icon: string; theme: Category; primary?: boolean }[] = [
  {
    name: "Grow",
    description:
      "Trading and investing, including technical analysis, futures day trading, options swing trading, and long-term investing. Explore chart walkthroughs and honest breakdowns of setups, strategies, and risk.",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    theme: "invest",
    primary: true,
  },
  {
    name: "Protect",
    description: "Safeguard your family and assets with practical insurance knowledge and fraud prevention.",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    theme: "protect",
  },
  {
    name: "Optimize",
    description:
      "Make your finances work more efficiently with mortgage and debt payoff strategies, credit management, and ways to cut interest, fees, and hidden costs.",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    theme: "optimize",
  },
];

export default function AboutPage() {
  return (
    <div className="antialiased">
      {/* Hero — Dark Navy */}
      <section className="relative overflow-hidden bg-primary neural-bg">
        {/* Mesh gradient blobs */}
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-gold rounded-full blur-3xl opacity-20" />
        <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-accent rounded-full blur-3xl opacity-20" />
        {/* Dot grid pattern */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative max-w-4xl mx-auto px-4 pt-16 sm:pt-20 pb-12 sm:pb-16">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-accent">About Us</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
            About Moolah IQ
          </h1>
          <p className="text-lg sm:text-xl font-medium text-white/70 max-w-2xl leading-relaxed">
            Helping you grow, protect, and optimize your money through clear, research-backed personal finance and market education&mdash;without the hype.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-4 py-14 sm:py-16">
        <div className="relative rounded-3xl bg-gradient-to-br from-primary/[0.04] via-white to-accent/[0.08] border border-gray-200/80 p-8 sm:p-12 shadow-md">
          <div className="absolute -top-4 left-8 sm:left-12">
            <div className="inline-flex items-center gap-2 bg-white px-5 py-1.5 rounded-full border border-gray-200 shadow-md">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-accent">Our Mission</h2>
            </div>
          </div>
          <div className="mt-4 space-y-5">
            <p className="text-slate-700 text-lg sm:text-xl font-medium leading-relaxed">
              <strong className="text-primary font-extrabold">Moolah IQ</strong> helps you understand your money and make informed decisions. Our main focus is{" "}
              <strong className="text-primary font-extrabold">trading and investing</strong>, supported by practical education on protecting your family and assets and making your finances work more efficiently.
            </p>
            <p className="text-slate-700 text-lg sm:text-xl font-medium leading-relaxed">
              Through chart walkthroughs, research-backed explanations, and honest breakdowns of strategies and risk, we make complex topics easier to understand.
            </p>
            <p className="text-primary text-base sm:text-lg font-extrabold tracking-tight">
              Human-directed. Clarity over hype. Insight over noise.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      </div>

      {/* Our Three Pillars — GROW first and emphasized (primary focus) */}
      <section className="max-w-5xl mx-auto px-4 py-14 sm:py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/[0.06] border border-primary/10 rounded-full px-4 py-1.5 mb-5">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Our Foundation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-primary mb-4 tracking-tight">Our Three Pillars</h2>
          <p className="text-slate-800 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
            Trading and investing are our primary focus, supported by practical ways to protect what matters and optimize your finances.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pillars.map((pillar, i) => {
            const c = CATEGORY[pillar.theme];
            const num = String(i + 1).padStart(2, "0");
            return (
            <div
              key={pillar.name}
              className={`group relative overflow-hidden rounded-2xl bg-[#fffdf8] border pt-[26px] px-6 pb-6 transition-[transform,box-shadow] duration-[180ms] ease-out hover:-translate-y-1.5 hover:shadow-[0_24px_46px_-22px_rgba(15,43,82,0.42)] ${
                pillar.primary
                  ? "border-transparent shadow-[0_16px_36px_-20px_rgba(15,43,82,0.5)]"
                  : "border-[#ebe5d8] shadow-[0_10px_30px_-22px_rgba(15,43,82,0.4)]"
              }`}
              style={pillar.primary ? { boxShadow: `0 0 0 2px ${c.gradFrom}, 0 16px 36px -20px rgba(15,43,82,0.5)` } : undefined}
            >
              {/* Top accent bar — 90° gradient in the pillar's two brand colours (thicker on the primary pillar) */}
              <span
                aria-hidden
                className={`absolute top-0 left-0 w-full ${pillar.primary ? "h-1.5" : "h-1"}`}
                style={{ background: `linear-gradient(90deg, ${c.gradFrom}, ${c.gradTo})` }}
              />
              {/* Ghosted index numeral — Playfair (site serif), pillar colour at ~15% */}
              <span
                aria-hidden
                className="absolute top-4 right-5 font-extrabold text-[44px] leading-none"
                style={{ fontFamily: "var(--font-playfair)", color: `${c.gradFrom}26` }}
              >
                {num}
              </span>
              {/* Icon tile — 150° gradient, white icon */}
              <div
                className="w-[46px] h-[46px] rounded-xl flex items-center justify-center mb-[18px]"
                style={{
                  background: categoryGradient(pillar.theme),
                  boxShadow: `0 8px 16px -8px ${c.gradTo}99`,
                }}
              >
                <svg className="w-[23px] h-[23px] text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={pillar.icon} />
                </svg>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-[9px]">
                <h3
                  className={`font-extrabold uppercase tracking-[0.09em] ${pillar.primary ? "text-[15px]" : "text-[13px]"}`}
                  style={{ color: c.text }}
                >
                  {pillar.name}
                </h3>
                {pillar.primary && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 text-white"
                    style={{ background: categoryGradient(pillar.theme) }}
                  >
                    Primary focus
                  </span>
                )}
              </div>
              <p className="text-[14px] leading-[1.55] text-[#5e6675]">{pillar.description}</p>
            </div>
            );
          })}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      </div>

      {/* Our Approach */}
      <section className="max-w-4xl mx-auto px-4 py-14 sm:py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-accent/[0.08] border border-accent/10 rounded-full px-4 py-1.5 mb-5">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">How We Work</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-primary mb-4 tracking-tight">Our Approach</h2>
          <p className="text-slate-800 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
            At Moolah IQ, we cut through the noise with three guiding principles:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Clarity */}
          <div className="group relative rounded-2xl bg-white border border-gray-200/80 p-8 text-center shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-amber-300">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gold flex items-center justify-center mx-auto mb-5 ring-1 ring-amber-400/60 transition-transform duration-300 group-hover:scale-110">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-primary mb-3">Clarity</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                We translate &ldquo;finance-speak&rdquo; into plain English. No jargon enters our content without a clear explanation.
              </p>
            </div>
          </div>

          {/* Actionability */}
          <div className="group relative rounded-2xl bg-white border border-gray-200/80 p-8 text-center shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-emerald-300">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-5 ring-1 ring-emerald-400/60 transition-transform duration-300 group-hover:scale-110">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-primary mb-3">Actionability</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Theory is useless without execution. Every piece of content includes concrete steps you can take today.
              </p>
            </div>
          </div>

          {/* Honesty */}
          <div className="group relative rounded-2xl bg-white border border-gray-200/80 p-8 text-center shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-300">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-5 ring-1 ring-blue-400/60 transition-transform duration-300 group-hover:scale-110">
                <svg className="w-7 h-7 text-gold-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-primary mb-3">Honesty</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                We prioritize transparency over trends. We share what actually works, what&apos;s a trap, and the &ldquo;why&rdquo; behind every strategy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-10 sm:pb-12 pt-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/[0.06] via-white to-accent/[0.10] rounded-3xl border border-gray-200/80 p-8 sm:p-12 text-center shadow-md">
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary mb-3 tracking-tight">
              Join the Moolah IQ Community
            </h2>
            <p className="text-slate-800 font-medium mb-8 max-w-lg mx-auto text-lg leading-relaxed">
              Subscribe to the Sunday Seed and get money intelligence delivered to your inbox every Sunday.
            </p>
            <Newsletter variant="inline" />
          </div>
        </div>
      </section>

      {/* Closing line + disclaimer */}
      <section className="max-w-4xl mx-auto px-4 pb-16 sm:pb-20 text-center">
        <p className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight mb-6">
          Keep raising your financial IQ.
        </p>
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl mx-auto">
          Educational content only. Not financial, investment, insurance, tax, or legal advice. Trading and investing involve risk,
          including loss of principal. Past performance does not guarantee future results.
        </p>
      </section>
    </div>
  );
}
