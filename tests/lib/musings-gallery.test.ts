import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  layoutMap,
  MAP_COLS,
  MAP_ROWS,
} from "../../app/(internal)/test/musings-gallery/directions/MemoryMap";
import {
  MG_DIRECTIONS,
  MG_DIRECTION_IDS,
  MG_GALLERIES,
} from "../../app/(internal)/test/musings-gallery/directions/registry";
import type { GalleryPost } from "../../app/(internal)/test/musings-gallery/directions/kit";
import { LAB_OUTLINES } from "../../app/(internal)/test/musings-gallery/outlines";
import { LAB_MUSINGS } from "../../app/(internal)/test/musings-row/placeholders";
import { cardsFor } from "@/lib/musings/cards";
import { MUSINGS_COPY_BANS } from "@/lib/musings/copyLaw";
import { outlineOf } from "@/lib/musings/outline";
import { allPosts } from "@/lib/musings/registry";

/**
 * `/test/musings-gallery` — the directions for what sits under the musings
 * head. A lab page is mechanically unguarded unless something walks it
 * (`.claude/rules/proof.md`'s config-lab lesson), so this walks the three
 * things that would fail silently: a direction reaching into the station's
 * decode, a client file dragging the registry into a public chunk, and
 * placeholder copy that breaks the law the real notes keep.
 */

const ROOT = join(__dirname, "..", "..");
const LAB = join(ROOT, "app", "(internal)", "test", "musings-gallery");

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const sources = walk(LAB).filter((f) => /\.(tsx?|css)$/.test(f));

describe("the lab stays out of the station's own machinery", () => {
  it("no direction carries `data-mu-decode` or `data-mu-cursor`", () => {
    // The station's writer collects both from the whole `.mu` subtree — a
    // direction mounted in the `gallery` slot is inside it, and an attribute
    // here would be scrambled and would stretch the head's clock.
    for (const f of sources.filter((s) => /\.tsx?$/.test(s))) {
      const src = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      expect(src, f).not.toMatch(/data-mu-decode|data-mu-cursor/);
    }
  });

  it("no client file imports the registry or the MDX renderer", () => {
    // Both are `server-only`; the page projects the record and the outline
    // server-side so a post's body never reaches a client chunk.
    for (const f of sources.filter((s) => /\.tsx?$/.test(s))) {
      const src = readFileSync(f, "utf8");
      if (!/^["']use client["']/.test(src.trimStart())) continue;
      expect(src, f).not.toMatch(/lib\/musings\/(registry|mdx)/);
    }
  });

  it("every registered direction but the control has a drawing", () => {
    for (const id of MG_DIRECTION_IDS) {
      expect(MG_DIRECTIONS[id].id).toBe(id);
      expect(MG_DIRECTIONS[id].provenance.length).toBeGreaterThan(10);
      if (id !== "v0") expect(MG_GALLERIES[id]).toBeTypeOf("function");
    }
  });
});

describe("the placeholders keep the law the real notes keep", () => {
  it("every placeholder has an outline, and it agrees with its reading time", () => {
    for (const p of LAB_MUSINGS) {
      const o = LAB_OUTLINES[p.slug];
      expect(o, p.slug).toBeDefined();
      expect(o.sections.reduce((n, s) => n + s.words, 0)).toBe(o.words);
      expect(Math.abs(Math.round(o.words / 220) - p.readingMinutes), p.slug).toBeLessThanOrEqual(1);
    }
  });

  it("the placeholder headings pass the musings copy law", () => {
    for (const o of Object.values(LAB_OUTLINES))
      for (const s of o.sections)
        if (s.heading)
          for (const [re, why] of MUSINGS_COPY_BANS) expect(s.heading, why).not.toMatch(re);
  });
});

describe("the memory map (v5) — area is the words", () => {
  const live: GalleryPost[] = cardsFor(allPosts()).map((c, i) => ({
    ...c,
    outline: outlineOf(allPosts()[i].body),
  }));
  const lab: GalleryPost[] = LAB_MUSINGS.map((c) => ({ ...c, outline: LAB_OUTLINES[c.slug] }));

  for (const [name, set] of [
    ["live", live],
    ["lab 5", lab.slice(0, 5)],
    ["lab 7", lab],
  ] as const) {
    it(`${name}: the runs fill all 128 cells, in order, one per note`, () => {
      const runs = layoutMap(set);
      expect(runs.reduce((n, r) => n + r.length, 0)).toBe(MAP_COLS * MAP_ROWS);
      let at = 0;
      for (const r of runs) {
        expect(r.start).toBe(at);
        at += r.length;
        // Every section starts inside its run, the first at the run's own start.
        expect(r.sectionStarts[0]).toBe(0);
        for (const s of r.sectionStarts) expect(s).toBeLessThan(r.length);
        // The label sits on a real segment of its own run.
        expect(r.label.span).toBeGreaterThanOrEqual(1);
        const first = r.label.row * MAP_COLS + r.label.col;
        expect(first).toBeGreaterThanOrEqual(r.start);
        expect(first + r.label.span).toBeLessThanOrEqual(r.start + r.length);
      }
    });
  }

  it("a longer note takes more cells", () => {
    const runs = layoutMap(lab);
    const byWords = [...runs].sort((a, b) => a.post.outline.words - b.post.outline.words);
    for (let i = 1; i < byWords.length; i += 1)
      expect(byWords[i].length).toBeGreaterThanOrEqual(byWords[i - 1].length);
  });
});
