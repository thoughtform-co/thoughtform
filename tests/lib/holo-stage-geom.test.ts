import { describe, expect, it } from "vitest";

import { PLOPSA_WORKSHOP_ARC } from "@/lib/arcs/content/plopsa-workshop";
import {
  FIT_FOV_MAX,
  FIT_FOV_MIN,
} from "@/components/holo-program/holoProgramGeom";
import { createAnchorChannel } from "@/components/holo-stage/stageAnchors";
import {
  STAGE_AZIMUTH,
  STAGE_AZIMUTH_MAX,
  STAGE_AZIMUTH_MIN,
  solveStageFit,
  stageCameraBasis,
  stageCameraPosition,
  toThree,
} from "@/components/holo-stage/stageFit";
import {
  curveSpec,
  explodedSpec,
  horizonSpec,
  stagesSpec,
  type HoloStageSpec,
} from "@/components/holo-stage/stageGeom";

/** The four reference shapes every arc is measured at. */
const SHAPES: readonly (readonly [number, number])[] = [
  [1280, 720],
  [1440, 800],
  [1920, 1080],
  [1920, 1247],
];

const section = <K extends string>(id: K) => {
  const s = PLOPSA_WORKSHOP_ARC.sections.find((x) => x.id === id);
  if (!s) throw new Error(`no section ${id}`);
  return s;
};

function specs(): Record<string, HoloStageSpec> {
  const vandaag = section("vandaag");
  const stages = section("drie-manieren");
  const curve = section("de-curve");
  const horizon = section("de-horizon");
  if (vandaag.kind !== "list-groups" || !vandaag.exploded) throw new Error("vandaag");
  if (stages.kind !== "stages") throw new Error("stages");
  if (curve.kind !== "curve") throw new Error("curve");
  if (horizon.kind !== "horizon") throw new Error("horizon");
  return {
    exploded: explodedSpec({ layers: vandaag.exploded.layers }),
    stages: stagesSpec({ stages: stages.stages.map((s) => ({ id: s.id, lit: s.lit })) }),
    curve: curveSpec({ years: curve.years, reference: { tread: curve.reference.tread } }),
    horizon: horizonSpec({
      operated: { steps: horizon.operated.steps },
      agent: { gates: horizon.agent.gates.map((g) => ({ kind: g.kind, at: g.at })) },
    }),
  };
}

