import { Metadata } from "next";
import Link from "next/link";
import MortgageRefinanceCalculator from "@/components/MortgageRefinanceCalculator";

export const metadata: Metadata = {
  title: "Mortgage Refinance Break-Even Calculator",
  description:
    "Should you refinance your mortgage? Calculate your break-even point, monthly savings, and total interest saved with our free refinance calculator.",
  openGraph: {
    title: "Mortgage Refinance Break-Even Calculator | Moolah IQ",
    description:
      "Should you refinance your mortgage? Calculate your break-even point, monthly savings, and total interest saved.",
    type: "website",
  },
};

export default function MortgageRefinanceCalculatorPage() {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/tools" className="hover:text-primary transition-colors">
          Tools
        </Link>
        <span>/</span>
        <span className="text-primary font-medium">Mortgage Refinance Calculator</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <span className="inline-block bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Strategic IQ
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight mb-4">
          Mortgage Refinance Calculator
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl leading-relaxed">
          Find out if refinancing makes financial sense. Enter your current
          mortgage details and a refinance scenario to see your break-even point,
          monthly savings, and total interest saved.
        </p>
      </div>

      {/* Calculator */}
      <MortgageRefinanceCalculator />
    </section>
  );
}
