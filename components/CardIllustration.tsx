interface Props {
  slug: string;
  category: string;
}

function SavingsIllustration() {
  return (
    <svg viewBox="0 0 320 200" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="s-card" x1="0" y1="0" x2="320" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" stopOpacity="0.15" />
          <stop offset="1" stopColor="#059669" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="s-bar" x1="0" y1="180" x2="0" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" stopOpacity="0.6" />
          <stop offset="1" stopColor="#34D399" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="s-coin" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#FFD700" />
          <stop offset="1" stopColor="#D4AF37" />
        </linearGradient>
      </defs>
      {/* Glass card */}
      <rect x="30" y="25" width="180" height="120" rx="16" fill="url(#s-card)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <rect x="30" y="25" width="180" height="45" rx="16" fill="rgba(255,255,255,0.06)" />
      {/* APY text */}
      <text x="50" y="55" fill="rgba(255,255,255,0.9)" fontSize="18" fontWeight="800" fontFamily="system-ui">4.50%</text>
      <text x="118" y="55" fill="rgba(255,255,255,0.4)" fontSize="11" fontWeight="600" fontFamily="system-ui">APY</text>
      {/* Growth bars */}
      <rect x="50" y="100" width="18" height="30" rx="4" fill="url(#s-bar)" opacity="0.5" />
      <rect x="78" y="88" width="18" height="42" rx="4" fill="url(#s-bar)" opacity="0.6" />
      <rect x="106" y="78" width="18" height="52" rx="4" fill="url(#s-bar)" opacity="0.7" />
      <rect x="134" y="65" width="18" height="65" rx="4" fill="url(#s-bar)" opacity="0.85" />
      <rect x="162" y="50" width="18" height="80" rx="4" fill="url(#s-bar)" />
      {/* Trend line */}
      <path d="M59 98 L87 86 L115 76 L143 63 L171 48" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="171" cy="48" r="4" fill="#34D399" stroke="white" strokeWidth="1.5" />
      {/* 3D Coin stack — right side */}
      {/* Bottom coin */}
      <ellipse cx="255" cy="148" rx="40" ry="12" fill="rgba(184,150,12,0.3)" />
      <ellipse cx="255" cy="145" rx="40" ry="12" fill="url(#s-coin)" opacity="0.25" stroke="rgba(212,175,55,0.4)" strokeWidth="1.5" />
      {/* Middle coin */}
      <ellipse cx="255" cy="128" rx="40" ry="12" fill="rgba(184,150,12,0.3)" />
      <rect x="215" y="125" width="80" height="20" fill="rgba(184,150,12,0.15)" />
      <ellipse cx="255" cy="125" rx="40" ry="12" fill="url(#s-coin)" opacity="0.35" stroke="rgba(212,175,55,0.5)" strokeWidth="1.5" />
      {/* Top coin */}
      <ellipse cx="255" cy="108" rx="40" ry="12" fill="rgba(184,150,12,0.3)" />
      <rect x="215" y="105" width="80" height="20" fill="rgba(184,150,12,0.2)" />
      <ellipse cx="255" cy="105" rx="40" ry="12" fill="url(#s-coin)" opacity="0.5" stroke="rgba(255,215,0,0.6)" strokeWidth="1.5" />
      <text x="255" y="110" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="12" fontWeight="800" fontFamily="system-ui">$</text>
      {/* Arrow up */}
      <path d="M255 85 L255 60" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
      <path d="M249 66 L255 58 L261 66" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Sparkle */}
      <circle cx="280" cy="55" r="2" fill="rgba(255,215,0,0.6)" />
      <circle cx="225" cy="80" r="1.5" fill="rgba(52,211,153,0.5)" />
    </svg>
  );
}

