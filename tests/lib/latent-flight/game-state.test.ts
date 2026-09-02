import { describe, expect, it } from "vitest";

import {
  LF_STATES,
  STATE_WORD,
  TRANSITIONS,
  transition,
  type LfEvent,
  type LfState,
} from "@/lib/latent-flight/engine/gameState";
import { advanceClock, createGameClock, MAX_CLOCK_STEP_S } from "@/lib/latent-flight/gameClock";
import { DEFAULT_FLAGS, parseFlags } from "@/lib/latent-flight/flags";
import {
  getLfState,
  resetLfStore,
  setLfState,
  subscribeLfState,
} from "@/lib/latent-flight/engine/store";

describe("latent-flight state machine", () => {
  it("boots into VISTA and flies out of it", () => {
    expect(transition("BOOT", "boot-done")).toBe("VISTA");
    expect(transition("BOOT", "skip")).toBe("VISTA");
    expect(transition("VISTA", "engage")).toBe("FLIGHT");
    expect(transition("FLIGHT", "approach-enter")).toBe("APPROACH");
    expect(transition("APPROACH", "dock")).toBe("DOCK");
    expect(transition("DOCK", "undock")).toBe("APPROACH");
    expect(transition("APPROACH", "approach-leave")).toBe("FLIGHT");
  });

  it("treats an illegal event as a no-op, never a throw", () => {
    const events: LfEvent[] = [
      "boot-done",
      "skip",
      "engage",
      "release",
      "approach-enter",
      "approach-leave",
      "dock",
      "undock",
    ];
    for (const s of LF_STATES) {
      for (const e of events) {
        const next = transition(s, e);
        expect(LF_STATES).toContain(next);
        if (!(e in TRANSITIONS[s])) expect(next).toBe(s);
      }
    }
  });

  it("cannot dock from VISTA or FLIGHT — only from APPROACH", () => {
    const docksFrom = LF_STATES.filter((s: LfState) => TRANSITIONS[s].dock === "DOCK");
    expect(docksFrom).toEqual(["APPROACH"]);
  });

  it("prints one word per state", () => {
    for (const s of LF_STATES) expect(STATE_WORD[s].length).toBeGreaterThan(0);
    expect(new Set(Object.values(STATE_WORD)).size).toBe(LF_STATES.length);
  });
});

describe("latent-flight game clock", () => {
  it("advances by a clamped delta and counts frames", () => {
    const c = createGameClock();
    expect(advanceClock(c, 1 / 60)).toBeCloseTo(1 / 60, 9);
    expect(advanceClock(c, 5)).toBe(MAX_CLOCK_STEP_S);
    expect(c.frame).toBe(2);
    expect(c.t).toBeCloseTo(1 / 60 + MAX_CLOCK_STEP_S, 9);
  });

  it("parks the world under reduced motion but keeps counting frames", () => {
    const c = createGameClock(0);
    advanceClock(c, 0.05);
    expect(c.t).toBe(0);
    expect(c.frame).toBe(1);
  });
});

describe("latent-flight flags", () => {
  it("defaults to a booting, moving, uncaptured page", () => {
    expect(parseFlags("")).toEqual(DEFAULT_FLAGS);
    expect(parseFlags("?")).toEqual(DEFAULT_FLAGS);
  });

  it("parses every switch and rejects a hold id it cannot name", () => {
    expect(parseFlags("?boot=0&hold=hud-power&capture=1&rm=1")).toEqual({
      boot: false,
      hold: "hud-power",
      capture: true,
      reducedMotion: true,
    });
    expect(parseFlags("?hold=<script>").hold).toBeNull();
  });
});

describe("latent-flight store", () => {
  it("notifies only on a real change and resets to the seed", () => {
    resetLfStore();
    let n = 0;
    const off = subscribeLfState(() => n++);
    setLfState({ fsm: "BOOT" });
    expect(n).toBe(0);
    setLfState({ fsm: "VISTA", ready: true });
    expect(n).toBe(1);
    expect(getLfState().fsm).toBe("VISTA");
    off();
    setLfState({ fsm: "FLIGHT" });
    expect(n).toBe(1);
    resetLfStore();
    expect(getLfState().fsm).toBe("BOOT");
    expect(getLfState().ready).toBe(false);
  });
});
