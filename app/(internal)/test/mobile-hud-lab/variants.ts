/**
 * The three routes under study, the runway they are judged over, and the
 * knobs that carry a real decision.
 *
 * THE QUESTION. At ≤960px the HUD stands down its rails, its 13-tick
 * ladder, the journey diamond and both rail-instrument mark rows; the
 * wordmark went with them on 2026-09-01. What is left is a TR readout that
 * NAMES the section and a BR cluster of controls — so the frame still says
 * where you are and nothing draws it. Both candidates put ONE element back.
 *
 * `v0` is production's ≤960 chrome and nothing else. Its job is to be the
 * thing the other two are a delta FROM: if it does not look like the phone
 * frame as it ships, no judgement made against it is worth anything.
 *
 * ⚠ THE MOCKS ARE MOCKS, AND THAT IS THE ONE PLACE THIS LAB DIVERGES FROM
 * `/test/hud-instruments-lab`. That lab mounts the parse-injected `hudHtml`
 * and the real `HudNav`, because its subject is the RAILS and the rails
 * only exist inside that markup. This lab's subject is two new fixed
 * painters and their collisions with flowing copy, at a width where the
 * rails are `display: none` anyway — and mounting the real frame would drag
 * in the corridor's WebGL host to get a runway that behaves. So the runway
 * is synthetic and the surviving chrome is drawn from `.mhl-*` rules that
 * copy the production geometry token for token. The copy is named here so
 * nobody reads the lab's corner as production's.
 */

import { READOUT_SECTIONS } from "@/lib/rail-manifest/sectionLabel";

/* ── The routes ───────────────────────────────────────────────────────── */

export type MobileHudVariantId = "v0" | "c1" | "c2";

export interface MobileHudVariant {
  /** Also the `?v=` deep-link value and the `data-mhl-variant` attribute. */
  id: MobileHudVariantId;
  label: string;
  /** What to look for when judging it. */
  thesis: string;
  /** The instrument reference it is drawn from. */
  provenance: string;
}

export const MOBILE_HUD_VARIANTS: readonly MobileHudVariant[] = [
  {
    id: "v0",
    label: "OFF",
    thesis:
      "Production's phone chrome and nothing else: the TR readout that doubles as the drawer trigger, the BR settings cluster, the two corner brackets, the top scrim. The control — the leitmotif is carried by one word, and the bottom-left corner is empty. Check that it looks like nothing was added.",
    provenance: "thoughtform.co at ≤960 — the shipped phone frame",
  },
  {
    id: "c1",
    label: "Bearing strip",
    thesis:
      "The rail's 13-tick ladder turned through 90° and laid along the top edge, with one lit detent travelling it. The ladder identity survives the rail's stand-down; the lit tick is the only new claim and it says exactly what the corner's word says, spatially. Judge whether a ladder along the top edge reads as an instrument or as a loading bar — and watch the hero→corridor seam, where two runway parts share one journey row and the detent deliberately holds still.",
    provenance: "ADR-031 U2's tick ladder · aircraft HSI course strip · drone OSD heading tape",
  },
  {
    id: "c2",
    label: "Corner astrolabe",
    thesis:
      "A 52px dodecagonal dial in the corner the wordmark vacated. Needle = scroll depth, scrubbed; tick ring = the journey at its measured depths; diamond = the section you are in, stepping tick to tick. Three registers of one record — the needle passes a tick as you reach that section. Judge whether a dial in a corner reads as navigation or as an ornament that happens to move, and whether 52px is enough to carry three marks.",
    provenance:
      "ADR-070 U33's compound carrier · fighter HSI bearing pointer · portrait-game minimap",
  },
];

/* ── The journey ──────────────────────────────────────────────────────── */

/**
 * The rows both instruments count, taken from the corner readout's own
 * table rather than re-typed.
 *
 * ⚠ `READOUT_SECTIONS` IS THE RIGHT LIST AND `MANIFEST_ENTRIES` IS NOT.
 * The manifest carries the Arc's four corridor BEATS as separate rows and
 * has no `proof` row at all (the casefile shares `#services`' DOM section
 * and its rail detent — ADR-056). The readout table is the journey as a
 * READER experiences it: the Arc once, the casefile seated ahead of the
 * offer it introduces. Seven rows. Both candidates draw seven marks, and
 * adding a section anywhere adds one to each with no edit here.
 */
export const JOURNEY_ROWS = READOUT_SECTIONS;

/** 13 ticks, 12 intervals — ADR-031's ladder, unchanged. */
export const LADDER_TICKS = 13;
export const LADDER_INTERVALS = LADDER_TICKS - 1;

/* ── The runway ───────────────────────────────────────────────────────── */

/**
 * A PART is one journey row's stretch of the synthetic document.
 *
 * ⚠ A BLOCK IS NOT A ROW, because on the real phone page it is not one
 * either: `#services` carries BOTH `proof` and `services` (the casefile
 * then the offer), `#about`'s bio runs straight into `#voidwalker`, and the
 * hero and the corridor both resolve to `THE ARC` (`sectionLabel.ts` —
 * that collapse is what makes the hero→corridor seam flicker-free). So the
 * runway's five blocks hold EIGHT parts across SEVEN rows, and two of those
 * parts share row `arc`.
 *
 * That sharing is the case worth having in the lab: the detent must HOLD
 * STILL across the hero→corridor seam. An instrument that steps there is
 * counting blocks, not sections.
 */
