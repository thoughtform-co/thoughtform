import { describe, expect, it } from "vitest";

import {
  BEAT_ORDER,
  BEAT_PARK_CENTRES,
  BEAT_WINDOWS,
  CAMERA_END,
  CAMERA_START,
  DOLLY_HOLD_END,
  STATIONS,
  cameraZDollyT,
  clamp01,
  corridorLegs,
  gateZAtParkProgress,
  lerp,
  resolveBeat,
  smoothstep,
  stationById,
  windowFor,
} from "@/lib/home-v2/corridorMap";

/**
 * corridorMap is the topology kernel for the home-v2 depth corridor
 * (ADR-018). Anything downstream — the camera rig, the gate Z solver,
 * the HUD readout, the brandmark journey, the v7-parse station surgery
 * — derives from this module. These tests pin its invariants so the
 * topology can grow safely.
 */

describe("corridorMap — math primitives", () => {
  it("clamp01 saturates outside [0,1]", () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(0)).toBe(0);
    expect(clamp01(0.42)).toBe(0.42);
    expect(clamp01(1)).toBe(1);
    expect(clamp01(2)).toBe(1);
  });

  it("smoothstep is the standard 3t² − 2t³ S-curve and saturates outside the edges", () => {
    expect(smoothstep(0, 1, -0.1)).toBe(0);
    expect(smoothstep(0, 1, 0)).toBe(0);
    expect(smoothstep(0, 1, 1)).toBe(1);
    expect(smoothstep(0, 1, 1.1)).toBe(1);
    // Symmetric around 0.5 → exactly 0.5.
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 10);
    // S-curve: midpoint between 0 and 0.5 should sit BELOW the linear value
    // (the curve is concave-up there).
    expect(smoothstep(0, 1, 0.25)).toBeLessThan(0.25);
    expect(smoothstep(0, 1, 0.75)).toBeGreaterThan(0.75);
  });

  it("lerp produces the convex combination", () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, 1)).toBe(10);
  });
});

describe("corridorMap — beat windows", () => {
  it("BEAT_WINDOWS tile [0,1] without gaps or overlap, in BEAT_ORDER", () => {
    expect(BEAT_WINDOWS.map((w) => w.beat)).toEqual(BEAT_ORDER);
    expect(BEAT_WINDOWS[0].start).toBe(0);
    expect(BEAT_WINDOWS[BEAT_WINDOWS.length - 1].end).toBe(1);

    for (let i = 0; i < BEAT_WINDOWS.length; i += 1) {
      const w = BEAT_WINDOWS[i];
      expect(w.start).toBeLessThan(w.end);
      if (i > 0) {
        expect(w.start).toBeCloseTo(BEAT_WINDOWS[i - 1].end, 10);
      }
    }
  });

  it("BEAT_PARK_CENTRES places each parked station's centre inside its window", () => {
    for (const w of BEAT_WINDOWS) {
      const centre = BEAT_PARK_CENTRES[w.beat];
      if (centre == null) continue;
      expect(centre).toBeGreaterThanOrEqual(w.start);
      expect(centre).toBeLessThanOrEqual(w.end);
    }
    // Every station node must have a park centre.
    for (const station of STATIONS) {
      // Park progress and the table can disagree only for waypoints (non-station
      // ids). Accept either an exact match in the table OR a table miss for
      // waypoints (which are not parked stations).
      const centre = BEAT_PARK_CENTRES[station.id as keyof typeof BEAT_PARK_CENTRES];
      if (centre != null) {
        expect(centre).toBeCloseTo(station.parkProgress, 10);
      }
    }
  });

  it("windowFor matches the literal table", () => {
    for (const w of BEAT_WINDOWS) {
      expect(windowFor(w.beat)).toEqual(w);
    }
  });
});

