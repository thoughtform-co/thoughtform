import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getV7Content } from "@/lib/v7-parse";

/**
 * The brandmark particle canvas has nothing to paint on `/` (ADR-123 commit
 * B). Its journey needs TWO live anchors to ever set `visible`
 * (`useBrandmarkJourney`), and the landing strips every station that carried
 * one — so `BrandmarkSystem` mounts the canvas only with ≥2 anchors, and this
 * pins that the parsed landing body carries NONE. If a station with an anchor
 * ever returns, this fails and the mount gate is what to re-read.
 */

const ROOT = join(__dirname, "..", "..");
const page = readFileSync(join(ROOT, "app/(marketing)/page.tsx"), "utf8");

function listOf(name: string): string[] {
  const m = new RegExp(`const ${name} = \\[([\\s\\S]*?)\\] as const;`).exec(page);
  if (!m) throw new Error(`${name} not found in page.tsx`);
  return Array.from(m[1]!.matchAll(/"([^"]+)"/g), (x) => x[1]!);
}

describe("the landing carries no brandmark anchor (ADR-123 B)", () => {
  it("the parsed body has no data-brand-anchor", () => {
    // Relocation only MOVES stations (into the corridor's mount), so the
    // removed set is what decides whether an anchor survives in the body.
    const { bodyHtml } = getV7Content({
      removeStations: listOf("CORRIDOR_REPLACED_STATIONS"),
    });
    expect(bodyHtml).not.toMatch(/data-brand-anchor/);
    // And the relocated stations carry none either.
    const relocated = Array.from(page.matchAll(/\{ stationId: "([^"]+)"/g), (m) => m[1]!);
    expect(relocated.length).toBeGreaterThan(0);
    const whole = getV7Content().bodyHtml;
    for (const id of relocated) {
      const start = whole.indexOf(`data-station="${id}"`);
      expect(start, `station ${id} missing`).toBeGreaterThan(-1);
      const end = whole.indexOf("</section>", start);
      expect(whole.slice(start, end)).not.toMatch(/data-brand-anchor/);
    }
  });

  it("the system mounts the particle canvas only with two live anchors", () => {
    const src = readFileSync(join(ROOT, "components/landing/v7/BrandmarkSystem.tsx"), "utf8");
    expect(src).toMatch(/anchorCount >= 2/);
    expect(src).toMatch(/<BrandmarkParticleCanvas/);
  });
});
