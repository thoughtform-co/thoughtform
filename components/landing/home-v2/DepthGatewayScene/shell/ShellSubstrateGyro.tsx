"use client";

/**
 * ShellSubstrateGyro — LAB-ONLY 3D gimbaled gyroscope for the Navigate
 * substrate beat (`/test/navigate-gyroscope`, gated by `gyroLabStore.enabled`).
 *
 * Replaces the flat compass with a genuine 3D instrument:
 *   - Wireframe attitude globe (great-circle meridians + latitude parallels,
 *     bolder equator horizon) painted with a depth-fade line shader so the
 *     far hemisphere dims and the sphere reads as a volume.
 *   - Three counter-rotating gimbal rings on orthogonal axes (OuterArmillary
 *     pattern) with tiny pivot diamonds at ring crossings.
 *   - Sparse surface-particle accent parented to the globe spin group.
 *
 * Motion: the parent `BrandmarkAccretionShell` banks the entire accreted
 * intelligence assembly. This component keeps the globe polar spin and
 * per-ring counter-spin so it remains an instrument inside that assembly.
 *
 * PRODUCTION SAFETY: only mounts when `gyroLabStore.enabled` (default false).
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { COLOR_DAWN, COLOR_GOLD } from "@/components/landing/intelligence-artifact/artifactGeom";
import {
  buildDiamondGeometry,
  makeMeshMaterial,
} from "@/components/landing/intelligence-artifact/artifactPrimitives";
import { buildSphereCloudGeometry } from "@/components/landing/v7/intelligence-layer/celestialRingUtils";
import { useGyroLabStore } from "@/lib/stores/gyroLabStore";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getBrandmarkAccretionLayers } from "../sceneGeom";
import {
  EMERGE_EPSILON,
  shellWrapEmerge,
  SUBSTRATE_GYRO_DEPTH_FAR,
  SUBSTRATE_GYRO_DEPTH_NEAR,
  SUBSTRATE_GYRO_DOTS_PER_MERIDIAN,
  SUBSTRATE_GYRO_DOTS_PER_PARALLEL,
  SUBSTRATE_GYRO_ENCODE_OPACITY_FLOOR,
  SUBSTRATE_GYRO_GIMBAL_RINGS,
  SUBSTRATE_GYRO_GLOBE_DOTS_OPACITY,
  SUBSTRATE_GYRO_GLOBE_DOTS_POINT_SIZE,
  SUBSTRATE_GYRO_DOTTED_SHELL_BANDS,
  SUBSTRATE_GYRO_DOTTED_SHELL_COUNT_DESKTOP,
  SUBSTRATE_GYRO_DOTTED_SHELL_COUNT_MOBILE,
  SUBSTRATE_GYRO_DOTTED_SHELL_OPACITY,
  SUBSTRATE_GYRO_DOTTED_SHELL_POINT_SIZE,
  SUBSTRATE_GYRO_DOTTED_SHELL_RADIUS_MUL,
  SUBSTRATE_GYRO_GLOBE_EQUATOR_OPACITY,
  SUBSTRATE_GYRO_GLOBE_LINE_OPACITY,
  SUBSTRATE_GYRO_GLOBE_SEGMENTS,
  SUBSTRATE_GYRO_GLOBE_SPIN,
  SUBSTRATE_GYRO_MAJOR_TICK_EVERY,
  SUBSTRATE_GYRO_MERIDIAN_COUNT,
  SUBSTRATE_GYRO_PARALLEL_COUNT,
  SUBSTRATE_GYRO_PARTICLE_COUNT_DESKTOP,
  SUBSTRATE_GYRO_PARTICLE_COUNT_MOBILE,
  SUBSTRATE_GYRO_PARTICLE_OPACITY,
  SUBSTRATE_GYRO_PIVOT_OPACITY,
  SUBSTRATE_GYRO_POINT_SIZE,
  SUBSTRATE_GYRO_RING_LINE_OPACITY,
  SUBSTRATE_GYRO_SYMBOL_OPACITY,
  SUBSTRATE_GYRO_TICK_COUNT,
  SUBSTRATE_GYRO_TICK_OPACITY,
} from "./shellGeom";

interface ShellSubstrateGyroProps {
  layerKey: "substrate";
  reducedMotion?: boolean;
}

// ── Depth-fade line shader (front-bright / back-dim) ────────────────

const depthFadeVertex = /* glsl */ `
varying float vViewZ;
void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vec4 mvCenter = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vViewZ = mvPosition.z - mvCenter.z;
}
`;

const depthFadeFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uNearZ;
uniform float uFarZ;
varying float vViewZ;
void main() {
  float depthFade = smoothstep(uFarZ, uNearZ, vViewZ);
  float alpha = uOpacity * depthFade;
  if (alpha < 0.008) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

function makeDepthFadeLineMaterial(color: THREE.Color, opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: depthFadeVertex,
    fragmentShader: depthFadeFragment,
    uniforms: {
      uColor: { value: color.clone() },
      uOpacity: { value: opacity },
      uNearZ: { value: SUBSTRATE_GYRO_DEPTH_NEAR },
      uFarZ: { value: SUBSTRATE_GYRO_DEPTH_FAR },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// ── Soft-dot surface particle shader ────────────────────────────────

const gyroParticleVertex = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
attribute float aSeed;
attribute float aRank;
attribute float aTint;
varying float vSeed;
varying float vRank;
varying float vTint;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = max(0.4, -mv.z);
  float sizeFactor = clamp(6.0 / dist, 0.5, 2.4);
  gl_PointSize = uPointSize * uPixelRatio * sizeFactor * mix(0.7, 1.55, aRank);
  vSeed = aSeed;
  vRank = aRank;
  vTint = aTint;
}
`;

const gyroParticleFragment = /* glsl */ `
uniform vec3 uColorWarm;
uniform vec3 uColorCool;
uniform float uOpacity;
varying float vSeed;
varying float vRank;
varying float vTint;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float coreR = mix(0.10, 0.18, vRank);
  float core = smoothstep(coreR, 0.0, d);
  float halo = smoothstep(0.5, 0.14, d);
  float soft = max(core, halo * 0.5);
  float jitter = 0.7 + fract(vSeed * 41.0) * 0.3;
  vec3 col = mix(uColorCool, uColorWarm, vTint);
  float alpha = soft * uOpacity * jitter;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(col, alpha);
}
`;

function makeParticleMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: gyroParticleVertex,
    fragmentShader: gyroParticleFragment,
    uniforms: {
      uPointSize: { value: SUBSTRATE_GYRO_POINT_SIZE },
      uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
      uColorWarm: { value: new THREE.Color(COLOR_GOLD) },
      uColorCool: { value: new THREE.Color(COLOR_DAWN) },
      uOpacity: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// ── Dotted-shell surface shader (per-dot facing fade) ───────────────
// The dots sit on a sphere shell. Each dot's outward normal is dotted
// with the view direction so the front hemisphere is bright and a touch
// larger; the far hemisphere fades to near zero. That gradient is what
// makes a flat scatter of dots read as a 3D shell.

const surfaceShellVertex = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
attribute vec3 aNormal;
attribute float aSeed;
attribute float aRank;
attribute float aTint;
varying float vFacing;
varying float vSeed;
varying float vRank;
varying float vTint;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = max(0.4, -mv.z);

  // Outward normal transformed into view space. In view space the
  // camera looks down -Z, so the dot faces the camera when vNormal.z
  // is positive.
  vec3 vNormal = normalize(normalMatrix * aNormal);
  float facing = vNormal.z;
  vFacing = facing;

  float sizeFactor = clamp(6.0 / dist, 0.5, 2.4);
  float sizeFade = smoothstep(-0.3, 0.5, facing);
  gl_PointSize = uPointSize * uPixelRatio * sizeFactor *
                 mix(0.55, 1.4, sizeFade) * mix(0.8, 1.3, aRank);

  vSeed = aSeed;
  vRank = aRank;
  vTint = aTint;
}
`;

const surfaceShellFragment = /* glsl */ `
uniform vec3 uColorWarm;
uniform vec3 uColorCool;
uniform float uOpacity;
varying float vFacing;
varying float vSeed;
varying float vRank;
varying float vTint;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float coreR = mix(0.10, 0.18, vRank);
  float core = smoothstep(coreR, 0.0, d);
  float halo = smoothstep(0.5, 0.14, d);
  float soft = max(core, halo * 0.5);

  // Per-dot facing fade: side-facing dots (the sphere silhouette) at
  // full brightness, back hemisphere fades to near zero. The curve is
  // softened so the limb stays dense; only the truly back-facing dots
  // drop out, otherwise the sphere reads as a thin ring.
  float facingAlpha = smoothstep(-0.45, 0.05, vFacing);

  float jitter = 0.65 + fract(vSeed * 41.0) * 0.35;
  vec3 col = mix(uColorCool, uColorWarm, vTint);
  float alpha = soft * uOpacity * jitter * facingAlpha;
  if (alpha < 0.008) discard;
  gl_FragColor = vec4(col, alpha);
}
`;

function makeSurfaceShellMaterial(pointSize: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: surfaceShellVertex,
    fragmentShader: surfaceShellFragment,
    uniforms: {
      uPointSize: { value: pointSize },
      uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
      uColorWarm: { value: new THREE.Color(COLOR_GOLD) },
      uColorCool: { value: new THREE.Color(COLOR_DAWN) },
      uOpacity: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// ── Geometry builders ───────────────────────────────────────────────

function buildGreatCircle(
  radius: number,
  segments = SUBSTRATE_GYRO_GLOBE_SEGMENTS
): THREE.BufferGeometry {
  const positions = new Float32Array((segments + 1) * 3);
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * radius;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = Math.sin(a) * radius;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

function buildArc(
  radius: number,
  startRad: number,
  endRad: number,
  segments = SUBSTRATE_GYRO_GLOBE_SEGMENTS
): THREE.BufferGeometry {
  const positions = new Float32Array(segments * 2 * 3);
  for (let i = 0; i < segments; i++) {
    const t0 = i / segments;
    const t1 = (i + 1) / segments;
    const a0 = startRad + (endRad - startRad) * t0;
    const a1 = startRad + (endRad - startRad) * t1;
    const idx = i * 6;
    positions[idx] = Math.cos(a0) * radius;
    positions[idx + 1] = 0;
    positions[idx + 2] = Math.sin(a0) * radius;
    positions[idx + 3] = Math.cos(a1) * radius;
    positions[idx + 4] = 0;
    positions[idx + 5] = Math.sin(a1) * radius;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

/** Latitude parallel (small circle) at `latRad` from the equator. */
function buildParallel(
  radius: number,
  latRad: number,
  segments = SUBSTRATE_GYRO_GLOBE_SEGMENTS
): THREE.BufferGeometry {
  const y = Math.sin(latRad) * radius;
  const r = Math.cos(latRad) * radius;
  const positions = new Float32Array((segments + 1) * 3);
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(a) * r;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

function buildNavigationTicks(
  radius: number,
  count: number,
  majorEvery: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const major = i % majorEvery === 0;
    const inner = radius - (major ? 0.055 : 0.03);
    const outer = radius + (major ? 0.02 : 0.008);
    positions.push(Math.cos(a) * inner, Math.sin(a) * inner, 0);
    positions.push(Math.cos(a) * outer, Math.sin(a) * outer, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return g;
}

function buildBearingGlyphs(radius: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const pushLine = (a: number, r1: number, r2: number) => {
    positions.push(Math.cos(a) * r1, Math.sin(a) * r1, 0);
    positions.push(Math.cos(a) * r2, Math.sin(a) * r2, 0);
  };
  const pushChevron = (a: number) => {
    const tangent = a + Math.PI / 2;
    const tipR = radius + 0.075;
    const baseR = radius + 0.025;
    const spread = 0.035;
    const tip: [number, number, number] = [Math.cos(a) * tipR, Math.sin(a) * tipR, 0];
    const left: [number, number, number] = [
      Math.cos(a) * baseR + Math.cos(tangent) * spread,
      Math.sin(a) * baseR + Math.sin(tangent) * spread,
      0,
    ];
    const right: [number, number, number] = [
      Math.cos(a) * baseR - Math.cos(tangent) * spread,
      Math.sin(a) * baseR - Math.sin(tangent) * spread,
      0,
    ];
    positions.push(...tip, ...left, ...tip, ...right);
  };

  [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((a) => {
    pushLine(a, radius + 0.015, radius + 0.08);
  });
  [Math.PI / 4, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75].forEach(pushChevron);

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return g;
}

/** Graduated ticks in the XZ plane — these sit inside a ring's spin
 *  group so they rotate with the gimbal ring like a calibrated scale. */
function buildRingGraduations(
  radius: number,
  count: number,
  majorEvery: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const major = i % majorEvery === 0;
    const half = i % (majorEvery / 2) === 0 && !major;
    const innerOff = major ? 0.048 : half ? 0.032 : 0.018;
    const outerOff = major ? 0.018 : 0.006;
    const inner = radius - innerOff;
    const outer = radius + outerOff;
    positions.push(Math.cos(a) * inner, 0, Math.sin(a) * inner);
    positions.push(Math.cos(a) * outer, 0, Math.sin(a) * outer);
  }

  [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((a) => {
    const tangent = a + Math.PI / 2;
    const tipR = radius + 0.06;
    const baseR = radius + 0.025;
    const spread = 0.022;
    positions.push(Math.cos(a) * tipR, 0, Math.sin(a) * tipR);
    positions.push(
      Math.cos(a) * baseR + Math.cos(tangent) * spread,
      0,
      Math.sin(a) * baseR + Math.sin(tangent) * spread
    );
    positions.push(Math.cos(a) * tipR, 0, Math.sin(a) * tipR);
    positions.push(
      Math.cos(a) * baseR - Math.cos(tangent) * spread,
      0,
      Math.sin(a) * baseR - Math.sin(tangent) * spread
    );
  });

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return g;
}

/** Sample `count` points along a great circle in XZ (Y=0). */
function buildGreatCirclePoints(radius: number, count: number): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.04;
    const shell = 0.97 + Math.random() * 0.06;
    positions[i * 3] = Math.cos(a) * radius * shell;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = Math.sin(a) * radius * shell;
    seeds[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  return g;
}

/** Sample `count` points along a latitude parallel. */
function buildParallelPoints(radius: number, latRad: number, count: number): THREE.BufferGeometry {
  const y = Math.sin(latRad) * radius;
  const r = Math.cos(latRad) * radius;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.04;
    const shell = 0.97 + Math.random() * 0.06;
    positions[i * 3] = Math.cos(a) * r * shell;
    positions[i * 3 + 1] = y + (Math.random() - 0.5) * 0.01;
    positions[i * 3 + 2] = Math.sin(a) * r * shell;
    seeds[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  return g;
}

/** Latitude-band dotted sphere shell — dots arranged in parallel rows
 *  with cos(lat) density (denser at the equator, thinning to the poles).
 *  Each dot carries its outward normal so the shader can fade the far
 *  hemisphere by facing — the single technique that makes a flat
 *  scatter of dots read as a real 3D shell. */
function buildDottedShell(
  radius: number,
  approxCount: number,
  latBands: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const seeds: number[] = [];

  // Sum of cos(lat) across bands sets the normalization constant.
  let cosSum = 0;
  for (let b = 0; b < latBands; b++) {
    const lat = -Math.PI / 2 + ((b + 0.5) * Math.PI) / latBands;
    cosSum += Math.cos(lat);
  }
  const dotsPerCos = approxCount / cosSum;

  for (let b = 0; b < latBands; b++) {
    const lat = -Math.PI / 2 + ((b + 0.5) * Math.PI) / latBands;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    const dotsInBand = Math.max(1, Math.round(dotsPerCos * cosLat));

    // Random longitude offset per band so rows don't align into a grid.
    const offset = Math.random() * Math.PI * 2;
    const y = sinLat * radius;
    const r = cosLat * radius;

    for (let i = 0; i < dotsInBand; i++) {
      const lon = offset + (i / dotsInBand) * Math.PI * 2 + (Math.random() - 0.5) * 0.08;
      const rJitter = 0.992 + Math.random() * 0.016;
      const px = Math.cos(lon) * r * rJitter;
      const py = y * rJitter;
      const pz = Math.sin(lon) * r * rJitter;
      positions.push(px, py, pz);

      const len = Math.sqrt(px * px + py * py + pz * pz) || 1;
      normals.push(px / len, py / len, pz / len);
      seeds.push(Math.random());
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("aNormal", new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));
  return g;
}

function addRankTint(geom: THREE.BufferGeometry, count: number, warmBias: number): void {
  const ranks = new Float32Array(count);
  const tints = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    ranks[i] = Math.random() < 0.18 ? 0.8 + Math.random() * 0.2 : Math.random() * 0.45;
    tints[i] = Math.random() < warmBias ? 0.7 + Math.random() * 0.3 : Math.random() * 0.35;
  }
  geom.setAttribute("aRank", new THREE.BufferAttribute(ranks, 1));
  geom.setAttribute("aTint", new THREE.BufferAttribute(tints, 1));
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const PIVOT_SIZE = 0.028;

export function ShellSubstrateGyro({ layerKey, reducedMotion = false }: ShellSubstrateGyroProps) {
  void layerKey;

  const ringCount = useGyroLabStore((s) => s.ringCount);
  const showParticles = useGyroLabStore((s) => s.showParticles);
  const globeRadius = useGyroLabStore((s) => s.globeRadius);
  const globeDensity = useGyroLabStore((s) => s.globeDensity);
  const particleDensity = useGyroLabStore((s) => s.particleDensity);

  const motionFrozen = useMemo(() => reducedMotion || prefersReducedMotion(), [reducedMotion]);

  const rootRef = useRef<THREE.Group>(null);
  const globeSpinRef = useRef<THREE.Group>(null);
  const ringSpinRefs = useRef<(THREE.Group | null)[]>([]);

  const effectiveRingCount = Math.min(Math.max(0, ringCount), SUBSTRATE_GYRO_GIMBAL_RINGS.length);

  const geom = useMemo(() => {
    const meridianCount = Math.max(3, Math.round(SUBSTRATE_GYRO_MERIDIAN_COUNT * globeDensity));
    const parallelCount = Math.max(2, Math.round(SUBSTRATE_GYRO_PARALLEL_COUNT * globeDensity));

    const dotsPerMeridian = Math.max(
      16,
      Math.round(SUBSTRATE_GYRO_DOTS_PER_MERIDIAN * globeDensity)
    );
    const dotsPerParallel = Math.max(
      12,
      Math.round(SUBSTRATE_GYRO_DOTS_PER_PARALLEL * globeDensity)
    );

    const meridians: THREE.BufferGeometry[] = [];
    for (let i = 0; i < meridianCount; i++) {
      const g = buildGreatCirclePoints(globeRadius, dotsPerMeridian);
      addRankTint(g, dotsPerMeridian, 0.2);
      meridians.push(g);
    }

    const parallels: THREE.BufferGeometry[] = [];
    for (let i = 0; i < parallelCount; i++) {
      const t = (i + 1) / (parallelCount + 1);
      const lat = (t - 0.5) * Math.PI * 0.88;
      const g = buildParallelPoints(globeRadius, lat, dotsPerParallel);
      addRankTint(g, dotsPerParallel, 0.2);
      parallels.push(g);
    }
    const equator = buildGreatCircle(globeRadius);

    const gimbalRings: THREE.BufferGeometry[] = [];
    for (let i = 0; i < SUBSTRATE_GYRO_GIMBAL_RINGS.length; i++) {
      gimbalRings.push(buildGreatCircle(SUBSTRATE_GYRO_GIMBAL_RINGS[i].radius));
    }

    const particleCount = Math.max(
      24,
      Math.round(
        (reducedMotion
          ? SUBSTRATE_GYRO_PARTICLE_COUNT_MOBILE
          : SUBSTRATE_GYRO_PARTICLE_COUNT_DESKTOP) * particleDensity
      )
    );
    const particles = buildSphereCloudGeometry(globeRadius, particleCount);
    addRankTint(particles, particleCount, 0.3);

    const dottedShellCount = Math.max(
      120,
      Math.round(
        (reducedMotion
          ? SUBSTRATE_GYRO_DOTTED_SHELL_COUNT_MOBILE
          : SUBSTRATE_GYRO_DOTTED_SHELL_COUNT_DESKTOP) * particleDensity
      )
    );
    const dottedShellRadius = globeRadius * SUBSTRATE_GYRO_DOTTED_SHELL_RADIUS_MUL;
    const dottedShell = buildDottedShell(
      dottedShellRadius,
      dottedShellCount,
      SUBSTRATE_GYRO_DOTTED_SHELL_BANDS
    );
    addRankTint(dottedShell, dottedShell.attributes.position.count, 0.6);

    const pivot = buildDiamondGeometry(PIVOT_SIZE);
    const ticks = buildNavigationTicks(
      SUBSTRATE_GYRO_GIMBAL_RINGS[0].radius,
      SUBSTRATE_GYRO_TICK_COUNT,
      SUBSTRATE_GYRO_MAJOR_TICK_EVERY
    );
    const ticksMiddle = buildNavigationTicks(
      SUBSTRATE_GYRO_GIMBAL_RINGS[1].radius,
      Math.round(SUBSTRATE_GYRO_TICK_COUNT * 0.75),
      SUBSTRATE_GYRO_MAJOR_TICK_EVERY
    );
    const glyphs = buildBearingGlyphs(SUBSTRATE_GYRO_GIMBAL_RINGS[2].radius);

    const ringGraduations: THREE.BufferGeometry[] = [];
    for (let i = 0; i < SUBSTRATE_GYRO_GIMBAL_RINGS.length; i++) {
      const r = SUBSTRATE_GYRO_GIMBAL_RINGS[i].radius;
      const density = i === 0 ? 72 : i === 1 ? 56 : 40;
      const majorEvery = i === 0 ? 6 : 4;
      ringGraduations.push(buildRingGraduations(r, density, majorEvery));
    }

    return {
      meridians,
      parallels,
      equator,
      gimbalRings,
      particles,
      dottedShell,
      pivot,
      ticks,
      ticksMiddle,
      glyphs,
      ringGraduations,
      meridianCount,
      parallelCount,
    };
  }, [globeRadius, globeDensity, particleDensity, reducedMotion]);

  const mats = useMemo(() => {
    const gold = new THREE.Color(COLOR_GOLD);
    const dawn = new THREE.Color(COLOR_DAWN);
    return {
      globeDots: (() => {
        const m = makeParticleMaterial();
        m.uniforms.uPointSize.value = SUBSTRATE_GYRO_GLOBE_DOTS_POINT_SIZE;
        return m;
      })(),
      equator: makeDepthFadeLineMaterial(gold, SUBSTRATE_GYRO_GLOBE_EQUATOR_OPACITY),
      ring: makeDepthFadeLineMaterial(gold, SUBSTRATE_GYRO_RING_LINE_OPACITY),
      tick: makeDepthFadeLineMaterial(gold, SUBSTRATE_GYRO_TICK_OPACITY),
      graduation: makeDepthFadeLineMaterial(dawn, SUBSTRATE_GYRO_TICK_OPACITY * 0.7),
      symbol: makeDepthFadeLineMaterial(gold, SUBSTRATE_GYRO_SYMBOL_OPACITY),
      pivot: makeMeshMaterial(COLOR_GOLD, SUBSTRATE_GYRO_PIVOT_OPACITY),
      particle: makeParticleMaterial(),
      dottedShell: makeSurfaceShellMaterial(SUBSTRATE_GYRO_DOTTED_SHELL_POINT_SIZE),
    };
  }, []);

  useEffect(() => {
    return () => {
      geom.meridians.forEach((g) => g.dispose());
      geom.parallels.forEach((g) => g.dispose());
      geom.equator.dispose();
      geom.gimbalRings.forEach((g) => g.dispose());
      geom.particles.dispose();
      geom.dottedShell.dispose();
      geom.pivot.dispose();
      geom.ticks.dispose();
      geom.ticksMiddle.dispose();
      geom.glyphs.dispose();
      geom.ringGraduations.forEach((g) => g.dispose());
    };
  }, [geom]);

  useEffect(() => {
    return () => {
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [mats]);

  useFrame((state, delta) => {
    const root = rootRef.current;
    const globeSpin = globeSpinRef.current;
    if (!root || !globeSpin) return;

    const { paintProgress, active, armed } = useDepthGatewayStore.getState().transform;
    if (!active && !armed) {
      root.visible = false;
      return;
    }

    const layers = getBrandmarkAccretionLayers(paintProgress);
    const reveal = layers.substrate;
    if (reveal <= EMERGE_EPSILON) {
      root.visible = false;
      return;
    }
    root.visible = true;

    const dt = Math.min(0.1, delta);
    const { idleSpeed } = useGyroLabStore.getState();

    const wrap = shellWrapEmerge(reveal);
    root.scale.setScalar(wrap.scale);

    const opacityCalm = 1 - (1 - SUBSTRATE_GYRO_ENCODE_OPACITY_FLOOR) * layers.orbits;
    const presence = wrap.presence * opacityCalm;

    const lineOpacity = (base: number) => base * presence;
    mats.globeDots.uniforms.uOpacity.value = SUBSTRATE_GYRO_GLOBE_DOTS_OPACITY * presence;
    mats.globeDots.uniforms.uPixelRatio.value = state.viewport.dpr;
    mats.equator.uniforms.uOpacity.value = lineOpacity(SUBSTRATE_GYRO_GLOBE_EQUATOR_OPACITY);
    mats.ring.uniforms.uOpacity.value = lineOpacity(SUBSTRATE_GYRO_RING_LINE_OPACITY);
    mats.tick.uniforms.uOpacity.value = lineOpacity(SUBSTRATE_GYRO_TICK_OPACITY);
    mats.graduation.uniforms.uOpacity.value = lineOpacity(SUBSTRATE_GYRO_TICK_OPACITY * 0.7);
    mats.symbol.uniforms.uOpacity.value = lineOpacity(SUBSTRATE_GYRO_SYMBOL_OPACITY);
    mats.pivot.opacity = SUBSTRATE_GYRO_PIVOT_OPACITY * presence;
    mats.particle.uniforms.uPixelRatio.value = state.viewport.dpr;
    mats.particle.uniforms.uOpacity.value = SUBSTRATE_GYRO_PARTICLE_OPACITY * presence;
    mats.dottedShell.uniforms.uPixelRatio.value = state.viewport.dpr;
    mats.dottedShell.uniforms.uOpacity.value = SUBSTRATE_GYRO_DOTTED_SHELL_OPACITY * presence;

    if (motionFrozen) {
      globeSpin.rotation.y = 0.4;
    } else {
      globeSpin.rotation.y += SUBSTRATE_GYRO_GLOBE_SPIN * idleSpeed * dt;
    }

    for (let i = 0; i < effectiveRingCount; i++) {
      const spinNode = ringSpinRefs.current[i];
      if (!spinNode || motionFrozen) continue;
      spinNode.rotation.y += SUBSTRATE_GYRO_GIMBAL_RINGS[i].spin * idleSpeed * dt;
    }
  });

  return (
    <group ref={rootRef} visible={false}>
      {/* Globe spin group — meridians, parallels, equator, particles */}
      <group ref={globeSpinRef}>
        {geom.meridians.map((g, i) => {
          const angle = (i / geom.meridianCount) * Math.PI;
          return (
            <group key={`meridian-${i}`} rotation={[angle, 0, 0]}>
              <points geometry={g} material={mats.globeDots} frustumCulled={false} />
            </group>
          );
        })}

        {geom.parallels.map((g, i) => (
          <points
            key={`parallel-${i}`}
            geometry={g}
            material={mats.globeDots}
            frustumCulled={false}
          />
        ))}

        <lineLoop geometry={geom.equator} material={mats.equator} frustumCulled={false} />
        {showParticles && (
          <points geometry={geom.particles} material={mats.particle} frustumCulled={false} />
        )}
      </group>

      {/* Dotted shell — surface dots with per-dot facing fade so the
          gimbal cage reads as a real 3D sphere shell (front bright,
          back hemisphere fades to near zero). */}
      <points geometry={geom.dottedShell} material={mats.dottedShell} frustumCulled={false} />

      <lineSegments geometry={geom.ticks} material={mats.tick} frustumCulled={false} />
      <lineSegments geometry={geom.ticksMiddle} material={mats.tick} frustumCulled={false} />
      <lineSegments geometry={geom.glyphs} material={mats.symbol} frustumCulled={false} />

      {/* Gimbal cage — counter-rotating rings + pivot diamonds */}
      {SUBSTRATE_GYRO_GIMBAL_RINGS.slice(0, effectiveRingCount).map((axis, ringIdx) => (
        <group key={`gimbal-ring-${ringIdx}`} rotation={[axis.tilt[0], axis.tilt[1], axis.tilt[2]]}>
          <group
            ref={(node) => {
              ringSpinRefs.current[ringIdx] = node;
            }}
          >
            <lineLoop
              geometry={geom.gimbalRings[ringIdx]}
              material={mats.ring}
              frustumCulled={false}
            />
            {geom.ringGraduations[ringIdx] && (
              <lineSegments
                geometry={geom.ringGraduations[ringIdx]}
                material={mats.graduation}
                frustumCulled={false}
              />
            )}
            {/* Pivot diamonds at cardinal positions on each ring */}
            {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((a, pi) => (
              <mesh
                key={`pivot-${ringIdx}-${pi}`}
                geometry={geom.pivot}
                material={mats.pivot}
                position={[Math.cos(a) * axis.radius, 0, Math.sin(a) * axis.radius]}
                frustumCulled={false}
              />
            ))}
          </group>
        </group>
      ))}
    </group>
  );
}
