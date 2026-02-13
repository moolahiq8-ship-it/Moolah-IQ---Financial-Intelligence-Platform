import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Free financial calculators and tools to help you make smarter money decisions. Plan your path to financial independence with Moolah IQ.",
};

const tools = [
  {
    title: "Crossover Point Calculator",
    description:
      "Calculate when your passive investment income will exceed your monthly expenses — your financial independence date.",
    href: "/tools/crossover-calculator",
    badge: "Strategic IQ",
    badgeColor: "text-primary bg-primary/10",
    icon: (
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
    ),
  },
  {
    title: "Compound Interest Calculator",
    description:
      "See how your money grows over time with compound interest. Compare scenarios and visualize the power of consistent investing.",
    href: "/tools/compound-interest-calculator",
    badge: "Market IQ",
    badgeColor: "text-accent bg-accent/10",
    icon: (
      <svg
        className="w-7 h-7 text-accent"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "Mortgage Refinance Calculator",
    description:
      "Should you refinance? Calculate your break-even point, monthly savings, and see if refinancing makes financial sense.",
    href: "/tools/mortgage-refinance-calculator",
    badge: "Strategic IQ",
    badgeColor: "text-primary bg-primary/10",
    icon: (
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
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2"
        />
      </svg>
    ),
  },
];

export default function ToolsPage() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-primary font-medium">Tools</span>
      </nav>

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight mb-4">
          Financial Tools
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
          Free calculators and planning tools to help you make smarter money
          decisions and plan your financial future.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group bg-white rounded-2xl shadow-xl border border-gray-100/50 p-6 hover:shadow-2xl hover:border-gold/30 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                {tool.icon}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${tool.badgeColor}`}>
                {tool.badge}
              </span>
            </div>
            <h2 className="text-lg font-bold text-dark-text group-hover:text-primary transition-colors mb-2">
              {tool.title}
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              {tool.description}
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold group-hover:text-gold-dark transition-colors">
              Try it now
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
          </Link>
        ))}
      </div>
    </section>
  );
}
