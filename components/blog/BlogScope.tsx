import { Spectral, Libre_Franklin } from "next/font/google";

// v2 blog scope: loads the two blog fonts and paints the cream ground + 1200px
// container + top accent hairline. Wrap ONLY the blog listing and category pages
// with this — deliberately NOT the article detail page (/blog/[slug]) or the rest
// of the site, so nothing bleeds. Static tokens (cream/navy/bgold/…) come from
// tailwind.config; per-category colours from lib/blog/theme.
const spectral = Spectral({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-spectral",
  display: "swap",
});
const libre = Libre_Franklin({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-libre",
  display: "swap",
});

export function BlogScope({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${spectral.variable} ${libre.variable} bg-cream font-blog-sans text-ink`}>
      {/* top 4px accent hairline (Spec §1.6) */}
      <div
        className="h-1 w-full"
        style={{ background: "linear-gradient(90deg,#17a06a,#1c9ba0 45%,#c08a2d)" }}
      />
      <div className="mx-auto max-w-container px-8 pb-[88px] pt-[52px]">{children}</div>
    </div>
  );
}
