/**
 * ADR-081 U5 — the fly-through release and the tunnel's rail layer.
 *
 * Two defects this file exists to stop coming back:
 *
 *   1. THE MARK WAS UNREACHABLE. The parked brandmark is a billboard
 *      welded a fixed distance in front of the camera, so the entry
 *      dive moved the camera and the mark rode along at constant
 *      apparent size. Nothing measured the mark against the camera, so
 *      every guard was green while the section's whole gesture — flying
 *      through the wireframe — was silently not happening.
 *
 *   2. A DASH THAT STRADDLES THE WRAP paints a full-length streak for
 *      one frame per wrap cycle. A contact sheet will miss it.
 */
import { afterEach, describe, expect, it } from "vitest";

import {
  VW_FLIGHT_DEFAULT,
  resetVwFlightConfig,
  setVwFlightOverrides,
} from "@/lib/voidwalker/voidwalkerFlightConfig";
import { markFlyThroughRelease } from "@/lib/voidwalker/voidwalkerTravelClock";
import {
  RAIL_DASHES,
  RAIL_DASH_DUTY,
  RAIL_PARTIAL_EVERY,
  RAIL_PARTIAL_FRAC,
  buildVoidwalkerRailLayout,
  railDashesFitSlots,
} from "@/lib/voidwalker/voidwalkerRailLayout";

afterEach(() => resetVwFlightConfig());

