"use client";

import type { CSSProperties } from "react";

import { dialArcPath, dialCirclePath, dialPoint } from "@/components/arcs/steps/dialLayout";
import { BEAT_PATHS, ENCODE_CELLS } from "@/components/landing/home-v2/musings/MusingCover";
import { beatOf, slugSeed, yearFraction, type MusingBeat } from "@/lib/musings/cover";
import { SIGIL_RING_MORPHS } from "@/lib/celestial/orbits";

import { BEAT_NAME, type GalleryPost } from "./kit";

/**
 * Round six's covers — the note drawn in the register of the diagrams behind
 * the owner's portrait (owner, 2026-09-24: the visual "doesn't need to be
 * inside a frame … it can be a bit more creative, like the diagrams we have
 * behind my profile, in the About section").
 *
 *   · `orbit`  — the About drawing itself (`AboutStage.tsx:305–396`), its
 *                six rings on their dash ladder, the graduated rim, the four
 *                gold spokes, the halo — its spinning bodies re-seated as the
 *                RECORD: the note lit on the gold track at its filing day, the
 *                year's other notes on the outer ring, the note's month lit
 *                in the halo.
 *   · `sigil`  — the corridor's gateway sigil (`landing-v7-motion.html:
 *                4349–4409`): the four rings bent toward their orbits, the
 *                30° graduation, NAVIGATE · ENCODE · BUILD on their leaders —
 *                the note's own beat lit, the other two dawn.
 *   · `orrery` — the note's year as an orbit: a tilted ecliptic with the
 *                year's notes as bodies at their dates, the note itself a
 *                phase disc lit to how much of its year had passed.
 *
 * ⚠ THE GRAMMAR IS COPIED, NEVER IMPORTED (ADR-106): the About drawing's radii
 * and dashes are re-typed here; only PURE geometry is imported (the dial's
 * point and arc helpers, and `SIGIL_RING_MORPHS` from `lib/celestial/orbits`
 * — never the `@/lib/celestial` barrel, which drags Supabase onto the route).
 * ⚠ NOTHING SPINS (ADR-106, ADR-097 U12): About's three rotating groups are
 * static here, and each is a fact of the record rather than an ornament.
 * ⚠ NO SVG `<text>` and NO `transform` attribute: labels are DOM, seated by
 * fraction (the dial's own law), and every mark is drawn at its coordinates.
 * ⚠ `.mg-cv-detail` marks what the THUMBNAIL drops (`@container mg-cv`,
 * below 140px): what stays is each drawing's spine and the beat's mark.
 */

const RAD = Math.PI / 180;

/** The beat's mark — the rail's own drawing, as a nested `<svg>`. */
export function CoverGlyph({ beat, size }: { beat: MusingBeat | null; size: number }) {
  if (!beat) return null;
  return (
    <svg
      x={-size / 2}
      y={-size / 2}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="mg-dial__glyph"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      {BEAT_PATHS[beat].map((d) => (
        <path key={d} d={d} />
      ))}
      {beat === "encode" ? <path fill="currentColor" stroke="none" d={ENCODE_CELLS} /> : null}
    </svg>
  );
}

/** A DOM label's seat, as percentages of a square crop `±half`. */
export const seat = (x: number, y: number, half: number): CSSProperties => ({
  left: `${((x + half) / (2 * half)) * 100}%`,
  top: `${((y + half) / (2 * half)) * 100}%`,
});

const diamond = (x: number, y: number, s: number) =>
  `${x},${y - s} ${x + s},${y} ${x},${y + s} ${x - s},${y}`;

const bearingOf = (iso: string) => yearFraction(iso) * 360;
const sameYear = (post: GalleryPost, posts: readonly GalleryPost[]) =>
  posts.filter((q) => q.slug !== post.slug && q.date.slice(0, 4) === post.date.slice(0, 4));

/* ── orbit ───────────────────────────────────────────────────────────── */

/* ⚠ THE CROP CARRIES THE LABELS' ROOM. A quarter month is ~30px of mono
   seated on a radius and centred on it, so at 240 the first still printed
   "ICT" and "API" — the cover clips at its box. 268 seats JAN · APR · JUL ·
   OCT whole with the halo still inside them. */
export const ORBIT_HALF = 268;

/** About's six rings, radius for radius; the inks are the lab's ramp, a step
 *  stronger than About's because the drawing is a quarter of its size. */
const ORBIT_RINGS = [
  { r: 192, cls: "mg-dial__line2", dash: "1 7", detail: true },
  { r: 172, cls: "mg-ab__faint", dash: undefined, detail: true },
  { r: 150, cls: "mg-dial__soft", dash: "2 8", detail: true },
  { r: 124, cls: "mg-dial__gold", dash: undefined, detail: false },
  { r: 104, cls: "mg-dial__soft", dash: "1 3", detail: true },
  { r: 82, cls: "mg-dial__line", dash: "1 4", detail: false },
] as const;

