/**
 * lib/latent-flight/flight/course — the route as a curve, three-free.
 *
 * A centripetal Catmull-Rom spline through the vessel's station and the
 * seven waypoints, sampled densely and re-parameterised by ARC LENGTH so the
 * course parameter `s` (0 at the station, 1 at VOIDWALKER) moves at a
 * constant rate per unit of distance. Every sample carries a parallel-
 * transported frame (tangent, normal, binormal) so the camera and the rail
 * lattice share one orientation along the whole route with no roll flips.
 *
 * Each waypoint's `s` is DERIVED here from where its control point lands on
 * the curve — never authored — so the ladder, the readouts and the flight
 * model all agree by construction.
 */

import { WAYPOINTS, type WaypointId } from "../content/waypoints";
import { add, cross, dot, normalize, scale, type Vec3 } from "../pulsar";

export interface CourseSample {
  p: Vec3;
  t: Vec3;
  n: Vec3;
  b: Vec3;
  /** Arc length from the start, world units. */
  arc: number;
}

export interface Course {
  samples: CourseSample[];
  /** Total arc length, world units. */
  length: number;
  /** Arc length at each control point (the station, then the waypoints). */
  controlArc: number[];
}

export interface CoursePose {
  p: Vec3;
  t: Vec3;
  n: Vec3;
  b: Vec3;
}

/** The vessel's station: the origin, looking down −Z. */
export const STATION: Vec3 = [0, 0, 0];

const SAMPLES_PER_SEGMENT = 48;

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function len(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

/** Centripetal Catmull-Rom between p1 and p2 (p0, p3 the neighbours). */
function catmullRom(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, u: number): Vec3 {
  const alpha = 0.5;
  const t0 = 0;
  const t1 = t0 + Math.pow(len(sub(p1, p0)), alpha) || 1e-6;
  const t2 = t1 + (Math.pow(len(sub(p2, p1)), alpha) || 1e-6);
  const t3 = t2 + (Math.pow(len(sub(p3, p2)), alpha) || 1e-6);
  const t = t1 + (t2 - t1) * u;
  const lerp = (a: Vec3, b: Vec3, ta: number, tb: number): Vec3 => {
    const k = tb === ta ? 0 : (t - ta) / (tb - ta);
    return add(scale(a, 1 - k), scale(b, k));
  };
  const a1 = lerp(p0, p1, t0, t1);
  const a2 = lerp(p1, p2, t1, t2);
  const a3 = lerp(p2, p3, t2, t3);
  const b1 = lerp(a1, a2, t0, t2);
  const b2 = lerp(a2, a3, t1, t3);
  return lerp(b1, b2, t1, t2);
}

/** Build a course through the given control points (≥ 2). */
export function buildCourse(points: readonly Vec3[], samplesPerSegment = SAMPLES_PER_SEGMENT): Course {
  if (points.length < 2) throw new Error("a course needs at least two control points");
  const raw: Vec3[] = [];
  const controlIndex: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    controlIndex.push(raw.length);
    for (let j = 0; j < samplesPerSegment; j++) {
      raw.push(catmullRom(p0, p1, p2, p3, j / samplesPerSegment));
    }
  }
  controlIndex.push(raw.length);
  raw.push(points[points.length - 1]);

  // Arc lengths and tangents.
  const arcs: number[] = [0];
  for (let i = 1; i < raw.length; i++) arcs.push(arcs[i - 1] + len(sub(raw[i], raw[i - 1])));
  const length = arcs[arcs.length - 1];

  const samples: CourseSample[] = [];
  let n: Vec3 = [1, 0, 0];
  for (let i = 0; i < raw.length; i++) {
    const prev = raw[Math.max(0, i - 1)];
    const next = raw[Math.min(raw.length - 1, i + 1)];
    const t = normalize(sub(next, prev));
    if (i === 0) {
      // Seed the frame from world up; the first tangent is (nearly) −Z.
      // ⚠ `cross(t, up)` is RIGHT for a forward tangent — `cross(up, t)` is
      // left, and a (left, up, back) basis is a mirror: the quaternion the
      // camera extracts from it is garbage and the lattice measured 1508px
      // off the chrome. The handedness is pinned by the unit test.
      const up: Vec3 = [0, 1, 0];
      n = normalize(cross(t, up));
    } else {
      // Parallel transport: remove the tangent's component, renormalise.
      n = normalize(sub(n, scale(t, dot(n, t))));
    }
    // Right-handed with the camera: X = n (right), Y = b (up), Z = −t.
    const b = cross(n, t);
    samples.push({ p: raw[i], t, n, b, arc: arcs[i] });
  }
  return { samples, length, controlArc: controlIndex.map((i) => arcs[i]) };
}

