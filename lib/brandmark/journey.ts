/**
 * journey — single source of truth for the brandmark's continuous
 * transform as the user scrolls the v7 landing page.
 *
 * Replaces the per-station snapshot model + multi-painter HARD SWAP
 * fabric (`useSigilChoreography` + `brandmarkParticleStore` +
 * `useIlayerProgressStore.handoffActive`) with a pure function:
 *
 *     scrollY → BrandmarkTransform
 *
 * The transform is consumed by:
 *
 *   - `BrandmarkParticleStation` (the global pixel-space shader) which
 *     paints the brandmark cloud at the transform's rect/rotation/
 *     density/dispersion every frame.
 *   - `OrbitField` (the R3F intelligence-layer scene) which reads
 *     `ringsActive` + `ringProgress` to drive its side-orbit emerge
 *     envelopes (ADR-014; replaces the deprecated ring extrude /
 *     parent rotation channels).
 *
 * No HARD SWAPs, no painter handoffs, no per-frame CSS attribute
 * fabric. One painter for the cloud, one R3F scene for rings; both
 * read the SAME transform and stay co-located by construction.
 *
 * Design principles (ADR-013, enforced here):
 *
 *   1. The brandmark is a single CONTINUOUS artifact that EVOLVES.
 *      Position, scale, rotation, density, dispersion are continuous
 *      functions of scrollY.
 *   2. No opacity fades for the brandmark cloud anywhere between
 *      hero exit and post-orbit fade. Every mid-journey transition
 *      is geometric: rect lerp, density lerp, dispersion lerp,
 *      rotation lerp.
 *   3. No crossfades between painters. One painter end-to-end.
 *   4. Decorations (rings, sub-orbits, halo dots) emerge GEOMETRICALLY
 *      via scale, never via opacity.
 *   5. Hero entrance and post-orbit exit are the only bookends. They
 *      may use opacity ramps because there is nothing to evolve
 *      from / into.
 */

import {
  splitRotation,
  vectorRingOpacity,
} from "@/components/landing/v7/intelligence-layer/intelligenceLayerGeom";
import type { BrandmarkShapeKey } from "@/lib/brandmark/shapes";

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

export type KeyframeId = "sigil" | "miss" | "substrate" | "rail" | "orbit";

export const KEYFRAME_IDS: readonly KeyframeId[] = ["sigil", "miss", "substrate", "rail", "orbit"];

export interface KeyframeParkedAttrs {
  /** Particle density `[0, 1]`. 1 = filled mark. */
  density: number;
  /** Particle wander strength `[0, 1]`. 0 = particles snap to home. */
  dispersion: number;
  /** When this keyframe is the active dock, are the R3F rings
   *  + decorations the visual story? Only true for `substrate`. */
  ringsActive?: boolean;
  /** Which brandmark shape topology this keyframe parks at. Defaults
   *  to `"full"` (the canonical mark). Substrate parks at `"ring"`,
   *  so the painter blends the cloud from the full mark to a thick
   *  ring during the substrate-engagement window (ADR-014). */
  shapeKey?: BrandmarkShapeKey;
}

/** A per-arrival dispersion bump applied during the transit INTO this
 *  keyframe. Returning a positive value at mid-transit (`t = 0.5`)
 *  scatters the cloud through atmosphere; returning 0 keeps the
 *  cloud coherent. `null` explicitly disables the bump. */
export type DispersionBumpFn = ((t: number) => number) | null;

export type EasingFn = (t: number) => number;

export interface BrandmarkKeyframe {
  id: KeyframeId;
  /** Live anchor resolver. Runs each frame so sticky parents,
   *  re-portaled glyphs, and late layout all settle naturally. */
  resolveRect: (ctx: JourneyContext) => DOMRect | null;
  /** Fraction of the segment INTO this keyframe that counts as
   *  "parked at this keyframe" (vs in transit from the previous).
   *  Default `0.32`. */
  parkFracIn?: number;
  /** Fraction of the segment OUT OF this keyframe that counts as
   *  "still parked here" (before transit to the next keyframe
   *  begins). Default `0.32`. */
  parkFracOut?: number;
  /** Fraction of viewport height at which this keyframe's rect
   *  centre sits when it is considered parked. Default `0.5`
   *  (centre of viewport). Larger values (e.g. `0.62`) shift the
   *  parking point LOWER in the viewport — i.e. the brandmark
   *  arrives at the dock with less scrolling required, so the
   *  keyframe "appears" earlier in the user's scroll progression
   *  without changing where the dock element actually sits in the
   *  DOM. Used for hero → sigil arrival where the brandmark should
   *  be present at the sigil dock by the time the section title is
   *  in the upper viewport, not by the time the dock is dead-centre. */
  parkViewportFrac?: number;
  /** Render attrs while parked here. */
  parked: KeyframeParkedAttrs;
  /** Per-arrival transit overrides. SUBSUMES Tier 1 Change 1 —
   *  growing or shrinking transits (miss→substrate, substrate→rail,
   *  rail→orbit) set `dispersionBump = null` so the cloud stays
   *  coherent through the rect lerp. Same-size atmospheric transits
   *  (sigil→miss) keep the default bump because dispersion IS the
   *  visual story at that scale. */
  transitIn?: {
    /** `undefined` = use the global default (`sin(πt) * 0.45`).
     *  `null` = no bump at all. A custom function lets a keyframe
     *  tune its own arrival amplitude. */
    dispersionBump?: DispersionBumpFn;
    /** `undefined` = use the global default (`power3.inOut`). */
    easing?: EasingFn;
  };
}

/** Live runtime context. Resolved once per scroll frame. */
export interface JourneyContext {
  /** Landing-page root (where the parsed prototype HTML mounts). */
  rootEl: HTMLElement;
  /** The practice section. Sticky-parent special case lives here:
   *  while practice straddles the viewport top the orbit anchor's
   *  `getBoundingClientRect()` is clamped, so we use practice.top
   *  as the non-sticky reference for the rail → orbit segment. */
  practiceEl: HTMLElement | null;
  /** The intelligence-layer section. Used as a measurement anchor
   *  for the substrate keyframe's rect resolver. */
  intelligenceEl: HTMLElement | null;
  /** `prefers-reduced-motion: reduce` preference. Hard-pins to the
   *  nearest keyframe instead of running smooth transits. */
  reduceMotion: boolean;
}

