import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  SCROLL_MEMORY_MAX_AGE_MS,
  SCROLL_MEMORY_ROTATION_PX,
  shouldRestore,
  type ScrollMemory,
} from "@/lib/landing/scrollMemory";

/**
 * The landing's scroll memory (ADR-123 §Part 1, commit A): the pure decision
 * of whether a remembered position is replayed, and the two contracts the
 * replay component keeps — `manual` restoration only while the landing is
 * mounted, and the corridor's import gate released so a page put back at
 * depth does not wait for a scroll that will never come.
 */

const ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const rec = (over: Partial<ScrollMemory> = {}): ScrollMemory => ({
  y: 3200,
  docH: 14000,
  vw: 390,
  vh: 844,
  t: 1_000_000,
  ...over,
});
const ctx = { hash: "", persisted: false, vw: 390, now: 1_000_000 + 5000 };

describe("shouldRestore (pure)", () => {
  it("replays a fresh record from this layout", () => {
    expect(shouldRestore(rec(), ctx)).toBe(true);
  });
  it("never replays over an anchor, a bfcache restore or an empty record", () => {
    expect(shouldRestore(rec(), { ...ctx, hash: "#services" })).toBe(false);
    expect(shouldRestore(rec(), { ...ctx, persisted: true })).toBe(false);
    expect(shouldRestore(null, ctx)).toBe(false);
    expect(shouldRestore(rec({ y: 0 }), ctx)).toBe(false);
  });
  it("drops a record from another width (a rotation) and a stale one", () => {
    expect(shouldRestore(rec(), { ...ctx, vw: 390 + SCROLL_MEMORY_ROTATION_PX + 1 })).toBe(false);
    expect(shouldRestore(rec(), { ...ctx, vw: 390 + SCROLL_MEMORY_ROTATION_PX })).toBe(true);
    expect(shouldRestore(rec(), { ...ctx, now: 1_000_000 + SCROLL_MEMORY_MAX_AGE_MS + 1 })).toBe(
      false
    );
  });
});

describe("the replay's contracts (source)", () => {
  const src = read("components/landing/v7/ScrollRestoration.tsx");
  it("takes manual restoration only for the landing's lifetime, and gives it back", () => {
    expect(src).toContain('history.scrollRestoration = "manual"');
    expect(src).toContain("history.scrollRestoration = previous");
    const layout = read("app/layout.tsx");
    expect(layout, "scrollRestoration belongs to the landing, not every route").not.toContain(
      "scrollRestoration"
    );
  });
  it("releases the corridor's ≤960 import gate before waiting on the stage", () => {
    expect(src).toContain("releaseCorridorImportGate()");
    const mount = read("components/landing/v7/hooks/useCorridorMount.tsx");
    expect(mount).toContain("export function releaseCorridorImportGate");
  });
  it("waits for the split pile on the split rung and lands instantly", () => {
    expect(src).toContain(".pf-stack--split");
    expect(src).toContain(".home-v2-stage");
    expect(src).toContain('behavior: "instant"');
  });
  it("is mounted by the landing page beside the diag gate", () => {
    const page = read("components/landing/v7/LandingPage.tsx");
    expect(page).toContain("<ScrollRestoration />");
    expect(page).toContain("<DiagGate />");
  });
});
