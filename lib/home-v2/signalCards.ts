/**
 * signalCards — content for the "billions on the same layer" news
 * cards that orbit the gimbal sphere during the depth-corridor
 * epilogue beat (ADR-018, epilogue extension).
 *
 * Ported from the Aether repo's `signalSection.cards` so the same
 * four labs-validation receipts (Palantir invented the FDE pattern;
 * Stripe adopted it; OpenAI and Anthropic capitalised it) appear
 * here in 3D form, painted onto canvas-textured planes and
 * orbiting the substrate sphere. Each card carries a source
 * `href` so a click opens the underlying article in a new tab.
 *
 * Authoring rules:
 *   - 4 cards exactly. The orbit ring math (`ShellNewsOrbit`)
 *     spreads them on equal-arc segments; adding/removing entries
 *     just re-spreads the ring.
 *   - `mark` is the publication/company wordmark — drawn as the
 *     top-left identity stamp on the card face.
 *   - `corner` is the gold accent stamp at the top-right (year /
 *     deal size). Short and uppercase.
 *   - `kicker` is the row above the headline (uppercase, dim).
 *   - `headline` is the load-bearing claim. 1–2 lines on the card.
 *   - `byline` is "source · date", drawn beneath the headline as
 *     metadata. Plain sentence case is fine.
 *   - `href` opens in a new tab. Always include rel=noopener on
 *     the consumer side (`ShellNewsOrbit` does this).
 */

export interface SignalCardData {
  /** Stable id, matches the Aether `SignalCardTone`. */
  id: "palantir" | "stripe" | "openai" | "anthropic";
  /** Identity stamp (publication / company wordmark). */
  mark: string;
  /** Top-right gold accent — year, $ figure, or short tag. */
  corner: string;
  /** Eyebrow above the headline (uppercase, dim). */
  kicker: string;
  /** Load-bearing headline (1–2 lines). */
  headline: string;
  /** Source attribution beneath the headline. */
  byline: string;
  /** External URL — opens in a new tab on card click. */
  href: string;
}

export const SIGNAL_CARDS: readonly SignalCardData[] = [
  {
    id: "palantir",
    mark: "Palantir",
    corner: "2010s",
    kicker: "Origin · The FDE Pattern",
    headline: "The role every AI lab is now copying.",
    byline: "Palantir · FDE program",
    href: "https://www.palantir.com/careers/forward-deployed-engineer/",
  },
  {
    id: "stripe",
    mark: "/stripe",
    corner: "2026",
    kicker: "Hiring · Forward Deployed",
    headline: "Stripe creates a role that did not exist a year ago.",
    byline: "@andruyeung · via X",
    href: "https://www.wsj.com/articles/ai-startups-have-a-new-old-secret-weapon-forward-deployed-engineers-d18ee609",
  },
  {
    id: "openai",
    mark: "OpenAI",
    corner: "$10B",
    kicker: "Press release · May 2026",
    headline: "OpenAI launches the Deployment Company.",
    byline: "openai.com · May 2026",
    href: "https://openai.com/index/openai-launches-the-deployment-company/",
  },
  {
    id: "anthropic",
    mark: "Anthropic",
    corner: "$1.5B",
    kicker: "Bloomberg · Enterprise",
    headline: "Anthropic's $1.5B answer.",
    byline: "Bloomberg · enterprise track",
    href: "https://www.wsj.com/business/deals/anthropic-nears-1-5-billion-joint-venture-with-wall-street-firms-8f5448ee",
  },
] as const;
