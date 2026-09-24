import type { CSSProperties } from "react";

import { beatOf, type MusingBeat } from "@/lib/musings/cover";
import {
  ORBIT_CORE,
  ORBIT_HALF,
  ORBIT_HALO,
  ORBIT_OUTER,
  ORBIT_QUARTERS,
  ORBIT_QUARTER_R,
  ORBIT_RIM,
  ORBIT_RINGS,
  ORBIT_SPOKE,
  ORBIT_TRACK,
  orbitArcPath,
  orbitCirclePath,
  orbitPoint,
  orbitSeat,
  orbitSeg,
  orbitSpec,
} from "@/lib/musings/orbit";

/**
 * A note's drawn cover, in the register of the About drawing (ADR-122).
 * `lib/musings/orbit.ts` resolves the record and the geometry; this file only
 * draws. One drawing at two sizes: whole in the open card, and — under 140px,
 * where the note's cover box is its THUMBNAIL — stripped by the sheet's
 * `@container mu-cv` to the gold track, the inner ring, the hand and the mark.
 *
 * ⚠ **THE BEAT'S MARK IS COPIED FROM `rail-instruments/sectionGlyphs.tsx`,
 * NOT IMPORTED** — 24-unit box, `fill: none`, `stroke: currentColor`, 1.5
 * stroke (ADR-106's precedent). Those three drawings MEAN Navigate / Encode /
 * Build, which is exactly what they mean here; a station importing the frame's
 * chrome is a dependency in the wrong direction. The paths are byte-identical
 * to the rail's on purpose — if one changes, both should.
 * ⚠ **A NOTE WITH NO ARC TAG DRAWS NO MARK** — never a substitute.
 * ⚠ **NO SVG `<text>` AND NO `transform` ATTRIBUTE.** The labels are DOM,
 * seated by fraction; every mark is drawn at its own coordinates.
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

const diamond = (x: number, y: number, s: number) =>
  `${x},${y - s} ${x + s},${y} ${x},${y + s} ${x - s},${y}`;

interface OrbitPost {
  slug: string;
  date: string;
  tags: readonly string[];
}

export function MusingOrbit({
  post,
  posts,
}: {
  post: OrbitPost;
  posts: readonly { slug: string; date: string }[];
}) {
  const beat = beatOf(post.tags);
  const spec = orbitSpec(post, posts);
  const at = orbitPoint(spec.lit, ORBIT_TRACK);
  const h0 = orbitPoint(spec.lit, ORBIT_CORE);
  const h1 = orbitPoint(spec.lit, ORBIT_SPOKE);
  const cardinals = [0, 90, 180, 270];
  const ticks = Array.from({ length: 24 }, (_, i) => i * 15).filter((d) => d % 90 !== 0);

  return (
    <div className="mu-orbit" aria-hidden="true">
      <span className="mu-orbit__label mu-orbit__label--tr">{spec.day}</span>
      <span className="mu-orbit__label mu-orbit__label--bl">{spec.year}</span>
      <div className="mu-orbit__dial">
        <svg
          className="mu-orbit__svg"
          viewBox={`${-ORBIT_HALF} ${-ORBIT_HALF} ${2 * ORBIT_HALF} ${2 * ORBIT_HALF}`}
          focusable="false"
        >
          {ORBIT_RINGS.map((g) => (
            <path
              key={g.r}
              d={orbitCirclePath(g.r)}
              className={`mu-orbit__${g.ink}${g.detail ? " mu-cv-detail" : ""}`}
              strokeDasharray={g.dash}
            />
          ))}
          {/* The rim: four cardinal stubs, twenty ticks between them. */}
          <path
            className="mu-orbit__stub mu-cv-detail"
            d={cardinals.map((d) => orbitSeg(d, ORBIT_RIM, ORBIT_RIM - 14)).join(" ")}
          />
          <path
            className="mu-orbit__tick mu-cv-detail"
            d={ticks.map((d) => orbitSeg(d, ORBIT_RIM, ORBIT_RIM - 8)).join(" ")}
          />
          {/* About's four gold spokes, on the cardinals. */}
          <path
            className="mu-orbit__soft mu-cv-detail"
            d={cardinals.map((d) => orbitSeg(d, ORBIT_SPOKE, ORBIT_CORE)).join(" ")}
          />
          {/* The halo: one dot a month, the note's month lit. */}
          {Array.from({ length: 12 }, (_, m) => {
            const p = orbitPoint((m + 0.5) * 30, ORBIT_HALO);
            const lit = m === spec.month;
            return (
              <circle
                key={m}
                cx={p.x}
                cy={p.y}
                r={lit ? 3.2 : 1.8}
                className={`mu-orbit__halo${lit ? " mu-orbit__halo--lit" : ""} mu-cv-detail`}
              />
            );
          })}
          {/* The year's other notes, on the outer solid ring. */}
          {spec.others.map((b, i) => {
            const p = orbitPoint(b, ORBIT_OUTER);
            return (
              <circle key={i} cx={p.x} cy={p.y} r={3} className="mu-orbit__mark mu-cv-detail" />
            );
          })}
          {/* The note: its year elapsed on the gold track, a hand, the day lit. */}
          {spec.lit > 1 ? (
            <path d={orbitArcPath(ORBIT_TRACK, 0, spec.lit)} className="mu-orbit__elapsed" />
          ) : null}
          <path d={`M ${h0.x} ${h0.y} L ${h1.x} ${h1.y}`} className="mu-orbit__hand" />
          <polygon points={diamond(at.x, at.y, 7)} className="mu-orbit__lit" />
          {beat ? (
            <svg
              x={-35}
              y={-35}
              width={70}
              height={70}
              viewBox="0 0 24 24"
              className="mu-orbit__glyph"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              {BEAT_PATHS[beat].map((d) => (
                <path key={d} d={d} />
              ))}
              {beat === "encode" ? (
                <path fill="currentColor" stroke="none" d={ENCODE_CELLS} />
              ) : null}
            </svg>
          ) : null}
        </svg>
        {ORBIT_QUARTERS.map(([m, deg]) => {
          const p = orbitPoint(deg, ORBIT_QUARTER_R);
          return (
            <span key={m} className="mu-orbit__q" style={orbitSeat(p.x, p.y) as CSSProperties}>
              {m}
            </span>
          );
        })}
      </div>
    </div>
  );
}
