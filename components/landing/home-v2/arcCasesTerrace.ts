/**
 * Feature flag for the ARC CASES TERRACE (ADR-034 — supersedes the
 * ADR-033 orbit ring).
 *
 * When ON (desktop-capable only, see ARC_CASES_MEDIA):
 *   - at the corridor's Build park a CTA chip sits bottom-right on the
 *     right-rail column ("VIEW THE CASES"); clicking it ARMS the terrace:
 *     the camera glides laterally RIGHT (the stack + sphere drift to
 *     frame-left, surfaces fan still visible) and ONE landscape screen
 *     rises out of the substrate topography showing one production case
 *     (Mímir / Vesper / Babylon / Heimdall) at a time;
 *   - the terrace is CLICK-owned, not scroll-owned: `arcCasesStore` holds
 *     `armed` + the front `slot`; prev/next + numbered chips step the
 *     screen's content (crossfade). Scroll keeps the camera clock;
 *     walking out of the Build band auto-disarms (no scroll lock, no new
 *     scroll writers — the ADR-032 guardrails);
 *   - while armed the substrate realm envelope is boosted toward fully
 *     resolved (`terraceRealmTarget`) so the ground the screen stands on
 *     reads complete.
 *
 * Mobile / reduced-motion / fallback corridor never mount the screen OR
 * the CTA (gate parity — a screen without its arming CTA is dead weight).
 * Flip to `false` to restore the pre-ADR-033 corridor byte-identically:
 * every per-frame hook multiplies by a literal 0 when the flag is off.
 *
 * Lives in its own module so the DepthGatewayScene actors, the CTA, and
 * the corridor shell can read it without circular imports (the
 * `unifiedServicesInstrument` precedent).
 */
export const ARC_CASES_TERRACE = true;

/**
 * Mount gate for the screen AND the CTA. Deliberately matches the
 * desktop station-header layer (`CorridorStationHeaders` hides at
 * `(max-width: 1100px), (max-height: 759px)` — home-v2.css) rather than
 * the services ring's 961px gate: the CTA lives in that layer, and the
 * screen must never exist where its CTA cannot.
 */
export const ARC_CASES_MEDIA =
  "(min-width: 1101px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)";
