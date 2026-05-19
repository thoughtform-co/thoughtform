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

export interface OrbitsJourneyInput {
  /** Sigil anchor element (`.sigil__mark`). */
  sigilEl: HTMLElement | null;
  /** Miss anchor element (`#missing-layer .miss__brand-slot`). */
  missEl: HTMLElement | null;
  /** Brandmark journey opacity (drives the hero / post-orbit
   *  bookends). Painter follows this so its fade-ins and fade-outs
   *  are perfectly in sync with the brandmark. */
  brandmarkOpacity: number;
  /** Brandmark journey `parkedAt` keyframe id. The painter hides
   *  itself once parked at `rail` / `orbit` (well past miss), and
   *  during all states where the rings should be off the page. */
  parkedAt: "sigil" | "miss" | "substrate" | "rail" | "orbit" | null;
  /** Optional viewport-fraction parking factor for the sigil anchor
   *  (matches `BrandmarkKeyframe.parkViewportFrac`). Default 0.55. */
  sigilParkViewportFrac?: number;
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
  const { sigilEl, missEl, brandmarkOpacity, parkedAt } = input;
  if (typeof window === "undefined") return null;
  if (!sigilEl || !missEl) return null;

  const sigilRect = sigilEl.getBoundingClientRect();
  const missRect = missEl.getBoundingClientRect();
  if (sigilRect.width <= 0 || missRect.width <= 0) return null;

  // Painter is hidden far past miss — by then the orbits have
  // long-since scrolled off-screen with the miss section, so this
  // hard cut keeps the SVG from being painted needlessly.
  if (parkedAt === "rail" || parkedAt === "orbit") return HIDDEN_TRANSFORM;

  // Brandmark opacity owns the hero entrance + post-orbit fade
  // bookends. Outside those bookends the brandmark is at full
  // opacity, so the orbits sit at full opacity too.
  if (brandmarkOpacity <= 0) return HIDDEN_TRANSFORM;

  const sigilFrac = input.sigilParkViewportFrac ?? 0.55;
  const missFrac = input.missParkViewportFrac ?? 0.5;
  const vh = window.innerHeight;
  const scrollY = window.scrollY;

  // Anchor centres in screen-space. We use the SAME
  // parkViewportFrac convention as the brandmark journey so the
  // orbits travel along the exact same scrollY → screen-position
  // function as the brandmark (no drift).
  const sigilCenterX = sigilRect.left + sigilRect.width / 2;
  const sigilCenterY = sigilRect.top + sigilRect.height / 2;
  const missCenterX = missRect.left + missRect.width / 2;
  const missCenterY = missRect.top + missRect.height / 2;

  // The leg's progress factor mirrors the brandmark journey's
  // `c[sigil] → c[miss]` window with a `parkViewportFrac` adjustment
  // (the brandmark's centre-Y resolver subtracts `vh * frac`).
  const sigilCY = scrollY + sigilCenterY - vh * sigilFrac;
  const missCY = scrollY + missCenterY - vh * missFrac;
  const span = Math.max(1, missCY - sigilCY);
  const tRaw = (scrollY - sigilCY) / span;
  const t = clamp01(tRaw);

  // Painter centre lerps with the same factor as the geometry morph
  // — this is what makes the rings READ as travelling alongside the
  // brandmark instead of fading from one location to another.
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
