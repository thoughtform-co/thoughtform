import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it } from "vitest";

import {
  PHONE_SEAT_AIR_PX,
  phoneSphereScale,
  phoneStraddleWorldY,
  readPhoneSphereScale,
  readPhoneStraddle,
  resetPhoneSeats,
  writePhoneSphereScale,
  writePhoneStraddle,
} from "@/lib/home-v2/phoneStraddle";

/**
 * The beats' seat lines on the phone (ADR-125 U1).
 *
 * The straddles that hang a beat's title above the station line and its
 * caption below it were constants tuned at 390×844; the clusters are fixed
 * px while a world unit is a share of the frame, so on the toolbar frame
 * (≈676) the Navigate title sat inside the top chrome band and on the tall
 * frame every beat left "so much unused space above and below". This pins
 * the arithmetic that derives them from the frame instead, the sphere solve
 * that rides the same seats, the registry's fallback, and the source seams
 * that make it real: the anchors read the registry, the tracker writes it,
 * the copy layer carries the two probes, the sheet derives their heights
 * from the chrome's own tokens.
 */

const ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

/** The analytic frame: every phone clamps to a 70° vertical FOV, the
 *  anchors sit 6.1 units from the camera at a park, the tracker's scale is
 *  `6.2 / 6.1`, the station line projects to the frame's centre. */
const FOV_DEG = 70;
const PARK_DIST = 6.1;
const SCALE = 6.2 / PARK_DIST;
const SEAT_LINE = 56 + PHONE_SEAT_AIR_PX;
const pxPerUnit = (vh: number) => vh / 2 / Math.tan((FOV_DEG * Math.PI) / 360) / PARK_DIST;
const straddle = (edge: "top" | "bottom", vh: number, clusterPx: number) =>
  phoneStraddleWorldY({
    edge,
    vh,
    seatLinePx: SEAT_LINE,
    clusterPx,
    scale: SCALE,
    centreY: vh / 2,
    pxPerUnit: pxPerUnit(vh),
  });

/** The clusters measured at 844, unscaled (the 18px leader included). */
const CLUSTERS = {
  navigate: { title: 124, caption: 133 },
  diagnostic: { title: 104, caption: 116 },
  intelligence: { title: 104, caption: 133 },
} as const;

describe("phoneStraddleWorldY", () => {
  it("seats the title's top on the top line and the caption's bottom on the bottom line", () => {
    for (const vh of [676, 844, 932]) {
      for (const [, c] of Object.entries(CLUSTERS)) {
        const t = straddle("top", vh, c.title);
        const s = straddle("bottom", vh, c.caption);
        // Re-project: the anchored edge lands where the seat says.
        const titleBottom = vh / 2 - t * pxPerUnit(vh);
        expect(titleBottom - c.title * SCALE).toBeCloseTo(SEAT_LINE, 9);
        const captionTop = vh / 2 - s * pxPerUnit(vh);
        expect(captionTop + c.caption * SCALE).toBeCloseTo(vh - SEAT_LINE, 9);
        expect(t).toBeGreaterThan(0);
        expect(s).toBeLessThan(0);
      }
    }
  });

  it("reproduces the record: the toolbar frame needs LESS than the old literals, the tall one more", () => {
    // Navigate's constants were +2.0 / −1.8: inside the top band at 676,
    // 25px of dead air at 844.
    expect(straddle("top", 676, CLUSTERS.navigate.title)).toBeCloseTo(1.82, 1);
    expect(straddle("bottom", 676, CLUSTERS.navigate.caption)).toBeCloseTo(-1.7, 1);
    expect(straddle("top", 844, CLUSTERS.navigate.title)).toBeCloseTo(2.31, 1);
    expect(straddle("bottom", 844, CLUSTERS.navigate.caption)).toBeCloseTo(-2.21, 1);
    expect(straddle("top", 676, CLUSTERS.navigate.title)).toBeLessThan(2.0);
    expect(straddle("top", 844, CLUSTERS.navigate.title)).toBeGreaterThan(2.0);
    // A straddle grows with the frame (the cluster is fixed px) — the reason
    // one constant cannot serve two frames.
    for (const edge of ["top", "bottom"] as const) {
      const a = Math.abs(straddle(edge, 676, 120));
      const b = Math.abs(straddle(edge, 844, 120));
      const c = Math.abs(straddle(edge, 932, 120));
      expect(b).toBeGreaterThan(a);
      expect(c).toBeGreaterThan(b);
    }
  });

  it("moves with its inputs the right way", () => {
    const base = straddle("top", 844, 120);
    // A taller cluster hangs lower on the same line → a smaller straddle.
    expect(straddle("top", 844, 140)).toBeLessThan(base);
    // A bigger scale, likewise.
    expect(
      phoneStraddleWorldY({
        edge: "top",
        vh: 844,
        seatLinePx: SEAT_LINE,
        clusterPx: 120,
        scale: 1.1,
        centreY: 422,
        pxPerUnit: pxPerUnit(844),
      })
    ).toBeLessThan(base);
    // A station line projected higher pulls the title straddle in.
    expect(
      phoneStraddleWorldY({
        edge: "top",
        vh: 844,
        seatLinePx: SEAT_LINE,
        clusterPx: 120,
        scale: SCALE,
        centreY: 400,
        pxPerUnit: pxPerUnit(844),
      })
    ).toBeLessThan(base);
  });
});

