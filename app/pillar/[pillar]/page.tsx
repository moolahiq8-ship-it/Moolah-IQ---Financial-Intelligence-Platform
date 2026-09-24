import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts } from "@/lib/posts";
import { PILLARS, getPillar, pillarOf } from "@/lib/pillars";
import { BlogScope } from "@/components/blog/BlogScope";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { adaptPost } from "@/lib/blog/adaptPost";

// Pillar pages (2026-09-23): a grouping view over existing articles. The article
// categories and the /category/* routes are unchanged.

interface Props {
  params: { pillar: string };
}

export async function generateStaticParams() {
  return PILLARS.map((p) => ({ pillar: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pillar = getPillar(params.pillar);
  if (!pillar) return {};
  return { title: `${pillar.name} Articles`, description: pillar.description };
}

export default function PillarPage({ params }: Props) {
  const pillar = getPillar(params.pillar);
  if (!pillar) notFound();
  const posts = getAllPosts().filter((p) => pillarOf(p) === pillar.slug);

  return (
    <BlogScope>
      <nav className="mb-6 text-[13px] text-body">
        <Link href="/" className="hover:text-bgold-ink">
          Home
        </Link>{" "}
        /{" "}
        <Link href="/blog" className="hover:text-bgold-ink">
          Blog
        </Link>{" "}
        / <span className="text-ink">{pillar.name}</span>
      </nav>

      <h1 className="mb-3 font-blog-serif text-[40px] font-bold text-navy">{pillar.name}</h1>
      <p className="mb-8 max-w-2xl text-[16px] leading-relaxed text-body">{pillar.description}</p>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {posts.map((post) => (
            <ArticleCard key={post.slug} post={adaptPost(post)} />
          ))}
        </div>
      ) : (
        <p className="text-body">No articles here yet.</p>
      )}

      <p className="mt-10 text-[14px] text-body">
        Looking for something else?{" "}
        <Link href="/blog" className="font-bold text-bgold-ink hover:text-navy">
          Browse all articles
        </Link>
        , including earlier topics.
      </p>
    </BlogScope>
  );
}
