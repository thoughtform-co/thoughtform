import { describe, expect, it } from "vitest";

import {
  boxFaces,
  factsOf,
  fitFrame,
  hash2,
  hit,
  isoFrame,
  mulberry32,
  PITCH_PX,
  plateFrame,
  PLATES,
  pointInPoly,
  poseAt,
  project,
  PROPOSAL_UNIT,
  SIDE,
  stackBounds,
  unproject,
} from "@/app/(internal)/test/stack-forms/model";
import { makeIso } from "@/components/xb-proposal/iso";
import { STACK } from "@/components/xb-proposal/stack/travel";

/* /test/stack-forms draws one stack five ways. The stack itself is plain
   data restated from the proposal's numbers (a new design lab imports
   nothing from the surfaces it may replace), so the lab cannot drift from
   the proposal only if something holds the two together. This does, and it
   holds the few properties every drawing leans on. */

describe("the stack, as the lab states it", () => {
  it("is the proposal's stack: the same projection, footprint, unit and closed pitch", () => {
    const theirs = makeIso(STACK.unit, STACK.ox, STACK.oy);
    const ours = isoFrame(PROPOSAL_UNIT, STACK.ox, STACK.oy);
    for (const [x, y, z] of [
      [0, 0, 0],
      [8, 0, 0.4],
      [0, 8, 1.08],
      [8, 8, 0],
      [3.3, 5.1, 0.62],
    ]) {
      const a = theirs.p(x, y, z);
      const b = project(ours, x, y, z);
      expect(b[0]).toBeCloseTo(a[0], 9);
      expect(b[1]).toBeCloseTo(a[1], 9);
    }
    expect(PROPOSAL_UNIT).toBe(STACK.unit);
    expect(PITCH_PX.closed).toBe(STACK.closed);
    expect(SIDE).toBe(8);
  });

  it("is three plates, each holding what the proposal says it holds", () => {
    expect(PLATES.map((p) => p.key)).toEqual(["team", "layer", "agents"]);
    expect(PLATES.map((p) => p.step)).toEqual(["Navigate", "Encode", "Build"]);
    expect(PLATES.map((p) => p.holds.length)).toEqual([4, 3, 4]);
    expect(PLATES.filter((p) => p.lit).map((p) => p.key)).toEqual(["layer"]);
    // the layer is three strata, one above the other, none touching
    const strata = PLATES[1].body;
    expect(strata).toHaveLength(3);
    for (let n = 1; n < strata.length; n++) expect(strata[n].z0).toBeGreaterThan(strata[n - 1].z1);
    // every feature lies on its own plate
    for (const plate of PLATES)
      for (const f of plate.features) {
        expect(f.box.x0).toBeGreaterThanOrEqual(0);
        expect(f.box.x1).toBeLessThanOrEqual(SIDE);
        expect(f.box.y0).toBeGreaterThanOrEqual(0);
        expect(f.box.y1).toBeLessThanOrEqual(SIDE);
        expect(f.box.z1).toBeLessThanOrEqual(plate.top);
      }
  });

  it("the agents' traces are level, plumb or at 45 degrees, chip to module", () => {
    const [, , agents] = PLATES;
    expect(agents.traces).toHaveLength(4);
    for (const t of agents.traces)
      for (let i = 1; i < t.pts.length; i++) {
        const dx = Math.abs(t.pts[i][0] - t.pts[i - 1][0]);
        const dy = Math.abs(t.pts[i][1] - t.pts[i - 1][1]);
        expect(dx < 1e-9 || dy < 1e-9 || Math.abs(dx - dy) < 1e-9).toBe(true);
      }
  });
});

describe("the pose", () => {
  it("opens about the layer, from the closed pitch to the opened one", () => {
    expect(poseAt(0).pitch * PROPOSAL_UNIT).toBeCloseTo(PITCH_PX.closed, 9);
    expect(poseAt(1).pitch * PROPOSAL_UNIT).toBeCloseTo(PITCH_PX.opened, 9);
    expect(poseAt(1, "far").pitch * PROPOSAL_UNIT).toBeCloseTo(PITCH_PX.far, 9);
    for (const o of [0, 0.3, 1]) {
      const { lift, pitch } = poseAt(o);
      expect(lift).toEqual([pitch, 0, -pitch]);
    }
    // out of range is clamped, never extrapolated
    expect(poseAt(-2).open).toBe(0);
    expect(poseAt(7).open).toBe(1);
  });

  it("never lets two plates touch, closed or opened", () => {
    for (let o = 0; o <= 1.0001; o += 0.05) {
      const { lift } = poseAt(o);
      for (const i of [0, 1] as const)
        expect(lift[i + 1] + PLATES[i + 1].top).toBeLessThan(lift[i]);
    }
  });

  it("states only true numbers", () => {
    const pose = poseAt(0.37);
    const f = factsOf(pose);
    expect(f.plates).toBe(PLATES.length);
    expect(f.side).toBe(SIDE);
    expect(f.openPct).toBe(37);
    expect(f.pitch).toBeCloseTo(pose.pitch, 2);
    expect(f.height).toBeCloseTo(pose.lift[0] + PLATES[0].top - pose.lift[2], 2);
  });
});

