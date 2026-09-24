// Homepage hero (2026-09-23): headline, introduction and the two calls to action in one
// centered column. The former "Learning levels" panel (numeric scores, meters, note) and
// the "Every guide rated by complexity" badge were removed at Richard's direction.

export default function Hero() {
  return (
    <section className="bg-light-bg">
      <div className="max-w-[1360px] mx-auto px-5 sm:px-6 lg:px-14 pt-16 sm:pt-24 lg:pt-32 pb-16 sm:pb-24 lg:pb-32">
        <div className="max-w-[920px] mx-auto text-center">
          {/* H1 — Playfair 800, lh 1.08, ls -0.015em; balanced wrapping keeps lines even */}
          <h1
            className="text-[40px]/[1.08] sm:text-6xl/[1.06] lg:text-[72px]/[1.05] font-extrabold text-primary tracking-[-0.015em] mb-7 text-balance"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Grow, protect, and optimize your{" "}
            <em className="text-accent italic">money</em>.
          </h1>

          {/* Subcopy — Inter 18-20px/1.65 slate-600, narrower than the headline for reading */}
          <p className="text-lg lg:text-xl leading-[1.65] text-slate-600 max-w-[34rem] lg:max-w-[38rem] mx-auto mb-10 text-pretty">
            Clear, research-backed education on trading and investing,
            protecting what matters, and making your finances work more
            efficiently&mdash;without the hype.
          </p>

          {/* CTAs — centered; stacked full-width on mobile, side by side from sm */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-7 max-w-xs sm:max-w-none mx-auto">
            <a
              href="#quiz"
              className="inline-block text-center bg-accent hover:bg-primary text-white font-bold text-base px-[30px] py-[15px] rounded-xl transition-colors"
            >
              Find your starting point
            </a>
            <a
              href="#tool"
              className="inline-flex items-center justify-center gap-1.5 text-accent hover:text-primary font-semibold text-base py-2 transition-colors"
            >
              Try the Crossover Calculator
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
