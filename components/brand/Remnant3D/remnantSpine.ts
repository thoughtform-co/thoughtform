/**
 * remnantSpine — the coiled ribbon's centreline, solved from the plate.
 *
 * The Gateway key visual's "remnant structure" is ONE ribbon of laminated sheet
 * swept along an inward spiral. It is not a torus and not a comet. The curve is
 * two pieces joined at the coil shoulder:
 *
 *   - COIL (theta >= 0): a logarithmic spiral, ~1.4 tight turns.
 *   - SPAR (theta < 0):  leaves the shoulder along the tangent with a residual
 *                        bend and a rise OUT of the coil plane.
 *
 * Every constant is solved against measurements taken off
 * `public/gateway-motion/gateway-v1b/mask-artifact.webp`, not eyeballed:
 *
 *   - cavity inscribed radius 104px vs coil outer radius 334px -> ratio 0.311
 *     (distance transform, ray-enclosure 1.00)
 *   - bright band ~130px across a 668px coil diameter -> half-width 0.242 R
 *   - view tilt: Euler grid search + best-fit 2D similarity against four mask
 *     landmarks, rms 0.038 in units of bbox width
 *   - spar length/bend/rise: fitted against three spar band centroids with the
 *     similarity locked by the coil landmarks first, rms 0.065
 *
 * The spar does NOT lie in the coil's plane: no in-plane spar can be shallow
 * enough to hit the measured centroids while the coil keeps its own fit, and
 * `depth-8.webp` independently shows the spar receding. Hence SPAR_RISE.
 *
 * KNOWN LIMIT: SPAR_CURVATURE sits at its search boundary, so this
 * parameterisation is imperfect near the shoulder. If more fidelity is wanted,
 * extract the medial axis from the mask and lift it with the depth map — that
 * gives a measured spine instead of a fitted formula.
 *
 * Units are normalized: coil outer diameter = 1.0.
 */

import * as THREE from "three";

// --- coil -------------------------------------------------------------------
export const TURNS = 1.4;
export const THETA_SPAN = TURNS * 2 * Math.PI; // 8.796 rad
export const R_OUTER = 0.5; // centreline radius at the coil shoulder
export const R_INNER = 0.3141; // centreline radius at the inner terminus
export const HALF_WIDTH = 0.1208; // across the band
export const HALF_THICKNESS = 0.03; // through the ply stack
const B = Math.log(R_INNER / R_OUTER) / THETA_SPAN;

// --- spar -------------------------------------------------------------------
// The landmark fit put these at (1.80, -1.60, 2.50), but all three sat ON their
// search boundaries, which means the fit was absorbing error rather than
// converging — a boundary-pinned optimum is not an optimum. Those values also
// make the spar dominate the frame, whereas the plate's coil is the dominant
// mass (measured spar-length : coil-diameter = 1.32).
//
// These are the values picked by sweeping the lab against a difference-blend
// overlay of the plate. Honest provenance: measured ratio first, then eye.
export const SPAR_LEN = 1.18;
export const SPAR_CURVATURE = -0.55;
export const SPAR_RISE = 0.9;

// --- view -------------------------------------------------------------------
export const PHASE = 0;
export const TILT_X = THREE.MathUtils.degToRad(-10);
export const TILT_Y = THREE.MathUtils.degToRad(-36);
export const TILT_Z = THREE.MathUtils.degToRad(-131);

export interface SpineParams {
  sparLen: number;
  sparCurvature: number;
  sparRise: number;
  phase: number;
  turns: number;
}

export const DEFAULT_SPINE_PARAMS: SpineParams = {
  sparLen: SPAR_LEN,
  sparCurvature: SPAR_CURVATURE,
  sparRise: SPAR_RISE,
  phase: PHASE,
  turns: TURNS,
};

function coilPoint(theta: number, phase: number): THREE.Vector3 {
  const a = theta + phase;
  const r = R_OUTER * Math.exp(B * theta);
  return new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 0);
}

/** Unit tangent of the coil spiral, in the coil plane. */
function coilTangent(theta: number, phase: number): THREE.Vector2 {
  const a = theta + phase;
  const r = R_OUTER * Math.exp(B * theta);
  return new THREE.Vector2(
    r * (B * Math.cos(a) - Math.sin(a)),
    r * (B * Math.sin(a) + Math.cos(a))
  ).normalize();
}

/**
 * The view tilt, as a rotation to apply to the WHOLE object.
 *
 * Curves below are returned UNTILTED, in the coil's own frame where the coil axis
 * is +Z. That matters: the ribbon builder derives the band's width direction from
 * the coil axis, and if the spine arrives pre-tilted then world +Z is no longer
 * that axis — the band ends up lying in the coil plane instead of standing along
 * it, i.e. a coiled clock spring instead of a roll of tape.
 */
export const TILT_EULER = new THREE.Euler(TILT_X, TILT_Y, TILT_Z, "XYZ");

/** Coil centreline, shoulder -> inner terminus. Untilted. */
export function coilSpine(segments = 96, params = DEFAULT_SPINE_PARAMS): THREE.Vector3[] {
  const span = params.turns * 2 * Math.PI;
  return Array.from({ length: segments + 1 }, (_, i) =>
    coilPoint((span * i) / segments, params.phase)
  );
}

/** Spar centreline, TIP first, running back to the coil shoulder. Untilted. */
export function sparSpine(segments = 40, params = DEFAULT_SPINE_PARAMS): THREE.Vector3[] {
  const p0 = coilPoint(0, params.phase);
  const t = coilTangent(0, params.phase);
  const n = new THREE.Vector2(-t.y, t.x); // in-plane normal, bends the spar
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const f = i / segments; // 0 at shoulder -> 1 at tip
    const s = f * params.sparLen;
    const bend = params.sparCurvature * f * f;
    const rise = params.sparRise * Math.pow(f, 1.35);
    pts.push(new THREE.Vector3(p0.x - t.x * s + n.x * bend, p0.y - t.y * s + n.y * bend, rise));
  }
  return pts.reverse();
}

/** Spar tip through to the inner terminus, as one polyline. */
export function fullSpine(params = DEFAULT_SPINE_PARAMS): THREE.Vector3[] {
  return [...sparSpine(40, params), ...coilSpine(96, params).slice(1)];
}

/**
 * Half-width of the band at a point along the sweep.
 *
 * `t` runs 0 at the spar tip to 1 at the inner terminus. The band tapers to a
 * sliver at the tip and holds full width once inside the coil — this taper is
 * why a single constant-section ExtrudeGeometry cannot represent the object.
 */
export function halfWidthAt(t: number, sparFraction: number): number {
  if (t >= sparFraction) return HALF_WIDTH;
  const f = t / sparFraction; // 0 at tip -> 1 at shoulder
  return HALF_WIDTH * Math.max(0.06, Math.pow(f, 0.65));
}
