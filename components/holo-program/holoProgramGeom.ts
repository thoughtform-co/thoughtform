/**
 * holoProgramGeom — the trajectory instrument's arithmetic, with no three.
 *
 * ⚠ THREE-FREE ON PURPOSE. `components/arcs` may import this file (the
 * `journeyScalars` / `ringMath` transport pattern); a `three` import here
 * would drag the WebGL stack into the arc route's First Load JS, which is
 * the one thing `.claude/rules/arcs.md` bans outright.
 *
 * ⚠ IT PLOTS A RECORD, NOT A METAPHOR (ADR-078 U1). Every number below is
 * read off something that happened: the waypoints' own `at` (authored from
 * real dates, registry-pinned sorted and unequal) and the board's adoption
 * step ladder. Nothing here invents a quantity — a ring's radius is the
 * adoption reach the flat board already drew as a tread, and a ring's
 * position is the date the flat board already placed at `left: var(--at)`.
 */

/** The waypoint shape the scene needs — structurally the arc's own
 *  `ArcProgramWaypoint`, re-declared so this module imports no `lib/arcs`
 *  (the seam runs one way: the arc feeds the scene, never the reverse). */
export interface HoloWaypoint {
  id: string;
  label: string;
  sub?: string;
  /** The sentence on what the move WAS. ⚠ THE DRAWING LETTERS NONE OF THIS —
   *  no glyph in the scene carries a string, and the DOM stations own every
   *  word on this beat. It is declared so a harness can render production's
   *  real three-line station block; a lab whose chrome is simpler than the
   *  page's is measuring a different composition, which is exactly how the
   *  first cut reported clearance the page did not have. */
  note?: string;
  at: number;
  seat?: true;
}

/* ── The adoption ladder ─────────────────────────────────────────────── */

/**
 * The adoption curve's treads, lifted from the flat board's own path.
 *
 * `ArcProgramBoard.CURVE` is
 * `M30 54H150V48H270V42H390V35H510V28H630V21H750V13H870V6H975` in a 1000×60
 * box — eight runs, rising, never interpolated. Here each run is
 * `[atStart, level]` with `at = (x − 30) / 945` and `level = (54 − y) / 48`,
 * so the two drawings encode ONE curve. A reader who measures the ring
 * radii against the flat board's treads gets the same answer.
 *
 * ⚠ A STEP FUNCTION, NOT A RAMP. `levelAt` never interpolates between
 * treads: adoption arrived in steps and the record says so. Unit-pinned.
 */
export const ADOPTION_TREADS: readonly (readonly [atStart: number, level: number])[] = [
  [0.0, 0.0],
  [0.127, 0.125],
  [0.254, 0.25],
  [0.381, 0.396],
  [0.508, 0.542],
  [0.635, 0.688],
  [0.762, 0.854],
  [0.889, 1.0],
];

/** The adoption level at a point on the time axis — the last tread reached. */
export function levelAt(at: number): number {
  let level = ADOPTION_TREADS[0][1];
  for (const [start, value] of ADOPTION_TREADS) {
    if (at + 1e-9 < start) break;
    level = value;
  }
  return level;
}

/* ── The instrument's world constants ────────────────────────────────── */

/** Ring radii in world units. The seat's ring is the widest because its
 *  adoption level is the highest — one encoding, read twice.
 *
 *  ⚠ The RATIO is the encoding and the absolute size is framing. Both were
 *  solved against the station lanes (see the pose block below), so moving
 *  one without re-running `holo-program-geom.test.ts` puts a rim back
 *  through a label. */
export const R_MIN = 0.421;
export const R_MAX = 0.715;

/** A waypoint's ring radius: the adoption reach at its date. */
export function ringRadius(at: number): number {
  return R_MIN + (R_MAX - R_MIN) * levelAt(at);
}

/** World Y of the time axis — solved with the radii so the ring stack sits
 *  centred in the band's clear middle. */
export const AXIS_Y = 0.065;

/** The platform rail's drop below the time axis.
 *
 *  ⚠ IT RUNS INSIDE THE RINGS, not under them. Below the stack there is no
 *  room — the largest ring's lower rim reaches 69 % of the band and the
 *  down-lane stations start at 70 % — so a rail beneath would be a rail
 *  through a label. Threaded through the rings it reads as what it is: a
 *  second track running parallel to the course, on the same wire. */
