import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SERVICES_PROOF_RUNWAY_VH } from "@/components/landing/home-v2/unifiedServicesInstrument";

/**
 * THE RUNWAY'S TWO HALVES, IN LOCKSTEP (ADR-056 · ADR-087 Phase B).
 *
 * `--svc-proof-runway` in `services.css` and `SERVICES_PROOF_RUNWAY_VH` are
 * ONE number written twice, and they have to be: the CSS owns the runway's
 * HEIGHT and must exist PRE-HYDRATION — `useCorridorExitScroll`'s first
 * `servicesRect` read happens before any module evaluates — while the TS
 * constant owns the SPLIT the scroll hook derives. Neither can be generated
 * from the other at the moment it is needed.
 *
 * ⚠ **THE CSS LITERAL STAYS HAND-WRITTEN. THIS TEST IS THE DRIFT ALARM.**
 * Phase B made the TS side DERIVED — `Σ rows × ROW_VH + (N−1) × SEAM_VH +
 * RELEASE_VH` over `CASES` — which is exactly the change that makes silent
 * divergence possible for the first time: adding a second `CaseDef` moves
 * the constant by itself and leaves `320svh` behind. The symptom would be a
 * dwell that ends before the browse band does, i.e. the last client's rows
 * compressed into whatever runway was left, with nothing failing.
 *
 * So the alarm is mechanical and the fix is a HAND BUMP in the same commit —
 * see the Phase D checklist. `.claude/rules/proof.md` has said "must move
 * together" since ADR-056; this is that sentence with teeth.
 */

const CSS_PATH = join(
  __dirname,
  "..",
  "..",
  "components",
  "landing",
  "home-v2",
  "services",
  "services.css"
);

describe("the proof runway's CSS literal and TS constant", () => {
  it("declare the same number of viewports", () => {
    const css = readFileSync(CSS_PATH, "utf8");
    const match = /--svc-proof-runway:\s*([0-9.]+)svh/.exec(css);
    expect(match, "`--svc-proof-runway` is not declared in svh in services.css").not.toBeNull();

    const cssVh = Number.parseFloat(match![1]);
    // `svh` is a PERCENT of the viewport where the constant is a MULTIPLE.
    const expected = SERVICES_PROOF_RUNWAY_VH * 100;
    expect(
      cssVh,
      `services.css declares ${cssVh}svh but SERVICES_PROOF_RUNWAY_VH derives ` +
        `${SERVICES_PROOF_RUNWAY_VH} (${expected}svh). Bump the CSS literal by hand — ` +
        `it has to exist pre-hydration, so it cannot be generated.`
    ).toBe(expected);
  });

  it("still reserves the ring's own 500svh beyond the dwell", () => {
    // The other half of the same declaration: the split re-derives the
    // ring's progress over what is LEFT, and that remainder is what keeps
    // RING_ARRIVAL_FRAC / RING_EXIT_START / the ADR-047 #about seam
    // byte-identical. A runway written as one total would break all three.
    const css = readFileSync(CSS_PATH, "utf8");
    expect(css).toMatch(/min-height:\s*calc\(var\(--svc-proof-runway\)\s*\+\s*500svh\)/);
  });
});
