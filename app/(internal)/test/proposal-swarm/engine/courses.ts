/* The three courses' words on the bars, typed by the line that writes the
   bars. PURE.

   The owner, 2026-10-14: "when you have those horizontal scan lines in the
   'Marketing First' and 'Every Team' sections, we can also reveal the text
   as it moves from left to right. Right now the text has some sort of
   opacity animation … I think we can just use a typewriter effect."

   The section letters its courses on the bars itself (`.xn-course`) and
   fades them in once its turn is done. Here the lab sets them, and the lab's
   sheet hides the section's: one line crosses the three bars from left to
   right (`TURN.sweep`), and a character is typed as the line passes its
   middle, as a dot takes its bar's look as the line passes the dot. As the
   view draws back, each word is erased from its end, and the dots it held
   off come back behind the head. While it is erased the word is drawn at
   its bar's scale (`scaleAt`), so it and the dots it stands among keep
   their places on the bar as it shrinks to Marketing's node. */

import { COURSES } from "@/components/xb-proposal/network/NetworkPlug";

import type { Rect } from "./formations";

export interface Courses {
  words: readonly string[];
  /** The bars at the module's size and at Marketing's node's, device px. */
  big: readonly Rect[];
  node: readonly Rect[];
  /** How far in from its bar's left edge a word starts, device px. */
  inset: number;
  /** The type's size, and a character's advance, device px. */
  font: number;
  adv: number;
  /** The stretch of each bar its word is set on, x0 to x1, device px: the
      dots there are held off it while it stands. */
  windows: readonly (readonly [number, number])[];
}

/* `.xn-course`: PT Mono, whose advance is 0.6 em, tracked 0.15 em */
const GLYPH = 0.6;
const TRACK = 0.15;
/** The air a window keeps either side of its word, in ems. */
const AIR = 0.8;

/** The courses on bars `big` (and `node`), lettered as the section letters
    them: 16 units in from the bar's left edge, at `font` device px. */
export function coursesOf(
  big: readonly Rect[],
  node: readonly Rect[],
  unit: number,
  font: number
): Courses {
  const inset = 16 * unit;
  const adv = (GLYPH + TRACK) * font;
  const windows = COURSES.map((word, i): readonly [number, number] => {
    const x0 = big[i].x + inset;
    return [x0 - AIR * font, x0 + word.length * adv + AIR * font];
  });
  return { words: COURSES, big, node, inset, font, adv, windows };
}

/** The line that writes the bars, `front` of the way across: its x on the
    canvas, device px. The three bars stand one above another, edge to edge. */
export const frontX = (C: Courses, front: number) => C.big[0].x + front * C.big[0].w;

/** The middle of character `c` of course `i`, at the module's size. */
export const charMid = (C: Courses, i: number, c: number) =>
  C.big[i].x + C.inset + c * C.adv + (GLYPH / 2) * C.font;

/** The head erasing course `i`, `erase` of the way: from its window's end to
    its start, at the module's size. */
export const eraseX = (C: Courses, i: number, erase: number) =>
  C.windows[i][1] + (C.windows[i][0] - C.windows[i][1]) * erase;

/** How many characters of course `i` stand: typed once the line has reached
    their middles, and erased from the end as the view draws back, each as
    the head reaches the end of its own cell. */
export function typedOf(C: Courses, i: number, front: number, erase: number): number {
  const n = C.words[i].length;
  let k = 0;
  if (erase > 0) {
    const x = eraseX(C, i, erase);
    while (k < n && charMid(C, i, k) + C.adv / 2 < x) k++;
  } else {
    const x = frontX(C, front);
    while (k < n && charMid(C, i, k) <= x) k++;
  }
  return k;
}

/** Whether the head shows on course `i`: while the line is on the word, or
    the word is being erased, and it is not whole and not gone. */
export function headOn(C: Courses, i: number, front: number, erase: number): boolean {
  const n = typedOf(C, i, front, erase);
  if (erase > 0) return erase < 1 && n > 0 && n < C.words[i].length;
  return front < 1 && frontX(C, front) >= C.big[i].x + C.inset && n < C.words[i].length;
}

/** The bars' scale as the view draws back `zoom` of the way, against the
    module's: a dot's lerp from its bar's cell to its node's is this scale
    about the bar's left edge (`formations.ts`, `cellX`). */
export const scaleAt = (C: Courses, zoom: number) =>
  (C.big[0].w + (C.node[0].w - C.big[0].w) * zoom) / C.big[0].w;
