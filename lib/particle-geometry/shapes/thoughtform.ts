// ═══════════════════════════════════════════════════════════════════
// THOUGHTFORM SHAPE GENERATORS
// Original, alien-looking shapes with 3D topology
// ═══════════════════════════════════════════════════════════════════

import type { Vec3 } from "../math";
import { normalizePoints } from "../math";
import { createSeededRandom } from "../rng";
import { generateTrajectory, curlNoiseODE, eulerStep } from "../integrators";
import type { ShapeOptions } from "./types";

/**
 * Filament Field - Organic, flowing filamentary structure
 * Creates cloud-like shapes with visible flow lines
 */
export function generateFilamentField(options: ShapeOptions): Vec3[] {
  const { seed, pointCount } = options;
  const rng = createSeededRandom(seed);
  const points: Vec3[] = [];

  // Generate multiple flow trajectories from different starting points
  const numTrajectories = Math.max(8, Math.floor(pointCount / 80));
  const pointsPerTrajectory = Math.floor(pointCount / numTrajectories);

  // Randomize the curl noise parameters
  const frequency = 0.8 + rng.next() * 0.6;
  const amplitude = 0.6 + rng.next() * 0.8;

  const ode = curlNoiseODE(frequency, amplitude, seed);

  for (let t = 0; t < numTrajectories; t++) {
    // Random starting position in a sphere
    const [sx, sy, sz] = rng.unitSphere();
    const startRadius = 0.3 + rng.next() * 0.5;
    const initial: Vec3 = {
      x: sx * startRadius,
      y: sy * startRadius,
      z: sz * startRadius,
    };

    const trajectory = generateTrajectory(
      ode,
      initial,
      pointsPerTrajectory,
      0.02 + rng.next() * 0.02,
      eulerStep,
      10
    );

    points.push(...trajectory);
  }

  return normalizePoints(points);
}

/**
 * Folded Flow - Layered, ribbon-like folds in space
 * Creates interesting topology with visible surface structure
 */
export function generateFoldedFlow(options: ShapeOptions): Vec3[] {
  const { seed, pointCount } = options;
  const rng = createSeededRandom(seed);
  const points: Vec3[] = [];

  // Parameters for the folded surface
  const folds = 3 + rng.int(0, 2);
  const twist = rng.range(0.5, 2.0);
  const expansion = rng.range(0.8, 1.5);

  for (let i = 0; i < pointCount; i++) {
    const t = i / pointCount;
    const u = t * Math.PI * 2 * folds;
    const v = rng.range(-1, 1);

    // Base surface with folds
    const foldAngle = Math.sin(u * 2) * 0.5;
    const radius = 0.5 + v * 0.3 * expansion;

    let x = radius * Math.cos(u + foldAngle * v);
    let y = radius * Math.sin(u + foldAngle * v);
    let z = v * 0.8 + Math.sin(u * twist) * 0.3;

    // Add some noise for organic feel
    const noise = rng.gaussian(0, 0.05);
    x += noise;
    y += rng.gaussian(0, 0.05);
    z += rng.gaussian(0, 0.03);

    points.push({ x, y, z });
  }

  return normalizePoints(points);
}

/**
 * Vortex Bloom - Spiraling vortex structure
 * Creates a blooming, flower-like 3D spiral
 */
