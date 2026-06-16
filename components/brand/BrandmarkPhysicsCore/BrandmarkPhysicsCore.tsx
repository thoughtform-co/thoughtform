"use client";

/**
 * BrandmarkPhysicsCore — luminous 3D particle core for the corridor
 * brandmark (ADR-023). Owns a `GPGPUParticleSimulation` seeded with
 * silhouette-sampled home points (with a forward dome + per-particle
 * jitter for depth), plus an additive gold-tinted `<points>` mesh
 * that draws every frame from the sim's position texture.
 *
 * Visual states:
 *
 *   - `ignite = 0` — particles wander loosely inside a sphere of dust
 *     around origin (high turbulence + weak return-to-home).
 *   - `ignite = 1` — particles snap onto the brandmark home points
 *     (low turbulence + strong return-to-home).
 *   - `0 < ignite < 1` — continuously interpolated; the cloud
 *     visibly assembles into the brandmark as the camera flies into
 *     the corridor.
 *
 * The component is shape-only — opacity / per-frame world position /
 * per-frame world scale are owned by the consumer, who wraps the
 * mesh in a `<group>` and sets `position` / `scale` from the
 * corridor's `getBrandmarkWorldPosition()` +
 * `getBrandmarkWorldHalfExtent()`.
 *
 * Sampling note: an earlier draft sampled the beveled `ExtrudeGeometry`
 * mesh with `MeshSurfaceSampler`. That gave true 3D depth but
 * distributed particles by face area across the front cap / back cap /
 * side walls — combined with additive blending, it saturated into a
 * blob. This implementation samples the 2D silhouette (matches v7
 * `BrandmarkSilhouettePoints`) and adds depth via dome + jitter
 * (matches `intelligence-artifact/SubstrateBrandmark`). The brandmark
 * silhouette is guaranteed to read.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
// `BrandmarkParticleSample` is referenced via the `useMemo` return
// type; keeping the named import makes that explicit.
import * as THREE from "three";
import { createParticleUVs, GPGPUParticleSimulation } from "@/lib/key-visual/gpgpu-simulation";
import {
  sampleBrandmarkParticles,
  type BrandmarkParticleSample,
} from "@/lib/brandmark/sampleBrandmarkParticles";
import { brandmarkCoreFragmentShader, brandmarkCoreVertexShader } from "./shaders";

/** Force coefficients tuned per ignite state. */
export interface BrandmarkPhysicsCoreForces {
  /** Pull toward home, in world units per second per unit displacement. */
  returnStrength: number;
  /** Curl-noise flow amplitude. */
  flowStrength: number;
  /** Per-particle random wander amplitude. */
  turbulence: number;
}

/** Force coefficients applied at `ignite = 0` (dispersed cloud).
 *
 *  - `returnStrength: 0.4` — gentle pull toward home; just enough to
 *    keep the cloud centred near the brandmark rather than drifting.
 *  - `flowStrength: 0.06` — slow curl wrap so dispersed particles
 *    drift rather than sit still.
 *  - `turbulence: 0.32` — large wander so the cloud reads as DUST
 *    instead of a stationary copy of the home points.
 */
const IGNITE_OFF_FORCES: BrandmarkPhysicsCoreForces = {
  returnStrength: 0.4,
  flowStrength: 0.06,
  turbulence: 0.32,
};

/** Force coefficients applied at `ignite = 1` (assembled core).
 *
 *  - `returnStrength: 6.0` — strong pull; particles close a 1-unit
 *    gap in roughly 0.17s.
 *  - `flowStrength: 0.012` — curl barely registers; the home grip
 *    dominates.
 *  - `turbulence: 0.012` — tiny breathing wobble around home so the
 *    assembled core visibly lives instead of looking frozen.
 */
const IGNITE_ON_FORCES: BrandmarkPhysicsCoreForces = {
  returnStrength: 6.0,
  flowStrength: 0.012,
  turbulence: 0.012,
};

