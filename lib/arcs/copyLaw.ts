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
