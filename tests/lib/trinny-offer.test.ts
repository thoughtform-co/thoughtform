import { describe, expect, it } from "vitest";

import { TRINNY_OFFER_SECTIONS } from "@/app/(marketing)/trinny-london/offer/offerSections";
import { PROPOSAL_COPY_BANS, scanStrings } from "@/lib/arcs/copyLaw";

/**
 * The Trinny pitch page's offer (ADR-094 U9) — the proposal's beats after
 * the configuration, rendered by the arcs' components over a route-local
 * record. It is OUTSIDE `ARCS`, so nothing in `arcs-registry` sees it;
 * this is the same copy law, walked over the same shape of record.
 */
describe("trinny-london offer (ADR-094 U9)", () => {
  it("holds the proposal's client-facing copy law", () => {
    const offenders: string[] = [];
    scanStrings(TRINNY_OFFER_SECTIONS, "offer", (value, path) => {
      for (const [pattern, what] of PROPOSAL_COPY_BANS) {
        if (pattern.test(value)) offenders.push(`${path}: ${what}`);
      }
    });
    expect(offenders).toEqual([]);
  });

  it("carries no noun of the client it was copied from", () => {
    /* The record is the Suri proposal's with the client's nouns swapped —
       placeholder copy by the owner's own instruction, to be rewritten.
       A swap is only a swap if nothing of the other client survived it:
       a Trinny page that says "Suri" once is not a placeholder, it is the
       wrong client's proposal. */
    const leaks: string[] = [];
    scanStrings(TRINNY_OFFER_SECTIONS, "offer", (value, path) => {
      if (/\bSuri\b|\bKate\b|\bMark\b|\bNick\b/.test(value)) leaks.push(path);
    });
    expect(leaks).toEqual([]);
  });

  it("uses only the kinds the offer mount dispatches, with unique ids", () => {
    /* `TrinnyOffer.tsx` switches over `list-groups` and `cards` and renders
       nothing for any other kind — deliberately, to keep the arcs' heavier
       kinds (the dossier console, the holo program) off this route. A beat
       authored in another kind would vanish silently, and this is the
       failure that says so. */
    const kinds = new Set(TRINNY_OFFER_SECTIONS.map((s) => s.kind));
    for (const kind of kinds) expect(["list-groups", "cards"]).toContain(kind);
    const ids = TRINNY_OFFER_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    // The phases are PLATES and the fee is a LEDGER — the two drawings this
    // pass exists for (ADR-098 U2).
    const phases = TRINNY_OFFER_SECTIONS.find((s) => s.id === "phases");
    expect(phases?.kind === "list-groups" && phases.layout).toBe("plates");
    const pricing = TRINNY_OFFER_SECTIONS.find((s) => s.id === "pricing");
    expect(pricing?.kind === "cards" && pricing.ledger?.columns).toEqual(["Phase", "What", "Fee"]);
  });
});
