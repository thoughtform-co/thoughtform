// ═══════════════════════════════════════════════════════════════════
// DAEMONIAC — the guard (the proof-glyphs pattern: legal is arithmetic,
// good is the owner's on the specimen sheet).
//
// Walks the REAL record set the lab loads (demo fleet + the four
// tools), never fixtures: determinism, the stroke enum, glyph budgets
// and width floors, fingerprint distinguishability, annotation
// budgets, and the sampler's contract. A fingerprint collision's
// remedy is the record's `seedTag` (see GRAMMAR.md).
// ═══════════════════════════════════════════════════════════════════

import { describe, expect, it } from "vitest";

import { DEMO_FLEET, fourTools } from "@/app/(internal)/test/daemoniac/demoFleet";
import { sampleBind } from "@/lib/daemoniac/bindPaths";
import { composeBind } from "@/lib/daemoniac/composeBind";
import { forgeGlyph, forgeIdeogram, GLYPH_BOX, type GlyphSpec } from "@/lib/daemoniac/glyphForge";
import { primitiveD, primitiveLength, primitivePoint } from "@/lib/daemoniac/primitives";
import { STROKE_WEIGHTS, type BindRecord, type MarkPrimitive } from "@/lib/daemoniac/types";

const RECORDS: readonly BindRecord[] = [...DEMO_FLEET, ...fourTools()];

