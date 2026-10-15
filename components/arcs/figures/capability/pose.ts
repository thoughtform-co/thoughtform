/**
 * The capability stack's poses (ADR-156 U4): where each card is, as a PURE
 * function of the beat's progress `s` (0 at its park, 1 where the next beat
 * parks). One card is up at a time; when its turn ends it rotates back on
 * its x-axis and settles into the stack of plates above, and the next card
 * appears where it stands. The last card stays up.
 *
 * ⚠ No travel in: a card APPEARS (its title decodes); only the leaving card
 * moves, and only back into the stack, which is the record growing.
 */

export interface CardPose {
  /** 0 not yet; 1 up or stacked. A card appears, it does not fade in. */
  shown: boolean;
  /** Degrees about the x-axis: 0 facing, `PLATE_RX` lying back in the stack. */
  rx: number;
  /** In the card's own heights, up from its seat (CSS `translateY(-n * 100%)`). */
  lift: number;
  scale: number;
  /** In the stack (its tag beside the plate is shown). */
  stacked: boolean;
  /** Up and facing: the one card being read. */
  front: boolean;
}

export const PLATE_RX = 78;
/** Where a card's turn ends and its rotation back begins, in its own share. */
const HOLD = 0.7;
/** The stack sits just above the front card's top edge; each plate a little
 *  higher, so the stack grows as the record does. */
const STACK_LIFT = 0.66;
const PLATE_STEP = 0.06;
const PLATE_SCALE = 0.58;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};

export function cardPose(i: number, n: number, s: number): CardPose {
  const u = clamp01(s) * n - i;
  const last = i === n - 1;
  /* A card appears the moment the one before it starts to lie back, so the
     stage is never empty between two. The first is up from the park. */
  const arrive = i === 0 ? 0 : HOLD - 1;
  if (u < arrive) return { shown: false, rx: 0, lift: 0, scale: 1, stacked: false, front: false };
  if (last || u < HOLD) return { shown: true, rx: 0, lift: 0, scale: 1, stacked: false, front: true };
  const t = smooth((u - HOLD) / (1 - HOLD));
  const lift = STACK_LIFT + i * PLATE_STEP;
  return {
    shown: true,
    rx: PLATE_RX * t,
    lift: lift * t,
    scale: 1 + (PLATE_SCALE - 1) * t,
    stacked: t >= 1,
    front: false,
  };
}