function InvestingIllustration() {
  return (
    <svg viewBox="0 0 320 200" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="i-area" x1="160" y1="30" x2="160" y2="170" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" stopOpacity="0.4" />
          <stop offset="1" stopColor="#6366F1" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="i-line" x1="0" y1="0" x2="320" y2="0">
          <stop stopColor="#818CF8" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      {/* Glass panel */}
      <rect x="20" y="20" width="200" height="140" rx="16" fill="rgba(99,102,241,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <rect x="20" y="20" width="200" height="40" rx="16" fill="rgba(255,255,255,0.05)" />
      {/* Portfolio label */}
      <text x="40" y="48" fill="rgba(255,255,255,0.85)" fontSize="13" fontWeight="700" fontFamily="system-ui">Portfolio Value</text>
      <text x="40" y="72" fill="rgba(129,140,248,1)" fontSize="22" fontWeight="800" fontFamily="system-ui">$52,841</text>
      <text x="155" y="72" fill="rgba(52,211,153,0.9)" fontSize="11" fontWeight="700" fontFamily="system-ui">+18.4%</text>
      {/* Chart area */}
      <path d="M35 150 L35 130 L65 125 L95 128 L120 108 L150 95 L175 78 L200 65 L200 150 Z" fill="url(#i-area)" />
      <path d="M35 130 L65 125 L95 128 L120 108 L150 95 L175 78 L200 65" stroke="url(#i-line)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M35 130 L65 125 L95 128 L120 108 L150 95 L175 78 L200 65" stroke="rgba(165,180,252,0.4)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Data points */}
      <circle cx="120" cy="108" r="3.5" fill="#6366F1" stroke="white" strokeWidth="1.5" />
      <circle cx="175" cy="78" r="3.5" fill="#6366F1" stroke="white" strokeWidth="1.5" />
      <circle cx="200" cy="65" r="5" fill="#818CF8" stroke="white" strokeWidth="2" />
      {/* Bull icon — right side, 3D glass circle */}
      <circle cx="268" cy="90" r="48" fill="rgba(99,102,241,0.12)" stroke="rgba(129,140,248,0.3)" strokeWidth="2" />
      <circle cx="268" cy="90" r="38" fill="rgba(99,102,241,0.08)" stroke="rgba(129,140,248,0.15)" strokeWidth="1" />
      {/* Glass shine */}
      <path d="M235 65 Q268 50 301 65 Q268 55 235 65" fill="rgba(255,255,255,0.08)" />
      {/* Bull arrow */}
      <path d="M248 110 L268 72 L288 110" stroke="rgba(129,140,248,0.8)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M248 110 L268 72 L288 110" fill="rgba(99,102,241,0.15)" />
      {/* Horns */}
      <path d="M258 82 L248 65" stroke="rgba(129,140,248,0.7)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M278 82 L288 65" stroke="rgba(129,140,248,0.7)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Arrow up from bull */}
      <path d="M268 56 L268 40" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
      <path d="M262 46 L268 38 L274 46" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Sparkles */}
      <circle cx="300" cy="50" r="2" fill="rgba(129,140,248,0.5)" />
      <circle cx="240" cy="140" r="1.5" fill="rgba(99,102,241,0.4)" />
    </svg>
  );
}

