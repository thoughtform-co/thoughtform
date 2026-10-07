/**
 * ADR-149 — the lattice's tokens are pinned to the things they claim to be.
 *
 * `app/styles/lattice.css` says its rungs are the rail's 13-tick ladder, its
 * chamfer ladder is `lib/lattice/geometry.ts`'s, its inner-leg constant is the
 * one four sheets used to spell three ways, and its tokens live on `:root`
 * alone. Each claim is a line here, read off the files rather than restated,
 * so the sheet cannot drift from the arithmetic it documents.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CHAMFER,
  CHAMFER_FLUID,
  CUTS,
  LEG,
  LEG_PX,
  cutPolygon,
  normalisePolygon,
  ringPolygon,
} from "../../lib/lattice/geometry";
import { LATTICE_BREAKPOINTS, lawfulThresholds } from "../../lib/lattice/breakpoints";
import { blocks, stripComments } from "./helpers/cssBlocks";

const ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const LATTICE = "app/styles/lattice.css";
const THEME = "components/landing/v7/theme.css";
const TICKS = "lib/v7-parse/hudTicks.ts";
const VARIABLES = "app/styles/variables.css";

const token = (css: string, name: string): string => {
  const m = stripComments(css).match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`${name} is not declared`);
  return m[1].replace(/\s+/g, " ").trim();
};

describe("the lattice is loaded from globals, never from the HUD's datum", () => {
  it("globals.css imports lattice.css after variables.css", () => {
    const g = read("app/globals.css");
    const v = g.indexOf('@import "./styles/variables.css"');
    const l = g.indexOf('@import "./styles/lattice.css"');
    const b = g.indexOf('@import "./styles/base.css"');
    expect(v).toBeGreaterThan(-1);
    expect(l).toBeGreaterThan(v);
    expect(b).toBeGreaterThan(l);
  });

  it("landing.css's first :root block carries no --lat-* token", () => {
    const landing = read("components/landing/v7/landing.css");
    const root = landing.slice(
      landing.indexOf(":root {"),
      landing.indexOf("}", landing.indexOf(":root {"))
    );
    expect(root).not.toContain("--lat-");
  });
});

describe("every --lat-* declaration lives on :root or the light root", () => {
  it("lattice.css declares only on :root", () => {
    for (const b of blocks(stripComments(read(LATTICE)))) {
      if (!/--lat-[a-z0-9-]+\s*:/.test(b.decls)) continue;
      expect(b.path.replace(/\s+/g, " ").trim()).toMatch(/^(@media \([^)]+\) )?:root$/);
    }
  });

  it('theme.css re-derives on html[data-theme="light"] alone, colours only', () => {
    const theme = stripComments(read(THEME));
    for (const b of blocks(theme)) {
      const decls = b.decls
        .split(";")
        .map((d) => d.trim())
        .filter((d) => d.startsWith("--lat-"));
      if (decls.length === 0) continue;
      expect(b.path.trim()).toBe('html[data-theme="light"]');
      for (const d of decls) {
        // an alpha or an opaque ground — never a length, never a rung
        expect(d).toMatch(/^--lat-[a-z0-9-]+:\s*rgba?\(var\(--(dawn|void-deep)-rgb\)/);
      }
    }
  });
});

describe("the rungs ARE the rail's 13-tick ladder", () => {
  const css = read(LATTICE);
  const ticks = read(TICKS);
  const left = ticks.slice(ticks.indexOf("const LEFT_TICKS"), ticks.indexOf("const RIGHT_TICKS"));
  const yPcts = Array.from(left.matchAll(/yPct:\s*([\d.]+)/g)).map((m) => Number(m[1]));

  it("hudTicks declares thirteen positions", () => {
    expect(yPcts).toHaveLength(13);
  });

  it.each(yPcts.map((y, n) => [n, y] as const))("rung %i is at %f %", (n, yPct) => {
    const decl = token(css, `--lat-rung-${n}`);
    if (n === 0) {
      expect(decl).toBe("var(--lat-rail-top)");
      return;
    }
    if (n === 12) {
      expect(decl).toBe("calc(var(--lat-rail-top) + var(--lat-rail-h))");
      return;
    }
    expect(decl).toBe(`calc(var(--lat-rail-top) + var(--lat-rail-h) * ${n} / 12)`);
    expect(Math.abs((n / 12) * 100 - yPct)).toBeLessThan(0.01);
  });

  it("the majors are the lettered bearings (33.33 % and 66.67 %)", () => {
    const majors = Array.from(left.matchAll(/yPct:\s*([\d.]+),\s*major:\s*true/g)).map((m) =>
      Number(m[1])
    );
    expect(majors).toEqual([33.33, 66.67]);
    expect(token(css, "--lat-major-a")).toBe("var(--lat-rung-4)");
    expect(token(css, "--lat-major-b")).toBe("var(--lat-rung-8)");
  });

  it("the rail box is the HUD's own", () => {
    expect(token(css, "--lat-rail-top")).toBe("var(--hud-rail-y-start)");
    expect(token(css, "--lat-rail-bot")).toBe("var(--hud-rail-y-end)");
  });

  it("the phone re-declares every rung's inputs rather than leaving them unset", () => {
    const phone = blocks(stripComments(css)).find((b) => /max-width: 960px/.test(b.path));
    expect(phone).toBeTruthy();
    for (const name of ["--lat-rail-top", "--lat-rail-bot", "--lat-rail-h", "--lat-cols"]) {
      expect(phone!.decls).toContain(`${name}:`);
    }
  });
});

describe("the chamfer ladder is geometry.ts's", () => {
  const css = read(LATTICE);
  it("chrome / seed / plate", () => {
    expect(token(css, "--lat-ch-chrome")).toBe(`${CHAMFER.chrome}px`);
    expect(token(css, "--lat-ch-seed")).toBe(`${CHAMFER.seed}px`);
    expect(token(css, "--lat-ch-plate")).toBe(`${CHAMFER.plate}px`);
  });
  it("the two live responsive rungs, byte-equal to the sheets that draw them", () => {
    expect(token(css, "--lat-ch-card")).toBe(CHAMFER_FLUID.card);
    expect(token(css, "--lat-ch-plate-fluid")).toBe(CHAMFER_FLUID.plateFluid);
    // Phase 2 (2026-10-06): the sheet READS the rung now, by reference and
    // with no fallback — the pin moved from the literal to the alias.
    expect(token(read("components/sheet/sheet.css"), "--sh-card-ch")).toBe("var(--lat-ch-card)");
    expect(
      token(read("components/landing/home-v2/services/proof-stack/proof-stack.css"), "--pf-card-ch")
    ).toBe(CHAMFER_FLUID.card);
  });
  it("the inner leg is d(2 − √2), written once", () => {
    expect(Number.parseFloat(LEG_PX)).toBeCloseTo(LEG, 3);
    expect(token(css, "--lat-ch-leg")).toBe(LEG_PX);
  });
  it.each([
    ["components/sheet/sheet.css", "--sh-card-ch-in"],
    ["components/sheet/instrument.css", "--log-ch-in"],
    ["components/arcs/arcs.css", "--arc-plate-ch-in"],
    ["components/arcs/arcs.css", "--arc-frame-ch-in"],
  ])("%s's %s reads the constant", (sheet, name) => {
    expect(token(read(sheet), name)).toContain("var(--lat-ch-leg)");
  });
});

describe("the line law and the band are references, not restatements", () => {
  const css = read(LATTICE);
  it("datum and seam are the rail's own track", () => {
    expect(token(css, "--lat-datum")).toBe("var(--hud-rail-line)");
    expect(token(css, "--lat-seam")).toBe("var(--hud-rail-line-soft)");
  });
  it("the band is ADR-048's", () => {
    expect(token(css, "--lat-margin")).toBe("var(--band-margin)");
    expect(token(css, "--lat-max")).toBe("var(--band-max)");
    expect(token(css, "--lat-wide-margin")).toBe("var(--instrument-margin)");
  });
  it("the type base is the band's copy size at the casefile's ratio", () => {
    expect(token(css, "--lat-copy")).toBe("var(--band-copy)");
    expect(token(css, "--lat-ratio")).toBe("1.2");
  });
});

describe("the spacing scale is one scale", () => {
  it("DESIGN.md's frontmatter agrees with variables.css", () => {
    const design = read("DESIGN.md");
    const fm = design.slice(0, design.indexOf("\n---", 4));
    const spacing = fm.slice(fm.indexOf("spacing:"), fm.indexOf("components:"));
    const vars = read(VARIABLES);
    for (const [k, v] of Array.from(spacing.matchAll(/^\s+(\w+):\s*(\d+px)$/gm)).map((m) => [
      m[1],
      m[2],
    ])) {
      expect(token(vars, `--space-${k}`)).toBe(v);
    }
  });
});

describe("the breakpoint ladder is well-formed", () => {
  it("every rung's max is even and its min is max + 1", () => {
    for (const r of LATTICE_BREAKPOINTS) expect(r.max % 2).toBe(0);
    expect(lawfulThresholds("width").has(961)).toBe(true);
    expect(lawfulThresholds("width").has(980)).toBe(false);
  });
  it("the sheet's comment table names every rung", () => {
    const css = read(LATTICE);
    for (const r of LATTICE_BREAKPOINTS) expect(css).toContain(`${r.name}`);
  });
});

describe("the frame recipe's polygons are geometry.ts's", () => {
  const RECIPES = "components/lattice/lattice.css";
  const sheet = blocks(stripComments(read(RECIPES)));

  /** The declaration block for one cut: `.lat-frame` carries the default
   *  (the TR + BL pair), `.lat-frame[data-cut="…"]` the rest. */
  const blockFor = (cut: string) => {
    const path = cut === "tr-bl" ? ".lat-frame" : `.lat-frame[data-cut="${cut}"]`;
    const b = sheet.find((x) => x.path.replace(/\s+/g, " ").trim() === path);
    if (!b) throw new Error(`${RECIPES} has no block for ${path}`);
    return b.decls;
  };

  /** Prettier breaks a long polygon over lines, which leaves one space
   *  inside each paren after `normalisePolygon`'s fold; the builder writes
   *  none. Tidy BOTH sides the same way, so the comparison is about points. */
  const tidy = (s: string): string =>
    normalisePolygon(s).replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");

  /** A custom property's value out of a declaration list, whitespace folded. */
  const local = (decls: string, name: string): string => {
    const m = decls.match(new RegExp(`${name}:\\s*([^;]+);`));
    if (!m) throw new Error(`${name} is not declared`);
    return tidy(m[1]);
  };

  it("the house default is the TR + BL pair, on the bare class", () => {
    expect(local(blockFor("tr-bl"), "--lat-cut")).toBe(tidy(cutPolygon("tr-bl")));
  });

  it.each(CUTS)("%s: the host's cut and the ring's two closed contours", (cut) => {
    const decls = blockFor(cut);
    // `none` is a square housing: the host takes no clip at all, the ring
    // still closes both contours (the builder's rectangle is the ring's).
    expect(local(decls, "--lat-cut")).toBe(cut === "none" ? "none" : tidy(cutPolygon(cut)));
    expect(local(decls, "--lat-ring")).toBe(tidy(ringPolygon(cut)));
  });

  it("there is no tl-br (the console's diagonal, retired by ADR-089)", () => {
    expect(sheet.some((b) => /data-cut="tl-br"/.test(b.path))).toBe(false);
  });

  it("the inner leg reads the one constant", () => {
    expect(local(blockFor("tr-bl"), "--lat-ch-in")).toBe("calc(var(--lat-ch) - var(--lat-ch-leg))");
  });

  it("declares no --lat-* token outside the recipe's own locals on .lat-frame", () => {
    // The tokens live on `:root` in app/styles/lattice.css; this sheet READS
    // them. The six locals below are the frame recipe's own knobs — a cut, a
    // ring, a depth and its inner leg, a line and a ground — and they may be
    // declared only on `.lat-frame` and its attribute variants.
    const LOCALS = new Set([
      "--lat-ch",
      "--lat-ch-in",
      "--lat-cut",
      "--lat-ring",
      "--lat-frame-line",
      "--lat-frame-ground",
    ]);
    for (const b of sheet) {
      for (const m of b.decls.matchAll(/(--lat-[a-z0-9-]+)\s*:/g)) {
        const name = m[1];
        expect(LOCALS.has(name), `${b.path} declares ${name}`).toBe(true);
        expect(b.path.trim(), `${name} declared off .lat-frame`).toMatch(
          /^\.lat-frame(\[[^\]]+\])?$/
        );
      }
    }
  });
});
