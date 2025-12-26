// ═══════════════════════════════════════════════════════════════════
// 3D TO 2D PROJECTION HELPERS
// For rendering 3D particle shapes on 2D canvas
// ═══════════════════════════════════════════════════════════════════

import type { Vec2, Vec3 } from "./math";
import { rotateX, rotateY, rotateZ } from "./math";

export interface ProjectionConfig {
  /** Canvas/viewport width */
  width: number;
  /** Canvas/viewport height */
  height: number;
  /** Focal length for perspective (higher = less distortion) */
  focalLength?: number;
  /** Camera distance from origin */
  cameraDistance?: number;
  /** X rotation in radians */
  rotationX?: number;
  /** Y rotation in radians */
  rotationY?: number;
  /** Z rotation in radians */
  rotationZ?: number;
  /** Center offset X */
  offsetX?: number;
  /** Center offset Y */
  offsetY?: number;
  /** Scale multiplier */
  scale?: number;
}

export interface ProjectedPoint extends Vec2 {
  /** Original z depth (for depth sorting/alpha) */
  z: number;
  /** Scale factor based on depth */
  depthScale: number;
  /** Whether point is in front of camera */
  visible: boolean;
}

/**
 * Project a 3D point to 2D screen coordinates with perspective
 */
export function projectPoint(point: Vec3, config: ProjectionConfig): ProjectedPoint {
  const {
    width,
    height,
    focalLength = 400,
    cameraDistance = 5,
    rotationX = 0,
    rotationY = 0,
    rotationZ = 0,
    offsetX = 0,
    offsetY = 0,
    scale = 1,
  } = config;

  // Apply rotations
  let p = point;
  if (rotationX !== 0) p = rotateX(p, rotationX);
  if (rotationY !== 0) p = rotateY(p, rotationY);
  if (rotationZ !== 0) p = rotateZ(p, rotationZ);

  // Translate by camera distance
  const z = p.z + cameraDistance;

  // Check if behind camera
  if (z <= 0.01) {
    return { x: 0, y: 0, z: p.z, depthScale: 0, visible: false };
  }

  // Perspective projection
  const perspectiveScale = focalLength / z;
  const x = width / 2 + p.x * perspectiveScale * scale + offsetX;
  const y = height / 2 - p.y * perspectiveScale * scale + offsetY; // Y flipped for screen coords

  return {
    x,
    y,
    z: p.z,
    depthScale: perspectiveScale * scale,
    visible: true,
  };
}

/**
 * Project an array of 3D points
 */
export function projectPoints(points: Vec3[], config: ProjectionConfig): ProjectedPoint[] {
  return points.map((p) => projectPoint(p, config));
}

/**
 * Calculate alpha/opacity based on depth
 * Farther points are more transparent
 */
export function depthToAlpha(
  z: number,
  minZ: number,
  maxZ: number,
  minAlpha = 0.1,
  maxAlpha = 1.0
): number {
  if (maxZ === minZ) return maxAlpha;
  // Closer = higher alpha
  const t = 1 - (z - minZ) / (maxZ - minZ);
  return minAlpha + t * (maxAlpha - minAlpha);
}

/**
 * Calculate size based on depth
 * Farther points are smaller
 */
export function depthToSize(
  z: number,
  minZ: number,
  maxZ: number,
  minSize: number,
  maxSize: number
): number {
  if (maxZ === minZ) return maxSize;
  // Closer = larger
  const t = 1 - (z - minZ) / (maxZ - minZ);
  return minSize + t * (maxSize - minSize);
}

/**
 * Sort points by depth (back to front) for proper rendering
 */
export function sortByDepth<T extends { z: number }>(points: T[]): T[] {
  return [...points].sort((a, b) => b.z - a.z);
}

/**
 * Convert 3D points to 2D sigil-compatible format with depth info
 * Returns points in local canvas coordinates (0 to size)
 */
export interface SigilPoint {
  x: number;
  y: number;
  z: number; // normalized depth 0-1 (0 = front, 1 = back)
  alpha?: number;
}

export function toSigilPoints(
  points3D: Vec3[],
  size: number,
  options: {
    rotationX?: number;
    rotationY?: number;
    rotationZ?: number;
    scale?: number;
  } = {}
): SigilPoint[] {
  const { rotationX = 0, rotationY = 0, rotationZ = 0, scale = 0.35 } = options;

  // Apply rotations and find bounds
  const rotated: Vec3[] = points3D.map((p) => {
    let r = p;
    if (rotationX !== 0) r = rotateX(r, rotationX);
    if (rotationY !== 0) r = rotateY(r, rotationY);
    if (rotationZ !== 0) r = rotateZ(r, rotationZ);
    return r;
  });

  // Find Z bounds for normalization
  let minZ = Infinity,
    maxZ = -Infinity;
  for (const p of rotated) {
    minZ = Math.min(minZ, p.z);
    maxZ = Math.max(maxZ, p.z);
  }
  const zRange = maxZ - minZ || 1;

  const center = size / 2;
  const radius = size * scale;

  return rotated.map((p) => ({
    x: center + p.x * radius,
    y: center + p.y * radius,
    z: (p.z - minZ) / zRange, // Normalized 0-1
    alpha: depthToAlpha(p.z, minZ, maxZ, 0.3, 1.0),
  }));
}
