import type { HeroStat } from "@/lib/blog/types";
import { HERO_PANEL_GRADIENT } from "@/lib/blog/theme";

/**
 * HeroChart — the featured hero stat-panel area chart (Handoff Spec §2.4).
 * Renders from heroStat.series: maps each value across x=20..410 and
 * y inverted into 40..160, then draws the polyline + closed area to y=170.
 */
export function HeroChart({ series }: { series: number[] }) {
  const X0 = 20;
  const X1 = 410;
  const Y_TOP = 40;
  const Y_BOTTOM = 160;
  const BASELINE = 170;

  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;

  const pts = series.map((v, i) => {
    const x = X0 + (i / (series.length - 1)) * (X1 - X0);
    const y = Y_BOTTOM - ((v - min) / span) * (Y_BOTTOM - Y_TOP);
    return [Math.round(x), Math.round(y)] as const;
  });

  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area =
    `M${pts[0][0]} ${pts[0][1]} ` +
    pts.slice(1).map(([x, y]) => `L${x} ${y}`).join(" ") +
    ` L${X1} ${BASELINE} L${X0} ${BASELINE} Z`;

  const end = pts[pts.length - 1];
  const mid = pts[Math.floor(pts.length / 2)];

  return (
    <svg viewBox="0 0 420 200" width="100%">
      <defs>
        <linearGradient id="hf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(226,172,71,0.35)" />
          <stop offset="1" stopColor="rgba(226,172,71,0)" />
        </linearGradient>
      </defs>
      <line x1={X0} y1={BASELINE} x2={X1} y2={BASELINE} stroke="rgba(255,255,255,0.14)" strokeWidth={1.5} />
      <path d={area} fill="url(#hf)" />
      <polyline
        points={line}
        fill="none"
        stroke="#e2ac47"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={end[0]} cy={end[1]} r={6} fill="#e2ac47" />
      <circle cx={mid[0]} cy={mid[1]} r={4.5} fill="#fff" />
    </svg>
  );
}

export function HeroStatPanel({ stat }: { stat: HeroStat }) {
  return (
    <div className="flex flex-col justify-center p-[46px]" style={{ background: HERO_PANEL_GRADIENT }}>
      <div className="mb-1.5 text-[12.5px] font-bold tracking-[0.1em] text-[#e2ac47]/90">{stat.label}</div>
      <div className="mb-5 font-blog-serif text-[44px] font-bold leading-none text-white">
        {stat.value}
        {stat.unit && <span className="font-blog-sans text-[16px] font-bold text-[#7fe3b1]"> {stat.unit}</span>}
      </div>
      <HeroChart series={stat.series} />
    </div>
  );
}