describe("ADR-081 U5 — the brandmark fly-through release", () => {
  it("ships ON, and its zero is the documented restore path", () => {
    // ⚠ These two knobs are the ONLY ones in the config whose default is
    // not an identity against a pre-existing constant — they ARE the U5
    // change. If either flips to 0 the landing silently returns to the
    // dots-only tunnel and the unreachable mark.
    expect(VW_FLIGHT_DEFAULT.markFlyThrough).toBe(1);
    expect(VW_FLIGHT_DEFAULT.railDensity).toBe(1);
  });

  it("is EXACTLY zero at entry = 0, at every knob value", () => {
    // The identity contract. The ambient hold, the dock, the corridor and
    // every reading beat must be byte-identical whatever this is set to —
    // the same contract `getVoidwalkerTravelCameraPose` carries at its
    // own engage edge, and the reason the knob scales the channel rather
    // than replacing it.
    for (const knob of [0, 0.25, 0.5, 1]) {
      setVwFlightOverrides({ markFlyThrough: knob });
      expect(markFlyThroughRelease(0, true)).toBe(0);
    }
  });

  it("is zero on every frame the runway is not engaged", () => {
    for (const e of [0, 0.2, 0.5, 0.9, 1]) {
      expect(markFlyThroughRelease(e, false)).toBe(0);
    }
  });

  it("reaches a full release by the end of the dive", () => {
    expect(markFlyThroughRelease(1, true)).toBeCloseTo(1, 10);
  });

  it("rises monotonically across the dive — the mark may never fall back toward the lens", () => {
    let prev = -1;
    for (let i = 0; i <= 40; i++) {
      const v = markFlyThroughRelease(i / 40, true);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it("eases in rather than lurching off the lens at engage", () => {
    // smootherstep: the first tenth of the dive must spend well under a
    // tenth of the release, or the mark visibly jumps at the instant the
    // runway takes over.
    expect(markFlyThroughRelease(0.1, true)).toBeLessThan(0.02);
    expect(markFlyThroughRelease(0.5, true)).toBeCloseTo(0.5, 6);
  });

  it("restores the pre-U5 weld at knob 0, on every frame of the dive", () => {
    setVwFlightOverrides({ markFlyThrough: 0 });
    for (const e of [0, 0.3, 0.6, 1]) {
      expect(markFlyThroughRelease(e, true)).toBe(0);
    }
  });

  it("scales linearly with the knob so the lab can sweep it", () => {
    setVwFlightOverrides({ markFlyThrough: 0.5 });
    expect(markFlyThroughRelease(1, true)).toBeCloseTo(0.5, 10);
  });
});

describe("ADR-081 U5 — the tunnel's longitudinal rails", () => {
  const SPAN = 1.35 * 30;
  const RX = 3.15;
  const RY = 2.15;

  it("never lets a dash straddle its slot — the wrap guard", () => {
    // ⚠ THE DEFECT THIS CATCHES IS INVISIBLE ON A CONTACT SHEET. Both
    // vertices of a dash wrap on a shared anchor, so a dash longer than
    // its slot would cross the modulo boundary and draw the full length
    // of the tunnel for one frame per cycle.
    expect(railDashesFitSlots(SPAN)).toBe(true);
    expect(RAIL_DASH_DUTY).toBeGreaterThan(0);
    expect(RAIL_DASH_DUTY).toBeLessThan(1);
  });

  it("gives both ends of every dash the SAME wrapping anchor", () => {
    const l = buildVoidwalkerRailLayout(6, SPAN, RX, RY);
    for (let i = 0; i < l.anchors.length; i += 2) {
      expect(l.anchors[i]).toBe(l.anchors[i + 1]);
    }
  });

  it("carries the dash extent on the offset, never on the anchor", () => {
    const l = buildVoidwalkerRailLayout(6, SPAN, RX, RY);
    const slot = SPAN / RAIL_DASHES;
    for (let i = 0; i < l.offsets.length; i += 2) {
      expect(l.offsets[i]).toBe(0);
      expect(l.offsets[i + 1]).toBeCloseTo(-slot * RAIL_DASH_DUTY, 10);
      // And the ink must be shorter than the slot, per dash, measured.
      expect(Math.abs(l.offsets[i + 1])).toBeLessThan(slot);
    }
  });

  it("keeps every dash inside the span so the layer wraps cleanly", () => {
    const l = buildVoidwalkerRailLayout(12, SPAN, RX, RY);
    const slot = SPAN / RAIL_DASHES;
    for (let i = 0; i < l.anchors.length; i++) {
      const far = l.anchors[i] + l.offsets[i];
      expect(l.anchors[i]).toBeLessThanOrEqual(0);
      expect(far).toBeGreaterThan(-SPAN - slot);
    }
  });

  it("breaks the cage: every third rail runs short", () => {
    // The dot shell's per-ring twist exists so rings never line up into a
    // cage. The rails give that alignment back deliberately, so they owe
    // the same debt a different way — partial rails.
    const n = 12;
    const l = buildVoidwalkerRailLayout(n, SPAN, RX, RY);
    const partials = l.dashesPerRail.filter((d) => d < RAIL_DASHES);
    const expected = Array.from({ length: n }, (_, r) => r).filter(
      (r) => r % RAIL_PARTIAL_EVERY === 1
    ).length;
    expect(partials.length).toBe(expected);
    expect(expected).toBeGreaterThan(0);
    for (const d of partials) {
      expect(d).toBe(Math.round(RAIL_DASHES * RAIL_PARTIAL_FRAC));
    }
    // …and not ALL of them, or the shell has no full-length rail at all.
    expect(l.dashesPerRail.some((d) => d === RAIL_DASHES)).toBe(true);
  });

  it("seats the rails on the shell, not inside it", () => {
    const l = buildVoidwalkerRailLayout(16, SPAN, RX, RY);
    for (let i = 0; i < l.positions.length; i += 3) {
      const x = l.positions[i];
      const y = l.positions[i + 1];
      // Every rail sits exactly on the oval — the shader does the
      // convergence, so the geometry must not pre-apply it.
      expect((x / RX) ** 2 + (y / RY) ** 2).toBeCloseTo(1, 8);
      expect(l.positions[i + 2]).toBe(0);
    }
  });

  it("is deterministic — the same layout on every reload and capture", () => {
    const a = buildVoidwalkerRailLayout(18, SPAN, RX, RY);
    const b = buildVoidwalkerRailLayout(18, SPAN, RX, RY);
    expect(a.positions).toEqual(b.positions);
    expect(a.ranks).toEqual(b.ranks);
    expect(a.anchors).toEqual(b.anchors);
  });

  it("builds nothing at all when the density knob is off", () => {
    const l = buildVoidwalkerRailLayout(0, SPAN, RX, RY);
    expect(l.positions).toHaveLength(0);
    expect(l.dashesPerRail).toHaveLength(0);
  });

  it("emits two vertices per dash and keeps every attribute in step", () => {
    const l = buildVoidwalkerRailLayout(9, SPAN, RX, RY);
    const verts = l.dashesPerRail.reduce((s, d) => s + d, 0) * 2;
    expect(l.positions).toHaveLength(verts * 3);
    expect(l.anchors).toHaveLength(verts);
    expect(l.offsets).toHaveLength(verts);
    expect(l.ranks).toHaveLength(verts);
  });
});
