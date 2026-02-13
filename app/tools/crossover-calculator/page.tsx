import { Metadata } from "next";
import Link from "next/link";
import CrossoverCalculator from "@/components/CrossoverCalculator";

export const metadata: Metadata = {
  title: "Crossover Point Calculator",
  description:
    "Calculate when your passive investment income will exceed your monthly expenses. Find your financial independence date with the Crossover Point Calculator.",
  openGraph: {
    title: "Crossover Point Calculator | Moolah IQ",
    description:
      "Calculate when your passive investment income will exceed your monthly expenses. Find your financial independence date.",
    type: "website",
  },
};

export default function CrossoverCalculatorPage() {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/tools" className="hover:text-primary transition-colors">
          Tools
        </Link>
        <span>/</span>
        <span className="text-primary font-medium">Crossover Calculator</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <span className="inline-block bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Strategic IQ
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight mb-4">
          Crossover Point Calculator
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
          Discover when your passive investment income will cover all your
          monthly expenses — your personal financial independence date.
        </p>
      </div>

      {/* Calculator */}
      <CrossoverCalculator />

      {/* Disclaimer */}
      <div className="mt-12 bg-light-bg rounded-xl p-6 border border-gray-100">
        <p className="text-xs text-gray-400 leading-relaxed">
          <span className="font-semibold text-gray-500">Disclaimer:</span> This
          calculator is for educational and illustrative purposes only. It uses
          simplified assumptions including a constant annual return rate, fixed
          monthly expenses, and the 4% safe withdrawal rate. Actual investment
          returns fluctuate, taxes and inflation are not accounted for, and past
          performance does not guarantee future results. This is not financial
          advice — consult a qualified financial advisor for personalized
          guidance.
        </p>
      </div>
    </section>
  );
}
