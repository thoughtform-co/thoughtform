/**
 * sampleBrandmarkPixels — rasterize the canonical brandmark SVG into a 2D
 * canvas at a known screen rect, then emit world-space particle positions
 * for every filled pixel.
 *
 * Why this exists (ADR-023 2026-06-25 hybrid revision): the corridor mark
 * transitions from a DOM SVG rest state into a particle field that flies
 * inward to the volumetric wireframe brandmark. For the SVG → particles
 * swap to be invisible, the particles must spawn at world coordinates
 * that reproject back to the SVG's exact CSS pixel positions on screen.
 *
 * Procedure:
 *   1. Build a hidden <canvas> sized to the SVG's live screen rect.
 *   2. Draw `BRANDMARK_FULL_PATHS` viewBox-fit to that canvas (same
 *      paths the SVG glyph renders, so coverage is identical).
 *   3. Iterate filled pixels at `pixelStride`. For each, convert from
 *      CSS pixel coordinates → NDC → world via `camera.unproject()` on
 *      the `worldZ` plane (the brandmark group's world position).
 *   4. Return a tightly packed `Float32Array` of world positions,
 *      sub-sampled so the count matches the consumer's particle budget.
 *
 * Output coordinates are WORLD-space — the consumer is expected to
 * transform into the brandmark group's local space (or just bind them
 * to a sim that lives in world space).
 *
 * Synchronous (canvas rasterise + camera unproject). Returns count = 0
 * during SSR or when there is no canvas context.
 */

import * as THREE from "three";
import { BRANDMARK_FULL_PATHS } from "./shapes";

/** Brandmark viewBox — copied from the canonical SVG. Kept inline so this
 *  module has no UI dependency, matching `sampleBrandmarkParticles.ts`. */
const BRANDMARK_VIEWBOX = { x: 0, y: 0, width: 430.99, height: 436 } as const;

export interface RasterizeBrandmarkOpts {
  /** Live screen-space rect of the SVG brandmark, in CSS pixels. The
   *  rasterise canvas is sized to this rect; world positions are computed
   *  so they reproject back to the SAME pixel rect. */
  rect: { left: number; top: number; width: number; height: number };
  /** R3F camera at the swap frame. World-projection target. */
  camera: THREE.Camera;
  /** World Z-plane the particles seed onto (= brandmark group position
   *  world Z). The unproject ray is extended to this Z. */
  worldZ: number;
  /** Viewport size, CSS pixels. */
  viewport: { width: number; height: number };
  /** Maximum particles to emit. The pixel stride auto-adjusts so the
   *  returned count is ≤ maxCount. Must be > 0. */
  maxCount: number;
  /** Per-pixel rasterise stride. Default `auto` — pick a stride so the
   *  total inside-pixel count tracks `maxCount` (with headroom). */
  pixelStride?: number | "auto";
  /** Alpha threshold (0..255) above which a pixel counts as "inside the
   *  brandmark". Default 16 (matches the SVG's filled-path opacity at
   *  near-zero anti-aliasing). */
  alphaThreshold?: number;
}

export interface RasterizedBrandmarkPixels {
  /** Float32Array of `count * 3` world-space positions. */
  positions: Float32Array;
  /** Number of particles emitted. ≤ `maxCount`. */
  count: number;
}

/** Empty result returned on SSR or when no canvas context is available. */
const EMPTY_RESULT: RasterizedBrandmarkPixels = {
  positions: new Float32Array(0),
  count: 0,
};

/** Scratch — keep allocation off the hot path. */
const ndc = new THREE.Vector3();

