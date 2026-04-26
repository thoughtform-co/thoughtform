/**
 * Celestial weave for the latent gateway.
 *
 * Threads the celestial-connector grammar (bearing ticks, register frames,
 * cardinal cross, ecliptic orbits, radial spokes, constellation, waypoint
 * diamonds) THROUGH the portal's depth so it shares anchors with the v1
 * portal particle stack instead of floating as a separate overlay.
 *
 * All paths are sampled as dense particle points so they read as the
 * gateway's existing dotted line language. Points use a depth `t` in [0..1];
 * the host wraps the geometry in a `<group scale.z={N * tunnelDepth}>` so
 * those paths spread along the tunnel and align with `LatentPortalContour`'s
 * receding rings.
 */
import type { GatewayShape } from "@/lib/particle-config";
import { seededRandom } from "@/components/landing/v7/CelestialConnector/shapes/seededRandom";
import { getShapeGenerator } from "./latentShapePointFn";

interface ContourAnchor {
  x: number;
  y: number;
  /** Outward unit normal (away from origin) */
  nx: number;
  ny: number;
}

function sampleContourAnchors(shape: GatewayShape, count: number, radius: number): ContourAnchor[] {
  const getPoint = getShapeGenerator(shape);
  const out: ContourAnchor[] = [];
  const eps = 1 / Math.max(count, 64) / 4;

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const p = getPoint(t, radius);
    const next = getPoint((t + eps) % 1, radius);
    const dx = next.x - p.x;
    const dy = next.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const tx = dx / len;
    const ty = dy / len;

    let nx = ty;
    let ny = -tx;
    if (nx * p.x + ny * p.y < 0) {
      nx = -nx;
      ny = -ny;
    }
    out.push({ x: p.x, y: p.y, nx, ny });
  }
  return out;
}

function pushDottedSegment(
  out: number[],
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
  dotCount: number
): void {
  const last = Math.max(1, dotCount - 1);
  for (let i = 0; i < dotCount; i++) {
    const t = i / last;
    out.push(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t);
  }
}

function pushFrameAtZ(
  shape: GatewayShape,
  radius: number,
  z: number,
  samples: number,
  out: number[]
): void {
  const getPoint = getShapeGenerator(shape);
  for (let i = 0; i < samples; i++) {
    const t = i / samples;
    const p = getPoint(t, radius);
    out.push(p.x, p.y, z);
  }
}

function pushBearingTicks(
  shape: GatewayShape,
  contourRadius: number,
  density: number,
  tickLength: number,
  dotsPerTick: number,
  z: number,
  out: number[]
): void {
  const anchors = sampleContourAnchors(shape, density, contourRadius);
  for (const a of anchors) {
    const x1 = a.x + a.nx * tickLength;
    const y1 = a.y + a.ny * tickLength;
    pushDottedSegment(out, a.x, a.y, z, x1, y1, z, dotsPerTick);
  }
}

function pushTiltedOrbit(
  rx: number,
  ry: number,
  z: number,
  segments: number,
  tiltX: number,
  tiltZ: number,
  out: number[]
): void {
  const cz = Math.cos(tiltZ);
  const sz = Math.sin(tiltZ);
  const cX = Math.cos(tiltX);
  const sX = Math.sin(tiltX);
  for (let i = 0; i < segments; i++) {
    const ang = (i / segments) * Math.PI * 2;
    let x = rx * Math.cos(ang);
    let y = ry * Math.sin(ang);
    let zz = z;
    const x1 = x * cz - y * sz;
    const y1 = x * sz + y * cz;
    x = x1;
    y = y1;
    const y2 = y * cX - zz * sX;
    const z2 = y * sX + zz * cX;
    y = y2;
    zz = z2;
    out.push(x, y, zz);
  }
}

function pushCardinalCross(
  rx: number,
  ry: number,
  z: number,
  dotsPerArm: number,
  out: number[]
): void {
  pushDottedSegment(out, -rx, 0, z, rx, 0, z, dotsPerArm);
  pushDottedSegment(out, 0, -ry, z, 0, ry, z, dotsPerArm);
}

function pushDiamondMarker(
  cx: number,
  cy: number,
  cz: number,
  side: number,
  dotsPerEdge: number,
  out: number[]
): void {
  const c = Math.cos(Math.PI / 4);
  const s = Math.sin(Math.PI / 4);
  const corners: [number, number][] = [
    [-side, -side],
    [side, -side],
    [side, side],
    [-side, side],
  ].map(([dx, dy]) => [cx + (dx * c - dy * s), cy + (dx * s + dy * c)]);
  for (let k = 0; k < 4; k++) {
    const a = corners[k]!;
    const b = corners[(k + 1) % 4]!;
    pushDottedSegment(out, a[0], a[1], cz, b[0], b[1], cz, dotsPerEdge);
  }
}

