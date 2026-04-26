/**
 * Celestial weave for the latent gateway.
 *
 * Threads three differentiated ring grammars (data, code, celestial) plus a
 * topology layer (longitudinal wall rails, topographic floor slices,
 * rectangular depth gate frames) THROUGH the portal's depth so the latent
 * showcase reads as a navigable retrofuturistic gate, not as a sun ring or
 * mandala. All paths are sampled as dense point sets so they share the
 * gateway's existing dotted-line vocabulary.
 *
 * Each zone uses depth `t` in [0..1]; the host wraps the geometry in a
 * `<group scale.z={N * tunnelDepth}>` so the paths spread along the tunnel
 * and align with `LatentPortalContour`'s receding rings.
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

function pushPartialOrbit(
  rx: number,
  ry: number,
  z: number,
  segments: number,
  startAng: number,
  endAng: number,
  tiltX: number,
  tiltZ: number,
  out: number[]
): void {
  const cz = Math.cos(tiltZ);
  const sz = Math.sin(tiltZ);
  const cX = Math.cos(tiltX);
  const sX = Math.sin(tiltX);
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const ang = startAng + (endAng - startAng) * t;
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

/**
 * DATA RING — interrupted barcode bands + bearing ticks on the mouth contour.
 * Reads as a calibrated data readout (scrolling lanes, segmented signal).
 */
function pushDataBand(
  bandRadius: number,
  z: number,
  segments: number,
  activeArcRatio: number,
  arcPoints: number,
  tickLen: number,
  dotsPerTick: number,
  out: number[]
): void {
  const TWO_PI = Math.PI * 2;
  for (let i = 0; i < segments; i++) {
    const segStart = (i / segments) * TWO_PI;
    const segSpan = (TWO_PI / segments) * activeArcRatio;
    for (let d = 0; d < arcPoints; d++) {
      const t = arcPoints === 1 ? 0 : d / (arcPoints - 1);
      const ang = segStart + t * segSpan;
      out.push(Math.cos(ang) * bandRadius, Math.sin(ang) * bandRadius, z);
    }
    const midAng = segStart + segSpan * 0.5;
    pushDottedSegment(
      out,
      Math.cos(midAng) * bandRadius,
      Math.sin(midAng) * bandRadius,
      z,
      Math.cos(midAng) * (bandRadius + tickLen),
      Math.sin(midAng) * (bandRadius + tickLen),
      z,
      dotsPerTick
    );
  }
}

function pushDataZone(shape: GatewayShape, R: number, dawn: number[]): void {
  pushBearingTicks(shape, R * 1.04, 48, 0.06, 3, 0.02, dawn);
  pushBearingTicks(shape, R * 0.78, 36, 0.045, 3, 0.42, dawn);
  pushBearingTicks(shape, R * 0.6, 28, 0.035, 3, 0.74, dawn);

  pushDataBand(R * 0.72, 0.32, 18, 0.55, 6, 0.04, 4, dawn);
  pushDataBand(R * 0.86, 0.62, 14, 0.6, 5, 0.04, 4, dawn);
}

/**
 * CODE RING — bracket assemblies + chevrons + cardinal crosses.
 * Reads as instrument register marks and directional indicators
 * (anti-mandala because every element is directional / oriented).
 */
