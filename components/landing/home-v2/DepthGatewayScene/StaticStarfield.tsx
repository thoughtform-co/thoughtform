"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getThoughtformBootEnvelope } from "./sceneGeom";

/**
 * StaticStarfield — a fixed, non-animated layer of background stars
 * filling the void behind the corridor (ADR-018).
 *
 * Sits at a far Z position so it reads as the deep-space backdrop
 * regardless of where the camera is. Critically, particles DO NOT
 * MOVE when the user is not scrolling — the previous `StreamingDust`
 * implementation had an idle drift that broke the "flying through
 * space" read. This layer is paint-only (no per-frame star motion).
 *
 * The single per-frame write here is a gentle uOpacity lift driven
 * by the Thoughtform boot envelope: when the visitor first reaches
 * the parked Thoughtform composition the starfield reads ~40 %
 * brighter for the boot window, then returns to its baseline as
 * the camera enters passthrough-01. Pairs with the
 * `ThoughtformAtmosphere` boot-glow disk so the deep-space backdrop
 * subtly participates in the "gateway powering on" beat instead of
 * staying flat-lit.
 *
 * Density scales with viewport size.
 */

/** Baseline opacity outside the Thoughtform boot window. Matches
 *  the original constant before the boot lift was added. */
const STARFIELD_BASE_OPACITY = 0.6;
/** Maximum additive lift on top of the baseline at full boot. */
const STARFIELD_BOOT_LIFT = 0.35;

// ── Build-approach starfield boost (v3.2) ─────────────────────────
//
// The corridor-to-Build transition originally left the background
// quite empty (the ambient corridor fades to clear the stage, but
// the starfield only had its quiet baseline 0.6 opacity). v3.2 ramps
// the starfield's brightness AND point size as the camera approaches
// Build, then HOLDS that boosted state through the epilogue (because
// `paintProgress` is pinned at 1 through the planet flyover). Net
// effect: at Build the deep-space backdrop reads richly, and the
// epilogue planet flyover sits in a real sky.

/** Window in paintProgress where the starfield ramps from quiet to
 *  full. Ends at the Build park centre (0.92) so the lift is in
 *  place by the time the substrate lands. */
const STARFIELD_BUILD_BOOST_WINDOW: [number, number] = [0.78, 0.92];
/** Opacity ADDITIVE on top of the baseline + boot lift at peak Build
 *  boost. Picks 0.45 so peak opacity ≈ 1.0 (cap matches the existing
 *  shader logic). */
const STARFIELD_BUILD_OPACITY_LIFT = 0.45;
/** Point size at peak Build boost. Baseline is `uPointSize = 2.0`
 *  (set on the material below); the lift sends it to ~3.2 so stars
 *  read as more substantial dots at low FOV, matching the Earth-ref
 *  starfield density without doubling the geometry count. */
const STARFIELD_BUILD_POINT_SIZE_PEAK = 3.2;
const STARFIELD_BASE_POINT_SIZE = 2.0;

const STAR_COLOR = new THREE.Color(0.93, 0.89, 0.84);

/** Inline smoothstep — local copy to avoid importing from `sceneGeom`
 *  (which imports back from this folder via `shellGeom`, creating a
 *  module-graph cycle the bundler complains about). Identical to the
 *  shared `smoothstep` in `corridorMap`. */
function smoothstep01(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = (x - edge0) / (edge1 - edge0);
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t * t * (3 - 2 * t);
}

const vertexShader = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
attribute float aSeed;
varying float vSeed;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  // Subtle distance falloff for the rare close-ish stars.
  float distFactor = clamp(2.0 / max(0.4, -mv.z), 0.4, 1.4);
  gl_PointSize = uPointSize * uPixelRatio * distFactor;
  vSeed = aSeed;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vSeed;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float soft = smoothstep(0.5, 0.08, d);
  // Per-star alpha jitter so the field doesn't read as a uniform grid.
  float jitter = 0.55 + fract(vSeed * 41.0) * 0.45;
  float alpha = soft * jitter * uOpacity;
  if (alpha < 0.015) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