export const PARALLEL_DY = -0.25;

/** The ground plane the drop stems reach, and the graticule sits on. Just
 *  under the deepest rim, so the graticule reads as the surface the
 *  instrument stands on rather than as a floor in another room. */
export const GROUND_Y = -0.78;

/** One rim tick per this much circumference. A bigger ring carries more
 *  ticks BECAUSE IT IS BIGGER — declared chrome, never a second encoding.
 *  ⚠ Never map a tick count to a figure (47 Skills, 22 workshops); the
 *  registers letter those and a drawing that says it twice is this
 *  surface's said-twice defect. */
export const TICK_PITCH = 0.17;

/** Rim tick length, inward from the ring's rim. */
export const TICK_LEN = 0.082;

/** Tick count for a ring, floored so the smallest ring still reads as
 *  graduated. */
export function tickCount(radius: number): number {
  return Math.max(12, Math.round((2 * Math.PI * radius) / TICK_PITCH));
}

/** The seat's inner ring, as a fraction of its own radius — the doublet
 *  that reads as "seated" rather than as an eighth station. */
export const SEAT_INNER_K = 0.82;

/** Ring loop resolution. Matches HologramOrbits' SEGMENTS so the stroke
 *  draw-on has the same granularity the corridor's rings do. */
export const RING_SEGMENTS = 180;

/* ── Camera & rig ────────────────────────────────────────────────────── */

/**
 * A LONG LENS, which is the reference's own move and here it is load-bearing
 * three times over.
 *
 * 1. It flattens the stack into a drawing instead of bulging it into a
 *    scene — the whole reason that reference reads as an instrument.
 * 2. It keeps the radius encoding honest. Perspective amplifies a nearer
 *    ring, and that is only safe while it AGREES with the ladder; a wide
 *    lens exaggerates it enough to outrank the record.
 * 3. ⚠ IT IS WHAT STOPS A RING COLLAPSING INTO A LINE. All seven ring
 *    planes are parallel, so the camera lies in exactly one of them — and
 *    that ring projects to a bare vertical stroke. The plane sits at
 *    `x = camX·cos(yaw) − camZ·sin(yaw)`; pulling the camera back to 30
 *    puts it at **x ≈ +14.4** while the rightmost ring sits at x ≈ 3.9, so
 *    the whole course is clear of it. At the first cut's `camZ 7.2` it
 *    landed at x ≈ −1.6, mid-course, and the third station rendered as a
 *    line with nothing on screen to explain why.
 */
export const CAM_FOV = 4.96;
export const CAM_POS: readonly [number, number, number] = [0, 0.5, 30];
export const CAM_TARGET: readonly [number, number, number] = [0, 0.05, 0];

/**
 * The rig's resting pose.
 *
 * ⚠ THE YAW IS NEGATIVE SO THAT **NOW IS NEAREST**. `rotY` sends +x to −z,
 * so a positive yaw would push the terminus away and pull 2024 forward —
 * the record receding as it approaches the present. With −0.5 the seat sits
 * at depth 28.1 against 2024's 32.0, and since the seat is also the widest
 * ring, size and distance agree instead of fighting.
 */
export const REST_YAW = -0.5;
export const REST_PITCH = -0.1;

/**
 * Pointer-look amplitude, AS A FRACTION OF THE FRAME rather than a fixed
 * angle.
 *
 * ⚠ An absolute amplitude cannot survive a lens change: rotating the rig by
 * θ moves the picture by roughly θ/fov of the frame, so the corridor mark's
 * 0.05 rad — a tasteful nudge at fov 21 — would swing this drawing by more
 * than half its own width at fov 5. Expressed as a fraction, the parallax
 * keeps its FEEL if the lens is ever re-tuned.
 */
export const POINTER_FRAME_FRACTION = 0.035;
export const POINTER_AMPLITUDE = ((CAM_FOV * Math.PI) / 180) * POINTER_FRAME_FRACTION;

/* ── Pure projection, so the DOM and the drawing agree ───────────────── */

type Vec3 = readonly [number, number, number];

function rotX(p: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [p[0], c * p[1] - s * p[2], s * p[1] + c * p[2]];
}

function rotY(p: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c * p[0] + s * p[2], p[1], -s * p[0] + c * p[2]];
}

