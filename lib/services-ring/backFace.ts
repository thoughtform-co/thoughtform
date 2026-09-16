/**
 * backFace — the layout of a phone card's BACK face (ADR-110): the spec the
 * desktop drawer and the phone sheet carried, solved as rows in the bake's
 * own 840×1360 space so FIT IS ASSERTED, NOT REVIEWED.
 *
 * ONE layout function, parameterised by a `measure` callback. The bake passes
 * a `ctx.measureText`-backed measure; the unit test passes `modelMeasure`,
 * whose advances are deliberately GENEROUS (sans 0.55 em, mono 0.60 em + the
 * tracking), so the model's line counts bound the real ones and the two can
 * never disagree on the rows. Every rung sits on or above `BACK_TYPE_FLOOR`;
 * the content ends above `BACK_CONTENT_LIMIT`, the CTA's clearance.
 *
 * Three-free (a lib module the gate test walks); the record it letters is
 * `SERVICE_PLATES`, types only.
 */
import type {
  ServicePlate,
  ServiceSpec,
} from "@/components/landing/home-v2/services/servicePlateData";
import {
  BAKE_W,
  CTA_H,
  CTA_Y0,
  DRAWER_CLOSE_INSET,
  DRAWER_CLOSE_SIZE,
  PAD_X,
} from "@/components/landing/home-v2/services/hologram/ringCtaBox";
import { TRACK_DISPLAY, TRACK_EYEBROW, TRACK_LABEL } from "./ringType";

/** The rungs, bake px. On a 257 css px iPhone 14 card one bake px is
 *  0.306 css px, so the floor letters at ~10.4 css px (owner, 2026-09-16:
 *  the card keeps its size when it turns — the floor is the lever). The
 *  first cut floored at 30 and pooled ~110 bake px above the CTA; the
 *  visual review spent that slack on the type. */
export const BACK_RUNGS = {
  chip: 34,
  title: 58,
  titleLh: 66,
  desig: 34,
  bullet: 42,
  bulletLh: 48,
  bulletGap: 14,
  dt: 34,
  dd: 40,
  ddLh: 44,
  cta: 34,
  ctaArrow: 40,
} as const;
export const BACK_TYPE_FLOOR = 34;
/** The bullets' diamond, bake px (11 painted as a 3 css px speck). */
export const BACK_DIAMOND = 15;
/** The content's floor — air above the CTA plate. */
export const BACK_CONTENT_LIMIT = CTA_Y0 - 24;
/** The title's cap top — the front face's own datum, measured off the chit. */
export const BACK_TITLE_CAP_TOP = DRAWER_CLOSE_INSET + DRAWER_CLOSE_SIZE + 50;
/** The chip's baseline: its cap centre shares the chit's centre line
 *  (`DRAWER_CLOSE_INSET + DRAWER_CLOSE_SIZE / 2` = 62), the front's rule. */
export const BACK_CHIP_BASELINE = 72;
export const BACK_MAX_W = BAKE_W - PAD_X * 2;
export const BACK_COL_W = BACK_MAX_W / 2;
export const BACK_BULLET_INDENT = 38;
/** The CTA label's baseline (the drawer's, one px lower for the larger rung). */
export const BACK_CTA_BASELINE = CTA_Y0 + CTA_H / 2 + 11;

export type BackMeasure = (
  text: string,
  px: number,
  family: "mono" | "sans",
  track: number
) => number;

/** The test's advance model — generous by design (see the module note).
 *  MEASURED, not guessed (`scripts/probe-bake-advance.mjs`, 2026-09-16, the
 *  real faces on the live page): PP Neue Montreal 400 runs 0.43 em on
 *  average and 0.48 em on the widest of the back's own strings; PT Mono is
 *  0.60 em exactly. 0.50 for the sans is the widest string plus 4 %; a
 *  wider model bounds nothing tighter, it only fails records that fit. */
export const MODEL_ADVANCE_SANS = 0.5;
export const MODEL_ADVANCE_MONO = 0.6;
export const modelMeasure: BackMeasure = (text, px, family, track) =>
  text.length *
  (family === "mono" ? px * MODEL_ADVANCE_MONO + px * track : px * MODEL_ADVANCE_SANS);

/** Greedy word wrap on spaces alone; a word wider than the measure gets a
 *  line of its own and is reported over-wide by its caller's assertion. */
export function wrapGreedy(text: string, maxW: number, width: (s: string) => number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && width(next) > maxW) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** The wrap the back letters with: greedy, and where greedy gives TWO lines
 *  the split that minimises the longer line instead — "An AI capability /
 *  the team can run." rather than "…the team can / run." (the visual
 *  review's orphans). Never more lines than greedy, never a line over the
 *  measure; three lines and up stay greedy. */
