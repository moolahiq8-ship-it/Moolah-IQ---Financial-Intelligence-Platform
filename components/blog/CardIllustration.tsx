import type { Illustration } from "@/lib/blog/types";

/**
 * CardIllustration — the six per-post illustration variants (Handoff Spec §3.4).
 * The gradient background is applied by the parent panel (see ArticleCard).
 * These paint the white/translucent artwork on top.
 * Adapted for scoping: font-serif → font-blog-serif.
 */
export function CardIllustration({ art }: { art: Illustration }) {
  switch (art.variant) {
    case "bars":
      return (
        <svg viewBox="0 0 240 116" width="100%">
          <g fill="rgba(255,255,255,0.24)">
            <rect x="20" y="64" width="26" height="44" rx="4" />
            <rect x="66" y="48" width="26" height="60" rx="4" />
            <rect x="112" y="34" width="26" height="74" rx="4" />
            <rect x="158" y="22" width="26" height="86" rx="4" />
            <rect x="204" y="10" width="26" height="98" rx="4" />
          </g>
          <g fill="#fff">
            <rect x="20" y="64" width="26" height="7" rx="3.5" />
            <rect x="66" y="48" width="26" height="7" rx="3.5" />
            <rect x="112" y="34" width="26" height="7" rx="3.5" />
            <rect x="158" y="22" width="26" height="7" rx="3.5" />
            <rect x="204" y="10" width="26" height="7" rx="3.5" />
          </g>
        </svg>
      );

    case "line-area":
      return (
        <svg viewBox="0 0 240 116" width="100%">
          <defs>
            <linearGradient id="c2f" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(255,255,255,0.28)" />
              <stop offset="1" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          <path d="M16 96 L60 78 L104 84 L148 46 L192 34 L228 12 L228 108 L16 108 Z" fill="url(#c2f)" />
          <polyline
            points="16,96 60,78 104,84 148,46 192,34 228,12"
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="228" cy="12" r="6" fill="#fff" />
        </svg>
      );

    case "check":
      return (
        <svg viewBox="0 0 200 120" width="66%">
          <g stroke="rgba(255,255,255,0.9)" strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="100" cy="54" r="42" stroke="rgba(255,255,255,0.45)" />
            <polyline points="80,54 95,70 122,40" />
          </g>
          <g fill="rgba(255,255,255,0.7)">
            <rect x="46" y="108" width="46" height="6" rx="3" />
            <rect x="108" y="108" width="46" height="6" rx="3" />
          </g>
        </svg>
      );

    case "apy":
      return (
        <>
          <div className="text-white">
            <span className="font-blog-serif font-bold text-[32px]">{art.apyValue}</span>{" "}
            <span className="text-[12px] font-bold tracking-[0.08em] text-white/65">APY</span>
          </div>
          <svg viewBox="0 0 240 66" width="100%">
            <g fill="rgba(127,227,177,0.5)">
              <rect x="16" y="40" width="26" height="24" rx="3" />
              <rect x="58" y="30" width="26" height="34" rx="3" />
              <rect x="100" y="20" width="26" height="44" rx="3" />
              <rect x="142" y="10" width="26" height="54" rx="3" />
            </g>
            <circle cx="206" cy="34" r="21" fill="#e2ac47" />
            <text x="206" y="41" textAnchor="middle" fill="#14264B" fontSize="19" fontWeight="800">
              $
            </text>
          </svg>
        </>
      );

    case "portfolio":
      return (
        <>
          <div className="text-white">
            <div className="text-[11.5px] font-semibold text-white/75">Portfolio Value</div>
            <div className="font-blog-serif font-bold text-[27px]">
              {art.portfolioValue}{" "}
              <span className="text-[12.5px] font-bold text-[#a7e6c8]">{art.portfolioDelta}</span>
            </div>
          </div>
          <svg viewBox="0 0 240 56" width="100%">
            <polyline
              points="14,48 54,38 94,42 134,22 178,18 226,6"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="226" cy="6" r="5.5" fill="#fff" />
          </svg>
        </>
      );

    case "budget":
      return (
        <>
          <div className="font-blog-serif font-bold text-[16px] text-white mb-3">Monthly Budget</div>
          <div className="flex flex-col gap-[9px]">
            {(art.budget ?? []).map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-[11px] font-bold text-white/90 mb-[3px]">
                  <span>{row.label}</span>
                  <span>{row.pct}%</span>
                </div>
                <div className="h-1.5 rounded-[3px] bg-white/[0.28]">
                  <div className="h-full rounded-[3px] bg-white" style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </>
      );

    default:
      return null;
  }
}

/** Panel flex alignment differs per variant (Spec §3.4). */
export function panelClassFor(variant: Illustration["variant"]): string {
  switch (variant) {
    case "bars":
      return "flex items-end";
    case "line-area":
      return "flex items-end";
    case "check":
      return "flex items-center justify-center";
    case "apy":
    case "portfolio":
      return "flex flex-col justify-between";
    case "budget":
      return "flex flex-col justify-center";
    default:
      return "flex";
  }
}