export function generateVortexBloom(options: ShapeOptions): Vec3[] {
  const { seed, pointCount } = options;
  const rng = createSeededRandom(seed);
  const points: Vec3[] = [];

  const petals = 3 + rng.int(0, 3);
  const spiralTightness = rng.range(1.5, 3.0);
  const bloomHeight = rng.range(0.6, 1.2);

  for (let i = 0; i < pointCount; i++) {
    const t = i / pointCount;
    const angle = t * Math.PI * 2 * spiralTightness;

    // Radius expands as we go up
    const heightT = Math.pow(t, 0.7);
    const radius = 0.1 + heightT * 0.8;

    // Petal modulation
    const petalMod = 1 + Math.sin(angle * petals + seed) * 0.3;

    const x = Math.cos(angle) * radius * petalMod;
    const y = Math.sin(angle) * radius * petalMod;
    const z = heightT * bloomHeight - bloomHeight / 2;

    // Add variation
    const jitter = 0.02 + t * 0.03;
    points.push({
      x: x + rng.gaussian(0, jitter),
      y: y + rng.gaussian(0, jitter),
      z: z + rng.gaussian(0, jitter * 0.5),
    });
  }

  return normalizePoints(points);
}

/**
 * Trefoil Knot - Mathematical knot with volume
 * Creates a classic trefoil knot with tube-like thickness
 */
export function generateTrefoilKnot(options: ShapeOptions): Vec3[] {
  const { seed, pointCount } = options;
  const rng = createSeededRandom(seed);
  const points: Vec3[] = [];

  // Parametric trefoil knot
  const thickness = 0.15 + rng.next() * 0.1;
  const twists = 3; // Trefoil has 3 crossings

  for (let i = 0; i < pointCount; i++) {
    const t = (i / pointCount) * Math.PI * 2;

    // Trefoil curve
    const cx = Math.sin(t) + 2 * Math.sin(2 * t);
    const cy = Math.cos(t) - 2 * Math.cos(2 * t);
    const cz = -Math.sin(twists * t);

    // Add thickness with random distribution around the curve
    const [dx, dy, dz] = rng.unitSphere();
    const r = rng.next() * thickness;

    points.push({
      x: cx * 0.3 + dx * r,
      y: cy * 0.3 + dy * r,
      z: cz * 0.3 + dz * r,
    });
  }

  return normalizePoints(points);
}

/**
 * Twisted Ribbon - Möbius-like twisted band
 * Creates a continuous surface with interesting topology
 */
export function generateTwistedRibbon(options: ShapeOptions): Vec3[] {
  const { seed, pointCount } = options;
  const rng = createSeededRandom(seed);
  const points: Vec3[] = [];

  const halfTwists = 1 + rng.int(0, 2); // 1 = Möbius, 2+ = more exotic
  const width = 0.25 + rng.next() * 0.15;

  for (let i = 0; i < pointCount; i++) {
    const u = (i / pointCount) * Math.PI * 2;
    const v = rng.range(-1, 1);

    // Major circle
    const R = 1;
    // Twist angle varies around the loop
    const twist = (halfTwists * u) / 2;

    // Point on the ribbon
    const x = (R + v * width * Math.cos(twist)) * Math.cos(u);
    const y = (R + v * width * Math.cos(twist)) * Math.sin(u);
    const z = v * width * Math.sin(twist);

    // Small noise for organic feel
    points.push({
      x: x + rng.gaussian(0, 0.02),
      y: y + rng.gaussian(0, 0.02),
      z: z + rng.gaussian(0, 0.02),
    });
  }

  return normalizePoints(points);
}

/**
 * Constellation Mesh - Clustered nodes with connecting structure
 * Creates a network-like appearance
 */
