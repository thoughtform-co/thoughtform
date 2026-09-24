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
import {
  COLUMN_MAX,
  COLUMN_MIN,
  COLUMN_OPEN_SHARE,
  COLUMN_SHARE,
  FEED_RIDE_FROM,
  FEED_RIDE_TO,
  columnWidths,
  feedShift,
  type GalleryPost,
} from "../../app/(internal)/test/musings-gallery/directions/kit";
import { lanesOf } from "../../app/(internal)/test/musings-gallery/directions/Missions";
import {
  ellipseAtBearing,
  phasePath,
} from "../../app/(internal)/test/musings-gallery/directions/AboutCovers";
import {
  GLYPH_RAMP,
  MOSAIC_MIN,
  cellStats,
  glyphAlpha,
  glyphIndex,
  mosaicCols,
  normaliseCover,
  poppedCells,
  popHash,
} from "../../app/(internal)/test/musings-gallery/directions/glyphRaster";
import { revealPop } from "@/lib/services-ring/reveal";
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

  it("a direction that reads a cover declares its default, and the capture shoots every id", () => {
    for (const id of MG_DIRECTION_IDS) {
      const d = MG_DIRECTIONS[id];
      if (d.knobs?.includes("cover")) expect(d.cover, id).toBeDefined();
      if (d.cover) expect(d.knobs, id).toContain("cover");
      /* The raster knob the same way: a default wherever the console shows it. */
      if (d.knobs?.includes("raster")) expect(d.raster, id).toBeTypeOf("boolean");
      if (d.raster !== undefined) expect(d.knobs, id).toContain("raster");
    }
    // ⚠ The capture keeps its own id list (a .mjs cannot import the registry);
    // a direction missing from it is a still nobody shoots.
    const capture = readFileSync(join(ROOT, "scripts", "capture-musings-gallery.mjs"), "utf8");
    const dflt = /arg\("--v",\s*"([^"]+)"\)/.exec(capture)?.[1]?.split(",") ?? [];
    expect(dflt).toEqual([...MG_DIRECTION_IDS]);
  });
});

describe("round three — the arithmetic the sheets carry", () => {
  it("v6: the feed rides the runway between the row's arrival and just before it closes", () => {
    expect(feedShift(0, 400)).toBe(0);
    expect(feedShift(FEED_RIDE_FROM, 400)).toBe(0);
    expect(feedShift(FEED_RIDE_TO, 400)).toBe(-400);
    expect(feedShift(0.99, 400)).toBe(-400);
    expect(feedShift((FEED_RIDE_FROM + FEED_RIDE_TO) / 2, 400)).toBeCloseTo(-200, 6);
    // No overflow, no ride — three notes on any frame.
    expect(feedShift(0.5, 0)).toBe(0);
    expect(feedShift(Number.NaN, 400)).toBe(0);
    // ⚠ The row closes at 0.95 (ROW_ARRIVE_END); the ride must be done before.
    expect(FEED_RIDE_TO).toBeLessThan(0.95);
    expect(FEED_RIDE_FROM).toBeGreaterThanOrEqual(0.1);
    // The sheet's own copy of the constants.
    const css = readFileSync(join(LAB, "musings-gallery-lab.css"), "utf8");
    expect(css).toContain(
      `--mg-feed-t: clamp(0, calc((var(--mg-p, 0) - ${FEED_RIDE_FROM}) / ${+(FEED_RIDE_TO - FEED_RIDE_FROM).toFixed(2)}), 1)`
    );
  });

  it("v7: three notes give Prime Intellect's proportions, five hold the floor, seven rail", () => {
    const three = columnWidths(3, 1200);
    expect(three.closed / 1200).toBeCloseTo(0.26, 2);
    expect(three.open / 1200).toBeCloseTo(0.48, 2);
    expect(three.overflow).toBe(false);
    const five = columnWidths(5, 1200);
    expect(five.closed).toBe(COLUMN_MIN);
    expect(five.open / 1200).toBeCloseTo(COLUMN_OPEN_SHARE, 2);
    expect(five.overflow).toBe(false);
    const seven = columnWidths(7, 1200);
    expect(seven.closed).toBe(COLUMN_MIN);
    expect(seven.overflow).toBe(true);
    // The narrow band: the cap and the floor both bind somewhere.
    expect(columnWidths(3, 979).closed).toBeCloseTo(0.26 * 979, 6);
    expect(columnWidths(2, 2000).closed).toBe(COLUMN_MAX);
    // The sheet's own copy.
    const css = readFileSync(join(LAB, "musings-gallery-lab.css"), "utf8");
    expect(css).toContain(
      `--mg-cl-col: max(${COLUMN_MIN}px, min(${COLUMN_SHARE * 100}cqw, ${COLUMN_MAX}px, calc(${(1 - COLUMN_OPEN_SHARE) * 100}cqw / max(1, var(--mu-n, 3) - 1))))`
    );
    expect(css).toContain(`flex-basis: max(var(--mg-cl-col), ${COLUMN_OPEN_SHARE * 100}cqw)`);
  });

  it("v9: every note lands in its beat's lane, in the Arc's order, and an unfiled note opens PRACTICE", () => {
    const lab: GalleryPost[] = LAB_MUSINGS.map((c) => ({
      ...c,
      outline: LAB_OUTLINES[c.slug],
      author: "Vince Buyssens",
    }));
    const lanes = lanesOf(lab);
    expect(lanes.map((l) => l.id)).toEqual(["navigate", "encode", "build"]);
    expect(lanes.reduce((n, l) => n + l.entries.length, 0)).toBe(lab.length);
    for (const l of lanes) for (const p of l.entries) expect(p.tags).toContain(l.id);
    const unfiled = lanesOf([{ ...lab[0], tags: ["practice"] }]);
    expect(unfiled.map((l) => l.id)).toEqual(["navigate", "encode", "build", "practice"]);
    expect(unfiled[3].entries).toHaveLength(1);
  });
});