/**
 * Outer celestial environment surrounding the gateway. Co-planar with the
 * mouth (z=0 in weave space) so a parallax reveal can show the gateway
 * embedded in a celestial instrument rather than floating in void.
 *
 * Uses a circular cosmological frame regardless of mouth shape — the
 * gateway provides the silhouette, the frame provides the universal
 * compass / star-field context that matches the landing-page connectors.
 */
function pushOuterCelestialField(R: number, seed: number, dawn: number[], gold: number[]): void {
  const ringR = R * 1.55;
  const ringSamples = 360;
  for (let i = 0; i < ringSamples; i++) {
    const a = (i / ringSamples) * Math.PI * 2;
    dawn.push(Math.cos(a) * ringR, Math.sin(a) * ringR, 0);
  }

  const innerRingR = R * 1.36;
  const innerRingSamples = 280;
  for (let i = 0; i < innerRingSamples; i++) {
    const a = (i / innerRingSamples) * Math.PI * 2;
    dawn.push(Math.cos(a) * innerRingR, Math.sin(a) * innerRingR, 0);
  }

  const tickCount = 24;
  const tickLen = 0.08;
  for (let i = 0; i < tickCount; i++) {
    const a = (i / tickCount) * Math.PI * 2;
    pushDottedSegment(
      dawn,
      Math.cos(a) * ringR,
      Math.sin(a) * ringR,
      0,
      Math.cos(a) * (ringR + tickLen),
      Math.sin(a) * (ringR + tickLen),
      0,
      6
    );
  }

  const cardinalAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
  // Start the radial axes past the EdgeGlowRing halo (~1.12..1.2 R) so they
  // read as separate from the gateway silhouette.
  const axisStartR = R * 1.22;
  const axisEndR = R * 2.05;
  for (const a of cardinalAngles) {
    pushDottedSegment(
      dawn,
      Math.cos(a) * axisStartR,
      Math.sin(a) * axisStartR,
      0,
      Math.cos(a) * axisEndR,
      Math.sin(a) * axisEndR,
      0,
      36
    );
    pushDiamondMarker(Math.cos(a) * axisEndR, Math.sin(a) * axisEndR, 0, 0.046, 8, gold);
  }

  const cornerR = R * 2.3;
  const cornerAngles = [Math.PI / 4, (3 * Math.PI) / 4, -(3 * Math.PI) / 4, -Math.PI / 4];
  const armLen = 0.22;
  for (const a of cornerAngles) {
    const cx = Math.cos(a) * cornerR;
    const cy = Math.sin(a) * cornerR;
    const inwardX = -Math.cos(a);
    const inwardY = -Math.sin(a);
    const tangX = -inwardY;
    const tangY = inwardX;
    pushDottedSegment(gold, cx, cy, 0, cx + inwardX * armLen, cy + inwardY * armLen, 0, 9);
    pushDottedSegment(gold, cx, cy, 0, cx + tangX * armLen, cy + tangY * armLen, 0, 9);
  }

  const rnd = seededRandom(seed);
  const starCount = 18;
  for (let i = 0; i < starCount; i++) {
    const a = rnd() * Math.PI * 2;
    const r = R * (1.7 + rnd() * 0.7);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    const ts = 0.018;
    pushDottedSegment(dawn, x - ts, y, 0, x + ts, y, 0, 4);
    pushDottedSegment(dawn, x, y - ts, 0, x, y + ts, 0, 4);
  }
}

export interface CelestialZoneGeometry {
  dawnPoints: Float32Array;
  goldPoints: Float32Array;
}

export interface CelestialWeaveGeometry {
  /** Outer celestial field — co-planar with the mouth, surrounds the gateway */
  outer: CelestialZoneGeometry;
  /** Inner woven instrument — threaded through the tunnel via host scale.z */
  inner: CelestialZoneGeometry;
}

export interface CelestialWeaveOptions {
  /** Mouth radius the weave anchors to (defaults to portal contour ~1.0) */
  contourRadius?: number;
  /** Constellation seed for spoke/edge variation */
  seed?: number;
}

/**
 * Build a shape-aware celestial weave with two zones:
 *
 * Outer celestial field (around the gateway, co-planar with the mouth):
 * - cosmological ring + bearing ticks
 * - four cardinal axis lines extending from the mouth contour outward
 * - gold waypoint diamonds capping each cardinal axis
 * - gold corner brackets framing the composition (HUD register marks)
 * - sparse field stars
 *
 * Inner woven instrument (inside the gateway, threaded through the tunnel):
 * - bearing ticks at three depths
 * - four shrinking register frames matching the mouth shape
 * - eight long dotted spokes from mouth into deep constellation nodes
 * - stacked gold cardinal crosses + waypoint diamonds at each register depth
 * - three tilted ecliptic orbits between depths
 *
 * Returned z values are in [0..~1.0] so the host group can stretch them
 * along the tunnel via `scale.z = N * tunnelDepth` to sit in front of the
 * `TunnelDepthRings` (which use `scale.z = 8 * tunnelDepth`).
 */
