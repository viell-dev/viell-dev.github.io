import { createContentLoader, type ContentData } from "vitepress";

interface PostFrontmatter {
  title?: string;
  date?: string;
  description?: string;
  /** Kebab-case topic, e.g. "game-review". Not rendered yet; reserved for future organisation. */
  category?: string;
  draft?: boolean;
}

export interface PostEntry {
  title: string;
  href: string;
  date: {
    time: number;
    iso: string;
    /** Day and month, e.g. "18 July". Year is shown by the list's grouping. */
    formatted: string;
    year: number;
  };
  description?: string;
  /** Kebab-case topic, e.g. "game-review". Not rendered yet; reserved for future organisation. */
  category?: string;
}

declare const data: PostEntry[];
export { data };

/**
 * Posts are named `YYYY-MM-DD-slug.md` so they sort chronologically in the
 * repo; that filename date is the post date. A frontmatter `date` overrides it.
 */
const dateInUrl = /\/(\d{4}-\d{2}-\d{2})-[^/]*$/;

function postDate(page: ContentData): PostEntry["date"] {
  const frontmatter = page.frontmatter as PostFrontmatter;
  return entryDate(
    frontmatter.date ?? dateInUrl.exec(page.url)?.[1] ?? "1970-01-01",
  );
}

function entryDate(raw: string): PostEntry["date"] {
  const date = new Date(raw);
  return {
    time: date.getTime(),
    iso: date.toISOString().slice(0, 10),
    formatted: date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
    }),
    year: date.getUTCFullYear(),
  };
}

export default createContentLoader("blog/posts/*.md", {
  transform(pages): PostEntry[] {
    return pages
      .filter((page) => !(page.frontmatter as PostFrontmatter).draft)
      .map((page): PostEntry => {
        const frontmatter = page.frontmatter as PostFrontmatter;
        return {
          title: frontmatter.title ?? page.url,
          href: page.url,
          date: postDate(page),
          description: frontmatter.description,
          category: frontmatter.category,
        };
      })
      .sort((a, b) => b.date.time - a.date.time);
  },
});