/** Every glyph the record set forges, tagged by grade. */
function allGlyphs(): { spec: GlyphSpec; source: string; seedTag?: string }[] {
  const seen = new Set<string>();
  const out: { spec: GlyphSpec; source: string; seedTag?: string }[] = [];
  const add = (name: string, grade: "major" | "minor", seedTag?: string) => {
    const k = `${grade}:${name.toLowerCase()}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ spec: forgeGlyph(name, grade, seedTag), source: k, seedTag });
  };
  for (const r of RECORDS) {
    add(r.lane, "major", r.seedTag);
    if (r.class !== "skill") add(r.name, "major", r.seedTag);
    for (const s of r.skills) add(s, "minor", r.seedTag);
    for (const c of r.connectors) add(c, "minor", r.seedTag);
    for (const c of r.contexts) add(c, "minor", r.seedTag);
    forgeIdeogram(r.name, r.seedTag).forEach((g, i) => add(`${r.name}::${i}`, "minor", r.seedTag));
  }
  return out;
}

function primitiveBounds(p: MarkPrimitive): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  // Sample-based bounds — exact enough for budget walls, deterministic.
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i <= 16; i++) {
    const [x, y] = primitivePoint(p, i / 16);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  if (p.kind === "circle") {
    minX = p.cx - p.r;
    maxX = p.cx + p.r;
    minY = p.cy - p.r;
    maxY = p.cy + p.r;
  }
  return { minX, maxX, minY, maxY };
}

describe("composeBind — determinism and the stroke law", () => {
  it("is a pure function: same record → byte-identical composition", () => {
    for (const r of RECORDS) {
      const a = composeBind(r);
      const b = composeBind(r);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    }
  });

  it("every mark's weight is in the enumerated stroke set", () => {
    for (const r of RECORDS) {
      for (const m of composeBind(r).marks) {
        expect(STROKE_WEIGHTS).toContain(m.weight);
      }
    }
  });

  it("emits no NaN geometry", () => {
    for (const r of RECORDS) {
      for (const m of composeBind(r).marks) {
        expect(primitiveD(m)).not.toMatch(/NaN/);
        expect(primitiveLength(m)).toBeGreaterThan(0);
      }
    }
  });

  it("skill-class binds carry no armature polygon and no prime seal ring", () => {
    for (const r of RECORDS.filter((x) => x.class === "skill")) {
      const marks = composeBind(r).marks;
      expect(marks.some((m) => m.role === "armature")).toBe(false);
      expect(
        marks.some((m) => m.kind === "circle" && m.cx === 0 && m.cy === 0 && m.role === "seal")
      ).toBe(false);
    }
  });
});

describe("glyph forge — budgets, width, distinguishability", () => {
  const glyphs = allGlyphs();

  it("stroke budgets hold per grade", () => {
    for (const { spec, source } of glyphs) {
      const n = spec.descriptors.length;
      if (spec.grade === "major") {
        expect(n, source).toBeGreaterThanOrEqual(3);
        expect(n, source).toBeLessThanOrEqual(10);
      } else {
        expect(n, source).toBeGreaterThanOrEqual(3);
        expect(n, source).toBeLessThanOrEqual(6);
      }
    }
  });

  it("stays inside the glyph box (+ bulge/terminal margins)", () => {
    for (const { spec, source } of glyphs) {
      for (const p of spec.primitives) {
        const b = primitiveBounds(p);
        expect(b.minX, source).toBeGreaterThanOrEqual(-(GLYPH_BOX.w / 2 + 4));
        expect(b.maxX, source).toBeLessThanOrEqual(GLYPH_BOX.w / 2 + 4);
        expect(b.minY, source).toBeGreaterThanOrEqual(-(GLYPH_BOX.h / 2 + 3.5));
        expect(b.maxY, source).toBeLessThanOrEqual(GLYPH_BOX.h / 2 + 3.5);
      }
    }
  });

  it("meets the width floor — a letter spans at least two columns", () => {
    for (const { spec, source } of glyphs) {
      let minX = Infinity;
      let maxX = -Infinity;
      for (const p of spec.primitives) {
        const b = primitiveBounds(p);
        minX = Math.min(minX, b.minX);
        maxX = Math.max(maxX, b.maxX);
      }
      expect(maxX - minX, source).toBeGreaterThanOrEqual(4);
    }
  });

  it("the name is the seed: forging twice is identical", () => {
    for (const { spec, seedTag } of glyphs.slice(0, 8)) {
      const again = forgeGlyph(spec.name, spec.grade, seedTag);
      expect(again.fingerprint).toBe(spec.fingerprint);
      expect(JSON.stringify(again.primitives)).toBe(JSON.stringify(spec.primitives));
    }
  });

  it("no two same-grade glyphs share a fingerprint, and pairs differ in ≥2 descriptors", () => {
    for (const grade of ["major", "minor"] as const) {
      const set = glyphs.filter((g) => g.spec.grade === grade);
      for (let i = 0; i < set.length; i++) {
        for (let j = i + 1; j < set.length; j++) {
          const a = set[i].spec;
          const b = set[j].spec;
          expect(a.fingerprint, `${set[i].source} vs ${set[j].source}`).not.toBe(b.fingerprint);
          const bDesc = new Set(b.descriptors);
          const aDesc = new Set(a.descriptors);
          const diff =
            a.descriptors.filter((d) => !bDesc.has(d)).length +
            b.descriptors.filter((d) => !aDesc.has(d)).length;
          expect(diff, `${set[i].source} vs ${set[j].source}`).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it("ideograms cap at six marks", () => {
    for (const r of RECORDS) {
      expect(forgeIdeogram(r.name, r.seedTag).length).toBeLessThanOrEqual(6);
    }
  });
});

describe("the apparatus — annotation budgets", () => {
  it("≤5 notes, every text ≤28 chars, uppercase, present on every record", () => {
    for (const r of RECORDS) {
      const notes = composeBind(r).apparatus;
      expect(notes.length).toBeGreaterThanOrEqual(3);
      expect(notes.length).toBeLessThanOrEqual(5);
      for (const n of notes) {
        expect(n.text.length, n.text).toBeLessThanOrEqual(28);
        expect(n.text).toBe(n.text.toUpperCase());
        expect(n.leader.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe("sampleBind — the inscription contract", () => {
  it("returns exactly the requested count, ranks in inscription order, homes in [-0.5, 0.5]", () => {
    for (const r of RECORDS) {
      const c = composeBind(r);
      const s = sampleBind(c, 2200, r.id);
      expect(s.count).toBe(2200);
      for (let i = 0; i < s.count; i++) {
        expect(s.rank[i]).toBe(i);
        expect(Math.abs(s.home[i * 2])).toBeLessThanOrEqual(0.5);
        expect(Math.abs(s.home[i * 2 + 1])).toBeLessThanOrEqual(0.5);
      }
    }
  });

  it("is deterministic per seed key", () => {
    const c = composeBind(RECORDS[0]);
    const a = sampleBind(c, 1000, RECORDS[0].id);
    const b = sampleBind(c, 1000, RECORDS[0].id);
    expect([...a.home]).toEqual([...b.home]);
    expect([...a.seed]).toEqual([...b.seed]);
  });

  it("survives a starved budget by degrading, still exact", () => {
    const dense = [...RECORDS].sort(
      (x, y) =>
        composeBind(y).marks.reduce((s, m) => s + primitiveLength(m), 0) -
        composeBind(x).marks.reduce((s, m) => s + primitiveLength(m), 0)
    )[0];
    const s = sampleBind(composeBind(dense), 200, dense.id);
    expect(s.count).toBe(200);
  });
});
