"use client";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents({ content }: { content: string }) {
  // Extract headings from HTML content
  const headingRegex = /<h([2-3])[^>]*>(.*?)<\/h[2-3]>/g;
  const headings: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const text = match[2].replace(/<[^>]*>/g, "");
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    headings.push({ id, text, level: parseInt(match[1]) });
  }

  if (headings.length === 0) return null;

  return (
    <nav className="bg-light-bg rounded-xl p-5 mb-8">
      <h3 className="font-semibold text-primary mb-3 text-sm uppercase tracking-wide">
        Table of Contents
      </h3>
      <ul className="space-y-1.5">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "ml-4" : ""}>
            <a
              href={`#${h.id}`}
              className="text-sm font-semibold text-dark-text hover:text-accent transition-colors"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
