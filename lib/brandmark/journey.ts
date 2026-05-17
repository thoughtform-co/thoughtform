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

import { splitRotation } from "@/components/landing/v7/intelligence-layer/intelligenceLayerGeom";
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

/** Atmosphere density at the substrate hold beat. Low enough that
 *  the cloud reads as ambient dust around the vector mark and the
 *  orbital triad; high enough that the substrate window still has
 *  a luminous "field" quality vs the bare vector states elsewhere. */
const SUBSTRATE_ATMOSPHERE_DENSITY = 0.15;

/** Atmosphere dispersion at the substrate hold beat. Slight scatter
 *  so the dust drifts in/around the orbital triad rather than
 *  snapping to the brandmark's outline. */
const SUBSTRATE_ATMOSPHERE_DISPERSION = 0.35;

/** Default easing (power3.inOut). */
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
  visible: false,
  parkedAt: null,
};

/** Fraction of the substrate scroll window devoted to the brandmark
 *  shape blend on each side (engage + exit). With `0.18` each side,
 *  the morph completes within the first 18% of the parked window,
 *  holds through the read beat, and retracts in the last 18% — so
 *  side orbits and labels have time to settle around the ring before
 *  the cloud begins to un-morph back to its full mark for departure. */
const SHAPE_BLEND_FRAC = 0.18;
const SIGIL_MISS_TRANSIT_VIEWPORT_GATE = 0.82;

