import { Metadata } from "next";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Moolah IQ terms of service — the rules and guidelines for using our website, calculators, and educational content.",
};

const sections = [
  { id: "acceptance", title: "1. Acceptance of Terms" },
  { id: "description", title: "2. Description of Service" },
  { id: "user-responsibilities", title: "3. User Responsibilities" },
  { id: "intellectual-property", title: "4. Intellectual Property" },
  { id: "prohibited-uses", title: "5. Prohibited Uses" },
  { id: "limitation-of-liability", title: "6. Limitation of Liability" },
  { id: "indemnification", title: "7. Indemnification" },
  { id: "modifications", title: "8. Modifications to Service" },
  { id: "governing-law", title: "9. Governing Law" },
  { id: "severability", title: "10. Severability" },
  { id: "contact", title: "11. Contact Information" },
];

export default function TermsPage() {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-700 mb-8">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <span className="text-gray-700">Legal</span>
        <span>/</span>
        <span className="text-primary font-medium">Terms of Service</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight mb-3">
          Terms of Service
        </h1>
        <p className="text-sm text-gray-700">
          Last updated: February 12, 2026
        </p>
      </div>

      <p className="text-gray-700 leading-relaxed mb-10">
        Welcome to Moolah IQ. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the
        Moolah IQ website, including all content, calculators, tools, and services. Please read them carefully
        before using our site.
      </p>

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
        <div id="acceptance">
          <h2 className="text-xl font-bold text-primary mb-4">1. Acceptance of Terms</h2>
          <p className="mb-3">
            By accessing or using Moolah IQ, you agree to be bound by these Terms of Service and our{" "}
            <Link href="/legal/privacy" className="text-primary hover:text-accent transition-colors underline">
              Privacy Policy
            </Link>. If you do not agree to these terms, please do not use our website.
          </p>
          <p className="mb-3">
            You must be at least <strong className="text-dark-text">18 years of age</strong> to use our
            financial calculators and tools. By using these features, you represent that you meet this
            age requirement.
          </p>
          <p>
            We may update these Terms from time to time. Continued use of the site after changes are
            posted constitutes acceptance of the revised Terms.
          </p>
        </div>

        <div id="description">
          <h2 className="text-xl font-bold text-primary mb-4">2. Description of Service</h2>
          <p className="mb-3">
            Moolah IQ provides the following services, all currently offered free of charge:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span><strong className="text-dark-text">Educational Content:</strong> Blog articles, guides, and resources about personal finance, investing, budgeting, and wealth building.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span><strong className="text-dark-text">Interactive Calculators:</strong> Financial tools including compound interest calculators, crossover point calculators, mortgage refinance calculators, and more.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span><strong className="text-dark-text">Newsletter:</strong> Periodic email updates with financial education content (subscription optional).</span>
            </li>
          </ul>
          <p className="mt-3">
            All content and tools are provided for <strong className="text-dark-text">educational purposes only</strong> and
            do not constitute financial advice. See our{" "}
            <Link href="/legal/disclaimer" className="text-primary hover:text-accent transition-colors underline">
              Disclaimer
            </Link>{" "}
            for complete details.
          </p>
        </div>

        <div id="user-responsibilities">
          <h2 className="text-xl font-bold text-primary mb-4">3. User Responsibilities</h2>
          <p className="mb-3">
            When using Moolah IQ, you agree to:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Provide accurate information when using our calculators and tools.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Use the site only for lawful purposes and in compliance with all applicable laws.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Not attempt to harm, disrupt, or interfere with the site&apos;s operation or security.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Not copy, reproduce, or redistribute our content without prior written permission.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Verify all calculator results independently before making financial decisions.</span>
            </li>
          </ul>
        </div>

        <div id="intellectual-property">
          <h2 className="text-xl font-bold text-primary mb-4">4. Intellectual Property</h2>
          <p className="mb-3">
            All content on Moolah IQ — including but not limited to text, graphics, logos, icons, images,
            calculator designs, source code, and the compilation thereof — is the property of Moolah IQ
            and is protected by United States and international copyright, trademark, and other
            intellectual property laws.
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>You may use our calculators and read our content for <strong className="text-dark-text">personal, non-commercial use</strong>.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>You may not copy, modify, distribute, sell, or create derivative works based on our content without express written permission.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>You may share links to our pages freely, with proper attribution.</span>
            </li>
          </ul>
        </div>

        <div id="prohibited-uses">
          <h2 className="text-xl font-bold text-primary mb-4">5. Prohibited Uses</h2>
          <p className="mb-3">
            You may not use Moolah IQ for any of the following:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Any illegal activities or purposes that violate local, state, national, or international law.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Harassing, threatening, or intimidating other users or individuals.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Uploading or transmitting viruses, malware, or any malicious code.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Automated scraping, crawling, or data mining of our content or tools (beyond standard search engine indexing).</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Impersonating Moolah IQ, its creators, or any other person or entity.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Attempting to gain unauthorized access to our systems, servers, or databases.</span>
            </li>
          </ul>
        </div>

        <div id="limitation-of-liability">
          <h2 className="text-xl font-bold text-primary mb-4">6. Limitation of Liability</h2>
          <p className="mb-3">
            Moolah IQ and all its content and tools are provided on an <strong className="text-dark-text">&quot;as is&quot;</strong> and{" "}
            <strong className="text-dark-text">&quot;as available&quot;</strong> basis, without warranties of any kind, either express or
            implied, including but not limited to warranties of merchantability, fitness for a particular
            purpose, or non-infringement.
          </p>
          <p className="mb-3">
            To the maximum extent permitted by applicable law, Moolah IQ shall not be liable for:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of the site.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Errors or omissions in calculator results, articles, or other content.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Financial losses resulting from decisions made using information from this site.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Service interruptions, technical failures, or data loss.</span>
            </li>
          </ul>
          <p className="mt-3">
            In no event shall our total liability to you exceed <strong className="text-dark-text">$100 USD</strong>.
          </p>
        </div>

        <div id="indemnification">
          <h2 className="text-xl font-bold text-primary mb-4">7. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Moolah IQ, its creators, contributors,
            affiliates, and agents from and against any and all claims, damages, obligations, losses,
            liabilities, costs, or expenses (including reasonable attorney&apos;s fees) arising from your use
            of the website, your violation of these Terms, or your violation of any rights of a third party.
          </p>
        </div>

        <div id="modifications">
          <h2 className="text-xl font-bold text-primary mb-4">8. Modifications to Service</h2>
          <p className="mb-3">
            We reserve the right to:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Modify, suspend, or discontinue any part of the service at any time, with or without notice.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Add new features, tools, or services, including paid offerings in the future.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Remove or alter content as we deem necessary.</span>
            </li>
          </ul>
          <p className="mt-3">
            We are under no obligation to maintain or support any specific feature or functionality.
          </p>
        </div>

        <div id="governing-law">
          <h2 className="text-xl font-bold text-primary mb-4">9. Governing Law</h2>
          <p className="mb-3">
            These Terms shall be governed by and construed in accordance with the laws of the
            United States, without regard to conflict of law principles.
          </p>
          <p>
            Any disputes arising from or relating to these Terms or your use of Moolah IQ shall be
            resolved through good-faith negotiation first. If a resolution cannot be reached, disputes
            shall be submitted to binding arbitration in accordance with applicable rules.
          </p>
        </div>

        <div id="severability">
          <h2 className="text-xl font-bold text-primary mb-4">10. Severability</h2>
          <p>
            If any provision of these Terms is found to be unenforceable or invalid by a court of
            competent jurisdiction, that provision shall be limited or eliminated to the minimum extent
            necessary so that these Terms shall otherwise remain in full force and effect. The
            invalidity of one provision does not affect the validity of the remaining provisions.
          </p>
        </div>

        <div id="contact">
          <h2 className="text-xl font-bold text-primary mb-4">11. Contact Information</h2>
          <p className="mb-3">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <div className="bg-light-bg rounded-xl border border-gray-100 p-5">
            <p className="text-sm">
              <strong className="text-dark-text">Email:</strong>{" "}
              <a href="mailto:legal@moolahiq.com" className="text-primary hover:text-accent transition-colors underline">
                legal@moolahiq.com
              </a>
            </p>
          </div>
        </div>

        {/* Print Button */}
        <div className="pt-4 border-t border-gray-100">
          <PrintButton />
        </div>
      </div>
    </section>
  );
}
