import type { LetterSpec } from "./pdaLetters";
import type { PdaShape, PdaTeam } from "./pdaRecord";

/**
 * THE SUBSTRATE READING'S MARKS AND SPEC EMITTERS.
 *
 * ⚠ **THIS WAS THE LAB'S KIT AND IT LIVES IN PRODUCTION NOW** (2026-08-12).
 * The substrate lab authored `Tap`, `DeptHead`, `housing` and the spec
 * emitters at reading 02's crop width precisely so a promoted winner would be
 * a copy rather than a re-fit; the pin grid is that winner, so the kit moves
 * here and the lab imports it. Production may not import from
 * `app/(internal)`, and the lab already mounts production's `ConsoleFrame`,
 * `ConsoleRail` and `ViewSubstrate` — inverting this one dependency is what
 * keeps a single copy of a measured drawing.
 */

/**
 * THE TYPE LADDER — reading 02's, one rung down at the top.
 *
 * The crop is 02's width, so `meet` is identical (0.647 at the binding preset)
 * and every rung renders the same number of pixels it does there.
 * ⚠ NOTHING UNDER 12 (ADR-070 U10): 12 renders 7.76px at 1280×720 and 10.94px
 * at 1920×1080, and the rung below it is the "utterly illegible" the owner
 * already ruled on once. The reading this replaced lettered at 9 and 9.5.
 */
export const FS = {
  /** A pattern's name — the row's subject. */
  name: 20,
  /** A pattern's one-line meaning. `gloss` lettered NOWHERE before this
   *  drawing; at 38 chars it is what sets the identity gutter's width. */
  gloss: 13,
  key: 12.5,
  chrome: 12,
} as const;
export const FS_FLOOR = 12;

/** Track values, so a spec and its `<text>` cannot disagree. */
export const TRACK = { name: 0.08, gloss: 0.08, key: 0.18, chrome: 0.14, code: 0.18 } as const;

/**
 * A MODULE HOUSING — ADR-065's canonical diagonal, the cut reading 02 settled
 * on in U13: two opposed 45° corners, TR+BL.
 *
 * ⚠ **ONE DEFINITION FOR THE WHOLE MAP** (2026-08-12). This path and `band`
 * were declared identically in `PdaConfiguration` and here, which is two
 * copies of one grammar — and the readings are supposed to be the same
 * instrument. Reading 02 imports them from here now, so a drawing that says it
 * is "in line with the configuration" is in line with it in the code.
 */
export const housing = (x: number, y: number, w: number, h: number, c: number) =>
  `M${x},${y} H${x + w - c} L${x + w},${y + c} V${y + h} H${x + c} L${x},${y + h - c} Z`;

/**
 * The header band's own outline. It shares the module's TOP corners and
 * squares off at the bottom — ⚠ a band cut with the full `housing` puts a
 * spurious 45° nick in the MIDDLE of the module, where no edge exists.
 */
export const band = (x: number, y: number, w: number, h: number, c: number) =>
  `M${x},${y} H${x + w - c} L${x + w},${y + c} V${y + h} H${x} Z`;

/**
 * THE MODULE'S OWN MEASURES, shared so a card on one reading cannot drift from
 * a module on another. R4's numbers, via reading 02.
 */
export const MODULE = {
  /** The 45° corner cut, on both opposed corners. */
  cut: 12,
  /** The header band's height. */
  head: 34,
  /** The interior inset every label hangs off. */
  pad: 12,
} as const;

/** The hatch a seam or a mass bar fills with — R4's own 45° tile, which is
 *  what keeps this reading in the same hand as reading 02. */
export function SubstrateHatch() {
  return (
    <defs>
      <pattern id="pda-sub-hatch" width="7" height="7" patternUnits="userSpaceOnUse">
        <path d="M0 7L7 0" stroke="var(--pda-amb)" strokeOpacity="0.3" strokeWidth="1" />
      </pattern>
      <pattern id="pda-sub-hatch-cut" width="7" height="7" patternUnits="userSpaceOnUse">
        <path d="M0 7L7 0" stroke="var(--pda-grn)" strokeOpacity="0.42" strokeWidth="1" />
      </pattern>
    </defs>
  );
}

