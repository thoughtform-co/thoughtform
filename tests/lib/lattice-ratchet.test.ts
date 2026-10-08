/**
 * ADR-149 — the lattice's ratchet: four counts per production sheet, pinned at
 * what the site carried the day the grid was declared, allowed only to go DOWN.
 *
 * The survey behind ADR-149 found ~73 hand-written corner polygons on four lip
 * techniques, spacing in 40+ px literals per area, eight separate type ladders
 * and ~35 breakpoints a pixel or twenty apart. None of that is fixed by writing
 * tokens; it is fixed sheet by sheet, and this test is what makes each sheet's
 * number a ratchet rather than a hope (ADR-092's own pattern, `cssBlocks`'s
 * walker, the same slack law).
 *
 *   P — `clip-path: polygon(` declarations. A housing migrated to `.lat-frame`
 *       takes its polygon with it; the count falls.
 *   S — `padding*` / `margin*` / `gap*` declarations carrying a px literal
 *       that is not on the 8px scale (0, 1px and 2px hairlines exempt). A
 *       `clamp()` counts by its endpoints.
 *   F — `font-size:` declarations whose value is not a single `var()`.
 *   M — `@media` width / height thresholds outside `lib/lattice/breakpoints.ts`.
 *
 * ⚠ FRAME SHEETS ARE NOT LISTED and frame blocks inside content sheets are
 * skipped (`FRAME_SEL`, the type ratchet's own): the HUD frame is the datum and
 * is never swept (ADR-092). `lattice.css` enters at 0/0/0/0 and may never rise.
 *
 * Pinning a sheet: `LATTICE_PINS=print npx vitest run tests/lib/lattice-ratchet.test.ts`
 * prints every sheet's counts in the shape below. A new production sheet enters
 * this map the hour it is written, at its real count, or it is unswept.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { lawfulThresholds } from "../../lib/lattice/breakpoints";
import { blocks, stripComments } from "./helpers/cssBlocks";

const ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

type Counts = { P: number; S: number; F: number; M: number };

/** The production sheets, pinned 2026-10-06 at Phase 0 of ADR-149. */
const PINS: Record<string, Counts> = {
  "app/styles/lattice.css": { P: 0, S: 0, F: 0, M: 0 },
  /* The recipes (Phase 1). P is ZERO by construction: every cut is a custom
     property (`--lat-cut` / `--lat-ring`) the host and the ring READ, so no
     `clip-path: polygon(` is ever written — the one place the site's corner
     text lives is geometry.ts, and `lattice-tokens` pins the sheet to it. */
  "components/lattice/lattice.css": { P: 0, S: 0, F: 0, M: 0 },
  "components/instrument/instrument.css": { P: 0, S: 16, F: 6, M: 0 },
  "app/styles/variables.css": { P: 0, S: 0, F: 0, M: 2 },
  "components/landing/v7/landing.css": { P: 1, S: 232, F: 203, M: 18 },
  "components/landing/v7/site-footer/site-footer.css": { P: 0, S: 13, F: 8, M: 0 },
  "components/landing/v7/tools-cards/tools-cards.css": { P: 0, S: 32, F: 15, M: 1 },
  "components/landing/home-v2/home-v2.css": { P: 0, S: 50, F: 52, M: 5 },
  "components/landing/home-v2/services/services.css": { P: 2, S: 58, F: 46, M: 1 },
  "components/landing/home-v2/services/proof-stack/proof-stack.css": { P: 8, S: 38, F: 6, M: 1 },
  "components/landing/home-v2/services/casefile/casefile.css": { P: 9, S: 196, F: 82, M: 23 },
  "components/landing/home-v2/services/casefile/console/console.css": { P: 2, S: 9, F: 1, M: 1 },
  "components/landing/home-v2/services/casefile/map/pda/pda.css": { P: 0, S: 13, F: 2, M: 1 },
  "components/landing/home-v2/about/about-stage.css": { P: 0, S: 1, F: 0, M: 0 },
  "components/landing/home-v2/about/about-band.css": { P: 0, S: 2, F: 0, M: 0 },
  "components/landing/home-v2/voidwalker/voidwalker.css": { P: 1, S: 23, F: 17, M: 2 },
  "components/landing/home-v2/voidwalker/voidwalker-wire.css": { P: 1, S: 39, F: 1, M: 0 },
  "components/landing/home-v2/voidwalker/voidwalker-travel.css": { P: 0, S: 3, F: 1, M: 0 },
  "components/landing/home-v2/voidwalker/hologram/voidwalker-hologram.css": {
    P: 0,
    S: 2,
    F: 0,
    M: 0,
  },
  "components/landing/home-v2/voidwalker/hologram/voidwalker-datum.css": {
    P: 3,
    S: 27,
    F: 21,
    M: 1,
  },
  "components/landing/home-v2/musings/musings.css": { P: 0, S: 15, F: 7, M: 1 },
  "components/sheet/sheet.css": { P: 4, S: 37, F: 0, M: 0 },
  "components/sheet/instrument.css": { P: 4, S: 18, F: 0, M: 1 },
  /* The Home sessions page (ADR-150): every cut is `.lat-frame`'s, so it
     enters at zero and may never rise. */
  "components/sessions/sessions.css": { P: 0, S: 0, F: 0, M: 0 },
  "components/arcs/arcs.css": { P: 6, S: 388, F: 263, M: 14 },
  "components/arcs/course.css": { P: 0, S: 30, F: 17, M: 0 },
  "components/arcs/prompt-to-loop/prompt-to-loop.css": { P: 0, S: 89, F: 61, M: 3 },
};

