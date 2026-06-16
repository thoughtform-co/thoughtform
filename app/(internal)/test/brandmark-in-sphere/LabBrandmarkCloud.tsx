"use client";

/**
 * LabBrandmarkCloud — fully tunable static brandmark point cloud
 * for `/test/brandmark-in-sphere`.
 *
 * Samples the brandmark silhouette via `sampleShape` (full or ring
 * topology) into a `<points>` mesh whose sprite style + density +
 * size + colour + motion + brandmark<->sphere morph are driven by
 * uniforms. Lab-only — production uses the dedicated painters in
 * `components/brand/BrandmarkParticleField/` and
 * `components/brand/BrandmarkPhysicsCore/`. This is a sandbox for
 * comparing alternative looks before promoting one of them.
 *
 * Coordinate convention:
 *   - `aHome` is in normalised `[-0.5, 0.5]` (Y is flipped from the
 *     SVG to read upright in 3D), with optional dome+jitter Z when
 *     `depth3D` is on.
 *   - `aSphereHome` is the per-particle paired Fibonacci-sphere home
 *     so the `sphereMorph` slider lerps the cloud into a unit-radius
 *     sphere without re-sorting.
 *   - The wrapping `<group>` is scaled by `2 * worldHalfExtent` so
 *     the cloud lands at world scale — same convention as
 *     `BrandmarkPhysicsCoreActor`.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import {
  sampleBrandmarkParticles,
  type BrandmarkParticleSample,
} from "@/lib/brandmark/sampleBrandmarkParticles";
import { sampleShape } from "@/lib/brandmark/sampleShape";
import {
  BRANDMARK_FULL_PATHS,
  BRANDMARK_RING_PATHS,
  BRANDMARK_SHAPE_KEYS,
} from "@/lib/brandmark/shapes";
import { labCloudFragmentShader, labCloudVertexShader } from "./labCloudShaders";

/** Brandmark viewBox — duplicated here (not exported from
 *  `shapes.ts`) so this module has no UI dependency. Keep in sync
 *  with `BrandmarkGlyph.BRANDMARK_VIEWBOX`. */
const BRANDMARK_VIEWBOX = { x: 0, y: 0, width: 430.99, height: 436 } as const;

export type LabSpriteStyle =
  | "soft-dot"
  | "hard-square"
  | "hollow-ring"
  | "star"
  | "plus-cross"
  | "filled-disc";

export const SPRITE_STYLES: readonly { id: LabSpriteStyle; label: string }[] = [
  { id: "soft-dot", label: "Soft dot" },
  { id: "hard-square", label: "Hard square" },
  { id: "hollow-ring", label: "Hollow ring" },
  { id: "star", label: "4-point star" },
  { id: "plus-cross", label: "Plus cross" },
  { id: "filled-disc", label: "Filled disc" },
];

const STYLE_TO_CODE: Record<LabSpriteStyle, number> = {
  "soft-dot": 0,
  "hard-square": 1,
  "hollow-ring": 2,
  star: 3,
  "plus-cross": 4,
  "filled-disc": 5,
};

export type LabTopology = "full" | "ring";
export type LabBlendMode = "additive" | "normal";

export interface LabBrandmarkCloudProps {
  /** Particle count — clamped to a sensible range by the panel. */
  count: number;
  /** Visible fraction (0..1) — drives the rank-clip density dial. */
  density: number;
  /** Per-particle CSS pixel size (multiplied by DPR in shader). */
  pointSize: number;
  /** Body tint (hex). */
  color: string;
  /** Accent tint applied to the highest-rank particles. */
  accentColor: string;
  /** Material alpha multiplier. */
  opacity: number;
  /** Sprite shape inside each point square. */
  style: LabSpriteStyle;
  /** Brandmark topology — `full` mark or just the outer `ring`. */
  topology: LabTopology;
  /** When true, samples include `dome + jitter` Z so the cloud has
   *  thickness; when false, all particles sit at z = 0 (flat). */
  depth3D: boolean;
  /** 0 -> brandmark, 1 -> Fibonacci sphere. */
  sphereMorph: number;
  /** Per-particle alpha twinkle amount (0..1). */
  twinkle: number;
  /** Per-particle position-drift amount (0..1). */
  wander: number;
  /** Slow rotation rate around Y, rad/s (applied to the wrapper). */
  spinRate: number;
  /** Material blend — additive ("luminous", production default) vs
   *  normal ("paper", reads as opaque dots). */
  blend: LabBlendMode;
}