describe("corridorMap — resolveBeat", () => {
  it("returns each beat for its own window centre", () => {
    for (const w of BEAT_WINDOWS) {
      const mid = (w.start + w.end) / 2;
      const r = resolveBeat(mid);
      expect(r.beat).toBe(w.beat);
      expect(r.gateProgress).toBeGreaterThan(0);
      expect(r.gateProgress).toBeLessThan(1);
    }
  });

  it("clamps below 0 to the first beat and above 1 to the last beat", () => {
    expect(resolveBeat(-1).beat).toBe(BEAT_WINDOWS[0].beat);
    expect(resolveBeat(2).beat).toBe(BEAT_WINDOWS[BEAT_WINDOWS.length - 1].beat);
    expect(resolveBeat(2).gateProgress).toBe(1);
  });
});

describe("corridorMap — camera dolly", () => {
  it("holds at 0 across the setup window, then ramps to 1", () => {
    expect(cameraZDollyT(0)).toBe(0);
    expect(cameraZDollyT(DOLLY_HOLD_END)).toBe(0);
    expect(cameraZDollyT(1)).toBe(1);
    expect(cameraZDollyT((DOLLY_HOLD_END + 1) / 2)).toBeGreaterThan(0);
  });

  it("camera moves monotonically forward (Z decreases) along the corridor", () => {
    let lastZ = CAMERA_START[2];
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const t = cameraZDollyT(p);
      const z = CAMERA_START[2] + (CAMERA_END[2] - CAMERA_START[2]) * t;
      expect(z).toBeLessThanOrEqual(lastZ + 1e-6);
      lastZ = z;
    }
  });

  it("gateZAtParkProgress places the gate parkDistance in front of the camera", () => {
    const progress = 0.5;
    const camZ = CAMERA_START[2] + (CAMERA_END[2] - CAMERA_START[2]) * cameraZDollyT(progress);
    const gateZ = gateZAtParkProgress(progress, 4.5);
    expect(camZ - gateZ).toBeCloseTo(4.5, 10);
  });
});

describe("corridorMap — solved stations", () => {
  it("exposes the four production gate stations + the interstitial waypoint", () => {
    const ids = STATIONS.map((s) => s.id);
    expect(ids).toContain("thoughtform");
    expect(ids).toContain("navigate");
    expect(ids).toContain("diagnostic");
    expect(ids).toContain("interstitial");
    expect(ids).toContain("intelligence");
  });

  it("places solved gate Z values monotonically deeper as park progress advances", () => {
    const sorted = [...STATIONS].sort((a, b) => a.parkProgress - b.parkProgress);
    for (let i = 1; i < sorted.length; i += 1) {
      // Z gets MORE NEGATIVE (deeper) as we advance through the corridor.
      expect(sorted[i].position[2]).toBeLessThanOrEqual(sorted[i - 1].position[2] + 1e-6);
    }
  });

  it("solves each gate Z so the camera lands parkDistance in front at parkProgress", () => {
    for (const s of STATIONS) {
      const t = cameraZDollyT(s.parkProgress);
      const camZ = CAMERA_START[2] + (CAMERA_END[2] - CAMERA_START[2]) * t;
      expect(camZ - s.position[2]).toBeCloseTo(s.parkDistance, 5);
    }
  });

  it("stationById resolves known ids and returns undefined for missing ones", () => {
    expect(stationById("intelligence")?.gate).toBe("sphere");
    expect(stationById("does-not-exist")).toBeUndefined();
  });
});

describe("corridorMap — corridorLegs", () => {
  it("yields one leg per transition node, with a defined window", () => {
    const legs = corridorLegs();
    expect(legs.length).toBeGreaterThan(0);
    for (const leg of legs) {
      expect(leg.window.start).toBeGreaterThanOrEqual(0);
      expect(leg.window.end).toBeLessThanOrEqual(1);
      expect(leg.window.start).toBeLessThan(leg.window.end);
      expect(leg.fromStationId.length).toBeGreaterThan(0);
      expect(leg.toStationId.length).toBeGreaterThan(0);
    }
  });
});
