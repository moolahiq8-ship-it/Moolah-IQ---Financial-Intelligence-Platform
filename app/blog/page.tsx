import { getAllPosts } from "@/lib/posts";
import { BlogScope } from "@/components/blog/BlogScope";
import BlogClient from "./BlogClient";

export const metadata = {
  title: "Blog",
  description: "Browse all Moolah IQ articles: trading and investing, protecting what matters, and making your finances work more efficiently.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <BlogScope>
      <BlogClient posts={posts} />
    </BlogScope>
  );
}
