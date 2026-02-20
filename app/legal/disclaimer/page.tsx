import { Metadata } from "next";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";

export const metadata: Metadata = {
  title: "Disclaimer & Educational Use Policy",
  description:
    "Moolah IQ disclaimer — all content, calculators, and tools are for educational purposes only. Not financial, investment, tax, or legal advice.",
};

const sections = [
  { id: "educational-purpose", title: "1. Educational Purpose Only" },
  { id: "calculator-accuracy", title: "2. Calculator Accuracy & Limitations" },
  { id: "no-professional-relationship", title: "3. No Professional Relationship" },
  { id: "investment-risks", title: "4. Investment & Financial Risks" },
  { id: "limitation-of-liability", title: "5. Limitation of Liability" },
  { id: "third-party-links", title: "6. Third-Party Links" },
  { id: "changes", title: "7. Changes to This Disclaimer" },
];

export default function DisclaimerPage() {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-700 mb-8">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <span className="text-gray-700">Legal</span>
        <span>/</span>
        <span className="text-primary font-medium">Disclaimer</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight mb-3">
          Disclaimer & Educational Use Policy
        </h1>
        <p className="text-sm text-gray-700">
          Last updated: February 12, 2026
        </p>
      </div>

      {/* Table of Contents */}
      <div className="bg-light-bg rounded-xl border border-gray-100 p-6 mb-10">
        <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">
          Table of Contents
        </h2>
        <ul className="space-y-2">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-sm text-gray-700 hover:text-primary transition-colors">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Content */}
      <div className="space-y-10 text-gray-700 leading-relaxed">
        <div id="educational-purpose">
          <h2 className="text-xl font-bold text-primary mb-4">1. Educational Purpose Only</h2>
          <p className="mb-3">
            All content published on Moolah IQ — including blog articles, calculators, tools, charts, and
            any other materials — is provided strictly for <strong className="text-dark-text">educational and informational purposes</strong>.
          </p>
          <p className="mb-3">
            Nothing on this website constitutes financial advice, investment advice, tax advice, legal advice,
            or any other form of professional advice. The information presented is general in nature and may
            not be applicable to your specific financial situation, goals, or risk tolerance.
          </p>
          <p>
            You should not rely solely on the information provided by Moolah IQ when making financial decisions.
            Always do your own research and consider your personal circumstances.
          </p>
        </div>

        <div id="calculator-accuracy">
          <h2 className="text-xl font-bold text-primary mb-4">2. Calculator Accuracy & Limitations</h2>
          <p className="mb-3">
            Our financial calculators and interactive tools produce <strong className="text-dark-text">estimates based on the inputs
            you provide</strong> and simplified mathematical models. These tools are designed to help you explore
            financial concepts and scenarios — they are not predictive tools.
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Results are approximations and actual outcomes may vary significantly from projections.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Calculators use simplified assumptions and may not account for taxes, inflation, fees, market volatility, or other important factors.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>We make no guarantees regarding the accuracy, completeness, or reliability of calculator results.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>You are solely responsible for verifying all calculations before making any financial decisions.</span>
            </li>
          </ul>
        </div>

        <div id="no-professional-relationship">
          <h2 className="text-xl font-bold text-primary mb-4">3. No Professional Relationship</h2>
          <p className="mb-3">
            Using this website, reading our articles, or interacting with our calculators does <strong className="text-dark-text">not</strong> create
            a financial advisor-client relationship, attorney-client relationship, or any other professional relationship
            between you and Moolah IQ.
          </p>
          <p className="mb-3">
            Moolah IQ is not a registered investment advisor, financial planner, accountant, tax professional,
            or attorney. We are an educational content platform.
          </p>
          <p>
            Before making any financial, investment, tax, or legal decisions, you should consult with qualified,
            licensed professionals who can evaluate your specific situation and provide personalized guidance.
          </p>
        </div>

        <div id="investment-risks">
          <h2 className="text-xl font-bold text-primary mb-4">4. Investment & Financial Risks</h2>
          <p className="mb-3">
            All investments carry risk, including the potential loss of principal. Please be aware of the following:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span><strong className="text-dark-text">Past performance does not guarantee future results.</strong> Historical returns referenced in our content are not indicative of future performance.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>You can lose some or all of your invested money. No investment strategy is risk-free.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Different investments carry different levels of risk. Understand the specific risks before investing.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Market conditions, economic events, and regulatory changes can impact investment performance in unpredictable ways.</span>
            </li>
          </ul>
        </div>

        <div id="limitation-of-liability">
          <h2 className="text-xl font-bold text-primary mb-4">5. Limitation of Liability</h2>
          <p className="mb-3">
            To the fullest extent permitted by law, Moolah IQ and its creators, contributors, and affiliates
            shall not be held liable for any damages, losses, or expenses arising from:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Financial decisions made based on information or tools provided on this website.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Errors, inaccuracies, or omissions in our content or calculator results.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Any reliance you place on the information provided.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Service interruptions, technical errors, or data loss.</span>
            </li>
          </ul>
          <p className="mt-3">
            <strong className="text-dark-text">You use this website and its tools entirely at your own risk.</strong>
          </p>
        </div>

        <div id="third-party-links">
          <h2 className="text-xl font-bold text-primary mb-4">6. Third-Party Links</h2>
          <p className="mb-3">
            Moolah IQ may contain links to third-party websites, products, or services. These links are
            provided for your convenience and reference only.
          </p>
          <p className="mb-3">
            We are not responsible for the content, accuracy, privacy practices, or opinions expressed on
            third-party websites. A link does not constitute or imply an endorsement, sponsorship, or
            recommendation by Moolah IQ.
          </p>
          <p>
            We encourage you to read the privacy policies and terms of service of any third-party website
            you visit.
          </p>
        </div>

        <div id="changes">
          <h2 className="text-xl font-bold text-primary mb-4">7. Changes to This Disclaimer</h2>
          <p className="mb-3">
            We reserve the right to update or modify this disclaimer at any time without prior notice.
            Changes take effect immediately upon posting to this page.
          </p>
          <p>
            Your continued use of Moolah IQ after any changes constitutes your acceptance of the updated
            disclaimer. We recommend reviewing this page periodically.
          </p>
        </div>

        {/* Print Button */}
        <div className="pt-4 border-t border-gray-100">
          <PrintButton />
        </div>
      </div>
    </section>
  );
}
