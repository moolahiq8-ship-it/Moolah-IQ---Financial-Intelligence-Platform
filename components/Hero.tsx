const IQ_TIERS = [
  {
    score: 95,
    name: "Foundations",
    description: "First budget, emergency fund, debt basics",
    // Deepened fill: real mint #A7F3D0 (emerald-200); score darkened to
    // emerald-800 for AA contrast on the deeper fill
    row: "bg-emerald-200",
    scoreColor: "text-emerald-800",
    nameColor: "text-dark-text",
    descColor: "text-slate-600",
    track: "bg-emerald-100",
    fill: "bg-accent",
    fillWidth: "w-[33%]",
  },
  {
    score: 110,
    name: "Strategy",
    description: "Index investing, tax basics, rate shopping",
    // Deepened fill: real warm gold #F0DFA0; score darkened to yellow-800
    // for AA contrast on the deeper fill
    row: "bg-[#F0DFA0]",
    scoreColor: "text-yellow-800",
    nameColor: "text-dark-text",
    descColor: "text-slate-600",
    track: "bg-[#F3E9C6]",
    fill: "bg-gold",
    fillWidth: "w-[66%]",
  },
  {
    score: 140,
    name: "Mastery",
    description: "Optimization, protection, legacy planning",
    // Spec: row bg primary, text #F8FAFC (light-bg), score gold-light; meter solid #FFD700 (gold-light)
    row: "bg-primary",
    scoreColor: "text-gold-light",
    nameColor: "text-light-bg",
    descColor: "text-light-bg/70",
    track: "bg-gold-light",
    fill: "bg-gold-light",
    fillWidth: "w-full",
  },
];

const STATS = [
  { headline: "Every guide", detail: "scored by difficulty" },
  { headline: "8", detail: "money disciplines" },
  { headline: "$0", detail: "paywalls, ever" },
];

export default function Hero() {
  return (
    <section className="bg-light-bg">
      {/* Spec: padding 80px 56px 88px, max-width 1360px centered */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-14 pt-16 lg:pt-20 pb-16 lg:pb-[88px]">
        {/* Spec: 2-col grid 1.1fr / 0.9fr, gap 64px */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
          {/* Left — copy */}
          <div>
            {/* Badge pill — 13px/600 primary, border #C7D6EA, bg #EDF3FA, 6px 14px */}
            <span className="inline-block bg-[#EDF3FA] border border-[#C7D6EA] text-primary text-[13px] font-semibold px-3.5 py-1.5 rounded-full mb-6">
              Personal finance, rated by difficulty
            </span>

            {/* H1 — Playfair 800 66px, lh 1.05, ls -0.015em */}
            <h1
              className="text-4xl/[1.05] md:text-5xl/[1.05] lg:text-[66px]/[1.05] font-extrabold text-primary tracking-[-0.015em] mb-6"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Make smarter <em className="text-accent italic">money</em>{" "}
              decisions.
            </h1>

            {/* Subcopy — Inter 18px/1.65 #475569 (slate-600), max 52ch */}
            <p className="text-lg leading-[1.65] text-slate-600 max-w-[52ch] mb-8">
              Every guide and tool carries a Money IQ score — from 95 (first
              budget) to 140 (estate strategy). Take the 60-second quiz below
              to find your starting point.
            </p>

            {/* CTAs — primary: bg accent, white 16px/700, 15px 30px, hover primary */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-10">
              <a
                href="#quiz"
                className="inline-block text-center bg-accent hover:bg-primary text-white font-bold text-base px-[30px] py-[15px] rounded-xl transition-colors"
              >
                Take the Money IQ quiz
              </a>
              <a
                href="#tool"
                className="inline-flex items-center justify-center gap-1.5 text-accent hover:text-primary font-semibold text-base transition-colors"
              >
                Try the Crossover Calculator
                <span aria-hidden="true">→</span>
              </a>
            </div>

            {/* Stat row — top border #E2E8F0, pt 22px, gap 36px.
                Deliberate 3-across grid at every width (no accidental
                wrapping); numbers/labels step down on narrow phones. */}
            <dl className="grid grid-cols-3 gap-4 sm:gap-9 border-t border-slate-200 pt-[22px]">
              {STATS.map((stat) => (
                <div key={stat.detail}>
                  <dt className="sr-only">{stat.detail}</dt>
                  <dd>
                    {/* numbers 22px/700 primary; labels 13px #64748B (slate-500) */}
                    <span className="block text-lg sm:text-[22px] font-bold text-primary leading-tight">
                      {stat.headline}
                    </span>
                    <span className="block text-xs sm:text-[13px] text-slate-500 mt-1">
                      {stat.detail}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Right — THE IQ SCALE card */}
          {/* Spec: white, border #E2E8F0, radius 20px, padding 30px,
              shadow 0 24px 48px -32px rgba(26,60,110,0.4) */}
          <div className="lg:justify-self-end w-full max-w-md">
            <div className="bg-white border border-slate-200 rounded-[20px] p-[30px] shadow-[0_24px_48px_-32px_rgba(26,60,110,0.4)]">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-5">
                The IQ Scale
              </p>

              {/* Tier rows — grid 56px / 1fr / auto, gap 16px, padding 14px 16px, radius 12px */}
              <ul className="space-y-3">
                {IQ_TIERS.map((tier) => (
                  <li
                    key={tier.name}
                    className={`grid grid-cols-[56px_1fr_auto] items-center gap-4 px-4 py-3.5 rounded-xl ${tier.row}`}
                  >
                    <span className={`text-lg font-extrabold ${tier.scoreColor}`}>
                      {tier.score}
                    </span>
                    <div>
                      <p className={`text-[15px] font-bold ${tier.nameColor}`}>
                        {tier.name}
                      </p>
                      <p className={`text-[13px] leading-snug ${tier.descColor}`}>
                        {tier.description}
                      </p>
                    </div>
                    {/* Meter — 40 × 6px pill */}
                    <span
                      className={`block w-10 h-1.5 rounded-full overflow-hidden ${tier.track}`}
                    >
                      <span
                        className={`block h-full rounded-full ${tier.fill} ${tier.fillWidth}`}
                      />
                    </span>
                  </li>
                ))}
              </ul>

              <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-200 mt-5 pt-4">
                Scores measure the topic&apos;s complexity — never the
                reader&apos;s. Everyone starts at Foundations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