describe("the picture", () => {
  const frame = fitFrame(1600, 1000, poseAt(1), { pad: 60 });

  it("a screen point goes back to the plane it came from", () => {
    for (const [x, y, z] of [
      [1, 2, 0.4],
      [7.5, 0.2, 1.08],
      [4, 4, 0],
    ]) {
      const [sx, sy] = project(frame, x, y, z);
      const [bx, by] = unproject(frame, sx, sy, z);
      expect(bx).toBeCloseTo(x, 9);
      expect(by).toBeCloseTo(y, 9);
    }
  });

  it("seats the whole stack inside its box, in every pose it is fitted for", () => {
    for (const o of [0, 0.5, 1]) {
      const b = stackBounds(frame, poseAt(o));
      expect(b.x0).toBeGreaterThanOrEqual(60 - 1e-6);
      expect(b.y0).toBeGreaterThanOrEqual(60 - 1e-6);
      expect(b.x1).toBeLessThanOrEqual(1600 - 60 + 1e-6);
      expect(b.y1).toBeLessThanOrEqual(1000 - 60 + 1e-6);
    }
  });

  it("says what a point lands on: the plate in front, its face, where on it", () => {
    for (const o of [0, 0.5, 1]) {
      const pose = poseAt(o);
      // each plate's near top corner is never covered: it must hit that plate's top
      for (const plate of PLATES) {
        const f = plateFrame(frame, pose, plate.i);
        const top = plate.body[plate.body.length - 1].z1;
        const [sx, sy] = project(f, SIDE - 0.3, SIDE - 0.3, top);
        const h = hit(frame, pose, sx, sy);
        expect(h?.plate).toBe(plate.i);
        expect(h?.face).toBe("top");
        expect(h?.x).toBeCloseTo(SIDE - 0.3, 6);
        expect(h?.y).toBeCloseTo(SIDE - 0.3, 6);
      }
      // a wall: just under the near edge of the team's board, on its left face
      const tf = plateFrame(frame, pose, 0);
      const [wx, wy] = project(tf, 3, SIDE, 0.2);
      const wall = hit(frame, pose, wx, wy);
      expect(wall?.plate).toBe(0);
      expect(wall?.face).toBe("left");
      expect(wall?.x).toBeCloseTo(3, 6);
      expect(wall?.z).toBeCloseTo(0.2, 6);
    }
    // closed, the team's plate covers the layer's middle: the team wins
    const closed = poseAt(0);
    const [cx, cy] = project(plateFrame(frame, closed, 0), 6, 6, PLATES[0].top);
    expect(hit(frame, closed, cx, cy)?.plate).toBe(0);
    // and far off the stack there is nothing
    expect(hit(frame, closed, 5, 5)).toBeNull();
  });

  it("agrees with the faces it is drawn from", () => {
    const pose = poseAt(1);
    const f = plateFrame(frame, pose, 2);
    const faces = boxFaces(f, PLATES[2].body[0]);
    for (let n = 0; n < 40; n++) {
      const sx = faces.top[3][0] + ((faces.top[1][0] - faces.top[3][0]) * (n + 0.5)) / 40;
      const sy = faces.top[0][1] + 20;
      const inTop = pointInPoly([sx, sy], faces.top);
      const h = hit(frame, pose, sx, sy);
      // the agents' board is the lowest plate: nothing hides its far half when opened
      if (inTop) expect(h).not.toBeNull();
    }
  });
});

describe("the lab's randomness", () => {
  it("is seeded: the same seed gives the same numbers, another seed others", () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    const c = mulberry32(8);
    const run = (g: () => number) => Array.from({ length: 6 }, () => g());
    const first = run(a);
    expect(run(b)).toEqual(first);
    expect(run(c)).not.toEqual(first);
    for (const v of first) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("hashes two integers into 0..1 with no state", () => {
    expect(hash2(3, 9, 1)).toBe(hash2(3, 9, 1));
    expect(hash2(3, 9, 1)).not.toBe(hash2(9, 3, 1));
    for (let i = -5; i < 40; i++) {
      const v = hash2(i, i * 7, 2);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