/** The output type the painter and the R3F scene both read. */
export interface BrandmarkTransform {
  /** Target rect in viewport (client) pixel coords. */
  rect: { left: number; top: number; width: number; height: number };
  /** `[0, 1]`. `0` only during hero (pre-sigil-entry) and post-orbit
   *  fade bookends. Between those bookends it is always `1` — the
   *  brandmark EVOLVES, it does not fade (Principle 2). */
  opacity: number;
  /** `[0, 1]`. Continuous. */
  density: number;
  /** `[0, 1]`. Continuous (lerped between keyframes; per-arrival
   *  bump applied via `transitIn.dispersionBump`). */
  dispersion: number;
  /** Y-axis rotation in radians. Non-zero only while parked at the
   *  substrate keyframe — driven by `splitRotation(ringProgress)`. */
  rotationY: number;
  /** Whether the R3F ringfield + decorations are the active visual
   *  story right now. Only true while parked at substrate. */
  ringsActive: boolean;
  /** `[0, 1]` progress within the substrate-parked scroll window.
   *  Drives `splitExtrude` (ring depth) and `splitEmerge`
   *  (decoration scale) inside the R3F scene. `0` outside the
   *  window. */
  ringProgress: number;
  /** `[0, 1]` brandmark shape blend. `0` = full mark; `1` = ring
   *  only. Ramps 0→1 during the substrate-engagement window so the
   *  cloud morphs into a thick orbital ring at the intelligence
   *  layer (ADR-014). Always `0` outside that window. */
  shapeBlend: number;
  /** `[0, 1]` brandmark vector-actor opacity multiplier. `1` by
   *  default; ramps `1 → 0` across the HANDOFF phase of the substrate
   *  window so the brandmark vector ring fades out as the R3F
   *  SplitRing fades in (ADR-014 v5). The vector actor multiplies
   *  this against its own effectiveOpacity, so a journey-wide value
   *  of 1 is a no-op for non-substrate beats. */
  vectorOpacity: number;
  /** `[0, 1]` substrate-sphere morph progress (ADR-017). `0` = the
   *  substrate-sphere R3F point cloud paints the brandmark shape at
   *  the miss anchor's projected screen position. `1` = the points
   *  occupy the canonical Fibonacci sphere shell at the substrate
   *  body. Symmetric trapezoid envelope inside the substrate scroll
   *  window — ramps 0 → 1 across the first `SUBSTRATE_MORPH_FRAC`
   *  of the window, holds at 1 through the read beat, and ramps
   *  1 → 0 across the last `SUBSTRATE_MORPH_FRAC` so the cloud
   *  collapses back into the brandmark shape exactly as the
   *  substrate window exits and the brandmark vector resumes
   *  travel toward the rail dock. The vector actor reads the
   *  same channel and does an instant visibility cut while
   *  `substrateMorph > 0` so the swap between vector mark and
   *  particle mark is invisible (the particles cover the same
   *  shape — no opacity fade). Always `0` outside the substrate
   *  window. */
  substrateMorph: number;
  /** `false` only during hero / post-orbit-fade-end. Painter hides
   *  when this is false. */
  visible: boolean;
  /** Which keyframe (if any) we're currently parked at. `null`
   *  during transit beats. Used by the SVG-fallback path of
   *  `useBrandmarkJourney` to write `data-brand-on-*="parked"`
   *  dock attributes so the native source-owned dock glyphs paint
   *  at their parked positions. In particle mode the painter
   *  ignores this field. */
  parkedAt: KeyframeId | null;
}

/** The substrate-parked scroll window. Single source of truth for
 *  the R3F scene's ring envelope; everything that needs to know
 *  "when do the rings come out" reads this. */
export interface SubstrateRange {
  /** scrollY at which the brandmark settles at the substrate dock
   *  (end of miss → substrate transit). `ringProgress = 0` here. */
  engageY: number;
  /** scrollY at which the brandmark begins transit toward rail
   *  (start of substrate → rail transit). `ringProgress = 1` here. */
  exitY: number;
}

// ────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────

/** Default park dwell fraction. With `0.32` each side, every
 *  inter-keyframe segment breaks into: 32% parked at `from`, 36%
 *  visible transit, 32% parked at `to`. */
export const PARK_FRAC = 0.32;

/** Pre-first-keyframe fade-in window, as a fraction of viewport
 *  height. Hero bookend (Principle 5). */
export const FADE_IN_FRAC = 0.6;

/** Post-last-keyframe fade-out window, as a fraction of viewport
 *  height. Post-orbit bookend (Principle 5). */
export const FADE_OUT_FRAC = 0.6;

/** Hero short-circuit. `scrollY < HERO_GUARD_PX` is the hero state
 *  — brandmark always hidden, no journey computation. */
export const HERO_GUARD_PX = 4;

/** Default dispersion bump for same-size atmospheric transits
 *  (sigil → miss). Bell curve peaking at mid-transit. */
const DEFAULT_DISPERSION_BUMP: DispersionBumpFn = (t) => Math.sin(Math.PI * t) * 0.45;

/** Transit exhaust bump for size-changing legs (miss → substrate,
 *  substrate → rail, rail → orbit). Vector-first model: the
 *  brandmark itself is a crisp vector that lerps cleanly between
 *  rects, so the atmosphere field is free to scatter as motion
 *  exhaust around the moving mark. Wider, lower-amplitude bell than
 *  the default — peaks at ~0.35 so the dust trails read as motion
 *  blur, not as the brandmark exploding. */
const EXHAUST_DISPERSION_BUMP: DispersionBumpFn = (t) => Math.sin(Math.PI * t) * 0.35;

