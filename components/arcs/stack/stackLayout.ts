/**
 * stackLayout — the layer STACK, the proposal's one object, as world-space
 * geometry (the proposal system, 2026-10-10).
 *
 * The organisation's slab, the layer the team writes above it, the workstream
 * tiles standing on that: one drawing the approach WRITES (live, three
 * steps), the leverage PLACES (three plates, the console) and the engine
 * CONFIGURES (pinned, nine callouts). Every reader draws from these numbers:
 * the SVG fallback here, the hologram through `holo-stage/stackGeom.ts`, and
 * `components/instrument/Slab.tsx` reads `SLAB_PATHS`, so the plate the
 * leverage and the engine drew by hand is this projection too.
 *
 * ⚠ PURE: imports `framing/iso.ts` and `framing/floor.ts` only. ⚠ NO
 * `transform` is ever emitted; every point is in absolute viewBox units
 * (the iso law: the overlap walks compare `getBBox`). ⚠ THE SVG LETTERS
 * NOTHING: `stackLabels` seats DOM words beside the plate they name, and
 * `tests/lib/arc-stack.test.ts` walks the pairs.
 */

import { STAGE_K, frameAround, type WorldPt } from "../framing/floor";
import {
  ISO_BASIS_STAGE,
  type IsoBox,
  type IsoFrame,
  type IsoLabel,
  type Pt,
  isoBox,
  isoDepth,
  isoPath,
  isoProject,
} from "../framing/iso";

export type StackTier = "tiles" | "layer" | "host" | "shared";

/** One plate: a square footprint, thin. World units (`STAGE_K` px each). */
export const PLATE = { w: 6, d: 6, h: 0.6 } as const;
/** The air between two plates, so the stack reads exploded: wide enough that
 *  the callout beside each plate (up to four lines) clears its neighbours. */
export const TIER_GAP = 2.2;
/** A workstream tile on the layer: a small box on a row along the front edge. */
export const TILE = { w: 1.1, d: 1.1, h: 0.5 } as const;
export const TILE_ROW_B = 1.0;
export const MAX_TILES = 4;
export const MAX_COURSES = 8;
/** The air above the deck the crop holds: where the team's unwritten
 *  knowledge drifts on the live stage, and the tiles' words sit. */
export const DECK_AIR = 1.2;

/** The plates bottom-up: a ghost slab under the host, the host, the layer,
 *  the tiles' deck. `gap` is the air between plates: the house's, or a
 *  host's wider one where its words need the room (the leverage). */
export function tierZ(tier: Exclude<StackTier, "tiles">, gap = TIER_GAP): number {
  return tier === "shared" ? -(PLATE.h + gap) : tier === "host" ? 0 : PLATE.h + gap;
}
export function tilesZ(gap = TIER_GAP): number {
  return tierZ("layer", gap) + PLATE.h + gap * 0.85;
}

export function plateBox(tier: Exclude<StackTier, "tiles">, gap = TIER_GAP): IsoBox {
  return { a: 0, b: 0, w: PLATE.w, d: PLATE.d, z: tierZ(tier, gap), h: PLATE.h };
}

/** The tiles, a row along the front-right edge, spread over the plate. */
export function tileBoxes(n: number, gap = TIER_GAP): IsoBox[] {
  const count = Math.max(1, Math.min(MAX_TILES, n));
  const span = PLATE.w - 2 * 0.45;
  const pitch = count === 1 ? 0 : (span - TILE.w) / (count - 1);
  return Array.from({ length: count }, (_, i) => ({
    a: 0.45 + i * pitch,
    b: TILE_ROW_B,
    w: TILE.w,
    d: TILE.d,
    z: tilesZ(gap),
    h: TILE.h,
  }));
}

/** The layer's courses: runs along `a` on its top face, the skills then the evaluations. */
export function courseLines(n: number, gap = TIER_GAP): WorldPt[][] {
  const count = Math.max(0, Math.min(MAX_COURSES, n));
  const z = tierZ("layer", gap) + PLATE.h;
  const b0 = 2.0;
  const b1 = PLATE.d - 0.6;
  return Array.from({ length: count }, (_, i) => {
    const b = count === 1 ? (b0 + b1) / 2 : b0 + (i * (b1 - b0)) / (count - 1);
    return [
      { a: 0.5, b, z },
      { a: PLATE.w - 0.5, b, z },
    ];
  });
}

