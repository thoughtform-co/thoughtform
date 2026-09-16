import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PROOF_STACK_SPLIT_MEDIA } from "@/components/landing/home-v2/unifiedServicesInstrument";

/**
 * THE PHONE RUNG, IN LOCKSTEP (ADR-107).
 *
 * `PROOF_STACK_SPLIT_MEDIA` decides which MARKUP `ServicesStage` renders (one
 * slot per project, or a record slot and a field slot) and the split block in
 * `proof-stack.css` decides whether those slots STICK. Two readers of one
 * question: a phone that got eight slots from the first and static flow from
 * the second would show eight cards in a column, each a viewport tall; the
 * other way round, four whole cards trying to stick with a `--pc-n` solved
 * for five. Neither errors. So the sheet's literal is pinned to the constant,
 * the same way `services-proof-runway-lockstep` pins the runway.
 *
 * And the constant is pinned to the inert rung it is carved out of: the two
 * terms §7 keeps — a short window, a reduced-motion reader — must stay inert
 * on the phone too, or the split block would re-stick a pile the hook has
 * parked.
 */

const CSS_PATH = join(
  __dirname,
  "..",
  "..",
  "components",
  "landing",
  "home-v2",
  "services",
  "proof-stack",
  "proof-stack.css"
);

describe("the proof stack's phone rung", () => {
  const css = readFileSync(CSS_PATH, "utf8");

  it("is declared once in the sheet, as the constant's literal, scoped to the split", () => {
    const escaped = PROOF_STACK_SPLIT_MEDIA.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const block = new RegExp(`@media ${escaped} \\{\\s*\\.pf-stack\\.pf-stack--split `);
    expect(css, "proof-stack.css has no split block on PROOF_STACK_SPLIT_MEDIA").toMatch(block);
    // One block. A second one is a second place the rung can drift.
    const count = css.split(`@media ${PROOF_STACK_SPLIT_MEDIA}`).length - 1;
    expect(count).toBe(1);
  });

  it("is the complement of the inert rung's first term and keeps the other two", () => {
    // The inert rung (§7), verbatim.
    expect(css).toMatch(
      /@media \(max-width: 960px\), \(max-height: 680px\), \(prefers-reduced-motion: reduce\) \{/
    );
    expect(PROOF_STACK_SPLIT_MEDIA).toContain("(max-width: 960px)");
    expect(PROOF_STACK_SPLIT_MEDIA).toContain("(min-height: 681px)");
    expect(PROOF_STACK_SPLIT_MEDIA).toContain("(prefers-reduced-motion: no-preference)");
    // ANDed, never a list — a comma here would make any one term enough.
    expect(PROOF_STACK_SPLIT_MEDIA).not.toContain(",");
  });

  it("re-states every geometry the inert rung parks", () => {
    const start = css.indexOf(`@media ${PROOF_STACK_SPLIT_MEDIA}`);
    const split = css.slice(start);
    // The slot sticks again, on the same seat law as the desktop pile.
    expect(split).toMatch(/\.pf-slot \{\s*position: sticky;/);
    expect(split).toMatch(/top: calc\(var\(--pc-top-base\) \+ var\(--i\) \* var\(--pc-peek\)\)/);
    expect(split).toMatch(/height: var\(--pc-card-h\)/);
    // The field's fixed phone height goes; the panel IS the height now.
    expect(split).toMatch(/\.pf-card--field \.pf-card__field \{\s*height: auto;/);
    // The tail is the last panel's hold, back.
    expect(split).toMatch(/\.pf-stack__tail \{\s*height: clamp\(280px, 40svh, 400px\);/);
    // A record does not recede for its own field: its depth drops the cover term.
    expect(split).toMatch(
      /\.pf-slot--record \{[^}]*--pc-dp: calc\(var\(--pc-depth\) - var\(--pc-cover\)\)/
    );
    // No blur on the phone.
    expect(split).toMatch(/backdrop-filter: none/);
  });
});
