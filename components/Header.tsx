"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm">
      <div className="mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 md:h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Moolah IQ - Boost Your Wealth Knowledge"
              width={308}
              height={77}
              className="h-12 w-auto md:h-[62px]"
              priority
            />
          </Link>

          {/* Desktop nav — centered */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            <Link
              href="/"
              className="px-4 py-2 text-[16px] font-semibold text-dark-text hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
            >
              Home
            </Link>
            <Link
              href="/blog"
              className="px-4 py-2 text-[16px] font-semibold text-dark-text hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
            >
              Blog
            </Link>
            <Link
              href="/tools"
              className="px-4 py-2 text-[16px] font-semibold text-dark-text hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
            >
              Tools
            </Link>
            <Link
              href="/about"
              className="px-4 py-2 text-[16px] font-semibold text-dark-text hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
            >
              About
            </Link>
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/blog"
              className="p-2 text-gray-300 hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
              aria-label="Search articles"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            <Link
              href="/blog"
              className="border-2 border-gold text-gold hover:bg-gold hover:text-primary font-bold px-5 py-2 rounded-lg text-[13px] transition-all duration-200"
            >
              Boost My IQ
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 -mr-2 text-gray-500"
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
        <nav className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-4 space-y-1">
            <Link
              href="/"
              className="block px-4 py-3 text-sm font-semibold text-gray-600 hover:text-primary hover:bg-gray-50 rounded-xl transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/blog"
              className="block px-4 py-3 text-sm font-semibold text-gray-600 hover:text-primary hover:bg-gray-50 rounded-xl transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/tools"
              className="block px-4 py-3 text-sm font-semibold text-gray-600 hover:text-primary hover:bg-gray-50 rounded-xl transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Tools
            </Link>
            <Link
              href="/about"
              className="block px-4 py-3 text-sm font-semibold text-gray-600 hover:text-primary hover:bg-gray-50 rounded-xl transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              About
            </Link>
            <div className="pt-3">
              <Link
                href="/blog"
                className="block text-center border-2 border-gold text-gold hover:bg-gold hover:text-primary font-bold px-5 py-3 rounded-xl text-sm transition-all duration-200"
                onClick={() => setMenuOpen(false)}
              >
                Boost My IQ
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
