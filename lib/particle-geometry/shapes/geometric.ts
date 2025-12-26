// ═══════════════════════════════════════════════════════════════════
// GEOMETRIC SHAPE GENERATORS
// Basic geometric shapes with 3D depth
// ═══════════════════════════════════════════════════════════════════

import type { Vec3 } from "../math";
import { normalizePoints } from "../math";
import { createSeededRandom } from "../rng";
import type { ShapeOptions } from "./types";

/**
 * Ring - Simple circular ring with thickness
 */
export function generateRing(options: ShapeOptions): Vec3[] {
  const { seed, pointCount } = options;
  const rng = createSeededRandom(seed);
  const points: Vec3[] = [];

  const thickness = 0.08;

  for (let i = 0; i < pointCount; i++) {
    const angle = rng.next() * Math.PI * 2;
    const r = 1 + rng.gaussian(0, thickness);
    const z = rng.gaussian(0, thickness * 0.5);

    points.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
      z,
    });
  }

  return normalizePoints(points);
}

/**
 * Torus - 3D donut shape
 */
export function generateTorus(options: ShapeOptions): Vec3[] {
  const { seed, pointCount } = options;
  const rng = createSeededRandom(seed);
  const points: Vec3[] = [];

  const majorRadius = 0.7;
  const minorRadius = 0.3;

  for (let i = 0; i < pointCount; i++) {
    const theta = rng.next() * Math.PI * 2; // Around the ring
    const phi = rng.next() * Math.PI * 2; // Around the tube

    const x = (majorRadius + minorRadius * Math.cos(phi)) * Math.cos(theta);
    const y = (majorRadius + minorRadius * Math.cos(phi)) * Math.sin(theta);
    const z = minorRadius * Math.sin(phi);

    points.push({ x, y, z });
  }

  return normalizePoints(points);
}

/**
 * Gateway - Concentric dotted rings (portal-like)
 */
export function generateGateway(options: ShapeOptions): Vec3[] {
  const { seed, pointCount } = options;
  const rng = createSeededRandom(seed);
  const points: Vec3[] = [];

  const rings = [
    { radius: 0.95, dots: 24, z: 0 },
    { radius: 0.75, dots: 18, z: 0.05 },
    { radius: 0.55, dots: 12, z: 0.1 },
  ];

  const totalDots = rings.reduce((sum, r) => sum + r.dots, 0);
  const pointsPerDot = Math.floor(pointCount / totalDots);

  for (const ring of rings) {
    for (let i = 0; i < ring.dots; i++) {
      const angle = (i / ring.dots) * Math.PI * 2;
      const dotRadius = 0.04;

      // Create small cluster for each "dot"
      for (let j = 0; j < pointsPerDot; j++) {
        const [dx, dy] = rng.unitDisk();
        points.push({
          x: Math.cos(angle) * ring.radius + dx * dotRadius,
          y: Math.sin(angle) * ring.radius + dy * dotRadius,
          z: ring.z + rng.gaussian(0, 0.02),
        });
      }
    }
  }

  return normalizePoints(points);
}

/**
 * Square Grid - Organized grid pattern with slight randomness
 */
export function generateSquareGrid(options: ShapeOptions): Vec3[] {
  const { seed, pointCount } = options;
  const rng = createSeededRandom(seed);
  const points: Vec3[] = [];

  const cellCount = Math.ceil(Math.sqrt(pointCount));
  const cellSize = 2 / cellCount;

  for (let i = 0; i < cellCount && points.length < pointCount; i++) {
    for (let j = 0; j < cellCount && points.length < pointCount; j++) {
      const x = -1 + i * cellSize + cellSize / 2;
      const y = -1 + j * cellSize + cellSize / 2;

      points.push({
        x: x + rng.gaussian(0, cellSize * 0.15),
        y: y + rng.gaussian(0, cellSize * 0.15),
        z: rng.gaussian(0, 0.05),
      });
    }
  }

  return normalizePoints(points);
}

