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

const STAR_COLOR = new THREE.Color(0.93, 0.89, 0.84);

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
  const starCount = useMemo(() => {
    if (count != null) return count;
    if (typeof window === "undefined") return 1400;
    const w = window.innerWidth;
    if (w < 760) return 900;
    if (w < 1280) return 1300;
    return 1800;
  }, [count]);

  const geometry = useMemo(() => {
    const positions = new Float32Array(starCount * 3);
    const seeds = new Float32Array(starCount);
    // Distribute across a wide volume: x/y in [-25, +25], z in
    // [-30, -10] so all stars sit behind the deepest gate but in
    // front of the camera's far plane. This volume is big enough
    // that camera dolly doesn't visibly translate them (parallax
    // shows the depth, but no star runs off the edge of the
    // viewport at the corridor's end).
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = -10 - Math.random() * 20;
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
        uPointSize: { value: 2.0 },
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

  // Boot-lift: lift the field's uOpacity by up to `STARFIELD_BOOT_LIFT`
  // while the Thoughtform boot envelope is engaged. Outside the
  // boot window the uniform sits at `STARFIELD_BASE_OPACITY`, so the
  // field is "paint-only" everywhere else and matches the original
  // backdrop intensity at every other beat.
  useFrame(() => {
    const { paintProgress, active, armed } = useDepthGatewayStore.getState().transform;
    if (!active && !armed) {
      material.uniforms.uOpacity.value = STARFIELD_BASE_OPACITY;
      return;
    }
    const boot = getThoughtformBootEnvelope(paintProgress);
    material.uniforms.uOpacity.value = STARFIELD_BASE_OPACITY + boot * STARFIELD_BOOT_LIFT;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