function lerp3(a: Vec3, b: Vec3, k: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

/** The pose at course parameter `s` (0 … 1), interpolated between samples. */
export function courseAt(course: Course, s: number): CoursePose {
  const arc = Math.max(0, Math.min(1, s)) * course.length;
  const { samples } = course;
  let lo = 0;
  let hi = samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].arc <= arc) lo = mid;
    else hi = mid;
  }
  const a = samples[lo];
  const c = samples[hi];
  const span = c.arc - a.arc;
  const k = span > 1e-9 ? (arc - a.arc) / span : 0;
  const t = normalize(lerp3(a.t, c.t, k));
  const n0 = normalize(lerp3(a.n, c.n, k));
  const n = normalize(sub(n0, scale(t, dot(n0, t))));
  return { p: lerp3(a.p, c.p, k), t, n, b: cross(n, t) };
}

/** Heading in degrees for a tangent: 0 = down −Z, clockwise from above. */
export function headingOf(t: Vec3): number {
  const deg = (Math.atan2(t[0], -t[2]) * 180) / Math.PI;
  return ((deg % 360) + 360) % 360;
}

/** Arc length of the sample nearest a point — where the curve passes it. */
export function nearestArc(course: Course, p: Vec3): number {
  let best = 0;
  let bestD = Number.POSITIVE_INFINITY;
  for (const s of course.samples) {
    const d = len(sub(s.p, p));
    if (d < bestD) {
      bestD = d;
      best = s.arc;
    }
  }
  return best;
}

/**
 * A STATION PASS: four collinear control points through a waypoint along
 * its chord direction, so the curve runs STRAIGHT for `PASS_HALF` units
 * either side of the mark. A station is somewhere the vessel holds, and
 * while it holds the lattice must seat on the chrome — which only happens
 * where the course is locally straight (two units ahead of a bend the
 * corridor has already turned: 180px off at PROOF before this). The last
 * waypoint's pass ENDS on its mark, so `s` = 1 is the mark itself.
 */
export const PASS_HALF = 5;

function stationPass(p: Vec3, u: Vec3, last: boolean): Vec3[] {
  const d1 = scale(u, PASS_HALF);
  const d2 = scale(u, PASS_HALF * 2);
  const before: Vec3[] = [sub(p, d2), sub(p, d1)];
  return last ? [...before, p] : [...before, add(p, d1), add(p, d2)];
}

/**
 * The one course. It leaves the station STRAIGHT down −Z for ten units (two
 * collinear lead points make the first segment a line, so the vessel at rest
 * looks exactly where the vista was composed), then bends through the six
 * charted waypoints beyond HOME, each on a straight station pass. HOME
 * itself is the station's own marker, seated beside the lead-out, and its
 * `s` is 0.
 */
const LEAD_OUT: readonly Vec3[] = [
  [0, 0, -4],
  [0, 0, -10],
];

function courseControls(): Vec3[] {
  const pts: Vec3[] = [STATION, ...LEAD_OUT];
  for (let i = 1; i < WAYPOINTS.length; i++) {
    const p = WAYPOINTS[i].position as Vec3;
    const prev = (i === 1 ? LEAD_OUT[LEAD_OUT.length - 1] : WAYPOINTS[i - 1].position) as Vec3;
    const last = i === WAYPOINTS.length - 1;
    const next = last ? p : (WAYPOINTS[i + 1].position as Vec3);
    // The pass runs along the chord from the previous mark to the next.
    const u = normalize(last ? sub(p, prev) : sub(next, prev));
    pts.push(...stationPass(p, u, last));
  }
  return pts;
}

export const COURSE: Course = buildCourse(courseControls());

/** Each waypoint's course parameter, derived from where the curve passes it. */
export const WAYPOINT_S: readonly number[] = WAYPOINTS.map((w, i) =>
  i === 0 ? 0 : nearestArc(COURSE, w.position as Vec3) / COURSE.length
);

export function waypointS(id: WaypointId): number {
  const i = WAYPOINTS.findIndex((w) => w.id === id);
  return WAYPOINT_S[i];
}

/** The waypoint the vessel is IN (the last one whose `s` it has reached). */
export function sectorAt(s: number): WaypointId {
  let idx = 0;
  for (let i = 0; i < WAYPOINT_S.length; i++) if (s + 1e-6 >= WAYPOINT_S[i]) idx = i;
  return WAYPOINTS[idx].id;
}

/** Progress within the current leg, 0 … 1 — the site's LOCAL readout. */
export function localAt(s: number): number {
  const idx = WAYPOINTS.findIndex((w) => w.id === sectorAt(s));
  const from = WAYPOINT_S[idx];
  const to = idx + 1 < WAYPOINT_S.length ? WAYPOINT_S[idx + 1] : 1;
  if (to <= from) return 1;
  return Math.max(0, Math.min(1, (s - from) / (to - from)));
}
