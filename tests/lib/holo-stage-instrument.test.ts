import { describe, expect, it } from "vitest";

import { DIRECTIONS, ROUND_FOUR_IDS } from "@/components/holo-stage/directions";
import { stageToCrop } from "@/components/holo-stage/stageFit";
import { particleCount, particlePoints } from "@/components/holo-stage/stageParticles";

/* ADR-140, round four: the instrument plates. These walk the three round-four
   directions the lab mounts first. What round three's guard asked (homes in
   the crop, one gold, one texture, determinism, the stage view) still holds;
   what round four adds is the things the owner's read named — the frame
   FILLED, the lit object BIG, every flowing population carrying a tangent per
   bead, every readout carrying a key — and a negative case per new clause. */
describe("the round-four directions are instrument plates (ADR-140)", () => {
  it("every particle home lands inside its own crop, at the stage view", () => {
    for (const id of ROUND_FOUR_IDS) {
      const spec = DIRECTIONS[id]().spec;
      expect(spec.particles, id).toBeDefined();
      const pts = particlePoints(spec.particles!);
      expect(pts.length, id).toBeGreaterThan(6000);
      let out = 0;
      for (const p of pts) {
        const c = stageToCrop(p, spec.frame, spec.view ?? "stage");
        if (c.x < 0 || c.x > spec.frame.w || c.y < 0 || c.y > spec.frame.h) out++;
      }
      expect(out, `${id}: homes outside the crop`).toBe(0);
    }
  });

  it("a figure fits one 128-square simulation texture, and is denser than round three", () => {
    const THIRD = {
      "stages-instrument": "sphere",
      "curve-instrument": "graph",
      "spectrum-instrument": "dissolve",
    } as const;
    for (const id of ROUND_FOUR_IDS) {
      const n = particleCount(DIRECTIONS[id]().spec.particles!);
      expect(n, id).toBeLessThanOrEqual(128 * 128);
      const before = particleCount(DIRECTIONS[THIRD[id]]().spec.particles!);
      expect(n, `${id} against ${THIRD[id]}`).toBeGreaterThan(before);
    }
  });

  it("the frame is FILLED: the particles span at least 70 % of the crop's width", () => {
    for (const id of ROUND_FOUR_IDS) {
      const spec = DIRECTIONS[id]().spec;
      let x0 = Infinity;
      let x1 = -Infinity;
      for (const p of particlePoints(spec.particles!)) {
        const c = stageToCrop(p, spec.frame, spec.view ?? "stage");
        x0 = Math.min(x0, c.x);
        x1 = Math.max(x1, c.x);
      }
      expect((x1 - x0) / spec.frame.w, `${id}: fill share`).toBeGreaterThanOrEqual(0.7);
    }
  });

  it("the lit populations are gold and gold alone, and the lit object is BIG", () => {
    /* The stages' globe and the curve's ribbon are BODIES and take the
       grammar's quarter; the spectrum's one gold object is a LOCATOR on the
       rail — the reading is the field around it — and takes a twelfth. */
    const LIT_SHARE = {
      "stages-instrument": 0.25,
      "curve-instrument": 0.25,
      "spectrum-instrument": 0.08,
    } as const;
    for (const id of ROUND_FOUR_IDS) {
      const spec = DIRECTIONS[id]().spec;
      const lit = spec.particles!.populations.filter((p) => p.lit);
      expect(lit.length, id).toBeGreaterThan(0);
      for (const p of lit) expect(p.role, `${id}/${p.id}`).toBe("gold");
      /* The lit object's longest crop extent against the crop's shorter side. */
      let x0 = Infinity;
      let x1 = -Infinity;
      let y0 = Infinity;
      let y1 = -Infinity;
      for (const p of lit)
        for (const pt of p.points) {
          const c = stageToCrop(pt, spec.frame, spec.view ?? "stage");
          x0 = Math.min(x0, c.x);
          x1 = Math.max(x1, c.x);
          y0 = Math.min(y0, c.y);
          y1 = Math.max(y1, c.y);
        }
      const longest = Math.max(x1 - x0, y1 - y0);
      expect(
        longest / Math.min(spec.frame.w, spec.frame.h),
        `${id}: lit share`
      ).toBeGreaterThanOrEqual(LIT_SHARE[id]);
    }
  });

  it("every flowing population carries one tangent per bead, with a period", () => {
    let flowing = 0;
    for (const id of ROUND_FOUR_IDS) {
      for (const p of DIRECTIONS[id]().spec.particles!.populations) {
        if (!p.flow) continue;
        flowing++;
        expect(p.tangents, `${id}/${p.id}: tangents`).toBeDefined();
        expect(p.tangents!.length, `${id}/${p.id}: one tangent per bead`).toBe(p.points.length);
        expect(p.flow.period, `${id}/${p.id}: period`).toBeGreaterThan(0);
        for (const t of p.tangents!.slice(0, 8))
          expect(
            Math.hypot(t[0], t[1], t[2]),
            `${id}/${p.id}: a tangent has length`
          ).toBeGreaterThan(0);
      }
    }
    expect(flowing).toBeGreaterThan(6);
  });

  it("every readout carries a key, and every plate has readouts", () => {
    for (const id of ROUND_FOUR_IDS) {
      const ro = DIRECTIONS[id]().labels.filter((l) => l.kind === "readout");
      expect(ro.length, id).toBeGreaterThanOrEqual(3);
      for (const l of ro) {
        expect(l.key, `${id}/${l.id}`).toBeTruthy();
        expect(l.text, `${id}/${l.id}`).toBeTruthy();
      }
    }
  });

  it("at most one atmosphere shell per plate, and it is gold", () => {
    for (const id of ROUND_FOUR_IDS) {
      const shells = DIRECTIONS[id]().spec.shells ?? [];
      expect(shells.length, id).toBeLessThanOrEqual(1);
      for (const s of shells) expect(s.role, `${id}/${s.id}`).toBe("gold");
    }
  });

  it("the populations are deterministic, seed for seed", () => {
    for (const id of ROUND_FOUR_IDS) {
      const a = DIRECTIONS[id]().spec.particles!;
      const b = DIRECTIONS[id]().spec.particles!;
      expect(a.populations.map((p) => p.points.length)).toEqual(
        b.populations.map((p) => p.points.length)
      );
      expect(a.populations[0].points).toEqual(b.populations[0].points);
      expect(a.populations[a.populations.length - 1].points).toEqual(
        b.populations[b.populations.length - 1].points
      );
    }
  });

  it("every plate poses on the house stage, not a free camera", () => {
    for (const id of ROUND_FOUR_IDS)
      expect(DIRECTIONS[id]().spec.view ?? "stage", id).toBe("stage");
  });

  it("the guards can fail: a half-width figure and a keyless readout are caught", () => {
    const spec = DIRECTIONS["curve-instrument"]().spec;
    /* Fill: a figure squeezed into the left half. */
    const squeezed = particlePoints(spec.particles!).map((p) => [p[0] * 0.3, p[1], p[2]] as const);
    let x0 = Infinity;
    let x1 = -Infinity;
    for (const p of squeezed) {
      const c = stageToCrop([p[0], p[1], p[2]], spec.frame, "stage");
      x0 = Math.min(x0, c.x);
      x1 = Math.max(x1, c.x);
    }
    expect((x1 - x0) / spec.frame.w).toBeLessThan(0.7);
    /* A readout without a key. */
    const bad = {
      ...DIRECTIONS["curve-instrument"]().labels[0],
      kind: "readout" as const,
      key: undefined,
    };
    expect(bad.key).toBeFalsy();
  });
});
