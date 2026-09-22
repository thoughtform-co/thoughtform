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

/**
 * What the HOMEPAGE's musings rack is given (ADR-119).
 *
 * ⚠ **IT EXISTS TO LEAVE `body` BEHIND.** The rack is a client component in a
 * nested root on the landing route, so whatever it receives is serialised
 * into the page's payload — and `body` is the post's entire MDX source. The
 * landing's import doctrine keeps three.js and Supabase off the anonymous
 * path; shipping every word of every post to a surface that letters a
 * one-sentence summary would be the same defect in content rather than code.
 *
 * `cardsFor()` in `lib/musings/cards.ts` is the one place the projection is
 * made, so no caller can widen it by accident.
 */
export interface MusingCardData {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: readonly string[];
  readingMinutes: number;
}