describe("round six — the glyph raster and the About covers", () => {
  it("the pop hash is the shader's, deterministic, and its popped share tracks revealPop", () => {
    expect(popHash(3, 7, 0.25)).toBe(popHash(3, 7, 0.25));
    expect(popHash(3, 7, 0.25)).not.toBe(popHash(3, 7, 0.26));
    for (let i = 0; i < 200; i++) {
      const h = popHash(i % 17, i % 23, 0.4);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(1);
    }
    for (const r of [0.2, 0.5, 0.8]) {
      const cells = poppedCells(40, 40, 0.37, r);
      const share = cells.filter(Boolean).length / cells.length;
      expect(Math.abs(share - revealPop(r)), `r ${r}`).toBeLessThan(0.05);
    }
    // The ends: nothing popped at rest, everything at the whole reveal.
    expect(poppedCells(24, 24, 0.1, 0).some(Boolean)).toBe(false);
    expect(poppedCells(24, 24, 0.1, 1).every(Boolean)).toBe(true);
  });

  it("the mosaic starts coarse and ends at the canvas's own pixels", () => {
    expect(mosaicCols(480, 0)).toBe(MOSAIC_MIN);
    expect(mosaicCols(480, 0.1)).toBe(MOSAIC_MIN);
    expect(mosaicCols(480, 1)).toBe(480);
    expect(mosaicCols(480, 0.6)).toBeGreaterThan(MOSAIC_MIN);
    expect(mosaicCols(480, 0.6)).toBeLessThan(480);
  });

  it("coverage is normalised over the INK, never the air, and every glyph is on the ramp", () => {
    // A line drawing: most cells empty, a few faint, one dense.
    const cover = Float32Array.from([0, 0, 0, 0, 0.02, 0.04, 0.06, 0.3, 0, 0]);
    const lum = normaliseCover(cover);
    expect(lum[0]).toBe(0);
    expect(lum[4]).toBe(0);
    expect(lum[7]).toBe(1);
    expect(lum[5]).toBeGreaterThan(0);
    expect(lum[5]).toBeLessThan(1);
    for (let l = 0; l <= 1.0001; l += 0.05) {
      expect(glyphIndex(l)).toBeGreaterThanOrEqual(0);
      expect(glyphIndex(l)).toBeLessThan(GLYPH_RAMP.length);
    }
    // Below the skip floor a cell letters nothing; every third row keeps .55.
    expect(glyphAlpha(0.01, 0)).toBe(0);
    expect(glyphAlpha(1, 2)).toBeCloseTo(glyphAlpha(1, 0) * 0.55, 6);
  });

  it("cell statistics weigh colour by alpha, so a faint gold ring letters in gold", () => {
    // 4 × 2 px: the left cell half gold at full alpha, the right cell empty.
    const w = 4;
    const h = 2;
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < 2; x++) data.set([202, 165, 84, 255], (y * w + x) * 4);
    const s = cellStats(data, w, h, 2, 1);
    expect(s.cover[0]).toBeGreaterThan(0.99);
    expect(s.cover[1]).toBe(0);
    expect([...s.rgb.slice(0, 3)].map(Math.round)).toEqual([202, 165, 84]);
  });

  it("a ray on a bearing meets a circle at its radius, and the phase disc is one closed path", () => {
    const p = ellipseAtBearing({ rx: 100, ry: 100, deg: 30 }, 90);
    expect(p.x).toBeCloseTo(100, 6);
    expect(p.y).toBeCloseTo(0, 6);
    const q = ellipseAtBearing({ rx: 160, ry: 60, deg: 0 }, 0);
    expect(q.y).toBeCloseTo(-60, 6);
    for (const k of [0.1, 0.5, 0.9]) expect(phasePath(0, 0, 10, k)).toMatch(/^M .* Z$/);
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
    author: allPosts()[i].author,
  }));
  const lab: GalleryPost[] = LAB_MUSINGS.map((c) => ({
    ...c,
    outline: LAB_OUTLINES[c.slug],
    author: "Vince Buyssens",
  }));

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
