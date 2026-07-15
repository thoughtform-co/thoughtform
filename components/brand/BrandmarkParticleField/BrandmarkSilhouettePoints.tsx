"use client";

/**
 * BrandmarkSilhouettePoints — the silhouette point cloud that paints
 * the v7 brandmark from Diagnostic onward (ADR-019).
 *
 * Mounts INSIDE the global `BrandmarkParticleCanvas`, alongside
 * `BrandmarkParticleStation` (atmosphere). Reads the journey
 * transform from `brandmarkJourneyStore` every frame and renders a
 * stratified point cloud sampled from the canonical brandmark paths
 * at the transform's rect.
 *
 * Two channels gate the visibility:
 *
 *   - `transform.silhouetteMorph` — 0 at sigil (Thoughtform rest);
 *     ramps 0 → 1 across the first 30% of the sigil → miss transit;
 *     stays at 1 from miss onward. Drives the cover-in ramp inside
 *     the vertex shader so the silhouette emerges from the vector
 *     mark's centre as the visitor leaves Thoughtform.
 *   - `transform.substrateMorph` — non-zero only inside the
 *     intelligence-layer substrate window. While > 0 the
 *     intelligence-layer canvas's own `SubstrateMorphPoints` mesh is
 *     painting the brandmark → sphere morph at the same screen
 *     position. We multiply our opacity by `(1 - substrateMorph)` so
 *     this global mesh fades out cleanly as substrate engages, then
 *     resumes paint as the substrate window exits.
 *
 * Pattern adapted from `SubstrateMorphPoints` (silhouette sampling)
 * + `BrandmarkParticleStation` (pixel-space orthographic projection).
 * The global canvas is orthographic with identity projection; the
 * vertex shader does pixel-to-NDC conversion against `uViewport`.
 *
 * Singleton: mounted exactly once inside `BrandmarkParticleCanvas`.
 * SSR-safe: the sampler returns `count = 0` server-side, so the
 * component renders nothing until the first client mount re-samples.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BRANDMARK_VIEWBOX } from "@/components/landing/v7/BrandmarkGlyph";
import { sampleShape } from "@/lib/brandmark/sampleShape";
import { BRANDMARK_FULL_PATHS, BRANDMARK_SHAPE_KEYS } from "@/lib/brandmark/shapes";
import { useBrandmarkJourneyStore, DEFAULT_TINT } from "@/lib/stores/brandmarkJourneyStore";
import { brandmarkSilhouetteVertexShader, brandmarkSilhouetteFragmentShader } from "./shaders";

/** Brandmark viewBox parsed from `BRANDMARK_VIEWBOX`. Same parser as
 *  `BrandmarkParticleStation`. */
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

/** Desktop point count. Matches the substrate morph cloud's density
 *  (1900) so the silhouette reads as a solid filled mark — the same
 *  fidelity the user sees when the cloud lands at the substrate dock.
 *  The brandmark is the visible artefact for ~70% of the page scroll
 *  in this model; we hold density consistent end-to-end. */
const PARTICLE_COUNT = 1900;

/** Mobile point count. Lower than desktop to keep the per-frame
 *  vertex shader cost in budget on phone GPUs — at ~700 points the
 *  silhouette still reads as a solid mark thanks to the additive-
 *  blend soft-dot fragment shader, but the GPU load drops to a
 *  comfortable margin under 16ms / frame on mid-tier devices. */
const PARTICLE_COUNT_MOBILE = 700;

/** Base point size in CSS pixels. Multiplied by `devicePixelRatio`
 *  inside the shader. Tuned visually against the substrate morph
 *  cloud (which uses 4.2 at its sphere scale) — at the silhouette's
 *  smaller average rect (sigil ~144px, miss ~200px) a slightly
 *  larger base size keeps the dot grid filled without gaps at
 *  retina densities. */
const POINT_SIZE_PX = 4.6;

/** Visibility cutoff. The mesh hides entirely when the effective
 *  opacity falls below this — saves a draw call when the silhouette
 *  has fully faded out (substrate handoff, hero bookend). */
const VISIBILITY_EPSILON = 0.005;

/** Pad a sampled home buffer up to the full particle count so the
 *  attribute length matches the requested point count regardless of
 *  sampler grid-exhaustion. Identical pattern to the ring-buffer
 *  padding in `BrandmarkParticleStation`. */
function padHomeBuffer(buffer: Float32Array, count: number): Float32Array {
  const expectedLength = count * 2;
  if (buffer.length >= expectedLength) {
    return buffer.length === expectedLength ? buffer : buffer.slice(0, expectedLength);
  }
  const padded = new Float32Array(expectedLength);
  padded.set(buffer);
  return padded;
}