export function OrbitCover({ post, posts }: { post: GalleryPost; posts: readonly GalleryPost[] }) {
  const lit = bearingOf(post.date);
  const month = Math.min(11, Math.max(0, Number(post.date.slice(5, 7)) - 1));
  const at = dialPoint(lit, 124);
  const h0 = dialPoint(lit, 82);
  const h1 = dialPoint(lit, 150);
  const seg = (deg: number, a: number, b: number) => {
    const p = dialPoint(deg, a);
    const q = dialPoint(deg, b);
    return `M ${p.x} ${p.y} L ${q.x} ${q.y}`;
  };
  return (
    <>
      <svg
        className="mg-ab mg-ab--orbit"
        viewBox={`${-ORBIT_HALF} ${-ORBIT_HALF} ${2 * ORBIT_HALF} ${2 * ORBIT_HALF}`}
        aria-hidden="true"
        focusable="false"
      >
        {ORBIT_RINGS.map((g) => (
          <path
            key={g.r}
            d={dialCirclePath(g.r)}
            className={`${g.cls}${g.detail ? " mg-cv-detail" : ""}`}
            strokeDasharray={g.dash}
          />
        ))}
        {/* The rim: four cardinal stubs, twenty ticks between them. */}
        <path
          className="mg-dial__stub mg-cv-detail"
          d={[0, 90, 180, 270].map((d) => seg(d, 192, 178)).join(" ")}
        />
        <path
          className="mg-dial__tick mg-cv-detail"
          d={Array.from({ length: 24 }, (_, i) => i * 15)
            .filter((d) => d % 90 !== 0)
            .map((d) => seg(d, 192, 184))
            .join(" ")}
        />
        {/* About's four gold spokes, on the cardinals. */}
        <path
          className="mg-dial__soft mg-cv-detail"
          d={[0, 90, 180, 270].map((d) => seg(d, 150, 82)).join(" ")}
        />
        {/* The halo: one dot a month, the note's month lit. */}
        {Array.from({ length: 12 }, (_, m) => {
          const p = dialPoint((m + 0.5) * 30, 208);
          return (
            <circle
              key={m}
              cx={p.x}
              cy={p.y}
              r={m === month ? 3.2 : 1.8}
              className={`mg-ab__halo${m === month ? " mg-ab__halo--lit" : ""} mg-cv-detail`}
            />
          );
        })}
        {/* The year's other notes, on the outer solid ring. */}
        {sameYear(post, posts).map((q) => {
          const p = dialPoint(bearingOf(q.date), 172);
          return (
            <circle key={q.slug} cx={p.x} cy={p.y} r={3} className="mg-dial__mark mg-cv-detail" />
          );
        })}
        {/* The note: the year elapsed to its day on the gold track, a hand,
            and the day itself lit. */}
        {lit > 1 && <path d={dialArcPath(124, 0, lit)} className="mg-dial__elapsed" />}
        <path d={`M ${h0.x} ${h0.y} L ${h1.x} ${h1.y}`} className="mg-dial__hand" />
        <polygon points={diamond(at.x, at.y, 7)} className="mg-dial__lit" />
        <CoverGlyph beat={beatOf(post.tags)} size={70} />
      </svg>
      {(
        [
          ["JAN", 0],
          ["APR", 90],
          ["JUL", 180],
          ["OCT", 270],
        ] as const
      ).map(([m, deg]) => {
        const p = dialPoint(deg, 234);
        return (
          <span key={m} className="mg-cover__q" style={seat(p.x, p.y, ORBIT_HALF)}>
            {m}
          </span>
        );
      })}
    </>
  );
}

/* ── sigil ───────────────────────────────────────────────────────────── */

/* The stations are LABELLED OUTWARD from rings that reach r 170 — at 190 the
   first still cut "NAVIGATE" to "AVIGATE" and "BUILD" to "BUIL". */
export const SIGIL_HALF = 250;
/** How far each ring is bent toward its orbit — the corridor scrubs this 0 → 1;
 *  a cover holds it part-way, where the compass is still a compass. */
const SIGIL_BEND = 0.55;

/** SVG's `rotate(θ)` on screen coordinates, as arithmetic. */
function rot(x: number, y: number, deg: number) {
  const c = Math.cos(deg * RAD);
  const s = Math.sin(deg * RAD);
  return { x: x * c - y * s, y: x * s + y * c };
}

interface Ellipse {
  rx: number;
  ry: number;
  deg: number;
}

