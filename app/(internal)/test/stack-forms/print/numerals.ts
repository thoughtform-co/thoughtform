/* PRINT's numerals: stepped pixel figures, drawn as shapes so they can be laid
   on a plate's face like ink. PURE. Five cells wide, seven tall. */

const GLYPHS: Record<string, readonly string[]> = {
  "0": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
};

const COLS = 5;
const ROWS = 7;

/** How large `text` sets at `cell` a pixel, with `gap` cells between figures. */
export function numeralSize(text: string, cell: number, gap = 1) {
  return { w: (text.length * COLS + (text.length - 1) * gap) * cell, h: ROWS * cell };
}

/**
 * `text` as one path of rectangles, its top-left at the origin. Each run of
 * lit cells in a row is one rectangle, a hair taller than its row so no seam
 * shows between rows once the path is sheared onto a face.
 */
export function numeralPath(text: string, cell: number, gap = 1): string {
  const over = cell * 0.04;
  let d = "";
  [...text].forEach((ch, n) => {
    const rows = GLYPHS[ch];
    if (!rows) return;
    const ox = n * (COLS + gap) * cell;
    rows.forEach((row, r) => {
      let c = 0;
      while (c < COLS) {
        if (row[c] !== "#") {
          c++;
          continue;
        }
        let e = c;
        while (e < COLS && row[e] === "#") e++;
        const x = ox + c * cell;
        const y = r * cell;
        const w = (e - c) * cell;
        const h = cell + (r < ROWS - 1 ? over : 0);
        d += `M${x} ${y}h${w}v${h}h${-w}z`;
        c = e;
      }
    });
  });
  return d;
}
