import { Metadata } from "next";
import Newsletter from "@/components/Newsletter";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Moolah IQ — our mission to make personal finance accessible and actionable for everyone.",
};

const pillars = [
  {
    name: "Earn",
    description: "Scale your primary income, launch side hustles, and master the art of negotiation.",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    gradient: "from-emerald-600/20 to-teal-800/10",
    accent: "text-emerald-700",
    ring: "ring-emerald-600/30",
    iconBg: "from-emerald-300 to-teal-300",
  },
  {
    name: "Spend",
    description: "Transition from mindless consumption to intentional spending\u2014making every dollar work harder.",
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    gradient: "from-amber-600/20 to-orange-800/10",
    accent: "text-amber-700",
    ring: "ring-amber-600/30",
    iconBg: "from-amber-300 to-orange-300",
  },
  {
    name: "Save",
    description: "Move beyond the piggy bank with high-yield strategies and robust emergency funds.",
    icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
    gradient: "from-blue-600/20 to-indigo-800/10",
    accent: "text-blue-700",
    ring: "ring-blue-600/30",
    iconBg: "from-blue-300 to-indigo-300",
  },
  {
    name: "Invest",
    description: "Demystify the markets by mastering stocks, index funds, and the unstoppable power of compound growth.",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    gradient: "from-purple-600/20 to-violet-800/10",
    accent: "text-purple-700",
    ring: "ring-purple-600/30",
    iconBg: "from-purple-300 to-violet-300",
  },
  {
    name: "Optimize",
    description: "Fine-tune the engine through tax efficiency, credit score mastery, and strategic debt management.",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    gradient: "from-yellow-600/20 to-amber-600/10",
    accent: "text-yellow-700",
    ring: "ring-yellow-600/30",
    iconBg: "from-yellow-300 to-amber-300",
  },
  {
    name: "Protect",
    description: "Shield your hard-earned wealth with smart insurance, estate planning, and fraud prevention.",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    gradient: "from-rose-600/20 to-red-800/10",
    accent: "text-rose-700",
    ring: "ring-rose-600/30",
    iconBg: "from-rose-300 to-red-300",
  },
  {
    name: "Milestones",
    description: "Navigate life\u2019s major plays\u2014from securing your first home to starting a family and planning for retirement.",
    icon: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9",
    gradient: "from-cyan-600/20 to-blue-800/10",
    accent: "text-cyan-700",
    ring: "ring-cyan-600/30",
    iconBg: "from-cyan-300 to-blue-300",
  },
  {
    name: "Legacy",
    description: "Think beyond yourself by building generational wealth and creating a lasting impact through charitable planning.",
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    gradient: "from-amber-500/20 to-yellow-700/10",
    accent: "text-amber-800",
    ring: "ring-amber-500/30",
    iconBg: "from-amber-300 to-yellow-300",
  },
];

