/**
 * ADR-058 — guards for the light-mode CSS sweep.
 *
 * The sweep replaced ~455 raw color literals across the four route sheets
 * with theme-aware tokens. Two failure modes are invisible in review and
 * were both hit for real during the sweep, so they are pinned here.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..");
const SHEETS = [
  "components/landing/v7/landing.css",
  "components/landing/home-v2/home-v2.css",
  "components/landing/home-v2/services/services.css",
  "components/landing/home-v2/services/casefile/casefile.css",
  "components/landing/home-v2/voidwalker/voidwalker.css",
  "components/landing/home-v2/voidwalker/voidwalker-wire.css",
  "components/landing/home-v2/voidwalker/voidwalker-travel.css",
  "components/landing/v7/theme.css",
];

const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/** Both authoring laws below are about SELECTORS. theme.css states each
 *  law in prose that necessarily quotes the banned form, so strip
 *  comments before asserting or the file fails its own rules. */
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/**
 * The declarations of the first top-level rule whose selector is EXACTLY
 * `selector`.
 *
 * Exact rather than "starts with" on purpose: `… .hero__bg` is a prefix of
 * `… .hero__bg img`, and a prefix match would let one rule's assertions
 * pass against the other's body. Rules nested in `@media` are invisible
 * here — everything asserted below is top-level.
 */
const block = (css: string, selector: string): string => {
  for (const rule of css.split("}")) {
    const brace = rule.indexOf("{");
    if (brace < 0) continue;
    if (rule.slice(0, brace).trim() === selector) return rule.slice(brace + 1);
  }
  throw new Error(`no top-level rule for selector: ${selector}`);
};

describe("theme sweep — no self-referential custom properties", () => {
  // `--gold: var(--gold)` is a CSS dependency cycle: the property becomes
  // guaranteed-invalid and every consumer silently falls back to inherit.
  // A hex→token pass produces these whenever a scope re-declares a token
  // it also names (services.css's `.services-plate-cluster` did exactly
  // this), and nothing in lint or typecheck catches it.
  it.each(SHEETS)("%s", (sheet) => {
    const cycles = Array.from(
      read(sheet).matchAll(/^[ \t]*--([a-z0-9-]+)[ \t]*:[ \t]*var\(--([a-z0-9-]+)[,)]/gim)
    ).filter(([, declared, referenced]) => declared === referenced);
    expect(cycles.map((m) => m[0].trim())).toEqual([]);
  });
});

describe("theme sweep — RGB triples stay byte-exact in dark", () => {
  // Every `rgba(var(--x-rgb), a)` in the sheets replaced a literal whose
  // triple was exactly this. If a dark value here is edited, ~455
  // declarations shift at once and the dark site is no longer identical.
  const EXPECTED: Record<string, string> = {
    "--gold-rgb": "202, 165, 84",
    "--dawn-rgb": "235, 227, 214",
    "--dawn-alt-rgb": "236, 227, 214",
    "--void-rgb": "10, 9, 8",
    "--void-deep-rgb": "5, 4, 3",
  };

  const variables = read("app/styles/variables.css");
  it.each(Object.entries(EXPECTED))("%s is %s in dark", (token, triple) => {
    expect(variables).toContain(`${token}: ${triple};`);
  });

  it("landing.css keeps the atreides triples", () => {
    const landing = read("components/landing/v7/landing.css");
    expect(landing).toContain("--atreides-rgb: 91, 122, 78;");
    expect(landing).toContain("--atreides-mid-rgb: 61, 75, 51;");
  });
});

describe("theme.css — the two authoring laws", () => {
  const theme = stripComments(read("components/landing/v7/theme.css"));

  it("never selects [data-theme='dark']", () => {
    // Dark is the unqualified :root default. `LandingPage`, `ArcShell`,
    // `HomeV2Page` and the test shells carry inert `data-theme="dark"` on
    // INNER elements; a dark-keyed rule would match those and fire in the
    // wrong subtree.
    expect(theme).not.toMatch(/\[data-theme=["']?dark/);
  });

  it("uses no theme-* class selectors", () => {
    // The landing root div's live className IS `theme-instrument
    // density-comfortable`, and landing.css carries inert
    // `body.theme-instrument` / `body.theme-latent` ambience rules.
    expect(theme).not.toMatch(/\.theme-(instrument|latent|dark|light)\b/);
  });

  it("defines the light RGB triples the sweep depends on", () => {
    for (const token of ["--gold-rgb", "--dawn-rgb", "--dawn-alt-rgb", "--void-rgb"]) {
      expect(theme).toContain(`${token}:`);
    }
  });

  it("has NO hero island — the hero is part of the parchment page", () => {
    // ⚠ THIS ASSERTION IS THE REVERSE OF WHAT IT PINNED BEFORE, deliberately
    // (ADR-058 Update 2, owner 2026-08-03). While the key visual was a dark
    // raster, `html[data-theme="light"] .hero` re-pinned the entire dark
    // ramp so the hero rendered identically in both themes. There is a light
    // cut of the artwork now, so that island is gone and the hero takes ink
    // copy on parchment like every other section. An island reintroduced by
    // reflex would silently put cream copy back on the light artwork.
    expect(theme).not.toMatch(/html\[data-theme="light"\]\s+\.hero\s*\{/);
  });

  it("swaps the hero key visual by CSS background, not by markup", () => {
    // The hero <img> is parse-injected from the prototype HTML, and
    // `content: url()` on an <img> does not replace in Firefox — so the
    // light plate is a background on the wrapper and the img is hidden.
    const bg = block(theme, 'html[data-theme="light"] .hero__bg');
    expect(bg).toContain("Gateway_v2-light.webp");
    expect(block(theme, 'html[data-theme="light"] .hero__bg img')).toContain("display: none");
  });

  it("washes the hero scrims with the PAGE color, not void-deep", () => {
    // The overlay's gradients ride --void-deep-rgb, which in light is a
    // DIFFERENT parchment (#e4dac9) than the page (#ece3d6). Over a plate
    // whose paper is corrected to exactly the page token, that wash is the
    // only tint left — the owner sampled the drift at ~#e8decf, which is
    // the paper under the gradient's 0.55-alpha left stop. The re-pin
    // makes the wash page-over-page.
    expect(block(theme, 'html[data-theme="light"] .hero__video__overlay')).toContain(
      "--void-deep-rgb: var(--void-rgb)"
    );
  });

  it("swaps the wordmark artwork UNGATED", () => {
    // It used to require `.is-collapsed`, because the mark's home position
    // sat on the dark hero. The hero is parchment in light now, so gating
    // the swap would print the cream Dual cut over the light artwork for
    // the whole first viewport.
    expect(theme).toContain('html[data-theme="light"] .hud__brand img');
    expect(theme).not.toContain('html[data-theme="light"] .hud__brand.is-collapsed');
  });
});

describe("text on gold uses --gold-contrast", () => {
  // Sigil's documented light-mode failure class: `color: var(--void)` on a
  // gold fill reads ~3:1 once --void becomes parchment.
  it("no `background: var(--gold)` block prints text in --void", () => {
    for (const sheet of SHEETS) {
      const css = read(sheet);
      // crude block scan: a rule that sets a gold background AND a void color
      for (const block of css.split("}")) {
        if (!/background(-color)?:\s*var\(--gold\)/.test(block)) continue;
        expect(block).not.toMatch(/color:\s*var\(--void[,)]/);
      }
    }
  });
});
