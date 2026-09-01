import { beforeEach, describe, expect, it } from "vitest";

import {
  ABOUT_HANDOFF_FLIGHT_WINDOW,
  ABOUT_HANDOFF_RESOLVE_WINDOW,
  ABOUT_PORTRAIT_ASPECT,
  VOIDWALKER_HOLOGRAM_MORPH_WINDOW,
  aboutHandoffFlightT,
  aboutHandoffResolveT,
  aboutVoidwalkerHandoffRef,
  handoffRendererOpacities,
  handoffTitleOpacities,
  interpolateViewportRect,
  invalidateAboutVoidwalkerHandoff,
  isAboutVoidwalkerHandoffReady,
  resolveBottomAlignedPortraitSeat,
  resolveViewportRectTranslation,
  voidwalkerHologramMorphT,
  writeAboutVoidwalkerHandoffMorph,
  writeAboutVoidwalkerHandoffTargets,
  type ViewportRect,
} from "@/lib/voidwalker/aboutVoidwalkerHandoff";

const SOURCE: ViewportRect = { cx: 1032, cy: 400, w: 270, h: 438 };
const HOLOGRAM_SLOT: ViewportRect = { cx: 717, cy: 376, w: 315, h: 560 };
const DOSSIER: ViewportRect = { cx: 362, cy: 238, w: 326, h: 236 };
const ERA_TITLE: ViewportRect = { cx: 362, cy: 166, w: 326, h: 82 };

describe("About → Voidwalker handoff clocks", () => {
  it("pins the approved windows and exact endpoints", () => {
    expect(ABOUT_HANDOFF_FLIGHT_WINDOW).toEqual([0.74, 0.88]);
    expect(ABOUT_HANDOFF_RESOLVE_WINDOW).toEqual([0.74, 0.96]);
    expect(VOIDWALKER_HOLOGRAM_MORPH_WINDOW).toEqual([0, 0.08]);

    expect(aboutHandoffFlightT(-1)).toBe(0);
    expect(aboutHandoffFlightT(0.74)).toBe(0);
    expect(aboutHandoffFlightT(0.88)).toBe(1);
    expect(aboutHandoffFlightT(2)).toBe(1);

    expect(aboutHandoffResolveT(0.74)).toBe(0);
    expect(aboutHandoffResolveT(0.96)).toBe(1);

    expect(voidwalkerHologramMorphT(-1)).toBe(0);
    expect(voidwalkerHologramMorphT(0)).toBe(0);
    expect(voidwalkerHologramMorphT(0.08)).toBe(1);
    expect(voidwalkerHologramMorphT(2)).toBe(1);
  });

  it("is monotonic and direction-independent at every sampled progress", () => {
    const samples = Array.from({ length: 101 }, (_, index) => index / 100);
    const project = (progress: number) => [
      aboutHandoffFlightT(progress),
      aboutHandoffResolveT(progress),
      voidwalkerHologramMorphT(progress),
    ];
    const forward = samples.map(project);
    const reverse = [...samples].reverse().map(project).reverse();

    expect(reverse).toEqual(forward);
    for (let index = 1; index < forward.length; index += 1) {
      expect(forward[index][0]).toBeGreaterThanOrEqual(forward[index - 1][0]);
      expect(forward[index][1]).toBeGreaterThanOrEqual(forward[index - 1][1]);
      expect(forward[index][2]).toBeGreaterThanOrEqual(forward[index - 1][2]);
    }
  });
});

