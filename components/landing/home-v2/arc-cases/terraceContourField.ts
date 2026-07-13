/** Deterministic terrain-shroud contour builder for the Arc Cases aperture. */

import * as THREE from "three";

import { terrainGroundY } from "../DepthGatewayScene/substrateTerrain";
import type { TerraceViewportLayout } from "./terraceLayout";

export const TERRACE_CONTOUR_BANDS = 18;
export const TERRACE_CONTOUR_SAMPLES = 176;
export const TERRACE_CONTOUR_POINT_COUNT = TERRACE_CONTOUR_BANDS * TERRACE_CONTOUR_SAMPLES;

export interface TerraceContourField {
  basePositions: Float32Array;
  targetPositions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  delays: Float32Array;
  masks: Float32Array;
  /** Unrotated aperture-relative X/Y pairs, retained for deterministic QA. */
  localPositions: Float32Array;
  /** 0 = aperture rim, 1 = grounded outer fold. Useful for tests/labs. */
  bands: Float32Array;
  count: number;
}

/** Strict interior test; a point exactly on the chamfer perimeter is clear. */
export function isInsideTerraceAperture(
  localX: number,
  localY: number,
  layout: TerraceViewportLayout
): boolean {
  const x = Math.abs(localX);
  const y = Math.abs(localY);
  const halfW = layout.screenWidth / 2;
  const halfH = layout.screenHeight / 2;
  const chamfer = layout.apertureChamfer;
  // BufferAttribute stores Float32 values; keep a small edge tolerance so
  // a perimeter point rounded just inside the analytic boundary stays clear.
  const edgeEpsilon = 1e-4;
  if (x >= halfW - edgeEpsilon || y >= halfH - edgeEpsilon) return false;
  if (x <= halfW - chamfer || y <= halfH - chamfer) return true;
  return x + y < halfW + halfH - chamfer - edgeEpsilon;
}

function hash(n: number): number {
  const s = Math.sin(n) * 43758.5453;
  return s - Math.floor(s);
}

function quintic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** A clockwise chamfered rectangle whose local origin is the aperture centre. */
function chamferedPerimeter(halfWidth: number, halfHeight: number, chamfer: number) {
  return [
    [-halfWidth + chamfer, halfHeight],
    [halfWidth - chamfer, halfHeight],
    [halfWidth, halfHeight - chamfer],
    [halfWidth, -halfHeight + chamfer],
    [halfWidth - chamfer, -halfHeight],
    [-halfWidth + chamfer, -halfHeight],
    [-halfWidth, -halfHeight + chamfer],
    [-halfWidth, halfHeight - chamfer],
  ] as const;
}

function perimeterPoint(
  vertices: readonly (readonly [number, number])[],
  fraction: number
): readonly [number, number] {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    lengths.push(length);
    total += length;
  }
  let remaining = fraction * total;
  for (let i = 0; i < vertices.length; i++) {
    if (remaining <= lengths[i] || i === vertices.length - 1) {
      const a = vertices[i];
      const b = vertices[(i + 1) % vertices.length];
      const t = lengths[i] <= 0 ? 0 : remaining / lengths[i];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    remaining -= lengths[i];
  }
  return vertices[0];
}

/**
 * Builds contour-only points: there are deliberately no points inside the
 * aperture. Base positions are grounded terrain; targets form a thin raised
 * rim nearest the display and recline back into exact terrain on the outer
 * bands. The shader owns the reversible arm/disarm morph.
 */
export function buildTerraceContourField(layout: TerraceViewportLayout): TerraceContourField {
  const positions: number[] = [];
  const targets: number[] = [];
  const colors: number[] = [];
  const sizes: number[] = [];
  const delays: number[] = [];
  const masks: number[] = [];
  const localPositions: number[] = [];
  const bands: number[] = [];
  const dawn = new THREE.Color("#ebe3d6");
  const dawnSoft = new THREE.Color("#d6cdb5");
  const gold = new THREE.Color("#caa554");
  const cos = Math.cos(layout.screenYaw);
  const sin = Math.sin(layout.screenYaw);

  for (let band = 0; band < TERRACE_CONTOUR_BANDS; band++) {
    const bandT = TERRACE_CONTOUR_BANDS <= 1 ? 0 : band / (TERRACE_CONTOUR_BANDS - 1);
    const foldT = quintic(bandT);
    const halfWidth = layout.screenWidth / 2 + layout.sideApron * bandT;
    const halfHeight = layout.screenHeight / 2 + layout.topOvershoot * bandT;
    // Expand the diagonal by both apron axes so every outer chamfer stays
    // outside the original opening instead of clipping its corners.
    const chamfer = Math.min(
      halfWidth * 0.45,
      layout.apertureChamfer + (layout.sideApron + layout.topOvershoot) * bandT
    );
    const perimeter = chamferedPerimeter(halfWidth, halfHeight, chamfer);
    // The inner rim sits just in front of the content plane, then every
    // outer band reclines away from the camera and folds into the ground.
    // This keeps the aperture clear while making its boundary undeniably
    // terrain-owned instead of reading as a card placed on top of dots.
    const localZ = 0.12 - layout.rearFold * foldT;

    for (let sample = 0; sample < TERRACE_CONTOUR_SAMPLES; sample++) {
      const sampleT = sample / TERRACE_CONTOUR_SAMPLES;
      const [localX, localY] = perimeterPoint(perimeter, sampleT);
      const seed = band * 991.13 + sample * 17.91;
      const h = hash(seed);
      const x = layout.screenX + localX * cos - localZ * sin;
      const z = layout.screenZ + localX * sin + localZ * cos;
      const groundY = terrainGroundY(x, z);

      // The inner rim rises around the top/sides; outer bands become a
      // reclined ground fold. `max` guarantees a target never tunnels under
      // the existing heightfield and the last band grounds exactly.
      const topWeight = localY > 0 ? 1 : 0.48;
      const raisedY =
        layout.screenY + localY + topWeight * layout.topOvershoot * (1 - bandT) * 0.28;
      const targetY = band === TERRACE_CONTOUR_BANDS - 1 ? groundY : Math.max(groundY, raisedY);

      positions.push(x, groundY, z);
      targets.push(x, targetY, z);
      localPositions.push(localX, localY);
      const color = h > 0.986 && bandT > 0.34 ? gold : h > 0.56 ? dawn : dawnSoft;
      colors.push(color.r, color.g, color.b);
      sizes.push(0.66 + (1 - bandT) * 0.48 + h * 0.34);
      delays.push(0.08 + bandT * 0.32 + h * 0.035);
      masks.push(1);
      bands.push(bandT);
    }
  }

  return {
    basePositions: new Float32Array(positions),
    targetPositions: new Float32Array(targets),
    colors: new Float32Array(colors),
    sizes: new Float32Array(sizes),
    delays: new Float32Array(delays),
    masks: new Float32Array(masks),
    localPositions: new Float32Array(localPositions),
    bands: new Float32Array(bands),
    count: positions.length / 3,
  };
}
