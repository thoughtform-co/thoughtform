import type { Pt } from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";
import { polylineLength } from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";
import type { ArcSectionOf, CrewOutput, CrewRow } from "@/lib/arcs/types";

import {
  FS,
  INSET,
  SANS_ADV,
  TRACK,
  wrapAll,
  type CirLetter,
  type CirMark,
  type CirModule,
  type CirWire,
  type Ink,
  type Rect,
} from "./circuitLayout";

/**
 * crewLayout — THE CREW's arithmetic (ADR-133 U4). Pure.
 *
 * WHAT IT RETURNED AT LOOP, AS THE APPROACH'S TWO BANDS. One column per role
 * (owner, 2026-09-29, on Rob's four points: the two designers and a copywriter
 * who make far more, the PMs who fill in the copy, the head of design who
 * reviews less, creative strategy whose ad count is divided for it). Above a
 * dashed line, green, the people and what they spend the time on now: the
 * upstream. Below it, gold, what runs: the record's readout, with one small
 * mark drawn as the quantity it is — seven hundred pads, a dozen pre-filled
 * lines for one editor, ten reviews of which a person takes one, one count
 * divided into its briefs.
 *
 * ⚠ THE CLIENT'S HALF IS GONE (U4): the readouts "counted from week one" were
 * ruled out. ⚠ THE OUTPUTS ARE MARKS, NOT A CHART: no axis and no scale shared
 * across columns, because the four readings are not one quantity.
 * ⚠ A HEAD COUNT ONLY WHERE THE RECORD STATES ONE: a plural role draws no
 * person marks rather than an invented number of them.
 */

export const CREW_VB = { w: 1400, h: 442 } as const;
const GAP = 32;
export const COL_W = (CREW_VB.w - 2 * INSET - 3 * GAP) / 4;
export const colX = (i: number) => INSET + i * (COL_W + GAP);

/** The upstream band's plates, the line, the downstream band's plates. */
const UP = { label: 44, y: 56, h: 128 } as const;
export const LINE_Y = 212;
const DOWN = { label: 244, y: 258, h: 160 } as const;
const PAD_X = 14;

export interface CrewGeom {
  vb: { w: number; h: number };
  modules: CirModule[];
  marks: CirMark[];
  letters: CirLetter[];
  wires: CirWire[];
}

const up = (s: string) => s.toUpperCase();
function mono(
  slot: string,
  text: string,
  fs: number,
  track: number,
  measure: number,
  x: number,
  y: number,
  ink: Ink
): CirLetter {
  return { slot, text: up(text), fs, track, measure, face: "mono", x, y, anchor: "start", ink };
}
function sans(
  slot: string,
  text: string,
  fs: number,
  measure: number,
  x: number,
  y0: number,
  ink: Ink,
  max = 1,
  lit?: boolean,
  step = 20
): CirLetter[] {
  const per = Math.floor(measure / (SANS_ADV * fs));
  return wrapAll(text, per).map((line, i) => ({
    slot: `${slot}.${i}`,
    text: line,
    fs,
    track: 0,
    measure: i < max ? measure : 0,
    face: "sans" as const,
    x,
    y: y0 + i * step,
    anchor: "start" as const,
    ink,
    lit,
  }));
}
const ALL = { a: 1, b: 1, c: 1 } as const;
const NOW = { a: 0, b: 0, c: 0 } as const;
/** A short four-wire tap, straight down from one plate to the next. */
function drop(
  id: string,
  x: number,
  y1: number,
  y2: number,
  ends: readonly [string, string]
): CirWire {
  const pts: Pt[] = [
    [x, y1],
    [x, y2],
  ];
  return {
    id,
    pts,
    wires: 4,
    pitch: 4,
    paint: "gold",
    len: polylineLength(pts),
    on: ALL,
    delays: NOW,
    ends,
  };
}

