import { Metadata } from "next";
import Newsletter from "@/components/Newsletter";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Moolah IQ — our mission to make personal finance accessible and actionable for everyone.",
};

export default function AboutPage() {
  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-primary mb-8">About Moolah IQ</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-lg text-gray-600 mb-6">
          <strong className="text-dark-text">Moolah IQ</strong> is a personal
          finance blog on a mission: make money topics{" "}
          <em>accessible, practical, and jargon-free</em> for everyone.
        </p>

        <h2 className="text-2xl font-bold text-primary mt-10 mb-4">
          Our Mission
        </h2>
        <p className="text-gray-600 mb-4">
          We believe financial literacy shouldn&apos;t be reserved for Wall
          Street insiders. Whether you&apos;re just starting to budget, looking
          to invest your first dollar, or optimizing your path to financial
          independence, Moolah IQ is here to help you make smarter money
          decisions.
        </p>

        <h2 className="text-2xl font-bold text-primary mt-10 mb-4">
          What We Cover
        </h2>
        <ul className="space-y-3 text-gray-600 mb-6">
          <li className="flex gap-2">
            <span className="text-accent font-bold">Budgeting</span> — Proven
            strategies to track your spending and save more every month.
          </li>
          <li className="flex gap-2">
            <span className="text-accent font-bold">Investing</span> — From
            index funds to retirement accounts, learn the fundamentals.
          </li>
          <li className="flex gap-2">
            <span className="text-accent font-bold">Saving</span> — Emergency
            funds, high-yield accounts, and goal-based saving techniques.
          </li>
          <li className="flex gap-2">
            <span className="text-accent font-bold">Debt Management</span> —
            Smart strategies to pay off debt and stay debt-free.
          </li>
          <li className="flex gap-2">
            <span className="text-accent font-bold">Financial Planning</span> —
            Big-picture thinking for your financial future.
          </li>
        </ul>

        <h2 className="text-2xl font-bold text-primary mt-10 mb-4">
          Our Approach
        </h2>
        <p className="text-gray-600 mb-4">
          Every article on Moolah IQ is written with three principles in mind:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-8">
          <li>
            <strong>Clarity</strong> — No financial jargon without explanation.
          </li>
          <li>
            <strong>Actionability</strong> — Every post includes steps you can
            take today.
          </li>
          <li>
            <strong>Honesty</strong> — We share what works, what doesn&apos;t,
            and why.
          </li>
        </ol>
      </div>

      {/* Newsletter */}
      <div className="bg-light-bg rounded-xl p-8 mt-12">
        <h2 className="text-xl font-bold text-primary mb-3">
          Join the Moolah IQ Community
        </h2>
        <p className="text-gray-600 mb-4">
          Subscribe to our newsletter and get weekly money tips delivered to your
          inbox.
        </p>
        <Newsletter variant="inline" />
      </div>
    </section>
  );
}
