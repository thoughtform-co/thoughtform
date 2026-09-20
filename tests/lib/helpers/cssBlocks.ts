/**
 * The nesting-aware sheet walker the source ratchets share.
 *
 * Reads a stylesheet as TEXT — no CSS parser dependency — and yields one
 * `(selector path, declarations)` pair per block, so a rule inside an
 * `@media` still carries its own selector (`@media (max-width: 700px) .vwd`).
 * Idiom from theme-css-sweep: strip comments first, because this house quotes
 * every banned form in prose beside the rule that avoids it.
 *
 * One copy. `type-material-tokens` (ADR-092) and `phone-viewport-units`
 * (ADR-113) both walk with it; a third ratchet imports it rather than pasting
 * a fourth walker.
 */

export const stripComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, "");

export type CssBlock = { path: string; decls: string };

/** Walk a sheet into (selector path, declarations) pairs, nesting-aware, so a
 *  rule inside `@media` still carries its own selector. */
export function blocks(css: string): CssBlock[] {
  const out: CssBlock[] = [];
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
