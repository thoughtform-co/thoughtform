/**
 * ADR-092 — the type ramps by role, and the ratchet that keeps the site on them.
 *
 * ADR-091 measured the proof casefile against two admired interfaces and found
 * the difference is COUNTS: 36 tracking rungs on this site against 4, 28 % of
 * weight declarations at 600+ against ~2 %, gold on ~282 bordered objects. This
 * test is the durable half of the answer. It counts, per production sheet, the
 * declarations that are still LITERALS rather than role tokens, and pins each
 * count.
 *
 * ⚠ THE PINS ARE A RATCHET. A content sheet's count may only go DOWN — a stage
 * that lands lowers its pins to what it left (ideally 0), and a count that comes
 * back UP fails here before it reaches a still. Raising a pin is a design change
 * and gets an ADR line. Frame sheets and frame blocks are pinned EXACT: the HUD
 * frame is the datum the content is seated into and is never swept (ADR-092).
 *
 * Idiom borrowed from theme-css-sweep: strip comments first (casefile.css's
 * prose quotes every banned form), and read the sheet as text rather than
 * through a CSS parser that would have to be a dependency.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

type Tier = "tokens" | "frame" | "content";
type Counts = { A: number; B: number; C: number };
type Pin = { tier: Tier; content: Counts; frame: Counts };

/**
 * The 24 production-public sheets — every sheet a public route imports (see
 * app/globals.css and the route page.tsx imports). Lab-only sheets under
 * components/ are deliberately absent. Pinned 2026-09-06 at stage 0.
 *
 *   A — `letter-spacing:` declarations whose value is not one of the four role
 *       tokens (`var(--track-copy|display|label|eyebrow)`) and not 0/normal.
 *       ⚠ A legacy `var(--track-wide)` COUNTS: it must still migrate.
 *   B — `font-weight:` at bold / 600–900, and the `font:` shorthand carrying one
 *       (casefile.css uses `font: 400 10px/1 …` widely; a weight regex alone
 *       misses `font: 700 …`). `@font-face` blocks are stripped first.
 *   C — blocks that declare PP Neue Montreal AND `text-transform: uppercase`
 *       (blind spot: family and transform in different blocks — the mechanical
 *       gate's `case` stage covers the computed style).
 */
