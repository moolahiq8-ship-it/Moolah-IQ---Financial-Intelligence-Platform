import Hero from "@/components/Hero";
import HomeTabs from "@/components/HomeTabs";
import Newsletter from "@/components/Newsletter";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function Home() {
  const posts = getAllPosts();

  return (
    <>
      <Hero />
      <HomeTabs posts={posts} />

      {/* Features strip */}
      <section className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            <div className="text-center">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-dark-text mb-2">Expert Guides</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                In-depth articles written with clarity and backed by research.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-dark-text mb-2">Actionable Tips</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Every article includes steps you can take today to improve your finances.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-dark-text mb-2">No Jargon</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Finance explained in plain English. Accessible to everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Showcase */}
      <section className="border-t border-gray-100 bg-light-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center mb-10">
            <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-3">
              Interactive Tools
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">
              Crunch the Numbers
            </h2>
          </div>
          <div className="max-w-2xl mx-auto">
            <Link
              href="/tools/crossover-calculator"
              className="group block bg-white rounded-2xl shadow-xl border border-gray-100/50 p-8 hover:shadow-2xl hover:border-gold/30 transition-all duration-300"
            >
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-gold"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-dark-text group-hover:text-primary transition-colors">
                      Crossover Point Calculator
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      New
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">
                    Find out when your passive investment income will cover your
                    monthly expenses — your personal financial independence date.
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold group-hover:text-gold-dark transition-colors">
                    Calculate now
                    <svg
                      className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-primary neural-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-4">
              Intelligence Brief
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
              Level Up Your{" "}
              <span className="text-accent">Financial IQ</span>
            </h2>
            <p className="text-white/70 text-base md:text-lg mb-10 leading-relaxed">
              Join thousands of readers getting weekly intelligence briefs
              delivered straight to their inbox.
            </p>
            <div className="max-w-md mx-auto">
              <Newsletter variant="footer" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
