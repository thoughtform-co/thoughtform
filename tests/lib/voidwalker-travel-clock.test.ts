import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CAMERA_FOV,
  getCameraFov,
  getCorridorExitCameraPose,
  getVoidwalkerTravelCameraPose,
} from "@/components/landing/home-v2/DepthGatewayScene/sceneGeom";
import { VOIDWALKER_BEATS } from "@/lib/voidwalker/voidwalkerData";
import {
  VW_BLUR_MAX,
  VW_CAMERA_FOV_DEG,
  VW_TRAVEL_ENTRY_FRAC,
  VW_TRAVEL_FOOT_FRAC,
  VW_TRAVEL_PARK,
  VW_TRAVEL_RUNWAY_SVH,
  VW_TRAVEL_SPAN,
  VW_TRAVEL_TAU_S,
  VW_Z_FAR,
  VW_Z_NEAR,
  activeStop,
  axisYearFrac,
  beatBlurPx,
  beatDepthPx,
  beatDepthUnproject,
  beatDetail,
  beatOpacity,
  beatPowerOn,
  beatRotDeg,
  beatScreenXFrac,
  beatScreenYFrac,
  beatTravelT,
  entryT,
  footT,
  ringsPassed,
  stopHome,
  stopWidth,
  travelCameraFovDeg,
  travelChase,
  travelFlight,
  travelHeadArmed,
  travelPerspectivePx,
  travelYear,
  wholeYears,
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

describe("voidwalker travel clock — the one clock", () => {
  it("converges on the target and settles exactly", () => {
    let v = 0;
    for (let i = 0; i < 400; i++) v = travelChase(v, 0.4, 1 / 60);
    // Exactly, not approximately: the settle threshold snaps the last
    // sliver, so a reader parked at a beat sits at the scrubbed depth
    // with no micro-creep in the tunnel behind them.
    expect(v).toBe(0.4);
  });

  it("covers ~63% of the gap in one time constant", () => {
    // The defining property of the exponential — if this drifts, the
    // camera and the field are no longer the same motion.
    // Accumulated over real frames, not in one step: the chase clamps a
    // single delta at 0.1s (a backgrounded tab hands back seconds), so
    // one tau is not a legal step. Gap kept under the teleport
    // threshold too, or the snap below fires instead.
    const h = VW_TRAVEL_TAU_S / 10;
    const after = (taus: number) => {
      let v = 0;
      for (let i = 0; i < 10 * taus; i++) v = travelChase(v, 0.4, h);
      return v;
    };
    expect(after(1)).toBeCloseTo(0.4 * (1 - Math.exp(-1)), 6);
    expect(after(3)).toBeGreaterThan(0.4 * 0.95);
  });

  it("is monotone toward the target and never overshoots", () => {
    let v = 0;
    let prev = -1;
    for (let i = 0; i < 200; i++) {
      v = travelChase(v, 0.8, 1 / 60);
      expect(v).toBeGreaterThanOrEqual(prev);
      expect(v).toBeLessThanOrEqual(0.8);
      prev = v;
    }
  });

  it("snaps rather than flying the wormhole on a teleport", () => {
    // A hash-nav or a scroll-restore landing mid-flight must not glide
    // the camera down the whole tunnel to catch up.
    expect(travelChase(0, 0.9, 1 / 60)).toBe(0.9);
    expect(travelChase(0.9, 0, 1 / 60)).toBe(0);
  });

  it("clamps a long frame instead of jumping through it", () => {
    // A backgrounded tab hands back a multi-second delta.
    const long = travelChase(0, 0.4, 5);
    expect(long).toBeLessThan(0.4);
    expect(long).toBeCloseTo(travelChase(0, 0.4, 0.1), 9);
  });
});

describe("voidwalker travel clock — the flight path", () => {
  const VW = 1440;
  const VH = 800;
  const P = travelPerspectivePx(VH, VW / VH);
  /** What the reader actually sees: the authored fraction, un-projected
   *  to a CSS offset at this depth, then projected back by the browser. */
  const onScreenPx = (t: number, side: 1 | -1) => {
    const z = beatDepthPx(t);
    const cssX = beatScreenXFrac(t, side) * VW * beatDepthUnproject(z, P);
    return cssX * (P / (P - z));
  };

  it("round-trips the un-projection back to the authored fraction", () => {
    // The whole model in one assertion: what is authored in screen
    // fractions is what lands on screen, at every depth.
    for (const t of [-1, -0.6, -0.2, 0, 0.3, 0.8, 1]) {
      expect(onScreenPx(t, 1)).toBeCloseTo(beatScreenXFrac(t, 1) * VW, 6);
    }
  });

  it("is genuinely off-axis at depth — the regression this replaced", () => {
    // THE DEFECT, IN ONE NUMBER. The old model offset a beat by a flat
    // 7% of its own 680px box and projected it: at VW_Z_FAR the scale is
    // ~0.31, so 48px of offset arrived as ~15px and every beat flew at
    // the reader dead centre. Anything small here is that bug back.
    const legacy = 0.07 * 680 * (P / (P - VW_Z_FAR));
    expect(legacy).toBeLessThan(20);
    expect(Math.abs(onScreenPx(-1, 1))).toBeGreaterThan(120);
    expect(Math.abs(onScreenPx(-0.5, 1))).toBeGreaterThan(60);
  });

  it("converges to the reading position and leaves wide", () => {
    // Parked: close to where the old flat offset put it, so the park's
    // composition is unchanged — only the approach to it is.
    expect(Math.abs(onScreenPx(0, 1))).toBeGreaterThan(40);
    expect(Math.abs(onScreenPx(0, 1))).toBeLessThan(80);
    // …and the park is the tightest point of the whole path.
    for (const t of [-1, -0.7, -0.35, 0.35, 0.7, 1]) {
      expect(Math.abs(onScreenPx(t, 1))).toBeGreaterThan(Math.abs(onScreenPx(0, 1)));
    }
    // Gone off its own side by the end.
    expect(Math.abs(onScreenPx(1, 1))).toBeGreaterThan(VW * 0.4);
  });

  it("alternates on the record's side, and crosses the two axes", () => {
    for (const t of [-1, -0.4, 0, 0.4, 1]) {
      expect(beatScreenXFrac(t, 1)).toBeCloseTo(-beatScreenXFrac(t, -1), 12);
      expect(beatScreenYFrac(t, 1)).toBeCloseTo(-beatScreenYFrac(t, -1), 12);
    }
    // Right-hand beats sit right; and the vertical runs AGAINST the
    // lateral, so an arrival is a diagonal rather than a fan.
    expect(beatScreenXFrac(-1, 1)).toBeGreaterThan(0);
    expect(beatScreenYFrac(-1, 1)).toBeLessThan(0);
  });

  it("is flat and centred at the park in both axes and the yaw", () => {
    // Type is never read on a skewed plane.
    expect(Math.abs(beatRotDeg(0, 1))).toBe(0);
    expect(Math.abs(beatScreenYFrac(0, 1))).toBe(0);
    expect(Math.abs(beatRotDeg(-1, 1))).toBeGreaterThan(4);
    expect(beatRotDeg(-1, 1)).toBeCloseTo(-beatRotDeg(-1, -1), 12);
  });

  it("keeps the path monotone outward from the park", () => {
    for (const side of [1, -1] as const) {
      for (const half of [-1, 1]) {
        let prev = 0;
        for (let k = 0; k <= 40; k++) {
          const v = Math.abs(beatScreenXFrac((half * k) / 40, side));
          expect(v).toBeGreaterThanOrEqual(prev - 1e-12);
          prev = v;
        }
      }
    }
  });
});

describe("voidwalker travel clock — slim in flight, full on park", () => {
  it("is whole at the park and absent in flight", () => {
    expect(beatDetail(0)).toBe(1);
    expect(beatDetail(-1)).toBe(0);
    expect(beatDetail(1)).toBe(0);
    // Gone well before the beat is, in both directions.
    expect(beatDetail(-0.35)).toBe(0);
    expect(beatDetail(0.2)).toBe(0);
  });

  it("never outshines the card carrying it", () => {
    // THE INVARIANT. A paragraph is part of a beat, so it can never be
    // more present than the beat — if this fails the body is legible on
    // a card the reader cannot yet see, which is the "two paragraphs
    // printed over each other" defect in a new place.
    for (const p of walk(400)) {
      const t = p * 2 - 1;
      expect(beatDetail(t)).toBeLessThanOrEqual(beatOpacity(t) + 1e-9);
    }
  });

  it("shows nothing while the beat is half defocused", () => {
    // Half of VW_BLUR_MAX is reached at |t| ~0.275; a body powering on
    // under that much blur is unreadable ink competing with the beat
    // that is actually parked.
    for (const t of [-0.28, -0.3, 0.28, 0.3]) {
      if (beatBlurPx(t) >= VW_BLUR_MAX * 0.5) expect(beatDetail(t)).toBeLessThan(0.02);
    }
  });

  it("powers on monotonically and leaves faster than it arrives", () => {
    let prev = -1;
    for (let k = -30; k <= 0; k++) {
      const v = beatDetail(k / 30);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    // The reading is over the moment the beat starts to recede — a body
    // that follows the plate out competes with the one arriving behind.
    const inSteps = walk(2000).filter((p) => beatDetail(-1 + p) === 0).length;
    const outSteps = walk(2000).filter((p) => beatDetail(p) > 0).length;
    expect(inSteps).toBeGreaterThan(0);
    expect(2000 - inSteps).toBeGreaterThan(outSteps);
  });
});

describe("voidwalker travel clock — the camera handoff", () => {
  it("engages as an exact identity with the parked pose", () => {
    // THIS TEST DID NOT EXIST, AND THE IDENTITY WAS HALF FALSE. The
    // source comment and ADR-081 both claimed the tunnel takes the
    // camera with no pop; the POSITION matched and the GAZE did not,
    // jumping 5.2 world units — a ~16 degree pitch snap at the exact
    // frame the reader crosses into the runway. Pin BOTH halves: the
    // position is the one that was already true.
    const parked = getCorridorExitCameraPose(1);
    const engaged = getVoidwalkerTravelCameraPose(0, 0);
    for (let i = 0; i < 3; i++) {
      expect(engaged.position[i]).toBeCloseTo(parked.position[i]!, 9);
      expect(engaged.lookAt[i]).toBeCloseTo(parked.lookAt[i]!, 9);
    }
  });

  it("levels the gaze onto the tunnel's axis across the dive", () => {
    const parked = getCorridorExitCameraPose(1);
    const dived = getVoidwalkerTravelCameraPose(0, 1);
    // By the end of the dive the camera looks down the axis, far ahead
    // of where the parked pose was looking.
    expect(dived.lookAt[2]).toBeLessThan(parked.lookAt[2]! - 4);
    // …and it gets there monotonically, so the levelling is a motion.
    let prev = Infinity;
    for (let k = 0; k <= 20; k++) {
      const z = getVoidwalkerTravelCameraPose(0, k / 20).lookAt[2];
      expect(z).toBeLessThanOrEqual(prev + 1e-9);
      prev = z;
    }
  });

  it("flies straight down the axis once the dive is done", () => {
    const a = getVoidwalkerTravelCameraPose(0, 1);
    const b = getVoidwalkerTravelCameraPose(1, 1);
    expect(b.position[2]).toBeLessThan(a.position[2]);
    expect(b.position[0]).toBeCloseTo(a.position[0], 9);
    expect(b.position[1]).toBeCloseTo(a.position[1], 9);
  });
});

describe("voidwalker travel clock — the rail is the axis", () => {
  it("letters only years the record itself prints", () => {
    // THE DEFECT THIS PINS, caught on a live capture and by nothing else:
    // two beats carry fractional sortYears purely to order them inside a
    // year they SHARE (2018.9, 2016.8). Rounded, the axis lettered 2019
    // and 2017 — years no chip on the surface prints — so the rail read
    // 2019 beside a parked card reading 2018.
    for (const b of VOIDWALKER_BEATS) {
      const whole = wholeYears([b.sortYear])[0]!;
      expect(Number.isInteger(whole)).toBe(true);
      expect(b.year).toContain(String(whole));
    }
  });

  it("seats every record year on an integer rung of the HUD ladder", () => {
    // The rail's thirteen ticks are TWELVE intervals, and this record
    // runs twelve years — so every year it lands on falls exactly on a
    // rung and the ladder needs nothing added to it (ADR-031's guardrail
    // holds by arithmetic rather than by care).
    //
    // It is a coincidence OF THE RECORD, not a law. A beat outside the
    // span slides every label off the ladder, so this fails loudly
    // instead. The placement itself stays proportional, so an out-of-span
    // record still reads correctly — just not on the rungs.
    const whole = wholeYears(YEARS);
    const span = whole[0]! - whole[whole.length - 1]!;
    expect(span).toBe(12);
    const RUNGS = 12;
    for (const y of new Set(whole)) {
      const rung = yearFrac(y, whole) * RUNGS;
      expect(Math.abs(rung - Math.round(rung))).toBeLessThan(1e-9);
    }
  });

  it("puts the marker on a rung whenever a beat is parked", () => {
    // The car and the labels share one measure, so the car cannot stop
    // between its own rungs — which is what a runway-driven marker did.
    const whole = wholeYears(YEARS);
    for (let i = 0; i < N; i++) {
      const rung = axisYearFrac(stopHome(i, N), whole) * 12;
      expect(Math.abs(rung - Math.round(rung))).toBeLessThan(1e-6);
    }
  });

  it("counts the rings over whole years, ending on the record's span", () => {
    const whole = wholeYears(YEARS);
    expect(ringsPassed(1, whole)).toBeCloseTo(12, 6);
    expect(ringsPassed(0, whole)).toBe(0);
  });
});
