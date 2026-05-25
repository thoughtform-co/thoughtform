/**
 * depthGatewayStore — single transform channel for the home-v2
 * depth-corridor scene (ADR-018).
 *
 * Mirrors the pattern of `brandmarkJourneyStore`: a single Zustand
 * store holds the current depth-scroll state, the rAF scroll hook
 * writes it once per frame, and the R3F painters read it
 * imperatively inside their own `useFrame` loops so the per-frame
 * cost stays at uniform writes only (no React re-renders).
 *
 * The store models a depth CORRIDOR (ADR-018): a 3D camera path
 * that visits five narrative beats along -Z. Each beat owns its own
 * progress window; the camera dollies continuously while the world
 * geometry (compass / orbits / interstitial / sphere) sits at
 * pre-baked Z stations and is approached, parked at, and passed.
 *
 * The legacy `chamberA/B/C` thirds are kept for the existing
 * `BrandmarkPointCloud` / `IntelligenceChamber` painters during
 * migration; new painters should read `beat`, `cameraT`, and
 * `gateProgress` instead.
 *
 * Scope is local to `/test/home-v2` — the production landing page
 * does not import this store.
 */

import { create } from "zustand";

/** Legacy chamber id retained for backwards compatibility with the
 *  existing painters (BrandmarkPointCloud, IntelligenceChamber, the
 *  HUD readouts). Maps 1:1 from `beat` via `beatToChamberId`. */
export type ChamberId = "definition" | "diagnostic" | "intelligence";

/** Narrative beats along the corridor (ADR-018). Each beat owns a
 *  scroll window; the in-between beats (`passthrough-*`) are the
 *  travel windows where geometry physically passes the camera. */
export type Beat =
  | "thoughtform"
  | "passthrough-01"
  | "diagnostic"
  | "passthrough-02"
  | "intelligence";

export interface DepthGatewayTransform {
  /** Global 0..1 progress across the sticky stage. */
  progress: number;
  /** Smoothstep'd camera travel parameter [0..1]. Same domain as
   *  `progress` but eased so start/end have decelerated velocity
   *  — feels like a deliberate push rather than a linear lerp. */
  cameraT: number;
  /** Current narrative beat (ADR-018). */
  beat: Beat;
  /** Local 0..1 progress through the current beat. `0` at the
   *  beat's start, `1` at its end. Painters that need to drive
   *  beat-local animations (e.g. brandmark settle, orbits draw-in)
   *  should read this. */
  gateProgress: number;
  /** Legacy chamber id, derived from `beat`. */
  chamberId: ChamberId;
  /** Legacy per-chamber 0..1, derived from `beat` + `gateProgress`.
   *  Painters that haven't migrated to the corridor model yet still
   *  read these. */
  chamberA: number;
  chamberB: number;
  chamberC: number;
  /** True while the sticky stage is engaged with the viewport. */
  active: boolean;
  /** True only while the stage is approaching its pinned position
   *  AFTER the hero has fully scrolled off-screen but BEFORE the
   *  sticky cell has reached the top of the viewport. While armed,
   *  painters pre-position elements at the parked Thoughtform
   *  layout (`paintProgress = 0`) AND paint at full opacity, so the
   *  second section reads as composed on arrival — copy + compass
   *  + brandmark are already visible as the stage rises into view,
   *  rather than appearing only after the stage finishes pinning. */
  armed: boolean;
  /** Progress value PAINTERS should drive world positions + camera
   *  sync from. Equal to `progress` when `active`. Forced to 0 while
   *  `armed` so the parked Thoughtform layout is what's visible as
   *  the stage rises into view. While neither active nor armed,
   *  equals `progress` but painters bail out early so the value is
   *  moot. */
  paintProgress: number;
  /** Signed per-frame scroll velocity in "progress units per second".
   *  Positive when scrolling forward through the stage, negative on
   *  upward scroll, zero when idle. Used by `ScrollStreaks` to
   *  amplify near-camera streak flow only when the user is
   *  actively moving. */
  velocity: number;
}

export const INITIAL_TRANSFORM: DepthGatewayTransform = {
  progress: 0,
  cameraT: 0,
  beat: "thoughtform",
  gateProgress: 0,
  chamberId: "definition",
  chamberA: 0,
  chamberB: 0,
  chamberC: 0,
  active: false,
  armed: false,
  paintProgress: 0,
  velocity: 0,
};

