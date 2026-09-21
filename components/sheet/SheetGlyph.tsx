import { LOG_GLYPHS } from "@/lib/sheet/logGlyphs";

/**
 * SheetGlyph — the kind of page an engagement is, as a pixel mark (ADR-118
 * U2): the icon left of every block in the arcs log, the codex list's own
 * arrangement.
 *
 * SERVER-SAFE: no hooks, no state, a pure function of a key — nine of these
 * print on the overview and none of them changes.
 *
 * THREE LAYERS, THREE INKS, NO GOLD. The proof register letters its signal in
 * `--gold`; on the sheet gold is state alone, so the signal is the full ink
 * rung and the skeleton one step under it (`.sh-glyph__*`, instrument.css).
 *
 * ⚠ SIZE COMES FROM CSS (`--log-icon`), and only ever an integer multiple of
 * the 7-cell lattice (28 / 35px — 4 and 5px cells). A fractional cell is what
 * turns a pixel drawing into a blur. ⚠ NO TEXT NODES: the mark is decorative
 * (`aria-hidden`); the block's own words carry what it means.
 */
export function SheetGlyph({ name }: { name: string }) {
  const glyph = LOG_GLYPHS[name];
  if (!glyph) return null;
  const cell = (key: string, col: number, row: number, cls: string) => (
    <rect key={key} className={cls} x={col} y={row} width={1} height={1} />
  );
  return (
    <svg
      className="sh-glyph"
      viewBox="0 0 7 7"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {glyph.dr.map(([c, r]) => cell(`dr-${c}-${r}`, c, r, "sh-glyph__dr"))}
      {glyph.sk.map(([c, r]) => cell(`sk-${c}-${r}`, c, r, "sh-glyph__sk"))}
      {glyph.sig.map(([c, r]) => cell(`sig-${c}-${r}`, c, r, "sh-glyph__sig"))}
    </svg>
  );
}