/** Atmosphere density at the substrate hold beat. ADR-014 v5: zero —
 *  the brandmark fully dissolves into three clean orbital clusters
 *  during the substrate window, so the atmosphere field has nothing
 *  to accompany. The "clean and futuristic" register the user picked
 *  drops particle dust + atmospheric glow in favour of pure linework
 *  + diamond markers + sparse dot patterns rendered by the R3F
 *  OrbitalCluster primitives. */
const SUBSTRATE_ATMOSPHERE_DENSITY = 0;

/** Atmosphere dispersion at the substrate hold beat. Zero (same
 *  reason as `SUBSTRATE_ATMOSPHERE_DENSITY`). */
const SUBSTRATE_ATMOSPHERE_DISPERSION = 0;

// === Easing semantics ===
//
// Scrollytelling pacing is a function of two things: how much SCROLL
// BUDGET a leg gets (the [startY, endY] window), and HOW THAT BUDGET
// IS REDISTRIBUTED across the rect lerp (the easing curve). We split
// these intentionally so each leg can be tuned for "feel" without
// changing the geometry.

/** Smoothstep — gentle S-curve (3t² − 2t³). Mid-range velocity is
 *  noticeably faster than `power3.inOut`, so the brandmark spends
 *  less time hanging near each dock and more time visibly travelling.
 *  Use for SAME-SIZE translations (sigil → miss, rail → orbit) where
 *  "purposeful motion" is the desired read. */
const TRAVEL_EASE: EasingFn = (t) => t * t * (3 - 2 * t);

/** Smootherstep — gentler S-curve (6t⁵ − 15t⁴ + 10t³). Earlier than
 *  `power3.inOut` at the start of the window, then settles slowly
 *  into the destination dock. Use for SIZE-CHANGING arrivals
 *  (miss → substrate, substrate → rail) where the brandmark needs
 *  visible breathing room around the rect grow / shrink. */
const MORPH_EASE: EasingFn = (t) => t * t * t * (t * (t * 6 - 15) + 10);

/** Power3 inOut — the historical default. Strong S-curve with a
 *  pronounced flat tail at each end. Kept as a fallback for any
 *  keyframe that doesn't declare an explicit `transitIn.easing`. */
const DEFAULT_EASING: EasingFn = (t) => {
  if (t < 0.5) return 4 * t * t * t;
  const f = 2 * t - 2;
  return 0.5 * f * f * f + 1;
};

/** Hidden transform used during hero / off-page. */
export const HIDDEN_TRANSFORM: BrandmarkTransform = {
  rect: { left: 0, top: 0, width: 0, height: 0 },
  opacity: 0,
  density: 1,
  dispersion: 0,
  rotationY: 0,
  ringsActive: false,
  ringProgress: 0,
  shapeBlend: 0,
  vectorOpacity: 1,
  substrateMorph: 0,
  visible: false,
  parkedAt: null,
};

/** Fraction of the substrate scroll window devoted to the brandmark
 *  shape blend on each side (engage + exit). With `0.30` each side,
 *  the morph spreads over the first 30% of the parked window, holds
 *  through the read beat, and retracts in the last 30%. The wider
 *  ramp gives the full → ring transition visible breathing room
 *  instead of snapping into ring topology the moment the substrate
 *  window engages. Combined with `MORPH_EASE` on the rect lerp
 *  (`miss → substrate.transitIn.easing`), the Diagnostic → Intelligence
 *  hand-off reads as a single elegant settle rather than a fast pop. */
const SHAPE_BLEND_FRAC = 0.3;

/** Fraction of the substrate scroll window devoted to the
 *  brandmark → sphere point-cloud morph on each side (ADR-017).
 *  With `0.35` each side, the cloud morphs from the brandmark
 *  shape (sampled at the miss anchor's projected screen position)
 *  into the Fibonacci sphere across the first 35% of the parked
 *  window, holds at the sphere through the read beat, and
 *  collapses back over the last 35% so the cloud is in brandmark
 *  form exactly when the brandmark vector resumes travel toward
 *  the rail dock. */
const SUBSTRATE_MORPH_FRAC = 0.35;

/** While a section's bottom edge is below this viewport fraction, the
 *  visitor is still "reading" that section — the brandmark should stay
 *  parked at its dock instead of entering inter-section transit. */
const SECTION_READING_ZONE_FRAC = 0.35;

// ────────────────────────────────────────────────────────────────────
// Math helpers
// ────────────────────────────────────────────────────────────────────

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function sectionReadingZoneExitY(
  section: HTMLElement | null,
  thresholdFrac = SECTION_READING_ZONE_FRAC
): number | null {
  if (!section) return null;
  const rect = section.getBoundingClientRect();
  return window.scrollY + rect.bottom - window.innerHeight * thresholdFrac;
}

/** Each keyframe is hosted by exactly one section in the page DOM.
 *  This map lets per-leg helpers resolve the from-section so the
 *  brandmark stays section-locked while the visitor is still reading
 *  it, then unlocks once the section's reading zone has cleared. */
const SECTION_ID_BY_KEYFRAME: Record<KeyframeId, string> = {
  sigil: "definition",
  miss: "missing-layer",
  substrate: "intelligence-layer",
  rail: "continuum",
  orbit: "practice",
};

/** Fraction of the sigil → miss travel window reserved as a parked
 *  tail at the miss end. The brandmark visibly arrives at miss
 *  slightly before its centre coincides with the viewport, so the
 *  4-card grid has a beat to register the new mark before the next
 *  scroll input arrives. Without this tail, the brandmark would only
 *  reach miss exactly when miss is mid-viewport, which reads as a
 *  drag rather than a deliberate landing. */
const SIGIL_TO_MISS_PARK_TAIL = 0.15;

/** A per-leg travel window expressed in absolute scroll-Y. Encodes
 *  both the section-locked unlock point (for legs whose from-section
 *  hosts the brandmark — currently sigil → miss) and the parkFrac
 *  carving used by the centre-based default. Other legs fall back to
 *  centre-to-centre with each keyframe's own `parkFracIn` /
 *  `parkFracOut`. */