interface DepthGatewayState {
  transform: DepthGatewayTransform;
  setTransform: (next: DepthGatewayTransform) => void;
  reset: () => void;
}

export const useDepthGatewayStore = create<DepthGatewayState>((set) => ({
  transform: INITIAL_TRANSFORM,
  setTransform: (next) =>
    set((state) => (transformEquals(state.transform, next) ? state : { transform: next })),
  reset: () =>
    set((state) =>
      transformEquals(state.transform, INITIAL_TRANSFORM) ? state : { transform: INITIAL_TRANSFORM }
    ),
}));

function transformEquals(a: DepthGatewayTransform, b: DepthGatewayTransform): boolean {
  return (
    a.progress === b.progress &&
    a.cameraT === b.cameraT &&
    a.beat === b.beat &&
    a.gateProgress === b.gateProgress &&
    a.chamberId === b.chamberId &&
    a.chamberA === b.chamberA &&
    a.chamberB === b.chamberB &&
    a.chamberC === b.chamberC &&
    a.active === b.active &&
    a.armed === b.armed &&
    a.paintProgress === b.paintProgress &&
    a.velocity === b.velocity
  );
}

/** Resolve corridor engagement state from the stage rect and the
 *  current global progress. Returns:
 *
 *   - `active`: stage is pinned (rect.top <= 0) and still in view.
 *     Painters paint at the live progress with their normal
 *     visibility envelopes.
 *   - `armed`: stage is rising into the pinned position but hasn't
 *     pinned yet (0 < rect.top < vh). Painters paint at FULL opacity
 *     against the parked Thoughtform layout (`paintProgress = 0`)
 *     so the second section is composed and visible the moment its
 *     sticky cell starts entering the viewport.
 *   - `paintProgress`: equal to `progress` while active; forced to 0
 *     while armed (or otherwise) so painters draw the parked beat.
 *
 *  Stage / hero layering: the stage canvas lives inside
 *  `.home-v2-stage__sticky` (z-index 2) which scrolls up over the
 *  sticky hero (z-index 1) as the user scrolls past the hero. The
 *  stage canvas only covers the stage area of the viewport, so
 *  painting at full opacity while armed doesn't overlap the hero. */
export function getCorridorEngagement(
  stageRect: DOMRect,
  vh: number,
  progress: number
): { active: boolean; armed: boolean; paintProgress: number } {
  const pinned = stageRect.top <= 0;
  const stageInView = stageRect.bottom > 0 && stageRect.top < vh;
  const active = pinned && stageRect.bottom > 0;
  const armed = stageInView && !pinned;
  const paintProgress = active ? progress : 0;
  return { active, armed, paintProgress };
}

// ────────────────────────────────────────────────────────────────
// Beat layout (ADR-018)
// ────────────────────────────────────────────────────────────────

/** Beat scroll windows along the 0..1 stage progress.
 *
 *  These boundaries DEFINE the corridor pacing. Painters lerp
 *  geometry against them; the camera path uses `cameraT` (eased
 *  global progress) directly so the camera dollies CONTINUOUSLY
 *  through the beats and only the diagram geometry parks.
 *
 *  Pacing history:
 *    - Original: passthrough-01 = 0.18 → 0.32 (~14% of scroll).
 *    - Immersion pass: passthrough-01 = 0.16 → 0.40 (~24%).
 *    - Latent depth spacing pass (current): passthrough-01 =
 *      0.14 → 0.46 (~32%). Combined with the stage growing to
 *      460svh (see home-v2.css), the absolute fly-through scroll
 *      length between the Thoughtform compass and the Diagnostic
 *      orbital field is roughly 1.7x what it was after the
 *      immersion pass and ~3.5x the original. The Diagnostic
 *      beat shifts later and its park progress moves to 0.53, so
 *      the gate's solved world Z (see sceneGeom.ts
 *      gateZAtParkProgress) sits several world units deeper —
 *      Diagnostic is genuinely distant when first registered
 *      and approached over a real travel window.
 *
 *  Downstream beats keep similar narrative shape because the
 *  longer stage absorbs the widened passthrough; in absolute
 *  scroll they all gain headroom relative to the previous pass. */
export const BEAT_WINDOWS: { beat: Beat; start: number; end: number }[] = [
  { beat: "thoughtform", start: 0.0, end: 0.14 },
  { beat: "passthrough-01", start: 0.14, end: 0.46 },
  { beat: "diagnostic", start: 0.46, end: 0.6 },
  { beat: "passthrough-02", start: 0.6, end: 0.76 },
  { beat: "intelligence", start: 0.76, end: 1.0 },
];

