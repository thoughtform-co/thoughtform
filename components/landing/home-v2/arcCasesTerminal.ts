/**
 * Feature flag for the ARC CASES TERMINAL (ADR-035 — supersedes the
 * ADR-034 terrace reveal). Replaces `arcCasesTerrace.ts`.
 *
 * When ON (desktop-capable only, see ARC_CASES_MEDIA):
 *   - at the corridor's Build park a CTA chip sits centered UNDER the
 *     "BUILD ON THE LAYER." station title ("VIEW THE CASES"); clicking
 *     it ARMS the reveal. No camera moves — the corridor stays a pure
 *     Z dolly. Instead the sources/surfaces DOM label chips fully fade
 *     out (the canvas pips/streams stay lit — they frame the reveal)
 *     and a fixed DOM terminal-style overlay unfurls over the centre of
 *     the viewport, its two halves CONVERGING to the centre seam (the
 *     inverse of the caption card's centre-out "sanctioned unfold"),
 *     showing one production case (Mímir / Vesper / Babylon / Heimdall)
 *     at a time;
 *   - the terminal is CLICK-owned, not scroll-owned: `arcCasesStore`
 *     holds `armed` + the front `slot`; prev/next + numbered chips step
 *     the panel's content (crossfade). Scroll keeps the Z dolly clock;
 *     walking out of the Build band auto-disarms (no scroll lock, no new
 *     scroll writers — the ADR-032 guardrails). The unfurl is a pure CSS
 *     clip-path transition; only the damped arm LEVEL runs in JS (rAF).
 *
 * Mobile / reduced-motion / fallback corridor never mount the overlay OR
 * the CTA (gate parity — a terminal without its arming CTA is dead
 * weight). Flip to `false` to restore the pre-ADR-033 corridor
 * byte-identically: every per-frame reader multiplies by a literal 1 (no
 * label/caption fade) and every mount is conditional on this flag.
 *
 * Lives in its own module so the corridor shell, the station headers,
 * and the DOM sceneGeom reader can import it without circular imports
 * (the `unifiedServicesInstrument` / `arcCasesTerrace` precedent).
 */
export const ARC_CASES_TERMINAL = true;

/**
 * Mount gate for the terminal overlay AND the CTA dock. Deliberately
 * matches the desktop station-header layer (`CorridorStationHeaders`
 * hides at `(max-width: 1100px), (max-height: 759px)` — home-v2.css)
 * rather than the services ring's 961px gate: the CTA lives in that
 * layer, and the overlay must never exist where its CTA cannot.
 *
 * GATE PARITY: this JS gate is the exact twin of the CSS hide of BOTH
 * `.home-v2-cases-cta-dock` AND `.home-v2-cases-terminal` at the same
 * `(max-width: 1100px), (max-height: 759px), (prefers-reduced-motion:
 * reduce)` media in home-v2.css. If one moves, both move — a terminal
 * that renders below its CSS hide (or a CTA the overlay can't answer)
 * is the bug this parity exists to prevent.
 */
export const ARC_CASES_MEDIA =
  "(min-width: 1101px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)";