interface LegTravelWindow {
  /** Absolute scroll-Y at which the leg's progress is `0` (parked at `from`). */
  startY: number;
  /** Absolute scroll-Y at which the leg's progress is `1` (parked at `to`). */
  endY: number;
  /** Fraction of `[startY, endY]` during which we report parked-at-from. */
  parkOut: number;
  /** Fraction of `[startY, endY]` during which we report parked-at-to. */
  parkIn: number;
}

/** Resolve the travel window for a leg.
 *
 *  The `sigil → miss` leg is special: section-02 (`#definition`) is the
 *  brandmark's own host, so transit only arms once the visitor has
 *  scrolled past that section's reading zone. Without this gate the
 *  centre-based math arms transit while the user is still reading the
 *  Thoughtform definition, which historically read as in-section
 *  jiggle. The gate is reversible — once the visitor scrolls back up,
 *  the brandmark re-locks to the sigil dock immediately.
 *
 *  All other legs use centre-to-centre + parkFrac. The `rail → orbit`
 *  leg further re-bases its span on `practice.top` inside
 *  `computeBaseTransform`'s sticky special case; that branch uses
 *  parkFrac from the keyframe table directly and does not call this
 *  helper. */
function resolveLegTravelWindow(
  from: BrandmarkKeyframe,
  to: BrandmarkKeyframe,
  ctx: JourneyContext,
  centres: readonly number[],
  fromIdx: number
): LegTravelWindow {
  if (from.id === "sigil" && to.id === "miss") {
    const fromSection = ctx.rootEl.querySelector<HTMLElement>(
      `#${SECTION_ID_BY_KEYFRAME[from.id]}`
    );
    const exitY = sectionReadingZoneExitY(fromSection);
    const endY = centres[fromIdx + 1];
    if (exitY != null && endY > exitY) {
      return {
        startY: exitY,
        endY,
        parkOut: 0,
        parkIn: SIGIL_TO_MISS_PARK_TAIL,
      };
    }
  }

  return {
    startY: centres[fromIdx],
    endY: centres[fromIdx + 1],
    parkOut: from.parkFracOut ?? PARK_FRAC,
    parkIn: to.parkFracIn ?? PARK_FRAC,
  };
}

interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

function lerpRectLike(a: RectLike, b: RectLike, t: number): RectLike {
  return {
    left: lerp(a.left, b.left, t),
    top: lerp(a.top, b.top, t),
    width: lerp(a.width, b.width, t),
    height: lerp(a.height, b.height, t),
  };
}

