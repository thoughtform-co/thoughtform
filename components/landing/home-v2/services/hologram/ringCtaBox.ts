/**
 * ringCtaBox — the card-face bake dimensions and the derived CTA hit box,
 * shared by the WebGL card ring (`ServicesCardRing`, bakes the face at
 * BAKE_W x BAKE_H) and the DOM hit-area layer (`ServicesRingHitAreas`,
 * positions the real <a> over the baked CTA).
 *
 * Three-free on purpose (2026-07-14 perf pass): ServicesRingHitAreas is
 * part of the landing's initial DOM bundle, and importing this box from
 * `ServicesCardRing` dragged the whole three/fiber/drei stack into First
 * Load JS. Keep this module free of heavy imports.
 */

export const BAKE_W = 840;
export const BAKE_H = 1360;

/** CTA strip geometry inside the baked face (bake pixels). */
export const PAD_X = 52;
export const CTA_H = 84; // 42px CSS
export const CTA_Y0 = BAKE_H - 44 - CTA_H;

/** The CTA rectangle as fractions of the card face — the contract between
 *  the baked pixels and the DOM hit rect. */
export const RING_CARD_CTA_BOX = {
  x: PAD_X / BAKE_W,
  y: CTA_Y0 / BAKE_H,
  w: (BAKE_W - PAD_X * 2) / BAKE_W,
  h: CTA_H / BAKE_H,
} as const;

/* ── ADR-050 rev 3: the in-canvas DRAWER face ──────────────────────────────
 * The drawer is a second slab that slides out from behind the card, baked at
 * the SAME dimensions as the card face so it shares the plane geometry and
 * the bake/DOM parity arithmetic. Its text is baked like every other card
 * face; these two boxes are the only interactive regions, mapped onto the
 * drawer's own projected rect by `ServicesRingHitAreas`.
 */

/** Close affordance — a square chit in the drawer's top-right. */
export const DRAWER_CLOSE_SIZE = 56;
export const DRAWER_CLOSE_INSET = 34;
export const DRAWER_CLOSE_BOX = {
  x: (BAKE_W - DRAWER_CLOSE_INSET - DRAWER_CLOSE_SIZE) / BAKE_W,
  y: DRAWER_CLOSE_INSET / BAKE_H,
  w: DRAWER_CLOSE_SIZE / BAKE_W,
  h: DRAWER_CLOSE_SIZE / BAKE_H,
} as const;

/** The drawer's CTA strip — same geometry as the card's, so the two read as
 *  one control family across the open pair. */
export const DRAWER_CTA_BOX = RING_CARD_CTA_BOX;