/** Park centres for each "parked" beat (used by the projected
 *  brandmark to know when it is at rest). The passthrough beats
 *  intentionally do not appear here.
 *
 *  Park progress history:
 *    - Thoughtform: 0.08 → 0.07 (slightly earlier so the parked
 *      composition holds during the trimmed Thoughtform beat
 *      before the longer fly-through begins).
 *    - Diagnostic: 0.47 → 0.53. Combined with the later
 *      passthrough-01 end, the Diagnostic gate's solved world Z
 *      sits ~1.5 units deeper than before, so the orbital field
 *      visibly approaches from the distance for the entire
 *      fly-through.
 *    - Intelligence: 0.86 → 0.88. Shifted later to match the
 *      new intelligence beat start (0.76); the substrate sphere
 *      still owns the late-corridor scale-up. */
export const BEAT_PARK_CENTRES: Partial<Record<Beat, number>> = {
  thoughtform: 0.07,
  diagnostic: 0.53,
  intelligence: 0.88,
};

/** Resolve which beat a global progress value sits in, plus the
 *  beat-local 0..1 progress inside that beat's window. */
export function resolveBeat(progress: number): { beat: Beat; gateProgress: number } {
  const p = clamp01(progress);
  for (let i = 0; i < BEAT_WINDOWS.length; i++) {
    const { beat, start, end } = BEAT_WINDOWS[i];
    if (p <= end) {
      const span = Math.max(1e-6, end - start);
      return { beat, gateProgress: clamp01((p - start) / span) };
    }
  }
  // p >= 1 → end of last beat
  const last = BEAT_WINDOWS[BEAT_WINDOWS.length - 1];
  return { beat: last.beat, gateProgress: 1 };
}

/** Map a narrative beat to the legacy chamber id (HUD sector text,
 *  existing painters that still read `chamberId`). */
export function beatToChamberId(beat: Beat): ChamberId {
  switch (beat) {
    case "thoughtform":
    case "passthrough-01":
      return "definition";
    case "diagnostic":
      return "diagnostic";
    case "passthrough-02":
    case "intelligence":
      return "intelligence";
  }
}

/** Camera travel parameter from global progress. Smoothstep so the
 *  start and end of the corridor have decelerated velocity — feels
 *  like a deliberate push rather than a linear lerp. */
export function cameraTravelT(progress: number): number {
  return smoothstep(0, 1, clamp01(progress));
}

// ────────────────────────────────────────────────────────────────
// Legacy chamber thirds (kept for migration)
// ────────────────────────────────────────────────────────────────

/**
 * Derive legacy per-chamber local progress from the beat structure.
 * Each chamber covers the beats that map to it (thoughtform +
 * passthrough-01 → A, diagnostic → B, passthrough-02 + intelligence
 * → C). Painters still on the chamber model see a clean 0..1 ramp
 * across the relevant beats; new painters should read `beat` /
 * `gateProgress` instead.
 */
export function deriveChambers(progress: number): {
  chamberA: number;
  chamberB: number;
  chamberC: number;
  chamberId: ChamberId;
  beat: Beat;
  gateProgress: number;
} {
  const { beat, gateProgress } = resolveBeat(progress);
  const chamberId = beatToChamberId(beat);

  // Chamber A: spans [0, end of passthrough-01]
  // Chamber B: spans [start of diagnostic, end of diagnostic]
  // Chamber C: spans [start of passthrough-02, 1]
  const chamberASpan = BEAT_WINDOWS[1].end - BEAT_WINDOWS[0].start; // 0.0 → 0.46
  const chamberBSpan = BEAT_WINDOWS[2].end - BEAT_WINDOWS[2].start; // 0.46 → 0.60
  const chamberCSpan = BEAT_WINDOWS[4].end - BEAT_WINDOWS[3].start; // 0.60 → 1.00

  const chamberA = clamp01((progress - BEAT_WINDOWS[0].start) / chamberASpan);
  const chamberB = clamp01((progress - BEAT_WINDOWS[2].start) / chamberBSpan);
  const chamberC = clamp01((progress - BEAT_WINDOWS[3].start) / chamberCSpan);

  return { chamberA, chamberB, chamberC, chamberId, beat, gateProgress };
}

// ────────────────────────────────────────────────────────────────
// Math helpers
// ────────────────────────────────────────────────────────────────

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
