// Pure geometry for the Arc Cases node-stream latch (ADR-035 Update 1).
//
// While the terminal is armed, each source stream folds from its pip and
// terminates EXACTLY on the panel's LEFT border and each surface stream
// on the RIGHT border — the screen reads as mounted on the node lines.
// The pips stay in their fan positions (they are the anchors); only the
// wrap-tail end of each stream travels to a border attach point.
//
// This module owns the reusable, three-free, unit-testable pieces:
//   - the per-row attach fraction (top-to-bottom, no crossings),
//   - the eased fold envelope (monotonic in the arm level),
//   - the cubic-bézier docked-path builder (endpoints exact, sample-count
//     parity with whatever the caller passes).
// The caller (ShellStack) owns the viewport-px → NDC → world → local
// unprojection and the per-frame rest↔docked lerp; those need the live
// camera + three, so they stay in the R3F component.

/** Minimal 3-vector shape — `THREE.Vector3` satisfies it, so the hot
 *  path can hand scratch vectors straight in with no adaptation. */
export interface Vec3Like {
  x: number;
  y: number;
  z: number;
}

/**
 * Screen-space vertical fraction (0 = panel top edge, 1 = bottom edge)
 * at which stack row `rowIdx` attaches to its border.
 *
 * The stack rows are laid out with world-Y ASCENDING in index (row 0 is
 * the bottom of the fan, row `rowCount - 1` the top). Screen Y grows
 * downward, so the fraction must DESCEND with the index: the topmost row
 * (highest index) latches nearest the top of the panel. This ordering is
 * what keeps the folded lines from crossing each other.
 *
 * Uses the cell-centre convention `(i + 0.5) / n` so the attach points
 * are evenly inset from the corners rather than sitting on them.
 */
export function attachFractionForRow(rowIdx: number, rowCount: number): number {
  if (rowCount <= 0) return 0.5;
  return 1 - (rowIdx + 0.5) / rowCount;
}

/**
 * Eased fold envelope from the damped arm level (0 = rest pose, 1 =
 * fully latched). Smootherstep (Perlin's 6t⁵−15t⁴+10t³) so the fold
 * eases in AND out with the arm/disarm ramp — zero velocity at both
 * ends, no snap when the level reverses on close or on scroll-away.
 * Monotonic non-decreasing in `level`, clamped to [0, 1].
 */
export function arcLatchEnvelope(level: number): number {
  const t = level < 0 ? 0 : level > 1 ? 1 : level;
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Cubic-bézier sample into `out` (no allocation). `s` in [0, 1]. */
export function cubicBezierPoint(
  p0: Vec3Like,
  p1: Vec3Like,
  p2: Vec3Like,
  p3: Vec3Like,
  s: number,
  out: Vec3Like
): void {
  const u = 1 - s;
  const a = u * u * u;
  const b = 3 * u * u * s;
  const c = 3 * u * s * s;
  const d = s * s * s;
  out.x = a * p0.x + b * p1.x + c * p2.x + d * p3.x;
  out.y = a * p0.y + b * p1.y + c * p2.y + d * p3.y;
  out.z = a * p0.z + b * p1.z + c * p2.z + d * p3.z;
}

/** Control-arm length as a fraction of the pip→attach distance. Picked
 *  so the fold reads as a deliberate bend rather than a straight tie-off
 *  (a longer arm bows out too much and clips the panel face). Floored so
 *  a degenerate near-zero span still yields finite control points. */
export const LATCH_CONTROL_ARM_FRAC = 0.42;

/**
 * Write the two interior cubic-bézier control points for the docked path
 * into `outP1` / `outP2` (no allocation). The line LEAVES the pip along
 * `pipTangent` (the rest stream's initial direction, so the fold grows
 * out of the existing swoop) and ARRIVES at `attach` along `arrivalDir`
 * (perpendicular to the panel edge, so it latches square onto the
 * border). Both direction vectors are expected pre-normalised.
 */
export function latchControlPoints(
  pip: Vec3Like,
  pipTangent: Vec3Like,
  attach: Vec3Like,
  arrivalDir: Vec3Like,
  outP1: Vec3Like,
  outP2: Vec3Like,
  armFrac: number = LATCH_CONTROL_ARM_FRAC
): void {
  const dist = Math.hypot(attach.x - pip.x, attach.y - pip.y, attach.z - pip.z);
  const arm = Math.max(dist * armFrac, 1e-4);
  outP1.x = pip.x + pipTangent.x * arm;
  outP1.y = pip.y + pipTangent.y * arm;
  outP1.z = pip.z + pipTangent.z * arm;
  outP2.x = attach.x - arrivalDir.x * arm;
  outP2.y = attach.y - arrivalDir.y * arm;
  outP2.z = attach.z - arrivalDir.z * arm;
}

/**
 * Build the docked polyline (pip → panel border) into `out`, a
 * pre-allocated array of length `sampleCount`. `out[0]` is the pip
 * EXACTLY and `out[sampleCount - 1]` the attach point EXACTLY (endpoints
 * are snapped after sampling so float drift never unwelds the pip or
 * lifts the terminus off the border). Pass `rest.length` as
 * `sampleCount` for byte-for-byte sample-count parity with the rest
 * stream so the caller can lerp index-by-index.
 *
 * Allocation-free apart from two scratch control-point objects — the
 * per-frame hot path in ShellStack calls `latchControlPoints` +
 * `cubicBezierPoint` directly against its own scratch; this convenience
 * form is for tests and one-shot builds.
 */
export function buildDockedPath(
  pip: Vec3Like,
  pipTangent: Vec3Like,
  attach: Vec3Like,
  arrivalDir: Vec3Like,
  sampleCount: number,
  out: Vec3Like[],
  armFrac: number = LATCH_CONTROL_ARM_FRAC
): void {
  const last = sampleCount - 1;
  if (last <= 0) {
    if (out[0]) {
      out[0].x = pip.x;
      out[0].y = pip.y;
      out[0].z = pip.z;
    }
    return;
  }
  const p1: Vec3Like = { x: 0, y: 0, z: 0 };
  const p2: Vec3Like = { x: 0, y: 0, z: 0 };
  latchControlPoints(pip, pipTangent, attach, arrivalDir, p1, p2, armFrac);
  for (let k = 0; k <= last; k++) {
    cubicBezierPoint(pip, p1, p2, attach, k / last, out[k]);
  }
  out[0].x = pip.x;
  out[0].y = pip.y;
  out[0].z = pip.z;
  out[last].x = attach.x;
  out[last].y = attach.y;
  out[last].z = attach.z;
}
