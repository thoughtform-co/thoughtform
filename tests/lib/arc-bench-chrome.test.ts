import { describe, expect, it } from "vitest";

import { BENCH_TABS, benchChromeStrings } from "@/components/arcs/bench/benchChrome";
import { PROPOSAL_COPY_BANS } from "@/lib/arcs/copyLaw";

/**
 * The bench's chrome is lettered by the RENDERER, not the record (ADR-128
 * B2), so the registry's copy-law walk never sees it. This is the walk it
 * gets instead: every string through the proposal bans, no digit, and the
 * three tabs in the module's own order.
 */
describe("the bench's chrome (ADR-128 B2)", () => {
  it("holds the proposal copy law and letters no digit", () => {
    for (const s of benchChromeStrings()) {
      expect(s.trim().length, `blank chrome`).toBeGreaterThan(0);
      for (const [pattern, reason] of PROPOSAL_COPY_BANS) {
        expect(pattern.test(s), `"${s}": ${reason}`).toBe(false);
      }
      expect(/\d/.test(s), `"${s}": a figure on the drawing`).toBe(false);
    }
  });

  it("reads Run, then Skill, then Evals", () => {
    expect(BENCH_TABS.map((t) => t.id)).toEqual(["run", "skill", "evals"]);
  });
});
