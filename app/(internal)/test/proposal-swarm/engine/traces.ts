/* The opening's connectors, as files of dots. PURE.

   "AI capability your teams own." ties the stack to what stands either side
   of it with hairlines (`stack/heroLayouts.ts`). Here each of those runs is
   a file of standing dots on the same route, with one brighter dot walking
   it the way the work flows:

     four workstreams   each off its chip, onto the team's bus, into the
                        team's plate
     the layer          from its tab down into its plate, and out of its
                        other edge down past its three parts
     four tools         out of the agents' plate, onto the tools' bus, to
                        each card

   Every run ends on a plate's side corner. That end is the PORT: when the
   stack leaves, the file reels into it. */

import { along, type Lane, laneOf } from "./formations";

type Pt = readonly [number, number];

export interface Trace {
  lane: Lane;
  /** Which end is on the stack. */
  port: "start" | "end";
  /** 0 the team's, 1 the layer's, 2 the agents'. */
  plate: 0 | 1 | 2;
  /** Lit: the one tool card the proposal lights. */
  lit: boolean;
}

export interface Traces {
  traces: Trace[];
  /** The standing dots: which trace, and how far along it. */
  count: number;
  of: Uint16Array;
  s: Float32Array;
  /** The longest trace: what a reel has to cover. */
  reach: number;
  pitch: number;
  /** Where a word stands on a file: no dot is drawn inside one. */
  gaps: readonly Gap[];
}

/** A box in device px on the canvas. */
export interface Gap {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export const inGap = (gaps: readonly Gap[], x: number, y: number) =>
  gaps.some((g) => x >= g.x0 && x <= g.x1 && y >= g.y0 && y <= g.y1);

/** The flow's geometry, already in device px on the canvas. */
export interface FlowPx {
  /** A row a workstream and a tool. */
  rows: readonly number[];
  chipEdge: number;
  busIn: number;
  busOut: number;
  cardEdge: number;
  /** The layer's tie, tab first, and its drop, plate first. */
  tie: readonly Pt[];
  drop: readonly Pt[];
  /** The lit tool, by row. */
  lit: readonly boolean[];
}

export interface Ports {
  teamLeft: Pt;
  layerLeft: Pt;
  layerRight: Pt;
  agentsRight: Pt;
}

/** A stretch of a trace that is no other trace's: where its dots stand. */
type Own = [number, number, number];

export function buildTraces(
  f: FlowPx,
  ports: Ports,
  pitch: number,
  gaps: readonly Gap[] = []
): Traces {
  const traces: Trace[] = [];
  const owns: Own[] = [];

  /* a bus is shared: each row keeps the piece from itself to the next row
     toward the junction, and the nearest row either side keeps the last
     piece, up to the junction */
  const piece = (row: number, junction: number) => {
    let end = junction;
    for (const other of f.rows)
      if ((other - row) * (junction - row) > 0 && Math.abs(other - row) < Math.abs(end - row))
        end = other;
    return Math.abs(end - row);
  };

  /* the team: chip, stub, bus, into the plate */
  const [tx, ty] = ports.teamLeft;
  let runIn = false;
  f.rows.forEach((row) => {
    const lane = laneOf([
      [f.chipEdge, row],
      [f.busIn, row],
      [f.busIn, ty],
      [tx, ty],
    ]);
    const stub = Math.abs(f.busIn - f.chipEdge);
    const mine = piece(row, ty);
    const n = traces.push({ lane, port: "end", plate: 0, lit: false }) - 1;
    owns.push([n, 0, stub + mine]);
    /* the run into the plate belongs to the first row that reaches it */
    if (!runIn && Math.abs(mine - Math.abs(ty - row)) < 0.5) {
      runIn = true;
      owns.push([n, stub + mine, lane.len]);
    }
  });

  /* the tools: out of the plate, bus, stub, card */
  const [ax, ay] = ports.agentsRight;
  let runOut = false;
  f.rows.forEach((row, i) => {
    const lane = laneOf([
      [ax, ay],
      [f.busOut, ay],
      [f.busOut, row],
      [f.cardEdge, row],
    ]);
    const out = Math.abs(f.busOut - ax);
    const whole = Math.abs(row - ay);
    const mine = piece(row, ay);
    const n = traces.push({ lane, port: "start", plate: 2, lit: !!f.lit[i] }) - 1;
    owns.push([n, out + whole - mine, lane.len]);
    if (!runOut && Math.abs(mine - whole) < 0.5) {
      runOut = true;
      owns.push([n, 0, out]);
    }
  });

  /* the layer's two */
  const tie = laneOf(f.tie);
  owns.push([traces.push({ lane: tie, port: "end", plate: 1, lit: false }) - 1, 0, tie.len]);
  const drop = laneOf(f.drop);
  owns.push([traces.push({ lane: drop, port: "start", plate: 1, lit: false }) - 1, 0, drop.len]);

  const of: number[] = [];
  const s: number[] = [];
  const here = [0, 0];
  for (const [n, from, to] of owns)
    for (let at = from + pitch / 2; at < to - 0.01; at += pitch) {
      along(traces[n].lane, at, here);
      if (inGap(gaps, here[0], here[1])) continue;
      of.push(n);
      s.push(at);
    }
  return {
    traces,
    count: of.length,
    of: Uint16Array.from(of),
    s: Float32Array.from(s),
    reach: traces.reduce((most, t) => Math.max(most, t.lane.len), 0),
    pitch,
    gaps,
  };
}

/**
 * Where a standing dot is once the file has reeled `reel` of the way into
 * its port (0 at rest, 1 gone), into `out`; false when the port has it.
 */
export function stationAt(T: Traces, i: number, reel: number, out: number[]): boolean {
  const trace = T.traces[T.of[i]];
  const pull = reel * (T.reach + T.pitch);
  const s = trace.port === "end" ? T.s[i] + pull : T.s[i] - pull;
  if (s <= 0 || s >= trace.lane.len) return false;
  along(trace.lane, s, out);
  return true;
}