export interface RunwayPart {
  /** A `JOURNEY_ROWS` id. Two parts may share one. */
  row: string;
  /** Which block of the runway this part is drawn inside. */
  block: RunwayBlockId;
}

export type RunwayBlockId = "hero" | "corridor" | "casefile" | "eras" | "contact";

export const RUNWAY_PARTS: readonly RunwayPart[] = [
  { row: "arc", block: "hero" },
  { row: "arc", block: "corridor" },
  { row: "proof", block: "casefile" },
  { row: "services", block: "casefile" },
  { row: "about", block: "eras" },
  { row: "voidwalker", block: "eras" },
  { row: "practice", block: "contact" },
  { row: "contact", block: "contact" },
];

/** Row id → its index in `JOURNEY_ROWS`, resolved loudly at module load. */
export function rowIndex(id: string): number {
  const i = JOURNEY_ROWS.findIndex((r) => r.id === id);
  if (i < 0) throw new Error(`[mobile-hud-lab] no READOUT_SECTIONS row "${id}"`);
  return i;
}

/* Fail at module evaluation rather than rendering a runway whose parts
   name rows that do not exist — the drift a rename would otherwise cause
   is a silently missing detent, which is the class of defect a lab is
   supposed to catch rather than ship. */
for (const part of RUNWAY_PARTS) rowIndex(part.row);

/* ── The knobs ────────────────────────────────────────────────────────── */

/**
 * ⚠ ONLY WHERE A REAL DECISION EXISTS. Four knobs, two per candidate; the
 * rest of both drawings is solved arithmetic (the band, the apothem, the
 * 3:1 floor) and a slider over solved arithmetic is a slider that lets the
 * owner pick a failing value.
 *
 * The one place that is deliberately NOT true is `a0` — the strip's tick
 * alpha at 0.34, which is the desktop rail's own rung and measures
 * **2.0:1 in dark / 1.9:1 in light**, i.e. under the non-text floor in both
 * themes. It is on the dial so the owner can see WHY the shipped value is
 * as loud as it is; the capture gates run the default and would fail here.
 */
export interface Knob<T> {
  id: string;
  label: string;
  /** The `?` key it syncs to. */
  param: string;
  options: readonly { id: string; label: string; value: T }[];
  /** Index into `options`. */
  fallback: number;
  /** Which routes it applies to; empty ⇒ all. */
  routes: readonly MobileHudVariantId[];
}

export const STRIP_ALPHA: Knob<number> = {
  id: "alpha",
  label: "Tick ink",
  param: "a",
  routes: ["c1"],
  fallback: 1,
  options: [
    { id: "a0", label: "·34 rail", value: 0.34 },
    { id: "a1", label: "·48 floor", value: 0.48 },
    { id: "a2", label: "·62 loud", value: 0.62 },
  ],
};

export const STRIP_GLIDE: Knob<number> = {
  id: "glide",
  label: "Detent glide",
  param: "g",
  routes: ["c1", "c2"],
  fallback: 1,
  options: [
    { id: "g0", label: "180ms", value: 180 },
    { id: "g1", label: "320ms", value: 320 },
    { id: "g2", label: "520ms", value: 520 },
  ],
};

export const DIAL_SIZE: Knob<number> = {
  id: "size",
  label: "Dial",
  param: "d",
  routes: ["c2"],
  fallback: 1,
  options: [
    { id: "d0", label: "48px", value: 48 },
    { id: "d1", label: "52px", value: 52 },
    { id: "d2", label: "56px", value: 56 },
  ],
};

export type NeedleStyle = "line" | "wedge";

export const NEEDLE: Knob<NeedleStyle> = {
  id: "needle",
  label: "Needle",
  param: "n",
  routes: ["c2"],
  fallback: 0,
  options: [
    { id: "n0", label: "Line", value: "line" },
    { id: "n1", label: "Wedge", value: "wedge" },
  ],
};

/**
 * The phone-frame width presets.
 *
 * ⚠ THEY SIZE THE RUNWAY COLUMN, NOT THE VIEWPORT, AND THEY CANNOT.
 * Both candidates are `position: fixed` — they measure the WINDOW, exactly
 * as they will in production — and `--mobile-chrome-*` lives in a
 * `max-width: 960px` media block, so nothing in a desktop window resolves
 * the way a phone does. The presets are a composition aid for eyeballing
 * the column; the real judgement is a real phone viewport, which is what
 * `capture-hud-instruments.mjs --lab mobile` shoots.
 */
export const FRAME_WIDTHS: Knob<number> = {
  id: "width",
  label: "Frame",
  param: "w",
  routes: [],
  fallback: 1,
  options: [
    { id: "w0", label: "360", value: 360 },
    { id: "w1", label: "390", value: 390 },
    { id: "w2", label: "430", value: 430 },
  ],
};

export const ALL_KNOBS = [STRIP_ALPHA, STRIP_GLIDE, DIAL_SIZE, NEEDLE, FRAME_WIDTHS] as const;
