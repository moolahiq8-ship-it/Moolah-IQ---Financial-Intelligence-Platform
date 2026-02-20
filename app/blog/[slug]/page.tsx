import { Metadata } from "next";
import Link from "next/link";
import { getPostBySlug, getAllSlugs } from "@/lib/posts";
import TableOfContents from "@/components/TableOfContents";
import { notFound } from "next/navigation";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Add IDs to headings in HTML for TOC links
  const contentWithIds = post.content.replace(
    /<h([2-3])>(.*?)<\/h[2-3]>/g,
    (_, level, text) => {
      const id = text
        .replace(/<[^>]*>/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      return `<h${level} id="${id}">${text}</h${level}>`;
    }
  );

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-700 mb-6">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>{" "}
        /{" "}
        <Link href="/blog" className="hover:text-accent">
          Blog
        </Link>{" "}
        / <span className="text-dark-text">{post.title}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <Link
          href={`/category/${post.category.toLowerCase()}`}
          className="text-sm font-semibold bg-accent/10 text-accent px-3 py-1 rounded-full"
        >
          {post.category}
        </Link>
        <h1 className="text-4xl font-bold text-primary mt-4 mb-4">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-700">
          <span>{post.author}</span>
          <span>&middot;</span>
          <time dateTime={post.date}>{formattedDate}</time>
          <span>&middot;</span>
          <span>{post.readingTime}</span>
        </div>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-primary/60 bg-light-bg px-2 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Intelligence Brief */}
      {post.tldr && (
        <div className="mb-8 p-5 rounded-xl bg-primary/[0.03] border border-primary/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-gold to-accent" />
          <div className="flex items-center gap-2 mb-3 pl-4">
            <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6c0 2.04 1.02 3.84 2.57 4.93L6 18h8l-.57-5.07A5.97 5.97 0 0016 8a6 6 0 00-6-6zm-1 14h2v1H9v-1z" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Intelligence Brief</span>
          </div>
          <p className="text-sm text-dark-text/80 leading-relaxed pl-4">{post.tldr}</p>
        </div>
      )}

      {/* Table of Contents */}
      <TableOfContents content={post.content} />

      {/* Post Content */}
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: contentWithIds }}
      />

      {/* Back link */}
      <div className="mt-12 pt-8 border-t border-gray-100">
        <Link
          href="/blog"
          className="text-accent hover:text-primary font-medium transition-colors"
        >
          &larr; Back to all posts
        </Link>
      </div>
    </article>
  );
}