const PINS: Record<string, Pin> = {
  "app/styles/variables.css": {
    tier: "tokens",
    content: { A: 0, B: 0, C: 0 },
    frame: { A: 0, B: 0, C: 0 },
  },
  "app/styles/base.css": {
    tier: "content",
    content: { A: 0, B: 0, C: 0 },
    frame: { A: 0, B: 0, C: 0 },
  },
  "app/styles/grid.css": {
    tier: "content",
    content: { A: 0, B: 0, C: 0 },
    frame: { A: 0, B: 0, C: 0 },
  },
  "app/styles/hud.css": {
    tier: "frame",
    content: { A: 0, B: 0, C: 0 },
    frame: { A: 9, B: 0, C: 0 },
  },
  "app/styles/components.css": {
    tier: "content",
    content: { A: 15, B: 0, C: 0 },
    frame: { A: 0, B: 0, C: 0 },
  },
  "app/styles/navigation.css": {
    tier: "frame",
    content: { A: 0, B: 0, C: 0 },
    frame: { A: 28, B: 5, C: 0 },
  },
  "app/styles/navigation/index.css": {
    tier: "frame",
    content: { A: 0, B: 0, C: 0 },
    frame: { A: 0, B: 0, C: 0 },
  },
  "app/styles/navigation/_navbar.css": {
    tier: "frame",
    content: { A: 0, B: 0, C: 0 },
    frame: { A: 3, B: 0, C: 0 },
  },
  "components/landing/v7/landing.css": {
    tier: "content",
    content: { A: 148, B: 35, C: 15 },
    frame: { A: 10, B: 0, C: 0 },
  },
  "components/landing/v7/theme.css": {
    tier: "content",
    content: { A: 0, B: 0, C: 0 },
    frame: { A: 0, B: 0, C: 0 },
  },
  "components/landing/v7/rail-instruments/rail-instruments.css": {
    tier: "frame",
    content: { A: 0, B: 0, C: 0 },
    frame: { A: 5, B: 0, C: 0 },
  },
  // frame C:1 is `.home-v2-mobile-signal*`'s uppercase sans CTA — fixed phone chrome, never swept.
  "components/landing/home-v2/home-v2.css": {
    tier: "content",
    content: { A: 47, B: 12, C: 1 },
    frame: { A: 3, B: 1, C: 1 },
  },
  "components/landing/home-v2/services/services.css": {
    tier: "content",
    content: { A: 35, B: 4, C: 1 },
    frame: { A: 0, B: 0, C: 0 },
  },
  // Stage 1 (2026-09-06): the casefile family is on the ramps — 78 → 0, 10 → 0, 2 → 0.
  "components/landing/home-v2/services/casefile/casefile.css": {
    tier: "content",
    content: { A: 0, B: 0, C: 0 },
    frame: { A: 0, B: 0, C: 0 },
  },
  "components/landing/home-v2/services/casefile/console/console.css": {
    tier: "content",
    content: { A: 0, B: 0, C: 0 },
    frame: { A: 0, B: 0, C: 0 },
  },
  "components/landing/home-v2/services/casefile/map/pda/pda.css": {
    tier: "content",
    content: { A: 0, B: 0, C: 0 },
    frame: { A: 0, B: 0, C: 0 },
  },
  "components/landing/home-v2/about/about-stage.css": {
    tier: "content",
    content: { A: 0, B: 0, C: 0 },
    frame: { A: 0, B: 0, C: 0 },
  },
  "components/landing/home-v2/voidwalker/voidwalker.css": {
    tier: "content",
    content: { A: 16, B: 0, C: 0 },
    frame: { A: 0, B: 0, C: 0 },
  },
  "components/landing/home-v2/voidwalker/voidwalker-wire.css": {
    tier: "content",
    content: { A: 4, B: 0, C: 0 },
    frame: { A: 0, B: 0, C: 0 },
  },
  "components/landing/home-v2/voidwalker/voidwalker-travel.css": {
    tier: "content",
    content: { A: 1, B: 0, C: 0 },
    frame: { A: 0, B: 0, C: 0 },
  },
  "components/landing/home-v2/voidwalker/hologram/voidwalker-hologram.css": {
    tier: "content",
    content: { A: 0, B: 0, C: 0 },
    frame: { A: 0, B: 0, C: 0 },
  },
  "components/landing/home-v2/voidwalker/hologram/voidwalker-datum.css": {
    tier: "content",
    content: { A: 13, B: 0, C: 0 },
    frame: { A: 0, B: 0, C: 0 },
  },
  "components/arcs/arcs.css": {
    tier: "content",
    content: { A: 45, B: 5, C: 2 },
    frame: { A: 0, B: 0, C: 0 },
  },
  "app/(marketing)/claude-workshop/claude-workshop.css": {
    tier: "content",
    content: { A: 0, B: 0, C: 0 },
    frame: { A: 0, B: 0, C: 0 },
  },
};

/**
 * Frame selectors that live INSIDE content sheets — landing.css and home-v2.css
 * carry the HUD's own rules. A block whose selector path matches is frame and is
 * pinned exact with the frame sheets. Keep in step with `mobile-sections.md`'s
 * list of fixed painters.
 */
const FRAME_SEL = /(^|[\s,>+~])\.(hud\b|hud__|hud-nav|rail-manifest|rin-|home-v2-mobile-signal)/;

const ROLE_VAR = /^var\(--track-(copy|display|label|eyebrow)\)$/;
const ZERO = new Set(["0", "0em", "0px", "normal", "inherit", "initial", "unset"]);

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const stripFontFace = (css: string) => css.replace(/@font-face\s*\{[^}]*\}/g, "");

/** Walk a sheet into (selector path, declarations) pairs, nesting-aware, so a
 *  rule inside `@media` still carries its own selector. */
function blocks(css: string): { path: string; decls: string }[] {
  const out: { path: string; decls: string }[] = [];
  const stack: string[] = [];
  let buf = "";
  for (const ch of css) {
    if (ch === "{") {
      stack.push(buf.trim());
      buf = "";
    } else if (ch === "}") {
      const decls = buf;
      buf = "";
      const sel = stack.pop() ?? "";
      out.push({ path: [...stack, sel].join(" "), decls });
    } else {
      buf += ch;
    }
  }
  return out;
}

