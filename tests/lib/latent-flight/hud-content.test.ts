import { describe, expect, it } from "vitest";

import { Announcer, lockSentence } from "@/lib/latent-flight/a11y/announce";
import {
  BOOT_COMMS,
  BOOT_CUES,
  BOOT_DONE_AT,
  PULSAR_BOOT_DELAY_S,
  STRINGS,
  bootCue,
  bootStateAt,
  instantBoot,
} from "@/lib/latent-flight/boot/bootTimeline";
import {
  COURSE_LENGTH,
  WAYPOINTS,
  bearingTo,
  formatBearing,
  formatRange,
  rangeTo,
  sectorLabel,
} from "@/lib/latent-flight/content/waypoints";
import { WAYPOINT_S } from "@/lib/latent-flight/flight/course";
import { MARK_SIZE_PX, clampToFrame, damp, ndcToScreen, quartile } from "@/lib/latent-flight/hud/anchorMath";
import { PULSAR, firstCrossingS } from "@/lib/latent-flight/pulsar";

describe("waypoints", () => {
  it("are seven, in the journey's order, strictly increasing along the course", () => {
    expect(WAYPOINTS.map((w) => w.id)).toEqual([
      "home",
      "thesis",
      "arc",
      "proof",
      "services",
      "about",
      "voidwalker",
    ]);
    for (let i = 1; i < WAYPOINTS.length; i++) expect(WAYPOINT_S[i]).toBeGreaterThan(WAYPOINT_S[i - 1]);
    expect(WAYPOINT_S[0]).toBe(0);
    expect(WAYPOINT_S[WAYPOINTS.length - 1]).toBeCloseTo(1, 9);
  });

  it("zig-zags: every leg turns the other way, and every leg goes deeper", () => {
    for (let i = 1; i < WAYPOINTS.length; i++) {
      expect(WAYPOINTS[i].position[2]).toBeLessThan(WAYPOINTS[i - 1].position[2]);
      if (i >= 2) {
        const dxPrev = WAYPOINTS[i - 1].position[0] - WAYPOINTS[i - 2].position[0];
        const dx = WAYPOINTS[i].position[0] - WAYPOINTS[i - 1].position[0];
        expect(Math.sign(dxPrev) * Math.sign(dx)).toBeLessThan(0);
      }
    }
    expect(-WAYPOINTS[WAYPOINTS.length - 1].position[2]).toBeLessThanOrEqual(COURSE_LENGTH);
  });

  it("prints sectors, ranges and bearings the way the rail does", () => {
    expect(sectorLabel("home")).toBe("01/07");
    expect(sectorLabel("proof")).toBe("04/07");
    expect(formatRange(rangeTo([0, 0, 0], WAYPOINTS[3]))).toBe("0.51");
    expect(formatRange(-0.001)).toBe("0.00");
    expect(formatBearing(bearingTo([0, 0, 0], [0, 0, -10]))).toBe("000");
    expect(formatBearing(bearingTo([0, 0, 0], [10, 0, 0]))).toBe("090");
    expect(formatBearing(bearingTo([0, 0, 0], [-10, 0, 0]))).toBe("270");
    expect(formatBearing(bearingTo([0, 0, 0], [0, 0, 10]))).toBe("180");
  });
});

describe("boot timeline", () => {
  it("has unique, sorted cues and ends on boot-done", () => {
    const ids = BOOT_CUES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (let i = 1; i < BOOT_CUES.length; i++) expect(BOOT_CUES[i].at).toBeGreaterThanOrEqual(BOOT_CUES[i - 1].at);
    expect(BOOT_CUES[BOOT_CUES.length - 1].id).toBe("boot-done");
    expect(bootCue("boot-done")?.at).toBe(BOOT_DONE_AT);
  });

  it("scrubs every cue between 0 and 1 and lands instantBoot at the end", () => {
    const mid = bootStateAt(1.0);
    expect(mid["stars-up"]).toBe(1);
    expect(mid["pulsar-up"]).toBeCloseTo((1.0 - 0.3) / 0.9, 9);
    expect(mid["hud-power"]).toBe(1);
    expect(mid["reticle-arm"]).toBe(0);
    expect(mid["boot-done"]).toBe(0);
    const done = bootStateAt(BOOT_DONE_AT);
    expect(Object.values(done).every((v) => v === 1)).toBe(true);
    expect(instantBoot()).toEqual(done);
  });

  it("lands the first pulse on its cue", () => {
    expect(PULSAR_BOOT_DELAY_S + firstCrossingS(PULSAR.periodS, PULSAR.parkPhase)).toBeCloseTo(
      bootCue("first-pulse")!.at,
      9
    );
  });

  it("speaks in the instrument register", () => {
    const all = [
      ...BOOT_COMMS.map((c) => c.text),
      STRINGS.idle,
      STRINGS.driveOffline,
      STRINGS.released,
      STRINGS.noLock,
      STRINGS.underway,
      STRINGS.hold,
      STRINGS.undocked,
      STRINGS.engaged("VOIDWALKER"),
      STRINGS.approach("VOIDWALKER", "0.12"),
      STRINGS.docked("VOIDWALKER"),
      STRINGS.onStation("SERVICES"),
      STRINGS.holdingIn("SERVICES"),
      STRINGS.astern("THESIS"),
    ];
    for (const s of all) {
      expect(s).not.toMatch(/!/);
      expect(s).not.toMatch(/\byou\b/i);
      expect(s).toBe(s.toUpperCase());
      expect(s.length).toBeLessThanOrEqual(48);
    }
    for (let i = 1; i < BOOT_COMMS.length; i++) expect(BOOT_COMMS[i].at).toBeGreaterThan(BOOT_COMMS[i - 1].at);
  });
});

describe("anchor math", () => {
  it("maps NDC to CSS px with a top-left origin", () => {
    expect(ndcToScreen(0, 0, 1600, 1000)).toEqual([800, 500]);
    expect(ndcToScreen(-1, 1, 1600, 1000)).toEqual([0, 0]);
  });

  it("leaves an on-screen point alone and pins an off-screen one to the edge it left by", () => {
    const frame = { left: 100, top: 100, right: 1500, bottom: 900 };
    expect(clampToFrame(800, 500, false, frame)).toEqual({ x: 800, y: 500, edge: null });
    const r = clampToFrame(2000, 500, false, frame);
    expect(r.edge).toBe("right");
    expect(r.x).toBe(1500);
    const b = clampToFrame(800, 500, true, frame);
    expect(b.edge).not.toBeNull();
  });

  it("sizes marks by range quartile, 12 px down to 6", () => {
    expect(MARK_SIZE_PX[quartile(0.1)]).toBe(12);
    expect(MARK_SIZE_PX[quartile(0.9)]).toBe(6);
  });

  it("damps toward a target without overshoot", () => {
    let v = 0;
    for (let i = 0; i < 100; i++) v = damp(v, 1, 0.18, 1 / 60);
    expect(v).toBeGreaterThan(0.99);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe("announcer", () => {
  it("lets one sentence through per gap and keeps only the latest", () => {
    const a = new Announcer(2);
    a.say(lockSentence("Proof", "0.51"));
    expect(a.tick(0)).toBe("Locked: Proof. Range 0.51.");
    a.say("A");
    a.say("B");
    expect(a.tick(1)).toBeNull();
    expect(a.tick(2.1)).toBe("B");
    expect(a.tick(5)).toBeNull();
  });
});
