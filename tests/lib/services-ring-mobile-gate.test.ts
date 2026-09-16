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
import { ringMobileBandFraction } from "@/lib/services-ring/beatScrollTarget";
import {
  RING_CARD_ASPECT,
  RING_EXIT_START,
  RING_MOBILE_ARRIVE,
  RING_MOBILE_FRONT_MAX_PX,
  RING_MOBILE_LEAVE_START,
  RING_MOBILE_RUNWAY_SVH,
  RING_MOBILE_SEAT_FILL,
  RING_MOBILE_SHEET_CLEAR,
  RING_MOBILE_SHEET_ROOM,
  activeServiceForProgress,
  ringMobileClock,
  ringMobileFrontWidthPx,
  ringMobileGroupScale,
  ringMobileSeatY,
  ringMobileSheetFit,
} from "@/lib/services-ring/ringMath";
import type { ServicesRingProgress } from "@/lib/services-ring/ringProgressRef";

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
    const naive =
      (2 * args.camDepth * args.halfFovTan * (args.frontPx / RING_CARD_ASPECT / args.viewportH)) /
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

/**
 * THE BAND IS THE COMPOSITION, AND THE SHEET (ADR-109).
 *
 * The band publishes a SEAT (the free height between the masthead's title
 * and its paragraph); the ring fits its front card to it and centres on it;
 * a tap raises a SHEET and the card FITS the room the sheet leaves above.
 * Every number is solved in `ringMath` and re-projected here by hand.
 */
