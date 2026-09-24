import type { MusingCardData } from "@/lib/musings/types";

/**
 * Seven PLACEHOLDER records for the musings row's look-dev (ADR-121).
 *
 * ⚠ **THESE LIVE HERE AND NOWHERE ELSE.** The site is live: a `draft: false`
 * file in `content/musings/` publishes a page and a sitemap row, and the
 * landing's three real posts are what ships. This lab exists so the row can be
 * designed at five (and three, and seven) while the writing track produces the
 * real notes — the owner's ask, 2026-09-23. `/test/*` is proxy-blocked in
 * production, so nothing here can reach a reader.
 *
 * The records are REAL-SHAPED: titles that are names (the copy law), one
 * sentence each in the house register, tags spread over the three Arc beats so
 * every glyph draws, dates spread over the year so the cover's lit mark walks
 * the axis, reading times varied so the kicker is not one string five times.
 * Newest first, as `cardsFor()` hands them to the landing.
 */
export const LAB_MUSINGS: readonly MusingCardData[] = [
  {
    slug: "the-seat-decides-the-lane",
    title: "The seat decides the lane",
    date: "2026-09-21",
    summary:
      "Which lane a piece of work runs in is a question about who owns the outcome, not about the model. The seat comes first and the lane follows it.",
    tags: ["navigate", "practice"],
    readingMinutes: 4,
    author: "Vince Buyssens",
  },
  {
    slug: "what-a-skill-actually-encodes",
    title: "What a skill actually encodes",
    date: "2026-08-03",
    summary:
      "A skill is not a prompt with a name. It is the judgment a team already exercises, written down once so the model can be held to it.",
    tags: ["encode", "practice"],
    readingMinutes: 6,
    author: "Vince Buyssens",
  },
  {
    slug: "software-for-the-few",
    title: "Software for the few",
    date: "2026-06-17",
    summary:
      "The tools worth building are the ones only your team would use. A briefing agent for one studio does more than a platform for everyone.",
    tags: ["build", "practice"],
    readingMinutes: 5,
    author: "Vince Buyssens",
  },
  {
    slug: "reading-the-spend-as-work",
    title: "Reading the spend as work",
    date: "2026-04-28",
    summary:
      "A token bill is a record of what the organisation asked for. Read it as work shape and it tells you which teams are thinking with the layer.",
    tags: ["navigate", "practice"],
    readingMinutes: 3,
    author: "Vince Buyssens",
  },
  {
    slug: "the-context-is-the-product",
    title: "The context is the product",
    date: "2026-03-09",
    summary:
      "Most of the value in a configured workflow sits in the material it reaches for. Encoding that material is the work; the prompt is the receipt.",
    tags: ["encode", "practice"],
    readingMinutes: 7,
    author: "Vince Buyssens",
  },
  {
    slug: "owning-the-loop",
    title: "Owning the loop",
    date: "2026-01-26",
    summary:
      "A team that owns its loops can swap the model underneath in an afternoon. A team that owns a subscription waits for the vendor.",
    tags: ["build", "practice"],
    readingMinutes: 4,
    author: "Vince Buyssens",
  },
  {
    slug: "the-first-beat-of-the-arc",
    title: "The first beat of the Arc",
    date: "2025-11-12",
    summary:
      "Automation is the last beat of the Arc, not the first. Teams that skip to it inherit a workflow nobody in the room understood.",
    tags: ["navigate", "practice"],
    readingMinutes: 5,
    author: "Vince Buyssens",
  },
];
