/* C · The pattern carries on: mathematical, a terminal. PURE.

   A field of dots printed column by column from the chips to the right, as
   a terminal prints. Thoughtform is a gold caret. It drops in at the field's
   left edge and types its first column with the team, top to bottom: a
   short run of green at each workstream's row, each workstream its own.
   That column is the seed. The caret goes on down and off the foot of the
   frame, and the field prints itself from there by one rule the team now
   owns: a cell is lit when exactly one of its two neighbours was lit in the
   column before (rule 90). So each seed opens into its own widening pattern,
   the four meet and make something none of them was, and the print goes
   faster as it goes: it compounds. At rest it keeps printing, slowly, the
   field moving left a column at a time: what was built keeps changing in
   the team's hands, long after the column the gold typed has gone.

     the owner on the reference he marked TAKE (Melike Turgut, "Process"):
     "super clean. It's more mathematical" */

import { drop, type Geom, put, type Sketch, STYLE, TRAIL } from "./core";

/** The seed at each workstream's row: which rows about it are lit. */
const SEEDS = [[0], [-1, 0], [-1, 0, 1], [0, 2]] as const;
/** The caret: when it drops in, how long it types the column, how long it
    takes to leave by the foot of the frame. */
const IN: [number, number] = [0.6, 1.0];
const TYPE = 2.4;
const LEAVE = 0.5;
/** The print: when it starts, how long it takes, and at rest a column
    every so long. */
const PRINT: [number, number] = [3.2, 7.3];
const SCROLL = 0.5;
/** Rows of the field above the first workstream and below the last. */
const MARGIN = 6;

export function pattern(G: Geom): Sketch {
  const { P, sizes, rows } = G;
  const x0 = G.bus;
  const cols = Math.max(2, Math.floor((G.right - x0) / P) + 1);
  const y0 = rows[0] - MARGIN * P;
  const count = Math.round((rows[3] - rows[0]) / P) + 2 * MARGIN + 1;
  const rowOf = (y: number) => Math.round((y - y0) / P);

  /* the generations, made once and kept: column n from column n - 1 */
  const seed = new Uint8Array(count);
  rows.forEach((y, i) => {
    for (const d of SEEDS[i]) seed[rowOf(y) + d] = 1;
  });
  /* each workstream prints in its own band of rows, halfway to the next
     one's, with a quiet row between: its pattern stays its own */
  const band = new Int16Array(count).fill(-1);
  rows.forEach((y, i) => {
    const r = rowOf(y);
    const up = i === 0 ? 0 : Math.floor((r + rowOf(rows[i - 1])) / 2) + 1;
    const down = i === 3 ? count - 1 : Math.floor((r + rowOf(rows[i + 1])) / 2) - 1;
    for (let q = up; q <= down; q++) band[q] = i;
  });
  const cell = (c: Uint8Array, r: number, own: number) => (band[r] === own ? c[r] : 0);
  const gens: Uint8Array[] = [seed];
  const gen = (n: number) => {
    while (gens.length <= n) {
      const prev = gens[gens.length - 1];
      const next = new Uint8Array(count);
      for (let r = 0; r < count; r++)
        if (band[r] >= 0) next[r] = cell(prev, r - 1, band[r]) ^ cell(prev, r + 1, band[r]);
      gens.push(next);
    }
    return gens[n];
  };

  const typed = IN[1] + TYPE;
  const rest = PRINT[0] + PRINT[1];
  /** The column printed at `t`, counting the seed as 0; -1 before it is done. */
  const printed = (t: number) => {
    if (t < typed) return -1;
    if (t < PRINT[0]) return 0;
    const x = Math.min(1, (t - PRINT[0]) / PRINT[1]);
    /* faster as it goes: its pace at the end four times its pace at the start */
    return Math.floor((cols - 1) * ((1.6 * x - 0.6 * x * x) / 1));
  };
  const below = G.h + 3 * P;

  return {
    rest,
    routes: [
      [
        [x0, -3 * P],
        [x0, below],
      ],
    ],
    frame(t, D) {
      D.n = 0;
      /* at rest it goes on printing, the field moving left a column a time */
      const shift = t > rest ? Math.floor((t - rest) / SCROLL) : 0;
      const last = printed(t) + shift;
      const typing = t >= IN[1] && t < typed ? Math.floor(((t - IN[1]) / TYPE) * count) : -1;
      for (let c = 0; c < cols; c++) {
        const n = c + shift;
        if (n > last && !(n === 0 && typing >= 0)) break;
        const cells = gen(n);
        const head = n === last && last > 0;
        const x = x0 + c * P;
        for (let r = 0; r < count; r++) {
          if (n === 0 && typing >= 0 && r > typing) break;
          const y = y0 + r * P;
          if (cells[r]) put(D, x, y, head ? sizes[3] : sizes[2], head ? STYLE.teamLit : STYLE.team);
          else if (band[r] >= 0) put(D, x, y, sizes[0], STYLE.agentsDim);
        }
      }
      /* the caret: in from above, down the first column, off the foot */
      let y: number | null = null;
      let fall: [number, number, number] | null = null;
      if (t >= IN[0] && t < IN[1]) {
        const e = drop((t - IN[0]) / (IN[1] - IN[0]));
        fall = [-3 * P, y0, e];
        y = -3 * P + (y0 + 3 * P) * e;
      } else if (typing >= 0) y = y0 + typing * P;
      else if (t >= typed && t < typed + LEAVE) {
        const e = drop((t - typed) / LEAVE);
        const from = y0 + (count - 1) * P;
        fall = [from, below, e];
        y = from + (below - from) * e;
      }
      if (y !== null) {
        if (fall) {
          const [a, b, e] = fall;
          const s = Math.sqrt(e);
          for (const [back, tier] of TRAIL) {
            if (s - back <= 0) break;
            put(D, x0, a + (b - a) * drop(s - back), sizes[tier], STYLE.fallGold);
          }
        }
        put(D, x0, y, sizes[3], STYLE.layerLit);
        put(D, x0, y + P, sizes[3], STYLE.layerLit);
      }
    },
  };
}
