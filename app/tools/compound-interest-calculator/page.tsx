import { Metadata } from "next";
import Link from "next/link";
import CompoundInterestCalculator from "@/components/CompoundInterestCalculator";

export const metadata: Metadata = {
  title: "Compound Interest Calculator",
  description:
    "See how your money grows over time with compound interest. Calculate future value, total contributions, and interest earned with our free calculator.",
  openGraph: {
    title: "Compound Interest Calculator | Moolah IQ",
    description:
      "See how your money grows over time with compound interest. Calculate future value, total contributions, and interest earned.",
    type: "website",
  },
};

export default function CompoundInterestCalculatorPage() {
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
        <span className="text-primary font-medium">Compound Interest Calculator</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <span className="inline-block bg-accent/10 text-accent text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Market IQ
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight mb-4">
          Compound Interest Calculator
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
          See the power of compound interest in action. Enter your numbers and
          watch how time and consistent contributions turn small investments into
          life-changing wealth.
        </p>
      </div>

      {/* Calculator */}
      <CompoundInterestCalculator />

      {/* Disclaimer */}
      <div className="mt-12 bg-light-bg rounded-xl p-6 border border-gray-100">
        <p className="text-xs text-gray-400 leading-relaxed">
          <span className="font-semibold text-gray-500">Disclaimer:</span> This
          calculator is for educational and illustrative purposes only. It assumes
          a fixed annual interest rate compounded at the selected frequency. Actual
          investment returns vary, and this tool does not account for taxes,
          inflation, fees, or market volatility. Past performance does not guarantee
          future results. This is not financial advice — consult a qualified
          financial advisor for personalized guidance.
        </p>
      </div>
    </section>
  );
}
