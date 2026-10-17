/**
 * The dossier's icons, drawn in the brand's own material: a 7 × 7 field of
 * particles, each a square grain, each with its own small variance in tone so
 * the icon reads as dots rather than a pixel font. Subtle by design: they sit
 * beside a label in dawn, never alone and never in gold.
 */

export const GLYPHS = {
  /* creative production: a play mark */
  play: ["..#....", "..##...", "..###..", "..####.", "..###..", "..##...", "..#...."],
  /* creative operations: three stations on one run */
  flow: ["##.....", "##.....", "..#....", "...##..", "...##..", ".....##", ".....##"],
  /* a motion ad: one 9:16 frame */
  film: [".#####.", ".#...#.", ".#...#.", ".#.#.#.", ".#...#.", ".#...#.", ".#####."],
  /* two films */
  pair: ["###.###", "#.#.#.#", "#.#.#.#", "#.#.#.#", "#.#.#.#", "#.#.#.#", "###.###"],
  /* a library: groups of grains */
  grid: ["##.##.#", "##.##.#", ".......", "##.##.#", "##.##.#", ".......", "##.##.#"],
  /* the model's thinking: a burst of grains */
  model: ["...#...", ".#.#.#.", "..###..", "###.###", "..###..", ".#.#.#.", "...#..."],
} as const;

export type GlyphName = keyof typeof GLYPHS;
export const GLYPH_NAMES = Object.keys(GLYPHS) as GlyphName[];

/** The type of work's icon, read from its name. */
export function workstreamGlyph(workstream: string): GlyphName {
  return /operation/i.test(workstream) ? "flow" : "play";
}

/** A fixed tone for each grain, so the icon is the same on every render. */
function tone(x: number, y: number): number {
  const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return 0.55 + (h - Math.floor(h)) * 0.45;
}

export function Glyph({ name }: { name: GlyphName }) {
  const rows = GLYPHS[name];
  return (
    <svg className="csd-glyph" viewBox="0 0 7 7" aria-hidden="true" focusable="false">
      {rows.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === "#" ? (
            <rect
              key={`${x}-${y}`}
              x={x + 0.18}
              y={y + 0.18}
              width={0.64}
              height={0.64}
              fillOpacity={tone(x, y)}
            />
          ) : null
        )
      )}
    </svg>
  );
}