function BudgetingIllustration() {
  return (
    <svg viewBox="0 0 320 200" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="b-piggy" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#F59E0B" stopOpacity="0.5" />
          <stop offset="1" stopColor="#D97706" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="b-coin" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#FFD700" />
          <stop offset="1" stopColor="#D4AF37" />
        </linearGradient>
      </defs>
      {/* Budget tracker glass card */}
      <rect x="20" y="25" width="170" height="150" rx="16" fill="rgba(245,158,11,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <rect x="20" y="25" width="170" height="38" rx="16" fill="rgba(255,255,255,0.05)" />
      <text x="40" y="51" fill="rgba(255,255,255,0.85)" fontSize="13" fontWeight="700" fontFamily="system-ui">Monthly Budget</text>
      {/* Budget rows */}
      {/* Needs */}
      <text x="36" y="82" fill="rgba(255,255,255,0.5)" fontSize="10" fontWeight="600" fontFamily="system-ui">Needs 50%</text>
      <rect x="36" y="87" width="138" height="6" rx="3" fill="rgba(255,255,255,0.08)" />
      <rect x="36" y="87" width="96" height="6" rx="3" fill="rgba(245,158,11,0.7)" />
      {/* Wants */}
      <text x="36" y="108" fill="rgba(255,255,255,0.5)" fontSize="10" fontWeight="600" fontFamily="system-ui">Wants 30%</text>
      <rect x="36" y="113" width="138" height="6" rx="3" fill="rgba(255,255,255,0.08)" />
      <rect x="36" y="113" width="62" height="6" rx="3" fill="rgba(251,191,36,0.7)" />
      {/* Savings */}
      <text x="36" y="134" fill="rgba(255,255,255,0.5)" fontSize="10" fontWeight="600" fontFamily="system-ui">Save 20%</text>
      <rect x="36" y="139" width="138" height="6" rx="3" fill="rgba(255,255,255,0.08)" />
      <rect x="36" y="139" width="110" height="6" rx="3" fill="rgba(52,211,153,0.7)" />
      {/* Checkmark */}
      <circle cx="160" y="139" r="7" fill="rgba(52,211,153,0.3)" />
      <path d="M156 139 L159 142 L165 136" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Remaining */}
      <text x="36" y="163" fill="rgba(52,211,153,0.8)" fontSize="11" fontWeight="700" fontFamily="system-ui">$480 left to save</text>
      {/* 3D Piggy bank — right side */}
      {/* Body */}
      <ellipse cx="260" cy="110" rx="52" ry="44" fill="url(#b-piggy)" stroke="rgba(245,158,11,0.4)" strokeWidth="2" />
      {/* Glass shine on body */}
      <ellipse cx="248" cy="92" rx="28" ry="16" fill="rgba(255,255,255,0.08)" />
      {/* Snout */}
      <ellipse cx="302" cy="112" rx="14" ry="10" fill="rgba(245,158,11,0.35)" stroke="rgba(245,158,11,0.3)" strokeWidth="1.5" />
      <circle cx="299" cy="110" r="2" fill="rgba(255,255,255,0.3)" />
      <circle cx="306" cy="110" r="2" fill="rgba(255,255,255,0.3)" />
      {/* Eye */}
      <circle cx="285" cy="96" r="3.5" fill="rgba(255,255,255,0.4)" />
      <circle cx="286" cy="96" r="1.5" fill="rgba(217,119,6,0.8)" />
      {/* Ear */}
      <ellipse cx="270" cy="72" rx="10" ry="14" fill="rgba(245,158,11,0.35)" stroke="rgba(245,158,11,0.3)" strokeWidth="1" transform="rotate(-15 270 72)" />
      {/* Legs */}
      <rect x="235" y="145" width="10" height="16" rx="4" fill="rgba(245,158,11,0.3)" />
      <rect x="255" y="145" width="10" height="16" rx="4" fill="rgba(245,158,11,0.3)" />
      <rect x="270" y="145" width="10" height="14" rx="4" fill="rgba(245,158,11,0.25)" />
      {/* Coin slot */}
      <rect x="252" y="68" width="20" height="4" rx="2" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      {/* Coin dropping in */}
      <circle cx="262" cy="52" r="10" fill="url(#b-coin)" opacity="0.5" stroke="rgba(255,215,0,0.6)" strokeWidth="1.5" />
      <text x="262" y="56" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="10" fontWeight="800" fontFamily="system-ui">$</text>
      {/* Motion lines on coin */}
      <line x1="250" y1="42" x2="250" y2="36" stroke="rgba(255,215,0,0.3)" strokeWidth="1" strokeLinecap="round" />
      <line x1="274" y1="42" x2="274" y2="36" stroke="rgba(255,215,0,0.3)" strokeWidth="1" strokeLinecap="round" />
      {/* Tail */}
      <path d="M210 100 Q200 85 210 75 Q215 82 208 90" stroke="rgba(245,158,11,0.4)" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function DefaultIllustration({ category }: { category: string }) {
  return (
    <svg viewBox="0 0 320 200" fill="none" className="w-full h-full">
      <circle cx="160" cy="100" r="50" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <circle cx="160" cy="100" r="35" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <text x="160" y="108" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="28" fontWeight="800" fontFamily="system-ui">
        {category.charAt(0)}
      </text>
    </svg>
  );
}

const slugIllustrations: Record<string, () => JSX.Element> = {
  "best-high-yield-savings-accounts-2026": SavingsIllustration,
  "investing-101": InvestingIllustration,
  "getting-started-with-budgeting": BudgetingIllustration,
};

export default function CardIllustration({ slug, category }: Props) {
  const Illustration = slugIllustrations[slug];

  if (Illustration) {
    return <Illustration />;
  }

  return <DefaultIllustration category={category} />;
}
