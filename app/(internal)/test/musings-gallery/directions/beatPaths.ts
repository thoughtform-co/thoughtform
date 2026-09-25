import type { MusingBeat } from "@/lib/musings/cover";

/**
 * The Arc's three marks, at this lab's scale.
 *
 * ⚠ **THE LAB OWNS THEM NOW (ADR-122 U2).** They lived on
 * `components/landing/home-v2/musings/MusingOrbit.tsx` while the production
 * cover drew one at its centre; the owner's 2026-09-25 read took the mark off
 * that drawing ("less like a compass"), and a production module exporting a
 * constant only an internal route consumes is a seam pointing the wrong way.
 * ⚠ **COPIED FROM `rail-instruments/sectionGlyphs.tsx`, NOT IMPORTED**
 * (ADR-106's precedent): 24-unit box, `fill: none`, `stroke: currentColor`,
 * 1.5 stroke. The paths are byte-identical to the rail's on purpose — if one
 * changes, both should.
 * ⚠ **A NOTE WITH NO ARC TAG DRAWS NO MARK** — never a substitute.
 */
export const BEAT_PATHS: Readonly<Record<MusingBeat, readonly string[]>> = {
  /* A compass needle. */
  navigate: ["M12 3l4.5 14.5L12 14l-4.5 3.5Z", "M7 21h10"],
  /* Registration brackets closing on a lattice — judgment, crystallised. */
  encode: ["M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"],
  /* Offset strata — the layer, built on. */
  build: ["M7 6.5h13M4 12h13M7 17.5h13"],
};

/** `encode`'s lattice is the one filled figure in the set. */
export const ENCODE_CELLS =
  "M9 9h2.4v2.4H9zM12.8 9h2.4v2.4h-2.4zM9 12.8h2.4v2.4H9zM12.8 12.8h2.4v2.4h-2.4z";