/** The run: the layer's front-right top edge, where Claude's beads travel. */
export function runEdge(gap = TIER_GAP): WorldPt[] {
  const z = tierZ("layer", gap) + PLATE.h;
  return [
    { a: 0, b: 0, z },
    { a: PLATE.w, b: 0, z },
  ];
}

/** Every world point the stack draws, for the crop. */
export function stackPoints(tiers: readonly StackTier[], gap = TIER_GAP): WorldPt[] {
  const out: WorldPt[] = [];
  const corners = (b: IsoBox) => {
    for (const [a, bb] of [
      [b.a, b.b],
      [b.a + b.w, b.b],
      [b.a + b.w, b.b + b.d],
      [b.a, b.b + b.d],
    ]) {
      out.push({ a, b: bb, z: b.z }, { a, b: bb, z: b.z + b.h });
    }
  };
  for (const t of tiers) {
    if (t === "tiles") {
      tileBoxes(MAX_TILES, gap).forEach(corners);
      const deck = tileBoxes(1, gap)[0];
      out.push({ a: PLATE.w / 2, b: PLATE.d / 2, z: deck.z + deck.h + DECK_AIR });
    } else corners(plateBox(t, gap));
  }
  return out;
}

const PADS = { l: 24, r: 24, t: 20, b: 24 } as const;

/** The crop that holds the stack, derived (the floor's law), at the stage's scale. */
export function stackFrame(tiers: readonly StackTier[], gap = TIER_GAP): IsoFrame {
  return frameAround(stackPoints(tiers, gap), PADS, STAGE_K);
}

export interface StackPlatePaths {
  tier: StackTier;
  /** Paint order: larger is farther. */
  depth: number;
  visible: string;
  hidden: string;
  top: string;
  right: string;
  left: string;
  /** The right-hand vertical edge's midpoint — the callout's anchor. */
  side: Pt;
  apex: Pt;
}

export interface StackPaths {
  frame: IsoFrame;
  plates: StackPlatePaths[];
  /** The tiles, in the record's order; the lit one is the caller's to mark. */
  tiles: StackPlatePaths[];
  /** The courses on the layer's top face. */
  courses: string[];
  /** The run along the layer's front-right top edge. */
  run: string;
}

/** The stack as absolute-unit paths. The caller marks what is lit. */
export function stackPaths(
  tiers: readonly StackTier[],
  o: { tiles?: number; courses?: number; gap?: number } = {}
): StackPaths {
  const gap = o.gap ?? TIER_GAP;
  const frame = stackFrame(tiers, gap);
  const plate = (tier: StackTier, box: IsoBox): StackPlatePaths => {
    const p = isoBox(box, frame);
    return {
      tier,
      depth: p.depth,
      visible: p.visible,
      hidden: p.hidden,
      top: p.top,
      right: p.right,
      left: p.left,
      side: p.side,
      apex: p.apex,
    };
  };
  const plates = tiers
    .filter((t): t is Exclude<StackTier, "tiles"> => t !== "tiles")
    .map((t) => plate(t, plateBox(t, gap)))
    /* Lower first: the host paints before the layer, which paints before the tiles. */
    .sort(
      (x, y) =>
        plateBox(x.tier as Exclude<StackTier, "tiles">, gap).z -
        plateBox(y.tier as Exclude<StackTier, "tiles">, gap).z
    );
  const tiles = tiers.includes("tiles")
    ? tileBoxes(o.tiles ?? MAX_TILES, gap)
        .map((b) => plate("tiles", b))
        .sort((x, y) => y.depth - x.depth)
    : [];
  const courses = tiers.includes("layer")
    ? courseLines(o.courses ?? 0, gap).map((pts) =>
        isoPath(pts.map((p) => isoProject(p.a, p.b, p.z, frame)))
      )
    : [];
  const run = tiers.includes("layer")
    ? isoPath(runEdge(gap).map((p) => isoProject(p.a, p.b, p.z, frame)))
    : "";
  return { frame, plates, tiles, courses, run };
}