describe("viewport-first portrait flight", () => {
  it("interpolates every rect channel and clamps to exact endpoints", () => {
    const target = { cx: 717, cy: 401, w: 315, h: 510 };
    expect(interpolateViewportRect(SOURCE, target, -1)).toEqual(SOURCE);
    expect(interpolateViewportRect(SOURCE, target, 1)).toEqual(target);
    expect(interpolateViewportRect(SOURCE, target, 2)).toEqual(target);
    expect(interpolateViewportRect(SOURCE, target, 0.5)).toEqual({
      cx: 874.5,
      cy: 400.5,
      w: 292.5,
      h: 474,
    });
  });

  it("resolves a bottom-aligned 420/680 portrait seat from the hologram column", () => {
    const seat = resolveBottomAlignedPortraitSeat(HOLOGRAM_SLOT);
    const slotBottom = HOLOGRAM_SLOT.cy + HOLOGRAM_SLOT.h / 2;
    const seatBottom = seat.cy + seat.h / 2;

    expect(seat.cx).toBe(HOLOGRAM_SLOT.cx);
    expect(seat.w).toBe(HOLOGRAM_SLOT.w);
    expect(seat.w / seat.h).toBeCloseTo(ABOUT_PORTRAIT_ASPECT, 12);
    expect(seatBottom).toBeCloseTo(slotBottom, 12);
    expect(seat).toEqual({ cx: 717, cy: 401, w: 315, h: 510 });
  });

  it("fails closed for invalid target geometry", () => {
    expect(resolveBottomAlignedPortraitSeat({ ...HOLOGRAM_SLOT, w: 0 })).toEqual({
      cx: 0,
      cy: 0,
      w: 0,
      h: 0,
    });
    expect(resolveBottomAlignedPortraitSeat(HOLOGRAM_SLOT, Number.NaN)).toEqual({
      cx: 0,
      cy: 0,
      w: 0,
      h: 0,
    });
  });

  it("reconstructs the identical flight under reverse and interrupted replay", () => {
    const target = resolveBottomAlignedPortraitSeat(HOLOGRAM_SLOT);
    const samples = [0, 0.17, 0.53, 0.91, 1];
    const forward = samples.map((t) => interpolateViewportRect(SOURCE, target, t));
    const replay = [...samples]
      .reverse()
      .map((t) => interpolateViewportRect(SOURCE, target, t))
      .reverse();
    expect(replay).toEqual(forward);
    expect(interpolateViewportRect(SOURCE, target, 0.53)).toEqual(forward[2]);
  });
});

describe("independent era-title flight", () => {
  /**
   * ⚠ THE TITLE TRANSLATES AND NEVER SCALES.
   *
   * The first cut fitted the name's border box onto the era-title RECT with
   * independent `scaleX`/`scaleY`. A 44px one-line name mapped into a ~30px
   * two-line seat is a 1.45x squeeze on one axis and a different one on the
   * other — the owner read it immediately as smushed type. The destination
   * now carries the name's own clamp, so the sizes already agree and the
   * flight has nothing left to do but move.
   */
  it("lands the title top-left on its seat with NO scale channel", () => {
    const sourceTitle: ViewportRect = { cx: 330, cy: 214, w: 470, h: 58 };
    const translation = resolveViewportRectTranslation(sourceTitle, ERA_TITLE);

    expect(translation).not.toBeNull();
    if (!translation) return;

    const sourceLeft = sourceTitle.cx - sourceTitle.w / 2;
    const sourceTop = sourceTitle.cy - sourceTitle.h / 2;
    expect(sourceLeft + translation.x).toBeCloseTo(ERA_TITLE.cx - ERA_TITLE.w / 2, 12);
    expect(sourceTop + translation.y).toBeCloseTo(ERA_TITLE.cy - ERA_TITLE.h / 2, 12);

    // The channel must not exist at all: a `scaleX` of 1 would still be a
    // lever a later pass could quietly re-point at the destination's width.
    expect(translation).toEqual({ x: translation.x, y: translation.y });
    expect(Object.keys(translation).sort()).toEqual(["x", "y"]);
  });

  it("translates identically however the two boxes differ in size", () => {
    // Same top-left, wildly different dimensions: the answer is the same,
    // because size is not part of this flight.
    const from: ViewportRect = { cx: 330, cy: 214, w: 470, h: 58 };
    const wide = resolveViewportRectTranslation(from, { cx: 400, cy: 300, w: 270, h: 145 });
    const narrow = resolveViewportRectTranslation(from, { cx: 400, cy: 300, w: 270, h: 145 });
    expect(wide).toEqual(narrow);
  });

  it("fails closed when either title rect is invalid", () => {
    expect(resolveViewportRectTranslation({ ...SOURCE, w: 0 }, ERA_TITLE)).toBeNull();
    expect(resolveViewportRectTranslation(SOURCE, { ...ERA_TITLE, cy: Number.NaN })).toBeNull();
  });

  it("keeps source and destination title opacity exactly complementary", () => {
    for (let index = -10; index <= 110; index += 1) {
      const opacity = handoffTitleOpacities(index / 100);
      expect(opacity.aboutTitle + opacity.voidwalkerTitle).toBe(1);
      expect(opacity.aboutTitle).toBeGreaterThanOrEqual(0);
      expect(opacity.voidwalkerTitle).toBeGreaterThanOrEqual(0);
    }
    expect(handoffTitleOpacities(0)).toEqual({ aboutTitle: 1, voidwalkerTitle: 0 });
    expect(handoffTitleOpacities(1)).toEqual({ aboutTitle: 0, voidwalkerTitle: 1 });
  });
});

