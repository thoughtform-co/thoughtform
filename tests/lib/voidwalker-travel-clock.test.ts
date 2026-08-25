import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { CAMERA_FOV, getCameraFov } from "@/components/landing/home-v2/DepthGatewayScene/sceneGeom";
import { VOIDWALKER_BEATS } from "@/lib/voidwalker/voidwalkerData";
import {
  VW_BLUR_MAX,
  VW_CAMERA_FOV_DEG,
  VW_TRAVEL_ENTRY_FRAC,
  VW_TRAVEL_FOOT_FRAC,
  VW_TRAVEL_PARK,
  VW_TRAVEL_RUNWAY_SVH,
  VW_TRAVEL_SPAN,
  VW_Z_FAR,
  VW_Z_NEAR,
  activeStop,
  axisYearFrac,
  beatBlurPx,
  beatDepthPx,
  beatOpacity,
  beatPowerOn,
  beatTravelT,
  entryT,
  footT,
  ringsPassed,
  stopHome,
  stopWidth,
  travelCameraFovDeg,
  travelFlight,
  travelHeadArmed,
  travelPerspectivePx,
  travelYear,
  yearFrac,
} from "@/lib/voidwalker/voidwalkerTravelClock";

const ROOT = join(__dirname, "..", "..");
const YEARS = VOIDWALKER_BEATS.map((b) => b.sortYear);
const N = YEARS.length;

/** Walk the runway densely — every assertion below is about the whole
 *  envelope, not a handful of sampled points. */
const walk = (steps = 1200) => Array.from({ length: steps + 1 }, (_, i) => i / steps);

describe("voidwalker travel clock — the flight", () => {
  it("clamps outside the runway", () => {
    for (const i of [0, 1, 2, N - 1]) {
      expect(beatTravelT(-1, i, N)).toBe(beatTravelT(0, i, N));
      expect(beatTravelT(2, i, N)).toBe(beatTravelT(1, i, N));
    }
  });

  it("is monotone non-decreasing in scroll for every stop", () => {
    for (let i = 0; i < N; i++) {
      let prev = -Infinity;
      for (const p of walk()) {
        const t = beatTravelT(p, i, N);
        expect(t).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = t;
      }
    }
  });

  it("starts every stop fogged out and flies all of them past the camera", () => {
    for (let i = 0; i < N; i++) {
      const ts = walk().map((p) => beatTravelT(p, i, N));
      // Every stop must LEAVE — nothing may be stranded on screen over
      // the foot. This is what sizes VW_TRAVEL_FOOT_FRAC: the last stop
      // is the binding case and it fails first.
      expect(Math.max(...ts)).toBeGreaterThan(0.99);
      expect(beatOpacity(beatTravelT(1, i, N))).toBe(0);
      // ⚠ Not every stop reaches exactly −1: the first one's home is only
      // ~1.7 stops from the runway's start, and the flight now spans 3.8.
      // What matters is that it is INVISIBLE at the start, which the fog
      // reaches before the flight parameter does.
      expect(beatOpacity(beatTravelT(0, i, N))).toBe(0);
    }
  });

  it("parks every stop at the reading plane for a real dwell", () => {
    for (let i = 0; i < N; i++) {
      const parked = walk().filter((p) => beatTravelT(p, i, N) === 0);
      expect(parked.length).toBeGreaterThan(0);
      // The park must be a BAND, not a single crossing — a beat that is
      // only readable at one scroll position is not readable.
      const span = Math.max(...parked) - Math.min(...parked);
      expect(span).toBeGreaterThan(stopWidth(N) * VW_TRAVEL_PARK * 0.8);
    }
  });

  it("parks each stop at its own home, in record order", () => {
    for (let i = 0; i < N; i++) {
      expect(beatTravelT(stopHome(i, N), i, N)).toBe(0);
    }
    const homes = Array.from({ length: N }, (_, i) => stopHome(i, N));
    expect([...homes].sort((a, b) => a - b)).toEqual(homes);
    expect(homes[0]).toBeGreaterThanOrEqual(VW_TRAVEL_ENTRY_FRAC);
    expect(homes[N - 1]).toBeLessThanOrEqual(1 - VW_TRAVEL_FOOT_FRAC);
  });

  it("overlaps neighbours, so the field is never one card at a time", () => {
    // At stop i's home the NEXT stop must already be on its way in AND
    // faintly PAINTING — an overlap nobody can see is not an overlap.
    for (let i = 0; i < N - 1; i++) {
      const t = beatTravelT(stopHome(i, N), i + 1, N);
      expect(t).toBeGreaterThan(-1);
      expect(t).toBeLessThan(0);
      const o = beatOpacity(t);
      expect(o).toBeGreaterThan(0.05);
      expect(o).toBeLessThan(0.6);
      // …and clearly further down the tunnel than the parked one.
      expect(beatDepthPx(t)).toBeLessThan(-600);
    }
    // ⚠ The bound is 2, not 1 — see VW_TRAVEL_SPAN. A neighbour is one
    // full stop away and the flight only begins outside the park.
    expect(VW_TRAVEL_SPAN).toBeGreaterThan(2 + VW_TRAVEL_PARK / 2);
  });

  it("paints at most three stops at once", () => {
    // The compositing budget this layer is designed around: a DOM plane
    // with a blur filter is cheap in ones and threes, not in tens.
    for (const p of walk(600)) {
      const painting = Array.from({ length: N }, (_, i) =>
        beatOpacity(beatTravelT(p, i, N))
      ).filter((o) => o > 0.001);
      expect(painting.length).toBeLessThanOrEqual(3);
    }
  });
});