/** Frame blocks inside content sheets — never swept (type-material-tokens' own list). */
const FRAME_SEL = /(^|[\s,>+~])\.(hud\b|hud__|hud-nav|rail-manifest|rin-|home-v2-mobile-signal)/;

const SPACING_PROP = /^(padding|margin|gap|row-gap|column-gap|padding-[a-z-]+|margin-[a-z-]+)$/;
const PX = /(-?\d+(?:\.\d+)?)px\b/g;

const offScale = (n: number): boolean => {
  const a = Math.abs(n);
  if (a === 0 || a === 1 || a === 2) return false;
  return a % 8 !== 0;
};

export function countSheet(css: string): Counts {
  const clean = stripComments(css);
  let P = 0;
  let S = 0;
  let F = 0;
  for (const b of blocks(clean)) {
    if (FRAME_SEL.test(b.path)) continue;
    for (const raw of b.decls.split(";")) {
      const decl = raw.trim();
      const colon = decl.indexOf(":");
      if (colon < 0) continue;
      const prop = decl.slice(0, colon).trim();
      const value = decl.slice(colon + 1).trim();
      if (prop === "clip-path" && /polygon\(/.test(value)) P += 1;
      if (SPACING_PROP.test(prop)) {
        const nums = Array.from(value.matchAll(PX)).map((m) => Number(m[1]));
        if (nums.some(offScale)) S += 1;
      }
      if (prop === "font-size" && !/^var\(--[a-z0-9-]+\)$/.test(value)) F += 1;
    }
  }
  let M = 0;
  const width = lawfulThresholds("width");
  const height = lawfulThresholds("height");
  for (const m of clean.matchAll(/@media[^{]*/g)) {
    for (const t of m[0].matchAll(/(max|min)-(width|height)\s*:\s*([\d.]+)px/g)) {
      const set = t[2] === "width" ? width : height;
      if (!set.has(Number(t[3]))) M += 1;
    }
  }
  return { P, S, F, M };
}

const SLACK = 10;

describe("the lattice ratchet (ADR-149)", () => {
  if (process.env.LATTICE_PINS === "print") {
    it("prints today's counts", () => {
      const lines = Object.keys(PINS).map((rel) => {
        const c = countSheet(read(rel));
        return `  "${rel}": { P: ${c.P}, S: ${c.S}, F: ${c.F}, M: ${c.M} },`;
      });
      console.log(`\n${lines.join("\n")}\n`);
    });
    return;
  }

  it.each(Object.entries(PINS))("%s stays at or under its pins", (rel, pin) => {
    const c = countSheet(read(rel));
    for (const k of ["P", "S", "F", "M"] as const) {
      expect(c[k], `${rel} ${k}: ${c[k]} against a pin of ${pin[k]}`).toBeLessThanOrEqual(pin[k]);
      expect(
        pin[k] - c[k],
        `${rel} ${k}: pin ${pin[k]} is slack against ${c[k]}`
      ).toBeLessThanOrEqual(SLACK);
    }
  });

  it("lattice.css is pinned exact at zero", () => {
    expect(PINS["app/styles/lattice.css"]).toEqual({ P: 0, S: 0, F: 0, M: 0 });
    expect(countSheet(read("app/styles/lattice.css"))).toEqual({ P: 0, S: 0, F: 0, M: 0 });
  });
});
