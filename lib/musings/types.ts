/**
 * lib/musings/types — a post (ADR-114). Zero imports.
 *
 * A musing is a FILE: `content/musings/<slug>.mdx` with this frontmatter
 * and an MDX body. The registry reads the folder; the renderer compiles the
 * body; nothing here is authored twice.
 */
export interface MusingPost {
  /** The filename without `.mdx` — kebab-case, unique; the route segment. */
  slug: string;
  /** A NAME, not an aphorism (the copy law). */
  title: string;
  /** ISO `YYYY-MM-DD`. */
  date: string;
  /** One sentence for the index and the metadata column. */
  summary: string;
  tags: readonly string[];
  author: string;
  /** A draft is reachable by URL and noindexed, listed in development only. */
  draft: boolean;
  /** One of the two framed features on the index. */
  featured: boolean;
  /** Slugs of posts to show as related; resolved by the registry. */
  related: readonly string[];
  /** A figure for the index frame; absent means the house's generative mark. */
  figure?: { src: string; alt: string; width: number; height: number };
  /** `max(1, round(words / 220))`. */
  readingMinutes: number;
  /** The MDX source, frontmatter stripped. */
  body: string;
}
