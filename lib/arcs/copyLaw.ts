/**
 * lib/arcs/copyLaw — the client-facing copy law a proposal holds (ADR-098,
 * lifted out of the registry test by ADR-098 U2).
 *
 * A proposal is read by the person being asked to buy it, so the deck's own
 * law applies to every string on the page: say the behaviour, never the
 * house's word for it. The fleet's vocabulary is internal and must not leak
 * onto a client's page; `—` is banned by the deck's copy law and would be
 * the one character on the surface nobody chose; a `[bracket]` is a
 * scaffold placeholder that was never filled.
 *
 * ⚠ IT LIVES HERE, NOT IN A TEST, BECAUSE TWO SURFACES READ IT. The
 * registry test walks every `format: "proposal"` arc; the Trinny pitch
 * page's offer (`app/(marketing)/trinny-london/offer/`) is the same beats
 * OUTSIDE the registry, and a law that only one of its two readers could
 * import would be enforced on one page and assumed on the other.
 *
 * Zero imports, like the rest of `lib/arcs`.
 */
export const PROPOSAL_COPY_BANS: readonly (readonly [RegExp, string])[] = [
  [/self-sufficient/i, "says the word instead of the behaviour"],
  [/armada/i, "fleet vocabulary"],
  [/callsign/i, "fleet vocabulary"],
  [/harvest/i, "fleet vocabulary"],
  [/the wave|wave one/i, "fleet vocabulary"],
  [/—/, "em dash"],
  [/\[(?!Next team)[^\]]+\]/, "an unfilled scaffold placeholder"],
];

/**
 * The hero's measure: the homepage hero's own, for every arc.
 *
 * The owner, 2026-09-27, on the Plopsa workshop's hero: "the hero section
 * text should be much more concise. That should be a uniform rule." The
 * homepage is the measure because the arc hero IS the homepage hero
 * (ADR-075): its tagline is 37 characters, its description one sentence of
 * 113. Measured at 1280×720 before the rule, a 49-character title set four
 * lines and the ledes ran five to nine lines of mono capitals; the one
 * lede already in measure (107 characters, one sentence) set three.
 *
 * A title is at most 40 characters as it reads (`arcTitleText`), a lede one
 * sentence of at most 120. Who the page is from and for belongs to the
 * eyebrow and the sections, never to the lede.
 */
export const HERO_MEASURE = { title: 40, lede: 120 } as const;

/** What a hero breaks of `HERO_MEASURE`, one line per fault. */
export function heroMeasureFaults(title: string, lede: string): string[] {
  const faults: string[] = [];
  if (title.length > HERO_MEASURE.title) {
    faults.push(`title is ${title.length} characters, the measure is ${HERO_MEASURE.title}`);
  }
  if (lede.length > HERO_MEASURE.lede) {
    faults.push(`lede is ${lede.length} characters, the measure is ${HERO_MEASURE.lede}`);
  }
  // A sentence ends at . ! or ? followed by a space and a capital; a
  // decimal, an abbreviation mid-sentence or a closing full stop do not.
  const sentences = lede.split(/(?<=[.!?])\s+(?=\p{Lu})/u).length;
  if (sentences > 1) faults.push(`lede is ${sentences} sentences, the measure is one`);
  return faults;
}

/** Walk every string in a record, reporting a dotted path for each. */
export function scanStrings(
  value: unknown,
  path: string,
  visit: (value: string, path: string) => void
): void {
  if (typeof value === "string") visit(value, path);
  else if (Array.isArray(value)) value.forEach((v, i) => scanStrings(v, `${path}[${i}]`, visit));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) scanStrings(v, `${path}.${k}`, visit);
  }
}
