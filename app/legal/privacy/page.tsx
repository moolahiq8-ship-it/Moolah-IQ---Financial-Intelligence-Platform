import { Metadata } from "next";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Moolah IQ privacy policy — how we collect, use, and protect your information. Your privacy matters to us.",
};

const sections = [
  { id: "information-we-collect", title: "1. Information We Collect" },
  { id: "how-we-use", title: "2. How We Use Your Information" },
  { id: "cookies", title: "3. Cookies & Tracking Technologies" },
  { id: "third-party-services", title: "4. Third-Party Services" },
  { id: "data-security", title: "5. Data Security" },
  { id: "your-rights", title: "6. Your Rights (GDPR & CCPA)" },
  { id: "childrens-privacy", title: "7. Children's Privacy" },
  { id: "changes", title: "8. Changes to This Policy" },
  { id: "contact", title: "9. Contact Us" },
];

export default function PrivacyPage() {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <span className="text-gray-600">Legal</span>
        <span>/</span>
        <span className="text-primary font-medium">Privacy Policy</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight mb-3">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-600">
          Last updated: February 12, 2026
        </p>
      </div>

      <p className="text-gray-600 leading-relaxed mb-10">
        At Moolah IQ, we take your privacy seriously. This Privacy Policy explains what information
        we collect, how we use it, and the choices you have. By using our website, you agree to the
        collection and use of information as described here.
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
      <div className="space-y-10 text-gray-600 leading-relaxed">
        <div id="information-we-collect">
          <h2 className="text-xl font-bold text-primary mb-4">1. Information We Collect</h2>
          <p className="mb-4">
            We collect minimal information to provide and improve our service. Here is what we may collect:
          </p>

          <h3 className="text-base font-bold text-dark-text mb-2">Automatically Collected Information</h3>
          <ul className="space-y-2 ml-4 mb-4">
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span><strong className="text-dark-text">Analytics data:</strong> Pages visited, time spent on site, referral source, device type, browser type, and general geographic location (country/region level).</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span><strong className="text-dark-text">IP addresses:</strong> Collected automatically by our hosting provider as part of standard server logs.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span><strong className="text-dark-text">Cookies:</strong> Small data files stored on your device for session management and analytics tracking.</span>
            </li>
          </ul>

          <h3 className="text-base font-bold text-dark-text mb-2">Information You Provide</h3>
          <ul className="space-y-2 ml-4 mb-4">
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span><strong className="text-dark-text">Email address:</strong> Only if you voluntarily subscribe to our newsletter.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span><strong className="text-dark-text">Calculator inputs:</strong> Data you enter into our calculators is processed entirely in your browser and is <strong>never sent to our servers</strong>.</span>
            </li>
          </ul>

          <h3 className="text-base font-bold text-dark-text mb-2">What We Do NOT Collect</h3>
          <ul className="space-y-2 ml-4">
            <li className="flex gap-2">
              <span className="text-accent font-bold flex-shrink-0">-</span>
              <span>Payment or credit card information</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent font-bold flex-shrink-0">-</span>
              <span>Social Security numbers or government IDs</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent font-bold flex-shrink-0">-</span>
              <span>Bank account details or financial account credentials</span>
            </li>
          </ul>
        </div>

        <div id="how-we-use">
          <h2 className="text-xl font-bold text-primary mb-4">2. How We Use Your Information</h2>
          <p className="mb-3">
            We use the information we collect for the following purposes:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span><strong className="text-dark-text">Improve our website:</strong> Understand which content and tools are most useful so we can create more of what helps you.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span><strong className="text-dark-text">Analyze usage patterns:</strong> Monitor site performance, identify technical issues, and optimize the user experience.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span><strong className="text-dark-text">Send newsletters:</strong> If you subscribe, we&apos;ll send periodic emails with financial education content. You can unsubscribe anytime.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span><strong className="text-dark-text">Respond to inquiries:</strong> If you contact us, we use your information to respond to your questions.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span><strong className="text-dark-text">Legal compliance:</strong> Meet legal obligations when required by law.</span>
            </li>
          </ul>
        </div>

        <div id="cookies">
          <h2 className="text-xl font-bold text-primary mb-4">3. Cookies & Tracking Technologies</h2>
          <p className="mb-4">
            Cookies are small text files placed on your device when you visit a website. They help sites
            remember your preferences and understand how you interact with the content.
          </p>

          <h3 className="text-base font-bold text-dark-text mb-2">Types of Cookies We Use</h3>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-3 pr-4 font-bold text-primary">Type</th>
                  <th className="text-left py-3 pr-4 font-bold text-primary">Purpose</th>
                  <th className="text-left py-3 font-bold text-primary">Duration</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b border-gray-50">
                  <td className="py-3 pr-4 font-semibold text-dark-text">Essential</td>
                  <td className="py-3 pr-4">Basic site functionality and security</td>
                  <td className="py-3">Session</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-3 pr-4 font-semibold text-dark-text">Analytics</td>
                  <td className="py-3 pr-4">Understand visitor behavior and site performance</td>
                  <td className="py-3">Up to 2 years</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold text-dark-text">Functional</td>
                  <td className="py-3 pr-4">Remember your preferences (e.g., calculator settings)</td>
                  <td className="py-3">Up to 1 year</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-base font-bold text-dark-text mb-2">Managing Cookies</h3>
          <p className="mb-3">
            You can control and disable cookies through your browser settings. Most browsers allow you to:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>View and delete existing cookies</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Block all or third-party cookies</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span>Set preferences for specific websites</span>
            </li>
          </ul>
          <p className="mt-3 text-sm text-gray-600">
            Note: Disabling cookies may affect some site functionality but will not impact calculator usage,
            as calculators process data entirely in your browser.
          </p>
        </div>

        <div id="third-party-services">
          <h2 className="text-xl font-bold text-primary mb-4">4. Third-Party Services</h2>
          <p className="mb-4">
            We use a limited number of trusted third-party services to operate Moolah IQ:
          </p>
          <ul className="space-y-4 ml-4">
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <div>
                <strong className="text-dark-text">Vercel (Hosting):</strong>
                <span> Our website is hosted on Vercel, which may collect standard server logs including IP addresses, request timestamps, and URLs visited. </span>
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent transition-colors underline">Vercel Privacy Policy</a>
              </div>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <div>
                <strong className="text-dark-text">Google Analytics (if enabled):</strong>
                <span> We may use Google Analytics to understand aggregate visitor behavior. This service collects anonymized usage data. </span>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent transition-colors underline">Google Privacy Policy</a>
              </div>
            </li>
          </ul>
          <p className="mt-4">
            We do not sell, rent, or share your personal information with third parties for marketing purposes.
          </p>
        </div>

        <div id="data-security">
          <h2 className="text-xl font-bold text-primary mb-4">5. Data Security</h2>
          <p className="mb-3">
            We take reasonable technical and organizational measures to protect any information we collect.
            Our website is served over HTTPS, ensuring encrypted communication between your browser and our servers.
          </p>
          <p className="mb-3">
            However, no method of transmission over the Internet or electronic storage is 100% secure.
            While we strive to protect your information, we cannot guarantee absolute security.
          </p>
          <p>
            <strong className="text-dark-text">We do not store sensitive financial information.</strong> All
            calculator inputs are processed locally in your browser and are never transmitted to or stored
            on our servers.
          </p>
        </div>

        <div id="your-rights">
          <h2 className="text-xl font-bold text-primary mb-4">6. Your Rights (GDPR & CCPA)</h2>
          <p className="mb-4">
            Depending on your location, you may have the following rights regarding your personal data:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span><strong className="text-dark-text">Right to Access:</strong> Request a copy of the personal data we hold about you.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span><strong className="text-dark-text">Right to Deletion:</strong> Request that we delete your personal data from our systems.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span><strong className="text-dark-text">Right to Opt-Out:</strong> Opt out of analytics tracking by disabling cookies or using browser privacy tools.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span><strong className="text-dark-text">Right to Portability:</strong> Request your data in a portable, machine-readable format.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold flex-shrink-0">-</span>
              <span><strong className="text-dark-text">Right to Correction:</strong> Request that we correct any inaccurate personal data.</span>
            </li>
          </ul>
          <p className="mt-4">
            To exercise any of these rights, please contact us at{" "}
            <a href="mailto:privacy@moolahiq.com" className="text-primary hover:text-accent transition-colors underline">
              privacy@moolahiq.com
            </a>. We will respond to your request within 30 days.
          </p>
        </div>

        <div id="childrens-privacy">
          <h2 className="text-xl font-bold text-primary mb-4">7. Children&apos;s Privacy</h2>
          <p className="mb-3">
            Moolah IQ is not intended for children under the age of 13. We do not knowingly collect
            personal information from children under 13 years of age.
          </p>
          <p>
            If you are a parent or guardian and believe your child has provided us with personal information,
            please contact us at{" "}
            <a href="mailto:privacy@moolahiq.com" className="text-primary hover:text-accent transition-colors underline">
              privacy@moolahiq.com
            </a>
            , and we will take steps to remove that information from our systems.
          </p>
        </div>

        <div id="changes">
          <h2 className="text-xl font-bold text-primary mb-4">8. Changes to This Policy</h2>
          <p className="mb-3">
            We may update this Privacy Policy from time to time to reflect changes in our practices,
            technology, or legal requirements. When we make material changes, we will update the
            &quot;Last updated&quot; date at the top of this page.
          </p>
          <p>
            We encourage you to review this policy periodically. Your continued use of Moolah IQ after
            any changes constitutes your acceptance of the updated policy.
          </p>
        </div>

        <div id="contact">
          <h2 className="text-xl font-bold text-primary mb-4">9. Contact Us</h2>
          <p className="mb-3">
            If you have questions, concerns, or requests regarding this Privacy Policy or your personal
            data, please reach out to us:
          </p>
          <div className="bg-light-bg rounded-xl border border-gray-100 p-5">
            <p className="text-sm">
              <strong className="text-dark-text">Email:</strong>{" "}
              <a href="mailto:privacy@moolahiq.com" className="text-primary hover:text-accent transition-colors underline">
                privacy@moolahiq.com
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
