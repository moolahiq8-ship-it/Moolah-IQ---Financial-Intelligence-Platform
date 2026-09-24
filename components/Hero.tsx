// Homepage hero (2026-09-23): headline, introduction and the two calls to action in one
// spacious column. The former "Learning levels" panel (numeric scores, meters, note) and
// the "Every guide rated by complexity" badge were removed at Richard's direction.

export default function Hero() {
  return (
    <section className="bg-light-bg">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-14 pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
        <div className="max-w-[880px]">
          {/* H1 — Playfair 800, lh 1.05, ls -0.015em */}
          <h1
            className="text-4xl/[1.05] md:text-6xl/[1.05] lg:text-[72px]/[1.05] font-extrabold text-primary tracking-[-0.015em] mb-7"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Grow, protect, and optimize your{" "}
            <em className="text-accent italic">money</em>.
          </h1>

          {/* Subcopy — Inter 18-20px/1.65 slate-600, max ~56ch */}
          <p className="text-lg lg:text-xl leading-[1.65] text-slate-600 max-w-[56ch] mb-10">
            Clear, research-backed education on trading and investing,
            protecting what matters, and making your finances work more
            efficiently&mdash;without the hype.
          </p>

          {/* CTAs — primary: bg accent, white 16px/700, 15px 30px, hover primary */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <a
              href="#quiz"
              className="inline-block text-center bg-accent hover:bg-primary text-white font-bold text-base px-[30px] py-[15px] rounded-xl transition-colors"
            >
              Find your starting point
            </a>
            <a
              href="#tool"
              className="inline-flex items-center justify-center gap-1.5 text-accent hover:text-primary font-semibold text-base transition-colors"
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
