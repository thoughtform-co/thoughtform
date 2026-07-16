import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { computeDetentTable } from "@/lib/rail-manifest/detentTable";
import { CORRIDOR_MOUNT_ID, MANIFEST_ENTRIES } from "@/lib/rail-manifest/entries";

/**
 * The detent table (ADR-031 Update 9) — the left-rail diamond's per-section
 * detents, spaced PROPORTIONAL to each section's real scroll distance.
 *
 * jsdom reports 0 for all layout, so we stub offsetTop / offsetHeight /
 * scrollHeight / innerHeight to a synthetic page: a short hero, then a TALL
 * WebGL corridor mount, then several short stations. That lets us pin the
 * contract the live page must honour (monotonic, corridor split, proportional).
 */

const INNER_H = 800;

/** offsetTop / offsetHeight per element id. */
const LAYOUT: Record<string, { top: number; height: number }> = {
  hero: { top: 0, height: 800 },
  [CORRIDOR_MOUNT_ID]: { top: 800, height: 8200 }, // the long corridor runway
  services: { top: 9000, height: 800 },
  about: { top: 9800, height: 800 },
  continuum: { top: 10600, height: 800 },
  practice: { top: 11400, height: 800 },
  contact: { top: 12200, height: 800 },
};
const SCROLL_HEIGHT = 13000;

function stubEl(top: number, height: number): HTMLElement {
  const el = document.createElement("div");
  Object.defineProperty(el, "offsetTop", { value: top, configurable: true });
  Object.defineProperty(el, "offsetHeight", { value: height, configurable: true });
  return el;
}

const idx = (id: string) => MANIFEST_ENTRIES.findIndex((e) => e.id === id);

describe("computeDetentTable — proportional detents", () => {
  let getByIdSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    Object.defineProperty(window, "innerHeight", { value: INNER_H, configurable: true });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: SCROLL_HEIGHT,
      configurable: true,
    });
    getByIdSpy = vi
      .spyOn(document, "getElementById")
      .mockImplementation((id: string) =>
        LAYOUT[id] ? stubEl(LAYOUT[id].top, LAYOUT[id].height) : null
      );
  });

  afterEach(() => {
    getByIdSpy.mockRestore();
  });

  it("returns one 0..1 detent per journey entry", () => {
    const t = computeDetentTable();
    expect(t).toHaveLength(MANIFEST_ENTRIES.length);
    for (const v of t) {
      expect(v).not.toBeNull();
      expect(v as number).toBeGreaterThanOrEqual(0);
      expect(v as number).toBeLessThanOrEqual(1);
    }
  });

  it("is monotonic non-decreasing in journey order", () => {
    const t = computeDetentTable() as number[];
    for (let i = 1; i < t.length; i++) expect(t[i]).toBeGreaterThanOrEqual(t[i - 1]);
  });

  it("splits the shared corridor mount: thesis < navigate < encode < build", () => {
    const t = computeDetentTable() as number[];
    expect(t[idx("thesis")]).toBeLessThan(t[idx("navigate")]);
    expect(t[idx("navigate")]).toBeLessThan(t[idx("encode")]);
    expect(t[idx("encode")]).toBeLessThan(t[idx("build")]);
  });

  it("is proportional: the corridor spans more rail than a short station", () => {
    const t = computeDetentTable() as number[];
    const corridorSpan = t[idx("services")] - t[idx("thesis")];
    const stationSpan = t[idx("practice")] - t[idx("continuum")];
    expect(corridorSpan).toBeGreaterThan(stationSpan);
  });

  it("holds null when a target element is absent", () => {
    getByIdSpy.mockImplementation((id: string) =>
      id === "about" || !LAYOUT[id] ? null : stubEl(LAYOUT[id].top, LAYOUT[id].height)
    );
    const t = computeDetentTable();
    expect(t[idx("about")]).toBeNull();
  });
});