describe("the workshop's live stage (ADR-130 U2)", () => {
  const S = specs();

  it("the pose reproduces the static drawing's own basis", () => {
    /* ⚠ THE FALLBACK AND THE HOLOGRAM ARE ONE DRAWING. `framing/iso.ts` draws
       these beats in a CABINET oblique — a right, b back at 30° foreshortened
       ~0.5, z up — and that SVG is what every reader without WebGL gets. A
       live pose chosen for its own sake would make the two different pictures
       of one record, which is the thing ADR-130 U1 rules against. */
    const basis = stageCameraBasis();
    const screen = (a: number, b: number, z: number) => {
      const p = toThree(a, b, z);
      return {
        x: basis.x[0] * p[0] + basis.x[1] * p[1] + basis.x[2] * p[2],
        y: basis.y[0] * p[0] + basis.y[1] * p[1] + basis.y[2] * p[2],
      };
    };
    const a = screen(1, 0, 0);
    const b = screen(0, 1, 0);
    const z = screen(0, 0, 1);
    // a runs right and slightly down; cabinet's own (1, 0).
    expect(a.x).toBeCloseTo(0.866, 2);
    expect(a.y).toBeCloseTo(-0.203, 2);
    /* b recedes up and right, as cabinet's (0.433, 0.25) does. ⚠ NOT the same
       ANGLE, and the first cut of this test claimed it was: cabinet's depth
       runs at a screen ratio of 1.73 and a perspective camera at 24° of
       elevation runs at 1.42, so the live drawing's depth is a little steeper
       than the printed one's. Both read as the same object from the same
       corner, which is what the fallback law asks for; asserting an identity
       that is not there would have made this guard a fiction. */
    expect(b.x).toBeCloseTo(0.5, 2);
    expect(b.y).toBeCloseTo(0.352, 2);
    expect(b.x / b.y).toBeGreaterThan(1.2);
    expect(b.x / b.y).toBeLessThan(1.9);
    // z is vertical, and ONLY vertical.
    expect(z.x).toBeCloseTo(0, 6);
    expect(z.y).toBeGreaterThan(0.9);
  });

  it("the azimuth band never crosses the axis", () => {
    /* Past 0° the depth axis flips sides and a time rail that ran left to
       right starts running right to left — the pose ADR-080 U3 clamps the
       trajectory against, one object over. Strictly positive, so the mirrored
       read is unreachable rather than merely avoided. */
    expect(STAGE_AZIMUTH_MIN).toBeGreaterThan(0);
    expect(STAGE_AZIMUTH_MIN).toBeLessThan(STAGE_AZIMUTH);
    expect(STAGE_AZIMUTH).toBeLessThan(STAGE_AZIMUTH_MAX);
  });

  it.each(Object.keys(specs()))("%s draws only finite world", (id) => {
    const spec = S[id];
    for (const l of spec.lines)
      for (const p of l.points) for (const v of p) expect(Number.isFinite(v)).toBe(true);
    for (const f of spec.faces)
      for (const p of f.quad) for (const v of p) expect(Number.isFinite(v)).toBe(true);
    for (const v of [...spec.bounds.min, ...spec.bounds.max]) expect(Number.isFinite(v)).toBe(true);
    expect(spec.lines.length).toBeGreaterThan(4);
  });

  it.each(Object.keys(specs()))("%s spends gold once, and on one donor", (id) => {
    /* The register's standing rule: gold is the record's one lit object
       (ADR-130 U1). A second donor is a second bloom, and bloom applied to
       everything is a blur. */
    const spec = S[id];
    const donors = spec.lines.filter((l) => l.donor);
    expect(donors.length, `${id} donors`).toBeGreaterThanOrEqual(1);
    expect(donors.length, `${id} donors`).toBeLessThanOrEqual(2);
    for (const d of donors) expect(d.role, `${id}/${d.id}`).toBe("gold");
  });

  it.each(Object.keys(specs()))("%s seats every anchor inside its own bounds", (id) => {
    /* ⚠ AN ANCHOR OUTSIDE THE BOUNDS IS A LABEL THE FIT CANNOT KEEP ON
       SCREEN. The lens is solved from the bounds; a leader that starts
       outside them points off the canvas at some viewport and nothing in the
       live layer would say so. */
    const spec = S[id];
    expect(spec.anchors.length).toBeGreaterThan(2);
    for (const a of spec.anchors) {
      for (let i = 0; i < 3; i++) {
        expect(a.p[i], `${id}/${a.id} axis ${i}`).toBeGreaterThanOrEqual(spec.bounds.min[i] - 1e-6);
        expect(a.p[i], `${id}/${a.id} axis ${i}`).toBeLessThanOrEqual(spec.bounds.max[i] + 1e-6);
      }
      // The stand-off direction needs two DIFFERENT points to point away from.
      expect(a.p, `${id}/${a.id} leans on itself`).not.toEqual(a.from);
    }
    expect(new Set(spec.anchors.map((a) => a.id)).size).toBe(spec.anchors.length);
  });

  it.each(Object.keys(specs()))("%s solves a lens inside the band at every shape", (id) => {
    const spec = S[id];
    for (const [w, h] of SHAPES) {
      const fit = solveStageFit(spec.bounds, w, h, { top: 8, bottom: 8 });
      expect(fit.fov, `${id} @${w}x${h}`).toBeGreaterThanOrEqual(FIT_FOV_MIN);
      expect(fit.fov, `${id} @${w}x${h}`).toBeLessThanOrEqual(FIT_FOV_MAX);
      for (const v of fit.target) expect(Number.isFinite(v)).toBe(true);
    }
    // A degenerate canvas falls back rather than emitting NaN.
    expect(Number.isFinite(solveStageFit(spec.bounds, 0, 0).fov)).toBe(true);
  });

  it("a wider canvas never needs a longer lens", () => {
    /* The fit is by the BINDING axis (ADR-070's elastic crop). Growing the
       width can only ever take the drawing off the width bound, never onto
       it — if this inverts, the solve is measuring the wrong axis. */
    const spec = S.curve;
    const narrow = solveStageFit(spec.bounds, 900, 500).fov;
    const wide = solveStageFit(spec.bounds, 1800, 500).fov;
    expect(wide).toBeLessThanOrEqual(narrow + 1e-9);
  });

  it("the horizon draws a mark per hand-off, and the gates in the record's order", () => {
    const s = section("de-horizon");
    if (s.kind !== "horizon") throw new Error("horizon");
    const marks = S.horizon.lines.filter((l) => l.id.startsWith("op-mark-"));
    /* ⚠ ONLY THE LAST HAND-OFF LETTERS (a repeated plaque is the map city's
       defect in a new place), so the repetition is carried by the MARKS. With
       none, the far lane reads as one dashed line and the lane's whole
       argument is simply absent. */
    expect(marks).toHaveLength(s.operated.steps);
    const gates = S.horizon.lines.filter((l) => l.id.startsWith("gate-") && !l.id.includes("drop"));
    expect(gates.map((g) => g.id)).toEqual(s.agent.gates.map((g) => `gate-${g.kind}`));
  });

  it("the exploded stack builds base first, and the base is the gold", () => {
    /* The record lists the template top down, as a layer tree reads; the
       drawing builds it bottom up, as the file is composed. */
    const s = section("vandaag");
    if (s.kind !== "list-groups" || !s.exploded) throw new Error("vandaag");
    const plates = S.exploded.lines.filter(
      (l) => l.id.startsWith("plate-") && !/-c\d$/.test(l.id)
    );
    expect(plates.map((p) => p.id)).toEqual(
      [...s.exploded.layers].reverse().map((l) => `plate-${l.id}`)
    );
    expect(plates[0].role).toBe("gold");
    expect(plates[0].donor).toBe(true);
    // The guide stays a guide.
    const dashedLayer = s.exploded.layers.find((l) => l.dashed);
    expect(plates.find((p) => p.id === `plate-${dashedLayer?.id}`)?.dashed).toBe(true);
  });

  it("the specs are deterministic, seed for seed", () => {
    const a = specs();
    const b = specs();
    for (const id of Object.keys(a)) {
      expect(JSON.stringify(a[id].dust)).toBe(JSON.stringify(b[id].dust));
      expect(a[id].dust.every((d) => d.points.length > 0)).toBe(true);
    }
  });

  it("an anchor channel is per canvas, not a module singleton", () => {
    /* ⚠ THIS PAGE MOUNTS FOUR. The trajectory's `holoAnchorsRef` is a module
       ref, correct while one canvas publishes; four would overwrite one
       another every frame and the labels of whichever rendered last would
       land on all of them — silently, since every write is valid and every
       read returns something. */
    const one = createAnchorChannel();
    const two = createAnchorChannel();
    one.publish([{ id: "a", x: 0.5, y: 0.5, frontness: 1, visible: true, side: "up" }]);
    expect(one.read()).toHaveLength(1);
    expect(two.read()).toHaveLength(0);
    two.clear();
    expect(one.read()).toHaveLength(1);
  });

  it("the camera orbits its target, not the origin", () => {
    /* A scene whose centre is not the origin — every one of these — would
       otherwise be framed against a point outside it. */
    const cam = stageCameraPosition();
    expect(Math.hypot(...cam)).toBeCloseTo(14, 6);
    const fit = solveStageFit(S.curve.bounds, 1200, 600);
    expect(fit.target.some((v) => Math.abs(v) > 0.5)).toBe(true);
  });
});
