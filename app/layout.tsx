import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollProgress from "@/components/ScrollProgress";

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: {
    default: "Moolah IQ — Smart Money Insights",
    template: "%s | Moolah IQ",
  },
  description:
    "Practical personal finance tips on budgeting, investing, saving, and building wealth. No jargon, no fluff.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      { url: "/favicon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Moolah IQ — Smart Money Insights",
    description:
      "Practical personal finance tips on budgeting, investing, saving, and building wealth.",
    type: "website",
    locale: "en_US",
    siteName: "Moolah IQ",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${playfair.variable} flex flex-col min-h-screen`}>
      {/* Pinterest Tag */}
            <Script id="pinterest-tag" strategy="afterInteractive">
              {`
                !function(e){if(!window.pintrk){window.pintrk = function () {
                window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
                n=window.pintrk;n.queue=[],n.version="3.0";var
                t=document.createElement("script");t.async=!0,t.src=e;var
                r=document.getElementsByTagName("script")[0];
                r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
                pintrk('load', '2614300006478');
                pintrk('page');
              `}
            </Script>
            <noscript>
              <img height="1" width="1" style={{display:'none'}} alt=""
                src="https://ct.pinterest.com/v3/?event=init&tid=2614300006478&noscript=1" />
            </noscript>
        <ScrollProgress />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
