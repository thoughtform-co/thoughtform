"use client";

import { useId } from "react";

import {
  DIAL_CORE,
  DIAL_OUTER,
  DIAL_RIM,
  DIAL_RINGS,
  DIAL_TRACK,
  DIAL_VB,
  dialArcPath,
  dialCirclePath,
  dialFraction,
  dialPoint,
  type DialInk,
} from "@/components/arcs/steps/dialLayout";
import { BEAT_PATHS, ENCODE_CELLS } from "@/components/landing/home-v2/musings/MusingOrbit";
import { beatOf, slugSeed, yearFraction } from "@/lib/musings/cover";

import { CoverGlyph, OrbitCover, OrreryCover, SigilCover } from "./AboutCovers";
import { BEAT_NAME, CoverField, type GalleryPost } from "./kit";

/**
 * A note's COVER — the picture a blog post is recognised by, drawn in code
 * (ADR-119's ruling: no photography, no API spend) and drawn off the RECORD.
 *
 * Three readings, one knob (`?cover=`), so the owner can judge the right-hand
 * side of the open row with the rest of the composition held still:
 *
 *   · `dial`   — the house's ring register (the outcomes dial, ADR-106, and
 *                the About orbit it was ported from — "the circular things on
 *                our homepage"). The Arc beat's mark at the centre; the YEAR
 *                on the track, clockwise from January at twelve o'clock; the
 *                note lit at its filing day with a hand to it and the year's
 *                elapsed arc drawn up to it; the archive's other notes that
 *                year as unlit marks. Default.
 *   · `raster` — the beat's mark as a HALFTONE: a dot screen seen through the
 *                glyph over a seeded field and a scanline — the retro-terminal
 *                register of the services card's raster face (ADR-112).
 *   · `field`  — the Codex dossier's field: substrate, mark, year strip.
 *
 * ⚠ THE SVG LETTERS NOTHING (the dial's own law): every string is a DOM label
 * on the plate, so no `<text>` needs a fit discipline.
 * ⚠ The dial's geometry is IMPORTED from `components/arcs/steps/dialLayout`
 * here because it is pure and this is a lab; a promotion into the station
 * copies it (ADR-106's precedent — a station importing an arc is a dependency
 * pointing the wrong way).
 */

export type CoverKind = "dial" | "raster" | "field" | "orbit" | "sigil" | "orrery";
export const COVER_KINDS: readonly CoverKind[] = [
  "dial",
  "raster",
  "field",
  "orbit",
  "sigil",
  "orrery",
];
/** The kinds drawn as one SVG in a square box — what the glyph raster reads. */
export const DRAWN_KINDS: readonly CoverKind[] = ["dial", "orbit", "sigil", "orrery"];

/** The knob's value if it names a kind, else the direction's own default. */
export const coverKindOf = (v: string | undefined, dflt: CoverKind): CoverKind =>
  COVER_KINDS.includes(v as CoverKind) ? (v as CoverKind) : dflt;

const INK: Record<DialInk, string> = {
  line: "mg-dial__line",
  line2: "mg-dial__line2",
  tick: "mg-dial__tick",
  stub: "mg-dial__stub",
  gold: "mg-dial__gold",
  "gold-soft": "mg-dial__soft",
};

/** Day of the year, 1-based, off the string — never through `Date`'s zone. */
function dayOfYear(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86_400_000) + 1;
}

/** The dial. `compact` is the row's thumbnail: the rings, the mark, the hand. */
function Dial({
  post,
  posts,
  compact = false,
}: {
  post: GalleryPost;
  posts: readonly GalleryPost[];
  compact?: boolean;
}) {
  const year = post.date.slice(0, 4);
  const bearing = (iso: string) => yearFraction(iso) * 360;
  const lit = bearing(post.date);
  const others = posts.filter((q) => q.slug !== post.slug && q.date.startsWith(year));
  const at = dialPoint(lit, DIAL_TRACK);
  const hand0 = dialPoint(lit, DIAL_CORE);
  const hand1 = dialPoint(lit, DIAL_OUTER);
  const rings = compact ? DIAL_RINGS.filter((r) => r.id !== "r3" && r.id !== "r5") : DIAL_RINGS;

  return (
    <svg
      className="mg-dial"
      viewBox={`${DIAL_VB.x} ${DIAL_VB.y} ${DIAL_VB.w} ${DIAL_VB.h}`}
      aria-hidden="true"
      focusable="false"
    >
      {rings.map((r) => (
        <path key={r.id} d={dialCirclePath(r.r)} className={INK[r.ink]} strokeDasharray={r.dash} />
      ))}
      {/* The months — twelve ticks on the rim, the quarters as longer stubs. */}
      {!compact &&
        Array.from({ length: 12 }, (_, m) => {
          const q = m % 3 === 0;
          const a = dialPoint(m * 30, DIAL_RIM);
          const b = dialPoint(m * 30, DIAL_RIM - (q ? 11 : 6));
          return (
            <line
              key={m}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className={q ? "mg-dial__stub" : "mg-dial__tick"}
            />
          );
        })}
      {/* How much of its year had passed when the note was filed. */}
      {lit > 1 && <path d={dialArcPath(90, 0, lit)} className="mg-dial__elapsed" />}
      {!compact &&
        others.map((q) => {
          const p = dialPoint(bearing(q.date), DIAL_TRACK);
          return (
            <rect
              key={q.slug}
              x={p.x - 2.5}
              y={p.y - 2.5}
              width={5}
              height={5}
              className="mg-dial__mark"
            />
          );
        })}
      <line x1={hand0.x} y1={hand0.y} x2={hand1.x} y2={hand1.y} className="mg-dial__hand" />
      <rect x={at.x - 4.5} y={at.y - 4.5} width={9} height={9} className="mg-dial__lit" />
      <CoverGlyph beat={beatOf(post.tags)} size={compact ? 50 : 44} />
    </svg>
  );
}