describe("phoneSphereScale", () => {
  it("is the largest ring that clears the band by the air, floored and capped", () => {
    const base = 1.1;
    const max = 1.3;
    // 676, Navigate: a 125px half-band against a 120px ring at the base.
    expect(
      phoneSphereScale({ halfBandPx: 125 + PHONE_SEAT_AIR_PX, ringPxAtBase: 120, base, max })
    ).toBeCloseTo(1.1 * (125 / 120), 9);
    // Room to spare → the cap.
    expect(phoneSphereScale({ halfBandPx: 300, ringPxAtBase: 120, base, max })).toBe(max);
    // No room → never under the base.
    expect(phoneSphereScale({ halfBandPx: 90, ringPxAtBase: 120, base, max })).toBe(base);
    // Degenerate inputs → the base.
    expect(phoneSphereScale({ halfBandPx: 200, ringPxAtBase: 0, base, max })).toBe(base);
    expect(phoneSphereScale({ halfBandPx: NaN, ringPxAtBase: 120, base, max })).toBe(base);
  });
});

describe("the registry", () => {
  beforeEach(() => resetPhoneSeats());

  it("answers the fallback until the tracker writes, then the write", () => {
    expect(readPhoneStraddle("navigate.title", 2.0)).toBe(2.0);
    writePhoneStraddle("navigate.title", 2.31);
    expect(readPhoneStraddle("navigate.title", 2.0)).toBe(2.31);
    writePhoneStraddle("navigate.title", NaN);
    expect(readPhoneStraddle("navigate.title", 2.0)).toBe(2.31);
    expect(readPhoneSphereScale(1.1)).toBe(1.1);
    writePhoneSphereScale(1.23);
    expect(readPhoneSphereScale(1.1)).toBe(1.23);
    resetPhoneSeats();
    expect(readPhoneStraddle("navigate.title", 2.0)).toBe(2.0);
    expect(readPhoneSphereScale(1.1)).toBe(1.1);
  });
});

describe("the source seams", () => {
  it("the module is three-free and DOM-free", () => {
    const src = stripComments(read("lib/home-v2/phoneStraddle.ts"));
    expect(src).not.toMatch(/from ["']three["']|from ["']react["']|document\.|window\./);
    expect(src).not.toMatch(/^import /m);
  });

  it("every beat anchor reads the registry with its old literal as the fallback, and declares its seat", () => {
    const geom = stripComments(read("components/landing/home-v2/DepthGatewayScene/sceneGeom.ts"));
    const expected: [string, string][] = [
      ["navigate.title", "2.0"],
      ["navigate.support", "-1.8"],
      ["diagnostic.title", "1.7"],
      ["diagnostic.support", "-1.5"],
      ["intelligence.title", "1.65"],
      ["intelligence.support", "-1.35"],
    ];
    for (const [id, literal] of expected) {
      expect(geom, id).toMatch(
        new RegExp(
          `readPhoneStraddle\\("${id.replace(".", "\\.")}",\\s*${literal.replace(".", "\\.")}\\)`
        )
      );
    }
    expect(geom.match(/phoneSeat:\s*\{/g)?.length).toBe(6);
    expect(geom.match(/edge:\s*"top"/g)?.length).toBe(3);
    expect(geom.match(/edge:\s*"bottom"/g)?.length).toBe(3);
    // The sphere reads the solved scale on the phone, 1 on the desktop.
    expect(geom).toMatch(
      /isMobileComposition\(\) \? readPhoneSphereScale\(MOBILE_GYRO_SPHERE_SCALE\) : 1/
    );
    expect(geom).toMatch(/MOBILE_GYRO_SPHERE_SCALE_MAX = 1\.3/);
    // The weld folds the phone factor in.
    expect(geom).toMatch(
      /getNavigateApparentSizeBoost\(transform\.paintProgress\) \*\s*mobileGyroSphereScale\(\)/
    );
  });

  it("the tracker derives the seats once per resize and writes the record", () => {
    const tracker = stripComments(read("components/landing/home-v2/hooks/useWorldDomTracker.ts"));
    expect(tracker).toMatch(/const derivePhoneSeats = \(\) =>/);
    expect(tracker).toMatch(/if \(seatsDirty\) derivePhoneSeats\(\);/);
    expect(tracker).toMatch(/writePhoneStraddle\(anchor\.id, y\)/);
    expect(tracker).toMatch(/writePhoneSphereScale\(tightest\)/);
    expect(tracker).toMatch(/setAttribute\("data-phone-seats"/);
    expect(tracker).toMatch(/\.home-v2-copy-seat--top/);
    expect(tracker).toMatch(/\.home-v2-copy-seat--bottom/);
    // Gated on the phone predicate; the desktop never writes.
    expect(tracker).toMatch(/if \(!isMobileComposition\(\)\) return;/);
  });

  it("the copy layer carries the two probes and the sheet derives their heights from the chrome", () => {
    const layer = read("components/landing/home-v2/CopyAnchors.tsx");
    expect(layer).toMatch(/home-v2-copy-seat home-v2-copy-seat--top/);
    expect(layer).toMatch(/home-v2-copy-seat home-v2-copy-seat--bottom/);
    const css = read("components/landing/home-v2/home-v2.css");
    expect(css).toMatch(/--corridor-seat-air:\s*12px/);
    expect(css).toMatch(
      /\.home-v2-copy-seat--top\s*\{[^}]*height:\s*calc\(var\(--mobile-chrome-top\) \+ var\(--corridor-seat-air\)\)/
    );
    expect(css).toMatch(
      /\.home-v2-copy-seat--bottom\s*\{[^}]*height:\s*calc\(var\(--mobile-chrome-bottom\) \+ var\(--corridor-seat-air\)\)/
    );
    expect(css).toMatch(/\.home-v2-copy-seat\s*\{[^}]*visibility:\s*hidden/);
  });
});
