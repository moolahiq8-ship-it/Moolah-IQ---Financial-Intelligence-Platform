import { Metadata } from "next";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import { getPostsByCategory, getAllCategories } from "@/lib/posts";

interface Props {
  params: { category: string };
}

const categoryDescriptions: Record<string, string> = {
  earn: "Strategies to grow your income through careers, side hustles, freelancing, and salary negotiation.",
  spend: "Smart budgeting techniques, mindful spending habits, and ways to make every dollar count.",
  save: "High-yield savings accounts, emergency funds, and goal-based saving strategies.",
  invest: "Stock market fundamentals, index funds, retirement accounts, and compound growth.",
  optimize: "Tax planning, credit score improvement, debt payoff strategies, and financial fine-tuning.",
  protect: "Insurance essentials, estate planning, fraud prevention, and wealth protection.",
  milestones: "Financial guidance for life's big moments — buying a home, starting a family, and retirement.",
  legacy: "Generational wealth building, charitable giving, and long-term financial planning.",
};

export async function generateStaticParams() {
  return getAllCategories().map((cat) => ({
    category: cat.toLowerCase(),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category =
    params.category.charAt(0).toUpperCase() + params.category.slice(1);
  const description =
    categoryDescriptions[params.category.toLowerCase()] ||
    `Browse all Moolah IQ articles about ${category}.`;
  return {
    title: `${category} Articles`,
    description,
  };
}

export default function CategoryPage({ params }: Props) {
  const category =
    params.category.charAt(0).toUpperCase() + params.category.slice(1);
  const posts = getPostsByCategory(params.category);

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <nav className="text-sm text-gray-600 mb-6">
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
        <p className="text-gray-700">No posts in this category yet.</p>
      )}
    </section>
  );
}