export function rasterizeBrandmarkToWorldPositions(
  opts: RasterizeBrandmarkOpts
): RasterizedBrandmarkPixels {
  if (typeof document === "undefined") return EMPTY_RESULT;
  if (opts.maxCount <= 0) return EMPTY_RESULT;
  if (opts.rect.width <= 1 || opts.rect.height <= 1) return EMPTY_RESULT;

  const alphaThreshold = opts.alphaThreshold ?? 16;

  // Rasterise at a modest fixed canvas size — large enough for crisp
  // path coverage, small enough that the per-pixel walk is fast. We're
  // counting inside-pixels, not rendering presentation-quality glyphs.
  const RASTER_DIM = 256;
  const canvas = document.createElement("canvas");
  canvas.width = RASTER_DIM;
  canvas.height = RASTER_DIM;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return EMPTY_RESULT;

  // Fit the SVG viewBox into the raster canvas, preserving the brandmark's
  // intrinsic aspect ratio. The brandmark is square-ish (430.99 × 436),
  // so this is essentially a uniform fit.
  const vbAspect = BRANDMARK_VIEWBOX.width / BRANDMARK_VIEWBOX.height;
  const rasterAspect = canvas.width / canvas.height;
  let drawW: number;
  let drawH: number;
  if (vbAspect > rasterAspect) {
    drawW = canvas.width;
    drawH = canvas.width / vbAspect;
  } else {
    drawH = canvas.height;
    drawW = canvas.height * vbAspect;
  }
  const drawX = (canvas.width - drawW) / 2;
  const drawY = (canvas.height - drawH) / 2;

  // Map viewBox coordinates → raster pixel coordinates. The SVG path's
  // `d` strings are in viewBox space, so we translate + scale before
  // drawing.
  ctx.fillStyle = "#fff";
  ctx.translate(drawX, drawY);
  ctx.scale(drawW / BRANDMARK_VIEWBOX.width, drawH / BRANDMARK_VIEWBOX.height);
  ctx.translate(-BRANDMARK_VIEWBOX.x, -BRANDMARK_VIEWBOX.y);
  for (const d of BRANDMARK_FULL_PATHS) {
    ctx.fill(new Path2D(d));
  }

  // Sample inside-pixels. Decide a stride so the candidate-pixel count
  // tracks `maxCount` (with headroom for partial coverage).
  const stride =
    opts.pixelStride === undefined || opts.pixelStride === "auto"
      ? Math.max(1, Math.floor(Math.sqrt((drawW * drawH) / Math.max(1, opts.maxCount * 1.4))))
      : Math.max(1, Math.floor(opts.pixelStride));

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;

  // First pass: find filled raster pixels and convert them to CSS pixel
  // coordinates on the SVG's screen rect. We store the raw NDC X/Y here
  // so the unproject pass only needs to compute world Z.
  const cssX: number[] = [];
  const cssY: number[] = [];
  // Raster → SVG screen rect: raster coords map back to viewBox via the
  // inverse of (translate + scale + translate) above, then map viewBox
  // to the screen rect.
  const rastToCssX = opts.rect.width / drawW;
  const rastToCssY = opts.rect.height / drawH;
  for (let y = 0; y < canvas.height; y += stride) {
    for (let x = 0; x < canvas.width; x += stride) {
      const idx = (y * canvas.width + x) * 4 + 3; // alpha channel
      if (data[idx] < alphaThreshold) continue;
      // Map raster pixel → SVG screen rect CSS pixel. (Raster (drawX, drawY)
      // is the top-left of the brandmark; raster (drawX+drawW, drawY+drawH)
      // is the bottom-right.)
      const sx = opts.rect.left + (x - drawX) * rastToCssX;
      const sy = opts.rect.top + (y - drawY) * rastToCssY;
      cssX.push(sx);
      cssY.push(sy);
    }
  }

  // Cap to maxCount (uniform sub-sample). With auto stride we usually land
  // close to maxCount already; if we're over, drop every Nth.
  let inside = cssX.length;
  if (inside === 0) return EMPTY_RESULT;
  let keep: Int32Array;
  if (inside <= opts.maxCount) {
    keep = new Int32Array(inside);
    for (let i = 0; i < inside; i++) keep[i] = i;
  } else {
    keep = new Int32Array(opts.maxCount);
    // Spaced sub-sample — preserves spatial uniformity.
    for (let i = 0; i < opts.maxCount; i++) {
      keep[i] = Math.floor((i * inside) / opts.maxCount);
    }
    inside = opts.maxCount;
  }

  // Second pass: unproject each CSS pixel to a world point on the
  // worldZ plane. We use the standard NDC → ray approach: pick a near
  // and a far point on the ray, then linearly interpolate to the worldZ
  // plane. (camera.unproject reads (x, y, z) in NDC where z = -1 is near
  // and z = 1 is far — and Three.js handles perspective correctly.)
  const positions = new Float32Array(inside * 3);
  const halfVw = opts.viewport.width * 0.5;
  const halfVh = opts.viewport.height * 0.5;
  for (let i = 0; i < inside; i++) {
    const j = keep[i];
    const sx = cssX[j];
    const sy = cssY[j];
    // CSS pixel → NDC (Y inverted: CSS Y is down, NDC Y is up).
    const ndcX = sx / halfVw - 1;
    const ndcY = -(sy / halfVh - 1);

    // Cast a ray from the camera through the NDC point and intersect
    // the worldZ plane. The unproject trick uses two points along the
    // ray (z=0 near, z=1 far in NDC) and linearly interpolates so the
    // resulting world Z equals `worldZ`.
    ndc.set(ndcX, ndcY, 0);
    ndc.unproject(opts.camera);
    const nearX = ndc.x;
    const nearY = ndc.y;
    const nearZ = ndc.z;
    ndc.set(ndcX, ndcY, 1);
    ndc.unproject(opts.camera);
    const farX = ndc.x;
    const farY = ndc.y;
    const farZ = ndc.z;
    const dz = farZ - nearZ;
    // Avoid division by zero when the camera plane is parallel to worldZ
    // (degenerate — won't happen for the corridor's forward-facing camera).
    const t = Math.abs(dz) < 1e-6 ? 0 : (opts.worldZ - nearZ) / dz;
    positions[i * 3] = nearX + (farX - nearX) * t;
    positions[i * 3 + 1] = nearY + (farY - nearY) * t;
    positions[i * 3 + 2] = opts.worldZ;
  }

  return { positions, count: inside };
}

/**
 * Convert an array of world-space positions to the local space of a
 * THREE.Object3D (the brandmark group). Used to feed `seedFromPositions`
 * into the physics core, which expects local-space coordinates because
 * the shader transforms via `modelViewMatrix * pos`.
 *
 * Per-vector via Object3D.worldToLocal (handles arbitrary rotation /
 * scale, not just the corridor's identity-rotation / uniform-scale path).
 */
export function worldPositionsToLocal(
  positions: Float32Array,
  count: number,
  group: THREE.Object3D
): Float32Array {
  const out = new Float32Array(count * 3);
  const v = new THREE.Vector3();
  group.updateWorldMatrix(true, false);
  for (let i = 0; i < count; i++) {
    v.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    group.worldToLocal(v);
    out[i * 3] = v.x;
    out[i * 3 + 1] = v.y;
    out[i * 3 + 2] = v.z;
  }
  return out;
}
