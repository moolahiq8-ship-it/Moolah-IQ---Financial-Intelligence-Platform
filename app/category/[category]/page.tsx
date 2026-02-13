import { Metadata } from "next";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import { getPostsByCategory, getAllCategories } from "@/lib/posts";

interface Props {
  params: { category: string };
}

export async function generateStaticParams() {
  return getAllCategories().map((cat) => ({
    category: cat.toLowerCase(),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category =
    params.category.charAt(0).toUpperCase() + params.category.slice(1);
  return {
    title: `${category} Articles`,
    description: `Browse all Moolah IQ articles about ${category}.`,
  };
}

export default function CategoryPage({ params }: Props) {
  const category =
    params.category.charAt(0).toUpperCase() + params.category.slice(1);
  const posts = getPostsByCategory(params.category);

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>{" "}
        /{" "}
        <Link href="/blog" className="hover:text-accent">
          Blog
        </Link>{" "}
        / <span className="text-dark-text">{category}</span>
      </nav>

      <h1 className="text-4xl font-bold text-primary mb-8">
        {category} Articles
      </h1>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No posts in this category yet.</p>
      )}
    </section>
  );
}
