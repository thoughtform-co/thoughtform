import type { Pt } from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";
import { polylineLength } from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";
import type { ArcSectionOf, CrewOutput, CrewRow } from "@/lib/arcs/types";

import {
  FS,
  INSET,
  SANS_ADV,
  wrapAll,
  type CirLetter,
  type CirMark,
  type CirModule,
  type CirWire,
  type Ink,
  type Rect,
} from "./circuitLayout";

/**
 * crewLayout — THE CREW's arithmetic (ADR-133 U5). Pure.
 *
 * WHAT IT RETURNED AT LOOP, ONE ROW PER ROLE, READ LEFT TO RIGHT (owner,
 * 2026-09-29: "I really like the flow from left to right … just a super clear
 * visualization of what's now been possible because of this"). A row is the
 * people (a green seat, a head count only where the record states one), a
 * short tap, and a gold plate carrying what is possible now: the quantity
 * drawn as marks on its left — seven hundred pads, a dozen pre-filled lines
 * for one editor, ten reviews of which a person takes one, one count divided
 * into its briefs — and the record's readout said on its right.
 *
 * ⚠ U4's upstream / downstream bands are retired ("doesn't really make sense"
 * here), and the client's half with them. ⚠ THE OUTPUTS ARE MARKS, NOT A
 * CHART: no axis and no scale shared across rows, because the four readings
 * are not one quantity.
 */

export const CREW_VB = { w: 1400, h: 492 } as const;
const ROW_H = 96;
const ROW_GAP = (CREW_VB.h - 2 * INSET - 4 * ROW_H) / 3;
export const rowY = (i: number) => INSET + i * (ROW_H + ROW_GAP);
/** The row's three parts: the seat, the tap, the plate of what is possible. */
export const SEAT_W = 300;
const TAP = 40;
export const OUT_X = INSET + SEAT_W + TAP;
export const OUT_W = CREW_VB.w - INSET - OUT_X;
const MARK_W = 420;
const PAD_X = 16;

export interface CrewGeom {
  vb: { w: number; h: number };
  modules: CirModule[];
  marks: CirMark[];
  letters: CirLetter[];
  wires: CirWire[];
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
/** A short four-wire tap, level, from the seat into the plate. */
function tap(
  id: string,
  x1: number,
  x2: number,
  y: number,
  ends: readonly [string, string]
): CirWire {
  const pts: Pt[] = [
    [x1, y],
    [x2, y],
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

/** What a row made possible, drawn in its box. */
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

  s.rows.forEach((row: CrewRow, i) => {
    const y = rowY(i);
    const id = `row-${row.id}`;
    const cy = y + ROW_H / 2;

    // The people: a head count only where the record states one.
    modules.push({
      id: `${id}-seat`,
      rect: { x: INSET, y, w: SEAT_W, h: ROW_H },
      cut: 12,
      paint: "green",
    });
    for (let p = 0; p < (row.people ?? 0); p += 1) {
      marks.push({ kind: "person", x: INSET + PAD_X + p * 26, y: y + 16, cell: 3 });
    }
    letters.push(
      ...sans(
        `${id}.who`,
        row.who,
        FS.chrome,
        SEAT_W - 2 * PAD_X,
        INSET + PAD_X,
        y + 70,
        "green-ink",
        1,
        true
      )
    );

    wires.push(tap(`${id}-tap`, INSET + SEAT_W, OUT_X, cy, [`${id}-seat`, `${id}-out`]));

    // What is possible now: drawn on the left, said on the right.
    modules.push({
      id: `${id}-out`,
      rect: { x: OUT_X, y, w: OUT_W, h: ROW_H },
      cut: 12,
      paint: "gold",
    });
    drawOutput(row.output, { x: OUT_X + PAD_X, y: y + (ROW_H - 56) / 2, w: MARK_W, h: 56 }, marks);
    const tx = OUT_X + PAD_X + MARK_W + 40;
    const tm = OUT_X + OUT_W - PAD_X - tx;
    letters.push(...sans(`${id}.value`, row.value, FS.name, tm, tx, y + 44, "ink", 1, true));
    letters.push(...sans(`${id}.unit`, row.unit, FS.answer, tm, tx, y + 70, "ink2"));
  });

  return { vb: { ...CREW_VB }, modules, marks, letters, wires };
}