/**
 * Triangle - Triangular outline with thickness
 */
export function generateTriangle(options: ShapeOptions): Vec3[] {
  const { seed, pointCount } = options;
  const rng = createSeededRandom(seed);
  const points: Vec3[] = [];

  // Triangle vertices
  const vertices = [
    { x: 0, y: 1 },
    { x: -Math.cos(Math.PI / 6), y: -Math.sin(Math.PI / 6) },
    { x: Math.cos(Math.PI / 6), y: -Math.sin(Math.PI / 6) },
  ];

  const thickness = 0.08;
  const pointsPerEdge = Math.floor(pointCount / 3);

  for (let edge = 0; edge < 3; edge++) {
    const start = vertices[edge];
    const end = vertices[(edge + 1) % 3];

    for (let i = 0; i < pointsPerEdge; i++) {
      const t = i / pointsPerEdge;
      points.push({
        x: start.x + (end.x - start.x) * t + rng.gaussian(0, thickness),
        y: start.y + (end.y - start.y) * t + rng.gaussian(0, thickness),
        z: rng.gaussian(0, thickness * 0.3),
      });
    }
  }

  return normalizePoints(points);
}

/**
 * Diamond - Diamond/rhombus shape
 */
export function generateDiamond(options: ShapeOptions): Vec3[] {
  const { seed, pointCount } = options;
  const rng = createSeededRandom(seed);
  const points: Vec3[] = [];

  const vertices = [
    { x: 0, y: 1 },
    { x: 0.9, y: 0 },
    { x: 0, y: -1 },
    { x: -0.9, y: 0 },
  ];

  const thickness = 0.08;
  const pointsPerEdge = Math.floor(pointCount / 4);

  for (let edge = 0; edge < 4; edge++) {
    const start = vertices[edge];
    const end = vertices[(edge + 1) % 4];

    for (let i = 0; i < pointsPerEdge; i++) {
      const t = i / pointsPerEdge;
      points.push({
        x: start.x + (end.x - start.x) * t + rng.gaussian(0, thickness),
        y: start.y + (end.y - start.y) * t + rng.gaussian(0, thickness),
        z: rng.gaussian(0, thickness * 0.3),
      });
    }
  }

  return normalizePoints(points);
}

/**
 * Hexagon - Hexagonal outline
 */
export function generateHexagon(options: ShapeOptions): Vec3[] {
  const { seed, pointCount } = options;
  const rng = createSeededRandom(seed);
  const points: Vec3[] = [];

  const vertices: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 2;
    vertices.push({
      x: Math.cos(angle),
      y: Math.sin(angle),
    });
  }

  const thickness = 0.08;
  const pointsPerEdge = Math.floor(pointCount / 6);

  for (let edge = 0; edge < 6; edge++) {
    const start = vertices[edge];
    const end = vertices[(edge + 1) % 6];

    for (let i = 0; i < pointsPerEdge; i++) {
      const t = i / pointsPerEdge;
      points.push({
        x: start.x + (end.x - start.x) * t + rng.gaussian(0, thickness),
        y: start.y + (end.y - start.y) * t + rng.gaussian(0, thickness),
        z: rng.gaussian(0, thickness * 0.3),
      });
    }
  }

  return normalizePoints(points);
}

/**
 * Cross - Plus-shaped cross
 */
export function generateCross(options: ShapeOptions): Vec3[] {
  const { seed, pointCount } = options;
  const rng = createSeededRandom(seed);
  const points: Vec3[] = [];

  const length = 1;
  const thickness = 0.15;
  const halfPoints = Math.floor(pointCount / 2);

  // Horizontal bar
  for (let i = 0; i < halfPoints; i++) {
    const t = i / halfPoints;
    points.push({
      x: -length + t * length * 2,
      y: rng.gaussian(0, thickness),
      z: rng.gaussian(0, thickness * 0.3),
    });
  }

  // Vertical bar
  for (let i = 0; i < halfPoints; i++) {
    const t = i / halfPoints;
    points.push({
      x: rng.gaussian(0, thickness),
      y: -length + t * length * 2,
      z: rng.gaussian(0, thickness * 0.3),
    });
  }

  return normalizePoints(points);
}

