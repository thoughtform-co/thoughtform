/**
 * skillSymbol — the two-to-four character mark a Skill wears on its tile in
 * the Intelligence Map lattice (ADR-056 U15).
 *
 * The lattice reads as a periodic table, and a periodic table's symbols are
 * CURATED, not merely derived: the derivation below gets ~45 of the 47 right
 * and the rest are named in `OVERRIDES`. A symbol that repeats would put two
 * different Skills under one mark, so `cases-registry.test.ts` pins
 * uniqueness — a new Skill that collides fails a test instead of silently
 * shadowing an existing one.
 *
 * Rules, in order:
 *   1. An explicit override wins.
 *   2. A LEADING ACRONYM stands alone — "NDA Pre-Check" is NDA, not NP.
 *      That is what makes these guessable rather than cryptic.
 *   3. Otherwise the initials of the significant words, at most three.
 *
 * Pure and import-free on purpose: the test imports it, and the casefile
 * bundle should not pay for a lookup table it can compute.
 */

/** Words that never earn an initial. */
const STOP = /^(the|of|and|a|to|for|in|on)$/i;

/** A leading token already read as an acronym — used whole. */
const ACRONYM = /^[A-Z0-9]{2,4}$/;

/**
 * Hand-set marks. Keep this list SHORT and justify each one:
 *   · Loop Packaging System would derive LPS, which Loop Paid Social already
 *     holds. PKG is what the artwork pipeline is called anyway.
 *   · Localization derives to a bare "L" — one character reads as a bullet,
 *     not a mark.
 */
const OVERRIDES: Record<string, string> = {
  "Loop Packaging System": "PKG",
  Localization: "LOC",
};

export function skillSymbol(name: string): string {
  const override = OVERRIDES[name];
  if (override) return override;

  const words = name.split(/[\s/&]+/).filter((w) => w && !STOP.test(w));
  const head = words[0];
  if (head && ACRONYM.test(head)) return head;

  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
