import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const postsDirectory = path.join(process.cwd(), "content", "posts");

export type IqLevel = "Foundational IQ" | "Market IQ" | "Strategic IQ" | "Alpha IQ";

export interface PostFrontmatter {
  title: string;
  date: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImage?: string;
  iqLevel: IqLevel;
  iqScore: number;
  author: string;
  slug: string;
  readingTime: string;
  tldr?: string;
}

export interface Post extends PostFrontmatter {
  content: string;
}

function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

export function getAllPosts(): PostFrontmatter[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const posts = fileNames
    .filter((name) => name.endsWith(".md"))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title || slug,
        date: data.date || new Date().toISOString(),
        excerpt: data.excerpt || "",
        category: data.category || "General",
        tags: data.tags || [],
        coverImage: data.coverImage,
        iqLevel: data.iqLevel || "Foundational IQ",
        iqScore: data.iqScore || 100,
        author: data.author || "Moolah IQ",
        readingTime: calculateReadingTime(content),
        tldr: data.tldr,
      } as PostFrontmatter;
    });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  return {
    slug,
    title: data.title || slug,
    date: data.date || new Date().toISOString(),
    excerpt: data.excerpt || "",
    category: data.category || "General",
    tags: data.tags || [],
    coverImage: data.coverImage,
    iqLevel: data.iqLevel || "Foundational IQ",
    iqScore: data.iqScore || 100,
    author: data.author || "Moolah IQ",
    readingTime: calculateReadingTime(content),
    tldr: data.tldr,
    content: contentHtml,
  };
}

export function getPostsByCategory(category: string): PostFrontmatter[] {
  return getAllPosts().filter(
    (post) => post.category.toLowerCase() === category.toLowerCase()
  );
}

export function getAllCategories(): string[] {
  const posts = getAllPosts();
  const categories = new Set(posts.map((post) => post.category));
  return Array.from(categories).sort();
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  return fs
    .readdirSync(postsDirectory)
    .filter((name) => name.endsWith(".md"))
    .map((name) => name.replace(/\.md$/, ""));
}