function countBlock(decls: string): Counts {
  let A = 0;
  for (const m of decls.matchAll(/letter-spacing\s*:\s*([^;]+);/g)) {
    const v = m[1].trim();
    if (!ROLE_VAR.test(v) && !ZERO.has(v)) A++;
  }
  let B = 0;
  for (const _ of decls.matchAll(/(?:^|[\s;])font-weight\s*:\s*(bold|bolder|[6-9]00)\b/g)) B++;
  for (const _ of decls.matchAll(
    /(?:^|[\s;])font\s*:\s*(?:(?:italic|normal|oblique|small-caps)\s+)*(bold|bolder|[6-9]00)\b/g
  ))
    B++;
  const C =
    /font-family\s*:[^;]*pp-neue-montreal/i.test(decls) &&
    /text-transform\s*:\s*uppercase/.test(decls)
      ? 1
      : 0;
  return { A, B, C };
}

function countSheet(rel: string, tier: Tier): { content: Counts; frame: Counts } {
  const css = stripFontFace(stripComments(read(rel)));
  const content: Counts = { A: 0, B: 0, C: 0 };
  const frame: Counts = { A: 0, B: 0, C: 0 };
  for (const b of blocks(css)) {
    const c = countBlock(b.decls);
    const bucket = tier === "frame" || FRAME_SEL.test(b.path) ? frame : content;
    bucket.A += c.A;
    bucket.B += c.B;
    bucket.C += c.C;
  }
  return { content, frame };
}

describe("type ramps — the tokens are declared where every route reads them", () => {
  const variables = read("app/styles/variables.css");
  // The FIRST :root block only: the design MCP's parser scans from the first
  // `:root` occurrence, and a token declared in a later @media :root override
  // would be invisible to it.
  const firstRoot = variables.slice(
    variables.indexOf(":root"),
    variables.indexOf("}", variables.indexOf(":root"))
  );

  it.each([
    "--track-copy: 0;",
    "--track-display: -0.02em;",
    "--track-label: 0.08em;",
    "--track-eyebrow: 0.15em;",
    "--weight-light: 300;",
    "--weight-text: 400;",
    "--weight-lit: 500;",
  ])("declares %s in the first :root", (decl) => {
    expect(firstRoot).toContain(decl);
  });

  it("carries the five legacy magnitude names byte-identical to landing.css's old values, until stage 4", () => {
    // Moved from landing.css's :root on 2026-09-06. While they exist here they
    // must be exactly the values the 100 existing `var(--track-…)` sites were
    // resolving to, or the move is not the byte-identical one it claims to be.
    const legacy = [
      "--track-tight: 0.02em;",
      "--track-normal: 0.04em;",
      "--track-wide: 0.08em;",
      "--track-wider: 0.1em;",
      "--track-widest: 0.15em;",
    ];
    const present = legacy.filter((d) => firstRoot.includes(d));
    // Either all five are here (stages 0–3) or none (stage 4 onward) — never a
    // partial set, which would leave some consumers on the UA fallback.
    expect(present.length === legacy.length || present.length === 0).toBe(true);
  });

  it("landing.css no longer declares them", () => {
    const landing = stripComments(read("components/landing/v7/landing.css"));
    expect(landing).not.toMatch(/^\s*--track-(tight|normal|wide|wider|widest)\s*:/m);
  });

  it("once the aliases are gone, no production sheet may reference them", () => {
    // Self-arming: this is vacuous while variables.css still declares the
    // aliases, and becomes the stage-4 guard the moment they are deleted.
    if (firstRoot.includes("--track-wide:")) return;
    for (const rel of Object.keys(PINS)) {
      expect(stripComments(read(rel)), rel).not.toMatch(
        /var\(--track-(tight|normal|wide|wider|widest)[,)]/
      );
    }
  });

  it("theme.css declares no letter-spacing or font-weight", () => {
    // It loads LAST (ADR-058) and would evade every cascade argument above.
    const theme = stripComments(read("components/landing/v7/theme.css"));
    expect(theme).not.toMatch(/letter-spacing\s*:/);
    expect(theme).not.toMatch(/font-weight\s*:/);
  });
});