describe("the seat (ADR-109)", () => {
  it("is optional on the progress record — desktop and every lab never set it", () => {
    const rest: ServicesRingProgress = { progress: 0, proofRelease: 1, proofPresence: 0 };
    expect(rest.seat).toBeUndefined();
    expect(rest.sheetTop).toBeUndefined();
    // Absent, the width law alone seats the card — byte-identical to ADR-108.
    expect(ringMobileFrontWidthPx(390, undefined)).toBe(ringMobileFrontWidthPx(390));
    expect(ringMobileFrontWidthPx(390, 0)).toBe(ringMobileFrontWidthPx(390));
  });

  it("bounds the front card's HEIGHT to the seat's fill share, aspect kept", () => {
    // 390×844: the seat is ~538 tall → 0.82·538 = 441 of height → 272 of
    // width, so the card stays width-bound at 257.4 (ADR-108's number).
    expect(ringMobileFrontWidthPx(390, 538)).toBeCloseTo(390 * 0.66, 6);
    // A 700h phone: ~393 of seat → height-bound at 0.82·393·(420/680).
    const short = ringMobileFrontWidthPx(390, 393);
    expect(short).toBeCloseTo(393 * RING_MOBILE_SEAT_FILL * RING_CARD_ASPECT, 6);
    expect(short / RING_CARD_ASPECT).toBeLessThanOrEqual(393 * RING_MOBILE_SEAT_FILL + 1e-9);
    expect(short).toBeLessThan(ringMobileFrontWidthPx(390));
  });

  it("solves the ring's y so the FRONT CARD's centre lands on the seat's", () => {
    const args = {
      seatCy: 390.4,
      viewportH: 844,
      parentCamY: -0.31,
      camDepth: 3.2,
      halfFovTan: Math.tan((70 * Math.PI) / 360),
      parentScale: 0.62,
      ringScale: 0.53,
      yOffset: -0.04,
      radius: 1.3 * 0.7,
    };
    const y = ringMobileSeatY(args);
    // Re-project: the card's camera-space y is the rig's plus the ring's y
    // and the y offset, both scaled by the rig, at the card's own depth.
    const depth = args.camDepth - args.radius * args.ringScale * args.parentScale;
    const camY = args.parentCamY + (y + args.yOffset * args.ringScale) * args.parentScale;
    const screenY = ((1 - camY / (depth * args.halfFovTan)) / 2) * args.viewportH;
    expect(screenY).toBeCloseTo(args.seatCy, 6);
    // A seat at the frame's centre with a centred rig is the ring's rest.
    expect(ringMobileSeatY({ ...args, seatCy: 422, parentCamY: 0, yOffset: 0 })).toBeCloseTo(0, 9);
    expect(ringMobileSeatY({ ...args, viewportH: 0 })).toBe(0);
  });

  it("fits the front card to the room above the sheet — shrinking only if it must", () => {
    const seat = { cy: 390.4, h: 538.3 };
    const cardH = 257.4 / RING_CARD_ASPECT; // 416.8
    // No sheet, or a shut one: identity.
    expect(
      ringMobileSheetFit({
        seatCy: seat.cy,
        seatH: seat.h,
        cardHpx: cardH,
        sheetTop: undefined,
        sheetT: 1,
      })
    ).toEqual({ cy: seat.cy, k: 1 });
    expect(
      ringMobileSheetFit({
        seatCy: seat.cy,
        seatH: seat.h,
        cardHpx: cardH,
        sheetTop: 347,
        sheetT: 0,
      })
    ).toEqual({ cy: seat.cy, k: 1 });
    // 390×844 with the sheet at the room law's ceiling: the room above is
    // 347 − 12 − 121.25 = 213.75 of height for a 417 card → it shrinks to
    // the room and centres in it, and its bottom clears the sheet.
    const seatTop = seat.cy - seat.h / 2;
    const sheetTop = seatTop + RING_MOBILE_SHEET_ROOM * seat.h;
    const fit = ringMobileSheetFit({
      seatCy: seat.cy,
      seatH: seat.h,
      cardHpx: cardH,
      sheetTop,
      sheetT: 1,
    });
    const room = sheetTop - RING_MOBILE_SHEET_CLEAR - seatTop;
    expect(fit.k).toBeCloseTo(room / cardH, 9);
    expect(fit.k).toBeLessThan(1);
    expect(fit.cy + (cardH * fit.k) / 2).toBeLessThanOrEqual(
      sheetTop - RING_MOBILE_SHEET_CLEAR + 1e-9
    );
    expect(fit.cy - (cardH * fit.k) / 2).toBeCloseTo(seatTop, 9);
    // A card that fits keeps its size and lifts just clear.
    const small = ringMobileSheetFit({
      seatCy: seat.cy,
      seatH: seat.h,
      cardHpx: 100,
      sheetTop: 600,
      sheetT: 1,
    });
    expect(small.k).toBe(1);
    expect(small.cy).toBe(seat.cy); // already clear: 390 + 50 < 588
    const lift = ringMobileSheetFit({
      seatCy: seat.cy,
      seatH: seat.h,
      cardHpx: 200,
      sheetTop: 400,
      sheetT: 1,
    });
    expect(lift.k).toBe(1);
    expect(lift.cy).toBeCloseTo(400 - RING_MOBILE_SHEET_CLEAR - 100, 9);
    // Half way on the sheet's clock: half way on both terms.
    const mid = ringMobileSheetFit({
      seatCy: seat.cy,
      seatH: seat.h,
      cardHpx: cardH,
      sheetTop,
      sheetT: 0.5,
    });
    expect(mid.k).toBeCloseTo((1 + fit.k) / 2, 9);
    expect(mid.cy).toBeCloseTo((seat.cy + fit.cy) / 2, 9);
  });

  it("rolls the band to a card's beat — the inverse of the phone clock", () => {
    for (let i = 0; i < 4; i += 1) {
      const frac = ringMobileBandFraction(i);
      expect(frac).toBeGreaterThanOrEqual(RING_MOBILE_ARRIVE);
      expect(frac).toBeLessThanOrEqual(RING_MOBILE_LEAVE_START);
      expect(activeServiceForProgress(ringMobileClock(frac).progress)).toBe(i);
    }
    let last = -1;
    for (let i = 0; i < 4; i += 1) {
      expect(ringMobileBandFraction(i)).toBeGreaterThan(last);
      last = ringMobileBandFraction(i);
    }
  });

  it("keeps the sheet on the band, glass without a blur, and the room law in one place", () => {
    const css = read("components/landing/home-v2/services/services.css");
    const at = css.indexOf("THE SHEET (ADR-109)");
    expect(at, "services.css has no sheet block").toBeGreaterThan(0);
    // The sheet's rules alone, comments stripped (a comment naming the ban
    // is not a declaration of it).
    const block = css
      .slice(
        css.indexOf(".svc-sheet-scrim {", at),
        css.indexOf(".svc-sheet__cta:focus-visible", at)
      )
      .replace(/\/\*[\s\S]*?\*\//g, "");
    const sheetRule = /\.svc-sheet \{([^}]*)\}/.exec(block);
    expect(sheetRule, "no .svc-sheet rule").not.toBeNull();
    // Absolute in the sticky band, never fixed (`mobile-sections.md` §7).
    expect(sheetRule![1]).toMatch(/position:\s*absolute/);
    expect(block).not.toMatch(/position:\s*fixed/);
    // No backdrop-filter over a live canvas (ADR-107's phone ruling).
    expect(block).not.toMatch(/backdrop-filter/);
    // Pure motion: the sheet's transitions move it, nothing fades it.
    expect(sheetRule![1]).not.toMatch(/opacity/);
    // The sheet bounds its height by the SAME constant the ring fits to.
    const sheet = read("components/landing/home-v2/services/ServicesSpecSheet.tsx");
    expect(sheet).toContain("RING_MOBILE_SHEET_ROOM");
    expect(RING_MOBILE_SHEET_ROOM).toBeGreaterThan(0.3);
    expect(RING_MOBILE_SHEET_ROOM).toBeLessThan(0.6);
  });
});