/** Default desktop / mobile particle counts. Tuned to balance the
 *  cloud's visual weight against the surrounding substrate gimbal
 *  sphere — at higher densities (e.g. v7 silhouette's 1900) the
 *  brandmark reads heavier than the gimbal's hairline wireframe
 *  and the composition tips brandmark-forward. At ~1300 the
 *  silhouette still reads solid (thanks to the soft-halo fragment
 *  + per-particle twinkle) but the cloud sits at the same visual
 *  weight as the gimbal sphere it's nested inside. */
export const BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP = 1300;
export const BRANDMARK_PHYSICS_CORE_COUNT_MOBILE = 650;

/** Default per-particle CSS pixel size. Tuned smaller so each
 *  particle reads as a discrete speck of light with visible
 *  negative space around it — same airy stipple feel as the
 *  `CorridorSeamPixelField` (3px grid pixels) the visitor sees in
 *  `#services`, just rendered as soft additive dots instead of
 *  hard squares. With a larger pointSize the soft halos overlap
 *  and the dense cross+bar of the brandmark saturates into solid
 *  paint, breaking integration with the surrounding gimbal sphere
 *  hairlines. */
const DEFAULT_POINT_SIZE_PX = 2.8;

/** Default per-particle opacity. Tuned alongside the smaller
 *  pointSize so even the densest stroke (cross+bar) accumulates
 *  into a soft glow under additive blending instead of saturating
 *  into a hard mass. */
const DEFAULT_OPACITY = 0.78;

/** Read-only ref shape for the live-value props. `MutableRefObject`
 *  (which is what `useRef` returns) is structurally compatible — we
 *  only ever read `.current`. */
type ReadonlyRef<T> = { readonly current: T };

export interface BrandmarkPhysicsCoreForceOverrides {
  /** Force values at `ignite = 0`. Partial overrides — anything not
   *  specified falls back to `IGNITE_OFF_FORCES`. */
  off?: Partial<BrandmarkPhysicsCoreForces>;
  /** Force values at `ignite = 1`. Partial overrides — anything not
   *  specified falls back to `IGNITE_ON_FORCES`. */
  on?: Partial<BrandmarkPhysicsCoreForces>;
}

export interface BrandmarkPhysicsCoreProps {
  /** Particle count. Capped to a power-of-two texture by the sim. */
  count?: number;
  /** 0 = dispersed cloud, 1 = assembled core. The component
   *  interpolates forces between `IGNITE_OFF_FORCES` and
   *  `IGNITE_ON_FORCES`. */
  ignite?: number;
  /** Live ref for `ignite`. Read every frame inside `useFrame` so the
   *  parent can drive the value imperatively without re-rendering.
   *  Wins over the static `ignite` prop when both are provided. */
  igniteRef?: ReadonlyRef<number>;
  /** Per-particle CSS pixel size. Default 4.2. */
  pointSize?: number;
  /** Primary tint — body of the cloud. */
  color?: string;
  /** Accent tint — rim particles (high `edgeWeight`) blend toward
   *  this. Pick brighter than `color` for a "hot rim". */
  accentColor?: string;
  /** Additional alpha multiplier (0..1). */
  opacity?: number;
  /** Initial scatter radius in NORMALISED units (the cloud lives in
   *  a [-0.5, 0.5] cube). 0.5 produces an initial sphere of dust
   *  the size of the brandmark itself. */
  scatterRadius?: number;
  /** Forward dome amplitude (normalised). Default 0.18. */
  bulge?: number;
  /** Per-particle Z jitter (normalised). Default 0.06. */
  thickness?: number;
  /** When true, the GPGPU compute pass is skipped — particles render
   *  at their last-computed positions. Set when the corridor stage
   *  is off-screen so the GPU idles. */
  paused?: boolean;
  /** Live ref for `paused`. Same imperative-write pattern as
   *  `igniteRef`. Wins over the static `paused` prop when both are
   *  provided. */
  pausedRef?: ReadonlyRef<boolean>;
  /** When true, particles render at home positions (no compute, no
   *  motion). Mobile / no-WebGL2 fallback path. */
  reducedMotion?: boolean;
  /** Per-state force overrides for live tuning. */
  forces?: BrandmarkPhysicsCoreForceOverrides;
  /** Lab-only: enable depthWrite. Default false (additive on,
   *  depthWrite off — the standard "luminous" path). */
  depthWrite?: boolean;
  /** Stable seed for the deterministic scatter PRNG. */
  prngSeed?: number;
  /** Render order, forwarded to the underlying `<points>`. */
  renderOrder?: number;
}