describe("voidwalker travel clock — depth and fog", () => {
  it("maps the flight onto the depth range, monotonically", () => {
    expect(beatDepthPx(-1)).toBe(VW_Z_FAR);
    expect(beatDepthPx(0)).toBe(0);
    expect(beatDepthPx(1)).toBe(VW_Z_NEAR);
    let prev = -Infinity;
    for (let i = 0; i <= 400; i++) {
      const z = beatDepthPx(-1 + (2 * i) / 400);
      expect(z).toBeGreaterThanOrEqual(prev - 1e-6);
      prev = z;
    }
  });

  it("keeps the near plane clear of the perspective distance", () => {
    // An element at z → P projects to infinite scale. Check the tightest
    // real viewport rather than a comfortable one.
    for (const [w, h] of [
      [1280, 720],
      [1440, 800],
      [1920, 1080],
      [1920, 1247],
      [2560, 1330],
    ]) {
      const P = travelPerspectivePx(h, w / h);
      expect(VW_Z_NEAR).toBeLessThan(P * 0.75);
    }
  });

  it("is invisible at both extremes and solid across the park", () => {
    expect(beatOpacity(-1)).toBe(0);
    expect(beatOpacity(0)).toBe(1);
    expect(beatOpacity(1)).toBe(0);
    expect(beatBlurPx(0)).toBe(0);
    expect(beatBlurPx(1)).toBeCloseTo(VW_BLUR_MAX, 5);
    expect(beatBlurPx(-1)).toBeCloseTo(VW_BLUR_MAX, 5);
  });

  it("defocuses a receding neighbour enough to stop it competing", () => {
    // The live capture's finding: at under a pixel of blur a beat one
    // stop back stays legible, and two readable paragraphs at different
    // scales read as overlapping text, not as depth.
    const t = beatTravelT(stopHome(0, N), 1, N);
    expect(beatBlurPx(t)).toBeGreaterThan(2.5);
    // …while the parked stop stays perfectly sharp.
    expect(beatBlurPx(0)).toBe(0);
  });

  it("lights a stop fully before it parks and holds it lit", () => {
    expect(beatPowerOn(-1)).toBe(0);
    expect(beatPowerOn(0)).toBe(1);
    expect(beatPowerOn(1)).toBe(1);
  });
});

describe("voidwalker travel clock — the graduated axis (A4)", () => {
  it("places ticks and marker on ONE measure", () => {
    // The marker at a stop's home must sit exactly on that stop's year.
    for (let i = 0; i < N; i++) {
      expect(axisYearFrac(stopHome(i, N), YEARS)).toBeCloseTo(yearFrac(YEARS[i]!, YEARS), 6);
    }
  });

  it("runs newest → oldest across the record", () => {
    expect(yearFrac(YEARS[0]!, YEARS)).toBe(0);
    expect(yearFrac(YEARS[N - 1]!, YEARS)).toBe(1);
  });

  it("moves NON-uniformly — the gaps are the reading", () => {
    // If the marker were driven by runway fraction its per-stop steps
    // would be equal. Driven by year they must not be: that difference
    // IS the encoded elapsed time.
    const steps: number[] = [];
    for (let i = 0; i < N - 1; i++) {
      steps.push(axisYearFrac(stopHome(i + 1, N), YEARS) - axisYearFrac(stopHome(i, N), YEARS));
    }
    const min = Math.min(...steps);
    const max = Math.max(...steps);
    expect(max).toBeGreaterThan(min * 2);
  });

  it("counts years backwards, monotonically, across the record's span", () => {
    let prev = Infinity;
    for (const p of walk()) {
      const y = travelYear(p, YEARS);
      expect(y).toBeLessThanOrEqual(prev + 1e-9);
      prev = y;
    }
    expect(travelYear(0, YEARS)).toBeCloseTo(YEARS[0]!, 6);
    expect(travelYear(1, YEARS)).toBeCloseTo(YEARS[N - 1]!, 6);
  });

  it("flies one ring per year, and the rings share the axis's measure", () => {
    expect(ringsPassed(0, YEARS)).toBeCloseTo(0, 6);
    expect(ringsPassed(1, YEARS)).toBeCloseTo(YEARS[0]! - YEARS[N - 1]!, 6);
    let prev = -Infinity;
    for (const p of walk()) {
      const r = ringsPassed(p, YEARS);
      expect(r).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = r;
    }
  });

  it("assigns every stop to a real index", () => {
    for (const p of walk(400)) {
      const s = activeStop(p, N);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThan(N);
      expect(Number.isInteger(s)).toBe(true);
    }
  });
});

