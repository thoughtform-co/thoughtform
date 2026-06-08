/**
 * epilogueTimeline — single source of truth for the corridor's
 * post-Build "billions on the same layer" beat (ADR-018 epilogue v2).
 *
 * The corridor saturates at `paintProgress === 1` (camera parked at
 * CAMERA_END, sphere parked at Intelligence). The epilogue then takes
 * over via the independent `epilogueProgress` channel (0..1) written
 * by `useDepthScroll`. Every painter that needs to react to the
 * epilogue reads its own SUB-BAND off this table so the choreography
 * stays declarative.
 *
 * Authoring rule: bands are [start, end] in epilogueProgress space.
 * Order them so the user-facing read goes:
 *
 *   1. Build chapter clears (Build header + sources/interfaces fade
 *      out — same length + style as the prior Navigate -> Encode and
 *      Encode -> Build handoffs, so the corridor "rule" holds for the
 *      Build -> billions handoff too).
 *   2. A pure-morph gap (no title on screen) where the camera stays
 *      pinned but the BACKGROUND warps: the latent wormhole topology
 *      unrolls into a horizon landscape, contour shards settle onto
 *      it, and a small gold portal emerges in the distance.
 *   3. The billions chapter arrives (title + paragraph fade/type in,
 *      news cards orbit in around the now-shrunken sphere).
 *
 * The gap between BUILD_OUT_END and SIGNAL_IN_START is intentional —
 * never have Build copy and billions copy on screen at the same time.
 */

/** Closed-form smoothstep used by every band consumer. Equivalent to
 *  GLSL's `smoothstep(a, b, p)` — eases the 0..1 ramp at both ends so
 *  band crossings don't kink. */
export function band(p: number, edge0: number, edge1: number): number {
  if (edge1 <= edge0) return p >= edge1 ? 1 : 0;
  const t = (p - edge0) / (edge1 - edge0);
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t * t * (3 - 2 * t);
}

/** Each band's [start, end] in epilogueProgress (0..1).
 *
 *  Stage budget: the epilogue spans ~300svh of scroll, so each 0.1
 *  unit of epilogueProgress is ~30svh — roughly one viewport. The
 *  gap [BUILD_OUT.end, SIGNAL_IN.start] is therefore ~9-10svh, plenty
 *  of room for the morph + gateway to read before the title arrives.
 */
export const EPILOGUE_BANDS = {
  /** Build header + ShellStack (sources / surfaces lanes + pips) +
   *  source/surface DOM labels fade OUT. Sized to match the
   *  Navigate->Encode and Encode->Build header fade windows
   *  (~0.07 wide in CORRIDOR_TIMELINE), scaled into the epilogue's
   *  0..1 space. Runs from the very first scroll past the Build
   *  park so the prior chapter clears immediately. */
  BUILD_OUT: { start: 0.0, end: 0.22 } as const,

  /** Gimbal sphere slides right AND shrinks. Starts a hair after
   *  BUILD_OUT begins so the slide reads as "and now the substrate
   *  moves aside" rather than competing with the header fade.
   *  Finishes mid-epilogue so it's settled by the time the cards
   *  deploy. */
  SPHERE: { start: 0.08, end: 0.55 } as const,

  /** Topology warps into the landscape: wormhole tube unrolls into
   *  a horizon heightfield, contour shards settle onto the ground.
   *  Wider window than the others so the per-vertex morph feels
   *  like a slow physical transformation, not a swap. Starts almost
   *  immediately and runs through most of the epilogue. */
  MORPH: { start: 0.06, end: 0.7 } as const,

  /** The gold portal emerges on the horizon. Trails the MORPH start
   *  so the ground has already begun forming when the gateway scales
   *  up out of it; runs past MORPH end so the gateway keeps
   *  brightening as the landscape settles. */
  GATEWAY: { start: 0.2, end: 0.85 } as const,

  /** "The labs just bet billions on the same layer." title +
   *  paragraph fade / type IN. Starts WELL AFTER BUILD_OUT.end
   *  (gap from 0.22 -> 0.52 is pure morph + gateway, no title on
   *  screen) so the corridor handoff rule holds. */
  SIGNAL_IN: { start: 0.52, end: 0.74 } as const,

  /** News cards fade in + complete their deploy rotation. Slightly
   *  trails SIGNAL_IN so the title lands first and the cards orbit
   *  in around it. */
  CARDS_IN: { start: 0.54, end: 0.84 } as const,
} as const;

/** Helper that returns the eased 0..1 reveal for a named band. */
export function epilogueBand(epilogueProgress: number, band_: keyof typeof EPILOGUE_BANDS): number {
  const w = EPILOGUE_BANDS[band_];
  return band(epilogueProgress, w.start, w.end);
}
