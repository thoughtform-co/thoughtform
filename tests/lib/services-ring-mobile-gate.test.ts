import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BAKE_H,
  BAKE_SCALE_MOBILE,
  BAKE_SCALE_MOBILE_BACK,
  BAKE_W,
  DRAWER_CLOSE_BOX,
  RING_CARD_CTA_BOX,
  bakeSize,
} from "@/components/landing/home-v2/services/hologram/ringCtaBox";
import { SERVICE_PLATES } from "@/components/landing/home-v2/services/servicePlateData";
import {
  BACK_BULLET_INDENT,
  BACK_COL_W,
  BACK_CONTENT_LIMIT,
  BACK_MAX_W,
  BACK_RUNGS,
  BACK_TYPE_FLOOR,
  backFaceLayout,
  modelMeasure,
} from "@/lib/services-ring/backFace";
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
  RING_FLIP_BACK_PUBLISH,
  RING_FLIP_RATE,
  RING_MOBILE_OPEN_SIDE_DIM,
  RING_MOBILE_SEAT_FILL,
  activeServiceForProgress,
  exitProgressForRunway,
  ringMobileClock,
  ringMobileFrontWidthPx,
  ringMobileGroupScale,
  ringMobileSeatY,
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
  it("rests off-stage at the pin and never enters the exit-stack beat (deck off)", () => {
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

  it("flies in over the arrival share, then holds, then leaves (deck off)", () => {
    expect(ringMobileClock(RING_MOBILE_ARRIVE).proofRelease).toBe(1);
    expect(ringMobileClock(RING_MOBILE_ARRIVE / 2).proofRelease).toBeCloseTo(0.5, 6);
    expect(ringMobileClock(RING_MOBILE_LEAVE_START).hold).toBe(1);
    expect(ringMobileClock(1).hold).toBe(0);
    expect(ringMobileClock((RING_MOBILE_LEAVE_START + 1) / 2).hold).toBeCloseTo(0.5, 6);
  });

  it("is monotonic in progress and continuous across every window", () => {
    for (const deck of [false, true]) {
      let last = -1;
      for (let p = 0; p <= 1; p += 0.005) {
        const { progress } = ringMobileClock(p, deck);
        expect(progress).toBeGreaterThanOrEqual(last);
        last = progress;
      }
    }
    // The four beats are spent by the leave: a reader who scrolls the band
    // sees every card before the ring goes.
    expect(ringMobileClock(RING_MOBILE_LEAVE_START).progress).toBeCloseTo(
      RING_EXIT_START * 0.999,
      6
    );
  });

  /* ADR-115: with the phone deck the leave IS the exit beat. */
  it("enters the exit beat over the leave with the deck on, and holds", () => {
    // Identical to the deck-off clock through the four beats (bar the cap).
    for (let p = 0; p <= RING_MOBILE_LEAVE_START; p += 0.01) {
      const off = ringMobileClock(p, false);
      const on = ringMobileClock(p, true);
      expect(on.proofRelease).toBe(off.proofRelease);
      expect(on.progress).toBeCloseTo(off.progress / 0.999, 9);
      expect(on.hold).toBe(1);
    }
    // The leave runs progress from the exit's start to 1, linearly, so
    // `exitProgressForRunway` runs 0 → 1 across it — the deck's stack clock.
    expect(ringMobileClock(RING_MOBILE_LEAVE_START, true).progress).toBeCloseTo(RING_EXIT_START, 9);
    expect(ringMobileClock(1, true).progress).toBe(1);
    expect(exitProgressForRunway(ringMobileClock(RING_MOBILE_LEAVE_START, true).progress)).toBe(0);
    expect(exitProgressForRunway(ringMobileClock(1, true).progress)).toBe(1);
    const mid = (RING_MOBILE_LEAVE_START + 1) / 2;
    expect(exitProgressForRunway(ringMobileClock(mid, true).progress)).toBeCloseTo(0.5, 6);
    // The cards never fade with the band: the deck dies on the about clock.
    for (let p = 0; p <= 1.0001; p += 0.01) expect(ringMobileClock(p, true).hold).toBe(1);
  });

  it("keeps the four beats' scroll where ADR-110 left it (3 × 0.84 = 3.3 × 0.73 svh)", () => {
    // The runway grew for the exit alone; the beats' pinned travel did not
    // move, so every tap-to-beat target lands where it did.
    const beats = (RING_MOBILE_RUNWAY_SVH - 1) * RING_MOBILE_LEAVE_START;
    expect(beats).toBeCloseTo(2 * 0.84, 2);
    // And the exit has real scroll: ≥ 60svh (≈ 500px at 844h).
    expect((RING_MOBILE_RUNWAY_SVH - 1) * (1 - RING_MOBILE_LEAVE_START)).toBeGreaterThan(0.6);
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
});

/**
 * THE CARD TURNS OVER (ADR-110).
 *
 * A tap on the phone's front card rotates it π about its own Y; its BACK
 * plane carries the spec, baked lazily per card. The bake's rows are solved
 * by `backFaceLayout` against a GENEROUS advance model here (the real bake
 * measures its own context), so fit is asserted for every record before a
 * texture exists.
 */
describe("the card turns over (ADR-110)", () => {
  it("bakes the back at a crisper ratio than the front, on the same aspect", () => {
    expect(BAKE_SCALE_MOBILE_BACK).toBeGreaterThan(BAKE_SCALE_MOBILE);
    expect(BAKE_SCALE_MOBILE_BACK).toBeLessThanOrEqual(1);
    const { w, h } = bakeSize(BAKE_SCALE_MOBILE_BACK);
    expect(w).toBe(630);
    expect(h).toBe(1020);
    expect(w / h).toBeCloseTo(BAKE_W / BAKE_H, 3);
  });

  it("solves every record's back to fit above the CTA, every line inside its measure", () => {
    for (const plate of SERVICE_PLATES) {
      const L = backFaceLayout(plate, modelMeasure);
      expect(L.contentBottom, `${plate.id} runs into the CTA`).toBeLessThanOrEqual(
        BACK_CONTENT_LIMIT
      );
      expect(L.titleLines.length, `${plate.id} title wraps past two lines`).toBeLessThanOrEqual(2);
      for (const line of L.titleLines) {
        expect(modelMeasure(line, BACK_RUNGS.title, "sans", -0.02)).toBeLessThanOrEqual(BACK_MAX_W);
      }
      for (const bullet of L.bullets) {
        expect(bullet.lines.length).toBeGreaterThan(0);
        for (const line of bullet.lines) {
          expect(modelMeasure(line, BACK_RUNGS.bullet, "sans", 0)).toBeLessThanOrEqual(
            BACK_MAX_W - BACK_BULLET_INDENT
          );
        }
      }
      expect(L.cells).toHaveLength(5);
      for (const cell of L.cells) {
        const measure = (cell.wide ? BACK_MAX_W : BACK_COL_W) - 24;
        for (const line of cell.lines) {
          expect(modelMeasure(line, BACK_RUNGS.dd, "sans", 0)).toBeLessThanOrEqual(measure);
        }
      }
      // The rows descend: chip · title · what · bullets · rule · how · cells.
      const ys = [
        L.chipBaseline,
        ...L.titleBaselines,
        L.whatBaseline,
        ...L.bullets.flatMap((b) => b.baselines),
        L.ruleY,
        L.howBaseline,
        ...L.cells.map((c) => c.dtBaseline),
      ];
      for (let i = 1; i < ys.length; i += 1) expect(ys[i]).toBeGreaterThan(ys[i - 1] - 1e-9);
      expect(L.ctaBaseline).toBeGreaterThan(L.contentBottom);
    }
  });

  it("letters nothing under the floor", () => {
    for (const [key, px] of Object.entries(BACK_RUNGS)) {
      if (/Lh$|Gap$/.test(key)) continue;
      expect(px, `${key} is under the floor`).toBeGreaterThanOrEqual(BACK_TYPE_FLOOR);
    }
  });

  it("publishes the back late in the turn, on a clock that settles under half a second", () => {
    expect(RING_FLIP_BACK_PUBLISH).toBeGreaterThan(0.5);
    expect(RING_FLIP_BACK_PUBLISH).toBeLessThan(1);
    // A first-order damp at RING_FLIP_RATE: level after t seconds is 1 − e^(−rate·t).
    expect(1 - Math.exp(-RING_FLIP_RATE * 0.45)).toBeGreaterThan(0.9);
    expect(1 - Math.exp(-RING_FLIP_RATE * 0.1)).toBeLessThan(0.5);
    expect(RING_MOBILE_OPEN_SIDE_DIM).toBeGreaterThan(0);
    expect(RING_MOBILE_OPEN_SIDE_DIM).toBeLessThan(1);
  });

  it("puts the ✕ and the CTA where the front's own boxes are — one corner, one strip", () => {
    // The back's chit shares the front's OPEN chit corner and scale, and its
    // CTA the card's strip; the hit layer maps both onto the card's own rect.
    expect(DRAWER_CLOSE_BOX.x + DRAWER_CLOSE_BOX.w).toBeLessThanOrEqual(1);
    expect(DRAWER_CLOSE_BOX.y).toBeGreaterThan(0);
    expect(RING_CARD_CTA_BOX.y).toBeGreaterThan(DRAWER_CLOSE_BOX.y + DRAWER_CLOSE_BOX.h);
  });

  it("is passed by the phone mount alone, and the sheet is gone", () => {
    const arm = read("components/landing/home-v2/DepthGatewayScene/CorridorArmillary.tsx");
    const flips = arm.match(/\bflipBack\b/g) ?? [];
    expect(flips, "flipBack must appear exactly once in the armillary").toHaveLength(1);
    const at = arm.indexOf("flipBack");
    expect(at).toBeGreaterThan(arm.indexOf('profile="mobile"'));
    expect(at).toBeLessThan(arm.indexOf("openDrawer={SERVICES_CARD_DRAWER}"));
    for (const p of [
      "components/landing/home-v2/services/ServicesStage.tsx",
      "components/landing/home-v2/services/services.css",
      "lib/services-ring/ringProgressRef.ts",
      "lib/services-ring/ringMath.ts",
    ]) {
      const src = read(p);
      expect(src, `${p} still names the sheet`).not.toMatch(/ServicesSpecSheet|svc-sheet|sheetTop/);
    }
  });
});