describe("voidwalker travel clock — entry, foot, masthead", () => {
  it("saturates the entry dive, with the first beat only a glimmer ahead", () => {
    expect(entryT(0)).toBe(0);
    expect(entryT(VW_TRAVEL_ENTRY_FRAC)).toBe(1);
    // The first beat is invisible as the dive begins…
    expect(beatOpacity(beatTravelT(0, 0, N))).toBe(0);
    // …and no more than a glimmer far down the tunnel halfway through it.
    // Deliberately not zero: seeing where you are falling TO is the whole
    // reason the dive is a beat rather than a cut.
    expect(beatOpacity(beatTravelT(VW_TRAVEL_ENTRY_FRAC * 0.5, 0, N))).toBeLessThan(0.3);
    // It only takes the reading plane well after the dive has finished.
    expect(beatTravelT(VW_TRAVEL_ENTRY_FRAC, 0, N)).toBeLessThan(0);
  });

  it("runs the foot only in the runway's tail", () => {
    expect(footT(0)).toBe(0);
    expect(footT(1 - VW_TRAVEL_FOOT_FRAC)).toBe(0);
    expect(footT(1)).toBe(1);
  });

  it("flies the medium LINEARLY", () => {
    // The tunnel is a medium, not an object with an entrance: easing it
    // would make the walls surge between beats.
    expect(travelFlight(0.25)).toBeCloseTo(0.25, 9);
    expect(travelFlight(0.5)).toBeCloseTo(0.5, 9);
    expect(travelFlight(0.75)).toBeCloseTo(0.75, 9);
  });

  it("arms the masthead on the dive and disarms once travelling", () => {
    expect(travelHeadArmed(false, 0)).toBe(false);
    expect(travelHeadArmed(false, VW_TRAVEL_ENTRY_FRAC * 0.7)).toBe(true);
    expect(travelHeadArmed(true, 0.5)).toBe(false);
  });

  it("does not churn on the threshold", () => {
    // Inside the hysteresis band the previous state must survive.
    const on = VW_TRAVEL_ENTRY_FRAC * 0.34;
    expect(travelHeadArmed(true, on)).toBe(true);
    expect(travelHeadArmed(false, on)).toBe(false);
  });
});

describe("voidwalker travel clock — the seams it must not drift from", () => {
  it("mirrors the scene camera's FOV exactly", () => {
    // ⚠ `sceneGeom` pulls THREE, so the clock cannot import it and the
    // constant is mirrored. This is the guard that keeps the mirror true
    // — without it the DOM field and the WebGL tunnel would silently
    // stop sharing a projection.
    expect(VW_CAMERA_FOV_DEG).toBe(CAMERA_FOV);
    for (const aspect of [0.5, 0.68, 0.9, 1, 1.33, 1.78, 2.4]) {
      expect(travelCameraFovDeg(aspect)).toBeCloseTo(getCameraFov(aspect), 9);
    }
  });

  it("derives a perspective that matches the camera's projection", () => {
    // P = (H/2) / tan(fov/2) — the identity that makes a DOM plane at
    // translateZ project like the same plane would in the canvas.
    for (const [w, h] of [
      [1280, 720],
      [1440, 800],
      [1920, 1247],
    ]) {
      const fov = (travelCameraFovDeg(w / h) * Math.PI) / 180;
      expect(travelPerspectivePx(h, w / h)).toBeCloseTo(h / 2 / Math.tan(fov / 2), 6);
    }
  });

  it("pairs the runway constant with the stylesheet that owns the height", () => {
    // ⚠ The CSS owns the runway's height (it must exist pre-hydration);
    // this constant owns the arithmetic. They are two declarations of one
    // number, so the guard reads the sheet.
    const css = readFileSync(
      join(ROOT, "components/landing/home-v2/voidwalker/voidwalker-travel.css"),
      "utf8"
    );
    const m = css.match(/--vw-travel-runway:\s*(\d+(?:\.\d+)?)svh/);
    expect(m).not.toBeNull();
    expect(Number(m![1]) / 100).toBeCloseTo(VW_TRAVEL_RUNWAY_SVH, 6);
  });

  it("gives every stop at least a viewport of runway", () => {
    // Below this the reader cannot stop at a beat before the next one is
    // already on the plane — the dead-scroll ban's opposite failure.
    const perStop = VW_TRAVEL_RUNWAY_SVH * stopWidth(N);
    expect(perStop).toBeGreaterThan(1);
  });
});