function pushCodeZone(R: number, dawn: number[], gold: number[]): void {
  // Four L-brackets at inter-cardinal corners pointing inward.
  const cornerStart = Math.PI / 4;
  const cornerRadius = R * 0.85;
  const bracketZ = 0.32;
  const armLen = 0.1;
  for (let i = 0; i < 4; i++) {
    const ang = cornerStart + i * (Math.PI / 2);
    const cx = Math.cos(ang) * cornerRadius;
    const cy = Math.sin(ang) * cornerRadius;
    const inwardX = -Math.cos(ang);
    const inwardY = -Math.sin(ang);
    const tangX = -inwardY;
    const tangY = inwardX;
    pushDottedSegment(
      dawn,
      cx,
      cy,
      bracketZ,
      cx + inwardX * armLen,
      cy + inwardY * armLen,
      bracketZ,
      8
    );
    pushDottedSegment(
      dawn,
      cx,
      cy,
      bracketZ,
      cx + tangX * armLen,
      cy + tangY * armLen,
      bracketZ,
      8
    );
  }

  // Four chevrons on cardinal axes pointing into the tunnel.
  const chevRadius = R * 0.65;
  const chevZ = 0.6;
  const chevSize = 0.085;
  for (let i = 0; i < 4; i++) {
    const ang = i * (Math.PI / 2);
    const cx = Math.cos(ang) * chevRadius;
    const cy = Math.sin(ang) * chevRadius;
    const dirX = -Math.cos(ang);
    const dirY = -Math.sin(ang);
    const px = -dirY;
    const py = dirX;
    const tipX = cx + dirX * chevSize * 0.5;
    const tipY = cy + dirY * chevSize * 0.5;
    pushDottedSegment(
      dawn,
      tipX,
      tipY,
      chevZ,
      cx + px * chevSize * 0.7,
      cy + py * chevSize * 0.7,
      chevZ,
      6
    );
    pushDottedSegment(
      dawn,
      tipX,
      tipY,
      chevZ,
      cx - px * chevSize * 0.7,
      cy - py * chevSize * 0.7,
      chevZ,
      6
    );
  }

  // Cardinal crosses at register depths — the gold instrument anchors.
  pushCardinalCross(R * 0.85, R * 0.85, 0.18, 22, gold);
  pushCardinalCross(R * 0.68, R * 0.68, 0.45, 16, gold);
  pushCardinalCross(R * 0.5, R * 0.5, 0.72, 12, gold);
  pushCardinalCross(R * 0.34, R * 0.34, 0.93, 8, gold);
}

/**
 * CELESTIAL RING — partial tilted arcs + spokes + constellation + waypoints.
 * Reads as the navigation/cosmological layer: partial arcs avoid the
 * ornamental full-ellipse mandala, spokes anchor the constellation deep
 * in the tunnel.
 */
function pushCelestialZone(shape: GatewayShape, R: number, dawn: number[], gold: number[]): void {
  pushPartialOrbit(
    R * 0.46,
    R * 0.46 * 0.42,
    0.2,
    36,
    0.22 * Math.PI,
    1.62 * Math.PI,
    -0.18,
    0.06,
    dawn
  );
  pushPartialOrbit(
    R * 0.36,
    R * 0.36 * 0.42,
    0.5,
    32,
    -0.1 * Math.PI,
    1.2 * Math.PI,
    0.1,
    -0.04,
    dawn
  );
  pushPartialOrbit(
    R * 0.28,
    R * 0.28 * 0.42,
    0.78,
    28,
    0.4 * Math.PI,
    1.7 * Math.PI,
    -0.08,
    0.02,
    dawn
  );

  const SPOKE_COUNT = 8;
  const mouthAnchors = sampleContourAnchors(shape, SPOKE_COUNT, R * 0.96);
  const innerAnchors = sampleContourAnchors(shape, SPOKE_COUNT, R * 0.43);
  const constellationNodes: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i < SPOKE_COUNT; i++) {
    const a = mouthAnchors[i]!;
    const b = innerAnchors[i]!;
    pushDottedSegment(dawn, a.x, a.y, 0.05, b.x, b.y, 0.93, 22);
    constellationNodes.push({ x: b.x, y: b.y, z: 0.93 });
  }
  const edges: [number, number][] = [
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
  for (const [i, j] of edges) {
    const a = constellationNodes[i];
    const b = constellationNodes[j];
    if (!a || !b) continue;
    pushDottedSegment(dawn, a.x, a.y, a.z, b.x, b.y, b.z, 14);
  }
  const tick = 0.018;
  for (const n of constellationNodes) {
    pushDottedSegment(dawn, n.x - tick, n.y, n.z, n.x + tick, n.y, n.z, 3);
    pushDottedSegment(dawn, n.x, n.y - tick, n.z, n.x, n.y + tick, n.z, 3);
  }

  for (let m = 0; m < 4; m++) {
    const ang = m * (Math.PI / 2) + Math.PI / 4;
    const wx = R * 0.46 * Math.cos(ang);
    const wy = R * 0.46 * 0.42 * Math.sin(ang);
    pushDiamondMarker(wx, wy, 0.2, 0.026, 5, gold);
  }
  for (let m = 0; m < 4; m++) {
    const ang = m * (Math.PI / 2);
    const wx = R * 0.36 * Math.cos(ang);
    const wy = R * 0.36 * 0.42 * Math.sin(ang);
    pushDiamondMarker(wx, wy, 0.5, 0.022, 5, gold);
  }
  for (let m = 0; m < 4; m++) {
    const ang = m * (Math.PI / 2) + Math.PI / 4;
    const wx = R * 0.28 * Math.cos(ang);
    const wy = R * 0.28 * 0.42 * Math.sin(ang);
    pushDiamondMarker(wx, wy, 0.78, 0.018, 5, gold);
  }
}

