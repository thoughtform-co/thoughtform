import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BEAT_PARK_CENTRES, DOLLY_HOLD_END, cameraZDollyT } from "@/lib/home-v2/corridorMap";
import {
  CORRIDOR_SVH,
  EPILOGUE_START,
  MOBILE_THESIS_EXIT_START,
  MOBILE_THOUGHTFORM_END,
  PASS_RAMP,
  PHONE_CORRIDOR_LEGS,
  PHONE_CORRIDOR_SCHEDULE,
  PHONE_PASS_SPEED,
  SCRUB_SVH,
  SEAT_BOX_MAX_SVH,
  STAGE_CELL_SVH,
  STAGE_SVH,
  THESIS_EXIT_SVH,
  cruise,
  passPeakFactor,
  phoneCorridorPx,
  phoneCorridorSeats,
  phoneLegPx,
  phonePaintProgress,
  phoneSeatFraction,
} from "@/lib/home-v2/phoneCorridorClock";

/**
 * The phone corridor's clock and its seats (ADR-125, U1).
 *
 * The desktop's corridor is untouched by construction: `useDepthScroll` calls
 * the remap only behind `active && mobile`, and the parks the dwells hold are
 * `corridorMap`'s own values by reference. What this file pins is the
 * arithmetic the device read stands on — a monotonic clock, continuous in
 * value and velocity, with a short dwell at every park and every pass at ONE
 * speed near the desktop's; four soft seats on the dwells and nowhere else;
 * the one mirrored literal (the stage's 820svh) equal in the three places it
 * lives; and the two source contracts that make the remap safe (the
 * follower's teleport detector reads RAW progress; the writer remaps only on
 * the phone).
 */

const ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

/** The three frames the Arc is read in: the iPhone 14 with Safari's toolbars
 *  hidden (Chromium's emulation), the same phone with them showing (the
 *  SMALL viewport — the composition frame on the device), and the Pro Max. */
const SHAPES = [
  { name: "iphone-14", vh: 844 },
  { name: "iphone-14 (toolbars)", vh: 676 },
  { name: "iphone-14-pro-max", vh: 932 },
] as const;

const leg = (id: string) => PHONE_CORRIDOR_SCHEDULE.find((l) => l.id === id)!;
const PASSES = ["pass-navigate", "pass-encode", "pass-build"] as const;
const DWELLS = ["navigate", "encode", "build"] as const;

