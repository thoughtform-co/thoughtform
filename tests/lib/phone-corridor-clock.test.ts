import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BEAT_PARK_CENTRES, DOLLY_HOLD_END, cameraZDollyT } from "@/lib/home-v2/corridorMap";
import {
  CORRIDOR_SVH,
  EPILOGUE_START,
  MOBILE_THESIS_EXIT_START,
  MOBILE_THOUGHTFORM_END,
  PHONE_CORRIDOR_LEGS,
  PHONE_CORRIDOR_SCHEDULE,
  SCRUB_SVH,
  SEAT_BOX_MAX_SVH,
  STAGE_CELL_SVH,
  STAGE_SVH,
  THESIS_EXIT_SVH,
  phoneCorridorPx,
  phoneCorridorSeats,
  phoneLegPx,
  phonePaintProgress,
  phoneSeatFraction,
} from "@/lib/home-v2/phoneCorridorClock";

/**
 * The phone corridor's clock and its seats (ADR-125).
 *
 * The desktop's corridor is untouched by construction: `useDepthScroll` calls
 * the remap only behind `active && mobile`, and the parks the plateaus hold
 * are `corridorMap`'s own values by reference. What this file pins is the
 * arithmetic the device read stands on — a monotonic, continuous clock with a
 * plateau at every park, the seats on those plateaus and nowhere else, the one
 * mirrored literal (the stage's 820svh) equal in the three places it lives,
 * and the two source contracts that make the remap safe (the follower's
 * teleport detector reads RAW progress; the writer remaps only on the phone).
 */

const ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const SHAPES = [
  { name: "iphone-14", vh: 844 },
  { name: "iphone-14 (bars)", vh: 745 },
  { name: "iphone-14-pro-max", vh: 932 },
] as const;

