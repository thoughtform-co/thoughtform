"use client";

import * as THREE from "three";
import { BRANDMARK_FILLED_PATHS, BRANDMARK_VIEWBOX } from "@/components/landing/v7/BrandmarkGlyph";
import { sampleShape } from "@/lib/brandmark/sampleShape";
import {
  BRAND_PARTICLE_COLOR,
  BRAND_PARTICLE_SIZE_PX,
  BRAND_SCALE,
  PARTICLE_COUNT,
  PARTICLE_COUNT_MOBILE,
} from "./intelligenceLayerGeom";

/**
 * brandmarkParticles — pure-code helper that samples the canonical
 * brandmark into a 3D `BufferGeometry` for the ringfield scene.
 *
 * SAME data source as the global `BrandmarkParticleStation` (per
 * ADR-011): `BRANDMARK_FILLED_PATHS` + `BRANDMARK_VIEWBOX`, sampled
 * via the shared `sampleShape` utility. The brandmark cloud in the
 * ringfield IS the same artifact you've seen everywhere on the site —
 * just inhabiting 3D world space inside the section's `<Canvas>` so
 * the parent group can rotate it (Y-axis) and the rings can extrude
 * from it (Z translation).
 *
 * Returns:
 *   - `geometry`: BufferGeometry with `position` (Float32Array of
 *     `count * 3` xyz triples; particles laid flat in the local XY
 *     plane at z=0)
 *   - `count`: actual particle count after stratified sampling (may
 *     be slightly less than the requested count on grid exhaustion)
 *   - `material`: PointsMaterial in `--gold`, fixed pixel size, no
 *     size attenuation, additive blending. The default GL_POINT
 *     fragment shape is a square — matches the global station's
 *     "solid square" fragment shader exactly, so the boundary HARD
 *     SWAP from global painter to ringfield is visually invisible.
 *
 * The geometry is sized in scene units via `BRAND_SCALE` so the
 * cloud fits cleanly inside the encode ring's interior. Particles
 * sit on the local z=0 plane; the parent group's `rotation.y`
 * rotates them in 3D space (at edge-on the cloud reads as a thin
 * vertical line of particles — the brandmark turning).
 */

const VIEWBOX = parseViewBox(BRANDMARK_VIEWBOX);

function parseViewBox(s: string): { x: number; y: number; width: number; height: number } {
  const [x, y, w, h] = s.split(/\s+/).map(Number);
  return { x, y, width: w, height: h };
}

export interface BrandmarkParticles {
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  count: number;
}

/**
 * Build a brandmark particle cloud sized for the section's R3F
 * scene. Particle count auto-selects desktop / mobile based on the
 * current viewport at construction time; the cloud is NOT re-sampled
 * on resize (the existing brandmark canvas works the same way — the
 * underlying sampling is design-resolution and screen size scales the
 * point cloud's apparent density via the camera projection).
 */
export function buildBrandmarkParticles(): BrandmarkParticles {
  const targetCount =
    typeof window !== "undefined" && window.innerWidth <= 960
      ? PARTICLE_COUNT_MOBILE
      : PARTICLE_COUNT;

  const sample = sampleShape({
    shapeKey: "brandmark",
    paths: BRANDMARK_FILLED_PATHS,
    viewBox: VIEWBOX,
    count: targetCount,
  });

  const geometry = new THREE.BufferGeometry();
  // Lift the 2D viewBox-normalised samples (`[-0.5, 0.5]`) into a 3D
  // BufferGeometry. We invert Y so the brandmark's top stays at the
  // top of the scene (sampleShape uses canvas/viewBox Y-down).
  const positions = new Float32Array(sample.count * 3);
  for (let i = 0; i < sample.count; i++) {
    const x = sample.home[i * 2];
    const y = sample.home[i * 2 + 1];
    positions[i * 3] = x * BRAND_SCALE * 2;
    positions[i * 3 + 1] = -y * BRAND_SCALE * 2; // invert Y for scene up
    positions[i * 3 + 2] = 0;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  // Solid square fragments via the default GL_POINT shape, fixed
  // pixel size (no attenuation). Matches the global station's
  // visual: hard-edged dots in `--gold`, no anti-aliasing, no radial
  // falloff. `transparent: false` keeps the fragments crisp; we only
  // set `transparent: true` if we ever need alpha blending, which we
  // don't — opacity is reserved for ambient breathing on autonomous
  // decoration only (per the v5 design philosophy).
  const material = new THREE.PointsMaterial({
    color: BRAND_PARTICLE_COLOR,
    size: BRAND_PARTICLE_SIZE_PX,
    sizeAttenuation: false,
    transparent: false,
    depthWrite: false,
  });

  return { geometry, material, count: sample.count };
}
