import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/intelligence-substrate-lab — look-dev for READING 03's drawing.
 *
 * Reading 02 is settled (ADR-070 U11–U14). This route asks the same question
 * one reading over, after the owner's read of the shipped substrate: the five
 * shapes at the bottom are drawn as CARDS, in the vocabulary this surface
 * reserves for a thing that runs, and a pattern is not one.
 *
 * Three directions, each making a different part of the hierarchy structural:
 *
 *   strata   a pattern is a SEAM — thickness is mass, eight department buses
 *            run straight down through the stack, a tap is a cell
 *   table    stop drawing the relation and tabulate it; the mass survives as
 *            a bar in the row header
 *   tree     Skill → pattern → reuse drawn as the tree it has always been,
 *            with departments repeated as leaves instead of wired as edges
 *
 * ⚠ THIS IS A MEASURING INSTRUMENT, NOT A PICTURE (the imlab law). The
 * readout walks every glyph box live — label-on-label collisions, crop
 * clipping, rendered type floors, canvas overflow — and
 * `scripts/capture-substrate-lab.mjs` runs the same gates across the matrix.
 * Author at the first preset; read the numbers.
 *
 * ⚠ AND ONE DEFECT IS ALREADY ON RECORD HERE. Production's reading 03 letters
 * `{n} SKILLS · {n} TEAMS`, which renders **8 TEAMS** for PATTERN — the exact
 * phrase `cases-registry`'s district guard names as its failure, because 8 is
 * the DEPARTMENT count while both published team counts mean something else.
 * It survives because that guard walks `CASES` and this string is composed in
 * a component. No variant here letters the word, and the fit test fails on it.
 *
 * No production file is modified by this route. Promotion — including
 * inheriting ADR-070 U12's elastic crop — is its own pass with its own ADR.
 *
 * Blocked from production by `proxy.ts` and `noindex`; auth handled by the
 * parent `(internal)/test` layout.
 */
export const metadata: Metadata = {
  title: "Intelligence Substrate Lab — three directions (Internal)",
  description:
    "Look-dev for the casefile map console's substrate reading: three higher-level hierarchy drawings beside the shipped crossing, at real console sizes.",
  robots: { index: false, follow: false },
};

export default function IntelligenceSubstrateLabLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
