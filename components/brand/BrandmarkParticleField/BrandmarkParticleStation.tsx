"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BRANDMARK_FILLED_PATHS, BRANDMARK_VIEWBOX } from "@/components/landing/v7/BrandmarkGlyph";
import { sampleShape } from "@/lib/brandmark/sampleShape";
import { useBrandmarkJourneyStore, DEFAULT_TINT } from "@/lib/stores/brandmarkJourneyStore";
import { brandmarkVertexShader, brandmarkFragmentShader } from "./shaders";

/**
 * BrandmarkParticleStation — THE single `<points>` mesh that paints
 * the brandmark cloud for the v7 landing.
 *
 * ADR-013: previously this component mounted once PER STATION (sigil,
 * miss, substrate, rail, orbit) and each instance read its own
 * snapshot from `brandmarkParticleStore`. The refactor collapses
 * that to ONE instance that reads the single `BrandmarkTransform`
 * from `brandmarkJourneyStore` every frame. The transform owns the
 * full continuous evolution of the cloud:
 *
 *   - `rect` → `uCenter` + `uHalfSize`
 *   - `opacity` → `uOpacity` (per Principle 2, only changes at hero /
 *     post-orbit bookends; always 1 mid-journey)
 *   - `density` → `uVisibleCount` (rank clip)
 *   - `dispersion` → `uDispersion` (particle wander amplitude)
 *   - `rotationY` → `uRotationY` (2D squash that approximates 3D
 *     Y-axis rotation, ADR-013 Q1)
 *
 * No per-station snapshots. No HARD SWAPs. One painter, one cloud,
 * continuous evolution.
 */

/** Brandmark viewBox: `0 0 430.99 436`. Parsed from
 *  `BRANDMARK_VIEWBOX` so the source of truth stays in
 *  `BrandmarkGlyph.tsx`. */
const VIEWBOX = parseViewBox(BRANDMARK_VIEWBOX);

function parseViewBox(s: string): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const [x, y, w, h] = s.split(/\s+/).map(Number);
  return { x, y, width: w, height: h };
}

/** Number of particles in the cloud. At full density (`density === 1`)
 *  the brandmark reads as a filled mark; at lower densities the rank
 *  clip in the shader masks particles above the threshold so the
 *  field gets airier without rebuilding any buffer.
 *
 *  Bumped from 2000 → 3200 alongside the stratified sampler. The
 *  combination of higher count + stratified placement closes the
 *  visible inter-particle gaps at the largest rect (substrate
 *  ~280px+ on desktop) so the cloud reads as a truly filled mark and
 *  not a stipple. Smaller rects (rail ~56px) are already over-
 *  saturated. */
const PARTICLE_COUNT = 3200;

/** Mobile particle budget — fewer points to stay fillrate-cheap on
 *  iPhone-12-class hardware. Same stratified sampler runs at the lower
 *  count; the auto-scaling point-size formula in the shader compensates
 *  by drawing slightly larger points so coverage stays solid. */
const PARTICLE_COUNT_MOBILE = 1800;

/** Target ink-coverage multiplier at density 1.0.
 *
 *  Coverage = (visibleCount × pointSize²) / filledScreenArea.
 *
 *  A value of 1.0 means the points exactly tile the filled area with
 *  no overlap; values above 1.0 oversize the points so neighbours
 *  overlap and gaps between sampled positions close up. 2.0 gives a
 *  solid filled silhouette at the largest rect that reads as the
 *  SVG glyph from any reasonable viewing distance. */
const COVERAGE_AT_FULL_DENSITY = 2.0;

/** Coverage shaping exponent. Coverage scales as
 *  `density ^ COVERAGE_FALLOFF_EXP`, so reducing density shrinks
 *  individual points faster than the visible count drops. Effect:
 *  lower-density passes read as atmospheric scatter rather than
 *  chunky confetti. Higher exponent → sparser-looking lower
 *  densities. */
const COVERAGE_FALLOFF_EXP = 1.6;

/** Floor and ceiling on the auto-computed point size. The floor keeps
 *  very small rects (rail ~56px) from going sub-pixel; the ceiling
 *  keeps very large rects (substrate ~280px+, mid-transit scatter
 *  rects up to a few hundred pixels) from drawing blocky chunks. */
const POINT_SIZE_MIN_PX = 1.6;
const POINT_SIZE_MAX_PX = 6;

/** Threshold below which the mesh is hidden via `visible = false`.
 *  Saves the GPU a draw call when the transform has faded out
 *  (hero / post-orbit bookend) but hasn't been reset to hidden yet. */
const VISIBILITY_EPSILON = 0.005;