/**
 * TOPOLOGY — longitudinal wall rails, topographic floor slices, and
 * rectangular depth gate frames. Provides the architectural depth so the
 * tunnel reads as a navigable corridor with visible side walls and a
 * latent landscape floor, not as a flat front-on disc.
 */
function pushTunnelWallRails(shape: GatewayShape, R: number, dawn: number[]): void {
  const RAIL_COUNT = 14;
  const mouthAnchors = sampleContourAnchors(shape, RAIL_COUNT, R * 0.95);
  const farAnchors = sampleContourAnchors(shape, RAIL_COUNT, R * 0.78);
  for (let i = 0; i < RAIL_COUNT; i++) {
    const a = mouthAnchors[i]!;
    const b = farAnchors[i]!;
    const isFullRail = i % 3 !== 2;
    const zEnd = isFullRail ? 0.97 : 0.55;
    const dotCount = isFullRail ? 26 : 14;
    pushDottedSegment(dawn, a.x, a.y, 0.04, b.x, b.y, zEnd, dotCount);
  }
}

function pushTopographicFloor(R: number, dawn: number[]): void {
  const zSlices = [0.18, 0.36, 0.55, 0.74, 0.92];
  for (const z of zSlices) {
    const tunnelR = R * (1 - z * 0.2);
    const shelfCount = 4;
    for (let s = 0; s < shelfCount; s++) {
      const sT = s / (shelfCount - 1);
      const y = -0.35 * tunnelR - sT * 0.5 * tunnelR;
      const xExtent = Math.sqrt(Math.max(0, tunnelR * tunnelR - y * y)) * 0.92;
      const samples = 24;
      for (let i = 0; i < samples; i++) {
        const t = i / (samples - 1);
        const x = -xExtent + t * 2 * xExtent;
        const yWave = y + Math.sin(x * 6 + z * 9 + s * 2.5) * 0.012;
        dawn.push(x, yWave, z);
      }
    }
  }
}

function pushDepthGateFrames(R: number, dawn: number[]): void {
  const frames = [
    { z: 0.18, halfX: R * 0.9, halfY: R * 0.85, edgeDots: 24 },
    { z: 0.45, halfX: R * 0.74, halfY: R * 0.7, edgeDots: 20 },
    { z: 0.72, halfX: R * 0.55, halfY: R * 0.5, edgeDots: 16 },
    { z: 0.93, halfX: R * 0.38, halfY: R * 0.34, edgeDots: 12 },
  ];
  const cornerArm = 0.08;
  for (const f of frames) {
    const x0 = -f.halfX;
    const y0 = -f.halfY;
    const x1 = f.halfX;
    const y1 = -f.halfY;
    const x2 = f.halfX;
    const y2 = f.halfY;
    const x3 = -f.halfX;
    const y3 = f.halfY;
    pushDottedSegment(dawn, x0, y0, f.z, x1, y1, f.z, f.edgeDots);
    pushDottedSegment(dawn, x1, y1, f.z, x2, y2, f.z, f.edgeDots);
    pushDottedSegment(dawn, x2, y2, f.z, x3, y3, f.z, f.edgeDots);
    pushDottedSegment(dawn, x3, y3, f.z, x0, y0, f.z, f.edgeDots);
    const corners: { cx: number; cy: number; dx: number; dy: number; dx2: number; dy2: number }[] =
      [
        { cx: x0, cy: y0, dx: 1, dy: 0, dx2: 0, dy2: 1 },
        { cx: x1, cy: y1, dx: -1, dy: 0, dx2: 0, dy2: 1 },
        { cx: x2, cy: y2, dx: -1, dy: 0, dx2: 0, dy2: -1 },
        { cx: x3, cy: y3, dx: 1, dy: 0, dx2: 0, dy2: -1 },
      ];
    for (const c of corners) {
      pushDottedSegment(
        dawn,
        c.cx,
        c.cy,
        f.z,
        c.cx + c.dx * cornerArm,
        c.cy + c.dy * cornerArm,
        f.z,
        4
      );
      pushDottedSegment(
        dawn,
        c.cx,
        c.cy,
        f.z,
        c.cx + c.dx2 * cornerArm,
        c.cy + c.dy2 * cornerArm,
        f.z,
        4
      );
    }
  }
}

