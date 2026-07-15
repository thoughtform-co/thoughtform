/**
 * Feature flag for the ARC CASES CARD (ADR-036 — supersedes the ADR-035
 * DOM-overlay reveal). Replaces `arcCasesTerminal.ts`.
 *
 * When ON (desktop-capable only, see ARC_CASES_MEDIA):
 *   - at the corridor's Build park a CTA chip sits centered UNDER the
 *     "BUILD ON THE LAYER." station title ("VIEW THE CASES"); clicking it
 *     ARMS the reveal. No camera moves — the corridor stays a pure Z dolly.
 *     Instead the sources/surfaces DOM label chips fully fade out and ONE
 *     in-canvas 3D portrait tools card (the ADR-029/033 device-slab
 *     grammar) materializes between the two stack columns in front of the
 *     Build-park sphere, showing one production case (Mímir / Vesper /
 *     Babylon / Heimdall) at a time. The source/surface node streams FOLD
 *     from their pips onto the card's actual left/right slab side walls, so
 *     the screen reads as physically mounted on the nodes (ADR-036).
 *   - the card is CLICK-owned, not scroll-owned: `arcCasesStore` holds
 *     `armed` + the front `slot`; a compact DOM stepper (bottom-centre)
 *     prev/next + numbered chips step the card's baked face (crossfade).
 *     Scroll keeps the Z dolly clock; walking out of the Build band
 *     auto-disarms (no scroll lock, no new scroll writers — the ADR-032
 *     guardrails). Only the damped arm LEVEL runs in JS (an R3F useFrame at
 *     priority −5, before ShellStack folds at 0).
 *
 * Mobile / reduced-motion / fallback corridor never mount the card OR the
 * CTA (gate parity — a card without its arming CTA is dead weight). Flip to
 * `false` to restore the pre-ADR-033 corridor byte-identically: every
 * per-frame reader multiplies by a literal 1 (no label/caption fade, no
 * fold) and every mount is conditional on this flag.
 *
 * Lives in its own module so the corridor shell, the station headers, the
 * accretion shell, and the DOM sceneGeom reader can import it without
 * circular imports (the `unifiedServicesInstrument` precedent).
 */
export const ARC_CASES_CARD = true;

/**
 * Mount gate for the card AND the CTA dock AND the DOM stepper.
 * Deliberately matches the desktop station-header layer
 * (`CorridorStationHeaders` hides at `(max-width: 1100px), (max-height:
 * 759px)` — home-v2.css) rather than the services ring's 961px gate: the
 * CTA lives in that layer, and the card must never exist where its CTA
 * cannot.
 *
 * GATE PARITY: this JS gate is the exact twin of the CSS hide of
 * `.home-v2-cases-sigil` AND `.home-v2-cases-hit` at the same
 * `(max-width: 1100px), (max-height: 759px), (prefers-reduced-motion:
 * reduce)` media in home-v2.css. If one moves, both move.
 */
export const ARC_CASES_MEDIA =
  "(min-width: 1101px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)";