export function BrandmarkParticleStation() {
  const meshRef = useRef<THREE.Points>(null);
  const { size, viewport } = useThree();

  // Pick a particle budget based on viewport width. Sampled once at
  // mount because re-sampling on every resize would thrash. Mobile
  // is the lower budget; desktop gets the full count.
  const particleCount = useMemo(() => {
    if (typeof window === "undefined") return PARTICLE_COUNT;
    return window.innerWidth <= 960 ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT;
  }, []);

  const sample = useMemo(
    () =>
      sampleShape({
        shapeKey: "brandmark",
        paths: BRANDMARK_FILLED_PATHS,
        viewBox: VIEWBOX,
        count: particleCount,
      }),
    [particleCount]
  );

  const { geometry, material } = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    // We don't actually use position; the shader builds gl_Position
    // from aHome + uniforms. But Three.js requires a `position`
    // attribute to register the buffer for drawing.
    geom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(sample.count * 3), 3));
    geom.setAttribute("aHome", new THREE.BufferAttribute(sample.home, 2));
    geom.setAttribute("aSeed", new THREE.BufferAttribute(sample.seed, 2));
    geom.setAttribute("aRank", new THREE.BufferAttribute(sample.rank, 1));

    const initialViewport =
      typeof window === "undefined"
        ? new THREE.Vector2(1, 1)
        : new THREE.Vector2(window.innerWidth, window.innerHeight);
    const initialPixelRatio =
      typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    const mat = new THREE.ShaderMaterial({
      vertexShader: brandmarkVertexShader,
      fragmentShader: brandmarkFragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uViewport: { value: initialViewport },
        uCenter: { value: new THREE.Vector2() },
        uHalfSize: { value: new THREE.Vector2() },
        uOpacity: { value: 0 },
        uVisibleCount: { value: 0 },
        uDispersion: { value: 0 },
        uTime: { value: 0 },
        uRotationY: { value: 0 },
        uPointSize: { value: 3 },
        uPixelRatio: { value: initialPixelRatio },
        uTint: { value: new THREE.Color(...DEFAULT_TINT) },
      },
    });
    return { geometry: geom, material: mat };
  }, [sample]);

  // Sync viewport size when the R3F canvas resizes. R3F's `size`
  // reflects the canvas's current dimensions, which match
  // `window.inner*` for the fixed full-viewport canvas wrapper.
  useEffect(() => {
    material.uniforms.uViewport.value.set(size.width, size.height);
  }, [material, size.width, size.height]);

  // Imperative per-frame update — reads the journey store's current
  // transform without subscribing to it, so this component does not
  // re-render when the journey hook writes new transforms. Only
  // uniforms change.
  useFrame((state) => {
    const transform = useBrandmarkJourneyStore.getState().transform;
    const mesh = meshRef.current;
    if (!mesh) return;

    if (!transform.visible || transform.opacity <= VISIBILITY_EPSILON) {
      if (mesh.visible) mesh.visible = false;
      return;
    }
    if (!mesh.visible) mesh.visible = true;

    const u = material.uniforms;
    const visibleCount = Math.max(1, transform.density * sample.count);
    u.uCenter.value.set(
      transform.rect.left + transform.rect.width / 2,
      transform.rect.top + transform.rect.height / 2
    );
    u.uHalfSize.value.set(transform.rect.width / 2, transform.rect.height / 2);
    u.uOpacity.value = transform.opacity;
    u.uVisibleCount.value = visibleCount;
    u.uDispersion.value = transform.dispersion;
    u.uRotationY.value = transform.rotationY;
    u.uTime.value = state.clock.elapsedTime;

    // === Auto-scale point size for density-aware coverage ===
    //
    // The brandmark's filled paths cover `fillRatio` of the viewBox
    // (measured by `sampleShape`). Inside the transform's rect the
    // visible filled area on screen is `rectW × rectH × fillRatio`.
    //
    // Target ink coverage scales with density to keep the visual
    // language consistent across rect sizes:
    //
    //   coverage = COVERAGE_AT_FULL_DENSITY × density ^ COVERAGE_FALLOFF_EXP
    //
    //   ≈ 2.0   at density 1.0  → solid filled silhouette
    //   ≈ 0.16  at density 0.22 → atmospheric grain
    //
    // Derive point size from coverage:
    //
    //   coverage   = (visibleCount × pointSize²) / filledArea
    //   pointSize  = sqrt(coverage × filledArea / visibleCount)
    //
    // Clamped to [POINT_SIZE_MIN_PX, POINT_SIZE_MAX_PX] so very
    // small rects don't go sub-pixel and very large transit rects
    // don't draw blocky chunks.
    const filledArea = transform.rect.width * transform.rect.height * sample.fillRatio;
    const coverage =
      COVERAGE_AT_FULL_DENSITY * Math.pow(Math.max(0.001, transform.density), COVERAGE_FALLOFF_EXP);
    const autoSize = Math.sqrt((coverage * filledArea) / visibleCount);
    u.uPointSize.value = Math.max(POINT_SIZE_MIN_PX, Math.min(POINT_SIZE_MAX_PX, autoSize));
  });

  // Cleanup on unmount — drop GPU buffers explicitly. R3F does this
  // for primitive children too but we're constructing them by hand.
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  // `viewport` is unused but referenced so its dependency tracking is
  // present; the underlying camera projection is identity (we project
  // directly in the vertex shader).
  void viewport;

  return <points ref={meshRef} geometry={geometry} material={material} frustumCulled={false} />;
}