/** The point where a ray on a compass bearing meets a rotated ellipse. */
export function ellipseAtBearing(e: Ellipse, bearing: number) {
  const d = rot(Math.sin(bearing * RAD), -Math.cos(bearing * RAD), -e.deg);
  const t = 1 / Math.sqrt((d.x / e.rx) ** 2 + (d.y / e.ry) ** 2);
  return rot(d.x * t, d.y * t, e.deg);
}

/** A closed ellipse as two arcs, rotation carried by the arc command — no
 *  `transform`. */
function ellipsePath(e: Ellipse) {
  const a = rot(e.rx, 0, e.deg);
  const b = rot(-e.rx, 0, e.deg);
  return `M ${a.x} ${a.y} A ${e.rx} ${e.ry} ${e.deg} 0 1 ${b.x} ${b.y} A ${e.rx} ${e.ry} ${e.deg} 0 1 ${a.x} ${a.y}`;
}

const SIGIL_INK = [
  { cls: "mg-dial__line2", dash: "1 5" },
  { cls: "mg-dial__line2", dash: undefined },
  { cls: "mg-dial__soft", dash: "2 7" },
  { cls: "mg-dial__gold", dash: "1 3" },
] as const;

/** The three stations, on the sigil's own rings and bearings. */
const STATIONS: readonly { beat: MusingBeat; ring: number; deg: number; end: boolean }[] = [
  { beat: "navigate", ring: 0, deg: 325, end: true },
  { beat: "encode", ring: 1, deg: 205, end: true },
  { beat: "build", ring: 2, deg: 80, end: false },
];

export function SigilCover({ post, posts }: { post: GalleryPost; posts: readonly GalleryPost[] }) {
  const beat = beatOf(post.tags);
  const rings: Ellipse[] = SIGIL_RING_MORPHS.map((m) => {
    const sx = 1 + SIGIL_BEND * (m.targetSx - 1);
    const sy = 1 + SIGIL_BEND * (m.targetSy - 1);
    return { rx: m.ringRadius * sx, ry: m.ringRadius * sy, deg: m.targetRotateDeg };
  });
  const lit = bearingOf(post.date);
  const mark = ellipseAtBearing(rings[0], lit);
  const hand0 = dialPoint(lit, 46);
  const seg = (deg: number, a: number, b: number) => {
    const p = dialPoint(deg, a);
    const q = dialPoint(deg, b);
    return `M ${p.x} ${p.y} L ${q.x} ${q.y}`;
  };
  const stations = STATIONS.map((s) => {
    const p = ellipseAtBearing(rings[s.ring], s.deg);
    const len = Math.hypot(p.x, p.y);
    const ux = p.x / len;
    const uy = p.y / len;
    return {
      ...s,
      p,
      q: { x: p.x + ux * 16, y: p.y + uy * 16 },
      l: { x: p.x + ux * 21, y: p.y + uy * 21 },
      on: s.beat === beat,
    };
  });
  return (
    <>
      <svg
        className="mg-ab mg-ab--sigil"
        viewBox={`${-SIGIL_HALF} ${-SIGIL_HALF} ${2 * SIGIL_HALF} ${2 * SIGIL_HALF}`}
        aria-hidden="true"
        focusable="false"
      >
        {rings.map((e, i) => (
          <path
            key={i}
            d={ellipsePath(e)}
            className={SIGIL_INK[i].cls}
            strokeDasharray={SIGIL_INK[i].dash}
          />
        ))}
        {/* The bearing crosshair and the 30° graduation. */}
        <path
          className="mg-dial__stub mg-cv-detail"
          d={[0, 90, 180, 270].map((d) => seg(d, 150, 130)).join(" ")}
        />
        <path
          className="mg-dial__tick mg-cv-detail"
          d={[30, 60, 120, 150, 210, 240, 300, 330].map((d) => seg(d, 150, 144)).join(" ")}
        />
        {/* The year's other notes, on the second ring. */}
        {sameYear(post, posts).map((q) => {
          const p = ellipseAtBearing(rings[1], bearingOf(q.date));
          return (
            <circle key={q.slug} cx={p.x} cy={p.y} r={2.6} className="mg-dial__mark mg-cv-detail" />
          );
        })}
        {/* The stations — the note's own beat lit. */}
        {stations.map((s) => (
          <g key={s.beat} className="mg-cv-detail">
            <path
              d={`M ${s.p.x} ${s.p.y} L ${s.q.x} ${s.q.y}`}
              className={s.on ? "mg-dial__hand" : "mg-dial__tick"}
            />
            <circle
              cx={s.p.x}
              cy={s.p.y}
              r={s.on ? 3.6 : 2.2}
              className={s.on ? "mg-dial__lit" : "mg-ab__dot"}
            />
          </g>
        ))}
        {/* The note: a hand from the centre to its day on the outer ring. */}
        <path d={`M ${hand0.x} ${hand0.y} L ${mark.x} ${mark.y}`} className="mg-dial__hand" />
        <polygon points={diamond(mark.x, mark.y, 6)} className="mg-dial__lit" />
        <CoverGlyph beat={beat} size={64} />
      </svg>
      {stations.map((s) => (
        <span
          key={s.beat}
          className={`mg-ab__st${s.on ? " mg-ab__st--on" : ""}${s.end ? " mg-ab__st--end" : ""}`}
          style={seat(s.l.x, s.l.y, SIGIL_HALF)}
        >
          {BEAT_NAME[s.beat]}
        </span>
      ))}
    </>
  );
}

