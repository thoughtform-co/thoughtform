/**
 * The syllabus's chrome and its pure arithmetic (ADR-134). Zero imports but
 * types: the record authors the words, and everything lettered here — the
 * sheet's row keys, the numerals, the class kicker — is the renderer's, so a
 * course cannot rename "the gate" on one class and not the next.
 */

import type { ArcSyllabusClass, ArcSyllabusGlyph, ArcSyllabusPhase } from "@/lib/arcs/types";

/** The sheet's four rows, in the order a student reads a class. */
export const SYLLABUS_ROWS = [
  { id: "objective", label: "Objective" },
  { id: "make", label: "You make" },
  { id: "gate", label: "The gate" },
  { id: "tool", label: "The tool" },
] as const satisfies readonly { id: keyof ArcSyllabusClass; label: string }[];

export const SYLLABUS_TABLIST_LABEL = "The classes";
export const SYLLABUS_CLASS_WORD = "Class";
export const SYLLABUS_EXAMPLE_FLAG = "Worked example";

/** A class's numeral, `01` … — the renderer's, never authored. */
export const classNumeral = (i: number): string => String(i + 1).padStart(2, "0");

/** The track's columns: the fork, one per class, the launch. */
export const TRACK_ENTRY_COL = 1;
export const classCol = (i: number): number => i + 2;
export const launchCol = (n: number): number => n + 2;

export interface PhaseSpan {
  id: string;
  label: string;
  /** First and last class index, inclusive. */
  from: number;
  to: number;
  /** CSS grid-column, the last phase running on over the launch. */
  column: string;
}

/**
 * Each phase's run of classes, in phase order. A phase with no class is
 * dropped; the registry refuses a record where a phase's classes are not
 * one consecutive run, so `from`/`to` are the whole story here.
 */
export function phaseSpans(
  phases: readonly ArcSyllabusPhase[],
  classes: readonly ArcSyllabusClass[]
): PhaseSpan[] {
  const n = classes.length;
  const spans: PhaseSpan[] = [];
  phases.forEach((p) => {
    const idx = classes.flatMap((c, i) => (c.phase === p.id ? [i] : []));
    if (idx.length === 0) return;
    const from = Math.min(...idx);
    const to = Math.max(...idx);
    spans.push({ id: p.id, label: p.label, from, to, column: "" });
  });
  const last = spans.length - 1;
  return spans.map((s, k) => ({
    ...s,
    column: `${classCol(s.from)} / ${k === last ? launchCol(n) + 1 : classCol(s.to) + 1}`,
  }));
}

/** The phase a class sits in, for the sheet's kicker. */
export function phaseLabel(phases: readonly ArcSyllabusPhase[], id: string): string {
  return phases.find((p) => p.id === id)?.label ?? "";
}

/* ── The deliverable frames ─────────────────────────────────────────────
   Each glyph is the SHAPE of what a class makes, in a 64 × 48 box: hairline
   rects, lines and circles, no text, no transform. Drawn once here so the
   station and the phone grid cannot draw two versions of one thing. */

export const GLYPH_W = 64;
export const GLYPH_H = 48;

export type GlyphPart =
  | { t: "rect"; x: number; y: number; w: number; h: number }
  | { t: "line"; x1: number; y1: number; x2: number; y2: number }
  | { t: "dot"; cx: number; cy: number; r: number };

const rect = (x: number, y: number, w: number, h: number): GlyphPart => ({ t: "rect", x, y, w, h });
const line = (x1: number, y1: number, x2: number, y2: number): GlyphPart => ({
  t: "line",
  x1,
  y1,
  x2,
  y2,
});
const dot = (cx: number, cy: number, r: number): GlyphPart => ({ t: "dot", cx, cy, r });

/** A 4 × 3 wall of frames: images at scale. */
const wall = (): GlyphPart[] => {
  const out: GlyphPart[] = [];
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 4; col++) out.push(rect(6 + col * 14, 5 + row * 13.5, 10, 10));
  return out;
};

export const GLYPHS: Record<ArcSyllabusGlyph, readonly GlyphPart[]> = {
  /* Three accounts, connected. */
  setup: [
    line(12, 36, 32, 14),
    line(32, 14, 52, 36),
    line(12, 36, 52, 36),
    rect(6, 30, 12, 12),
    rect(26, 8, 12, 12),
    rect(46, 30, 12, 12),
  ],
  /* A reference board: frames of different sizes. */
  board: [rect(6, 5, 22, 17), rect(32, 5, 26, 24), rect(6, 26, 22, 17), rect(32, 33, 26, 10)],
  /* The world at scale. */
  wall: wall(),
  /* A line in the world's voice, set on a mockup. */
  offer: [rect(8, 9, 48, 30), line(15, 20, 49, 20), line(15, 27, 38, 27), dot(48, 32, 1.4)],
  /* A 4:5 poster: a moon over a horizon. */
  poster: [rect(18, 5, 28, 38), dot(36, 15, 4), line(18, 31, 46, 31)],
  /* A page in a browser. */
  site: [
    rect(6, 6, 52, 36),
    line(6, 13, 58, 13),
    dot(10.5, 9.5, 1.2),
    dot(14.5, 9.5, 1.2),
    dot(18.5, 9.5, 1.2),
    rect(12, 18, 40, 12),
    line(12, 35, 38, 35),
  ],
  /* A strip of three frames between two sprocket bands. */
  film: [
    rect(4, 8, 56, 32),
    line(4, 14, 60, 14),
    line(4, 34, 60, 34),
    line(22.7, 14, 22.7, 34),
    line(41.3, 14, 41.3, 34),
  ],
  /* All three, shown as one. */
  launch: [
    rect(4, 14, 13, 20),
    dot(10.5, 19.5, 2),
    rect(21, 14, 22, 20),
    line(21, 18.5, 43, 18.5),
    rect(47, 14, 13, 20),
    line(47, 18, 60, 18),
    line(47, 30, 60, 30),
  ],
};
