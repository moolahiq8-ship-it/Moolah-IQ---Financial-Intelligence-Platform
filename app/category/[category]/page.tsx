import { Metadata } from "next";
import Link from "next/link";
import { getPostsByCategory, getAllCategories } from "@/lib/posts";
import { BlogScope } from "@/components/blog/BlogScope";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { adaptPost } from "@/lib/blog/adaptPost";

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
    <BlogScope>
      <nav className="mb-6 text-[13px] text-body">
        <Link href="/" className="hover:text-bgold-ink">
          Home
        </Link>{" "}
        /{" "}
        <Link href="/blog" className="hover:text-bgold-ink">
          Blog
        </Link>{" "}
        / <span className="text-ink">{category}</span>
      </nav>

      <h1 className="mb-8 font-blog-serif text-[40px] font-bold text-navy">
        {category} Articles
      </h1>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {posts.map((post) => (
            <ArticleCard key={post.slug} post={adaptPost(post)} />
          ))}
        </div>
      ) : (
        <p className="text-body">No posts in this category yet.</p>
      )}
    </BlogScope>
  );
}
