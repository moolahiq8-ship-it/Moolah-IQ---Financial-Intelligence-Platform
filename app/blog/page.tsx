import { getAllPosts, getAllCategories } from "@/lib/posts";
import BlogClient from "./BlogClient";

export const metadata = {
  title: "Blog",
  description: "Browse all Moolah IQ articles on budgeting, investing, saving, and personal finance.",
};

export default function BlogPage() {
  const posts = getAllPosts();
  const categories = getAllCategories();

  return <BlogClient posts={posts} categories={categories} />;
}
