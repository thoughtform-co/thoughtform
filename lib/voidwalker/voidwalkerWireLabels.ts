/**
 * What each VOIDWALKER drawing LETTERS (ADR-074) — the declaration the
 * markup guard and the smoke pin against, by sorted-array equality. "A
 * drawing declares what it letters" (ADR-070's `substrateLettering`): a
 * label that exists in a component and not here is a defect in the
 * drawing, and a label here that stopped rendering fails the guard.
 *
 * Rules (inherited from the casefile's wireframes, ADR-068): ≤8 labels per
 * drawing, PT Mono micro-labels only, NO DIGITS and NO CURRENCY inside a
 * drawing — the year rides the spine, the figures ride the prose. One gold
 * object per drawing; green is the flow.
 *
 * Type-only import, so this stays a zero-runtime-import record.
 */

import type { VwWireId } from "./voidwalkerData";

export const VW_WIRE_LABELS: Readonly<Record<VwWireId, readonly string[]>> = {
  hunt: ["HUNT", "KAMMENSTRAAT", "STREET CLOSED", "CROWD", "LURE"],
  ophef: ["TWEET", "#OPHEF", "TRENDING", "PARTY", "PROGRAMME", "JOIN"],
  expanse: [
    "CHANNELS",
    "TWEETSTORM",
    "FACEBOOK ADS",
    "PETITION",
    "SIGNATURES",
    "BANNER PLANE",
    "AMAZON STUDIOS",
    "SAVE THE EXPANSE",
  ],
  coins: ["POST", "r/pics", "UPVOTES", "SIX COINS", "THE BULLET"],
  azeroth: ["MINIMAP", "ONLINE", "CLASS", "ASSIGNMENT", "ACCEPT"],
  latent: ["LATENT LAND", "PROMPT", "FRAMES", "CUT", "RENDER", "CHARTER"],
};

/** The interlude's plate (ADR-074 U2) is not a beat drawing — it is keyed
 *  separately so the six-story registry stays total over `VwWireId` and the
 *  markup guard can still walk it. */
export const VW_FILM_LABELS: readonly string[] = ["PLAY", "CAMPAIGN FILM"];

export const VW_WIRE_IDS = Object.keys(VW_WIRE_LABELS) as readonly VwWireId[];
