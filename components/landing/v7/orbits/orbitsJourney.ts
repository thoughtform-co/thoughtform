/**
 * orbitsJourney — pure math for the traveling-orbits painter (ADR-017).
 *
 * The four sigil rings (concentric circles in `#definition`) and the
 * four miss orbits (eccentric tilted ellipses in `#missing-layer`)
 * are no longer two separate SVG trees that fade in/out across the
 * sigil → miss leg. Instead, ONE painter renders a single set of
 * four rings at a fixed-overlay position, and each scroll frame
 * lerps:
 *
 *   - The painter centre between the sigil anchor's screen centre
 *     (when parked at sigil / before the leg starts) and the miss
 *     anchor's screen centre (clamped so the rings stay docked at
 *     the miss section as the user scrolls past).
 *   - Each ring's per-axis scale + rotation between identity (a
 *     concentric circle of `ringRadius`) and the corresponding
 *     `MISS_ORBITS` ellipse (via `SIGIL_RING_MORPHS`).
 *
 * Because the centre is recomputed every frame from
 * `getBoundingClientRect()`, the rings naturally scroll with the
 * miss section once parked there — no opacity fade is needed for the
 * exit. The only opacity ramp is the hero entrance bookend (mirrors
 * the brandmark's own entrance), so the rings match the brandmark
 * fade-in 0 → 1.
 *
 * Canonical geometry pairing comes from `lib/celestial/orbits.ts` —
 * this module only re-exports + composes; it never duplicates the
 * orbit numbers.
 */

import { SIGIL_RING_MORPHS, type OrbitId } from "@/lib/celestial/orbits";

/** A ring in the traveling-orbits painter. The starting state is a
 *  concentric circle of radius `radius` centred at the painter origin;
 *  the target state is a tilted ellipse with the given scaleX, scaleY,
 *  rotation. The painter lerps between the two via a single `morph`
 *  factor in `[0, 1]`. */
export interface OrbitRingDef {
  id: OrbitId;
  /** Sigil-side radius (matches the original `<circle r="…">`). */
  radius: number;
  /** Target scaleX at `morph = 1`. */
  targetSx: number;
  /** Target scaleY at `morph = 1`. */
  targetSy: number;
  /** Target rotation in degrees at `morph = 1`. */
  targetRotateDeg: number;
}

/** Canonical four-ring table for the traveling-orbits painter. The
 *  `radius`, `targetSx`, `targetSy`, `targetRotateDeg` fields come
 *  from `SIGIL_RING_MORPHS` directly so the painter never drifts
 *  from the canonical orbit family. */
export const ORBIT_RINGS: readonly OrbitRingDef[] = SIGIL_RING_MORPHS.map((m) => ({
  id: m.id,
  radius: m.ringRadius,
  targetSx: m.targetSx,
  targetSy: m.targetSy,
  targetRotateDeg: m.targetRotateDeg,
}));

export interface OrbitsTransform {
  /** Painter centre in viewport (client) pixel coords. */
  cx: number;
  cy: number;
  /** Geometric morph scalar `[0, 1]`. `0` = concentric circles at sigil
   *  centre; `1` = `MISS_ORBITS` ellipses at miss centre. Continuous
   *  across the leg. Mirrors the `--orbit-morph` CSS scalar already
   *  written by `useBrandmarkJourney`. */
  morph: number;
  /** Stroke-style morph scalar `[0, 1]`. `0` = sigil-side stroke
   *  identity; `1` = miss-side identity. Eased to lag the geometry
   *  morph slightly so the rings reshape first and then settle into
   *  the diagnostic dash identity. Mirrors `--orbit-style-morph`. */
  styleMorph: number;
  /** Painter visible at this scroll position. `false` during the
   *  pre-sigil hero hold and after the brandmark has docked at rail
   *  / orbit (post-substrate). The painter sets `display: none` /
   *  visibility cut when this is false — no opacity fade. */
  visible: boolean;
  /** Opacity multiplier in `[0, 1]`. Used ONLY for the hero entrance
   *  bookend (mirrors brandmark fade-in) and the post-orbit fade-out
   *  bookend. `1` everywhere mid-journey (Principle 2). */
  opacity: number;
}

