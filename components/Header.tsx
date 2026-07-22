"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  // "Start here" is the primary nav link per spec (weight 600, primary color)
  { label: "Start here", href: "/#start", primary: true },
  { label: "Articles", href: "/blog", primary: false },
  { label: "Tools", href: "/tools", primary: false },
  { label: "Videos", href: "/#videos", primary: false },
  { label: "About", href: "/about", primary: false },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    // Spec: sticky, bg rgba(248,250,252,0.94) (= light-bg @ 94%), blur 8px, border #E2E8F0
    <header className="bg-light-bg/[0.94] backdrop-blur sticky top-0 z-50 border-b border-slate-200">
      {/* Spec: padding 20px 56px (desktop) */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-14">
        <div className="flex items-center justify-between py-3 lg:py-5">
          {/* Wordmark + IQ chip */}
          <Link
            href="/"
            className="flex items-center gap-2 flex-shrink-0"
            aria-label="Moolah IQ — home"
          >
            {/* Spec: Playfair 800 24px primary */}
            <span
              className="text-2xl font-extrabold text-primary tracking-tight leading-none"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Moolah
            </span>
            {/* Spec: Inter 700 14px, bg primary, text gold-light, 3px 9px, radius 5px */}
            <span className="bg-primary text-gold-light text-sm font-bold px-[9px] py-[3px] rounded-[5px] leading-none">
              IQ
            </span>
          </Link>

          {/* Desktop nav — centered, gap 36px, 15px links */}
          <nav className="hidden md:flex items-center gap-9 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`text-[15px] transition-colors hover:text-accent ${
                  link.primary
                    ? "font-semibold text-primary"
                    : "font-medium text-slate-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right CTA pill — bg primary, white 14px/600, 11px 22px, radius 999px, hover accent */}
          <div className="hidden md:flex items-center">
            <Link
              href="/#newsletter"
              className="bg-primary hover:bg-accent text-white font-semibold px-[22px] py-[11px] rounded-full text-sm transition-colors"
            >
              Get the Sunday Seed
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 -mr-2 text-slate-600"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-slate-200 bg-light-bg">
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`block px-4 py-3 text-sm rounded-xl transition-colors hover:text-accent hover:bg-white ${
                  link.primary
                    ? "font-semibold text-primary"
                    : "font-medium text-slate-600"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3">
              <Link
                href="/#newsletter"
                className="block text-center bg-primary hover:bg-accent text-white font-semibold px-[22px] py-3 rounded-full text-sm transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Get the Sunday Seed
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
