import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#0f2847] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/logo.png"
                alt="Moolah IQ - Boost Your Wealth Knowledge"
                width={160}
                height={40}
                className="h-9 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm">
              Level up your financial intelligence. Data-backed strategies to
              build wealth, budget smarter, and invest with confidence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold mb-4">
              Quick Links
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/tools"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Tools
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold mb-4">
              Topics
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/category/saving"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Saving
                </Link>
              </li>
              <li>
                <Link
                  href="/category/investing"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Investing
                </Link>
              </li>
              <li>
                <Link
                  href="/category/budgeting"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Budgeting
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold mb-4">
              Legal
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/legal/disclaimer"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} Moolah IQ. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-xs text-white/30">
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