/** The output of a column, drawn in its box. */
function drawOutput(o: CrewOutput, box: Rect, marks: CirMark[]): void {
  switch (o.kind) {
    case "field": {
      // One pad per unit, in a field that fills the box's width.
      const cols = Math.ceil(Math.sqrt((o.count * box.w) / box.h));
      const rows = Math.ceil(o.count / cols);
      const px = box.w / cols;
      const py = box.h / rows;
      for (let n = 0; n < o.count; n += 1) {
        const c = n % cols;
        const r = Math.floor(n / cols);
        marks.push({
          kind: "pad",
          x: box.x + c * px,
          y: box.y + r * py,
          w: Math.max(1.2, px * 0.62),
          h: Math.max(1.2, py * 0.62),
          tone: "gold",
        });
      }
      return;
    }
    case "funnel": {
      // The pre-filled lines, three columns of short bars, and the one
      // person who reads them all.
      const cols = 3;
      const rows = Math.ceil(o.lines / cols);
      const bw = (box.w - 64) / cols - 8;
      for (let n = 0; n < o.lines; n += 1) {
        const c = n % cols;
        const r = Math.floor(n / cols);
        marks.push({
          kind: "pad",
          x: box.x + c * (bw + 8),
          y: box.y + 4 + r * (box.h / rows),
          w: bw,
          h: 3,
          tone: "gold",
        });
      }
      marks.push({ kind: "person", x: box.x + box.w - 30, y: box.y + box.h / 2 - 12, cell: 3.4 });
      return;
    }
    case "tenfold": {
      // Ten reviews. The agent reads nine first; a person takes one.
      const s = Math.min(22, box.h - 8);
      const gap = (box.w - 10 * s) / 9;
      for (let n = 0; n < 10; n += 1) {
        marks.push({
          kind: "pad",
          x: box.x + n * (s + gap),
          y: box.y + (box.h - s) / 2,
          w: s,
          h: s,
          tone: n === 9 ? "green" : "ring-gold",
        });
      }
      return;
    }
    case "split": {
      // One count, and the same count divided into its briefs: a whole bar
      // over the bar broken into parts.
      const h = 14;
      const gap = 6;
      const top = box.y + (box.h - 2 * h - 10) / 2;
      marks.push({ kind: "pad", x: box.x, y: top, w: box.w, h, tone: "gold" });
      const w = (box.w - (o.parts - 1) * gap) / o.parts;
      for (let n = 0; n < o.parts; n += 1) {
        marks.push({
          kind: "pad",
          x: box.x + n * (w + gap),
          y: top + h + 10,
          w,
          h,
          tone: "ring-gold",
        });
      }
      return;
    }
  }
}

export function crewGeom(s: ArcSectionOf<"crew">): CrewGeom {
  const modules: CirModule[] = [];
  const marks: CirMark[] = [];
  const letters: CirLetter[] = [];
  const wires: CirWire[] = [];
  const m = COL_W - 2 * PAD_X;

  // The two bands' names, and the line the work crosses between them.
  letters.push(
    mono(
      "band.up",
      s.bands.upstream,
      FS.key,
      TRACK.key,
      CREW_VB.w - 2 * INSET,
      INSET,
      UP.label,
      "green-ink"
    )
  );
  letters.push(
    mono(
      "band.down",
      s.bands.downstream,
      FS.key,
      TRACK.key,
      CREW_VB.w - 2 * INSET,
      INSET,
      DOWN.label,
      "gold-ink"
    )
  );
  marks.push({
    kind: "rule",
    x1: INSET,
    y1: LINE_Y,
    x2: CREW_VB.w - INSET,
    y2: LINE_Y,
    tone: "line",
    dash: true,
  });

  s.rows.forEach((row: CrewRow, i) => {
    const x = colX(i);
    const id = `row-${row.id}`;

    // Upstream: the people, and what the time goes to now.
    modules.push({
      id: `${id}-up`,
      rect: { x, y: UP.y, w: COL_W, h: UP.h },
      cut: 12,
      paint: "green",
    });
    for (let p = 0; p < (row.people ?? 0); p += 1) {
      marks.push({ kind: "person", x: x + PAD_X + p * 26, y: UP.y + 14, cell: 3 });
    }
    letters.push(
      ...sans(`${id}.who`, row.who, FS.chrome, m, x + PAD_X, UP.y + 60, "green-ink", 1, true)
    );
    letters.push(
      ...sans(`${id}.upstream`, row.upstream, FS.answer, m, x + PAD_X, UP.y + 90, "ink", 2)
    );

    // The drop across the line, off-centre to the right: the band's label
    // runs in from the left edge on the row the drop crosses.
    const cx = x + COL_W - 24;
    wires.push(drop(`${id}-drop`, cx, UP.y + UP.h, DOWN.y, [`${id}-up`, `${id}-down`]));

    // Downstream: what runs, drawn, and the record's readout.
    modules.push({
      id: `${id}-down`,
      rect: { x, y: DOWN.y, w: COL_W, h: DOWN.h },
      cut: 12,
      paint: "gold",
    });
    drawOutput(row.output, { x: x + PAD_X, y: DOWN.y + 14, w: m, h: 56 }, marks);
    letters.push(
      ...sans(`${id}.value`, row.value, FS.value, m, x + PAD_X, DOWN.y + 100, "ink", 1, true)
    );
    letters.push(...sans(`${id}.unit`, row.unit, FS.chrome, m, x + PAD_X, DOWN.y + 122, "ink2", 2));
  });

  return { vb: { ...CREW_VB }, modules, marks, letters, wires };
}