export function BrandmarkSilhouettePoints() {
  const meshRef = useRef<THREE.Points>(null);
  const { size } = useThree();

  const particleCount = useMemo(() => {
    if (typeof window === "undefined") return PARTICLE_COUNT;
    return window.innerWidth <= 960 ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT;
  }, []);

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

  const { geometry, material } = useMemo(() => {
    if (sample.count === 0) {
      return { geometry: null, material: null };
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(sample.count * 3), 3));
    geom.setAttribute(
      "aHome",
      new THREE.BufferAttribute(padHomeBuffer(sample.home, sample.count), 2)
    );
    geom.setAttribute("aSeed", new THREE.BufferAttribute(sample.seed, 2));

    const initialViewport =
      typeof window === "undefined"
        ? new THREE.Vector2(1, 1)
        : new THREE.Vector2(window.innerWidth, window.innerHeight);
    const initialPixelRatio =
      typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    const mat = new THREE.ShaderMaterial({
      vertexShader: brandmarkSilhouetteVertexShader,
      fragmentShader: brandmarkSilhouetteFragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      // Additive blending — overlapping soft dots brighten rather
      // than averaging, so the silhouette reads as a luminous gold
      // mark consistent with the atmosphere field's visual language.
      blending: THREE.AdditiveBlending,
      uniforms: {
        uViewport: { value: initialViewport },
        uCenter: { value: new THREE.Vector2() },
        uHalfSize: { value: new THREE.Vector2() },
        uOpacity: { value: 0 },
        uMorph: { value: 0 },
        uTime: { value: 0 },
        uPointSize: { value: POINT_SIZE_PX },
        uPixelRatio: { value: initialPixelRatio },
        uSuppress: { value: 1 },
        uTint: { value: new THREE.Color(...DEFAULT_TINT) },
      },
    });
    return { geometry: geom, material: mat };
  }, [sample]);

  useEffect(() => {
    if (!material) return;
    material.uniforms.uViewport.value.set(size.width, size.height);
  }, [material, size.width, size.height]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh || !material) return;
    const transform = useBrandmarkJourneyStore.getState().transform;

    // Suppression channel (substrate handoff). The intelligence-layer
    // canvas's own `SubstrateMorphPoints` mesh paints the brandmark
    // → sphere morph inside the substrate window, at the same screen
    // anchor (`.ilayer__brandmark-anchor`) this mesh is parked over.
    // Cut this mesh OFF the moment substrate engages so we don't
    // double-paint the silhouette — the swap is invisible because at
    // `substrateMorph > 0.001` the intelligence mesh is painting
    // essentially the same brandmark shape we were. The binary cut
    // mirrors the existing dock-glyph substrate cut (ADR-017).
    const SUBSTRATE_HANDOFF_EPSILON = 0.001;
    const suppress = transform.substrateMorph > SUBSTRATE_HANDOFF_EPSILON ? 0 : 1;
    const effectiveOpacity = transform.opacity * transform.silhouetteMorph * suppress;

    if (!transform.visible || effectiveOpacity <= VISIBILITY_EPSILON) {
      if (mesh.visible) mesh.visible = false;
      return;
    }
    if (!mesh.visible) mesh.visible = true;

    const u = material.uniforms;
    u.uCenter.value.set(
      transform.rect.left + transform.rect.width / 2,
      transform.rect.top + transform.rect.height / 2
    );
    u.uHalfSize.value.set(transform.rect.width / 2, transform.rect.height / 2);
    u.uOpacity.value = transform.opacity;
    u.uMorph.value = transform.silhouetteMorph;
    u.uSuppress.value = suppress;
    u.uTime.value = state.clock.elapsedTime;
    // Sync uPixelRatio to the actual renderer DPR every frame
    // (mobile quality pass, 2026-07-15). The initial value was pinned
    // once at mount from `min(devicePixelRatio, 2)` which read 2 on
    // 3× phones while the canvas renders at `dpr={[1, 1.75]}`. Reading
    // `state.viewport.dpr` matches the shader math to the framebuffer
    // so silhouette points don't bloat on mobile.
    u.uPixelRatio.value = state.viewport.dpr;
  });

  useEffect(() => {
    return () => {
      geometry?.dispose();
      material?.dispose();
    };
  }, [geometry, material]);

  if (!geometry || !material) return null;
  return <points ref={meshRef} geometry={geometry} material={material} frustumCulled={false} />;
}