/**
 * A TAP — one department drawing on one pattern.
 *
 * Filled where a department draws on the pattern; CUT (green, with the notch
 * that says a trench was opened here) where it is the one that paid to encode
 * it. That distinction is the reading's whole claim, so it is a different MARK
 * rather than a different colour of the same mark.
 */
export function Tap({
  cx,
  cy,
  on,
  cut,
  size = 15,
  hot = false,
}: {
  cx: number;
  cy: number;
  on: boolean;
  cut: boolean;
  size?: number;
  hot?: boolean;
}) {
  const h = size / 2;
  if (!on) {
    /* Not a gap — an empty socket. The negative space is a reading, which is
       the same law the person-led cartridges answer to. */
    return (
      <rect
        x={cx - h}
        y={cy - h}
        width={size}
        height={size}
        fill="none"
        stroke={hot ? "var(--pda-dim)" : "var(--pda-hair)"}
      />
    );
  }
  const ink = cut ? "var(--pda-grn)" : hot ? "var(--pda-hot)" : "var(--pda-amb)";
  return (
    <g>
      <rect
        x={cx - h}
        y={cy - h}
        width={size}
        height={size}
        fill={ink}
        fillOpacity={cut ? 0.9 : hot ? 0.85 : 0.62}
        stroke={ink}
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
export function DeptHead({
  cx,
  y,
  w,
  team,
  hot = false,
}: {
  cx: number;
  y: number;
  w: number;
  team: PdaTeam;
  hot?: boolean;
}) {
  return (
    <g>
      <path
        d={housing(cx - w / 2, y, w, 34, 8)}
        fill="var(--pda-void)"
        stroke={hot ? "var(--pda-hot)" : "var(--pda-hair2)"}
      />
      <text
        x={cx}
        y={y + 22}
        textAnchor="middle"
        fontSize={FS.key}
        letterSpacing=".18em"
        fill={hot ? "var(--pda-hot)" : "var(--pda-txt)"}
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

/* ── The record, ordered ────────────────────────────────────────────────
   ⚠ SORTING IS AN ARGUMENT, so only a drawing whose argument it is does it.
   The pin grid keeps the record's own order, because its thesis is the
   RELATION and a re-ranked matrix would be claiming both. */
export const byMass = (shapes: readonly PdaShape[]) =>
  [...shapes].sort((a, b) => b.skills - a.skills || a.key.localeCompare(b.key));

export const totalSkills = (shapes: readonly PdaShape[]) =>
  shapes.reduce((n, s) => n + s.skills, 0);

/** The departments that draw on one pattern, in the record's own order. */
export const tappers = (teams: readonly PdaTeam[], key: string) =>
  teams.filter((t) => t.taps.includes(key as PdaTeam["taps"][number]));

/**
 * ⚠ THE UNIT IS DEPARTMENTS, AND THE DRAWING MAY NOT SAY "TEAMS".
 *
 * Until 2026-08-12 this reading lettered `{n} SKILLS · {n} TEAMS`, and for
 * PATTERN that rendered **8 TEAMS** — the exact phrase `cases-registry`'s
 * district guard names as its failure mode, because 8 is the DEPARTMENT count
 * and both published team counts (22 briefed, 14 using the layer) are
 * different units and different sets. It survived because that guard walks
 * `CASES` with `JSON.stringify` and the string was composed at render time in
 * a component, where no scanner reaches it.
 *
 * The pin grid removes the need for the phrase entirely: a row's marks ARE its
 * department count, countable in place. `substrate-lab-fit` fails on
 * `/\bteams?\b/i` anywhere in a declaration, which is the mechanical half
 * (the ban lived in `pda-substrate-fit` until that file died with the
 * SECTION drawing — ADR-070 U35).
 */
export const DEPT_UNIT = "DEPARTMENTS";

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