describe("the schedule", () => {
  it("is the owner's numbers, and tiles the corridor with a real tail", () => {
    expect(PHONE_CORRIDOR_LEGS).toEqual({
      thesisHold: 40,
      thesisRise: 60,
      passNavigate: 60,
      hold: 80,
      passEncode: 50,
      passBuild: 50,
    });
    expect(SCRUB_SVH).toBe(STAGE_SVH - STAGE_CELL_SVH);
    expect(CORRIDOR_SVH).toBeCloseTo(SCRUB_SVH * EPILOGUE_START, 9);
    // Cumulative, gapless, ending on the corridor's own end.
    let at = 0;
    for (const leg of PHONE_CORRIDOR_SCHEDULE) {
      expect(leg.start, leg.id).toBeCloseTo(at, 9);
      expect(leg.end, leg.id).toBeGreaterThan(leg.start);
      at = leg.end;
    }
    expect(at).toBeCloseTo(CORRIDOR_SVH, 9);
    // The tail exists (the epilogue's camera starts from paint 1) and is at
    // least a quarter screen.
    const tail = PHONE_CORRIDOR_SCHEDULE[PHONE_CORRIDOR_SCHEDULE.length - 1];
    expect(tail.id).toBe("tail");
    expect(tail.to).toBe(1);
    expect(tail.end - tail.start).toBeGreaterThanOrEqual(25);
  });

  it("holds every park at corridorMap's own value, by reference", () => {
    const hold = (id: string) => PHONE_CORRIDOR_SCHEDULE.find((l) => l.id === id)!;
    expect(hold("thesis-hold").from).toBe(0);
    expect(hold("thesis-hold").to).toBe(0);
    expect(hold("thesis-rise").to).toBe(DOLLY_HOLD_END);
    expect(hold("navigate").from).toBe(BEAT_PARK_CENTRES.navigate);
    expect(hold("navigate").to).toBe(BEAT_PARK_CENTRES.navigate);
    expect(hold("encode").from).toBe(BEAT_PARK_CENTRES.diagnostic);
    expect(hold("encode").to).toBe(BEAT_PARK_CENTRES.diagnostic);
    expect(hold("build").from).toBe(BEAT_PARK_CENTRES.intelligence);
    expect(hold("build").to).toBe(BEAT_PARK_CENTRES.intelligence);
    // The camera is held with it: the dolly at the park is the dolly across
    // the whole plateau.
    for (const id of ["navigate", "encode", "build"] as const) {
      const leg = hold(id);
      const a = cameraZDollyT(phonePaintProgress(leg.start / CORRIDOR_SVH));
      const b = cameraZDollyT(phonePaintProgress((leg.start + leg.end) / 2 / CORRIDOR_SVH));
      const c = cameraZDollyT(phonePaintProgress(leg.end / CORRIDOR_SVH));
      expect(a).toBe(b);
      expect(b).toBe(c);
    }
  });

  it("derives the thesis dwell's end and its exit fade (no 0.30 literal survives)", () => {
    const rise = PHONE_CORRIDOR_SCHEDULE.find((l) => l.id === "thesis-rise")!;
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

describe("phonePaintProgress", () => {
  it("is monotonic, continuous, and pinned at both ends", () => {
    expect(phonePaintProgress(0)).toBe(0);
    expect(phonePaintProgress(1)).toBe(1);
    expect(phonePaintProgress(-1)).toBe(0);
    expect(phonePaintProgress(2)).toBe(1);
    const N = 10_000;
    let prev = phonePaintProgress(0);
    // The steepest leg is the shortest pass at its smoothstep peak (1.5× its
    // linear slope); one sample step may never exceed that by more than 10 %.
    const steepest = Math.max(
      ...PHONE_CORRIDOR_SCHEDULE.map(
        (l) => ((l.to - l.from) / (l.end - l.start)) * (l.ease === "smooth" ? 1.5 : 1)
      )
    );
    const maxStep = (steepest * CORRIDOR_SVH * 1.1) / N;
    for (let i = 1; i <= N; i++) {
      const v = phonePaintProgress(i / N);
      expect(v).toBeGreaterThanOrEqual(prev);
      expect(v - prev).toBeLessThanOrEqual(maxStep);
      prev = v;
    }
  });

  it("holds the plateaus and eases into and out of them", () => {
    for (const id of ["navigate", "encode", "build"] as const) {
      const leg = PHONE_CORRIDOR_SCHEDULE.find((l) => l.id === id)!;
      const at = (svh: number) => phonePaintProgress(svh / CORRIDOR_SVH);
      expect(at(leg.start)).toBe(leg.from);
      expect(at(leg.end)).toBe(leg.from);
      expect(at(leg.start + 1)).toBe(leg.from);
      expect(at(leg.end - 1)).toBe(leg.from);
      // Zero velocity at the edges: the first svh into the pass moves the
      // paint by less than a thousandth of the pass's total.
      const passAfter = PHONE_CORRIDOR_SCHEDULE.find((l) => l.start === leg.end);
      if (passAfter && passAfter.ease === "smooth") {
        const span = passAfter.to - passAfter.from;
        expect(at(leg.end + 1) - leg.from).toBeLessThan(span * 0.002);
      }
    }
  });
});

describe("the pixel budget", () => {
  it.each(SHAPES)("$name — Navigate composed under two screens from the pin", ({ vh }) => {
    const nav = phoneLegPx("navigate", vh);
    const enc = phoneLegPx("encode", vh);
    const bld = phoneLegPx("build", vh);
    expect(nav.start / vh).toBeLessThan(2);
    expect(nav.end - nav.start).toBeCloseTo(0.8 * vh, 6);
    expect(enc.end - enc.start).toBeCloseTo(0.8 * vh, 6);
    expect(bld.end - bld.start).toBeCloseTo(0.8 * vh, 6);
    expect(phoneCorridorPx(vh)).toBeCloseTo((CORRIDOR_SVH / 100) * vh, 6);
  });

  it("at 390×844 matches the record (±1px)", () => {
    const vh = 844;
    const near = (a: number, b: number) => Math.abs(a - b) <= 1;
    expect(near(phoneLegPx("navigate", vh).start, 1350)).toBe(true);
    expect(near(phoneLegPx("navigate", vh).end, 2026)).toBe(true);
    expect(near(phoneLegPx("encode", vh).start, 2448)).toBe(true);
    expect(near(phoneLegPx("encode", vh).end, 3123)).toBe(true);
    expect(near(phoneLegPx("build", vh).start, 3545)).toBe(true);
    expect(near(phoneLegPx("build", vh).end, 4220)).toBe(true);
    expect(near(phoneCorridorPx(vh), 4595)).toBe(true);
  });
});

describe("the seats", () => {
  it("sit on the plateaus and nowhere else, and tile the corridor", () => {
    const seats = phoneCorridorSeats();
    expect(seats.map((s) => s.id)).toEqual([
      "thesis",
      "thesis-out",
      "navigate",
      "navigate-out",
      "encode",
      "encode-out",
      "build",
      "build-out",
    ]);
    expect(seats.filter((s) => s.stop === "always").map((s) => s.id)).toEqual([
      "thesis",
      "navigate",
      "encode",
      "build",
    ]);
    let at = 0;
    for (const s of seats) {
      expect(s.top).toBeCloseTo(at, 12);
      expect(s.height).toBeGreaterThan(0);
      expect(s.height).toBeLessThanOrEqual(s.span + 1e-12);
      at = s.top + s.span;
    }
    expect(at).toBeCloseTo(EPILOGUE_START, 12);
    // A plateau seat's box IS its hold, and its top IS the phase's seat.
    for (const phase of ["thesis", "navigate", "encode", "build"] as const) {
      const legId = phase === "thesis" ? "thesis-hold" : phase;
      const leg = PHONE_CORRIDOR_SCHEDULE.find((l) => l.id === legId)!;
      const seat = seats.find((s) => s.id === phase)!;
      expect(seat.top).toBeCloseTo(leg.start / SCRUB_SVH, 12);
      expect(seat.span).toBeCloseTo((leg.end - leg.start) / SCRUB_SVH, 12);
      expect(seat.height).toBeCloseTo(
        Math.min(leg.end - leg.start, SEAT_BOX_MAX_SVH) / SCRUB_SVH,
        12
      );
      expect(phoneSeatFraction(phase)).toBe(seat.top);
    }
    // ⚠ No seat's BOX may be as tall as the snapport. A snap area taller than
    // the scrollport is a covering area: every position where it covers the
    // screen is a legitimate rest, and a rest just past it is pulled back to
    // the area's END — the first cut's 120svh `thesis-out` box pulled seven
    // consecutive rests back onto a mid-flight frame at its foot. So every
    // box is capped at half a screen while the SPAN it names stays whole,
    // and the one stretch that IS taller than a screen is the entry flight.
    expect(SEAT_BOX_MAX_SVH).toBeLessThan(STAGE_CELL_SVH);
    for (const s of seats) {
      expect(s.height * SCRUB_SVH, s.id).toBeLessThanOrEqual(SEAT_BOX_MAX_SVH + 1e-9);
    }
    const entry = seats.find((s) => s.id === "thesis-out")!;
    expect(entry.span * SCRUB_SVH).toBeGreaterThan(STAGE_CELL_SVH);
    expect(entry.height * SCRUB_SVH).toBeCloseTo(SEAT_BOX_MAX_SVH, 9);
  });

  it("the two Arc passes fit inside two Blink radii on every shape", () => {
    // Blink pulls a rest within about a third of the snapport (ADR-115's
    // measurement, probe-mobile-lockin's law). A pass between a plateau's
    // last frame and the next plateau's first frame that is shorter than two
    // radii leaves no un-pulled transit frame.
    for (const { vh } of SHAPES) {
      const radius = vh / 3;
      for (const id of ["pass-encode", "pass-build"] as const) {
        const p = phoneLegPx(id, vh);
        expect(p.end - p.start, `${id} at ${vh}`).toBeLessThanOrEqual(2 * radius);
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

  it("the seats' sheet declares the start alignment and the always stop, and paints nothing", () => {
    const seat = css.match(/\.home-v2-stage__seat\s*\{([^}]*)\}/g) ?? [];
    expect(seat.length).toBeGreaterThanOrEqual(2);
    const joined = seat.join("\n");
    expect(joined).toMatch(/position:\s*absolute/);
    expect(joined).toMatch(/pointer-events:\s*none/);
    expect(joined).toMatch(/scroll-snap-align:\s*start/);
    expect(joined).not.toMatch(/background|z-index|scroll-snap-stop/);
    expect(css).toMatch(
      /\.home-v2-stage__seat\[data-corridor-stop="always"\]\s*\{[^}]*scroll-snap-stop:\s*always/
    );
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
    // progress is more than a thousand px on the shortest phone.
    const follower = read("components/landing/home-v2/DepthGatewayScene/motionFollower.ts");
    const delta = Number(follower.match(/TELEPORT_PROGRESS_DELTA\s*=\s*([\d.]+)/)?.[1]);
    expect(delta).toBeGreaterThan(0);
    expect(delta * phoneCorridorPx(745)).toBeGreaterThanOrEqual(1000);
    const steepest = Math.max(
      ...PHONE_CORRIDOR_SCHEDULE.map(
        (l) => ((l.to - l.from) / (l.end - l.start)) * (l.ease === "smooth" ? 1.5 : 1)
      )
    );
    // Recorded, not asserted against: paint px per TELEPORT delta at 745.
    const paintTeleportPx = delta / (steepest / (745 / 100));
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
  });

  it("the rail's click-to-navigate lands on the phone's seats", () => {
    const nav = stripComments(read("lib/rail-manifest/clickToNavigate.ts"));
    expect(nav).toMatch(/phoneSeatFraction\(entry\.corridorPhase\)/);
    expect(nav).toMatch(/layoutViewportHeight\(\)/);
    expect(nav).not.toMatch(/window\.innerHeight/);
  });
});