function rectFromDOM(rect: DOMRect | null): RectLike | null {
  if (!rect || rect.width <= 0 || rect.height <= 0) return null;
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

// ────────────────────────────────────────────────────────────────────
// Keyframe table
// ────────────────────────────────────────────────────────────────────

/** Build the five-keyframe table from the runtime context. The
 *  resolvers close over `ctx` so each frame's anchor reads are
 *  live (sticky parents, late layout, admin overlays — all handled
 *  by the closure).
 *
 *  Per-arrival overrides (ADR-015 — vector-first model):
 *
 *  | Leg               | dispersionBump            | easing       |
 *  | ----------------- | ------------------------- | ------------ |
 *  | sigil → miss      | default `sin(πt) * 0.45`  | TRAVEL_EASE  |
 *  | miss → substrate  | EXHAUST `sin(πt) * 0.35`  | MORPH_EASE   |
 *  | substrate → rail  | EXHAUST `sin(πt) * 0.35`  | MORPH_EASE   |
 *  | rail → orbit      | `sin(πt) * 0.20`          | TRAVEL_EASE  |
 *
 *  Same-size translations (sigil → miss, rail → orbit) read as
 *  "purposeful motion" under TRAVEL_EASE. Size-changing arrivals
 *  (miss → substrate, substrate → rail) get MORPH_EASE so the rect
 *  grow / shrink reads as a settle that synchronises with the wider
 *  shape-blend ramp inside the substrate window. The dispersion
 *  bump is computed against the RAW segment t (before easing) so
 *  the atmosphere exhaust peaks at the geometric mid-point of each
 *  leg regardless of the rect lerp's curve.
 */
export function buildKeyframes(ctx: JourneyContext): BrandmarkKeyframe[] {
  const { rootEl, intelligenceEl, practiceEl } = ctx;

  const querySigilMark = () => rootEl.querySelector<HTMLElement>(".sigil__mark");
  const queryMissBrand = () =>
    rootEl.querySelector<HTMLElement>("#missing-layer .miss__brand-slot");
  const querySubstrate = () =>
    intelligenceEl?.querySelector<HTMLElement>(".ilayer__brandmark-anchor") ??
    intelligenceEl?.querySelector<HTMLElement>(".ask__brandmark-anchor") ??
    null;
  const queryRail = () => rootEl.querySelector<HTMLElement>("#continuum .crail__brand");
  const queryOrbit = () =>
    practiceEl?.querySelector<HTMLElement>(".approach__orbit__mark") ??
    rootEl.querySelector<HTMLElement>(".approach__orbit__mark");

  // Vector-first model (ADR successor to ADR-013): the BRANDMARK
  // SHAPE is owned by `BrandmarkVectorActor` (crisp inline SVG that
  // reads the journey transform on every rAF tick). The atmosphere
  // field (`BrandmarkParticleStation` with the new soft-radial
  // shader) reads the SAME transform but consumes it as ambient
  // grain and motion exhaust — not as the mark itself.
  //
  // The per-keyframe `parked.density` no longer means "how much of
  // the brandmark do we paint with particles"; it means "how much
  // atmospheric dust accompanies the vector mark at this station".
  // Full-mark stations (sigil, miss, rail, orbit) get density 0 —
  // the vector mark sits alone, crisp, no halo. The substrate hold
  // beat gets a modest density (~0.15) + dispersion (~0.35) so the
  // intelligence-layer scene reads as a luminous field around the
  // vector ring.
  //
  // Transit `dispersionBump` is restored on every leg as exhaust:
  // as the vector mark lerps between rects, the atmosphere bursts
  // around it (peaking at mid-transit) to read as motion blur.
  return [
    {
      id: "sigil",
      resolveRect: () => readUnscaledSigilRect(querySigilMark()),
      // Sigil's dock sits roughly mid-section of #definition (well
      // below the eyebrow + title). Default centre-pin would only
      // park the brandmark when the user has scrolled the dock to
      // viewport centre — by then the eyebrow + title are already
      // scrolled past. parkViewportFrac = 0.62 shifts the parking
      // point so the brandmark is at the dock by the time the
      // section title is in the upper viewport, matching the
      // perceived "one beat sooner" arrival the user asked for.
      parkViewportFrac: 0.55,
      parked: { density: 0, dispersion: 0 },
    },
    {
      id: "miss",
      resolveRect: () => queryMissBrand()?.getBoundingClientRect() ?? null,
      // Diagnostic 4-card grid sits in the lower half of #missing-layer
      // (the .miss__system bottom-anchors via `align-self: end`, so the
      // brand slot resolves to ~y=520-530 in a 900px section). The
      // brandmark + orbits need to LAND in the diagnostic constellation
      // a clear beat before the visitor reaches the section's reading
      // position — otherwise the morph reads as a drawn-out transition
      // that's still resolving when the eye lands on "The missing
      // layer is rarely the model."
      //
      // parkViewportFrac = 0.72 parks the brandmark when the slot
      // center is at viewport 72% (~648 on 900vh), which corresponds
      // to the user having scrolled the section's top edge ~118px BELOW
      // the viewport top. Translation: the diagnostic constellation is
      // fully formed while the visitor still has the section's upper
      // padding above the fold, so the title arrives onto a settled
      // chart instead of into a mid-morph one.
      //
      // History: was 0.5 (regression when the system was centre-aligned),
      // then 0.62 (after the system moved to align-self: end). Bumped
      // to 0.72 in this pass to make the orbital landing read as a
      // distinct beat rather than a coincident one. Sigil at 0.55,
      // miss at 0.72 — the further-down park keyframes get the more
      // aggressive park fraction so they don't out-race the section
      // reveal but still arrive ahead of the visitor's reading eye.
      parkViewportFrac: 0.72,
      parked: { density: 0, dispersion: 0 },
      // sigil → miss: same-size translation; pair the default
      // atmosphere bump (0.45 peak) with `TRAVEL_EASE` so the
      // brandmark visibly leaves section-02 instead of hanging at
      // the sigil dock under power3.inOut's flat-tail S-curve.
      transitIn: {
        easing: TRAVEL_EASE,
      },
    },
    {
      id: "substrate",
      resolveRect: () => querySubstrate()?.getBoundingClientRect() ?? null,
      // shapeKey: "ring" — the vector actor crossfades its full
      // glyph for the ring-only glyph during the substrate window,
      // and the atmosphere drifts inside the resulting orbital ring.
      // The blend ramp is driven by the substrate scroll window in
      // `computeBrandmarkTransform`, not by the parked attrs
      // directly — `shapeKey` is retained as a declarative hint
      // for downstream consumers (preview pages, debug telemetry).
      //
      // parkFracIn / parkFracOut OVERRIDE the default 0.32 so the
      // substrate "parked" window covers most of the intelligence
      // section's scroll range. Default 0.32 made --ilayer-progress
      // drop back to 0 about halfway through the section, so the
      // chamber items faded out before the user could finish
      // reading them. 0.4 in + 0.6 out keeps progress > 0 from
      // before the section reaches viewport top until near the
      // section bottom.
      parkFracIn: 0.4,
      parkFracOut: 0.6,
      parked: {
        density: SUBSTRATE_ATMOSPHERE_DENSITY,
        dispersion: SUBSTRATE_ATMOSPHERE_DISPERSION,
        ringsActive: true,
        shapeKey: "ring",
      },
      transitIn: {
        // miss → substrate: vector lerps from ~144px to ~280px+ AND
        // morphs from full → ring once parked. Use `MORPH_EASE` so
        // the rect grow has a slow-settle character that stays
        // synchronised with the wider shape-blend ramp inside the
        // substrate window — the two channels read as one elegant
        // arrival rather than a fast translate followed by a sudden
        // morph.
        dispersionBump: EXHAUST_DISPERSION_BUMP,
        easing: MORPH_EASE,
      },
    },
    {
      id: "rail",
      resolveRect: () => queryRail()?.getBoundingClientRect() ?? null,
      parked: { density: 0, dispersion: 0 },
      transitIn: {
        // substrate → rail: vector shrinks from ~280px to ~56px;
        // mirror the inbound-substrate easing so the symmetric
        // morph-out from ring-topology back to the canonical mark
        // reads with the same gentle settle as the morph-in.
        dispersionBump: EXHAUST_DISPERSION_BUMP,
        easing: MORPH_EASE,
      },
    },
    {
      id: "orbit",
      resolveRect: () => queryOrbit()?.getBoundingClientRect() ?? null,
      parked: { density: 0, dispersion: 0 },
      transitIn: {
        // rail → orbit: small lateral move under the sticky-practice
        // special case. Use `TRAVEL_EASE` to keep the motion crisp
        // — there is no shape morph here, so the slower MORPH_EASE
        // would only add lingering hangtime.
        dispersionBump: (t) => Math.sin(Math.PI * t) * 0.2,
        easing: TRAVEL_EASE,
      },
    },
  ];
}

/** Sigil's container has a scroll-driven scale tween on the entrance
 *  scrub. `getBoundingClientRect` would return the SCALED rect,
 *  which makes the actor wobble at journey start. Read the
 *  vertical centre from the live rect (correct under any scale) and
 *  the horizontal centre + width/height from the unscaled `offset*`
 *  measurements. */
function readUnscaledSigilRect(el: HTMLElement | null): DOMRect | null {
  if (!el) return null;
  const live = el.getBoundingClientRect();
  if (live.width <= 0 || live.height <= 0) return null;
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  if (w <= 0 || h <= 0) return live;
  const verticalCentre = live.top + live.height / 2;
  const top = verticalCentre - h / 2;
  const parent = el.parentElement;
  let left = live.left;
  if (parent) {
    const pRect = parent.getBoundingClientRect();
    if (pRect.width > 0) left = pRect.left + (pRect.width - w) / 2;
  }
  return new DOMRect(left, top, w, h);
}

// ────────────────────────────────────────────────────────────────────
// Substrate window — the single source of truth for ring progress
// ────────────────────────────────────────────────────────────────────

/** Compute the scroll-Y window during which the brandmark is parked
 *  at the substrate dock. The R3F ringfield's rotation + extrude +
 *  decoration-emerge envelopes are all driven by progress through
 *  this window (`(scrollY - engageY) / (exitY - engageY)`).
 *
 *  Returns `null` when the substrate keyframe isn't bracketed by
 *  neighbouring keyframes (it always should be in our 5-keyframe
 *  layout — defensive).
 *
 *  `ctx` is optional but, when provided, lets the function clamp
 *  `exitY` to the bottom of `#intelligence-layer` in scroll-Y. That
 *  matters because the next centre (`rail` in `#continuum`) now sits
 *  past the `#buildQuote` interstitial; without the clamp, the
 *  substrate window's `parkFracOut` lerps into / past the build-
 *  quote, leaving the spheres + brandmark mid-morph as the cover
 *  rises. The clamp guarantees the substrate window closes inside
 *  intelligence-layer so the spheres finish their full emerge → hold
 *  → retract cycle BEFORE the user reaches the interstitial. */
export function computeSubstrateRange(
  keyframes: readonly BrandmarkKeyframe[],
  centres: readonly number[],
  ctx?: JourneyContext
): SubstrateRange | null {
  const subIdx = keyframes.findIndex((kf) => kf.id === "substrate");
  if (subIdx <= 0 || subIdx >= keyframes.length - 1) return null;
  const sub = keyframes[subIdx];
  const parkIn = sub.parkFracIn ?? PARK_FRAC;
  const parkOut = sub.parkFracOut ?? PARK_FRAC;
  const prevC = centres[subIdx - 1];
  const subC = centres[subIdx];
  const nextC = centres[subIdx + 1];
  const engageY = prevC + (1 - parkIn) * (subC - prevC);
  let exitY = subC + parkOut * (nextC - subC);

  if (ctx?.intelligenceEl && typeof window !== "undefined") {
    const rect = ctx.intelligenceEl.getBoundingClientRect();
    if (rect.height > 0) {
      const sectionBottomY = window.scrollY + rect.bottom;
      // Keep at least a minimum span so progress math stays well-
      // defined; clamp to the section bottom otherwise.
      const minSpan = Math.max(1, subC - engageY);
      exitY = Math.max(subC + minSpan * 0.05, Math.min(exitY, sectionBottomY));
    }
  }

  return { engageY, exitY };
}

// ────────────────────────────────────────────────────────────────────
// Centre resolver
// ────────────────────────────────────────────────────────────────────

/** scrollY at which a keyframe's anchor centre sits at the keyframe's
 *  declared viewport fraction (default 0.5 = viewport centre). Stable
 *  for non-sticky anchors; for the sticky orbit, the return advances
 *  with scrollY during sticky engagement — the rail → orbit transit
 *  branch handles that by using practice.top as a non-sticky reference.
 *
 *  `parkViewportFrac` lets a keyframe arrive earlier in the scroll
 *  by pinning its anchor LOWER in the viewport. For sigil with
 *  `parkViewportFrac = 0.62`, the keyframe is considered parked when
 *  the sigil rect's centre is at viewport 62% — so the user has
 *  scrolled ~12% of viewport height less to reach the parked state
 *  vs. the centre-pinned default. */
function keyframeCentreY(kf: BrandmarkKeyframe, ctx: JourneyContext): number | null {
  const rect = kf.resolveRect(ctx);
  if (!rect || rect.width <= 0 || rect.height <= 0) return null;
  const parkFrac = kf.parkViewportFrac ?? 0.5;
  return window.scrollY + rect.top + rect.height / 2 - window.innerHeight * parkFrac;
}

// ────────────────────────────────────────────────────────────────────
// Per-state transform builders
// ────────────────────────────────────────────────────────────────────

function parkedRectTransform(
  kf: BrandmarkKeyframe,
  ctx: JourneyContext,
  opacity = 1
): BrandmarkTransform | null {
  const rect = rectFromDOM(kf.resolveRect(ctx));
  if (!rect) return null;
  return {
    rect,
    opacity,
    density: kf.parked.density,
    dispersion: kf.parked.dispersion,
    rotationY: 0,
    ringsActive: false,
    ringProgress: 0,
    // Shape blend is driven by the substrate scroll window, not by
    // the parked attrs — outside that window every keyframe paints
    // the full mark.
    shapeBlend: 0,
    // Vector actor at full opacity by default. The substrate-window
    // override below ramps this 1 → 0 during the HANDOFF phase so
    // the R3F SplitRing can take over the visible artefact.
    vectorOpacity: 1,
    // Substrate-sphere morph: 0 outside the substrate window. The
    // override below ramps this through the symmetric trapezoid
    // when parked at substrate.
    substrateMorph: 0,
    visible: opacity > 0,
    parkedAt: kf.id,
  };
}

function transitTransform(
  from: BrandmarkKeyframe,
  to: BrandmarkKeyframe,
  ctx: JourneyContext,
  t: number
): BrandmarkTransform | null {
  const fromRect = rectFromDOM(from.resolveRect(ctx));
  const toRect = rectFromDOM(to.resolveRect(ctx));
  if (!fromRect || !toRect) return null;

  const easing = to.transitIn?.easing ?? DEFAULT_EASING;
  const eased = easing(t);
  const rect = lerpRectLike(fromRect, toRect, eased);

  const density = lerp(from.parked.density, to.parked.density, eased);
  const baseDispersion = lerp(from.parked.dispersion, to.parked.dispersion, eased);

  // Per-arrival bump override:
  //   undefined → default sin(πt) * 0.45 (sigil → miss only in our table)
  //   null       → no bump (substrate, rail, orbit arrivals)
  //   custom fn  → arbitrary amplitude
  const bumpSpec = to.transitIn?.dispersionBump;
  const bumpFn = bumpSpec === undefined ? DEFAULT_DISPERSION_BUMP : bumpSpec; // null or custom
  const bump = bumpFn ? bumpFn(t) : 0;
  const dispersion = Math.min(1.5, Math.max(0, baseDispersion + bump));

  return {
    rect,
    opacity: 1,
    density,
    dispersion,
    rotationY: 0, // rings off during transit; rotation owned by substrate window
    ringsActive: false,
    ringProgress: 0,
    // Shape blend stays 0 during transits — the cloud arrives at the
    // substrate dock in full-mark form and the substrate-window ramp
    // begins the morph only after parking. Same on the way out.
    shapeBlend: 0,
    // Vector actor always at full opacity during transits — the
    // substrate-window HANDOFF ramp only fires inside the substrate
    // scroll window.
    vectorOpacity: 1,
    // Substrate morph: 0 during all transits. Only the substrate
    // window ramp drives this channel.
    substrateMorph: 0,
    visible: true,
    parkedAt: null, // in transit = not parked anywhere
  };
}

// ────────────────────────────────────────────────────────────────────
// Public entry point
// ────────────────────────────────────────────────────────────────────

/** Compute the brandmark transform for the current scroll position.
 *
 *  Returns `null` when one or more keyframe anchors haven't measured
 *  yet (first-paint race, portal'd glyph not yet mounted). Callers
 *  should retain the previous transform and try again next frame.
 *
 *  The function is pure (no side effects, no DOM writes); all DOM
 *  reads are gated by the `keyframes[i].resolveRect(ctx)` closures
 *  and `window.scrollY` / `window.innerHeight`.
 */
export function computeBrandmarkTransform(
  scrollY: number,
  keyframes: readonly BrandmarkKeyframe[],
  ctx: JourneyContext
): BrandmarkTransform | null {
  // === Hero guard ===
  if (scrollY < HERO_GUARD_PX) return HIDDEN_TRANSFORM;

  // === Resolve all keyframe centres ===
  const centres: (number | null)[] = keyframes.map((kf) => keyframeCentreY(kf, ctx));
  if (centres.some((v) => v == null)) return null;
  const c = centres as number[];
  const vh = window.innerHeight;

  // === Substrate window (drives R3F ring channels uniformly) ===
  // `ctx` is passed so the range can clamp `exitY` to the bottom of
  // `#intelligence-layer`. With the Feynman / Evans build-quote now
  // sitting between intelligence-layer and continuum, an unclamped
  // window would extend through the cover and leave the spheres
  // mid-morph as the user reads the axiom.
  const subRange = computeSubstrateRange(keyframes, c, ctx);
  const inSubWindow = subRange != null && scrollY >= subRange.engageY && scrollY <= subRange.exitY;
  let substrateLocalProgress = 0;
  if (inSubWindow && subRange) {
    const span = Math.max(1, subRange.exitY - subRange.engageY);
    substrateLocalProgress = clamp01((scrollY - subRange.engageY) / span);
  }

  // === Base transform (sticky special cases first, then bracketed) ===
  let base: BrandmarkTransform | null = null;

  // Reduced motion: pin to nearest keyframe.
  if (ctx.reduceMotion) {
    if (scrollY < c[0] - vh * FADE_IN_FRAC) return HIDDEN_TRANSFORM;
    if (scrollY > c[c.length - 1] + vh * FADE_OUT_FRAC) return HIDDEN_TRANSFORM;
    let nearest = 0;
    let best = Math.abs(scrollY - c[0]);
    for (let i = 1; i < keyframes.length; i++) {
      const d = Math.abs(scrollY - c[i]);
      if (d < best) {
        best = d;
        nearest = i;
      }
    }
    base = parkedRectTransform(keyframes[nearest], ctx);
  } else {
    base = computeBaseTransform(scrollY, keyframes, c, vh, ctx);
  }

  if (!base) return null;

  // === Substrate channels — override rotation + ring channels +
  //     shape blend + vector opacity when parked at substrate. The
  //     base transform already has the substrate rect (we resolved
  //     it as parked-at-substrate); we just add the rotation arc,
  //     ring progress, the shape-morph ramp, and the vector-opacity
  //     handoff ramp on top.
  //
  //     ADR-014 v5: `vectorOpacity` ramps 1 → 0 across the HANDOFF
  //     phase (0.2-0.4 of the substrate window) so the brandmark
  //     vector ring fades out as the R3F SplitRing fades in. After
  //     0.4 the brandmark is fully dissolved and the three orbital
  //     clusters (post-SPLIT/RESOLVE) are the only visible artefact.
  if (inSubWindow) {
    base = {
      ...base,
      rotationY: splitRotation(substrateLocalProgress),
      ringsActive: true,
      ringProgress: substrateLocalProgress,
      shapeBlend: substrateShapeBlend(substrateLocalProgress),
      vectorOpacity: vectorRingOpacity(substrateLocalProgress),
      substrateMorph: substrateMorphProgress(substrateLocalProgress),
    };
  }

  return base;
}

/** Trapezoid envelope for the brandmark shape blend within the
 *  substrate window. Ramps full → ring over `[0, SHAPE_BLEND_FRAC]`
 *  (smootherstep — gentle start, gentle settle), holds at ring
 *  through the read beat, and ramps ring → full over
 *  `[1 - SHAPE_BLEND_FRAC, 1]` so the cloud departs the section in
 *  its canonical mark form (ADR-014). The smootherstep curve makes
 *  the morph read as a continuous evolve rather than a linear
 *  attribute flip. */
export function substrateShapeBlend(progress: number): number {
  if (progress <= 0) return 0;
  if (progress >= 1) return 0;
  const blendIn =
    progress < SHAPE_BLEND_FRAC ? MORPH_EASE(clamp01(progress / SHAPE_BLEND_FRAC)) : 1;
  const blendOut =
    progress > 1 - SHAPE_BLEND_FRAC ? MORPH_EASE(clamp01((1 - progress) / SHAPE_BLEND_FRAC)) : 1;
  return blendIn * blendOut;
}

/** Symmetric trapezoid envelope for the substrate-sphere point-cloud
 *  morph (ADR-017). Ramps `0 → 1` across the first
 *  `SUBSTRATE_MORPH_FRAC` of the substrate window so the brandmark-
 *  shaped point cloud transforms into the Fibonacci sphere as the
 *  user enters the intelligence-layer read beat. Holds at `1` through
 *  the centre of the window so the sphere is the stable artefact
 *  while the substrate caption is read. Ramps `1 → 0` across the
 *  last `SUBSTRATE_MORPH_FRAC` so the points collapse back into the
 *  brandmark shape exactly as the substrate window exits — at which
 *  point the brandmark vector resumes ownership of the mark and
 *  begins its transit toward the rail dock. The vector actor reads
 *  this same channel and does an instant visibility cut while
 *  `substrateMorph > 0`, so the renderer swap is invisible (the
 *  particles cover the same shape — no opacity fade). */
export function substrateMorphProgress(progress: number): number {
  if (progress <= 0) return 0;
  if (progress >= 1) return 0;
  if (progress < SUBSTRATE_MORPH_FRAC) {
    return MORPH_EASE(clamp01(progress / SUBSTRATE_MORPH_FRAC));
  }
  if (progress > 1 - SUBSTRATE_MORPH_FRAC) {
    return MORPH_EASE(clamp01((1 - progress) / SUBSTRATE_MORPH_FRAC));
  }
  return 1;
}

/** The bracketed-segment math, factored out from the public entry
 *  point so the substrate-window override is the LAST thing the
 *  public function does. */
function computeBaseTransform(
  scrollY: number,
  keyframes: readonly BrandmarkKeyframe[],
  c: readonly number[],
  vh: number,
  ctx: JourneyContext
): BrandmarkTransform | null {
  const lastIdx = keyframes.length - 1;

  // Inside-practice sticky special case: while practice straddles
  // viewport top, orbit is parked regardless of c[orbit] math.
  if (ctx.practiceEl) {
    const practiceRect = ctx.practiceEl.getBoundingClientRect();
    if (practiceRect.top <= 0 && practiceRect.bottom > 0) {
      return parkedRectTransform(keyframes[lastIdx], ctx);
    }
  }

  // === Pre-first-keyframe (hero bookend fade-in) ===
  if (scrollY < c[0]) {
    const fadeStart = c[0] - vh * FADE_IN_FRAC;
    if (scrollY < fadeStart) return HIDDEN_TRANSFORM;
    const ft = clamp01((scrollY - fadeStart) / (c[0] - fadeStart));
    return parkedRectTransform(keyframes[0], ctx, ft);
  }

  // === Post-last-keyframe (post-orbit bookend fade-out) ===
  if (scrollY > c[lastIdx]) {
    const fadeEnd = c[lastIdx] + vh * FADE_OUT_FRAC;
    if (scrollY > fadeEnd) return HIDDEN_TRANSFORM;
    const ft = clamp01((scrollY - c[lastIdx]) / (fadeEnd - c[lastIdx]));
    return parkedRectTransform(keyframes[lastIdx], ctx, 1 - ft);
  }

  // === Bracketed segment ===
  let i = 0;
  while (i + 1 < keyframes.length && c[i + 1] <= scrollY) i++;
  if (i + 1 >= keyframes.length) return parkedRectTransform(keyframes[lastIdx], ctx);

  const from = keyframes[i];
  const to = keyframes[i + 1];

  // Special case: rail → orbit. Orbit anchor (`.approach__orbit__mark`)
  // is sticky inside `.approach__stage`; its
  // `getBoundingClientRect().top` clamps during sticky engagement,
  // making `c[orbit]` advance with scrollY and `rawT` only
  // approach 1 asymptotically. Re-base the transit on practice.top —
  // a non-sticky reference — so park-at-orbit fires at section entry.
  // This branch bypasses `resolveLegTravelWindow` because the span is
  // dynamic (varies with scrollY) and parkFrac is read directly from
  // the keyframe table.
  if (to.id === "orbit" && ctx.practiceEl) {
    const practiceTop = ctx.practiceEl.getBoundingClientRect().top;
    if (practiceTop <= 0) {
      return parkedRectTransform(to, ctx);
    }
    const transitEndY = scrollY + practiceTop;
    const orbitSpan = Math.max(1, transitEndY - c[i]);
    const rawT = clamp01((scrollY - c[i]) / orbitSpan);
    const parkOut = from.parkFracOut ?? PARK_FRAC;
    const parkIn = to.parkFracIn ?? PARK_FRAC;
    if (rawT <= parkOut) return parkedRectTransform(from, ctx);
    if (rawT >= 1 - parkIn) return parkedRectTransform(to, ctx);
    const tt = (rawT - parkOut) / (1 - parkOut - parkIn);
    return transitTransform(from, to, ctx, tt);
  }

  // All other legs use the unified per-leg travel window. The window
  // resolver returns either a section-locked unlock range (sigil →
  // miss) or the centre-to-centre default (miss → substrate, etc.),
  // along with the parkFrac carving used to split the window into
  // parked-at-from / transit / parked-at-to phases.
  const leg = resolveLegTravelWindow(from, to, ctx, c, i);
  const span = Math.max(1, leg.endY - leg.startY);
  const rawT = (scrollY - leg.startY) / span;
  if (rawT <= leg.parkOut) return parkedRectTransform(from, ctx);
  if (rawT >= 1 - leg.parkIn) return parkedRectTransform(to, ctx);
  const tt = (rawT - leg.parkOut) / (1 - leg.parkOut - leg.parkIn);
  return transitTransform(from, to, ctx, tt);
}