export type StackSide = "left" | "right";

/** Which side a tier's callout sits: the organisation's slabs left, the
 *  layer and the tiles right, so the stack reads between its words. */
export const STACK_SIDES: Readonly<Record<StackTier, StackSide>> = {
  shared: "left",
  host: "left",
  layer: "right",
  tiles: "right",
};

/** Where a tier's callout is seated: beside the plate's side vertex on its
 *  side (right: the `a` tip; left: the `b` tip), as a fraction of the crop.
 *  The tiles' callout sits at the deck's height, beside the outer tile. */
export function stackSeats(
  tiers: readonly StackTier[],
  sides: Readonly<Partial<Record<StackTier, StackSide>>> = {},
  gap = TIER_GAP
): Record<string, { ax: number; at: number; side: StackSide }> {
  const frame = stackFrame(tiers, gap);
  const out: Record<string, { ax: number; at: number; side: StackSide }> = {};
  for (const t of tiers) {
    const side = sides[t] ?? STACK_SIDES[t];
    const box =
      t === "tiles"
        ? { ...tileBoxes(1, gap)[0], a: PLATE.w - TILE.w, h: TILE.h }
        : plateBox(t, gap);
    const p =
      side === "right"
        ? isoProject(box.a + box.w, box.b, box.z + box.h / 2, frame)
        : isoProject(box.a, box.b + box.d, box.z + box.h / 2, frame);
    out[t] = { ax: p.x / frame.w, at: p.y / frame.h, side };
  }
  return out;
}

/**
 * The DOM words the stack names, one per tier, seated level with the plate
 * each names at the crop's edge on its side (the leader runs from the
 * plate's vertex to the word). `lines` is the callout's height in lines, so
 * the collision walk measures a block, not a line.
 */
export function stackLabels(
  tiers: readonly StackTier[],
  words: Readonly<Partial<Record<StackTier, { text: string; lines?: number }>>>,
  sides: Readonly<Partial<Record<StackTier, StackSide>>> = {},
  gap = TIER_GAP
): IsoLabel[] {
  const seats = stackSeats(tiers, sides, gap);
  return tiers
    .filter((t) => words[t])
    .map((t) => ({
      id: `callout-${t}`,
      text: words[t]!.text,
      ax: seats[t].side === "right" ? 1 : 0,
      at: seats[t].at,
      anchor: seats[t].side === "right" ? ("end" as const) : ("start" as const),
      lines: words[t]!.lines ?? 1,
    }));
}

/** How far, in viewBox units, the deck sits above the organisation's slab:
 *  what a CSS translate drops the tiles by at the approach's step 0 (the
 *  team on the slab, nothing written yet). Identity at step 2, where the
 *  figure is measured. */
export function deckDrop(frame: IsoFrame, gap = TIER_GAP): number {
  return (tilesZ(gap) - PLATE.h) * frame.k * -frame.basis.Z[1];
}

/* ── The Slab (components/instrument/Slab.tsx) ───────────────────────── */

/** The Slab's own viewBox, the one the leverage and the engine size on. */
export const SLAB_VIEWBOX = { w: 120, h: 56 } as const;

const SLAB_K = (SLAB_VIEWBOX.w - 8) / (PLATE.w * 2 * ISO_BASIS_STAGE.A[0]);
/** One plate in the Slab's box: the same projection, the front corner at the foot. */
export const SLAB_FRAME: IsoFrame = {
  w: SLAB_VIEWBOX.w,
  h: SLAB_VIEWBOX.h,
  ox: SLAB_VIEWBOX.w / 2,
  oy: SLAB_VIEWBOX.h - 2,
  k: SLAB_K,
  basis: ISO_BASIS_STAGE,
};

/** The Slab's three faces, derived, so one plate is drawn everywhere. */
export const SLAB_PATHS = (() => {
  const p = isoBox({ a: 0, b: 0, w: PLATE.w, d: PLATE.d, z: 0, h: PLATE.h }, SLAB_FRAME);
  return { top: p.top, right: p.right, left: p.left, depth: p.depth };
})();

export { isoDepth };
