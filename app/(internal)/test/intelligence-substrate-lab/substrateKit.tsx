import type {
  PdaShape,
  PdaTeam,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";

import { adv, specWidth, type LetterSpec } from "../intelligence-config-lab/variants";

/**
 * What all three substrate drawings share: the crop, the type ladder, the
 * width chain, the marks and the spec emitters.
 *
 * ⚠ ONE ADVANCE MODEL FOR BOTH LABS. `adv` / `specWidth` / `LetterSpec` are
 * imported from the configuration lab rather than re-declared — PT Mono's
 * advance is a property of the font, not of a route, and two copies of it is
 * how one lab starts passing a fit its neighbour would fail.
 */

export { adv, specWidth };
export type { LetterSpec };

/* ── The crop ───────────────────────────────────────────────────────────
   ⚠ ONE CROP FOR ALL THREE, and it is reading 02's width. The comparison is
   only worth making in the same box, and sharing 02's 932 means a promoted
   winner inherits U12's elastic treatment unchanged: the crop's WIDTH never
   moves, so `meet` is `field.w / 932` and the height can be measured from
   the field for free. 762 is that width at the binding preset's field aspect
   (603 × 493 = 1.223), so the lab draws with no letterbox on either axis. */
export const SUB_VIEWBOX = "0 0 932 762";
export const CROP_W = 932;
export const CROP_H = 762;

/** The width chain. Every variant hangs off these three. */
export const PAD = 26;
export const L = PAD;
export const R = CROP_W - PAD;
export const W = R - L;

/**
 * THE TYPE LADDER — reading 02's, one rung down at the top.
 *
 * The crop is 02's width, so `meet` is identical (0.647 at the binding
 * preset) and every rung renders the same number of pixels it does there.
 * ⚠ NOTHING UNDER 12 (ADR-070 U10): 12 renders 7.76px at 1280×720 and
 * 10.94px at 1920×1080, and the rung below it is the "utterly illegible" the
 * owner already ruled on once.
 */
export const FS = {
  /** The substrate's own total — the one hero number on the reading. */
  hero: 22,
  /** A pattern's name. Below 02's title because a pattern is not the subject
   *  of this reading, the ESTATE is. */
  name: 18,
  /** A pattern's one-line meaning — `gloss`, which letters nowhere today. */
  gloss: 13,
  key: 12.5,
  chrome: 12,
} as const;
export const FS_FLOOR = 12;

/** Track values, so a spec and its `<text>` cannot disagree. */
export const TRACK = { name: 0.08, gloss: 0.08, key: 0.18, chrome: 0.14, code: 0.18 } as const;

/* ── The record, ordered ────────────────────────────────────────────────
   ⚠ SORTING IS AN ARGUMENT, so only the variant whose argument it is does
   it. `strata` and `tree` rank by mass because that IS their thesis; the
   crossing table keeps the record's own order, because its thesis is the
   relation and a re-ranked table would be claiming both. */
export const byMass = (shapes: readonly PdaShape[]) =>
  [...shapes].sort((a, b) => b.skills - a.skills || a.key.localeCompare(b.key));

export const totalSkills = (shapes: readonly PdaShape[]) =>
  shapes.reduce((n, s) => n + s.skills, 0);

/** The departments that draw on one pattern, in the record's own order. */
export const tappers = (teams: readonly PdaTeam[], key: string) =>
  teams.filter((t) => t.taps.includes(key as PdaTeam["taps"][number]));

/**
 * ⚠ THE UNIT IS DEPARTMENTS, AND THE DRAWING MUST SAY SO.
 *
 * Production's reading 03 letters `{n} SKILLS · {n} TEAMS`, and for PATTERN
 * that renders **8 TEAMS** — the exact phrase `cases-registry`'s district
 * guard names as its failure mode, because 8 is the DEPARTMENT count and
 * both published team counts (22 briefed, 14 using the layer) are different
 * units. It survives only because that guard walks `CASES` with
 * `JSON.stringify` and this string is composed at render time in a
 * component, where no scanner reaches it.
 *
 * So no variant here letters the word at all: the tap marks carry the count,
 * and `substrate-lab-fit` fails on `/\bteams?\b/i` anywhere in a declaration.
 */
export const DEPT_UNIT = "DEPARTMENTS";

/* ── Marks ─────────────────────────────────────────────────────────────── */

/** The hatch every seam and every mass bar fills with — R4's own 45° tile,
 *  which is what keeps this reading in the same hand as reading 02. */
export function SubstrateHatch() {
  return (
    <defs>
      <pattern id="isl-hatch" width="7" height="7" patternUnits="userSpaceOnUse">
        <path d="M0 7L7 0" stroke="var(--pda-amb)" strokeOpacity="0.3" strokeWidth="1" />
      </pattern>
      <pattern id="isl-hatch-cut" width="7" height="7" patternUnits="userSpaceOnUse">
        <path d="M0 7L7 0" stroke="var(--pda-grn)" strokeOpacity="0.42" strokeWidth="1" />
      </pattern>
    </defs>
  );
}

/** ADR-065's canonical diagonal, the cut reading 02 settled on in U13. */
export const housing = (x: number, y: number, w: number, h: number, c: number) =>
  `M${x},${y} H${x + w - c} L${x + w},${y + c} V${y + h} H${x + c} L${x},${y + h - c} Z`;

/**
 * A TAP — one department drawing on one pattern.
 *
 * Filled where a department draws on the seam; CUT (green, with the notch
 * that says a trench was opened here) where it is the one that paid to
 * encode it. That distinction is the reading's whole claim, so it is a
 * different MARK rather than a different colour of the same mark.
 */
export function Tap({
  cx,
  cy,
  on,
  cut,
  size = 15,
}: {
  cx: number;
  cy: number;
  on: boolean;
  cut: boolean;
  size?: number;
}) {
  const h = size / 2;
  if (!on) {
    /* Not a gap — an empty socket. The negative space is a reading, which is
       the same law the person-led cartridges answer to. */
    return (
      <rect x={cx - h} y={cy - h} width={size} height={size} fill="none" stroke="var(--pda-hair)" />
    );
  }
  return (
    <g>
      <rect
        x={cx - h}
        y={cy - h}
        width={size}
        height={size}
        fill={cut ? "var(--pda-grn)" : "var(--pda-amb)"}
        fillOpacity={cut ? 0.9 : 0.62}
        stroke={cut ? "var(--pda-grn)" : "var(--pda-amb)"}
      />
      {cut ? (
        <path
          d={`M${cx - h},${cy - h} L${cx + h},${cy + h} M${cx + h},${cy - h} L${cx - h},${cy + h}`}
          stroke="var(--pda-void)"
          strokeWidth="1.4"
        />
      ) : null}
    </g>
  );
}

/** A department head — its code, and the streams it runs. */
export function DeptHead({ cx, y, w, team }: { cx: number; y: number; w: number; team: PdaTeam }) {
  return (
    <g>
      <path d={housing(cx - w / 2, y, w, 34, 8)} fill="var(--pda-void)" stroke="var(--pda-hair2)" />
      <text
        x={cx}
        y={y + 22}
        textAnchor="middle"
        fontSize={FS.key}
        letterSpacing=".18em"
        fill="var(--pda-txt)"
      >
        {team.ab}
      </text>
      <text
        x={cx}
        y={y + 52}
        textAnchor="middle"
        fontSize={FS.chrome}
        letterSpacing=".14em"
        fill="var(--pda-txt3)"
      >
        {String(team.shown).padStart(2, "0")}
      </text>
    </g>
  );
}

/* ── Spec emitters ──────────────────────────────────────────────────────
   Declaration and drawing come from the same call, so they cannot drift. */

export const deptSpecs = (teams: readonly PdaTeam[], measure: number): LetterSpec[] =>
  teams.flatMap((t) => [
    { slot: `dept.${t.id}`, text: t.ab, fs: FS.key, track: TRACK.code, measure },
    {
      slot: `dept.${t.id}.n`,
      text: String(t.shown).padStart(2, "0"),
      fs: FS.chrome,
      track: TRACK.chrome,
      measure,
    },
  ]);

export const shapeSpecs = (
  s: PdaShape,
  m: { name: number; gloss: number; meta: number }
): LetterSpec[] => [
  { slot: `${s.key}.name`, text: s.name, fs: FS.name, track: TRACK.name, measure: m.name },
  { slot: `${s.key}.gloss`, text: s.gloss, fs: FS.gloss, track: TRACK.gloss, measure: m.gloss },
  {
    slot: `${s.key}.skills`,
    text: `${s.skills} SKILLS`,
    fs: FS.chrome,
    track: TRACK.chrome,
    measure: m.meta,
  },
  {
    slot: `${s.key}.cut`,
    text: `CUT BY ${s.trenchedBy}`,
    fs: FS.chrome,
    track: TRACK.chrome,
    measure: m.meta,
  },
];
