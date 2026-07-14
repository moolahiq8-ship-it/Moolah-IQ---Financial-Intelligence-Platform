import { getAllPosts, getAllCategories } from "@/lib/posts";
import { BlogScope } from "@/components/blog/BlogScope";
import BlogClient from "./BlogClient";

export const metadata = {
  title: "Blog",
  description: "Browse all Moolah IQ articles on budgeting, investing, saving, and personal finance.",
};

export default function BlogPage() {
  const posts = getAllPosts();
  const categories = getAllCategories();

  return (
    <BlogScope>
      <BlogClient posts={posts} categories={categories} />
    </BlogScope>
  );
}
