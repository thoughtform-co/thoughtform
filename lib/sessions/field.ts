/**
 * lib/sessions/field — the mornings as ASCII numerals in a seeded field
 * (ADR-150).
 *
 * Blunarova's device in the house register: each morning's DAY is drawn as a
 * large numeral built out of terminal glyphs, standing in a quiet field of
 * dots. The field is the hull's seeded grid (mulberry32, copied from
 * `components/arcs/hull/hullLayout.ts`), so it never moves between renders,
 * and the seed is the four dates themselves, so the drawing changes exactly
 * when the calendar does.
 *
 * ⚠ PURE AND DIGIT-FREE IN ITS OUTPUT. The numerals are drawn with glyphs
 * from the ramp, never with digit characters, so the drawing carries no
 * figure a content scan would have to explain. The month under each numeral
 * is a DOM label.
 *
 * ⚠ ONE `<text>` PER ROW. Every row is the same number of monospace cells and
 * the renderer pins its width with `textLength`, so the grid holds whatever
 * the face's real advance is.
 */

/** A 5×7 bitmap per digit, row-major, `1` lit. */
const DIGITS: Record<string, readonly string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
};

/** A bitmap pixel is SX cells wide and SY rows tall: a mono cell is about
 *  half as wide as its row is tall, so 4 × 2 draws a square pixel. */
const SX = 4;
const SY = 2;
const DIGIT_W = 5 * SX;
const DIGIT_H = 7 * SY;
const DIGIT_GAP = 4;
const NUMERAL_GAP = 12;
const PAD_X = 10;
const PAD_Y = 4;

/** The quiet field's glyphs, sparse end first; and the numerals' dense set. */
const FIELD_GLYPHS = [" ", " ", " ", " ", " ", " ", "·", "·", "·", ":"];
const INK_GLYPHS = ["#", "#", "#", "#", "="];

/** The monospace cell, in viewBox units: font size 10, advance 6, row 12. */
export const FIELD_CELL = { fs: 10, w: 6, h: 12 } as const;

export type FieldRun = { text: string; lit: boolean; ink: boolean };

export interface FieldRow {
  y: number;
  runs: readonly FieldRun[];
}

export interface FieldNumeral {
  id: string;
  /** The numeral's centre and its foot, as fractions of the crop. */
  ax: number;
  foot: number;
  lit: boolean;
}

export interface FieldGeom {
  cols: number;
  rows: readonly FieldRow[];
  vb: { w: number; h: number };
  numerals: readonly FieldNumeral[];
}

/** FNV-1a over a string — the coord stamp's own hash. */
export function fieldSeed(parts: readonly string[]): number {
  let h = 0x811c9dc5;
  for (const ch of parts.join("|")) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Mulberry32 — a small seeded generator, so the field never moves. */
export function seeded(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The field for a set of mornings. `days` are the two-character day numbers
 * (`"15"`), in order; `lit` is the index of the next morning.
 */
export function fieldGeom(
  numerals: readonly { id: string; day: string }[],
  lit: number,
  seed: number
): FieldGeom {
  const numW = 2 * DIGIT_W + DIGIT_GAP;
  const cols = PAD_X * 2 + numerals.length * numW + (numerals.length - 1) * NUMERAL_GAP;
  const rowsN = PAD_Y * 2 + DIGIT_H;
  const rand = seeded(seed);

  /* which numeral owns each cell, -1 for the field */
  const owner: number[][] = Array.from({ length: rowsN }, () => Array(cols).fill(-1));
  numerals.forEach((n, ni) => {
    const left = PAD_X + ni * (numW + NUMERAL_GAP);
    [...n.day.padStart(2, "0")].forEach((ch, di) => {
      const bitmap = DIGITS[ch] ?? DIGITS["0"];
      const dx = left + di * (DIGIT_W + DIGIT_GAP);
      bitmap.forEach((line, by) => {
        [...line].forEach((bit, bx) => {
          if (bit !== "1") return;
          for (let sy = 0; sy < SY; sy++)
            for (let sx = 0; sx < SX; sx++) owner[PAD_Y + by * SY + sy][dx + bx * SX + sx] = ni;
        });
      });
    });
  });

  const rows: FieldRow[] = owner.map((line, ri) => {
    const runs: FieldRun[] = [];
    for (const cell of line) {
      const ink = cell >= 0;
      const isLit = ink && cell === lit;
      const glyph = ink
        ? INK_GLYPHS[Math.floor(rand() * INK_GLYPHS.length)]
        : FIELD_GLYPHS[Math.floor(rand() * FIELD_GLYPHS.length)];
      const last = runs[runs.length - 1];
      if (last && last.ink === ink && last.lit === isLit) last.text += glyph;
      else runs.push({ text: glyph, ink, lit: isLit });
    }
    return { y: (ri + 1) * FIELD_CELL.h - 2.5, runs };
  });

  const vb = { w: cols * FIELD_CELL.w, h: rowsN * FIELD_CELL.h };
  const r3 = (v: number) => Math.round(v * 1000) / 1000;
  return {
    cols,
    rows,
    vb,
    numerals: numerals.map((n, ni) => {
      const left = PAD_X + ni * (numW + NUMERAL_GAP);
      return {
        id: n.id,
        ax: r3(((left + numW / 2) * FIELD_CELL.w) / vb.w),
        foot: r3(((PAD_Y + DIGIT_H) * FIELD_CELL.h) / vb.h),
        lit: ni === lit,
      };
    }),
  };
}