/* ── orrery ──────────────────────────────────────────────────────────── */

export const ORRERY_HALF = 200;

/** The lit part of a phase disc at fraction `k` of its cycle, as one path:
 *  the right limb, then the terminator back — no mask, so no id to collide. */
export function phasePath(cx: number, cy: number, r: number, k: number) {
  const t = r * Math.abs(1 - 2 * k);
  const sweep = k < 0.5 ? 0 : 1;
  return (
    `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} ` +
    `A ${t} ${r} 0 0 ${sweep} ${cx} ${cy - r} Z`
  );
}

export function OrreryCover({ post, posts }: { post: GalleryPost; posts: readonly GalleryPost[] }) {
  const tilt = -8 - 16 * slugSeed(post.slug);
  const ecl: Ellipse = { rx: 165, ry: 64, deg: tilt };
  const inner: Ellipse = { rx: 118, ry: 44, deg: tilt };
  /* January at the ecliptic's left end, the year running clockwise. */
  const on = (e: Ellipse, f: number) => {
    const a = Math.PI + 2 * Math.PI * f;
    return rot(e.rx * Math.cos(a), e.ry * Math.sin(a), e.deg);
  };
  const f = yearFraction(post.date);
  const me = on(ecl, f);
  const toward = Math.hypot(me.x, me.y);
  const drop0 = { x: (me.x / toward) * 40, y: (me.y / toward) * 40 };
  const ext = [-1, 1].map((sgn) => [rot(sgn * 171, 0, tilt), rot(sgn * 190, 0, tilt)] as const);
  const seg = (deg: number, a: number, b: number) => {
    const p = dialPoint(deg, a);
    const q = dialPoint(deg, b);
    return `M ${p.x} ${p.y} L ${q.x} ${q.y}`;
  };
  return (
    <svg
      className="mg-ab mg-ab--orrery"
      viewBox={`${-ORRERY_HALF} ${-ORRERY_HALF} ${2 * ORRERY_HALF} ${2 * ORRERY_HALF}`}
      aria-hidden="true"
      focusable="false"
    >
      <path d={dialCirclePath(188)} className="mg-dial__line2 mg-cv-detail" strokeDasharray="1 6" />
      <path
        className="mg-dial__tick mg-cv-detail"
        d={Array.from({ length: 12 }, (_, m) => m * 30)
          .filter((d) => d % 90 !== 0)
          .map((d) => seg(d, 188, 181))
          .join(" ")}
      />
      <path
        className="mg-dial__stub mg-cv-detail"
        d={[0, 90, 180, 270].map((d) => seg(d, 188, 176)).join(" ")}
      />
      <path d={ellipsePath(inner)} className="mg-dial__soft mg-cv-detail" strokeDasharray="1 3" />
      <path d={ellipsePath(ecl)} className="mg-dial__gold" />
      {ext.map(([a, b], i) => (
        <path
          key={i}
          d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`}
          className="mg-dial__line mg-cv-detail"
          strokeDasharray="3 3"
        />
      ))}
      <path d={dialCirclePath(40)} className="mg-dial__line2 mg-cv-detail" strokeDasharray="1 3" />
      {sameYear(post, posts).map((q) => {
        const p = on(ecl, yearFraction(q.date));
        return (
          <circle key={q.slug} cx={p.x} cy={p.y} r={3} className="mg-dial__mark mg-cv-detail" />
        );
      })}
      <path
        d={`M ${drop0.x} ${drop0.y} L ${me.x} ${me.y}`}
        className="mg-dial__line mg-cv-detail"
        strokeDasharray="2 3"
      />
      {/* The note: a body on its day, lit to how much of its year had gone. */}
      <circle cx={me.x} cy={me.y} r={10} className="mg-ab__body" />
      <path d={phasePath(me.x, me.y, 10, f)} className="mg-ab__phase" />
      <CoverGlyph beat={beatOf(post.tags)} size={58} />
    </svg>
  );
}