export function generateConstellationMesh(options: ShapeOptions): Vec3[] {
  const { seed, pointCount } = options;
  const rng = createSeededRandom(seed);
  const points: Vec3[] = [];

  // Generate cluster centers
  const numClusters = 4 + rng.int(0, 4);
  const clusters: Vec3[] = [];
  for (let i = 0; i < numClusters; i++) {
    const [x, y, z] = rng.unitSphere();
    const r = 0.4 + rng.next() * 0.4;
    clusters.push({ x: x * r, y: y * r, z: z * r });
  }

  // Points per cluster
  const clusterPoints = Math.floor((pointCount * 0.6) / numClusters);
  const connectionPoints = pointCount - clusterPoints * numClusters;

  // Generate cluster points
  for (const center of clusters) {
    const clusterSize = 0.15 + rng.next() * 0.15;
    for (let i = 0; i < clusterPoints; i++) {
      const [dx, dy, dz] = rng.unitSphere();
      const r = rng.next() * clusterSize;
      points.push({
        x: center.x + dx * r,
        y: center.y + dy * r,
        z: center.z + dz * r,
      });
    }
  }

  // Generate connection points between clusters
  for (let i = 0; i < connectionPoints; i++) {
    const c1 = rng.pick(clusters);
    const c2 = rng.pick(clusters);
    const t = rng.next();
    const jitter = 0.03;
    points.push({
      x: c1.x + (c2.x - c1.x) * t + rng.gaussian(0, jitter),
      y: c1.y + (c2.y - c1.y) * t + rng.gaussian(0, jitter),
      z: c1.z + (c2.z - c1.z) * t + rng.gaussian(0, jitter),
    });
  }

  return normalizePoints(points);
}

/**
 * Fracture Spire - Crystalline, fractured vertical structure
 * Creates angular, shard-like formations
 */
export function generateFractureSpire(options: ShapeOptions): Vec3[] {
  const { seed, pointCount } = options;
  const rng = createSeededRandom(seed);
  const points: Vec3[] = [];

  const numShards = 5 + rng.int(0, 5);
  const pointsPerShard = Math.floor(pointCount / numShards);

  for (let s = 0; s < numShards; s++) {
    // Each shard is a tapered prism
    const baseAngle = (s / numShards) * Math.PI * 2 + rng.range(-0.3, 0.3);
    const baseRadius = 0.2 + rng.next() * 0.3;
    const height = 0.5 + rng.next() * 0.8;
    const taper = 0.1 + rng.next() * 0.2;
    const tilt = rng.range(-0.3, 0.3);

    for (let i = 0; i < pointsPerShard; i++) {
      const t = i / pointsPerShard;
      const h = t * height - height / 2;

      // Radius tapers toward top
      const r = baseRadius * (1 - t * (1 - taper));

      // Angle with some variation
      const angle = baseAngle + rng.range(-0.5, 0.5);

      const x = Math.cos(angle) * r + h * Math.sin(tilt);
      const y = Math.sin(angle) * r;
      const z = h;

      // Edge noise for crystalline effect
      const edgeNoise = rng.gaussian(0, 0.03 * (1 - t));
      points.push({
        x: x + edgeNoise,
        y: y + edgeNoise,
        z: z + rng.gaussian(0, 0.01),
      });
    }
  }

  return normalizePoints(points);
}

/**
 * Continuum Fold - Smooth, continuous folding surface
 * Like fabric or spacetime curvature
 */
export function generateContinuumFold(options: ShapeOptions): Vec3[] {
  const { seed, pointCount } = options;
  const rng = createSeededRandom(seed);
  const points: Vec3[] = [];

  const foldIntensity = rng.range(0.3, 0.7);
  const foldFrequency = 2 + rng.int(0, 2);
  const layerSeparation = 0.15 + rng.next() * 0.1;

  // Multiple folded layers
  const numLayers = 3;
  const pointsPerLayer = Math.floor(pointCount / numLayers);

  for (let layer = 0; layer < numLayers; layer++) {
    const layerZ = (layer - (numLayers - 1) / 2) * layerSeparation;
    const layerPhase = layer * 0.5 + seed;

    for (let i = 0; i < pointsPerLayer; i++) {
      // Sample points on a disk
      const [dx, dy] = rng.unitDisk();
      const r = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // Fold deformation
      const fold = Math.sin(angle * foldFrequency + layerPhase) * foldIntensity * (1 - r * 0.5);

      points.push({
        x: dx * 0.8,
        y: dy * 0.8,
        z: layerZ + fold + rng.gaussian(0, 0.02),
      });
    }
  }

  return normalizePoints(points);
}
