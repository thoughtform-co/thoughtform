import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BAKE_H,
  BAKE_SCALE_MOBILE,
  BAKE_W,
  RING_CARD_CTA_BOX,
  bakeSize,
} from "@/components/landing/home-v2/services/hologram/ringCtaBox";
import {
  PROOF_STACK_SPLIT_MEDIA,
  SERVICES_RING_MOBILE_MEDIA,
} from "@/components/landing/home-v2/unifiedServicesInstrument";
import {
  RING_CARD_ASPECT,
  RING_EXIT_START,
  RING_MOBILE_ARRIVE,
  RING_MOBILE_FRONT_MAX_PX,
  RING_MOBILE_LEAVE_START,
  RING_MOBILE_RUNWAY_SVH,
  ringMobileClock,
  ringMobileFrontWidthPx,
  ringMobileGroupScale,
} from "@/lib/services-ring/ringMath";

/**
 * THE RING ON PHONES — the gate, the bake and the clock (ADR-108).
 *
 * Three readers of ONE media string decide whether a phone gets the ring:
 * `CorridorArmillary` (mounts it in the canvas), `ServicesStage` (renders the
 * seat band and the hit layer) and `useCorridorExitScroll` (keeps the
 * corridor's canvas behind `#services` at all). Any one of them reading a
 * different string is a phone with a band and no ring, or a ring with no
 * canvas — neither errors. So the three are pinned to the constant BY SOURCE,
 * the way `services-proof-runway-lockstep` pins a sheet to a number.
 */

const ROOT = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

describe("the phone ring's gate", () => {
  it("is the proof stack's own rung — one query for both phone beats", () => {
    expect(SERVICES_RING_MOBILE_MEDIA).toBe(PROOF_STACK_SPLIT_MEDIA);
  });

  it("is read by all three of its readers, from the constant", () => {
    for (const p of [
      "components/landing/home-v2/DepthGatewayScene/CorridorArmillary.tsx",
      "components/landing/home-v2/services/ServicesStage.tsx",
      "components/landing/home-v2/hooks/useCorridorExitScroll.ts",
    ]) {
      const src = read(p);
      expect(src, `${p} does not read SERVICES_RING_MOBILE_MEDIA`).toContain(
        "SERVICES_RING_MOBILE_MEDIA"
      );
      expect(src, `${p} does not read the flag`).toContain("SERVICES_CARD_RING_MOBILE");
      // Never the literal — a literal here is a fourth copy of the rung.
      expect(src).not.toContain("(max-width: 960px) and (min-height: 681px)");
    }
  });

  it("declares the band's runway in the sheet as the constant, in svh", () => {
    const css = read("components/landing/home-v2/services/services.css");
    const m = /--svc-ring-mobile-runway:\s*([0-9.]+)svh/.exec(css);
    expect(m, "services.css declares no --svc-ring-mobile-runway").not.toBeNull();
    expect(Number.parseFloat(m![1])).toBe(RING_MOBILE_RUNWAY_SVH * 100);
  });
});

describe("the phone bake", () => {
  it("is half the desktop face, on the card's exact aspect", () => {
    const { w, h } = bakeSize(BAKE_SCALE_MOBILE);
    expect(w).toBe(420);
    expect(h).toBe(680);
    expect(w / h).toBeCloseTo(BAKE_W / BAKE_H, 6);
    expect(bakeSize(1)).toEqual({ w: BAKE_W, h: BAKE_H });
  });

  it("leaves the CTA box's fractions untouched — they are ratios of the face", () => {
    // The box is derived from BAKE_W/BAKE_H alone; a scaled bake draws in
    // bake px under ctx.scale, so the DOM shim over it needs no second box.
    expect(RING_CARD_CTA_BOX.x + RING_CARD_CTA_BOX.w).toBeLessThanOrEqual(1);
    expect(RING_CARD_CTA_BOX.y + RING_CARD_CTA_BOX.h).toBeLessThanOrEqual(1);
  });
});