// ────────────────────────────────────────────────────────────────────
// Math helpers
// ────────────────────────────────────────────────────────────────────

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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
 *  `transitIn.dispersionBump` overrides per arrival:
 *
 *    - `miss`: default bump (sigil→miss is same-size; atmosphere
 *      bump reads as the brandmark passing through diagnostic
 *      atoms). The visual story here IS the dispersion.
 *    - `substrate`, `rail`, `orbit`: explicit `null`. These arrivals
 *      involve significant rect-size change (miss ~144px →
 *      substrate ~280px+; substrate → rail ~56px; rail → orbit
 *      small). Adding a bump on top of the scale change makes the
 *      cloud read as "exploding outward" rather than "settling into
 *      the next dock". Tier 1 Change 1 is subsumed here.
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
      parked: { density: 0, dispersion: 0 },
    },
    {
      id: "miss",
      resolveRect: () => queryMissBrand()?.getBoundingClientRect() ?? null,
      parked: { density: 0, dispersion: 0 },
      // sigil → miss: same-size journey; the default bump (0.45 peak)
      // gives a denser exhaust because the vector barely moves and
      // the atmosphere IS the visual story of the journey here.
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
        // miss → substrate: vector lerps from ~144px to ~280px+;
        // exhaust bump trails the growth so the substrate emerge
        // reads as a "gathering" rather than a silent re-park.
        dispersionBump: EXHAUST_DISPERSION_BUMP,
      },
    },
    {
      id: "rail",
      resolveRect: () => queryRail()?.getBoundingClientRect() ?? null,
      parked: { density: 0, dispersion: 0 },
      transitIn: {
        // substrate → rail: vector shrinks from ~280px to ~56px;
        // exhaust bump trails the shrink so the cloud reads as
        // "concentrating" toward the rail station.
        dispersionBump: EXHAUST_DISPERSION_BUMP,
      },
    },
    {
      id: "orbit",
      resolveRect: () => queryOrbit()?.getBoundingClientRect() ?? null,
      parked: { density: 0, dispersion: 0 },
      transitIn: {
        // rail → orbit: small lateral move under the sticky-practice
        // special case. Subtle exhaust bump keeps the motion alive
        // without overwhelming the small rect.
        dispersionBump: (t) => Math.sin(Math.PI * t) * 0.2,
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
 *  layout — defensive). */
export function computeSubstrateRange(
  keyframes: readonly BrandmarkKeyframe[],
  centres: readonly number[]
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
  const exitY = subC + parkOut * (nextC - subC);
  return { engageY, exitY };
}

// ────────────────────────────────────────────────────────────────────
// Centre resolver
// ────────────────────────────────────────────────────────────────────

/** scrollY at which a keyframe's anchor centre sits at viewport
 *  centre. Stable for non-sticky anchors; for the sticky orbit, the
 *  return advances with scrollY during sticky engagement — the
 *  rail → orbit transit branch handles that by using practice.top
 *  as a non-sticky reference. */
function keyframeCentreY(kf: BrandmarkKeyframe, ctx: JourneyContext): number | null {
  const rect = kf.resolveRect(ctx);
  if (!rect || rect.width <= 0 || rect.height <= 0) return null;
  return window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2;
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
  const subRange = computeSubstrateRange(keyframes, c);
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
  //     shape blend when parked at substrate. The base transform
  //     already has the substrate rect (we resolved it as parked-at-
  //     substrate); we just add the rotation arc, ring progress, and
  //     the shape-morph ramp on top.
  if (inSubWindow) {
    base = {
      ...base,
      rotationY: splitRotation(substrateLocalProgress),
      ringsActive: true,
      ringProgress: substrateLocalProgress,
      shapeBlend: substrateShapeBlend(substrateLocalProgress),
    };
  }

  return base;
}

/** Trapezoid envelope for the brandmark shape blend within the
 *  substrate window. Ramps full → ring over `[0, SHAPE_BLEND_FRAC]`,
 *  holds at ring through the read beat, and ramps ring → full over
 *  `[1 - SHAPE_BLEND_FRAC, 1]` so the cloud departs the section in
 *  its canonical mark form (ADR-014). */
export function substrateShapeBlend(progress: number): number {
  if (progress <= 0) return 0;
  if (progress >= 1) return 0;
  const blendIn = progress < SHAPE_BLEND_FRAC ? clamp01(progress / SHAPE_BLEND_FRAC) : 1;
  const blendOut = progress > 1 - SHAPE_BLEND_FRAC ? clamp01((1 - progress) / SHAPE_BLEND_FRAC) : 1;
  return blendIn * blendOut;
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
  const toRect = to.resolveRect(ctx);

  // Keep section-02 reading locked: sigil -> miss transit should not
  // arm while the missing-layer dock is still well below the viewport.
  // Without this gate, the centre-based segment math can enter transit
  // early (rawT > parkOut) even though the visitor is still scrolling
  // inside section 02, which reads as in-section jiggle. The gate is
  // geometric and reversible: once miss approaches the viewport, transit
  // can proceed in both directions naturally.
  if (
    from.id === "sigil" &&
    to.id === "miss" &&
    toRect &&
    toRect.top > window.innerHeight * SIGIL_MISS_TRANSIT_VIEWPORT_GATE
  ) {
    return parkedRectTransform(from, ctx);
  }

  // Special case: rail → orbit. Orbit anchor (`.approach__orbit__mark`)
  // is sticky inside `.approach__stage`; its
  // `getBoundingClientRect().top` clamps during sticky engagement,
  // making `c[orbit]` advance with scrollY and `rawT` only
  // approach 1 asymptotically. Re-base the transit on practice.top —
  // a non-sticky reference — so park-at-orbit fires at section entry.
  let rawT: number;
  if (to.id === "orbit" && ctx.practiceEl) {
    const practiceTop = ctx.practiceEl.getBoundingClientRect().top;
    if (practiceTop <= 0) {
      return parkedRectTransform(to, ctx);
    }
    const transitEndY = scrollY + practiceTop;
    const orbitSpan = Math.max(1, transitEndY - c[i]);
    rawT = clamp01((scrollY - c[i]) / orbitSpan);
  } else {
    const span = Math.max(1, c[i + 1] - c[i]);
    rawT = (scrollY - c[i]) / span;
  }

  // Per-end park-frac (default 0.32 each side).
  const parkOut = from.parkFracOut ?? PARK_FRAC;
  const parkIn = to.parkFracIn ?? PARK_FRAC;

  if (rawT <= parkOut) return parkedRectTransform(from, ctx);
  if (rawT >= 1 - parkIn) return parkedRectTransform(to, ctx);

  // Remap inner [parkOut, 1 - parkIn] to [0, 1] for the easing.
  const tt = (rawT - parkOut) / (1 - parkOut - parkIn);
  return transitTransform(from, to, ctx, tt);
}
