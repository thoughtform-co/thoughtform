import type { CSSProperties } from "react";

import { coverSpec, type MusingBeat } from "@/lib/musings/cover";

/**
 * A post's drawn cover (ADR-119) — the card's thumbnail, and the owner's
 * ruling that it is drawn in code rather than photographed or generated.
 *
 * Three readings, all off the record: the Arc beat the post belongs to (its
 * own tag), where in its year it was filed (a mark on a baseline, the arcs
 * instrument's idiom), and a substrate whose pitch is seeded off the slug so
 * two covers of one beat are not one picture. `lib/musings/cover.ts` resolves
 * all of it; this file only draws.
 *
 * ⚠ **THE GLYPH GRAMMAR IS COPIED FROM `rail-instruments/sectionGlyphs.tsx`,
 * NOT IMPORTED** — 24-unit box, `fill: none`, `stroke: currentColor`, 1.5
 * stroke. ADR-106's precedent: those three drawings MEAN Navigate / Encode /
 * Build, which is exactly what they mean here, so reusing the drawing is
 * right — but the rail authors them at 16px and this draws at ~5×, and a
 * station importing the frame's chrome is a dependency in the wrong
 * direction. The paths are byte-identical to the rail's on purpose: if one
 * changes, both should.
 *
 * ⚠ **NOTHING IS LETTERED HERE.** The date is a MARK, not a numeral — the
 * card's own kicker prints it, and a figure said twice on one card is what
 * this surface has removed a console head, a foot and a designator for.
 */

/** Byte-identical to the rail's, at this drawing's scale. Exported for the
 *  gallery lab (`/test/musings-gallery`), which draws the same three marks. */
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

export function MusingCover({
  slug,
  date,
  tags,
}: {
  slug: string;
  date: string;
  tags: readonly string[];
}) {
  const spec = coverSpec({ slug, date, tags });

  return (
    <div
      className="mu-cover"
      aria-hidden="true"
      style={{ "--mu-cover-pitch": `${spec.pitch}px` } as CSSProperties}
    >
      {/* The substrate. A dot field at the seeded pitch — CSS, so it costs no
          node and re-tints with the theme by construction. */}
      <span className="mu-cover__field" />

      {spec.beat ? (
        <svg
          className="mu-cover__beat"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
          focusable="false"
        >
          {BEAT_PATHS[spec.beat].map((d) => (
            <path key={d} d={d} />
          ))}
          {spec.beat === "encode" ? (
            <path fill="currentColor" stroke="none" d={ENCODE_CELLS} />
          ) : null}
        </svg>
      ) : null}

      {/* The plot: one baseline, the record's own mark lit, its neighbours
          not. The baseline is the LAST thing drawn so it reads as the datum
          the marks are seated on rather than a rule behind the glyph. */}
      <span className="mu-cover__axis" />
      {spec.ghostX.map((x) => (
        <span className="mu-cover__mark" key={x} style={{ left: `${x}%` }} />
      ))}
      <span className="mu-cover__mark mu-cover__mark--lit" style={{ left: `${spec.markX}%` }} />
    </div>
  );
}
