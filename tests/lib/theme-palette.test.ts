/**
 * The scene palette (ADR-058 Phase 2) — the WebGL side of light mode.
 *
 * `lib/theme/palette.ts` has carried this note since it was written:
 * "⚠ NO TEST PINS THIS — the once-cited `tests/lib/theme-palette.test.ts`
 * was never written." This is that file, and it exists because the gap it
 * left shipped a real defect: the Build park's SURFACE node streams were
 * painted `COLOR_DAWN` (0xebe3d6) in both modes while the light ground is
 * 0xece3d6 — one unit apart in red — so the whole right-hand fan was
 * invisible on parchment for as long as light mode has existed, with
 * every gate green.
 *
 * Two questions, and neither is answerable by eye:
 *   1. Does the DARK column still equal the literal each painter used
 *      before it was wired up? That is the flag's OFF contract.
 *   2. Can each LIGHT value actually be SEEN on the light ground? An
 *      emitter that emits the ground colour emits nothing.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  COLOR_ATREIDES,
  COLOR_DAWN,
  COLOR_SOURCES,
  COLOR_SURFACES,
} from "@/components/landing/intelligence-artifact/artifactGeom";
import { DARK_SCENE, LIGHT_SCENE, resolveScenePalette } from "@/lib/theme/palette";

const ROOT = process.cwd();

/** sRGB relative luminance, for a hex the painters hold as a number. */
function luminance(hex: number): number {
  const chan = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = chan((hex >> 16) & 0xff);
  const g = chan((hex >> 8) & 0xff);
  const b = chan(hex & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: number, b: number): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** The largest single-channel gap between two packed colours. */
function channelGap(a: number, b: number): number {
  return Math.max(
    Math.abs(((a >> 16) & 0xff) - ((b >> 16) & 0xff)),
    Math.abs(((a >> 8) & 0xff) - ((b >> 8) & 0xff)),
    Math.abs((a & 0xff) - (b & 0xff))
  );
}

describe("the dark column IS the painters' own literals", () => {
  it("keeps the ground and the two node streams byte-identical", () => {
    // If any of these three ever needs to change, it is a look change to
    // the DARK corridor and wants its own decision — not a light-mode fix
    // that reached one line too far.
    expect(DARK_SCENE.ground).toBe(0x0a0908);
    expect(DARK_SCENE.stream.source).toBe(COLOR_SOURCES);
    expect(DARK_SCENE.stream.surface).toBe(COLOR_SURFACES);
    // …and those two are still the families they were named for.
    expect(COLOR_SOURCES).toBe(COLOR_ATREIDES);
    expect(COLOR_SURFACES).toBe(COLOR_DAWN);
  });

  it("keeps the shipped ADR-056 proof dims", () => {
    expect(DARK_SCENE.proofDim).toEqual({
      mark: 0.62,
      interior: 0.7,
      surface: 0.55,
      orbits: 0,
    });
  });

  it("keeps the two stream BEHAVIOURS dark has always had", () => {
    // The wrap tail multiplies toward black (which is the ground in dark)
    // and the tip's outline diamond is additive (a glow on void).
    expect(DARK_SCENE.stream.tailToGround).toBe(false);
    expect(DARK_SCENE.stream.additivePips).toBe(true);
  });

  it("resolves by mode, and defaults nowhere in between", () => {
    expect(resolveScenePalette("dark")).toBe(DARK_SCENE);
    expect(resolveScenePalette("light")).toBe(LIGHT_SCENE);
  });
});

describe("the light column can actually be seen on the light ground", () => {
  it("grounds on the page's own light --void, read from the stylesheet", () => {
    // A drift guard rather than a restatement: the occluder core's whole
    // job is to disappear against the page, so this value is only correct
    // relative to what the theme actually paints.
    const theme = readFileSync(join(ROOT, "components/landing/v7/theme.css"), "utf8");
    const light = theme.slice(theme.indexOf('[data-theme="light"]'));
    const voidHex = light.match(/--void:\s*#([0-9a-f]{6})/i)?.[1];
    expect(voidHex, "the light block declares --void").toBeTruthy();
    expect(LIGHT_SCENE.ground).toBe(Number.parseInt(voidHex!, 16));
  });

  it("⚠ NO STREAM MAY EMIT THE GROUND COLOUR — the defect this file exists for", () => {
    // The surface stream was 0xebe3d6 against a 0xece3d6 page: a channel
    // gap of ONE, about 1.00:1. Line work on this surface is decorative
    // rather than type, so the bar is the 3:1 line rung (ADR-063 U2),
    // not 4.5 — but it is a bar, and 1.00 is not near it.
    for (const [name, colour] of [
      ["source", LIGHT_SCENE.stream.source],
      ["surface", LIGHT_SCENE.stream.surface],
    ] as const) {
      expect(channelGap(colour, LIGHT_SCENE.ground), `${name} vs the light ground`).toBeGreaterThan(
        24
      );
      expect(contrast(colour, LIGHT_SCENE.ground), `${name} vs the light ground`).toBeGreaterThan(
        3
      );
    }
  });

  it("puts both streams on the INK side of the ground, not the light side", () => {
    // The axis that inverts. On void, "more contrast" means brighter; on
    // parchment it means darker, and a value tuned for one is invisible
    // on the other. Both streams must be darker than the page.
    const ground = luminance(LIGHT_SCENE.ground);
    expect(luminance(LIGHT_SCENE.stream.source)).toBeLessThan(ground);
    expect(luminance(LIGHT_SCENE.stream.surface)).toBeLessThan(ground);
  });

  it("drops additive blending, which cannot draw ink on parchment", () => {
    // Additive can only LIGHTEN: on a light ground the tip's outline
    // diamond draws nothing at all, at any alpha.
    expect(LIGHT_SCENE.stream.additivePips).toBe(false);
  });

  it("fades the wrap tail toward the GROUND, not toward black", () => {
    // Multiplying toward black is a fade in dark and a CONTRAST RAMP in
    // light — it made the absorbed tail the strongest part of the line
    // and the run out to the chip the invisible one, exactly inverted.
    expect(LIGHT_SCENE.stream.tailToGround).toBe(true);
  });

  it("takes the theme's own flipped tokens rather than new colours", () => {
    // The lines and the DOM chips they run to are one family: these are
    // `--atreides-light` and `--dawn` as the light block already defines
    // them, so a change there cannot leave the canvas behind.
    const theme = readFileSync(join(ROOT, "components/landing/v7/theme.css"), "utf8");
    const light = theme.slice(theme.indexOf('[data-theme="light"]'));
    const token = (name: string) =>
      Number.parseInt(light.match(new RegExp(`--${name}:\\s*#([0-9a-f]{6})`, "i"))?.[1] ?? "", 16);
    expect(LIGHT_SCENE.stream.source).toBe(token("atreides-light"));
    expect(LIGHT_SCENE.stream.surface).toBe(token("dawn"));
  });
});