describe("the schedule", () => {
  it("is the owner's numbers, the passes derived at one speed, and tiles the corridor with a real tail", () => {
    expect(PHONE_CORRIDOR_LEGS).toEqual({ thesisHold: 40, thesisRise: 60, dwell: 24, tail: 40 });
    expect(SCRUB_SVH).toBe(STAGE_SVH - STAGE_CELL_SVH);
    expect(CORRIDOR_SVH).toBeCloseTo(SCRUB_SVH * EPILOGUE_START, 9);
    // Cumulative, gapless, ending on the corridor's own end.
    let at = 0;
    for (const l of PHONE_CORRIDOR_SCHEDULE) {
      expect(l.start, l.id).toBeCloseTo(at, 9);
      expect(l.end, l.id).toBeGreaterThan(l.start);
      at = l.end;
    }
    expect(at).toBeCloseTo(CORRIDOR_SVH, 9);
    // Every pass runs at the one speed, and that speed is near the desktop's
    // (paint = raw progress, i.e. 1 / CORRIDOR_SVH per svh). Record: 1.333×.
    for (const id of PASSES) {
      const l = leg(id);
      expect(l.ease).toBe("cruise");
      expect((l.to - l.from) / (l.end - l.start), id).toBeCloseTo(PHONE_PASS_SPEED, 9);
    }
    const overDesktop = PHONE_PASS_SPEED * CORRIDOR_SVH;
    expect(overDesktop).toBeGreaterThanOrEqual(1.2);
    expect(overDesktop).toBeLessThanOrEqual(1.5);
    expect(overDesktop).toBeCloseTo(1.333, 2);
    // The dwells are the owner's dial, the thesis his 100svh.
    for (const id of DWELLS) {
      const l = leg(id);
      expect(l.ease).toBe("hold");
      expect(l.end - l.start).toBeCloseTo(PHONE_CORRIDOR_LEGS.dwell, 9);
    }
    expect(leg("thesis-rise").end).toBe(
      PHONE_CORRIDOR_LEGS.thesisHold + PHONE_CORRIDOR_LEGS.thesisRise
    );
    // The tail exists (the epilogue's camera starts from paint 1) and is at
    // least a quarter screen.
    const tail = PHONE_CORRIDOR_SCHEDULE[PHONE_CORRIDOR_SCHEDULE.length - 1];
    expect(tail.id).toBe("tail");
    expect(tail.to).toBe(1);
    expect(tail.end - tail.start).toBeCloseTo(PHONE_CORRIDOR_LEGS.tail, 6);
    expect(tail.end - tail.start).toBeGreaterThanOrEqual(25);
  });

  it("holds every park at corridorMap's own value, by reference", () => {
    expect(leg("thesis-hold").from).toBe(0);
    expect(leg("thesis-hold").to).toBe(0);
    expect(leg("thesis-rise").to).toBe(DOLLY_HOLD_END);
    expect(leg("navigate").from).toBe(BEAT_PARK_CENTRES.navigate);
    expect(leg("navigate").to).toBe(BEAT_PARK_CENTRES.navigate);
    expect(leg("encode").from).toBe(BEAT_PARK_CENTRES.diagnostic);
    expect(leg("encode").to).toBe(BEAT_PARK_CENTRES.diagnostic);
    expect(leg("build").from).toBe(BEAT_PARK_CENTRES.intelligence);
    expect(leg("build").to).toBe(BEAT_PARK_CENTRES.intelligence);
    // The camera is held with it: the dolly at the park is the dolly across
    // the whole dwell.
    for (const id of DWELLS) {
      const l = leg(id);
      const a = cameraZDollyT(phonePaintProgress(l.start / CORRIDOR_SVH));
      const b = cameraZDollyT(phonePaintProgress((l.start + l.end) / 2 / CORRIDOR_SVH));
      const c = cameraZDollyT(phonePaintProgress(l.end / CORRIDOR_SVH));
      expect(a).toBe(b);
      expect(b).toBe(c);
    }
  });

  it("derives the thesis dwell's end and its exit fade (no 0.30 literal survives)", () => {
    const rise = leg("thesis-rise");
    expect(MOBILE_THOUGHTFORM_END).toBeCloseTo(rise.end / CORRIDOR_SVH, 12);
    expect(MOBILE_THOUGHTFORM_END).toBeCloseTo(100 / CORRIDOR_SVH, 12);
    expect(MOBILE_THESIS_EXIT_START).toBeCloseTo((rise.end - THESIS_EXIT_SVH) / CORRIDOR_SVH, 12);
    expect(MOBILE_THESIS_EXIT_START).toBeLessThan(MOBILE_THOUGHTFORM_END);
    expect(MOBILE_THESIS_EXIT_START).toBeGreaterThan(rise.start / CORRIDOR_SVH);
    const geom = stripComments(read("components/landing/home-v2/DepthGatewayScene/sceneGeom.ts"));
    expect(geom).not.toMatch(/MOBILE_THOUGHTFORM_END\s*=\s*0\.3\b/);
    expect(geom).toMatch(/smoothstep\(MOBILE_THESIS_EXIT_START,\s*MOBILE_THOUGHTFORM_END/);
    expect(geom).toMatch(/phonePaintProgress as getMobilePaintProgress/);
  });
});

describe("the cruise", () => {
  const k = passPeakFactor("cruise");
  const slope = (t: number, h = 1e-6) => (cruise(t + h) - cruise(t - h)) / (2 * h);

  it("is pinned at both ends, still at both ends, and linear in the middle at its peak", () => {
    expect(cruise(0)).toBe(0);
    expect(cruise(1)).toBe(1);
    expect(cruise(-0.5)).toBe(0);
    expect(cruise(1.5)).toBe(1);
    expect(k).toBeCloseTo(1 / (1 - 2 * PASS_RAMP + (4 * PASS_RAMP) / Math.PI), 12);
    expect(k).toBeGreaterThan(1.2);
    expect(k).toBeLessThan(1.25);
    expect(passPeakFactor("linear")).toBe(1);
    expect(passPeakFactor("hold")).toBe(1);
    // Zero velocity at the edges (a slow drag never clicks off a beat).
    expect(slope(1e-4)).toBeLessThan(1e-3);
    expect(slope(1 - 1e-4)).toBeLessThan(1e-3);
    // The middle is the linear grammar at speed k.
    for (const t of [PASS_RAMP + 0.01, 0.5, 1 - PASS_RAMP - 0.01]) {
      expect(slope(t)).toBeCloseTo(k, 6);
    }
    // Continuous in value and velocity at both joins.
    for (const j of [PASS_RAMP, 1 - PASS_RAMP]) {
      expect(cruise(j + 1e-9) - cruise(j - 1e-9)).toBeLessThan(1e-7);
      expect(Math.abs(slope(j - 1e-4) - slope(j + 1e-4))).toBeLessThan(1e-3);
    }
    // Monotonic.
    let prev = 0;
    for (let i = 1; i <= 1000; i++) {
      const v = cruise(i / 1000);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe("phonePaintProgress", () => {
  it("is monotonic, continuous in value and velocity, and pinned at both ends", () => {
    expect(phonePaintProgress(0)).toBe(0);
    expect(phonePaintProgress(1)).toBe(1);
    expect(phonePaintProgress(-1)).toBe(0);
    expect(phonePaintProgress(2)).toBe(1);
    const N = 10_000;
    const h = CORRIDOR_SVH / N;
    let prev = phonePaintProgress(0);
    // The steepest leg is a pass at its cruise peak; one sample step may
    // never exceed that by more than 10 %.
    const steepest = Math.max(
      ...PHONE_CORRIDOR_SCHEDULE.map(
        (l) => ((l.to - l.from) / (l.end - l.start)) * passPeakFactor(l.ease)
      )
    );
    const maxStep = steepest * h * 1.1;
    let prevStep = 0;
    // The velocity is continuous: no step may differ from its neighbour by
    // more than the cruise's own acceleration over one sample, with slack
    // for the linear legs' corners (the thesis rise's and the tail's ends,
    // where the velocity steps by design between a hold and a linear leg).
    const accel = Math.max(
      ...PASSES.map((id) => {
        const l = leg(id);
        const L = l.end - l.start;
        return ((l.to - l.from) * passPeakFactor("cruise") * Math.PI) / (2 * PASS_RAMP * L * L);
      })
    );
    const linearCorner = Math.max(
      ...PHONE_CORRIDOR_SCHEDULE.filter((l) => l.ease === "linear").map(
        (l) => ((l.to - l.from) / (l.end - l.start)) * h
      )
    );
    for (let i = 1; i <= N; i++) {
      const v = phonePaintProgress(i / N);
      const step = v - prev;
      expect(v).toBeGreaterThanOrEqual(prev);
      expect(step).toBeLessThanOrEqual(maxStep);
      expect(Math.abs(step - prevStep)).toBeLessThanOrEqual(accel * h * h * 1.5 + linearCorner);
      prev = v;
      prevStep = step;
    }
    // And the peak inside each pass is the cruise's k times its mean, ±1 %.
    for (const id of PASSES) {
      const l = leg(id);
      const mid = (l.start + l.end) / 2;
      const d = 0.01;
      const v =
        (phonePaintProgress((mid + d) / CORRIDOR_SVH) -
          phonePaintProgress((mid - d) / CORRIDOR_SVH)) /
        (2 * d);
      const mean = (l.to - l.from) / (l.end - l.start);
      expect(v / mean, id).toBeCloseTo(passPeakFactor("cruise"), 2);
    }
  });

  it("dwells at every park and lands softly on both sides", () => {
    for (const id of DWELLS) {
      const l = leg(id);
      const at = (svh: number) => phonePaintProgress(svh / CORRIDOR_SVH);
      expect(at(l.start)).toBe(l.from);
      expect(at(l.end)).toBe(l.from);
      expect(at(l.start + 1)).toBe(l.from);
      expect(at(l.end - 1)).toBe(l.from);
      // Zero velocity at the edges: the last svh of the pass before and the
      // first svh of the pass after move the paint by less than two
      // thousandths of the pass's total (the cruise: 0.04 %).
      const before = PHONE_CORRIDOR_SCHEDULE.find((p) => p.end === l.start)!;
      const after = PHONE_CORRIDOR_SCHEDULE.find((p) => p.start === l.end)!;
      expect(before.ease).toBe("cruise");
      expect(at(before.end) - at(before.end - 1)).toBeLessThan((before.to - before.from) * 0.002);
      if (after.ease === "cruise") {
        expect(at(after.start + 1) - l.from).toBeLessThan((after.to - after.from) * 0.002);
      }
    }
  });
});

describe("the pixel budget", () => {
  it.each(SHAPES)(
    "$name — Navigate inside 2.3 screens, dwells a thumb's nudge, passes a screen or more",
    ({ vh }) => {
      const nav = phoneLegPx("navigate", vh);
      expect(nav.start / vh).toBeLessThan(2.3);
      for (const id of DWELLS) {
        const d = phoneLegPx(id, vh);
        expect(d.end - d.start, id).toBeCloseTo((PHONE_CORRIDOR_LEGS.dwell / 100) * vh, 6);
      }
      for (const id of PASSES) {
        const p = phoneLegPx(id, vh);
        expect(p.end - p.start, id).toBeGreaterThanOrEqual(0.9 * vh);
      }
      expect(phoneCorridorPx(vh)).toBeCloseTo((CORRIDOR_SVH / 100) * vh, 6);
    }
  );

  it("at 390×844 matches the record (±1px)", () => {
    const vh = 844;
    const near = (a: number, b: number) => Math.abs(a - b) <= 1;
    expect(near(phoneLegPx("navigate", vh).start, 1847)).toBe(true);
    expect(near(phoneLegPx("navigate", vh).end, 2050)).toBe(true);
    expect(near(phoneLegPx("encode", vh).start, 2865)).toBe(true);
    expect(near(phoneLegPx("encode", vh).end, 3067)).toBe(true);
    expect(near(phoneLegPx("build", vh).start, 4055)).toBe(true);
    expect(near(phoneLegPx("build", vh).end, 4257)).toBe(true);
    expect(near(phoneCorridorPx(vh), 4595)).toBe(true);
  });
});

describe("the seats", () => {
  it("are the four dwells' first frames, soft, and nothing else", () => {
    const seats = phoneCorridorSeats();
    expect(seats.map((s) => s.id)).toEqual(["thesis", "navigate", "encode", "build"]);
    for (const s of seats) expect("stop" in s, `${s.id} carries a stop`).toBe(false);
    let prevEnd = -1;
    for (const phase of ["thesis", "navigate", "encode", "build"] as const) {
      const legId = phase === "thesis" ? "thesis-hold" : phase;
      const l = leg(legId);
      const seat = seats.find((s) => s.id === phase)!;
      expect(seat.top).toBeCloseTo(l.start / SCRUB_SVH, 12);
      expect(seat.height).toBeCloseTo(Math.min(l.end - l.start, SEAT_BOX_MAX_SVH) / SCRUB_SVH, 12);
      expect(seat.top).toBeGreaterThan(prevEnd);
      prevEnd = seat.top + seat.height;
      expect(phoneSeatFraction(phase)).toBe(seat.top);
    }
    expect(prevEnd).toBeLessThan(EPILOGUE_START);
    // ⚠ No seat's BOX may be as tall as the snapport (a covering area pulls
    // rests back to its END — measured on the first cut).
    expect(SEAT_BOX_MAX_SVH).toBeLessThan(STAGE_CELL_SVH);
    for (const s of seats) {
      expect(s.height * SCRUB_SVH, s.id).toBeLessThanOrEqual(SEAT_BOX_MAX_SVH + 1e-9);
    }
  });

  it("the passes are travel and the dwells are inside one radius, on every shape", () => {
    // Blink pulls a rest within about a third of the snapport (ADR-115's
    // measurement, probe-mobile-lockin's law). A dwell shorter than that
    // radius leaves no un-pulled frame on the composed picture; a pass longer
    // than two radii has a middle the reader can rest in — which is travel,
    // and the point.
    for (const { vh } of SHAPES) {
      const radius = vh / 3;
      for (const id of DWELLS) {
        const d = phoneLegPx(id, vh);
        expect(d.end - d.start, `${id} at ${vh}`).toBeLessThanOrEqual(radius);
      }
      for (const id of PASSES) {
        const p = phoneLegPx(id, vh);
        expect(p.end - p.start, `${id} at ${vh}`).toBeGreaterThan(2 * radius);
      }
    }
  });
});

describe("the mirrored literal and the source contracts", () => {
  const css = read("components/landing/home-v2/home-v2.css");
  const stageHeights = [...css.matchAll(/\.home-v2-stage\s*\{[^}]*?height:\s*(\d+)svh/g)].map((m) =>
    Number(m[1])
  );

  it("STAGE_SVH is the stage's height in both declarations and the pre-chunk reservation", () => {
    expect(stageHeights.length).toBeGreaterThanOrEqual(2);
    for (const h of stageHeights) expect(h).toBe(STAGE_SVH);
    const reservation = css.match(
      /\.home-corridor-host:not\(:has\(\.home-v2-stage\)\)\s*\{[^}]*?min-height:\s*(\d+)svh/
    );
    expect(reservation, "the ≤960 height reservation is missing").not.toBeNull();
    expect(Number(reservation![1])).toBe(STAGE_SVH);
  });

  it("the seats' sheet declares the start alignment, no stop, and paints nothing", () => {
    const seat = css.match(/\.home-v2-stage__seat\s*\{([^}]*)\}/g) ?? [];
    expect(seat.length).toBeGreaterThanOrEqual(2);
    const joined = seat.join("\n");
    expect(joined).toMatch(/position:\s*absolute/);
    expect(joined).toMatch(/pointer-events:\s*none/);
    expect(joined).toMatch(/scroll-snap-align:\s*start/);
    expect(joined).not.toMatch(/background|z-index|scroll-snap-stop/);
    // No `always` on the corridor, anywhere: a flick glides.
    expect(css).not.toMatch(/data-corridor-stop/);
    expect(css).not.toMatch(/home-v2-stage__seat[^{]*\{[^}]*scroll-snap-stop/);
  });

  it("the writer remaps only on the phone, and the follower's teleport detector reads RAW progress", () => {
    const writer = stripComments(read("components/landing/home-v2/hooks/useDepthScroll.ts"));
    expect(writer).toMatch(/active && mobile \? getMobilePaintProgress\(progress\)/);
    expect(writer).toMatch(
      /import \{ EPILOGUE_START \} from "@\/lib\/home-v2\/phoneCorridorClock"/
    );
    expect(writer).not.toMatch(/const EPILOGUE_START\s*=/);
    const driver = stripComments(read("components/landing/home-v2/DepthGatewayScene/index.tsx"));
    const call = driver.match(/driveMotionFollower\(\s*\{[\s\S]*?\},\s*delta,\s*(\w+),/);
    expect(call, "driveMotionFollower's third argument").not.toBeNull();
    expect(call![1]).toBe("progress");
    // Why: the steepest leg moves TELEPORT_PROGRESS_DELTA of PAINT in a few
    // hundred px, one stalled frame under a fling; the same delta of RAW
    // progress is over nine hundred px even on the toolbar frame — 55,000
    // px/s at 60 Hz, which no fling produces.
    const follower = read("components/landing/home-v2/DepthGatewayScene/motionFollower.ts");
    const delta = Number(follower.match(/TELEPORT_PROGRESS_DELTA\s*=\s*([\d.]+)/)?.[1]);
    expect(delta).toBeGreaterThan(0);
    expect(delta * phoneCorridorPx(676)).toBeGreaterThanOrEqual(900);
    const steepest = Math.max(
      ...PHONE_CORRIDOR_SCHEDULE.map(
        (l) => ((l.to - l.from) / (l.end - l.start)) * passPeakFactor(l.ease)
      )
    );
    // Recorded, not asserted against: paint px per TELEPORT delta at 676.
    const paintTeleportPx = delta / (steepest / (676 / 100));
    expect(paintTeleportPx).toBeLessThan(1000);
  });

  it("the seats are mounted by the corridor behind the fallback gate and the phone tier", () => {
    const corridor = read("components/landing/home-v2/HomeCorridor.tsx");
    expect(corridor).toMatch(/\{!fallback && <CorridorPhoneSeats \/>\}/);
    const seats = read("components/landing/home-v2/CorridorPhoneSeats.tsx");
    expect(seats).toMatch(/useDeviceTier\(\)/);
    expect(seats).toMatch(/!== "mobile"\) return null/);
    expect(seats).toMatch(/calc\(\$\{[^}]+\} \* \(100% - 100svh\)\)/);
    expect(seats).not.toMatch(/820/);
    expect(seats).not.toMatch(/corridor-stop/);
  });

  it("the rail's click-to-navigate lands on the phone's seats", () => {
    const nav = stripComments(read("lib/rail-manifest/clickToNavigate.ts"));
    expect(nav).toMatch(/phoneSeatFraction\(entry\.corridorPhase\)/);
    expect(nav).toMatch(/layoutViewportHeight\(\)/);
    expect(nav).not.toMatch(/window\.innerHeight/);
  });
});
