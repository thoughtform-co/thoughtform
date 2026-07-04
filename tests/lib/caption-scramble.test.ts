import { describe, expect, it } from "vitest";

import {
  SCRAMBLE_GLYPHS,
  SCRAMBLE_LEAD_S,
  SCRAMBLE_SHUFFLE_S,
  SCRAMBLE_STAGGER_S,
  advanceScrambles,
  queueScramble,
  scrambleDuration,
  scrambleFrame,
  type ScrambleJob,
  type ScrambleTarget,
} from "@/lib/home-v2/captionScramble";

/**
 * `captionScramble` is the scramble-decode kernel for the corridor
 * caption card's chrome (meta row + coord tag). These tests pin its
 * visible contract: outgoing text holds before the shuffle window,
 * characters resolve left-to-right into the incoming text, whitespace
 * never scrambles, longer readouts contract, and the job queue
 * dedupes / retargets / completes cleanly.
 */

const mkEl = (text: string): ScrambleTarget => ({ textContent: text });

describe("queueScramble", () => {
  it("queues a job from the element's current display text", () => {
    const jobs: ScrambleJob[] = [];
    const el = mkEl("NAV-01");
    queueScramble(jobs, el, "ENC-02", 10);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ from: "NAV-01", to: "ENC-02", startSec: 10 });
  });

  it("is a no-op when the element already shows the target text", () => {
    const jobs: ScrambleJob[] = [];
    const el = mkEl("TRACKING");
    queueScramble(jobs, el, "TRACKING", 0);
    expect(jobs).toHaveLength(0);
  });

  it("retargets an in-flight job from the CURRENT display text", () => {
    const jobs: ScrambleJob[] = [];
    const el = mkEl("NAV-01");
    queueScramble(jobs, el, "ENC-02", 0);
    // mid-scramble the element shows noise; a new station arrives
    el.textContent = "N#V-0Q";
    queueScramble(jobs, el, "BLD-03", 5);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ from: "N#V-0Q", to: "BLD-03", startSec: 5 });
  });

  it("clears a stale job when retargeted back to the shown text", () => {
    const jobs: ScrambleJob[] = [];
    const el = mkEl("NAV-01");
    queueScramble(jobs, el, "ENC-02", 0);
    queueScramble(jobs, el, "NAV-01", 1);
    expect(jobs).toHaveLength(0);
  });
});

describe("scrambleFrame", () => {
  const job = { from: "01 · NAVIGATE", to: "02 · ENCODE" };

  it("shows the outgoing text before any shuffle window opens", () => {
    // t well before the first char's shuffle window (resolveAt - shuffle)
    const frame = scrambleFrame(job, -1, () => 0);
    expect(frame).toBe("01 · NAVIGATE");
  });

  it("resolves characters left-to-right into the incoming text", () => {
    // after char 0 resolves but before char 5 does
    const t = SCRAMBLE_LEAD_S + 2.5 * SCRAMBLE_STAGGER_S;
    const frame = scrambleFrame(job, t, () => 0);
    expect(frame).not.toBeNull();
    expect(frame!.startsWith("02 ")).toBe(true);
  });

  it("never scrambles incoming whitespace", () => {
    // sample many frames across the shuffle; position 2 is " " in both
    for (let step = 0; step < 20; step++) {
      const t = (step / 20) * scrambleDuration(job.from, job.to);
      const frame = scrambleFrame(job, t, Math.random);
      if (frame === null) continue;
      expect(frame[2]).toBe(" ");
    }
  });

  it("draws shuffle glyphs from the HUD pool", () => {
    // inside char 0's shuffle window, just before it resolves
    const t = SCRAMBLE_LEAD_S - 0.01;
    expect(t).toBeGreaterThan(SCRAMBLE_LEAD_S - SCRAMBLE_SHUFFLE_S);
    const frame = scrambleFrame(job, t, () => 0.5);
    expect(frame).not.toBeNull();
    expect(SCRAMBLE_GLYPHS).toContain(frame![0]);
  });

  it("contracts longer outgoing text to the incoming length", () => {
    const shrink = { from: "01 · NAVIGATE", to: "X" };
    const done = scrambleFrame(shrink, scrambleDuration(shrink.from, shrink.to) + 0.01);
    expect(done).toBeNull(); // complete — caller writes `to`
  });

  it("returns null exactly when every char has resolved", () => {
    const dur = scrambleDuration(job.from, job.to);
    expect(scrambleFrame(job, dur - 0.001, () => 0)).not.toBeNull();
    expect(scrambleFrame(job, dur + 0.001, () => 0)).toBeNull();
  });
});

describe("advanceScrambles", () => {
  it("writes frames to the element and removes completed jobs", () => {
    const jobs: ScrambleJob[] = [];
    const el = mkEl("NAV-01");
    queueScramble(jobs, el, "ENC-02", 100);
    // mid-flight: element shows a frame, job stays queued
    advanceScrambles(jobs, 100 + SCRAMBLE_LEAD_S);
    expect(jobs).toHaveLength(1);
    expect(el.textContent).not.toBe("NAV-01");
    // past the end: element shows the target exactly, job removed
    advanceScrambles(jobs, 100 + scrambleDuration("NAV-01", "ENC-02") + 0.01);
    expect(el.textContent).toBe("ENC-02");
    expect(jobs).toHaveLength(0);
  });

  it("drives independent jobs on one clock", () => {
    const jobs: ScrambleJob[] = [];
    const a = mkEl("TRACKING");
    const b = mkEl("REF 112.4");
    queueScramble(jobs, a, "ENCODING", 0);
    queueScramble(jobs, b, "REF 122.4", 0);
    advanceScrambles(jobs, 10); // far past both durations
    expect(a.textContent).toBe("ENCODING");
    expect(b.textContent).toBe("REF 122.4");
    expect(jobs).toHaveLength(0);
  });
});