function pushTopologyZone(shape: GatewayShape, R: number, dawn: number[]): void {
  pushTunnelWallRails(shape, R, dawn);
  pushTopographicFloor(R, dawn);
  pushDepthGateFrames(R, dawn);
}

export interface CelestialZoneGeometry {
  dawnPoints: Float32Array;
  goldPoints: Float32Array;
}

export interface CelestialWeaveGeometry {
  /** Outer celestial field — co-planar with the mouth, surrounds the gateway */
  outer: CelestialZoneGeometry;
  /** Data ring — interrupted barcode bands + bearing ticks (Dawn) */
  data: CelestialZoneGeometry;
  /** Code ring — bracket assemblies, chevrons, cardinal crosses (Dawn + Gold) */
  code: CelestialZoneGeometry;
  /** Celestial ring — partial arcs, spokes, constellation, waypoints (Dawn + Gold) */
  celestial: CelestialZoneGeometry;
  /** Topology — wall rails, topographic floor, rectangular depth gate frames (Dawn) */
  topology: CelestialZoneGeometry;
}

export interface CelestialWeaveOptions {
  /** Mouth radius the weave anchors to (defaults to portal contour ~1.0) */
  contourRadius?: number;
  /** Constellation seed for spoke/edge variation */
  seed?: number;
}

/**
 * Build the shape-aware celestial weave with five separable zones:
 * `outer` (around the gate, locked), and four inner zones — `data`, `code`,
 * `celestial`, `topology` — each rendered as its own group inside
 * `LatentInstrument` so they can rotate at different rates and read as
 * three differentiated ring grammars threaded through tunnel architecture.
 */
export function buildCelestialWeave(
  shape: GatewayShape,
  opts?: CelestialWeaveOptions
): CelestialWeaveGeometry {
  const R = opts?.contourRadius ?? 1.0;
  const seed = opts?.seed ?? 7777;

  const outerDawn: number[] = [];
  const outerGold: number[] = [];
  const dataDawn: number[] = [];
  const dataGold: number[] = [];
  const codeDawn: number[] = [];
  const codeGold: number[] = [];
  const celestialDawn: number[] = [];
  const celestialGold: number[] = [];
  const topologyDawn: number[] = [];
  const topologyGold: number[] = [];

  pushOuterCelestialField(R, seed, outerDawn, outerGold);
  pushDataZone(shape, R, dataDawn);
  pushCodeZone(R, codeDawn, codeGold);
  pushCelestialZone(shape, R, celestialDawn, celestialGold);
  pushTopologyZone(shape, R, topologyDawn);

  const toFloat = (arr: number[]): Float32Array => new Float32Array(arr);

  return {
    outer: { dawnPoints: toFloat(outerDawn), goldPoints: toFloat(outerGold) },
    data: { dawnPoints: toFloat(dataDawn), goldPoints: toFloat(dataGold) },
    code: { dawnPoints: toFloat(codeDawn), goldPoints: toFloat(codeGold) },
    celestial: {
      dawnPoints: toFloat(celestialDawn),
      goldPoints: toFloat(celestialGold),
    },
    topology: {
      dawnPoints: toFloat(topologyDawn),
      goldPoints: toFloat(topologyGold),
    },
  };
}
