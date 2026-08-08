import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/intelligence-config-lab — look-dev for the CONFIGURATION reading's
 * DRAWING, beside the one that ships.
 *
 * ADR-069 shipped the selection morph and the answered modules, and the
 * owner's verdict was that the MOTION is right while the DRAWING still reads
 * like the old four-modules-plus-core. The brief (2026-08-08, with two
 * CP2077 UI references): different SHAPES per configuration part, different
 * ways of CONNECTING them — motherboards, nodes, retrofuturistic instruments
 * — and the substrate drawn as what it is, a CLUSTERING of skills by shape.
 *
 * Four archetypes hang beside the shipped reading, all drawn from the LIVE
 * record inside the REAL console chrome (`ConsoleFrame` + `ConsoleRail` +
 * the `--pda-*` palette), so what is judged is a drawing in its housing, not
 * a mood board:
 *
 *   die        the work docked in a socket; parts as package types; the
 *              substrate as the ground plane, clustered by shape — with the
 *              47 skillSymbol marks' first-ever render
 *   chain      inherits IN → work + skill⇄lane → GATE → surfaces OUT; the
 *              substrate as a patch bay; chain neighbours at the edges
 *   section    a vertical cutaway; authority above, machine in the middle,
 *              the five shapes as strata below grade
 *   schematic  symbol-per-part circuit diagram with named orthogonal nets
 *              and the substrate as five power rails
 *
 * ⚠ THIS IS A MEASURING INSTRUMENT, NOT A PICTURE (the imlab law). The
 * readout walks every glyph box live: label-on-label collisions, crop
 * clipping, rendered type floors, canvas overflow. Author at the first
 * preset; read the numbers. `scripts/capture-config-lab.mjs` runs the same
 * gates across the whole matrix and fails loudly.
 *
 * No production file is modified by this route. Promotion of a winning
 * archetype — including re-pointing the ADR-069 flight's dock at its new
 * core — is its own pass, with its own ADR.
 *
 * Blocked from production by `proxy.ts` and `noindex`; auth handled by the
 * parent `(internal)/test` layout.
 */
export const metadata: Metadata = {
  title: "Intelligence Configuration Lab — four archetypes (Internal)",
  description:
    "Look-dev for the casefile map console's configuration reading: die, signal chain, cutaway and schematic archetypes beside the shipped drawing, at real console sizes.",
  robots: { index: false, follow: false },
};

export default function IntelligenceConfigLabLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
