import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  FLIGHT_FOV,
  MAX_FOV_DEG,
  flightFov,
  halfExtentsAt,
  perspectivePx,
} from "@/lib/latent-flight/camera/fov";
import { VISTA, VISTA_HUE_BAND, VISTA_TOKEN_PINS, hueDeg } from "@/lib/latent-flight/vistaPalette";

const VARIABLES_CSS = readFileSync(join(process.cwd(), "app/styles/variables.css"), "utf8");

function tokenHex(name: string): number {
  const re = new RegExp(`${name.replace(/[-]/g, "\\-")}:\\s*#([0-9a-fA-F]{6})\\s*;`);
  const m = re.exec(VARIABLES_CSS);
  if (!m) throw new Error(`token ${name} not found as a 6-digit hex in variables.css`);
  return parseInt(m[1], 16);
}

describe("vista palette", () => {
  it("pins its literals to the live tokens", () => {
    for (const [token, key] of Object.entries(VISTA_TOKEN_PINS)) {
      expect(VISTA[key], `${token} → VISTA.${key}`).toBe(tokenHex(token));
    }
  });

  it("keeps every colour in the warm band — warmth is lightness, never blue", () => {
    for (const [name, hex] of Object.entries(VISTA)) {
      if (name === "ground") continue;
      const h = hueDeg(hex);
      expect(h, `${name} hue ${h.toFixed(1)}°`).toBeGreaterThanOrEqual(VISTA_HUE_BAND[0]);
      expect(h, `${name} hue ${h.toFixed(1)}°`).toBeLessThanOrEqual(VISTA_HUE_BAND[1]);
    }
  });
});

describe("flight fov", () => {
  it("mirrors the corridor's policy: 38° landscape, Hor+ on portrait, capped at 70°", () => {
    expect(flightFov(16 / 9)).toBe(FLIGHT_FOV);
    expect(flightFov(1)).toBe(FLIGHT_FOV);
    const portrait = flightFov(9 / 16);
    expect(portrait).toBeGreaterThan(FLIGHT_FOV);
    expect(portrait).toBeLessThanOrEqual(MAX_FOV_DEG);
    expect(flightFov(0.3)).toBe(MAX_FOV_DEG);
    expect(flightFov(Number.NaN)).toBe(FLIGHT_FOV);
  });

  it("derives the CSS perspective from the same lens", () => {
    // (H/2) / tan(19°) at 1080px ≈ 1568px — ADR-081's own number.
    expect(perspectivePx(38, 1080)).toBeCloseTo(1568.3, 0);
    const { hw, hh } = halfExtentsAt(2, 38, 16 / 9);
    expect(hh).toBeCloseTo(2 * Math.tan((38 * Math.PI) / 360), 9);
    expect(hw / hh).toBeCloseTo(16 / 9, 9);
  });
});
