"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BRANDMARK_VIEWBOX } from "@/components/landing/v7/BrandmarkGlyph";
import { sampleShape } from "@/lib/brandmark/sampleShape";
import {
  BRANDMARK_FULL_PATHS,
  BRANDMARK_RING_PATHS,
  BRANDMARK_SHAPE_KEYS,
} from "@/lib/brandmark/shapes";
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

/** Number of particles in the atmosphere field. Vector-first refactor:
 *  the cloud no longer paints the brandmark SHAPE — that's the
 *  vector actor's job. The cloud paints atmospheric grain around
 *  and inside the vector mark. A lower count + larger luminous
 *  points reads as constellation dust rather than as a stippled
 *  filled mark.
 *
 *  Dropped from 3200 → 800. With soft radial falloff + additive
 *  blending each point now contributes a glowing speck; lower count
 *  keeps the atmosphere airy and luminous rather than dense and
 *  papery. */
const PARTICLE_COUNT = 800;

/** Mobile atmosphere budget. Dropped from 1800 → 500 for the same
 *  reason — fewer luminous points read as airier dust. */
const PARTICLE_COUNT_MOBILE = 500;

/** Target coverage multiplier at density 1.0.
 *
 *  Vector-first model: the brandmark shape is now drawn by the
 *  vector actor, so coverage no longer needs to "fill" the
 *  brandmark silhouette. A low coverage value (~0.35) keeps the
 *  atmosphere sparse — the particles read as scattered sparks
 *  along the mark and inside the rect, not as a filled silhouette. */
const COVERAGE_AT_FULL_DENSITY = 0.35;

/** Coverage shaping exponent. Lower densities shrink the per-point
 *  glow faster than visibleCount drops, so the substrate-window
 *  atmosphere (density ~0.15) reads as pinpoint sparks rather than
 *  a confetti shower. */
const COVERAGE_FALLOFF_EXP = 1.6;

/** Floor and ceiling on the auto-computed point size. Larger floor
 *  + larger ceiling than the previous papercraft model — each grain
 *  is now a luminous speck with a soft outer falloff, and the
 *  radial alpha math needs more pixels to read as a glow rather
 *  than a single bright dot. */
const POINT_SIZE_MIN_PX = 6;
const POINT_SIZE_MAX_PX = 18;

/** Threshold below which the mesh is hidden via `visible = false`.
 *  Saves the GPU a draw call when the transform has faded out
 *  (hero / post-orbit bookend) but hasn't been reset to hidden yet. */
const VISIBILITY_EPSILON = 0.005;

/** Pad a sampled ring home buffer up to the full particle count so
 *  every index in the full sample has a paired ring position. Any
 *  trailing entries (when the stratified sampler hit grid exhaustion
 *  before reaching `count`) get the origin (0, 0); at full ring
 *  blend those particles collapse to the brandmark centre, which is
 *  visually invisible behind the dense ring of paired particles. */
function padRingBuffer(buffer: Float32Array, count: number): Float32Array {
  const expectedLength = count * 2;
  if (buffer.length >= expectedLength) {
    return buffer.length === expectedLength ? buffer : buffer.slice(0, expectedLength);
  }
  const padded = new Float32Array(expectedLength);
  padded.set(buffer);
  return padded;
}

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

  // Sample the FULL brandmark first (this is the canonical sample
  // every other consumer reads). `sample.count` is the authoritative
  // particle count — the ring sample is requested at the same count
  // so the per-particle rank lines up index-by-index for the shader's
  // mix(aHome, aHomeRing, uShapeBlend) lerp (ADR-014).
  const sample = useMemo(
    () =>
      sampleShape({
        shapeKey: BRANDMARK_SHAPE_KEYS.full,
        paths: BRANDMARK_FULL_PATHS,
        viewBox: VIEWBOX,
        count: particleCount,
      }),
    [particleCount]
  );

  // Sample the ring-only topology at the SAME particle count. The
  // ring sample uses a different shape key so `sampleShape` returns
  // a separate cached buffer. Per-particle pairing (full[i] ↔ ring[i])
  // is index-based — particles that already sit on the outer arc
  // barely move during the morph; particles in the cross + bar flow
  // outward to find a ring position.
  const ringSample = useMemo(
    () =>
      sampleShape({
        shapeKey: BRANDMARK_SHAPE_KEYS.ring,
        paths: BRANDMARK_RING_PATHS,
        viewBox: VIEWBOX,
        count: sample.count,
      }),
    [sample.count]
  );

  const { geometry, material } = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    // We don't actually use position; the shader builds gl_Position
    // from aHome + uniforms. But Three.js requires a `position`
    // attribute to register the buffer for drawing.
    geom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(sample.count * 3), 3));
    geom.setAttribute("aHome", new THREE.BufferAttribute(sample.home, 2));
    // Ring-only home buffer. May be shorter than `sample.count` if
    // the stratified sampler hit grid exhaustion early — pad with
    // zeros (origin) for any missing entries so the buffer length
    // matches. Those particles read as "collapsed to centre" at
    // full ring blend, which is visually indistinguishable from
    // density 0 once the rank clip kicks in (ringSample.count
    // ≤ sample.count is fine; rank clip respects sample.count).
    const ringHomePadded = padRingBuffer(ringSample.home, sample.count);
    geom.setAttribute("aHomeRing", new THREE.BufferAttribute(ringHomePadded, 2));
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
      // Additive blending makes each soft radial point read as a
      // luminous speck — overlapping particles brighten rather than
      // averaging, so dense regions glow as a halo and sparse
      // regions read as discrete sparks. Combined with the soft
      // fragment falloff this is what removes the papery aesthetic.
      blending: THREE.AdditiveBlending,
      uniforms: {
        uViewport: { value: initialViewport },
        uCenter: { value: new THREE.Vector2() },
        uHalfSize: { value: new THREE.Vector2() },
        uOpacity: { value: 0 },
        uVisibleCount: { value: 0 },
        uDispersion: { value: 0 },
        uTime: { value: 0 },
        uRotationY: { value: 0 },
        uShapeBlend: { value: 0 },
        uPointSize: { value: 3 },
        uPixelRatio: { value: initialPixelRatio },
        uTint: { value: new THREE.Color(...DEFAULT_TINT) },
      },
    });
    return { geometry: geom, material: mat };
  }, [sample, ringSample]);

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
    // ADR-019: while the global silhouette mesh is painting the
    // brandmark shape, damp the atmosphere's dispersion bump so the
    // silhouette reads cleanly. The atmosphere's role across the
    // sigil → miss transit was "motion exhaust around the moving
    // vector"; now the silhouette IS the visible mark, so a strong
    // exhaust scatter would visually compete with the cover-in.
    // We scale dispersion by (1 - silhouetteMorph * DAMP) so it's
    // intact at sigil rest (silhouetteMorph = 0) and reduced to a
    // soft halo by the time the silhouette is fully formed.
    const SILHOUETTE_DISPERSION_DAMP = 0.7;
    const dispersionScale = 1 - transform.silhouetteMorph * SILHOUETTE_DISPERSION_DAMP;
    u.uDispersion.value = transform.dispersion * dispersionScale;
    u.uRotationY.value = transform.rotationY;
    u.uShapeBlend.value = transform.shapeBlend;
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
