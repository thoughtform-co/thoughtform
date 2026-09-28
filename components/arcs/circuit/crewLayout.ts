import type { Pt } from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";
import { polylineLength } from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";
import type { ArcSectionOf, CrewMeasure, CrewOutput, CrewRow } from "@/lib/arcs/types";

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
 * crewLayout — THE CREW's arithmetic (ADR-133). Pure.
 *
 * The business case, DRAWN: two halves of one instrument on one datum. Left,
 * the RECORD — four rows at Loop, each a seat (the people, counted as marks),
 * the one configuration they run, and what came out, drawn as the quantity it
 * is: seven hundred pads for seven hundred assets, a dozen pre-filled lines
 * converging on one editor, ten reviews of which a person takes one, a month
 * of four weeks with one of them handed back. Right, the PLAN — the same
 * shape at the client, the configuration dashed because it is not built yet
 * and the readout FRAMED AND EMPTY: what is counted in week one and read
 * every month, never a number we promise.
 *
 * ⚠ THE OUTPUTS ARE MARKS, NOT A CHART. There is no axis and no scale shared
 * across rows: each row draws its own record in its own unit, because the
 * four readings are not the same quantity and a common scale would claim they
 * are.
 */

export const CREW_VB = { w: 1400, h: 560 } as const;
const HALF_W = (CREW_VB.w - 2 * INSET - 48) / 2;
export const HALF_X = [INSET, INSET + HALF_W + 48] as const;
const ROWS_Y = 72;
const ROW_H = 104;
const ROW_GAP = (CREW_VB.h - INSET - ROWS_Y - 4 * ROW_H) / 3;
export const rowY = (i: number) => ROWS_Y + i * (ROW_H + ROW_GAP);

/** The columns of one half: seat · configuration · output, with taps between. */
const SEAT_W = 180;
const CFG_W = 168;
const TAP = 20;
const OUT_W = HALF_W - SEAT_W - CFG_W - 2 * TAP;

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

/** The output of a record row, drawn in its box. */
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
    case "month": {
      // A month of four weeks, one of them handed back.
      const gap = 10;
      const w = (box.w - 3 * gap) / 4;
      for (let n = 0; n < 4; n += 1) {
        marks.push({
          kind: "pad",
          x: box.x + n * (w + gap),
          y: box.y + 4,
          w,
          h: box.h - 8,
          tone: n === 3 ? "green" : "ring-dawn",
        });
      }
      return;
    }
  }
}

function seat(
  id: string,
  x: number,
  y: number,
  who: string,
  people: number,
  modules: CirModule[],
  marks: CirMark[],
  letters: CirLetter[]
): void {
  modules.push({ id: `${id}-seat`, rect: { x, y, w: SEAT_W, h: ROW_H }, cut: 12, paint: "green" });
  for (let p = 0; p < people; p += 1) {
    marks.push({ kind: "person", x: x + 14 + p * 26, y: y + 12, cell: 3 });
  }
  letters.push(
    ...sans(`${id}.who`, who, FS.chrome, SEAT_W - 28, x + 14, y + 60, "green-ink", 2, true)
  );
}

function config(
  id: string,
  x: number,
  y: number,
  name: string,
  planned: boolean,
  modules: CirModule[],
  letters: CirLetter[]
): void {
  const h = 60;
  const cy = y + (ROW_H - h) / 2;
  modules.push({
    id: `${id}-cfg`,
    rect: { x, y: cy, w: CFG_W, h },
    cut: 12,
    paint: planned ? "gold-future" : "gold",
  });
  letters.push(...sans(`${id}.cfg`, name, FS.chrome, CFG_W - 24, x + 12, cy + 26, "ink", 2, true));
}

export function crewGeom(s: ArcSectionOf<"crew">): CrewGeom {
  const modules: CirModule[] = [];
  const marks: CirMark[] = [];
  const letters: CirLetter[] = [];
  const wires: CirWire[] = [];

  // The two halves' names, on the datum above the rows.
  letters.push(
    mono("record.label", s.record.label, FS.key, TRACK.key, HALF_W, HALF_X[0], 44, "ink")
  );
  letters.push(mono("plan.label", s.plan.label, FS.key, TRACK.key, HALF_W, HALF_X[1], 44, "ink"));

  s.record.rows.forEach((row: CrewRow, i) => {
    const y = rowY(i);
    const x0 = HALF_X[0];
    const id = `record-${row.id}`;
    const cfgX = x0 + SEAT_W + TAP;
    const outX = cfgX + CFG_W + TAP;
    seat(id, x0, y, row.who, row.people, modules, marks, letters);
    config(id, cfgX, y, row.config, false, modules, letters);
    modules.push({
      id: `${id}-out`,
      rect: { x: outX, y, w: OUT_W, h: ROW_H },
      cut: 12,
      paint: "plate",
    });
    drawOutput(row.output, { x: outX + 12, y: y + 10, w: OUT_W - 24, h: 44 }, marks);
    letters.push(
      ...sans(`${id}.value`, row.value, FS.value, OUT_W - 24, outX + 12, y + 76, "ink", 1, true)
    );
    letters.push(...sans(`${id}.unit`, row.unit, FS.chrome, OUT_W - 24, outX + 12, y + 95, "ink2"));
    const cy = y + ROW_H / 2;
    wires.push(tap(`${id}-a`, x0 + SEAT_W, cfgX, cy, [`${id}-seat`, `${id}-cfg`]));
    wires.push(tap(`${id}-b`, cfgX + CFG_W, outX, cy, [`${id}-cfg`, `${id}-out`]));
  });

  s.plan.rows.forEach((row: CrewMeasure, i) => {
    const y = rowY(i);
    const x0 = HALF_X[1];
    const id = `plan-${row.id}`;
    const cfgX = x0 + SEAT_W + TAP;
    const outX = cfgX + CFG_W + TAP;
    seat(id, x0, y, row.who, 0, modules, marks, letters);
    config(id, cfgX, y, row.config, true, modules, letters);
    // The readout: the measure's name in a framed key well, and the value
    // cell under it framed, dashed and EMPTY — read from week one.
    modules.push({ id: `${id}-key`, rect: { x: outX, y, w: OUT_W, h: 44 }, cut: 0, paint: "well" });
    modules.push({
      id: `${id}-out`,
      rect: { x: outX, y: y + 50, w: OUT_W, h: ROW_H - 50 },
      cut: 0,
      paint: "future",
    });
    letters.push(
      ...sans(
        `${id}.measure`,
        row.measure,
        FS.chrome,
        OUT_W - 24,
        outX + 12,
        y + 28,
        "ink",
        1,
        true
      )
    );
    letters.push(
      ...sans(`${id}.source`, row.source, FS.chrome, OUT_W - 24, outX + 12, y + 83, "ink2")
    );
    const cy = y + ROW_H / 2;
    wires.push(tap(`${id}-a`, x0 + SEAT_W, cfgX, cy, [`${id}-seat`, `${id}-cfg`]));
    wires.push(tap(`${id}-b`, cfgX + CFG_W, outX, cy, [`${id}-cfg`, `${id}-out`]));
  });

  return { vb: { ...CREW_VB }, modules, marks, letters, wires };
}