export function buildCelestialWeave(
  shape: GatewayShape,
  opts?: CelestialWeaveOptions
): CelestialWeaveGeometry {
  const R = opts?.contourRadius ?? 1.0;
  const seed = opts?.seed ?? 7777;

  const outerDawn: number[] = [];
  const outerGold: number[] = [];
  const innerDawn: number[] = [];
  const innerGold: number[] = [];

  pushOuterCelestialField(R, seed, outerDawn, outerGold);

  pushBearingTicks(shape, R * 1.04, 48, 0.06, 3, 0.0, innerDawn);
  pushBearingTicks(shape, R * 0.78, 36, 0.045, 3, 0.42, innerDawn);
  pushBearingTicks(shape, R * 0.6, 28, 0.035, 3, 0.74, innerDawn);

  const frames: { radius: number; z: number; samples: number }[] = [
    { radius: R * 0.92, z: 0.15, samples: 320 },
    { radius: R * 0.74, z: 0.42, samples: 260 },
    { radius: R * 0.55, z: 0.7, samples: 200 },
    { radius: R * 0.38, z: 0.92, samples: 140 },
  ];
  for (const f of frames) pushFrameAtZ(shape, f.radius, f.z, f.samples, innerDawn);

  pushTiltedOrbit(R * 0.46, R * 0.46 * 0.42, 0.18, 56, -0.18, 0.06, innerDawn);
  pushTiltedOrbit(R * 0.36, R * 0.36 * 0.42, 0.46, 48, 0.1, -0.04, innerDawn);
  pushTiltedOrbit(R * 0.28, R * 0.28 * 0.42, 0.74, 40, -0.08, 0.02, innerDawn);

  const SPOKE_COUNT = 8;
  const mouthAnchors = sampleContourAnchors(shape, SPOKE_COUNT, R * 0.96);
  const innerAnchors = sampleContourAnchors(shape, SPOKE_COUNT, R * 0.55 * 0.78);
  const constellationNodes: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i < SPOKE_COUNT; i++) {
    const a = mouthAnchors[i]!;
    const b = innerAnchors[i]!;
    const zEnd = 0.92;
    pushDottedSegment(innerDawn, a.x, a.y, 0, b.x, b.y, zEnd, 22);
    constellationNodes.push({ x: b.x, y: b.y, z: zEnd });
  }

  const constellationEdges: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 0],
    [0, 4],
    [2, 6],
  ];
  for (const [i, j] of constellationEdges) {
    const a = constellationNodes[i];
    const b = constellationNodes[j];
    if (!a || !b) continue;
    pushDottedSegment(innerDawn, a.x, a.y, a.z, b.x, b.y, b.z, 14);
  }
  const tick = 0.018;
  for (const n of constellationNodes) {
    pushDottedSegment(innerDawn, n.x - tick, n.y, n.z, n.x + tick, n.y, n.z, 3);
    pushDottedSegment(innerDawn, n.x, n.y - tick, n.z, n.x, n.y + tick, n.z, 3);
  }

  pushCardinalCross(R * 0.85, R * 0.85, 0.15, 22, innerGold);
  pushCardinalCross(R * 0.68, R * 0.68, 0.42, 16, innerGold);
  pushCardinalCross(R * 0.5, R * 0.5, 0.7, 12, innerGold);
  pushCardinalCross(R * 0.34, R * 0.34, 0.92, 8, innerGold);

  for (let m = 0; m < 4; m++) {
    const ang = m * (Math.PI / 2) + Math.PI / 4;
    const wx = R * 0.46 * Math.cos(ang);
    const wy = R * 0.46 * 0.42 * Math.sin(ang);
    pushDiamondMarker(wx, wy, 0.18, 0.026, 5, innerGold);
  }
  for (let m = 0; m < 4; m++) {
    const ang = m * (Math.PI / 2);
    const wx = R * 0.36 * Math.cos(ang);
    const wy = R * 0.36 * 0.42 * Math.sin(ang);
    pushDiamondMarker(wx, wy, 0.46, 0.022, 5, innerGold);
  }
  for (let m = 0; m < 4; m++) {
    const ang = m * (Math.PI / 2) + Math.PI / 4;
    const wx = R * 0.28 * Math.cos(ang);
    const wy = R * 0.28 * 0.42 * Math.sin(ang);
    pushDiamondMarker(wx, wy, 0.74, 0.018, 5, innerGold);
  }

  return {
    outer: {
      dawnPoints: new Float32Array(outerDawn),
      goldPoints: new Float32Array(outerGold),
    },
    inner: {
      dawnPoints: new Float32Array(innerDawn),
      goldPoints: new Float32Array(innerGold),
    },
  };
}