/** The quarter months, seated just outside the rim as DOM labels. */
const QUARTERS = [
  ["JAN", 0],
  ["APR", 90],
  ["JUL", 180],
  ["OCT", 270],
] as const;

function Raster({ post }: { post: GalleryPost }) {
  const id = useId().replace(/:/g, "");
  const beat = beatOf(post.tags);
  const seed = slugSeed(post.slug);
  const pitch = 2.6 + seed * 0.8;
  return (
    <svg
      className="mg-raster"
      viewBox="0 0 160 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id={`${id}d`} width={pitch} height={pitch} patternUnits="userSpaceOnUse">
          <circle cx={pitch / 2} cy={pitch / 2} r={pitch * 0.3} className="mg-raster__dot" />
        </pattern>
        <pattern id={`${id}f`} width={pitch * 2} height={pitch * 2} patternUnits="userSpaceOnUse">
          <circle cx={pitch} cy={pitch} r={pitch * 0.16} className="mg-raster__field" />
        </pattern>
        <pattern id={`${id}s`} width={4} height={2} patternUnits="userSpaceOnUse">
          <rect width={4} height={0.5} className="mg-raster__scan" />
        </pattern>
        <radialGradient id={`${id}g`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <mask id={`${id}m`}>
          {beat ? (
            <svg
              x={46}
              y={16}
              width={68}
              height={68}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth={3.2}
            >
              {BEAT_PATHS[beat].map((d) => (
                <path key={d} d={d} />
              ))}
              {beat === "encode" ? <path fill="#fff" stroke="none" d={ENCODE_CELLS} /> : null}
            </svg>
          ) : null}
        </mask>
        <mask id={`${id}v`}>
          <rect width={160} height={100} fill={`url(#${id}g)`} />
        </mask>
      </defs>
      <rect width={160} height={100} fill={`url(#${id}f)`} mask={`url(#${id}v)`} />
      <rect width={160} height={100} fill={`url(#${id}d)`} mask={`url(#${id}m)`} />
      <rect width={160} height={100} fill={`url(#${id}s)`} />
    </svg>
  );
}

export function NoteCover({
  post,
  posts,
  kind = "dial",
}: {
  post: GalleryPost;
  posts: readonly GalleryPost[];
  kind?: CoverKind;
}) {
  const beat = beatOf(post.tags);
  if (kind === "field") return <CoverField post={post} posts={posts} className="mg-cover__field" />;
  /* Round six's three: About's designation PAIR on the lawful diagonal
     (TR/BL), lettering what the card prints nowhere else — the day, the year;
     TR/BL because a card's chip already sits at the cover's top-left. */
  if (kind === "orbit" || kind === "sigil" || kind === "orrery") {
    return (
      <div className={`mg-cover mg-cover--${kind}`} aria-hidden="true">
        <span className="mg-cover__label mg-cover__label--tr mg-cover__label--dim">
          Day {dayOfYear(post.date)}
        </span>
        <span className="mg-cover__label mg-cover__label--bl">{post.date.slice(0, 4)}</span>
        <div className="mg-cover__dial">
          {kind === "orbit" ? (
            <OrbitCover post={post} posts={posts} />
          ) : kind === "sigil" ? (
            <SigilCover post={post} posts={posts} />
          ) : (
            <OrreryCover post={post} posts={posts} />
          )}
        </div>
      </div>
    );
  }
  return (
    <div className={`mg-cover mg-cover--${kind}`} aria-hidden="true">
      <span className="mg-cover__label mg-cover__label--tl">
        {beat ? BEAT_NAME[beat] : "Practice"}
      </span>
      <span className="mg-cover__label mg-cover__label--bl">{post.date.slice(0, 4)}</span>
      <span className="mg-cover__label mg-cover__label--br">Day {dayOfYear(post.date)}</span>
      {kind === "dial" ? (
        <div className="mg-cover__dial">
          <Dial post={post} posts={posts} />
          {QUARTERS.map(([m, deg]) => {
            const f = dialFraction(deg, DIAL_RIM + 17);
            return (
              <span
                key={m}
                className="mg-cover__q"
                style={{ left: `${f.ax * 100}%`, top: `${f.at * 100}%` }}
              >
                {m}
              </span>
            );
          })}
        </div>
      ) : (
        <Raster post={post} />
      )}
    </div>
  );
}

/** The row's thumbnail — the same dial, stripped to its rings and its mark. */
export function NoteThumb({ post, posts }: { post: GalleryPost; posts: readonly GalleryPost[] }) {
  return (
    <span className="mg-thumb" aria-hidden="true">
      <Dial post={post} posts={posts} compact />
    </span>
  );
}
