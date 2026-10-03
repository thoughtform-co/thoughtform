/**
 * The corridor's PRELUDE (ADR-138) — the parked brandmark painted BEFORE the
 * corridor is reached, and the channels that walk it into the Arc's first
 * frame.
 *
 * WHY. On `/` the corridor is behind the reader by the time About and the era
 * stage arrive, so its canvas is already in the services ambient hold and the
 * parked particle mark sits behind both, dimmed. On
 * `/arcs/thoughtform/workshop-v1` About and the eras come FIRST: the corridor is
 * below them, not armed, and paints nothing. This lets that route ask for the
 * homepage's look anyway, and then fold the mark into the solid glyph where
 * the thesis frame holds it.
 *
 * ⚠ OFF IS EVERY OTHER ROUTE. `level` 0 is identity in every reader: the
 * scene's engagement, the core's paint gate and envelopes, the gate's clip.
 * Only the workshop route's flow writer (`flow/useWorkshopFlow.ts`) writes
 * it, and its `park()` puts it back to rest.
 *
 * The channels (all 0..1):
 *   · `level` — the prelude is up. The corridor paints (frameloop, the core)
 *     though it is not armed, and the core takes its PARKED look: the billboard
 *     in front of the camera, the wireframe at full depth, the ambient dim.
 *   · `travel` — the mark leaves the park for its thesis anchor. It is the
 *     services park (`recT`) run backwards: the weld unwinds onto the world
 *     anchor at the glyph's own size, and the dim lifts to full ink.
 *   · `fold` — the wireframe folds back onto its seed (`depth` 1 → 0), which
 *     the core rasterises from the glyph at the first frame of the fold, so it
 *     lands on the glyph's own pixels.
 *   · `aperture` — the square the thesis frame opens through, in CSS px of the
 *     viewport (the corridor's cell is fixed at 0, 0 while the prelude holds):
 *     the compass gate paints only INSIDE it and the core only OUTSIDE it, so
 *     the opening is the hand-over, across a soft edge `feather` wide. `null`
 *     leaves both whole.
 *
 * Three-free and DOM-free (the `pileHoldRef` / `vwTravelRef` shape), so a
 * route can import it without the corridor's graph. Mirrored as
 * `data-corridor-prelude` on `<html>` for the smokes.
 */

export interface CorridorPreludeAperture {
  /** Centre, CSS px of the viewport. */
  cx: number;
  cy: number;
  /** Half the square's side, CSS px. 0 = closed (nothing of the frame shows). */
  half: number;
  /** The width of the square's SOFT EDGE, CSS px, never more than `half`:
   *  across it the core fades out as the frame fades in, so the opening has no
   *  line (the owner, 2026-09-30: "a frame going over the brand mark … make it
   *  a bit more subtle"). 0 = a hard edge. */
  feather: number;
}

export interface CorridorPrelude {
  level: number;
  travel: number;
  fold: number;
  aperture: CorridorPreludeAperture | null;
}

export const corridorPreludeRef: { current: CorridorPrelude } = {
  current: { level: 0, travel: 0, fold: 0, aperture: null },
};

const listeners = new Set<(live: boolean) => void>();

/** True while a route holds the prelude up. */
export function preludeLive(): boolean {
  return corridorPreludeRef.current.level > 0;
}

/** Subscribe to the prelude going live or off. Returns the unsubscribe. */
export function onPreludeChange(cb: (live: boolean) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/**
 * Write the prelude's channels. Notifies only when it goes live or off, which
 * is all the scene's engagement needs; the channels themselves are read per
 * frame.
 */
export function writePrelude(next: CorridorPrelude): void {
  const was = preludeLive();
  const cur = corridorPreludeRef.current;
  cur.level = next.level;
  cur.travel = next.travel;
  cur.fold = next.fold;
  cur.aperture = next.aperture;
  const now = preludeLive();
  if (was === now) return;
  if (typeof document !== "undefined") {
    if (now) document.documentElement.setAttribute("data-corridor-prelude", "1");
    else document.documentElement.removeAttribute("data-corridor-prelude");
  }
  for (const cb of listeners) cb(now);
}

/** Back to rest: every channel off. */
export function clearPrelude(): void {
  writePrelude({ level: 0, travel: 0, fold: 0, aperture: null });
}
