import Newsletter from "@/components/Newsletter";

const SAMPLE_ITEMS = [
  "Vetting online income offers — the 10-minute check",
  "Where high-yield savings rates stand this month",
  "One number to watch this week",
];

export default function IntelligenceBrief() {
  return (
    <section id="newsletter" className="bg-light-bg scroll-mt-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-14 py-16 lg:py-20">
        {/* Spec: white card, border #E2E8F0, radius 24px, padding 56px, 2-col gap 64px */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left — pitch + form */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gold-dark mb-3">
              The Sunday Seed
            </p>
            <h2
              className="text-3xl md:text-[36px]/[1.2] font-extrabold text-primary mb-4"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              One seed. Every Sunday. Five minutes.
            </h2>
            <p className="text-base leading-relaxed text-slate-600 mb-8">
              Each issue: one scored guide, one rate or rule change worth
              knowing, and one number to watch. No sponsors in the copy,
              unsubscribe in one click.
            </p>
            <Newsletter variant="brief" />
          </div>

          {/* Right — sample card */}
          <div className="bg-light-bg border border-slate-200 rounded-2xl p-7">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-5">
              What&apos;s in the Seed
            </p>
            <ul className="space-y-4">
              {SAMPLE_ITEMS.map((item, i) => (
                <li key={item} className="flex items-baseline gap-3">
                  <span className="text-[13px] font-bold text-gold flex-shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] font-semibold text-dark-text leading-snug">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
