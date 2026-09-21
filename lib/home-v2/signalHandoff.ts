/**
 * signalHandoff — the phone's epilogue block hands the top of the screen to
 * the first proof card (ADR-116).
 *
 * Owner, 2026-09-21, from his phone: "AI capability your team owns" and its
 * button "disappear a bit too quickly, resulting in a bit of a void on top …
 * They need to stay a bit longer and disappear in sync with the cards of the
 * proof section."
 *
 * So the block's exit is keyed to the CARD, not to the corridor: its clock is
 * where slot 0's top is, read off the `--pc-enter` the pile's own hook
 * already publishes (`useStackedCardsScroll` — `smoothstep((vh − top) /
 * (vh − pinTop))`, a pure function of the slot's live rect). Inverting that
 * gives the card's top with no layout read in the block's frame loop, and one
 * clock then drives both the card's rise and the text's un-type: the text
 * holds whole until the card is `SPAN` of the viewport below the block, and
 * is gone as the card's top reaches `GAP` under the block's bottom edge — the
 * card never slides over live copy, and the top of the screen is never empty
 * for longer than the card's last `GAP`-plus-a-pin of travel.
 *
 * PURE and import-free: the block, the unit test and the smoke all read the
 * same arithmetic.
 */

/** Where the text is GONE: the card's top this far under the block's bottom. */
export const SIGNAL_HANDOFF_GAP_PX = 16;

/** How far (in viewports) the card's top travels while the text un-types. */
export const SIGNAL_HANDOFF_SPAN_VH = 0.32;

/**
 * The FAIL-SAFE line: once the card's top is above this fraction of the
 * viewport the block is dead whatever the clock says (`mobile-sections.md`
 * §2 — the kill is an observable the reader can see, here the card itself).
 * It must fire AFTER the hand-off has finished at every phone shape — the
 * unit test pins that — and BEFORE the card pins, so a pinned card always
 * kills it.
 */
export const SIGNAL_KILL_VH = 0.15;

/** The three parts leave on sub-windows of the hand-off: the button's label
 *  first (it sits lowest, nearest the arriving card), then its frame closes
 *  centre-out over what the label left, while the title un-types across the
 *  whole run so the last thing standing is the line the beat is named for. */
export const SIGNAL_LABEL_WINDOW: readonly [number, number] = [0, 0.5];
export const SIGNAL_FRAME_WINDOW: readonly [number, number] = [0.4, 1];
export const SIGNAL_TITLE_WINDOW: readonly [number, number] = [0.15, 1];

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** A sub-window's own 0..1 from the hand-off's `u`, LINEAR — the scramble
 *  kernel eases per character, so an eased envelope would double-ease. */
export function windowT(u: number, [a, b]: readonly [number, number]): number {
  if (!Number.isFinite(u)) return u;
  return clamp01((u - a) / (b - a));
}

/** The inverse of `3x² − 2x³` on [0, 1], closed form. */
export function smoothstepInverse01(y: number): number {
  const v = clamp01(y);
  return 0.5 - Math.sin(Math.asin(1 - 2 * v) / 3);
}

/**
 * Slot 0's top, in viewport px, from its published `--pc-enter`. `pinTop` is
 * the slot's computed sticky `top`. NaN in (the hook has not written) → NaN
 * out, which the block reads as "no pile: take the corridor's own exit".
 */
export function cardTopForEnter(enter: number, vh: number, pinTop: number): number {
  if (!Number.isFinite(enter)) return Number.NaN;
  return vh - smoothstepInverse01(enter) * Math.max(1, vh - pinTop);
}

/**
 * The hand-off at a given card top: 0 = the block whole, 1 = the block gone.
 * `blockBottom` is the block's own bottom edge in viewport px.
 */
export function signalHandoffT(cardTop: number, blockBottom: number, vh: number): number {
  if (!Number.isFinite(cardTop) || !Number.isFinite(blockBottom)) return Number.NaN;
  const end = blockBottom + SIGNAL_HANDOFF_GAP_PX;
  const start = end + SIGNAL_HANDOFF_SPAN_VH * vh;
  return clamp01((start - cardTop) / (start - end));
}
