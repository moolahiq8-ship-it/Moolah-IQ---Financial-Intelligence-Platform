export default function Hero() {
  return (
    <section className="bg-primary pb-32 pt-16 md:pt-20 relative overflow-hidden neural-bg">
      {/* Mesh gradient blobs */}
      <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-gold rounded-full blur-3xl opacity-20" />
      <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-accent rounded-full blur-3xl opacity-20" />
      {/* Dot grid pattern */}
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Left — 3D glassmorphism chart */}
      <div className="hidden lg:block absolute left-6 xl:left-16 top-1/2 -translate-y-1/2">
        <div className="relative w-[286px] h-[286px]">
          {/* Back glass panel */}
          <div
            className="absolute inset-4 rounded-3xl rotate-[-6deg]"
            style={{
              background: "linear-gradient(135deg, rgba(4,120,87,0.15) 0%, rgba(4,120,87,0.05) 100%)",
              border: "1px solid rgba(4,120,87,0.2)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          />
          {/* Middle glass panel */}
          <div
            className="absolute inset-2 rounded-3xl rotate-[-3deg]"
            style={{
              background: "linear-gradient(135deg, rgba(5,150,105,0.18) 0%, rgba(5,150,105,0.06) 100%)",
              border: "1px solid rgba(5,150,105,0.25)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          />
          {/* Front glass card with chart */}
          <div
            className="absolute inset-0 rounded-3xl p-6 flex flex-col justify-end"
            style={{
              background: "linear-gradient(135deg, rgba(5,150,105,0.22) 0%, rgba(4,120,87,0.08) 100%)",
              border: "1px solid rgba(16,185,129,0.3)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 30px 60px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            {/* Glass shine */}
            <div
              className="absolute top-0 left-0 right-0 h-1/3 rounded-t-3xl"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)",
              }}
            />
            {/* Chart SVG */}
            <svg
              viewBox="0 0 260 160"
              fill="none"
              className="w-full h-auto relative z-10"
              shapeRendering="geometricPrecision"
            >
              {/* Grid */}
              <line x1="20" y1="130" x2="240" y2="130" stroke="rgba(16,185,129,0.2)" strokeWidth="1" />
              <line x1="20" y1="95" x2="240" y2="95" stroke="rgba(16,185,129,0.12)" strokeWidth="0.5" strokeDasharray="4 4" />
              <line x1="20" y1="60" x2="240" y2="60" stroke="rgba(16,185,129,0.12)" strokeWidth="0.5" strokeDasharray="4 4" />
              <line x1="20" y1="25" x2="240" y2="25" stroke="rgba(16,185,129,0.12)" strokeWidth="0.5" strokeDasharray="4 4" />
              {/* Area fill */}
              <path d="M20 130 L20 110 L60 95 L100 100 L140 70 L180 48 L220 22 L240 18 L240 130 Z" fill="url(#glass-chart-fill)" />
              {/* Bars */}
              <rect x="30" y="108" width="20" height="22" rx="4" fill="rgba(5,150,105,0.3)" />
              <rect x="70" y="96" width="20" height="34" rx="4" fill="rgba(5,150,105,0.35)" />
              <rect x="110" y="78" width="20" height="52" rx="4" fill="rgba(5,150,105,0.4)" />
              <rect x="150" y="58" width="20" height="72" rx="4" fill="rgba(5,150,105,0.45)" />
              <rect x="190" y="35" width="20" height="95" rx="4" fill="rgba(4,120,87,0.55)" />
              {/* Trend line */}
              <path
                d="M20 110 L60 95 L100 100 L140 70 L180 48 L220 22 L240 18"
                stroke="#047857"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              {/* Glow line */}
              <path
                d="M20 110 L60 95 L100 100 L140 70 L180 48 L220 22 L240 18"
                stroke="#10B981"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.6"
              />
              {/* Data points */}
              <circle cx="60" cy="95" r="4" fill="#059669" stroke="#047857" strokeWidth="1.5" />
              <circle cx="100" cy="100" r="4" fill="#059669" stroke="#047857" strokeWidth="1.5" />
              <circle cx="140" cy="70" r="4.5" fill="#059669" stroke="#047857" strokeWidth="1.5" />
              <circle cx="180" cy="48" r="4" fill="#059669" stroke="#047857" strokeWidth="1.5" />
              <circle cx="240" cy="18" r="5.5" fill="#10B981" stroke="#047857" strokeWidth="2" />
              {/* Arrow */}
              <path d="M232 12 L240 18 L234 25" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <defs>
                <linearGradient id="glass-chart-fill" x1="130" y1="18" x2="130" y2="130" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#059669" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#059669" stopOpacity="0.02" />
                </linearGradient>
              </defs>
            </svg>
            {/* Bottom stats row */}
            <div className="flex justify-between mt-3 relative z-10">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-emerald-300/60 font-medium">+24.8%</span>
              </div>
              <span className="text-[10px] text-emerald-300/40 font-medium">YTD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right — 3D glassmorphism coins */}
      <div className="hidden lg:block absolute -right-4 xl:right-8 top-1/2 -translate-y-1/2">
        <div className="relative w-[374px] h-[374px]">
          {/* Coin 1 — back/large, tilted */}
          <div
            className="absolute w-[150px] h-[150px] rounded-full left-[90px] top-[20px]"
            style={{
              background: "linear-gradient(145deg, rgba(212,175,55,0.2) 0%, rgba(184,150,12,0.06) 100%)",
              border: "2px solid rgba(212,175,55,0.25)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
              transform: "perspective(500px) rotateY(-15deg) rotateX(10deg)",
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[48px] font-extrabold" style={{ color: "rgba(212,175,55,0.5)" }}>$</span>
            </div>
            <div
              className="absolute inset-[8px] rounded-full"
              style={{ border: "1px dashed rgba(212,175,55,0.2)" }}
            />
            {/* Shine */}
            <div
              className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)" }}
            />
          </div>

          {/* Coin 2 — mid, main coin */}
          <div
            className="absolute w-[180px] h-[180px] rounded-full left-[30px] top-[80px]"
            style={{
              background: "linear-gradient(145deg, rgba(212,175,55,0.28) 0%, rgba(184,150,12,0.08) 100%)",
              border: "2.5px solid rgba(212,175,55,0.35)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 30px 60px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.1)",
              transform: "perspective(500px) rotateY(10deg) rotateX(-5deg)",
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[64px] font-extrabold" style={{ color: "rgba(212,175,55,0.6)" }}>$</span>
            </div>
            <div
              className="absolute inset-[12px] rounded-full"
              style={{ border: "1.5px dashed rgba(212,175,55,0.2)" }}
            />
            {/* Shine */}
            <div
              className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)" }}
            />
          </div>

          {/* Coin 3 — front/small */}
          <div
            className="absolute w-[110px] h-[110px] rounded-full left-[175px] top-[190px]"
            style={{
              background: "linear-gradient(145deg, rgba(184,150,12,0.22) 0%, rgba(184,150,12,0.06) 100%)",
              border: "2px solid rgba(184,150,12,0.3)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 15px 35px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
              transform: "perspective(500px) rotateY(-8deg) rotateX(5deg)",
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[36px] font-extrabold" style={{ color: "rgba(184,150,12,0.55)" }}>$</span>
            </div>
            <div
              className="absolute inset-[6px] rounded-full"
              style={{ border: "1px dashed rgba(184,150,12,0.18)" }}
            />
            {/* Shine */}
            <div
              className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)" }}
            />
          </div>

          {/* Sparkle dots */}
          <div className="absolute w-2 h-2 rounded-full top-[60px] left-[60px]" style={{ background: "rgba(255,215,0,0.4)", boxShadow: "0 0 8px rgba(255,215,0,0.3)" }} />
          <div className="absolute w-1.5 h-1.5 rounded-full top-[170px] left-[230px]" style={{ background: "rgba(212,175,55,0.35)", boxShadow: "0 0 6px rgba(212,175,55,0.25)" }} />
          <div className="absolute w-1 h-1 rounded-full top-[280px] left-[140px]" style={{ background: "rgba(255,215,0,0.3)", boxShadow: "0 0 4px rgba(255,215,0,0.2)" }} />

          {/* Rising arrow accent */}
          <svg className="absolute top-[40px] left-[40px] w-[40px] h-[40px]" viewBox="0 0 40 40" fill="none">
            <line x1="8" y1="32" x2="32" y2="8" stroke="rgba(212,175,55,0.4)" strokeWidth="2" strokeLinecap="round" />
            <path d="M24 8 L32 8 L32 16" stroke="rgba(212,175,55,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-white mb-4 leading-[1.1] tracking-tight">
          Make Smarter{" "}
          <span className="text-accent italic" style={{ fontFamily: "var(--font-playfair)", fontSize: "1.12em", fontWeight: 900, letterSpacing: "-0.02em" }}>Money</span>{" "}
          Decisions
        </h1>
        <p className="text-gold font-semibold text-base uppercase tracking-widest mb-8">
          Master the Mechanics of Wealth
        </p>
        <a
          href="/blog"
          className="hero-cta-glow inline-block bg-gold hover:bg-gold-dark text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors"
        >
          Boost My IQ
        </a>
      </div>
    </section>
  );
}