interface StaticStarfieldProps {
  /** Override the star count. Defaults adapt to viewport size. */
  count?: number;
}

export function StaticStarfield({ count }: StaticStarfieldProps = {}) {
  // Counts bumped 2026-05-25 (+33% across tiers) so the deep-space
  // backdrop reads as a denser starfield as the camera dollies
  // through the corridor — more parallax events per second.
  // v3.2: desktop bumped 2400 -> 3200 to support the Build/epilogue
  // brightness boost (more stars means the boosted field still reads
  // as discrete points rather than a uniform glow).
  const starCount = useMemo(() => {
    if (count != null) return count;
    if (typeof window === "undefined") return 1900;
    const w = window.innerWidth;
    if (w < 760) return 1200;
    if (w < 1280) return 1700;
    return 3200;
  }, [count]);

  const geometry = useMemo(() => {
    const positions = new Float32Array(starCount * 3);
    const seeds = new Float32Array(starCount);
    // Distribute across a wide volume: x/y in [-25, +25]/[-15,+15],
    // z in [-46, -26] so all stars sit BEHIND the deepest gate
    // (intelligence ≈ z -22.5 after the 2026-06-08 entry-buildup pass)
    // AND behind the camera's deepest dolly point (CAMERA_END z -17).
    // Keeping the whole volume behind the camera is load-bearing: if
    // the camera dollies INTO the star volume, near stars sweep past /
    // float beside the camera (worst on reverse scroll). This range
    // was pushed deeper as CAMERA_END went -8 → -14 → -17 — the
    // original [-30,-10] range left the deep half of the corridor
    // inside the starfield. The volume is still big enough that the
    // dolly shows parallax without any star running off the viewport
    // edge.
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = -26 - Math.random() * 20;
      seeds[i] = Math.random();
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return geom;
  }, [starCount]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uPointSize: { value: STARFIELD_BASE_POINT_SIZE },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uColor: { value: STAR_COLOR.clone() },
        uOpacity: { value: STARFIELD_BASE_OPACITY },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  // Per-frame brightness writes:
  //
  // 1. Thoughtform boot-lift (original): lifts uOpacity by up to
  //    `STARFIELD_BOOT_LIFT` while the Thoughtform boot envelope is
  //    engaged at the opening beat.
  // 2. Build/epilogue boost (v3.2): ramps uOpacity + uPointSize as
  //    paintProgress approaches Build (0.78 -> 0.92). Because
  //    paintProgress is pinned at 1 across the epilogue, the boost
  //    HOLDS through the planet flyover — the sky stays bright behind
  //    the orbital horizon view.
  useFrame(() => {
    const { paintProgress, active, armed, docked } = useDepthGatewayStore.getState().transform;
    if (!active && !armed && !docked) {
      material.uniforms.uOpacity.value = STARFIELD_BASE_OPACITY;
      material.uniforms.uPointSize.value = STARFIELD_BASE_POINT_SIZE;
      return;
    }
    const boot = getThoughtformBootEnvelope(paintProgress);
    // Smoothstep is monotonic and trivially inlined here to avoid an
    // import cycle (sceneGeom imports from this folder).
    const buildBoostT = smoothstep01(
      STARFIELD_BUILD_BOOST_WINDOW[0],
      STARFIELD_BUILD_BOOST_WINDOW[1],
      paintProgress
    );
    material.uniforms.uOpacity.value = Math.min(
      1.0,
      STARFIELD_BASE_OPACITY +
        boot * STARFIELD_BOOT_LIFT +
        buildBoostT * STARFIELD_BUILD_OPACITY_LIFT
    );
    material.uniforms.uPointSize.value =
      STARFIELD_BASE_POINT_SIZE +
      buildBoostT * (STARFIELD_BUILD_POINT_SIZE_PEAK - STARFIELD_BASE_POINT_SIZE);
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
