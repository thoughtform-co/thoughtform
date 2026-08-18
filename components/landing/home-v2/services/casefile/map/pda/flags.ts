/**
 * WHICH DRAWING READING 03 IS (ADR-070 U33, 2026-08-18).
 *
 * `false` — the default — mounts the COMPOUND CARRIER (`PdaCarrier.tsx`): one
 * dial, forty-seven cells each lettered along its own arc, five substrate names
 * in a band, and the selected stream seated in the hub as ADR-069's third home.
 *
 * `true` restores the SECTION drawing (`PdaSubstrate.tsx`) — the estate band
 * over five strata with a riser shaft, promoted as U25 one day earlier. It is
 * kept because it won an owner read against two alternatives on 2026-08-17 and
 * a one-constant comparison on the live site is cheaper than a revert.
 *
 * ⚠ **THE TWO DRAWINGS DO NOT SHARE A FLIGHT HOME, WHICH IS WHY THIS FLAG
 * REACHES INTO `rectFor` AND NOT JUST INTO THE RENDER.** SECTION's home is one
 * of its twenty ghost footprints (`estateFootprint`); the carrier's is the
 * seated card (`carrierPlate().seat`). Gating only the drawing would leave the
 * console computing flights into footprints that are not on screen — which does
 * not throw, it just lands the object in empty space. Every reading-03 branch in
 * `PdaConsole` is gated on this one constant for that reason.
 *
 * ⚠ **AND THE CROPS DIFFER TOO.** SECTION is width-fixed and grows its strata
 * with height (`substrateLayout`); the carrier is height-fixed and grows its
 * crop's width (`carrierPlate`). `pda-viewbox`'s reading-03 entry follows this
 * flag for the same reason.
 *
 * OFF-path restoration is byte-identical: `PdaSubstrate` is untouched by the
 * promotion, and every guard that walks it still does.
 */
export const SUBSTRATE_SECTION = false;