export default function AboutPage() {
  return (
    <div className="antialiased">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-white to-accent/[0.06]" />
        {/* Mesh gradient blobs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-accent rounded-full blur-3xl opacity-20" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-gold rounded-full blur-3xl opacity-20" />
        <div className="relative max-w-4xl mx-auto px-4 pt-16 sm:pt-20 pb-12 sm:pb-16">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-1.5 mb-6 shadow-md">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-accent">About Us</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-primary mb-4 tracking-tight">
            About Moolah IQ
          </h1>
          <p className="text-lg sm:text-xl font-medium text-slate-800 max-w-2xl leading-relaxed">
            Empowering smarter money decisions through data-backed intelligence and disciplined strategy.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-4 py-14 sm:py-16">
        <div className="relative rounded-3xl bg-gradient-to-br from-primary/[0.04] via-white to-accent/[0.08] border border-gray-200/80 p-8 sm:p-12 shadow-md">
          <div className="absolute -top-4 left-8 sm:left-12">
            <div className="inline-flex items-center gap-2 bg-white px-5 py-1.5 rounded-full border border-gray-200 shadow-md">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-accent">Our Mission</h2>
            </div>
          </div>
          <div className="mt-4 space-y-5">
            <p className="text-slate-700 text-lg sm:text-xl font-medium leading-relaxed">
              At{" "}
              <strong className="text-primary font-extrabold">Moolah IQ</strong>, we believe financial mastery shouldn&apos;t be a &ldquo;Wall Street secret.&rdquo; Whether you are architecting your first budget, deploying your first investment dollar, or optimizing a complex path to financial independence, we are here to bridge the gap between where you are and where you want to be.
            </p>
            <p className="text-slate-700 text-lg sm:text-xl font-medium leading-relaxed">
              Our goal is to empower you with the{" "}
              <strong className="text-primary font-extrabold">data and discipline</strong>{" "}
              needed to make smarter, high-conviction money decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      </div>

      {/* The 8 Pillars */}
      <section className="max-w-5xl mx-auto px-4 py-14 sm:py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/[0.06] border border-primary/10 rounded-full px-4 py-1.5 mb-5">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Our Foundation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-primary mb-4 tracking-tight">The 8 Pillars</h2>
          <p className="text-slate-800 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
            Every strategy, video, and guide at Moolah IQ is built upon our eight core pillars of personal finance:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((pillar) => (
            <div
              key={pillar.name}
              className={`group relative rounded-2xl bg-gradient-to-br ${pillar.gradient} border border-gray-200/80 p-6 ring-1 ${pillar.ring} transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-gray-300/40`}
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${pillar.iconBg} shadow-md flex items-center justify-center mb-4 ring-1 ${pillar.ring} transition-transform duration-300 group-hover:scale-110`}>
                <svg className={`w-5 h-5 ${pillar.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={pillar.icon} />
                </svg>
              </div>
              <h3 className={`text-sm font-extrabold uppercase tracking-wider ${pillar.accent} mb-2`}>
                {pillar.name}
              </h3>
              <p className="text-slate-800 text-sm font-medium leading-relaxed">{pillar.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      </div>

      {/* Our Approach */}
      <section className="max-w-4xl mx-auto px-4 py-14 sm:py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-accent/[0.08] border border-accent/10 rounded-full px-4 py-1.5 mb-5">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">How We Work</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-primary mb-4 tracking-tight">Our Approach</h2>
          <p className="text-slate-800 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
            At Moolah IQ, we cut through the noise with three guiding principles:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Clarity */}
          <div className="group relative rounded-2xl bg-white border border-gray-200/80 p-8 text-center shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-amber-300">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-300 to-yellow-300 flex items-center justify-center mx-auto mb-5 ring-1 ring-amber-300/60 transition-transform duration-300 group-hover:scale-110">
                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-3">Clarity</h3>
              <p className="text-slate-800 text-sm font-medium leading-relaxed">
                We translate &ldquo;finance-speak&rdquo; into plain English. No jargon enters our content without a clear explanation.
              </p>
            </div>
          </div>

          {/* Actionability */}
          <div className="group relative rounded-2xl bg-white border border-gray-200/80 p-8 text-center shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-emerald-300">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-300 to-green-300 flex items-center justify-center mx-auto mb-5 ring-1 ring-emerald-300/60 transition-transform duration-300 group-hover:scale-110">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-3">Actionability</h3>
              <p className="text-slate-800 text-sm font-medium leading-relaxed">
                Theory is useless without execution. Every piece of content includes concrete steps you can take today.
              </p>
            </div>
          </div>

          {/* Honesty */}
          <div className="group relative rounded-2xl bg-white border border-gray-200/80 p-8 text-center shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-300">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-300 to-indigo-300 flex items-center justify-center mx-auto mb-5 ring-1 ring-blue-300/60 transition-transform duration-300 group-hover:scale-110">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-3">Honesty</h3>
              <p className="text-slate-800 text-sm font-medium leading-relaxed">
                We prioritize transparency over trends. We share what actually works, what&apos;s a trap, and the &ldquo;why&rdquo; behind every strategy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-16 sm:pb-20 pt-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/[0.06] via-white to-accent/[0.10] rounded-3xl border border-gray-200/80 p-8 sm:p-12 text-center shadow-md">
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary mb-3 tracking-tight">
              Join the Moolah IQ Community
            </h2>
            <p className="text-slate-800 font-medium mb-8 max-w-lg mx-auto text-lg leading-relaxed">
              Subscribe to our newsletter and get weekly money intelligence delivered straight to your inbox.
            </p>
            <Newsletter variant="inline" />
          </div>
        </div>
      </section>
    </div>
  );
}
