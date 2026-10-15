/**
 * The timeline's geometry (ADR-156 U3): two lanes of dated prisms on the
 * workshop framing's floor, and the gold rail that drives them.
 *
 * ⚠ THE FRAMING'S ONE PROJECTION (`framing/iso.ts`, `framing/floor.ts`): the
 * time axis runs along the floor's front-right edge (`a`) exactly as on the
 * stages and the curve, so the talk's drawings read as one instrument. The
 * crop is derived (`frameAround`), never typed. The SVG letters nothing: each
 * word is a DOM span seated as a fraction of the crop, on a one-elbow leader,
 * and `labelCollisions` is the build gate (`ux-meetup.test.ts`).
 *
 * ⚠ PURE: geometry from the model and the record's dates, nothing else.
 */

import { type WorldPt, frameAround } from "../../framing/floor";
import {
  type IsoBox,
  type IsoFrame,
  type IsoLabel,
  type Pt,
  isoBox,
  isoDepth,
  isoFraction,
  isoGrid,
  isoPath,
  isoProject,
} from "../../framing/iso";
import {
  SPAN_MONTHS,
  START_YEAR,
  capabilityDoublings,
  computeDoublings,
  monthsOf,
} from "./model";

/** The floor: twelve units of time (the framing's `TIME_A`), two lanes deep. */
export const TL_FLOOR = { w: 12, d: 6.4 } as const;
/** The lanes' centres across the floor: content in front, products behind. */
export const LANE_B = [1.7, 4.6] as const;
/** A prism's footprint. */
const SIDE = 0.78;
/** World height of one doubling, shared by the prisms and the rail: one
 *  scale for both, so the comparison the drawing makes stays honest. */
export const UNIT_PER_DOUBLING = 0.42;
/** A prism's height at January 2023, so the first one stands at all. */
const BASE = 0.3;

/** Months to the time axis. */
export const aOf = (months: number) => (months / SPAN_MONTHS) * TL_FLOOR.w;

export interface TlEventInput {
  id: string;
  date: string;
}

export interface TlPrism {
  id: string;
  lane: 0 | 1;
  months: number;
  box: IsoBox;
}



export function timelinePrisms(lanes: readonly (readonly TlEventInput[])[]): TlPrism[] {
  return lanes.flatMap((events, lane) =>
    events.map((e) => {
      const m = monthsOf(e.date);
      const a = aOf(m);
      return {
        id: e.id,
        lane: lane as 0 | 1,
        months: m,
        box: {
          a: a - SIDE / 2,
          b: LANE_B[lane] - SIDE / 2,
          w: SIDE,
          d: SIDE,
          z: 0,
          h: BASE + UNIT_PER_DOUBLING * capabilityDoublings(m),
        },
      };
    })
  );
}

/** The rail's height at a month: compute counted in the same doublings. */
export const railZ = (months: number) => BASE + UNIT_PER_DOUBLING * computeDoublings(months);

function extent(prisms: readonly TlPrism[]): WorldPt[] {
  const pts: WorldPt[] = [
    { a: 0, b: 0, z: 0 },
    { a: TL_FLOOR.w, b: 0, z: 0 },
    { a: TL_FLOOR.w, b: TL_FLOOR.d, z: 0 },
    { a: 0, b: TL_FLOOR.d, z: 0 },
    { a: TL_FLOOR.w, b: TL_FLOOR.d, z: railZ(SPAN_MONTHS) },
  ];
  for (const { box: b } of prisms) {
    pts.push({ a: b.a + b.w, b: b.b, z: b.h }, { a: b.a, b: b.b + b.d, z: b.h });
  }
  return pts;
}

/** The crop, derived: room left for the lane words, right for the tags. */
export function timelineFrame(prisms: readonly TlPrism[]): IsoFrame {
  return frameAround(extent(prisms), { l: 190, r: 190, t: 24, b: 36 });
}

export function timelineGrid(f: IsoFrame) {
  return isoGrid(0, 0, TL_FLOOR.w, TL_FLOOR.d, 0, 3, f);
}

/** The rail runs along the BACK edge, behind both lanes, so the prisms
 *  stand in front of what drives them and the line never crosses a block. */
export const RAIL_B = TL_FLOOR.d;