interface SimResources {
  /** GPGPU sim — present on the dynamic path only. The
   *  reduced-motion path skips construction entirely. */
  sim: GPGPUParticleSimulation | null;
  /** Static home-position texture — present on the reduced-motion
   *  path so the render shader can sample homes directly without a
   *  compute pass. Owned by this component; disposed on unmount. */
  homeTexture: THREE.DataTexture | null;
  uvs: Float32Array;
  homes: Float32Array;
  edgeWeights: Float32Array;
  seeds: Float32Array;
  count: number;
  textureSize: number;
}

/** Mulberry32 PRNG. */
function makePrng(seed: number): () => number {
  let state = (seed | 0) >>> 0 || 0x9e3779b9;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate a uniformly-distributed cloud of dust inside a sphere of
 *  radius `scatterRadius`. Cube-root on the radius keeps the density
 *  uniform inside the sphere. */
function buildScatteredInitial(
  count: number,
  scatterRadius: number,
  random: () => number
): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const r = scatterRadius * Math.cbrt(random());
    out[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    out[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    out[i * 3 + 2] = r * Math.cos(phi);
  }
  return out;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

/** Pack home positions into a 1×1 padded RGBA Float32 DataTexture
 *  matching the GPGPU sim's textureSize convention. Used by the
 *  reduced-motion path. */
function makeHomePositionTexture(homes: Float32Array, textureSize: number): THREE.DataTexture {
  const total = textureSize * textureSize;
  const data = new Float32Array(total * 4);
  const count = Math.min(homes.length / 3, total);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const i4 = i * 4;
    data[i4] = homes[i3];
    data[i4 + 1] = homes[i3 + 1];
    data[i4 + 2] = homes[i3 + 2];
    data[i4 + 3] = 1;
  }
  const tex = new THREE.DataTexture(
    data,
    textureSize,
    textureSize,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  tex.needsUpdate = true;
  return tex;
}

export function BrandmarkPhysicsCore({
  count = BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP,
  ignite = 0,
  igniteRef,
  pointSize = DEFAULT_POINT_SIZE_PX,
  color = "#caa554",
  accentColor = "#e9c97a",
  opacity = DEFAULT_OPACITY,
  scatterRadius = 0.55,
  bulge,
  thickness,
  paused = false,
  pausedRef,
  reducedMotion = false,
  forces,
  depthWrite = false,
  prngSeed = 0xc0ffeeed,
  renderOrder = 1,
}: BrandmarkPhysicsCoreProps) {
  const renderer = useThree((s) => s.gl);
  const gl = useThree((s) => s.gl);
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // ── Sample the brandmark silhouette + depth ─────────────────
  // Synchronous on the client; returns null server-side. The
  // `sampleShape` primitive memoises by `(shapeKey, count)` so
  // re-mounts at the same options reuse the same buffers without
  // re-rasterising.
  const sample = useMemo<BrandmarkParticleSample | null>(() => {
    if (typeof document === "undefined") return null;
    const s = sampleBrandmarkParticles({ count, bulge, thickness });
    return s.count > 0 ? s : null;
  }, [count, bulge, thickness]);

  // Resources travel through state (not a ref) so the geometry memo
  // and per-frame writer both see the same simulation instance React
  // committed for this render. A ref alone would race the memo on the
  // first render with a fresh sample.
  const [resources, setResources] = useState<SimResources | null>(null);

  // ── Build sim + resources once the sample is in ─────────────
  // Two paths fork on `reducedMotion`. The dynamic path constructs a
  // GPGPU sim with scattered initial positions; the reduced-motion
  // path packs the home points into a one-shot DataTexture and binds
  // it directly so we skip the entire compute pipeline.
  useEffect(() => {
    if (!sample) return;
    let textureSize: number;
    let sim: GPGPUParticleSimulation | null = null;
    let homeTexture: THREE.DataTexture | null = null;

    if (reducedMotion) {
      // Round to power-of-two for parity with the GPGPU path's
      // texture sizing — keeps `aUV` math identical across modes.
      textureSize = Math.pow(2, Math.ceil(Math.log2(Math.ceil(Math.sqrt(sample.count)))));
      homeTexture = makeHomePositionTexture(sample.homes, textureSize);
    } else {
      const random = makePrng(prngSeed ^ 0x77665544);
      const initial = buildScatteredInitial(sample.count, scatterRadius, random);
      sim = new GPGPUParticleSimulation({
        renderer,
        particleCount: sample.count,
        initialPositions: initial,
        homePositions: sample.homes,
      });
      textureSize = sim.getTextureSize();

      // Seed the position shader with the assemble-OFF coefficients
      // so the very first compute step uses the dispersed forces (the
      // visible state at ignite = 0).
      sim.updateUniforms({
        flowStrength: IGNITE_OFF_FORCES.flowStrength,
        returnStrength: IGNITE_OFF_FORCES.returnStrength,
        turbulence: IGNITE_OFF_FORCES.turbulence,
        pointerStrength: 0,
      });
    }

    const uvs = createParticleUVs(textureSize);
    const next: SimResources = {
      sim,
      homeTexture,
      uvs,
      homes: sample.homes,
      edgeWeights: sample.edgeWeights,
      seeds: sample.seeds,
      count: sample.count,
      textureSize,
    };
    // Publish the freshly-built sim into the render tree so the
    // geometry memo + per-frame writer see it on the next render.
    // The cascading-render concern the lint rule guards against
    // doesn't apply: this only fires when the underlying SAMPLE /
    // tier changes, which is rare and bounded.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResources(next);
    return () => {
      sim?.dispose();
      homeTexture?.dispose();
      // Clear from state too, so a stale-resources reference doesn't
      // outlive the GPU buffers it owns.
      setResources((current) => (current === next ? null : current));
    };
  }, [sample, renderer, scatterRadius, prngSeed, reducedMotion]);

  // ── Build the render geometry from the sample ───────────────
  const geometry = useMemo(() => {
    if (!resources) return null;
    const { uvs, edgeWeights, seeds, count: cnt } = resources;

    const geo = new THREE.BufferGeometry();
    // `position` is required by three.js to size the draw call; it is
    // overridden every frame in the vertex shader by sampling
    // `uPositionTexture` at `aUV`, so the actual values are unused.
    const positions = new Float32Array(cnt * 3);
    const perParticleUVs = new Float32Array(cnt * 2);
    const aLuma = new Float32Array(cnt);
    const aEdgeWeight = new Float32Array(cnt);
    for (let i = 0; i < cnt; i++) {
      aLuma[i] = seeds[i];
      aEdgeWeight[i] = edgeWeights[i];
      // Particle `i` reads from texel `(i % size, floor(i / size))` —
      // identical to the layout `createParticleUVs(textureSize)`
      // writes. Slicing the first `cnt * 2` entries gives a 1:1
      // attribute array.
      perParticleUVs[i * 2] = uvs[i * 2];
      perParticleUVs[i * 2 + 1] = uvs[i * 2 + 1];
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aUV", new THREE.BufferAttribute(perParticleUVs, 2));
    geo.setAttribute("aLuma", new THREE.BufferAttribute(aLuma, 1));
    geo.setAttribute("aEdgeWeight", new THREE.BufferAttribute(aEdgeWeight, 1));

    return geo;
  }, [resources]);

  // ── Material ───────────────────────────────────────────────
  const material = useMemo(() => {
    const dpr = typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    return new THREE.ShaderMaterial({
      uniforms: {
        uPositionTexture: { value: null },
        uPointSize: { value: pointSize },
        uPixelRatio: { value: dpr },
        uColor: { value: new THREE.Color(color) },
        uAccentColor: { value: new THREE.Color(accentColor) },
        uOpacity: { value: opacity },
        uTime: { value: 0 },
      },
      vertexShader: brandmarkCoreVertexShader,
      fragmentShader: brandmarkCoreFragmentShader,
      transparent: true,
      depthWrite,
      blending: THREE.AdditiveBlending,
    });
    // `color` / `accentColor` updates are routed through the per-frame
    // uniform writes below so re-creating the material isn't necessary
    // for those — that's why they're not in the deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep refs in sync so per-frame writes hit the live material.
  useEffect(() => {
    materialRef.current = material;
  }, [material]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  // Dispose the captured geometry when it's swapped out / unmounted.
  useEffect(() => {
    if (!geometry) return;
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  // Keep the pixel ratio uniform in step with viewport changes.
  useEffect(() => {
    if (typeof window === "undefined" || !materialRef.current) return;
    const onResize = () => {
      const mat = materialRef.current;
      if (!mat) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      mat.uniforms.uPixelRatio.value = dpr;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [gl]);

  // ── Per-frame: drive forces, run sim, write material uniforms ─
  useFrame((state, delta) => {
    const mat = materialRef.current;
    if (!mat || !resources) return;

    // Reduced-motion / static path. The home texture was bound once
    // when resources were built; we just keep tint / opacity / time
    // in step here. No compute, no GPU writes from this component.
    if (reducedMotion || !resources.sim) {
      if (resources.homeTexture) {
        mat.uniforms.uPositionTexture.value = resources.homeTexture;
      }
      mat.uniforms.uColor.value.set(color);
      mat.uniforms.uAccentColor.value.set(accentColor);
      mat.uniforms.uPointSize.value = pointSize;
      mat.uniforms.uOpacity.value = opacity;
      mat.uniforms.uTime.value = state.clock.elapsedTime;
      return;
    }

    const { sim } = resources;
    // Live values: prefer the ref if provided so the consumer can
    // drive ignite / paused imperatively without re-rendering this
    // tree. Static props are the fallback for simple lab usage.
    const igniteValue = igniteRef ? igniteRef.current : ignite;
    const pausedValue = pausedRef ? pausedRef.current : paused;
    if (!pausedValue) {
      // Interpolate forces between the OFF and ON tables. The lab can
      // override either side per-mount; missing fields fall back to
      // the canonical defaults so partial overrides stay safe.
      const t = clamp01(igniteValue);
      const offForces = { ...IGNITE_OFF_FORCES, ...forces?.off };
      const onForces = { ...IGNITE_ON_FORCES, ...forces?.on };
      sim.updateUniforms({
        time: state.clock.elapsedTime,
        deltaTime: Math.min(0.05, Math.max(0.001, delta)),
        flowStrength: lerp(offForces.flowStrength, onForces.flowStrength, t),
        returnStrength: lerp(offForces.returnStrength, onForces.returnStrength, t),
        turbulence: lerp(offForces.turbulence, onForces.turbulence, t),
        pointerStrength: 0,
      });
      sim.compute();
    }

    mat.uniforms.uPositionTexture.value = sim.getPositionTexture();
    mat.uniforms.uColor.value.set(color);
    mat.uniforms.uAccentColor.value.set(accentColor);
    mat.uniforms.uPointSize.value = pointSize;
    mat.uniforms.uOpacity.value = opacity;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  if (!geometry) return null;

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      renderOrder={renderOrder}
      frustumCulled={false}
    />
  );
}
