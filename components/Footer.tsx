import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#0f2847] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-10">
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
            <p className="text-white/70 text-sm leading-relaxed max-w-sm">
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
          <div className="md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold mb-4">
              Categories
            </h4>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <li>
                <Link
                  href="/category/earn"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Earn
                </Link>
              </li>
              <li>
                <Link
                  href="/category/spend"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Spend
                </Link>
              </li>
              <li>
                <Link
                  href="/category/save"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Save
                </Link>
              </li>
              <li>
                <Link
                  href="/category/invest"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Invest
                </Link>
              </li>
              <li>
                <Link
                  href="/category/optimize"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Optimize
                </Link>
              </li>
              <li>
                <Link
                  href="/category/protect"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Protect
                </Link>
              </li>
              <li>
                <Link
                  href="/category/milestones"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Milestones
                </Link>
              </li>
              <li>
                <Link
                  href="/category/legacy"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Legacy
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