/** The time edge and the years along it (January of each). */
export function timelineAxis(f: IsoFrame) {
  const o = isoProject(0, 0, 0, f);
  const years = [0, 1, 2, 3].map((i) => {
    const a = aOf(i * 12);
    const p = isoProject(a, 0, 0, f);
    const q = isoProject(a, -0.22, 0, f);
    return { year: START_YEAR + i, tick: isoPath([p, q]), seat: isoFraction({ x: q.x + 2, y: q.y + 6 }, f) };
  });
  return { edge: isoPath([o, isoProject(TL_FLOOR.w, 0, 0, f)]), years };
}

/**
 * The gold rail: compute, rising along the time edge, with a dashed tie down
 * to the floor at each new year. The page's one gold object.
 */
export function timelineRail(f: IsoFrame) {
  const steps = 24;
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const m = (i / steps) * SPAN_MONTHS;
    pts.push(isoProject(aOf(m), RAIL_B, railZ(m), f));
  }
  const ties = [12, 24, 36, 48].map((m) =>
    isoPath([isoProject(aOf(m), RAIL_B, 0, f), isoProject(aOf(m), RAIL_B, railZ(m), f)])
  );
  const end = isoProject(aOf(SPAN_MONTHS), RAIL_B, railZ(SPAN_MONTHS), f);
  return { line: isoPath(pts), ties, end };
}

/** Prisms with their paths, FARTHEST FIRST (SVG has no z-buffer). */
export function timelineBoxes(prisms: readonly TlPrism[], f: IsoFrame) {
  return prisms
    .map((p) => ({ ...p, paths: isoBox(p.box, f) }))
    .sort((p, q) => isoDepth(q.box.a, q.box.b) - isoDepth(p.box.a, p.box.b));
}

const TAG_GAP = 14;

/**
 * A prism's tag, level with its middle. The front lane's words go RIGHT of
 * its right-hand edge; the back lane's go LEFT of its left-hand edge, out
 * over the empty floor behind the front lane, so the two lanes' words never
 * cross each other's blocks.
 */
export function prismTag(p: TlPrism, f: IsoFrame) {
  const { box } = p;
  if (p.lane === 1) {
    const edge = isoProject(box.a, box.b + box.d, box.h / 2, f);
    const seat = { x: edge.x - TAG_GAP, y: edge.y };
    return {
      seat: isoFraction(seat, f),
      leader: isoPath([edge, { x: seat.x + 3, y: seat.y }]),
      anchor: "end" as const,
    };
  }
  const side = isoBox(box, f).side;
  const seat = { x: side.x + TAG_GAP, y: side.y };
  return {
    seat: isoFraction(seat, f),
    leader: isoPath([side, { x: seat.x - 3, y: seat.y }]),
    anchor: "start" as const,
  };
}

/**
 * A lane's name, on the side its tags leave free (the collision gate found
 * both the other ways): the front lane's tags all run RIGHT, so its name sits
 * out beside the floor's left edge; the back lane's run LEFT, so its name sits
 * past its far end, beyond December 2026.
 */
export function laneSeat(lane: 0 | 1, f: IsoFrame) {
  if (lane === 0) {
    const p = isoProject(0, LANE_B[0], 0, f);
    return { ...isoFraction({ x: p.x - 14, y: p.y }, f), anchor: "end" as const };
  }
  const p = isoProject(TL_FLOOR.w + 0.35, LANE_B[1], 0, f);
  return { ...isoFraction({ x: p.x + 6, y: p.y }, f), anchor: "start" as const };
}

/** The rail's word, at its far end. */
export function railSeat(f: IsoFrame) {
  const end = timelineRail(f).end;
  return isoFraction({ x: end.x + 10, y: end.y }, f);
}

/** Every word the drawing seats, for the collision gate. */
export function timelineLabels(
  prisms: readonly TlPrism[],
  tags: Readonly<Record<string, string>>,
  lanes: readonly [string, string],
  rail: string,
  f: IsoFrame
): IsoLabel[] {
  return [
    ...prisms.map((p) => ({
      id: p.id,
      text: tags[p.id] ?? p.id,
      ...prismTag(p, f).seat,
      anchor: prismTag(p, f).anchor,
    })),
    ...([0, 1] as const).map((i) => ({
      id: `lane-${i}`,
      text: lanes[i],
      ...laneSeat(i, f),
    })),
    { id: "rail", text: rail, ...railSeat(f), anchor: "start" as const },
  ];
}