describe("renderer ownership and shared state", () => {
  beforeEach(() => {
    aboutVoidwalkerHandoffRef.current = {
      portraitSeat: { cx: 0, cy: 0, w: 0, h: 0 },
      firstDossierRect: { cx: 0, cy: 0, w: 0, h: 0 },
      eraTitleRect: { cx: 0, cy: 0, w: 0, h: 0 },
      morph: 0,
      valid: false,
      capable: false,
      stampedAt: 0,
    };
  });

  it("keeps WebGL and DOM opacity exactly complementary", () => {
    for (let index = -10; index <= 110; index += 1) {
      const morph = index / 100;
      const opacity = handoffRendererOpacities(morph);
      expect(opacity.webglPortrait + opacity.domHologram).toBe(1);
      expect(opacity.webglPortrait).toBeGreaterThanOrEqual(0);
      expect(opacity.domHologram).toBeGreaterThanOrEqual(0);
    }
    expect(handoffRendererOpacities(0)).toEqual({ webglPortrait: 1, domHologram: 0 });
    expect(handoffRendererOpacities(1)).toEqual({ webglPortrait: 0, domHologram: 1 });
  });

  it("separates valid measurements from the capability gate", () => {
    const portraitSeat = resolveBottomAlignedPortraitSeat(HOLOGRAM_SLOT);
    writeAboutVoidwalkerHandoffTargets({
      portraitSeat,
      firstDossierRect: DOSSIER,
      eraTitleRect: ERA_TITLE,
      capable: false,
      now: 123.5,
    });

    expect(aboutVoidwalkerHandoffRef.current.valid).toBe(true);
    expect(aboutVoidwalkerHandoffRef.current.capable).toBe(false);
    expect(aboutVoidwalkerHandoffRef.current.stampedAt).toBe(123.5);
    expect(isAboutVoidwalkerHandoffReady(aboutVoidwalkerHandoffRef.current)).toBe(false);

    writeAboutVoidwalkerHandoffTargets({
      portraitSeat,
      firstDossierRect: DOSSIER,
      eraTitleRect: ERA_TITLE,
      capable: true,
      now: 124,
    });
    expect(isAboutVoidwalkerHandoffReady(aboutVoidwalkerHandoffRef.current)).toBe(true);
  });

  it("invalid targets cannot arm the handoff and invalidation clears ownership", () => {
    const portraitSeat = resolveBottomAlignedPortraitSeat(HOLOGRAM_SLOT);
    writeAboutVoidwalkerHandoffTargets({
      portraitSeat,
      firstDossierRect: { ...DOSSIER, h: Number.NaN },
      eraTitleRect: ERA_TITLE,
      capable: true,
      now: Number.NaN,
    });
    writeAboutVoidwalkerHandoffMorph(1.4);

    expect(aboutVoidwalkerHandoffRef.current.valid).toBe(false);
    expect(aboutVoidwalkerHandoffRef.current.morph).toBe(1);
    expect(aboutVoidwalkerHandoffRef.current.stampedAt).toBe(0);
    expect(isAboutVoidwalkerHandoffReady(aboutVoidwalkerHandoffRef.current)).toBe(false);

    invalidateAboutVoidwalkerHandoff();
    expect(aboutVoidwalkerHandoffRef.current).toMatchObject({
      morph: 0,
      valid: false,
      capable: false,
    });
  });

  it("requires the title target before the shared overlap can arm", () => {
    writeAboutVoidwalkerHandoffTargets({
      portraitSeat: resolveBottomAlignedPortraitSeat(HOLOGRAM_SLOT),
      firstDossierRect: DOSSIER,
      eraTitleRect: { ...ERA_TITLE, h: 0 },
      capable: true,
      now: 125,
    });

    expect(aboutVoidwalkerHandoffRef.current.valid).toBe(false);
    expect(isAboutVoidwalkerHandoffReady(aboutVoidwalkerHandoffRef.current)).toBe(false);
  });
});
