import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The client mark's TWO SEATS on an arc (ADR-130 U1, owner 2026-09-27).
 *
 * At rest the mark shares the Thoughtform wordmark's own left edge
 * (`--hud-content-inset`); it docks to the corner (`--hud-margin`) with the
 * wordmark's own collapse. Both halves are pinned here because the defect
 * either one hides is SILENT: a rest seat keyed on the wrong condition still
 * paints a mark in a plausible place, half a viewport out of step with the
 * wordmark it is meant to be aligned with.
 */
const css = readFileSync(resolve(process.cwd(), "components/arcs/arcs.css"), "utf8");

/** The client-mark block: from its own rule to the first section rule after it. */
function markBlock(): string {
  const start = css.indexOf(".arc-hud-client {");
  const end = css.indexOf(".arc-section {", start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return css.slice(start, end);
}

describe("the arc client mark's two seats", () => {
  const block = markBlock();

  it("docks at the HUD margin — the seat it has always had", () => {
    expect(block).toMatch(/\.arc-hud-client\s*\{[^}]*left:\s*var\(--hud-margin/);
  });

  it("rests on the wordmark's own left edge", () => {
    expect(block).toMatch(
      /\.arc-root:not\(:has\(\.hud__brand\.is-collapsed\)\)\s+\.arc-hud-client\s*\{\s*left:\s*var\(--hud-content-inset\)/
    );
  });

  it("keys the rest seat on the wordmark's collapse, never on data-arc-scrolled", () => {
    // `HudNav` writes `.is-collapsed` at 0.5vh; `useArcScroll` stamps
    // `data-arc-scrolled` at 1vh. Keying on the attribute leaves the two marks
    // half a viewport out of step, with nothing failing.
    const rest = block.slice(block.indexOf(".arc-root:not(:has(.hud__brand.is-collapsed))"));
    expect(rest).not.toMatch(/data-arc-scrolled/);
  });

  it("scopes the rest seat above the phone rung, where the wordmark paints", () => {
    // `.hud__brand` is `display: none` at <=960, so below the rung there is no
    // datum to align to and the mark keeps the corner.
    const at = block.indexOf(".arc-root:not(:has(.hud__brand.is-collapsed))");
    const query = block.lastIndexOf("@media", at);
    expect(query).toBeGreaterThan(-1);
    expect(block.slice(query, at)).toMatch(/min-width:\s*961px/);
  });

  it("glides on `left` alone, and not under reduced motion", () => {
    expect(block).toMatch(/\.arc-hud-client\s*\{\s*transition:\s*left 0\.4s var\(--ease-out\)/);
    expect(block).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.arc-hud-client\s*\{\s*transition:\s*none/
    );
  });

  it("never declares a rule on `.hud__brand` itself", () => {
    // The wordmark's box is tokens on `:root` and rules in landing.css
    // (`tests/lib/hud-brand-tokens.test.ts`); an arc reads them, never restates
    // them. `:has()` and `:not()` arms are conditions, not declarations.
    expect(css).not.toMatch(/(^|[\s,>])\.hud__brand(\.[\w-]+)?\s*\{/m);
  });
});