describe("the phone ring's clock", () => {
  it("rests off-stage at the pin and never enters the exit-stack beat", () => {
    const at0 = ringMobileClock(0);
    expect(at0.progress).toBe(0);
    expect(at0.proofRelease).toBe(0);
    expect(at0.hold).toBe(1);
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const c = ringMobileClock(p);
      expect(c.progress).toBeLessThan(RING_EXIT_START);
      expect(c.progress).toBeGreaterThanOrEqual(0);
      expect(c.hold).toBeGreaterThanOrEqual(0);
      expect(c.hold).toBeLessThanOrEqual(1);
    }
  });

  it("flies in over the arrival share, then holds, then leaves", () => {
    expect(ringMobileClock(RING_MOBILE_ARRIVE).proofRelease).toBe(1);
    expect(ringMobileClock(RING_MOBILE_ARRIVE / 2).proofRelease).toBeCloseTo(0.5, 6);
    expect(ringMobileClock(RING_MOBILE_LEAVE_START).hold).toBe(1);
    expect(ringMobileClock(1).hold).toBe(0);
    expect(ringMobileClock((RING_MOBILE_LEAVE_START + 1) / 2).hold).toBeCloseTo(0.5, 6);
  });

  it("is monotonic in progress and continuous across every window", () => {
    let last = -1;
    for (let p = 0; p <= 1; p += 0.005) {
      const { progress } = ringMobileClock(p);
      expect(progress).toBeGreaterThanOrEqual(last);
      last = progress;
    }
    // The four beats are spent by the leave: a reader who scrolls the band
    // sees every card before the ring goes.
    expect(ringMobileClock(RING_MOBILE_LEAVE_START).progress).toBeCloseTo(
      RING_EXIT_START * 0.999,
      6
    );
  });

  it("solves the group's scale so the FRONT CARD, not the mark, lands at the ask", () => {
    // Re-project the solved scale by hand: the card's depth is the mark's
    // minus the orbit radius scaled with the group, and its world height is
    // cardH · s · P · frontMul. Both must agree with the wanted css width.
    const args = {
      frontPx: 257.4,
      viewportH: 844,
      camDepth: 3.2,
      halfFovTan: Math.tan((70 * Math.PI) / 360),
      cardHeight: 1.42,
      parentScale: 0.62,
      frontMul: 1.06 * 1.24,
      radius: 1.3 * 0.7,
    };
    const s = ringMobileGroupScale(args);
    expect(s).toBeGreaterThan(0);
    const cardDepth = args.camDepth - args.radius * s * args.parentScale;
    const worldH = args.cardHeight * s * args.parentScale * args.frontMul;
    const cssH = (worldH / (2 * cardDepth * args.halfFovTan)) * args.viewportH;
    expect(cssH * RING_CARD_ASPECT).toBeCloseTo(args.frontPx, 6);
    // Solved at the mark's depth instead, the card would paint larger — the
    // first cut's 383px against 257: the orbit term is what closes it.
    const naive = (2 * args.camDepth * args.halfFovTan * (args.frontPx / RING_CARD_ASPECT / args.viewportH)) /
      (args.cardHeight * args.parentScale * args.frontMul);
    expect(naive).toBeGreaterThan(s);
    expect(ringMobileGroupScale({ ...args, viewportH: 0 })).toBe(0);
  });

  it("seats the front card by the viewport's width, capped", () => {
    expect(ringMobileFrontWidthPx(390)).toBeCloseTo(390 * 0.66, 6);
    expect(ringMobileFrontWidthPx(360)).toBeCloseTo(360 * 0.66, 6);
    expect(ringMobileFrontWidthPx(430)).toBe(RING_MOBILE_FRONT_MAX_PX);
    expect(ringMobileFrontWidthPx(960)).toBe(RING_MOBILE_FRONT_MAX_PX);
  });
});