/** Build a `count`-length Fibonacci sphere homes buffer. Indexed
 *  identically to the brandmark sample so per-particle pairing is
 *  trivial. Radius 0.5 keeps the sphere envelope flush with the
 *  brandmark's `[-0.5, 0.5]` extent. */
function buildFibonacciSphereHomes(count: number, radius = 0.5): Float32Array {
  const out = new Float32Array(count * 3);
  if (count <= 0) return out;
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(1, count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;
    out[i * 3] = Math.cos(theta) * r * radius;
    out[i * 3 + 1] = y * radius;
    out[i * 3 + 2] = Math.sin(theta) * r * radius;
  }
  return out;
}

interface SampleBundle {
  count: number;
  /** Brandmark home XYZ (Y flipped for upright read; Z 0 unless depth3D). */
  home: Float32Array;
  /** Paired Fibonacci sphere home. */
  sphere: Float32Array;
  /** Per-particle seed XY. */
  seed: Float32Array;
  /** Per-particle rank in `[0, count)`. */
  rank: Float32Array;
}

/** Pull a brandmark sample (with optional 3D depth) and pair it
 *  with a Fibonacci sphere of the same length. Memo-keyed at the
 *  call site by `(count, topology, depth3D)`. */
function buildSampleBundle(count: number, topology: LabTopology, depth3D: boolean): SampleBundle {
  const paths = topology === "full" ? BRANDMARK_FULL_PATHS : BRANDMARK_RING_PATHS;
  const shapeKey = topology === "full" ? BRANDMARK_SHAPE_KEYS.full : BRANDMARK_SHAPE_KEYS.ring;

  if (depth3D && topology === "full") {
    // sampleBrandmarkParticles returns 3D homes (Y flipped, Z = dome+jitter).
    const sample: BrandmarkParticleSample = sampleBrandmarkParticles({ count });
    const cnt = sample.count;
    const seed = new Float32Array(cnt * 2);
    const rank = new Float32Array(cnt);
    for (let i = 0; i < cnt; i++) {
      // Reconstruct a stable 2-component seed from the 1-component
      // phase the helper returns.
      seed[i * 2] = sample.seeds[i] * 1000;
      seed[i * 2 + 1] = sample.edgeWeights[i] * 1000;
      rank[i] = i;
    }
    return {
      count: cnt,
      home: sample.homes,
      sphere: buildFibonacciSphereHomes(cnt),
      seed,
      rank,
    };
  }

  // 2D sample path — flat cloud (z = 0) or ring topology (no
  // bulge math for ring; flat reads cleanly as an outline).
  const flat = sampleShape({
    shapeKey,
    paths,
    viewBox: BRANDMARK_VIEWBOX,
    count,
  });
  const cnt = flat.count;
  const home = new Float32Array(cnt * 3);
  for (let i = 0; i < cnt; i++) {
    home[i * 3] = flat.home[i * 2];
    // Flip Y so the brandmark reads upright in 3D space (sampleShape
    // returns SVG screen-down coords).
    home[i * 3 + 1] = -flat.home[i * 2 + 1];
    home[i * 3 + 2] = 0;
  }
  return {
    count: cnt,
    home,
    sphere: buildFibonacciSphereHomes(cnt),
    seed: flat.seed,
    rank: flat.rank,
  };
}