export function wrapWords(text: string, maxW: number, width: (s: string) => number): string[] {
  const greedy = wrapGreedy(text, maxW, width);
  if (greedy.length !== 2) return greedy;
  const words = text.split(/\s+/).filter(Boolean);
  let best = greedy;
  let bestMax = Math.max(width(greedy[0]), width(greedy[1]));
  for (let cut = 1; cut < words.length; cut += 1) {
    const a = words.slice(0, cut).join(" ");
    const b = words.slice(cut).join(" ");
    const wa = width(a);
    const wb = width(b);
    if (wa > maxW || wb > maxW) continue;
    const m = Math.max(wa, wb);
    if (m < bestMax - 1e-6) {
      bestMax = m;
      best = [a, b];
    }
  }
  return best;
}

export interface BackFaceCell {
  key: keyof ServiceSpec;
  label: string;
  x: number;
  dtBaseline: number;
  lines: string[];
  ddBaselines: number[];
  wide: boolean;
}

export interface BackFaceLayout {
  chip: string;
  chipBaseline: number;
  titleLines: string[];
  titleBaselines: number[];
  whatBaseline: number;
  bullets: { lines: string[]; baselines: number[] }[];
  ruleY: number;
  howBaseline: number;
  cells: BackFaceCell[];
  /** The last dd's descender — must clear `BACK_CONTENT_LIMIT`. */
  contentBottom: number;
  ctaLabel: string;
  ctaBaseline: number;
}

const CELL_ORDER: ReadonlyArray<[keyof ServiceSpec, string]> = [
  ["duration", "Duration"],
  ["participants", "Participants"],
  ["format", "Format"],
  ["language", "Language"],
  ["leavesWith", "Leaves with"],
];

export function backFaceLayout(
  plate: ServicePlate,
  measure: BackMeasure = modelMeasure
): BackFaceLayout {
  const R = BACK_RUNGS;
  const sans = (px: number) => (s: string) => measure(s, px, "sans", 0);

  const chip = plate.chip.toUpperCase();
  const titleLines = wrapWords(plate.title, BACK_MAX_W, (s) =>
    measure(s, R.title, "sans", TRACK_DISPLAY)
  );
  const titleFirst = BACK_TITLE_CAP_TOP + 41; // cap height of the 58 rung
  const titleBaselines = titleLines.map((_, i) => titleFirst + i * R.titleLh);
  const whatBaseline = titleBaselines[titleBaselines.length - 1] + 66;

  let y = whatBaseline + 56;
  const bullets = plate.breakdown.map((item) => {
    const lines = wrapWords(item, BACK_MAX_W - BACK_BULLET_INDENT, sans(R.bullet));
    const baselines = lines.map((_, i) => y + i * R.bulletLh);
    y += lines.length * R.bulletLh + R.bulletGap;
    return { lines, baselines };
  });
  const lastBullet = y - R.bulletGap - R.bulletLh; // the last line's baseline
  const ruleY = lastBullet + 36;
  const howBaseline = ruleY + 42;

  const cells: BackFaceCell[] = [];
  let dt = howBaseline + 54;
  for (let row = 0; row < 3; row += 1) {
    const wide = row === 2;
    const rowKeys = wide ? [CELL_ORDER[4]] : [CELL_ORDER[row * 2], CELL_ORDER[row * 2 + 1]];
    let rowH = 0;
    rowKeys.forEach(([key, label], col) => {
      const lines = wrapWords(plate.spec[key], (wide ? BACK_MAX_W : BACK_COL_W) - 24, sans(R.dd));
      const ddBaselines = lines.map((_, i) => dt + 44 + i * R.ddLh);
      cells.push({
        key,
        label,
        x: PAD_X + col * BACK_COL_W,
        dtBaseline: dt,
        lines,
        ddBaselines,
        wide,
      });
      rowH = Math.max(rowH, 44 + lines.length * R.ddLh);
    });
    dt += rowH + 28;
  }
  const contentBottom = Math.max(...cells.map((c) => c.ddBaselines[c.ddBaselines.length - 1])) + 8;

  return {
    chip,
    chipBaseline: BACK_CHIP_BASELINE,
    titleLines,
    titleBaselines,
    whatBaseline,
    bullets,
    ruleY,
    howBaseline,
    cells,
    contentBottom,
    ctaLabel: plate.ctaLabel.toUpperCase(),
    ctaBaseline: BACK_CTA_BASELINE,
  };
}

/** The chip's and the designations' tracking, so the bake and any guard
 *  measure with the same rung. */
export const BACK_TRACKS = {
  chip: TRACK_EYEBROW,
  desig: TRACK_LABEL,
  dt: TRACK_LABEL,
  cta: TRACK_EYEBROW,
} as const;
