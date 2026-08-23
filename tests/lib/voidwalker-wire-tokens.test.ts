import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The through-line's drawings FORK the casefile's wireframe grammar
 * (ADR-074) and carry its `--w-*` token block verbatim — that is what lets
 * theme.css re-derive both hosts' light steps from ONE rule. Two guards:
 * the two dark token blocks are equal, declaration for declaration, and
 * the light rule names both hosts in one selector list. A token added to
 * one block and not the other, or a second light rule, fails here rather
 * than on parchment.
 */

const ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** The `--w-*` declarations of the first top-level rule for `selector`. */
function tokens(css: string, selector: string): Record<string, string> {
  for (const rule of stripComments(css).split("}")) {
    const brace = rule.indexOf("{");
    if (brace < 0) continue;
    if (rule.slice(0, brace).trim() !== selector) continue;
    const out: Record<string, string> = {};
    for (const m of rule.slice(brace + 1).matchAll(/--(w-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
      out[m[1]!] = m[2]!.trim();
    }
    return out;
  }
  throw new Error(`no top-level rule for selector: ${selector}`);
}

describe("voidwalker wireframes — token parity with the casefile", () => {
  const casefile = read("components/landing/home-v2/services/casefile/casefile.css");
  const voidwalker = read("components/landing/home-v2/voidwalker/voidwalker-wire.css");
  const theme = stripComments(read("components/landing/v7/theme.css"));

  it("the dark `--w-*` block on .vw-wire__in equals the one on .fl-wire__in", () => {
    const fl = tokens(casefile, ".fl-wire__in");
    const vw = tokens(voidwalker, ".vw-wire__in");
    expect(Object.keys(fl).length).toBeGreaterThan(10);
    expect(vw).toEqual(fl);
  });

  it("theme.css re-derives both hosts from ONE light rule", () => {
    const rules = theme
      .split("}")
      .map((r) => r.slice(0, r.indexOf("{")).trim())
      .filter((s) => s.includes(".vw-wire__in") || s.includes(".fl-wire__in"));
    expect(rules).toHaveLength(1);
    expect(rules[0]).toContain('html[data-theme="light"] .fl-wire__in');
    expect(rules[0]).toContain('html[data-theme="light"] .vw-wire__in');
  });
});
