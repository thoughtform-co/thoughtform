/**
 * Feature flag for the ARC CASES ORBIT (ADR-033, 2026-07-13).
 *
 * When ON (desktop-capable only, see ARC_CASES_MEDIA):
 *   - at the corridor's Build park a CTA chip docks under the caption card
 *     ("VIEW THE CASES"); clicking it ARMS an orbit of the four production
 *     case cards (Mímir / Vesper / Babylon / Heimdall) around the accretion
 *     sphere (`ArcCasesRing`, mounted beside `CorridorArmillary` under the
 *     same pointer-look rig);
 *   - the orbit is CLICK-owned, not scroll-owned: `arcCasesStore` holds
 *     `armed` + a cumulative `caseIndex`; rotation follows
 *     `rotationForCaseIndex` through the shipped ring spring. Scroll keeps
 *     the camera; walking out of the Build band auto-disarms (no scroll
 *     lock, no new scroll writers — the ADR-032 guardrails);
 *   - while armed the stack's surfaces fan dims hard and the sources lanes
 *     dim softly (`ARC_SURFACE_DIM` / `ARC_SOURCE_DIM`), so the sphere stops
 *     explaining and starts showing.
 *
 * Mobile / reduced-motion / fallback corridor never mount the ring OR the
 * CTA (gate parity — a ring without its arming CTA is dead weight).
 * Flip to `false` to restore the pre-ADR-033 corridor byte-identically:
 * every per-frame hook multiplies by a literal 1 when the flag is off.
 *
 * Lives in its own module so the DepthGatewayScene actors, the station
 * headers (CTA host), and the corridor shell can read it without circular
 * imports (the `unifiedServicesInstrument` precedent).
 */
export const ARC_CASES_ORBIT = false;

/**
 * Mount gate for the ring AND the CTA host. Deliberately matches the
 * desktop station-header layer (`CorridorStationHeaders` hides at
 * `(max-width: 1100px), (max-height: 759px)` — home-v2.css) rather than
 * the services ring's 961px gate: the CTA lives in that layer, and the
 * ring must never exist where its CTA cannot.
 */
export const ARC_CASES_MEDIA =
  "(min-width: 1101px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)";
