"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BRANDMARK_FILLED_PATHS, BRANDMARK_VIEWBOX } from "@/components/landing/v7/BrandmarkGlyph";
import { sampleShape } from "@/lib/brandmark/sampleShape";
import {
  DEFAULT_TINT,
  useBrandmarkParticleStore,
  type StationKind,
} from "@/lib/stores/brandmarkParticleStore";
import { brandmarkVertexShader, brandmarkFragmentShader } from "./shaders";

/**
 * BrandmarkParticleStation — one `<points>` mesh that paints the
 * brandmark for a single station (sigil / miss / substrate / rail /
 * orbit).
 *
 * The mesh is mounted once per station that this canvas owns. Each
 * frame it reads its own `StationSnapshot` from the Zustand store
 * (imperatively, via `getState()` to avoid re-rendering the React
 * tree at 60Hz) and writes the relevant uniforms onto its
 * `ShaderMaterial`. When the snapshot is `null`, the mesh hides
 * itself.
 *
 * Buffer geometry is shared by `useMemo` across mounts — sampling the
 * brandmark fill is O(viewBox area) which is fine for a one-off but
 * expensive enough that we don't want it running every render. The
 * `sampleShape` helper memoises by `(shapeKey, count)` so multiple
 * stations of the same shape share the same sampled buffer.
 *
 * The v7 landing wires all five stations via `BrandmarkSystem`. The
 * dev preview at `/test/brandmark-particle` typically wires the
 * substrate station alone (the largest dock rect, used for tuning).
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

/** Number of particles per station. At full density (`density === 1`)
 *  the brandmark reads as a filled mark; at lower densities the rank
 *  clip in the shader masks particles above the threshold so the
 *  field gets airier without rebuilding any buffer.
 *
 *  Bumped from 2000 → 3200 alongside the stratified sampler. The
 *  combination of higher count + stratified placement closes the
 *  visible inter-particle gaps at the largest dock rect (sigil,
 *  ~232 px) so the cloud reads as a truly filled mark and not a
 *  stipple. Smaller rects (rail ~56 px) are already over-saturated. */
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
 *  solid filled silhouette at the sigil dock that reads as the SVG
 *  glyph from any reasonable viewing distance. Tune in
 *  `/test/brandmark-particle` and update ADR-011 in the same PR. */
const COVERAGE_AT_FULL_DENSITY = 2.0;

/** Coverage shaping exponent. Coverage scales as
 *  `density ^ COVERAGE_FALLOFF_EXP`, so reducing density shrinks
 *  individual points faster than the visible count drops. Effect:
 *  the transit dispersion bump (density lerps + sin-bump) reads as
 *  atmospheric scatter rather than chunky confetti. Higher exponent
 *  → sparser-looking lower densities. (Pre-ADR-012 the substrate
 *  station ran at density 0.22 and used this falloff to read as the
 *  asking-gap backdrop — same math, different visual destination.) */
const COVERAGE_FALLOFF_EXP = 1.6;

/** Floor and ceiling on the auto-computed point size. The floor keeps
 *  very small rects (rail ~56px) from going sub-pixel; the ceiling
 *  keeps very large rects (substrate dock at ~280px, mid-transit
 *  scatter rects up to a few hundred pixels) from drawing blocky
 *  chunks. */
const POINT_SIZE_MIN_PX = 1.6;
const POINT_SIZE_MAX_PX = 6;

/** Threshold below which the mesh is hidden via `visible = false`.
 *  Saves the GPU a draw call when the station snapshot has faded
 *  out but hasn't been cleared from the store yet. */
const VISIBILITY_EPSILON = 0.005;

export interface BrandmarkParticleStationProps {
  stationKind: StationKind;
}

export function BrandmarkParticleStation({ stationKind }: BrandmarkParticleStationProps) {
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
        // Recomputed every frame from rect dims + visible count
        // (see useFrame below). The shader still receives a single
        // scalar; we just decide its value on the CPU per frame
        // because the rect can change with scroll and JS-side math
        // is cheaper than packing more uniforms.
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

  // Imperative per-frame update — reads the store's current snapshot
  // without subscribing to it, so this component does not re-render
  // when the choreography writes new snapshots. Only uniforms change.
  useFrame((state) => {
    const station = useBrandmarkParticleStore.getState().stations[stationKind];
    const mesh = meshRef.current;
    if (!mesh) return;

    if (!station || station.opacity <= VISIBILITY_EPSILON) {
      if (mesh.visible) mesh.visible = false;
      return;
    }
    if (!mesh.visible) mesh.visible = true;

    const u = material.uniforms;
    const visibleCount = Math.max(1, station.density * sample.count);
    u.uCenter.value.set(
      station.rect.left + station.rect.width / 2,
      station.rect.top + station.rect.height / 2
    );
    u.uHalfSize.value.set(station.rect.width / 2, station.rect.height / 2);
    u.uOpacity.value = station.opacity;
    u.uVisibleCount.value = visibleCount;
    u.uDispersion.value = station.dispersion;
    u.uTime.value = state.clock.elapsedTime;
    u.uTint.value.setRGB(station.tint[0], station.tint[1], station.tint[2]);

    // === Auto-scale point size for density-aware coverage ===
    //
    // The brandmark's filled paths cover `fillRatio` of the viewBox
    // (measured by `sampleShape`). Inside the station's rect the
    // visible filled area on screen is `rectW × rectH × fillRatio`.
    //
    // Target ink coverage scales with density to keep the visual
    // language consistent across tiers:
    //
    //   coverage = COVERAGE_AT_FULL_DENSITY × density ^ COVERAGE_FALLOFF_EXP
    //
    //   ≈ 2.0   at density 1.0  → solid filled silhouette (every
    //                              parked dock — sigil/miss/substrate/
    //                              rail/orbit — reads as the SVG)
    //   ≈ 0.16  at density 0.22 → atmospheric grain (transit
    //                              dispersion bump — reads as
    //                              dispersed atoms, NOT confetti)
    //
    // Derive point size from coverage:
    //
    //   coverage   = (visibleCount × pointSize²) / filledArea
    //   pointSize  = sqrt(coverage × filledArea / visibleCount)
    //
    // Clamped to [POINT_SIZE_MIN_PX, POINT_SIZE_MAX_PX] so rails
    // don't go sub-pixel and large transit rects don't draw blocky
    // chunks.
    const filledArea = station.rect.width * station.rect.height * sample.fillRatio;
    const coverage =
      COVERAGE_AT_FULL_DENSITY * Math.pow(Math.max(0.001, station.density), COVERAGE_FALLOFF_EXP);
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
