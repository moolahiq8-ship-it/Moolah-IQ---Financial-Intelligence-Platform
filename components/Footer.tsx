import Link from "next/link";
import {
  SiYoutube,
  SiFacebook,
  SiInstagram,
  SiTiktok,
  SiPinterest,
} from "react-icons/si";
import { SOCIAL_LINKS } from "@/lib/social";

// Map each SOCIAL_LINKS label to its Simple Icons brand glyph.
const SOCIAL_ICONS = {
  YouTube: SiYoutube,
  Facebook: SiFacebook,
  Instagram: SiInstagram,
  TikTok: SiTiktok,
  Pinterest: SiPinterest,
} as const;

const EXPLORE_LINKS = [
  { label: "Start here", href: "/#start" },
  { label: "Articles", href: "/blog" },
  { label: "Tools", href: "/tools" },
  { label: "Videos", href: "/#videos" },
  { label: "About", href: "/about" },
];

const DISCIPLINE_LINKS = [
  { label: "Earn", href: "/category/earn" },
  { label: "Spend", href: "/category/spend" },
  { label: "Save", href: "/category/save" },
  { label: "Invest", href: "/category/invest" },
  { label: "Optimize", href: "/category/optimize" },
  { label: "Protect", href: "/category/protect" },
  { label: "Milestones", href: "/category/milestones" },
  { label: "Legacy", href: "/category/legacy" },
];

const LEGAL_LINKS = [
  { label: "Disclaimer", href: "/legal/disclaimer" },
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Terms of Service", href: "/legal/terms" },
];

export default function Footer() {
  return (
    <footer className="bg-[#0f2847] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* 6-col only at lg — at md the side columns squeeze to ~84px and
            legal links wrap badly; tablet gets a 2-col arrangement instead */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            {/* Same lockup as the header, adapted for navy: Playfair 800
                'Moolah' in white (light-bg), IQ chip on a translucent
                backing so the header's navy chip doesn't vanish here */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 mb-4"
              aria-label="Moolah IQ — home"
            >
              <span
                className="text-2xl font-extrabold text-light-bg tracking-tight leading-none"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Moolah
              </span>
              <span className="bg-white/10 border border-white/[0.18] text-gold-light text-sm font-bold px-[9px] py-[3px] rounded-[5px] leading-none">
                IQ
              </span>
            </Link>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm">
              Level up your financial intelligence. Data-backed strategies to
              build wealth, budget smarter, and invest with confidence.
            </p>
            {/* Social row — same link convention as the footer columns */}
            <div className="flex items-center gap-4 mt-6">
              {SOCIAL_LINKS.map(({ label, href }) => {
                const Icon = SOCIAL_ICONS[label];
                return (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Moolah IQ on ${label}`}
                    className="text-light-bg hover:text-gold transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold mb-4">
              Explore
            </h4>
            <ul className="space-y-3 text-sm">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Disciplines */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold mb-4">
              Disciplines
            </h4>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {DISCIPLINE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold mb-4">
              Legal
            </h4>
            <ul className="space-y-3 text-sm">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/50">
            &copy; {new Date().getFullYear()} Moolah IQ. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-xs text-white/50">
            <Link href="/legal/disclaimer" className="hover:text-white/60 transition-colors">Disclaimer</Link>
            <span>|</span>
            <Link href="/legal/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
            <span>|</span>
            <Link href="/legal/terms" className="hover:text-white/60 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