/**
 * The rig transform: pitch in the local frame, then yaw about world Y.
 * ⚠ This must stay the arithmetic twin of the scene's
 * `rotation.set(pitch, yaw, 0, "YXZ")` — three composes 'YXZ' as
 * `Ry · Rx · Rz`, i.e. exactly `rotY(rotX(p))`. Change one, change both, or
 * the DOM stations stop landing on their own rings.
 */
export function applyRig(p: Vec3, yaw = REST_YAW, pitch = REST_PITCH): Vec3 {
  return rotY(rotX(p, pitch), yaw);
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function norm(a: Vec3): Vec3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

/**
 * Project a world point to normalised screen space (0 → 1, left → right and
 * TOP → bottom, matching DOM percentages rather than NDC).
 *
 * A hand-rolled pinhole rather than a three `Camera.project` call, because
 * `components/arcs` and the unit tests both need this answer without a GL
 * context — and because the solver below runs it a few hundred times per
 * resize, where a matrix round-trip would be waste.
 */
export function projectToScreen01(
  world: Vec3,
  aspect: number,
  camPos: Vec3 = CAM_POS,
  camTarget: Vec3 = CAM_TARGET,
  fovDeg: number = CAM_FOV
): { x: number; y: number; behind: boolean } {
  const zAxis = norm(sub(camPos, camTarget));
  const xAxis = norm(cross([0, 1, 0], zAxis));
  const yAxis = cross(zAxis, xAxis);
  const d = sub(world, camPos);
  const vx = dot(xAxis, d);
  const vy = dot(yAxis, d);
  const vz = dot(zAxis, d);
  // The camera looks down its own −z, so a visible point has vz < 0.
  const depth = -vz;
  if (depth <= 1e-6) return { x: 0, y: 0, behind: true };
  const t = Math.tan((fovDeg * Math.PI) / 360);
  const ndcX = vx / (depth * t * aspect);
  const ndcY = vy / (depth * t);
  return { x: ndcX * 0.5 + 0.5, y: 0.5 - ndcY * 0.5, behind: false };
}

/** Where a point ON THE TIME AXIS lands horizontally, at rest. */
export function axisScreenX(worldX: number, aspect: number): number {
  return projectToScreen01(applyRig([worldX, AXIS_Y, 0]), aspect).x;
}

/** How far a rig-space point sits from the camera. Used by the guard that
 *  pins NOW as the nearest ring — depth is not visible in a screen position,
 *  so nothing else can ask this question. */
export function cameraDepth(
  world: Vec3,
  camPos: Vec3 = CAM_POS,
  camTarget: Vec3 = CAM_TARGET
): number {
  const zAxis = norm(sub(camPos, camTarget));
  return -dot(zAxis, sub(applyRig(world), camPos));
}

/** The widest half-span the solver will consider, in world units. */
const SOLVE_HALF_SPAN = 14;

/**
 * Invert the projection: the world x on the time axis whose resting screen
 * position is `targetX01`.
 *
 * ⚠ THIS IS WHAT LETS THE DOM STAY SERVER-RENDERED. The seven stations are
 * absolutely positioned at `left: var(--at)` by a server component and are
 * pinned there by the smoke; rather than measuring the scene per frame and
 * writing positions back into the DOM, the SCENE moves to meet them. Solved
 * at mount and on resize only — never per frame, and never a feedback loop.
 *
 * Projection along the yawed axis is monotonic in x while the axis stays in
 * front of the camera, so a bisection is exact to any tolerance we care
 * about and cannot land on a second root.
 */
export function solveAxisX(targetX01: number, aspect: number): number {
  let lo = -SOLVE_HALF_SPAN;
  let hi = SOLVE_HALF_SPAN;
  const at = (x: number) => axisScreenX(x, aspect);
  if (at(lo) > at(hi)) {
    // Defensive: a future rig pose that flips the axis' screen direction.
    [lo, hi] = [hi, lo];
  }
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (at(mid) < targetX01) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * The stations' horizontal insets, mirroring `--pg-stn-inset` on the flat
 * board: a station block is ~170px wide and centred on its own `at`, so the
 * course cannot run edge to edge without the first and last labels leaving
 * the band.
 */
export const INSET_L = 0.075;
export const INSET_R = 0.075;

/** The screen position a waypoint's DOM station occupies, in 0 → 1. */
export function stationScreenX(at: number): number {
  return INSET_L + at * (1 - INSET_L - INSET_R);
}

export interface HoloRing {
  id: string;
  at: number;
  /** World x on the time axis. */
  x: number;
  radius: number;
  seat: boolean;
  /** Draw-on window in arrival-progress units. */
  reveal: readonly [number, number];
}

export interface HoloLayout {
  aspect: number;
  rings: readonly HoloRing[];
  /** The axis rail's world-x endpoints, and where the record's span sits. */
  axisFrom: number;
  axisTo: number;
  /** The priors' dashed run-in, before the first station. */
  priorFrom: number;
  priorTo: number;
  /** The adoption ladder's treads in world space, as [x, radius] samples
   *  ordered along the axis — the ring rims' upper envelope. */
  ladder: readonly (readonly [x: number, y: number])[];
}

/* ── Arrival choreography ────────────────────────────────────────────── */

/**
 * The arrival's windows, in progress units. The drawing performs its own
 * timeline: the rings stroke on IN DATE ORDER, so a reader watching it
 * arrive is watching the record happen.
 *
 * ⚠ IT PLAYS ONCE AND THEN THE INSTRUMENT IS STILL (ADR-021, ADR-078). At
 * progress 1 every write stops and the demand frameloop stops with it —
 * there is no idle animation on this estate, and the grain freezes for the
 * same reason (nothing resamples it).
 */
export const ARRIVAL_MS = 2400;
export const W_GROUND: readonly [number, number] = [0.0, 0.16];
export const W_AXIS: readonly [number, number] = [0.06, 0.26];
export const W_PRIORS: readonly [number, number] = [0.1, 0.3];
export const W_RINGS: readonly [number, number] = [0.14, 0.78];
export const W_LADDER: readonly [number, number] = [0.4, 0.8];
export const W_PARALLEL: readonly [number, number] = [0.55, 0.8];
export const W_SEAT: readonly [number, number] = [0.78, 1.0];

/** Each ring's own draw-on window inside `W_RINGS`, staggered by DATE so
 *  the stagger is the record's spacing rather than an even beat. */
export function ringReveal(at: number): readonly [number, number] {
  const span = W_RINGS[1] - W_RINGS[0];
  const each = 0.16;
  const start = W_RINGS[0] + at * Math.max(0, span - each);
  return [start, start + each];
}

/** Build the whole layout for one canvas aspect. Pure — the lab, the unit
 *  tests and the scene all read the same object. */
export function holoLayout(waypoints: readonly HoloWaypoint[], aspect: number): HoloLayout {
  const rings = waypoints.map((wp) => ({
    id: wp.id,
    at: wp.at,
    x: solveAxisX(stationScreenX(wp.at), aspect),
    radius: ringRadius(wp.at),
    seat: wp.seat === true,
    reveal: ringReveal(wp.at),
  }));

  const axisFrom = solveAxisX(0.02, aspect);
  const axisTo = solveAxisX(0.98, aspect);
  const firstX = rings.length > 0 ? rings[0].x : solveAxisX(INSET_L, aspect);

  /* The ladder rides the rings' upper rims, sampled at every tread AND at
     every station, so it is the same step function in world space that the
     flat board draws in its band. */
  const ladder: (readonly [number, number])[] = [];
  const sampleAts = [...ADOPTION_TREADS.map(([a]) => a), ...waypoints.map((w) => w.at), 1].sort(
    (a, b) => a - b
  );
  let lastLevel = Number.NaN;
  for (const a of sampleAts) {
    const x = solveAxisX(stationScreenX(a), aspect);
    const y = AXIS_Y + ringRadius(a);
    const level = levelAt(a);
    if (level !== lastLevel && ladder.length > 0) {
      // The riser: step up in place, so the ladder never ramps.
      ladder.push([x, ladder[ladder.length - 1][1]]);
      lastLevel = level;
    } else if (Number.isNaN(lastLevel)) {
      lastLevel = level;
    }
    ladder.push([x, y]);
  }

  return {
    aspect,
    rings,
    axisFrom,
    axisTo,
    priorFrom: axisFrom,
    priorTo: firstX,
    ladder,
  };
}