const HIDDEN_TRANSFORM: OrbitsTransform = {
  cx: 0,
  cy: 0,
  morph: 0,
  styleMorph: 0,
  visible: false,
  opacity: 0,
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (t: number, start: number, end: number): number => {
  if (end <= start) return t >= end ? 1 : 0;
  if (t <= start) return 0;
  if (t >= end) return 1;
  const u = (t - start) / (end - start);
  return u * u * (3 - 2 * u);
};

const easeOrbitStyleMorph = (geometry: number): number => smoothstep(geometry, 0.15, 0.95);

/** Smoothstep S-curve — matches `TRAVEL_EASE` in the brandmark
 *  journey so orbit position lerps share the brandmark's velocity
 *  profile across the sigil → miss leg. */
const TRAVEL_EASE = (t: number): number => t * t * (3 - 2 * t);

/** Section-reading-zone fraction used by the brandmark journey to
 *  decide when the brandmark unlocks from the sigil dock and begins
 *  travelling toward miss. The orbits painter mirrors this exactly
 *  so the leg start lines up with the brandmark's. */
const SECTION_READING_ZONE_FRAC = 0.35;

/** Fraction of the leg reserved as a parked tail at the miss end —
 *  matches `SIGIL_TO_MISS_PARK_TAIL` in the brandmark journey. The
 *  brandmark snaps to the miss anchor for the last 15% of the leg;
 *  orbits do the same so they re-centre on the brandmark before
 *  the diagnostic constellation reveals. */
const SIGIL_TO_MISS_PARK_TAIL = 0.15;

/** Orbit / brandmark position relationship across the sigil → miss
 *  leg. Set to `0` so the orbits lerp in EXACT lockstep with the
 *  brandmark vector glyph — the rings and the mark land at the
 *  diagnostic dock on the same scroll frame. Earlier versions used
 *  `0.08` to read as a comet tail, but the resulting late-arrival
 *  beat read as the orbits landing "after" the brandmark rather
 *  than alongside it. With `0` and the shared `TRAVEL_EASE` curve
 *  the two layers move as one. */
const ORBIT_TRAIL_LAG = 0;

export interface OrbitsJourneyInput {
  /** Sigil anchor element (`.sigil__mark`). */
  sigilEl: HTMLElement | null;
  /** Miss anchor element (`#missing-layer .miss__brand-slot`). */
  missEl: HTMLElement | null;
  /** Definition section element (`#definition`). The brandmark
   *  journey unlocks from sigil only after this section's reading
   *  zone has cleared (`SECTION_READING_ZONE_FRAC`); the orbits use
   *  the same anchor so they don't start moving before the
   *  brandmark does. */
  definitionEl: HTMLElement | null;
  /** Brandmark journey opacity (drives the hero / post-orbit
   *  bookends). Painter follows this so its fade-ins and fade-outs
   *  are perfectly in sync with the brandmark. */
  brandmarkOpacity: number;
  /** Brandmark journey `parkedAt` keyframe id. The painter hides
   *  itself once parked at `rail` / `orbit` (well past miss), and
   *  during all states where the rings should be off the page. */
  parkedAt: "sigil" | "miss" | "substrate" | "rail" | "orbit" | null;
  /** Optional viewport-fraction parking factor for the miss anchor.
   *  Default 0.5. */
  missParkViewportFrac?: number;
}

/**
 * Compute the live orbits transform from the current scroll +
 * brandmark journey state.
 *
 * Returns `null` only when the underlying anchors are not yet
 * measurable (first paint race). Callers should retain the previous
 * transform and try again next frame.
 */
export function computeOrbitsTransform(input: OrbitsJourneyInput): OrbitsTransform | null {
  const { sigilEl, missEl, definitionEl, brandmarkOpacity, parkedAt } = input;
  if (typeof window === "undefined") return null;
  if (!sigilEl || !missEl || !definitionEl) return null;

  const sigilRect = sigilEl.getBoundingClientRect();
  const missRect = missEl.getBoundingClientRect();
  const definitionRect = definitionEl.getBoundingClientRect();
  if (sigilRect.width <= 0 || missRect.width <= 0 || definitionRect.height <= 0) return null;

  // Painter is hidden far past miss — by then the orbits have
  // long-since scrolled off-screen with the miss section, so this
  // hard cut keeps the SVG from being painted needlessly.
  if (parkedAt === "rail" || parkedAt === "orbit") return HIDDEN_TRANSFORM;

  // Brandmark opacity owns the hero entrance + post-orbit fade
  // bookends. Outside those bookends the brandmark is at full
  // opacity, so the orbits sit at full opacity too.
  if (brandmarkOpacity <= 0) return HIDDEN_TRANSFORM;

  const missFrac = input.missParkViewportFrac ?? 0.5;
  const vh = window.innerHeight;
  const scrollY = window.scrollY;

  // Anchor centres in screen-space. The brandmark journey reads
  // these via getBoundingClientRect each frame; the orbits follow.
  const sigilCenterX = sigilRect.left + sigilRect.width / 2;
  const sigilCenterY = sigilRect.top + sigilRect.height / 2;
  const missCenterX = missRect.left + missRect.width / 2;
  const missCenterY = missRect.top + missRect.height / 2;

  // ─── Section-locked leg window ────────────────────────────────
  // Mirrors `resolveLegTravelWindow` in `lib/brandmark/journey.ts`
  // for the sigil → miss leg. The brandmark stays parked at sigil
  // until the visitor scrolls past `#definition`'s reading zone
  // (bottom edge above 35% of viewport). Before this gate, the
  // brandmark hasn't started moving — and neither should the orbits.
  // Without this gate the orbits used `sigilCenterY` as the leg
  // start, which is upstream of the brandmark's actual unlock
  // point, so they began travelling before the brandmark did.
  const startY = scrollY + definitionRect.bottom - vh * SECTION_READING_ZONE_FRAC;
  const endY = scrollY + missCenterY - vh * missFrac;
  const span = Math.max(1, endY - startY);
  const rawT = clamp01((scrollY - startY) / span);

  // Carve out the parked tail at miss — last 15% of the leg the
  // brandmark is fully docked; the orbits should be too. Without
  // this the orbits would still be "moving" in the final 15% of
  // scroll while the brandmark is already pinned.
  const segmentT =
    rawT >= 1 - SIGIL_TO_MISS_PARK_TAIL ? 1 : rawT / Math.max(0.0001, 1 - SIGIL_TO_MISS_PARK_TAIL);

  // ─── Trail lag ────────────────────────────────────────────────
  // Orbits begin moving `ORBIT_TRAIL_LAG` of the segment LATER than
  // the brandmark, then catch up by the end. Combined with the same
  // smoothstep velocity profile (`TRAVEL_EASE`) the brandmark uses,
  // this puts the orbit cluster a fraction behind the brandmark
  // throughout the leg — the comet-tail read the user asked for.
  const lagged = clamp01((segmentT - ORBIT_TRAIL_LAG) / (1 - ORBIT_TRAIL_LAG));
  const t = TRAVEL_EASE(lagged);

  // Painter centre lerps with the eased + lagged factor — the rings
  // read as travelling alongside the brandmark, not as faded from
  // one location to another. Stays at sigilCenter when t = 0,
  // missCenter when t = 1.
  const cx = lerp(sigilCenterX, missCenterX, t);
  const cy = lerp(sigilCenterY, missCenterY, t);

  return {
    cx,
    cy,
    morph: t,
    styleMorph: easeOrbitStyleMorph(t),
    visible: true,
    opacity: brandmarkOpacity,
  };
}