/**
 * Check E — type set OUTSIDE CSS, where the sheet guard cannot see it: the map
 * SVG's presentation attributes, and the three canvases that BAKE text into
 * WebGL textures (`ctx.font = "700 … PT Mono"`). Counted as source occurrences;
 * pinned 2026-09-06. The map files move to named constants in the map pass
 * (ADR-092 §4); the bakes read `lib/services-ring/ringType.ts` in stage 2, after
 * which their pins are 0.
 */
const TSX_PINS: Record<string, { letterSpacing: number; bold: number }> = {
  // Stage 1 (2026-09-06): the map's nine `fontWeight={700}` sites are gone — PT Mono
  // has no 500 and inherits 400; the two Plex hub titles are 500. Tracking literals
  // stay pinned at today's until §4C moves them to named constants.
  "components/landing/home-v2/services/casefile/map/pda/pdaGlyphs.tsx": {
    letterSpacing: 11,
    bold: 0,
  },
  "components/landing/home-v2/services/casefile/map/pda/PdaConfiguration.tsx": {
    letterSpacing: 14,
    bold: 0,
  },
  "components/landing/home-v2/services/casefile/map/pda/PdaCarrier.tsx": {
    letterSpacing: 9,
    bold: 0,
  },
  "components/landing/home-v2/services/casefile/map/pda/substrateKit.tsx": {
    letterSpacing: 2,
    bold: 0,
  },
  "components/landing/home-v2/services/casefile/map/pda/PdaBackplane.tsx": {
    letterSpacing: 4,
    bold: 0,
  },
  "components/landing/home-v2/services/hologram/ServicesCardRing.tsx": {
    letterSpacing: 18,
    bold: 6,
  },
  "components/landing/home-v2/arc-cases/caseCardBake.ts": { letterSpacing: 16, bold: 9 },
  "components/landing/home-v2/DepthGatewayScene/LatentFieldTunnel.tsx": {
    letterSpacing: 0,
    bold: 1,
  },
};
const BOLD_RE = /fontWeight=\{?["']?(700|600|bold)|[`'](700|bold) /g;

describe("type ramps — the ratchet, outside CSS", () => {
  it.each(Object.entries(TSX_PINS))("%s: inline type does not rise above the pin", (rel, pin) => {
    const src = read(rel);
    const ls = (src.match(/letterSpacing/g) ?? []).length;
    const bold = (src.match(BOLD_RE) ?? []).length;
    expect(ls, `${rel} letterSpacing sites`).toBeLessThanOrEqual(pin.letterSpacing);
    expect(bold, `${rel} bold font sites`).toBeLessThanOrEqual(pin.bold);
  });
});

describe("type ramps — the ratchet", () => {
  const sheets = Object.entries(PINS);

  it.each(sheets.filter(([, p]) => p.tier !== "frame"))(
    "%s: content literals do not rise above the pin",
    (rel, pin) => {
      const { content } = countSheet(rel, pin.tier);
      expect(content.A, `${rel} letter-spacing literals`).toBeLessThanOrEqual(pin.content.A);
      expect(content.B, `${rel} weight ≥ 600`).toBeLessThanOrEqual(pin.content.B);
      expect(content.C, `${rel} uppercase sans blocks`).toBeLessThanOrEqual(pin.content.C);
    }
  );

  it.each(sheets)(
    "%s: frame literals are pinned EXACT — the frame is the datum and is never swept",
    (rel, pin) => {
      const { frame } = countSheet(rel, pin.tier);
      expect(frame, rel).toEqual(pin.frame);
    }
  );

  it("the pins do not drift below what the sheets hold (lower them when a stage lands)", () => {
    // A pin far above its count is a ratchet with slack in it: a sheet could
    // regain literals up to the pin without failing. Ten is the allowance for
    // an in-progress sweep; a landed stage sets the pin to the count.
    const slack: string[] = [];
    for (const [rel, pin] of sheets) {
      if (pin.tier === "frame") continue;
      const { content } = countSheet(rel, pin.tier);
      for (const k of ["A", "B", "C"] as const) {
        if (pin.content[k] - content[k] > 10)
          slack.push(`${rel} ${k}: pin ${pin.content[k]}, count ${content[k]}`);
      }
    }
    expect(slack).toEqual([]);
  });
});
