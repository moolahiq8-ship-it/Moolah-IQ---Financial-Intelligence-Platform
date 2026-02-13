import Fuse from "fuse.js";
import { PostFrontmatter } from "./posts";

export function createSearchIndex(posts: PostFrontmatter[]) {
  return new Fuse(posts, {
    keys: [
      { name: "title", weight: 2 },
      { name: "excerpt", weight: 1.5 },
      { name: "category", weight: 1 },
      { name: "tags", weight: 1 },
    ],
    threshold: 0.3,
    includeScore: true,
  });
}
