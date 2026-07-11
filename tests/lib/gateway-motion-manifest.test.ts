import { describe, expect, it } from "vitest";

import { pickPlate, resolveTuning, type GatewayVisualEntry } from "@/lib/gateway-motion/manifest";

/**
 * Manifest selection helpers for the Gateway Motion Lab. Pins plate
 * selection (smallest source that still covers cssWidth × dpr, AVIF
 * preferred when supported) and per-visual tuning merge semantics.
 */

function makeEntry(overrides: Partial<GatewayVisualEntry> = {}): GatewayVisualEntry {
  return {
    id: "gateway-v1",
    name: "Gateway I",
    source: { file: "Gateway_v1.webp", width: 3840, height: 2160 },
    plate: {
      avif: [
        { w: 2560, src: "/gateway-motion/gateway-v1/plate-2560.avif" },
        { w: 1600, src: "/gateway-motion/gateway-v1/plate-1600.avif" },
      ],
      webp: [
        { w: 2560, src: "/gateway-motion/gateway-v1/plate-2560.webp" },
        { w: 1600, src: "/gateway-motion/gateway-v1/plate-1600.webp" },
      ],
      lqip: "data:image/webp;base64,xxxx",
    },
    depth: {
      src8: "/gateway-motion/gateway-v1/depth-8.webp",
      srcPacked: "/gateway-motion/gateway-v1/depth-packed.webp",
      width: 1024,
      height: 576,
    },
    masks: { artifact: null, stars: null, background: null },
    sequence: null,
    ...overrides,
  };
}

describe("pickPlate", () => {
  it("picks the smallest plate that covers cssWidth * dpr", () => {
    const entry = makeEntry();
    expect(pickPlate(entry, 1200, 1, true).w).toBe(1600);
    expect(pickPlate(entry, 1440, 1.75, true).w).toBe(2560);
  });

  it("falls back to the largest plate when nothing covers", () => {
    const entry = makeEntry();
    expect(pickPlate(entry, 3840, 2, true).w).toBe(2560);
  });

  it("uses webp sources when avif is unsupported", () => {
    const entry = makeEntry();
    expect(pickPlate(entry, 375, 1.4, false).src).toContain(".webp");
  });

  it("mobile viewport at capped dpr stays on the 1600w plate", () => {
    const entry = makeEntry();
    expect(pickPlate(entry, 375, 1.4, true).w).toBe(1600);
  });
});

describe("resolveTuning", () => {
  it("returns defaults when the entry has no tuning block", () => {
    const defaults = { parallaxPx: 26, focus: 0.35 };
    expect(resolveTuning(defaults, makeEntry(), "parallax")).toEqual(defaults);
  });

  it("merges manifest overrides over defaults without mutating them", () => {
    const defaults = { parallaxPx: 26, focus: 0.35 };
    const entry = makeEntry({ tuning: { parallax: { focus: 0.5 } } });
    const resolved = resolveTuning(defaults, entry, "parallax");
    expect(resolved).toEqual({ parallaxPx: 26, focus: 0.5 });
    expect(defaults.focus).toBe(0.35);
  });
});