/**
 * Abstract Blob - Organic wavy blob shape
 */
export function generateAbstractBlob(options: ShapeOptions): Vec3[] {
  const { seed, pointCount } = options;
  const rng = createSeededRandom(seed);
  const points: Vec3[] = [];

  for (let i = 0; i < pointCount; i++) {
    const angle = rng.next() * Math.PI * 2;

    // Create wavy radius using multiple sine waves
    const wave1 = Math.sin(angle * 3) * 0.2;
    const wave2 = Math.sin(angle * 5 + seed) * 0.15;
    const wave3 = Math.sin(angle * 7 + seed * 2) * 0.1;
    const radiusVariation = 1 + wave1 + wave2 + wave3;
    const r = radiusVariation * (0.6 + rng.next() * 0.4);

    points.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
      z: rng.gaussian(0, 0.1),
    });
  }

  return normalizePoints(points);
}

/**
 * Brandmark - Thoughtform brandmark approximation
 */
export function generateBrandmark(options: ShapeOptions): Vec3[] {
  const { seed, pointCount } = options;
  const rng = createSeededRandom(seed);
  const points: Vec3[] = [];

  // Outer ring
  const ringPoints = Math.floor(pointCount * 0.5);
  for (let i = 0; i < ringPoints; i++) {
    const angle = rng.next() * Math.PI * 2;
    points.push({
      x: Math.cos(angle) * 0.9 + rng.gaussian(0, 0.04),
      y: Math.sin(angle) * 0.9 + rng.gaussian(0, 0.04),
      z: rng.gaussian(0, 0.03),
    });
  }

  // Diagonal vector
  const diagonalPoints = Math.floor(pointCount * 0.3);
  for (let i = 0; i < diagonalPoints; i++) {
    const t = i / diagonalPoints;
    points.push({
      x: -0.5 + t * 0.9 + rng.gaussian(0, 0.03),
      y: 0.6 - t * 1.1 + rng.gaussian(0, 0.03),
      z: rng.gaussian(0, 0.02),
    });
  }

  // Horizontal bar
  const barPoints = pointCount - ringPoints - diagonalPoints;
  for (let i = 0; i < barPoints; i++) {
    const t = i / barPoints;
    points.push({
      x: -0.8 + t * 1.6 + rng.gaussian(0, 0.02),
      y: rng.gaussian(0, 0.03),
      z: rng.gaussian(0, 0.02),
    });
  }

  return normalizePoints(points);
}

/**
 * Manifold Slice - Organic flowing shape with multiple lobes
 */
export function generateManifoldSlice(options: ShapeOptions): Vec3[] {
  const { seed, pointCount } = options;
  const rng = createSeededRandom(seed);
  const points: Vec3[] = [];

  for (let i = 0; i < pointCount; i++) {
    const t = i / pointCount;
    const angle = t * Math.PI * 2;

    // Create flowing, organic radius
    const flow1 = Math.sin(angle * 2 + seed) * 0.3;
    const flow2 = Math.cos(angle * 3 + seed * 0.5) * 0.2;
    const flow3 = Math.sin(angle * 5 + seed * 1.5) * 0.1;
    const radiusMod = 1 + flow1 + flow2 + flow3;
    const r = radiusMod * 0.6 + rng.gaussian(0, 0.05);

    // Add slight drift perpendicular to radius
    const drift = Math.sin(angle * 4 + seed * 2) * 0.1;
    const perpAngle = angle + Math.PI / 2;

    points.push({
      x: Math.cos(angle) * r + Math.cos(perpAngle) * drift,
      y: Math.sin(angle) * r + Math.sin(perpAngle) * drift,
      z: Math.sin(angle * 3) * 0.15 + rng.gaussian(0, 0.03),
    });
  }

  return normalizePoints(points);
}