export function LabBrandmarkCloud({
  count,
  density,
  pointSize,
  color,
  accentColor,
  opacity,
  style,
  topology,
  depth3D,
  sphereMorph,
  twinkle,
  wander,
  spinRate,
  blend,
}: LabBrandmarkCloudProps) {
  const wrapperRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Points>(null);
  // Materials are ref-routed inside `useFrame` to satisfy the
  // `react-hooks/immutability` rule — same pattern as
  // `BrandmarkPhysicsCore.tsx`. The `useMemo`'d material is the
  // canonical instance; the ref tracks it so per-frame uniform
  // writes are accounted for as ref mutations rather than
  // post-render closure mutations.
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  // Re-sample whenever the structural inputs change — count /
  // topology / depth3D rebuild the buffer; everything else is a
  // uniform write.
  const bundle = useMemo<SampleBundle | null>(() => {
    if (typeof document === "undefined") return null;
    const b = buildSampleBundle(Math.max(1, Math.floor(count)), topology, depth3D);
    return b.count > 0 ? b : null;
  }, [count, topology, depth3D]);

  const geometry = useMemo(() => {
    if (!bundle) return null;
    const geo = new THREE.BufferGeometry();
    // Three.js requires a `position` attribute to size the draw
    // call — we route the actual positions through `aHome` so the
    // shader can lerp between brandmark and sphere homes.
    geo.setAttribute("position", new THREE.BufferAttribute(bundle.home, 3));
    geo.setAttribute("aHome", new THREE.BufferAttribute(bundle.home, 3));
    geo.setAttribute("aSphereHome", new THREE.BufferAttribute(bundle.sphere, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(bundle.seed, 2));
    geo.setAttribute("aRank", new THREE.BufferAttribute(bundle.rank, 1));
    return geo;
  }, [bundle]);

  const material = useMemo(() => {
    const dpr = typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    const mat = new THREE.ShaderMaterial({
      vertexShader: labCloudVertexShader,
      fragmentShader: labCloudFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: blend === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: {
        uPointSize: { value: pointSize },
        uPixelRatio: { value: dpr },
        uTime: { value: 0 },
        uWander: { value: wander },
        uSphereMorph: { value: sphereMorph },
        uVisibleCount: { value: 1 },
        uOpacity: { value: opacity },
        uTwinkle: { value: twinkle },
        uColor: { value: new THREE.Color(color) },
        uAccent: { value: new THREE.Color(accentColor) },
        uStyle: { value: STYLE_TO_CODE[style] },
      },
    });
    return mat;
    // Colour / size / morph / etc. are routed through per-frame
    // uniform writes below — only `blend` re-creates the material
    // (THREE.Material.blending isn't reactive without `needsUpdate`,
    // and a fresh material is the cleanest path).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blend]);

  // Keep the materialRef in step with the live material instance —
  // re-fires when `blend` swaps the material out (the only memo
  // dep). The ref is what the per-frame writer reads.
  useEffect(() => {
    materialRef.current = material;
  }, [material]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useEffect(() => {
    if (!geometry) return;
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  // Per-frame uniform writer + optional Y spin on the wrapper group.
  // Reads `materialRef.current` so the rule treats this as a ref
  // mutation (allowed) rather than a closure mutation of the
  // memo'd `material` (forbidden under `react-hooks/immutability`).
  useFrame((state, delta) => {
    const mat = materialRef.current;
    if (!mat) return;
    const u = mat.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uPointSize.value = pointSize;
    u.uOpacity.value = opacity;
    u.uTwinkle.value = twinkle;
    u.uWander.value = wander;
    u.uSphereMorph.value = sphereMorph;
    u.uColor.value.set(color);
    u.uAccent.value.set(accentColor);
    u.uStyle.value = STYLE_TO_CODE[style];

    if (bundle) {
      // Density dial — clamp01(density) maps to a rank-clip threshold.
      const visible = Math.max(1, Math.floor(bundle.count * Math.max(0, Math.min(1, density))));
      u.uVisibleCount.value = visible;
    }

    const wrapper = wrapperRef.current;
    if (wrapper && spinRate !== 0) {
      wrapper.rotation.y += spinRate * Math.min(0.1, delta);
    }
  });

  if (!geometry) return null;
  return (
    <group ref={wrapperRef}>
      <points ref={meshRef} geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}
