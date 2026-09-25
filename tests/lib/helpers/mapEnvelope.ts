/**
 * The Intelligence Map's confidentiality envelope, as the phone projections
 * walk it. One copy, two readers: `pda-phone-readings.test.ts` (production's
 * phone lists) and `map-phone-lab.test.ts` (the look-dev directions). A lab
 * page sits outside every content scanner, so it takes the same envelope as
 * the surface it may replace, never a looser one of its own.
 *
 * The casefile's wider envelope is `cases-registry.test.ts`; the map's is
 * stricter on names and vendors by design (`.claude/rules/proof.md`).
 */

export const MODEL_FAMILIES = /\b(opus|sonnet|haiku|fable|gpt|gemini|llama|mistral|claude)\b/i;

export const ENVELOPE: readonly [string, RegExp][] = [
  ["money", /[€$£¥]|\b(USD|EUR|GBP)\b|\b\d{1,3}(,\d{3})+\b/],
  ["a source URL", /\b(monday|notion|github|figma)\.com\b/i],
  ["a model family", MODEL_FAMILIES],
  ["a vendor or private system", /\b(openai|anthropic|supabase|slack|aether|salesforce)\b/i],
  ["a personal name", /\b(Vince|Astrid|Nathan|Koen|Olga|Helen|Damien|Robert|Toby|Maud)\b/],
];

/** The first envelope rule a string breaks, or null. */
export function envelopeBreach(text: string): string | null {
  for (const [what, re] of ENVELOPE) if (re.test(text)) return what;
  return null;
}
