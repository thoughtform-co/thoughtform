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

import { extend, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

// `<line>` collides with the SVG intrinsic; r3f exposes the typed
// alias `<threeLine>` for `THREE.Line`, but the auto-`extend(THREE)`
// inside `<Canvas>` populates the runtime catalog with `Line`, not
// `ThreeLine`. Without an explicit extend the dev/prod runtime
// throws `R3F: ThreeLine is not part of the THREE namespace!` the
// first time the gimbal sphere reveals. Register the alias once at
// module load so the trim-path rings render. (2026-06-10 fix.)
extend({ ThreeLine: THREE.Line });
import { COLOR_DAWN, COLOR_VOID } from "@/components/landing/intelligence-artifact/artifactGeom";
// Substrate-sphere gold — a more-yellow `#caa554` (2026-06-25 harmonization) so
// the additive bloom reads gold, not orange. Matches the corridor → #services seam.
import { SPHERE_GOLD as COLOR_GOLD } from "@/lib/home-v2/goldPalette";
import {
  buildDiamondGeometry,
  makeMeshMaterial,
} from "@/components/landing/intelligence-artifact/artifactPrimitives";
import { buildSphereCloudGeometry } from "@/components/landing/v7/intelligence-layer/celestialRingUtils";
import {
  dissipateAtmosphereEnvelope,
  dissipateCoreMultiplier,
  dissipateInteriorOpacityMultiplier,
  dissipateOpacityMultiplier,
  dissipateShellScatter,
  epilogueBand,
  SERVICES_AMBIENT_HOLD_LEVEL,
  SERVICES_AMBIENT_SURFACE_LEVEL,
  servicesAmbientOpacityMultiplier,
} from "@/lib/home-v2/epilogueTimeline";
import { useGyroLabStore } from "@/lib/stores/gyroLabStore";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { clamp01 } from "@/lib/home-v2/corridorMap";
import {
  getSmoothedAccretionLayers,
  getSmoothedDissipate,
  getSmoothedEpilogueProgress,
} from "../motionFollower";
import {
  EMERGE_EPSILON,
  gyroAssemblyUnfold,
  gyroRingUnfold,
  petalStagger,
  SUBSTRATE_GYRO_REVEAL_LAG,
  SUBSTRATE_GYRO_CARDINAL_RING_OPACITY,
  SUBSTRATE_GYRO_CARDINAL_RING_RADIUS,
  SUBSTRATE_GYRO_CORE_DENSITY,
  SUBSTRATE_GYRO_CORE_OPACITY,
  SUBSTRATE_GYRO_CORE_RADIUS_MUL,
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
  SUBSTRATE_GYRO_UNFOLD_RING_TILT_FLOOR,
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
  float sizeFactor = clamp(6.0 / dist, 0.5, 2.0);
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
  // Crispness pass (2026-06-12): the core owns the sprite. The old
  // falloff (core 10-18% of the radius, halo out to 50% at half
  // strength) made every dot a soft blob — the sphere read as
  // low-res. Now the solid core spans ~22-32% with a short faint
  // halo, so each dot resolves as a point with a breath of glow.
  float coreR = mix(0.22, 0.32, vRank);
  float core = smoothstep(coreR, coreR * 0.45, d);
  float halo = smoothstep(0.34, 0.10, d);
  float soft = max(core, halo * 0.26);
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

// ── Planet atmosphere shell (v3.2) ──────────────────────────────────
//
// Fresnel rim-glow that surrounds the substrate sphere as it grows
// into a planet during the EPILOGUE APPROACH. Rendered on a slightly
// larger sphere than the dotted-shell surface so the glow sits at
// the planet's silhouette — the signature "Earth from orbit" cyan/
// blue rim, here painted in the corridor's gold/dawn palette.
//
// Uses BackSide rendering + additive blending: the back-faced sphere
// shows through anything in front (so the atmosphere reads as a halo
// AROUND the planet, not as a sphere occluding it), and the additive
// blending lifts the limb without darkening the starfield.
//
// `uOpacity` is driven per-frame from the EPILOGUE APPROACH band so
// the atmosphere is invisible in the parked corridor and fades in as
// the substrate transitions into a planet.

const atmosphereVertex = /* glsl */ `
varying vec3 vViewNormal;
varying vec3 vViewPos;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  // Normal in view space; rim glow is highest where this is
  // perpendicular to the view direction (i.e. silhouette).
  vViewNormal = normalize(normalMatrix * normal);
  vViewPos = mv.xyz;
}
`;

const atmosphereFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uPower;
varying vec3 vViewNormal;
varying vec3 vViewPos;
void main() {
  // View direction TOWARD the camera. For a back-faced sphere we
  // flip the normal so the math reads as "outer-facing normal vs
  // camera direction" identical to a front-faced fresnel.
  vec3 viewDir = normalize(-vViewPos);
  vec3 n = -vViewNormal;
  // Fresnel: bright at glancing angles (silhouette), transparent
  // toward the centre of the planet. uPower=2.5 gives a soft halo
  // rather than a thin ring — closer to atmospheric scatter than
  // hard outline.
  float fresnel = pow(clamp(1.0 - dot(n, viewDir), 0.0, 1.0), uPower);
  float alpha = fresnel * uOpacity;
  if (alpha < 0.005) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

function makeAtmosphereMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: atmosphereVertex,
    fragmentShader: atmosphereFragment,
    uniforms: {
      uColor: { value: new THREE.Color(COLOR_GOLD) },
      uOpacity: { value: 0 },
      uPower: { value: 2.5 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  });
}

// ── Smoky occluder core (2026-06-12) ────────────────────────────────
//
// Every other element of the instrument is additive-blended dots and
// lines — the sphere had NO body, so the terrain rollout, crossing
// rings, wormhole walls and stars passed through it at full strength.
// This core is a NORMAL-blended void-ink sphere just inside the
// dotted shell: whatever was painted behind it gets composited toward
// the corridor ink, i.e. dimmed, exactly where the sphere's volume is.
//
// Alpha follows the chord length a view ray travels through the ball
// (Beer–Lambert through a uniform volume): facing = cos(angle between
// surface normal and view ray) is proportional to the chord, so
// alpha = uOpacity * (1 - exp(-density * facing)) — densest at the
// disk centre, falling smoothly to ZERO at the rim. No hard silhouette
// circle; the body reads as smoked glass, not a cut-out disc.
//
// Render order makes it work — three buckets via per-object
// renderOrder (groupOrder is useless here: every nested THREE.Group
// resets it):
//
//   0  all default scene content (terrain, walls, rings, gates, the
//      sibling ShellStack/ShellEncode lines — which therefore dim as
//      they plunge INTO the body: the absorption read the stack
//      drain choreography wants);
//   1  this core — drawn after the scene, dimming it;
//   2  every other renderable of THIS instrument (assigned by a
//      traverse in the component) — dots, rings, ticks, pivots and
//      atmosphere stay bright on top of the body.

const coreVertex = /* glsl */ `
varying vec3 vViewNormal;
varying vec3 vViewPos;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  vViewNormal = normalize(normalMatrix * normal);
  vViewPos = mv.xyz;
}
`;

const coreFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uDensity;
varying vec3 vViewNormal;
varying vec3 vViewPos;
void main() {
  vec3 viewDir = normalize(-vViewPos);
  float facing = clamp(dot(normalize(vViewNormal), viewDir), 0.0, 1.0);
  // Normalized Beer–Lambert: alpha hits exactly uOpacity at the disk
  // centre (facing = 1) and 0 at the rim (facing = 0).
  float absorb = (1.0 - exp(-uDensity * facing)) / (1.0 - exp(-uDensity));
  float alpha = uOpacity * absorb;
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

function makeCoreMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: coreVertex,
    fragmentShader: coreFragment,
    uniforms: {
      uColor: { value: new THREE.Color(COLOR_VOID) },
      uOpacity: { value: 0 },
      uDensity: { value: SUBSTRATE_GYRO_CORE_DENSITY },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    blending: THREE.NormalBlending,
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

  float sizeFactor = clamp(6.0 / dist, 0.5, 2.0);
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
  // Crispness pass (2026-06-12): core-dominant sprite, short halo —
  // see gyroParticleFragment for the rationale.
  float coreR = mix(0.22, 0.32, vRank);
  float core = smoothstep(coreR, coreR * 0.45, d);
  float halo = smoothstep(0.34, 0.10, d);
  float soft = max(core, halo * 0.26);

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

/** Closed circle in the XY plane (camera-facing) — used for the flat
 *  cardinal-bezel ring that contains the four Encode primitive labels.
 *  Distinct from `buildGreatCircle` (which builds in XZ for the gimbal
 *  rings) so the bezel doesn't spin with the gyro and stays a flat dial. */
function buildXyCircle(radius: number, segments: number): THREE.BufferGeometry {
  const positions = new Float32Array((segments + 1) * 3);
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * radius;
    positions[i * 3 + 1] = Math.sin(a) * radius;
    positions[i * 3 + 2] = 0;
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
 *  group so they rotate with the gimbal ring like a calibrated scale.
 *  Ticks extend outward from the ring (compass-bezel style) with three
 *  tiers — major / half / minor — and cardinal chevrons at N/E/S/W. */
function buildRingGraduations(
  radius: number,
  count: number,
  majorEvery: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const major = i % majorEvery === 0;
    const half = i % Math.max(1, Math.floor(majorEvery / 2)) === 0 && !major;
    // Mostly outward extension so the ticks read as a compass bezel
    // outside the ring line, with a tiny inward serif for crispness.
    const innerOff = major ? 0.018 : half ? 0.012 : 0.006;
    const outerOff = major ? 0.05 : half ? 0.03 : 0.016;
    const inner = radius - innerOff;
    const outer = radius + outerOff;
    positions.push(Math.cos(a) * inner, 0, Math.sin(a) * inner);
    positions.push(Math.cos(a) * outer, 0, Math.sin(a) * outer);
  }

  [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((a) => {
    const tangent = a + Math.PI / 2;
    const tipR = radius + 0.04;
    const baseR = radius + 0.018;
    const spread = 0.013;
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

/** Name tag for the occluder core mesh so the renderOrder traverse
 *  can skip it (the core must stay in its own sort bucket). */
const CORE_MESH_NAME = "substrate-occluder-core";

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

    // Cardinal bezel — flat XY-plane circle that contains the four
    // Encode cardinal labels (judgment / taste / craft / voice). The
    // labels sit at radius ~1.0 (see `getGyroPrimitiveLabelLocal`), the
    // bezel sits just outside at SUBSTRATE_GYRO_CARDINAL_RING_RADIUS so
    // the cluster reads as one grouped dial. Static, camera-facing.
    const cardinalRing = buildXyCircle(SUBSTRATE_GYRO_CARDINAL_RING_RADIUS, 96);

    const ringGraduations: THREE.BufferGeometry[] = [];
    for (let i = 0; i < SUBSTRATE_GYRO_GIMBAL_RINGS.length; i++) {
      const r = SUBSTRATE_GYRO_GIMBAL_RINGS[i].radius;
      // Each ring carries 36 majors (every 10° equivalent) so the
      // calibrated read is consistent across the three gimbals.
      const density = i === 0 ? 108 : i === 1 ? 90 : 72;
      const majorEvery = i === 0 ? 9 : i === 1 ? 9 : 6;
      ringGraduations.push(buildRingGraduations(r, density, majorEvery));
    }

    // v3.2 atmosphere shell — sits slightly OUTSIDE the dotted shell
    // so the fresnel rim-glow paints at the planet's silhouette. The
    // 1.15x multiplier was tuned so the halo reads as a soft band
    // outside the surface dots rather than overlapping them. 48 width
    // / 32 height segments is plenty for a smooth fresnel curve.
    const atmosphereRadius = dottedShellRadius * 1.15;
    const atmosphere = new THREE.SphereGeometry(atmosphereRadius, 48, 32);

    // Occluder core — just inside the dotted shell so the surface
    // dots paint on top of the body (see makeCoreMaterial).
    const core = new THREE.SphereGeometry(
      dottedShellRadius * SUBSTRATE_GYRO_CORE_RADIUS_MUL,
      48,
      32
    );

    return {
      meridians,
      parallels,
      equator,
      gimbalRings,
      particles,
      dottedShell,
      atmosphere,
      core,
      pivot,
      ticks,
      ticksMiddle,
      glyphs,
      cardinalRing,
      ringGraduations,
      meridianCount,
      parallelCount,
    };
  }, [globeRadius, globeDensity, particleDensity, reducedMotion]);

  const mats = useMemo(() => {
    const gold = new THREE.Color(COLOR_GOLD);
    return {
      globeDots: (() => {
        const m = makeParticleMaterial();
        m.uniforms.uPointSize.value = SUBSTRATE_GYRO_GLOBE_DOTS_POINT_SIZE;
        return m;
      })(),
      equator: makeDepthFadeLineMaterial(gold, SUBSTRATE_GYRO_GLOBE_EQUATOR_OPACITY),
      ring: makeDepthFadeLineMaterial(gold, SUBSTRATE_GYRO_RING_LINE_OPACITY),
      tick: makeDepthFadeLineMaterial(gold, SUBSTRATE_GYRO_TICK_OPACITY),
      graduation: makeDepthFadeLineMaterial(gold, SUBSTRATE_GYRO_RING_LINE_OPACITY * 0.95),
      symbol: makeDepthFadeLineMaterial(gold, SUBSTRATE_GYRO_SYMBOL_OPACITY),
      pivot: makeMeshMaterial(COLOR_GOLD, SUBSTRATE_GYRO_PIVOT_OPACITY),
      particle: makeParticleMaterial(),
      dottedShell: makeSurfaceShellMaterial(SUBSTRATE_GYRO_DOTTED_SHELL_POINT_SIZE),
      cardinalRing: makeDepthFadeLineMaterial(gold, SUBSTRATE_GYRO_CARDINAL_RING_OPACITY),
      // v3.2 atmosphere — fresnel rim-glow that fades in across the
      // EPILOGUE APPROACH band. Invisible in the parked corridor; at
      // peak landing it paints the planet's silhouette with a soft
      // gold halo (the Earth-reference atmosphere look).
      atmosphere: makeAtmosphereMaterial(),
      // Smoky occluder core — gives the sphere a translucent body so
      // scene content behind it reads dimmed instead of passing
      // through untouched.
      core: makeCoreMaterial(),
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
      geom.atmosphere.dispose();
      geom.core.dispose();
      geom.pivot.dispose();
      geom.ticks.dispose();
      geom.ticksMiddle.dispose();
      geom.glyphs.dispose();
      geom.cardinalRing.dispose();
      geom.ringGraduations.forEach((g) => g.dispose());
    };
  }, [geom]);

  useEffect(() => {
    return () => {
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [mats]);

  // Sort-bucket assignment for the occluder core (see the core
  // material's comment): every renderable of this instrument draws at
  // renderOrder 2 — AFTER the core (1), which itself draws after all
  // default scene content (0). Re-runs on any structural change that
  // mounts new renderables (geometry rebuild, ring count, particle
  // toggle).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.traverse((obj) => {
      if (obj.name === CORE_MESH_NAME) return;
      if (
        (obj as THREE.Points).isPoints ||
        (obj as THREE.Line).isLine ||
        (obj as THREE.Mesh).isMesh
      ) {
        obj.renderOrder = 2;
      }
    });
  }, [geom, effectiveRingCount, showParticles]);

  // Smoothed copy of the dotted-shell radius multiplier so we can
  // animate the BufferGeometry positions without thrashing the GPU
  // buffer every frame. Only re-write when the smoothed value drifts
  // far enough from the last write.
  const lastShellRadiusMul = useRef<number>(SUBSTRATE_GYRO_DOTTED_SHELL_RADIUS_MUL);
  // Snapshot of the original dotted-shell vertex positions at parked
  // mul — captured once on first frame so we can rescale them in
  // place without rebuilding the geometry.
  const dottedShellBase = useRef<Float32Array | null>(null);
  // Tilt groups for the three gimbal rings — captured by ref so we
  // can write `rotation` directly each frame via the unfold lerp.
  const ringTiltRefs = useRef<(THREE.Group | null)[]>([]);
  const ringScaleRefs = useRef<(THREE.Group | null)[]>([]);
  // Per-ring pivot scale group — wraps the four pivot diamonds so they
  // pop into place as their ring's draw-on completes (geometric
  // emergence; `mats.pivot.opacity` is fixed across the unfold). 2026-
  // 06-09 trim-path pass.
  const pivotScaleRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame((state, delta) => {
    const root = rootRef.current;
    const globeSpin = globeSpinRef.current;
    if (!root || !globeSpin) return;

    const { active, armed, docked, servicesAmbient, servicesAmbientLevel } =
      useDepthGatewayStore.getState().transform;
    // Smoothed epilogue scrub — same channel as the camera so the
    // shed + surface boost glide with the flight (2026-06-11).
    const epilogueProgress = getSmoothedEpilogueProgress();
    if (!active && !armed && !docked && !servicesAmbient) {
      root.visible = false;
      return;
    }

    // ADR-021 corridor-exit zoom-dissipate clock. While docked, the
    // dissipate clock (owned by `useCorridorExitScroll`, single-writer
    // rule) ramps 0→1 as #services scrolls up over the docked sphere.
    // We read the SMOOTHED dissipate (motionFollower) — the SAME channel
    // the camera + welded marks fly (2026-06-18 elegance pass) — so the
    // shell scatter + particle fade glide with the fly-into-sphere
    // instead of stepping under wheel input. At dissipate 0 all four
    // dissipate helpers return their identity values (1 / 1 / 1 / 1), so
    // the parked epilogue pose is byte-identical to its pre-ADR-021
    // self. When `!docked` the dissipate stays 0 so reverse-scroll
    // restores the held planet cleanly.
    //
    // ADR-021 addendum (services ambient hold): once the dock releases
    // and `servicesAmbient` engages, the dissipate clock is held at 1
    // so the surface helpers (dotted shell, globe grid, equator,
    // atmosphere) stay at 0 / their fully-scattered end-state, and the
    // interior cloud handoff to `servicesAmbientOpacityMultiplier`
    // (the `interiorMul` SELECT below) picks up at the same hold level
    // the dock dimmed to. Pinning dissipate to 1 here also keeps the
    // welded marks / camera path continuous because the motion follower
    // drives the same channel (see `MotionFollowerDriver`).
    const dissipate = docked ? getSmoothedDissipate() : servicesAmbient ? 1 : 0;
    const dissipateOp = dissipateOpacityMultiplier(dissipate);
    const dissipateCoreOp = dissipateCoreMultiplier(dissipate);
    const dissipateShellMul = dissipateShellScatter(dissipate);
    const dissipateAtmoEnv = dissipateAtmosphereEnvelope(dissipate);
    // Interior cloud (ambient particles inside the volume) — ONE
    // continuous "inside the sphere" envelope across the dock dissipate
    // and the services ambient hold (ADR-021 addendum; 2026-06-19 cut
    // fix). The two phases are SELECTED, never multiplied:
    //
    //   - Dock: `dissipateInteriorOpacityMultiplier(dissipate,
    //     SERVICES_AMBIENT_HOLD_LEVEL)` dims the cloud from full (1) down
    //     to the hold level across PARTICLE_FADE. The floor is raised
    //     from the old 0.18 to SERVICES_AMBIENT_HOLD_LEVEL so the inside
    //     of the sphere stays clearly visible (the user must still read
    //     a particle bed as the surface scatters away; since 2026-07-05
    //     that bed is deliberately STATIC — see the spin freeze below).
    //   - Ambient: `servicesAmbientOpacityMultiplier(level)` holds at the
    //     SAME hold level (level 1) then fades to 0 across the continuum
    //     approach.
    //
    // dock-end (dissipate → 1) == ambient-start (level 1) ==
    // SERVICES_AMBIENT_HOLD_LEVEL, so the dock RELEASE is C0-continuous —
    // the interior cloud no longer collapses the instant the dock
    // detaches (the previous code multiplied BOTH multipliers, dropping
    // the cloud to ~0.18 × 0.48 at the boundary). Outside the exit this
    // is the plain dock path; at dissipate 0 it returns 1 (identity), so
    // the parked epilogue pose is byte-identical to its pre-ADR-021 self.
    const interiorMul = servicesAmbient
      ? servicesAmbientOpacityMultiplier(servicesAmbientLevel)
      : dissipateInteriorOpacityMultiplier(dissipate, SERVICES_AMBIENT_HOLD_LEVEL);
    // Surface particles (dotted shell, globe dots, equator) — ADR-021
    // follow-up (2026-06-19). The original dissipate faded these fully
    // to 0 so the sphere dissolved into an empty view. The camera then
    // parks inside the radially-scattered shell for the whole Services
    // section, so an empty view read as "the particles disappeared".
    // Hold the surface at a low floor (continuous, SELECTED not
    // multiplied — same pattern as the interior cloud): the dock tail
    // settles the surface from full → SURFACE_LEVEL, and the ambient
    // hold keeps it there (level 1) then fades to 0 as #continuum
    // approaches. The scattered shell at this floor reads as a sparse
    // particle BED filling the frame from inside the sphere, behind the
    // Services content, for the entire section. At dissipate 0 this is
    // identity (×1), so the parked / pre-exit epilogue pose is
    // byte-identical to its pre-ADR-021 self.
    const surfaceMul = servicesAmbient
      ? servicesAmbientOpacityMultiplier(servicesAmbientLevel, SERVICES_AMBIENT_SURFACE_LEVEL)
      : dissipateInteriorOpacityMultiplier(dissipate, SERVICES_AMBIENT_SURFACE_LEVEL);

    // Temporally-smoothed reveals (motionFollower) — the gimbal's
    // ring cascade, globe Y-bloom, wrap-spin, and shell settle always
    // unfurl over wall-clock time instead of compressing into a few
    // frames under a fast scroll.
    const layers = getSmoothedAccretionLayers();
    // Gimbal-sphere reveal, optionally lagged against the shared
    // `layers.substrate` accretion envelope (`SUBSTRATE_GYRO_REVEAL_LAG`,
    // currently 0 → identity). In the "crosshair unfurls into the armillary"
    // model the bold DOM SVG crosshair is the front mark while these rings
    // unfurl FROM its plane behind it, so the sphere unfolds on its normal
    // clock (no lag) and the LATE SVG → core handoff is what hides the medium
    // swap. The lag stays a tunable knob: a positive value delays the unfurl
    // start if the sphere ever needs to trail the crosshair more. Remap
    // settles to 1 at substrate = 1, so Encode/Build + the parked Navigate
    // composition are byte-identical at any lag value. (The shared envelope
    // itself is untouched — title gate, apparent-size boost, and the mark
    // handoff all read `layers.substrate` directly.)
    const reveal = clamp01(
      (layers.substrate - SUBSTRATE_GYRO_REVEAL_LAG) / (1 - SUBSTRATE_GYRO_REVEAL_LAG)
    );
    if (reveal <= EMERGE_EPSILON) {
      root.visible = false;
      return;
    }
    root.visible = true;

    // Epilogue v3 — as we leave the Build park the gyro's INSTRUMENT
    // affordances (gimbal armillary rings, ticks, graduations, compass
    // symbols, pivots, cardinal ring) fade out on BUILD_OUT so only
    // the wireframe GLOBE remains. By APPROACH the substrate has
    // stopped reading as a flight instrument and started reading as
    // a planet.
    const buildOutFade = 1 - epilogueBand(epilogueProgress, "BUILD_OUT");

    const dt = Math.min(0.1, delta);
    const { idleSpeed } = useGyroLabStore.getState();

    // 2026-06-08 reveal-polish: replace shellWrapEmerge contract with a
    // staggered fold-around-the-mark unfold. Subtle root scale, globe
    // Y-bloom, decaying wrap-spin, dotted-shell inward settle, per-ring
    // tilt-open + small landing overshoot.
    const unfold = gyroAssemblyUnfold(reveal);
    root.scale.setScalar(unfold.rootScale);

    const opacityCalm = 1 - (1 - SUBSTRATE_GYRO_ENCODE_OPACITY_FLOOR) * layers.orbits;
    const presence = unfold.presence * opacityCalm;

    const lineOpacity = (base: number) => base * presence;

    // v3.2 planet-density boost — as the substrate grows into a
    // planet during APPROACH, scale the surface point dots' SIZE
    // and OPACITY up so the sphere reads as a dense, glowing planet
    // surface rather than a faint wireframe at 3x scale. The boost
    // tracks the APPROACH band so it ramps with the grow; before
    // APPROACH the values are byte-identical to the parked corridor.
    const approachT = epilogueBand(epilogueProgress, "APPROACH");
    // `interiorHeld` treats the dock fly-in and the post-dock services
    // ambient hold as ONE regime (defined here so the surface boosts
    // below can bridge the seam too). ADR-021 follow-up: the surface
    // particle bed now persists through the ambient hold, so its
    // visibility/size boosts must stay warm across the dock release —
    // gating them on `docked` alone stepped the bed dimmer + smaller
    // exactly when the hold began.
    const interiorHeld = docked || servicesAmbient;
    // Size multiplier: 1 at parked, ~1.8 at peak. Combined with the
    // 3x physical grow, surface dots end up ~5.4x as big in screen
    // space as the planet ramps up. Bridged across the dock release so
    // the surface bed stays continuous into the ambient hold.
    const dockVisibilityBoost = interiorHeld ? 1.65 : 1;
    const pointSizeBoost = (1 + approachT * 0.8) * (interiorHeld ? 1.28 : 1);
    // Opacity multiplier: 1 at parked, ~1.5 at peak (capped at 1
    // via Math.min so we don't oversaturate).
    const opacityBoost = 1 + approachT * 0.55;
    // ADR-021 addendum (services ambient hold): keep the dock-era
    // interior boosts WARM through the ambient hold so the interior
    // cloud's brightness AND point size stay continuous across the dock
    // release. The dock visibility/size boosts are gated on `docked`,
    // which flips false at the dock→ambient boundary — without bridging
    // them the cloud would jump dimmer + smaller exactly when the hold
    // begins (a second contributor to the "particles vanish suddenly"
    // cut). `interiorHeld` treats dock and ambient as one regime; the
    // interior opacity boost simply reuses `opacityBoost` (which is a
    // function of the epilogue scrub, already saturated at the park, so
    // it is continuous across the boundary on its own).
    const interiorVisibilityBoost = interiorHeld ? 1.65 : 1;
    const interiorPointSizeBoost = (1 + approachT * 0.8) * (interiorHeld ? 1.28 : 1);

    // GLOBE materials — kept through the epilogue (these BECOME the
    // planet surface grid + atmospheric particles). The dissipate fade
    // is split: SURFACE elements (great-circle grid + equator + dotted
    // shell) ride `dissipateOp` to 0 so the silhouette dissolves, while
    // the INTERIOR ambient cloud (`mats.particle`) rides the continuous
    // `interiorMul` envelope to a muted hold level so the volume keeps
    // reading as a soft particulate haze behind the Services copy as
    // the camera flies through it. Identity (×1) at dissipate 0 so the
    // parked epilogue pose is byte-identical to its pre-dissipate self.
    mats.globeDots.uniforms.uOpacity.value =
      Math.min(
        1,
        SUBSTRATE_GYRO_GLOBE_DOTS_OPACITY * presence * opacityBoost * dockVisibilityBoost
      ) * surfaceMul;
    mats.globeDots.uniforms.uPointSize.value =
      SUBSTRATE_GYRO_GLOBE_DOTS_POINT_SIZE * pointSizeBoost;
    mats.globeDots.uniforms.uPixelRatio.value = state.viewport.dpr;
    mats.equator.uniforms.uOpacity.value =
      Math.min(1, lineOpacity(SUBSTRATE_GYRO_GLOBE_EQUATOR_OPACITY) * dockVisibilityBoost) *
      surfaceMul;
    mats.particle.uniforms.uPixelRatio.value = state.viewport.dpr;
    // Interior cloud opacity. `interiorMul` is the single continuous
    // dock→ambient envelope (full → hold during the dock, hold → 0
    // during the ambient fade); the boosts are bridged across the dock
    // release via `interiorHeld`, so the cloud's brightness is
    // C0-continuous and never cuts out at the seam.
    mats.particle.uniforms.uOpacity.value =
      Math.min(
        1,
        SUBSTRATE_GYRO_PARTICLE_OPACITY * presence * opacityBoost * interiorVisibilityBoost
      ) * interiorMul;
    mats.particle.uniforms.uPointSize.value = SUBSTRATE_GYRO_POINT_SIZE * interiorPointSizeBoost;
    mats.dottedShell.uniforms.uPixelRatio.value = state.viewport.dpr;
    mats.dottedShell.uniforms.uOpacity.value =
      Math.min(
        1,
        SUBSTRATE_GYRO_DOTTED_SHELL_OPACITY * presence * opacityBoost * dockVisibilityBoost
      ) * surfaceMul;
    mats.dottedShell.uniforms.uPointSize.value =
      SUBSTRATE_GYRO_DOTTED_SHELL_POINT_SIZE * pointSizeBoost;

    // v3.2 atmosphere rim-glow: fades in across APPROACH so the
    // planet's silhouette gets a soft halo as the substrate
    // transitions from "instrument" to "planet". Capped at 0.6 so
    // it sits as a gentle atmospheric ring, not a bloom that drowns
    // the dotted-shell surface.
    //
    // ADR-021 dissipate: `dissipateAtmoEnv` BLOOMS the rim to ~1.8×
    // its parked value at dissipate 0.35, then fades it to 0 by 0.92.
    // The cap is lifted to 1 during the bloom so the burst reads as
    // an actual flare against the scattering particles. Envelope is
    // 1 at dissipate 0 so the parked epilogue value is preserved.
    mats.atmosphere.uniforms.uOpacity.value = Math.min(1, approachT * 0.6 * dissipateAtmoEnv);

    // Occluder core — anti-pop presence only; the geometric emergence
    // comes free from the globe-spin group's Y-bloom (the core
    // flattens to a dark lens at reveal 0 and inflates into a ball as
    // the cage opens). Solidifies a touch across APPROACH so the
    // planet reads more opaque than the parked instrument.
    //
    // ADR-021 dissipate: `dissipateCoreOp` sheds the core early
    // (CORE_SHED band 0→0.42) so the scattering surface dots never
    // reveal a hard silhouette disc behind them. Identity at
    // dissipate 0.
    mats.core.uniforms.uOpacity.value =
      Math.min(0.78, SUBSTRATE_GYRO_CORE_OPACITY * presence * (1 + approachT * 0.4)) *
      dissipateCoreOp;

    // INSTRUMENT materials — fade out on BUILD_OUT so the substrate
    // sheds its flight-instrument vocabulary before we approach.
    // They are already 0 by the time the dissipate engages
    // (BUILD_OUT.end = 0.22 of the EPILOGUE clock; the dock only
    // engages at epilogueProgress >= 0.72), so no extra dissipate
    // multiply is needed here — but mirroring `dissipateOp` is cheap
    // safety in case future tuning moves BUILD_OUT later.
    mats.ring.uniforms.uOpacity.value =
      lineOpacity(SUBSTRATE_GYRO_RING_LINE_OPACITY) * buildOutFade * dissipateOp;
    mats.tick.uniforms.uOpacity.value =
      lineOpacity(SUBSTRATE_GYRO_TICK_OPACITY) * buildOutFade * dissipateOp;
    mats.graduation.uniforms.uOpacity.value =
      lineOpacity(SUBSTRATE_GYRO_RING_LINE_OPACITY * 0.95) * buildOutFade * dissipateOp;
    mats.symbol.uniforms.uOpacity.value =
      lineOpacity(SUBSTRATE_GYRO_SYMBOL_OPACITY) * buildOutFade * dissipateOp;
    mats.pivot.opacity = SUBSTRATE_GYRO_PIVOT_OPACITY * presence * buildOutFade * dissipateOp;
    mats.cardinalRing.uniforms.uOpacity.value =
      lineOpacity(SUBSTRATE_GYRO_CARDINAL_RING_OPACITY) * buildOutFade * dissipateOp;

    // Globe spin: keep the idle polar drift; add the decaying wrap-spin
    // on top so the meridians/parallels appear to swirl around the
    // mark during the unfold, then settle once reveal saturates.
    //
    // ADR-021 follow-up (2026-06-19; extended to the dock 2026-07-05):
    // from the moment the dock engages — through the dissipate AND the
    // services ambient hold — the sphere is a STATIC backdrop behind the
    // scrolling Services content. Freeze the idle spin for BOTH regimes:
    // the globe dot-rings and inside-sphere particle bed rotating behind
    // readable copy was a reported motion-sickness trigger. The spin is
    // simply not advanced (rotation.y holds wherever the corridor left
    // it), so there is no pop — the slow idle drift just stops.
    if (motionFrozen) {
      globeSpin.rotation.y = 0.4;
    } else if (!servicesAmbient && !docked) {
      const extra = unfold.wrapSpinExtra * idleSpeed * dt;
      globeSpin.rotation.y += SUBSTRATE_GYRO_GLOBE_SPIN * idleSpeed * dt + extra;
    }
    // Globe Y-bloom: collapse to a near-disc at reveal 0 and bloom
    // back to a sphere as the cage opens.
    globeSpin.scale.set(1, unfold.globeY, 1);

    // Ring unfold: tilt + scale per gimbal ring with petalStagger.
    // 2026-06-09 trim-path pass: each ring's `setDrawRange` rides the
    // SAME tiltT (the linear stagger) so the line draws on as the ring
    // tilts open — instrument-style "booting" rather than fading in.
    // Graduations + pivot diamonds + the per-ring tick stripes all ride
    // the same stagger so each gimbal reads as one cohesive cassette.
    for (let i = 0; i < effectiveRingCount; i++) {
      const tiltNode = ringTiltRefs.current[i];
      const scaleNode = ringScaleRefs.current[i];
      const spinNode = ringSpinRefs.current[i];
      const pivotScaleNode = pivotScaleRefs.current[i];
      const axis = SUBSTRATE_GYRO_GIMBAL_RINGS[i];
      const ring = gyroRingUnfold(reveal, i, effectiveRingCount);
      // Tilt: lerp from a near-flat start toward the parked tilt.
      const floor = SUBSTRATE_GYRO_UNFOLD_RING_TILT_FLOOR;
      const tiltScalar = floor + (1 - floor) * ring.tiltT;
      if (tiltNode) {
        tiltNode.rotation.set(
          axis.tilt[0] * tiltScalar,
          axis.tilt[1] * tiltScalar,
          axis.tilt[2] * tiltScalar
        );
      }
      if (scaleNode) scaleNode.scale.setScalar(ring.scale);
      // Frozen from dock engage through the services ambient hold so the
      // gimbal bed is a static backdrop while Services content scrolls
      // over it (see the globe-spin freeze above).
      if (spinNode && !motionFrozen && !servicesAmbient && !docked) {
        spinNode.rotation.y += axis.spin * idleSpeed * dt;
      }
      // Trim-path draw-on: the gimbal ring is a `<line>` over a
      // closed-loop point list (first vertex == last). setDrawRange
      // sweeps the polyline angularly so the ring DRAWS ITSELF as it
      // tilts open. tiltT is monotone in [0,1] and matches the
      // ring's tilt animation — same window, geometric reveal.
      const ringGeom = geom.gimbalRings[i];
      if (ringGeom) {
        const total = ringGeom.attributes.position.count;
        ringGeom.setDrawRange(0, Math.max(0, Math.floor(ring.tiltT * total)));
      }
      const gradGeom = geom.ringGraduations[i];
      if (gradGeom) {
        const total = gradGeom.attributes.position.count;
        // lineSegments needs PAIRS of vertices — round down to even.
        const n = Math.max(0, Math.floor(ring.tiltT * total));
        gradGeom.setDrawRange(0, n - (n % 2));
      }
      // Pivot diamonds pop in once the ring has nearly drawn — staged
      // emerge that lets the ring read first, then the pivots stamp
      // the four cardinal positions. petalEmerge curve compresses the
      // tail of the ring's tiltT so the pivots scale 0 → 1 across the
      // last ~30% of the ring's draw.
      if (pivotScaleNode) {
        const pivotT = Math.max(0, (ring.tiltT - 0.7) / 0.3);
        const pivotS = pivotT * pivotT * (3 - 2 * pivotT);
        pivotScaleNode.scale.setScalar(pivotS);
      }
    }

    // Per-element draw-on for the rest of the instrument. All driven
    // off the SAME smoothed `reveal` so the cassette draws in one
    // continuous unfold instead of separate fade-ins.

    // Equator — headline horizon line, draws first so the globe has a
    // visible "deck" before the meridians/parallels follow.
    const equatorGeom = geom.equator;
    if (equatorGeom) {
      const total = equatorGeom.attributes.position.count;
      const t = clamp01(reveal / 0.32);
      equatorGeom.setDrawRange(0, Math.max(0, Math.floor(t * total)));
    }

    // Cardinal bezel — the flat XY-plane dial that contains the four
    // Encode labels. Draws across the FIRST 45% of the substrate
    // window so the dial is fully closed by the time the cardinal
    // labels' Encode reveal even begins to ramp.
    const cardinalGeom = geom.cardinalRing;
    if (cardinalGeom) {
      const total = cardinalGeom.attributes.position.count;
      const t = clamp01(reveal / 0.45);
      cardinalGeom.setDrawRange(0, Math.max(0, Math.floor(t * total)));
    }

    // Meridians + parallels — each rides its own petalStagger inside
    // the substrate window so the globe LACES UP great-circle by
    // great-circle (cascade) instead of all wires flickering on at
    // once. The shader's depth-fade keeps the back hemisphere quiet
    // so the read is "front meridian draws, back follows behind it".
    for (let i = 0; i < geom.meridians.length; i++) {
      const g = geom.meridians[i];
      if (!g) continue;
      const total = g.attributes.position.count;
      const t = petalStagger(reveal, i, geom.meridians.length, 0.7);
      g.setDrawRange(0, Math.max(0, Math.floor(t * total)));
    }
    for (let i = 0; i < geom.parallels.length; i++) {
      const g = geom.parallels[i];
      if (!g) continue;
      const total = g.attributes.position.count;
      const t = petalStagger(reveal, i, geom.parallels.length, 0.7);
      g.setDrawRange(0, Math.max(0, Math.floor(t * total)));
    }

    // Sphere cloud — Fibonacci spiral order means a setDrawRange
    // sweep traces a continuous spiral from one pole to the other,
    // filling the surface in. Sweeps across the first 70% of reveal.
    const particleGeom = geom.particles;
    if (particleGeom) {
      const total = particleGeom.attributes.position.count;
      const t = clamp01(reveal / 0.7);
      particleGeom.setDrawRange(0, Math.max(0, Math.floor(t * total)));
    }

    // Dotted shell — built band-by-band south pole → north pole, so a
    // `setDrawRange` sweep walks latitude bands like a planet
    // rendering itself. Sweeps with the substrate reveal directly so
    // the full surface is in by the Navigate park.
    const shellGeom = geom.dottedShell;
    if (shellGeom) {
      const total = shellGeom.attributes.position.count;
      const t = reveal;
      shellGeom.setDrawRange(0, Math.max(0, Math.floor(t * total)));
    }

    // Per-ring tick stripes — `ticks` belongs to ring 0, `ticksMiddle`
    // to ring 1, `glyphs` to ring 2. Tie each to its corresponding
    // ring's tiltT so the ticks sweep around the dial as the ring
    // tilts open. lineSegments → round to pairs.
    const draws = [
      { g: geom.ticks, idx: 0 },
      { g: geom.ticksMiddle, idx: 1 },
      { g: geom.glyphs, idx: 2 },
    ];
    for (const { g, idx } of draws) {
      if (!g || idx >= effectiveRingCount) {
        if (g) g.setDrawRange(0, 0);
        continue;
      }
      const ring = gyroRingUnfold(reveal, idx, effectiveRingCount);
      const total = g.attributes.position.count;
      const n = Math.max(0, Math.floor(ring.tiltT * total));
      g.setDrawRange(0, n - (n % 2));
    }

    // Dotted shell radius lerp: rescale vertex positions in-place from
    // the captured `dottedShellBase` snapshot. We only re-upload when
    // the smoothed radius mul drifts > 0.5% from the last write so the
    // GPU buffer isn't churned every frame.
    //
    // ADR-021 dissipate: `dissipateShellMul` pushes the shell outward
    // (1 + AMP * dissipate) so the cassette geometry stays put but the
    // surface dots scatter radially as the camera flies in. Composes
    // multiplicatively on top of the existing `unfold.shellRadiusMul`,
    // so dissipate 0 is byte-identical to the pre-ADR-021 write.
    const targetShellMul = unfold.shellRadiusMul * dissipateShellMul;
    const lastMul = lastShellRadiusMul.current;
    if (Math.abs(targetShellMul - lastMul) > 0.005 || dottedShellBase.current === null) {
      const attr = geom.dottedShell.getAttribute("position") as THREE.BufferAttribute | undefined;
      if (attr) {
        const arr = attr.array as Float32Array;
        if (dottedShellBase.current === null) {
          // First frame — snapshot the parked positions (at
          // SUBSTRATE_GYRO_DOTTED_SHELL_RADIUS_MUL by construction).
          dottedShellBase.current = new Float32Array(arr.length);
          dottedShellBase.current.set(arr);
        }
        const base = dottedShellBase.current;
        const k = targetShellMul; // already relative to parked mul (1 = parked)
        for (let i = 0; i < arr.length; i++) arr[i] = base[i] * k;
        attr.needsUpdate = true;
        lastShellRadiusMul.current = targetShellMul;
      }
    }
  });

  return (
    <group ref={rootRef} visible={false}>
      {/* Globe spin group — meridians, parallels, equator, particles */}
      <group ref={globeSpinRef}>
        {/* Smoky occluder core — the sphere's translucent BODY.
            Lives inside the spin group so the unfold's Y-bloom
            (disc → sphere) emerges it geometrically; the spin itself
            is invisible on a uniform ball. renderOrder 1 draws it
            after all default scene content (which it dims); the
            traverse below lifts every other instrument renderable to
            renderOrder 2 so the bright elements stay on top. */}
        <mesh
          name={CORE_MESH_NAME}
          geometry={geom.core}
          material={mats.core}
          renderOrder={1}
          frustumCulled={false}
        />
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

        {/* `<line>` (LINE_STRIP) instead of `<lineLoop>` so the
            geometry's `setDrawRange` sweep actually trims the visible
            arc — `lineLoop` always closes the ring on the GPU. The
            buildGreatCircle list has first vertex == last vertex so
            the closed-loop visual is preserved at draw progress 1. */}
        <threeLine geometry={geom.equator} material={mats.equator} frustumCulled={false} />
        {showParticles && (
          <points geometry={geom.particles} material={mats.particle} frustumCulled={false} />
        )}
      </group>

      {/* Dotted shell — surface dots with per-dot facing fade so the
          gimbal cage reads as a real 3D sphere shell (front bright,
          back hemisphere fades to near zero). */}
      <points geometry={geom.dottedShell} material={mats.dottedShell} frustumCulled={false} />

      {/* v3.2 atmosphere — fresnel rim-glow on a sphere just outside
          the dotted shell. Invisible in the parked corridor (uOpacity
          starts at 0); fades in across the EPILOGUE APPROACH band as
          the substrate transitions into a planet. Back-faced +
          additive blending so it reads as a halo at the silhouette,
          not a sphere that occludes the surface. */}
      <mesh geometry={geom.atmosphere} material={mats.atmosphere} frustumCulled={false} />

      <lineSegments geometry={geom.ticks} material={mats.tick} frustumCulled={false} />
      <lineSegments geometry={geom.ticksMiddle} material={mats.tick} frustumCulled={false} />
      <lineSegments geometry={geom.glyphs} material={mats.symbol} frustumCulled={false} />

      {/* Cardinal bezel — a flat XY-plane ring that contains the four
          Encode cardinal labels (judgment / taste / craft / voice). The
          labels (DOM, projected at world radius ~1.0) sit just inside
          this ring at ~1.08, so the cluster reads as one grouped dial.
          `<line>` (LINE_STRIP) so the trim-path draw-on actually shows. */}
      <threeLine geometry={geom.cardinalRing} material={mats.cardinalRing} frustumCulled={false} />

      {/* Gimbal cage — counter-rotating rings + pivot diamonds.
          Hierarchy per ring (outer → inner):
            tilt  — `ringTiltRefs[i]`: tilt-lerped each frame by
                     `gyroRingUnfold(reveal)` from near-coplanar to the
                     ring's parked tilt (`axis.tilt`).
            scale — `ringScaleRefs[i]`: small landing overshoot scale
                     so each ring snaps into place as it opens.
            spin  — `ringSpinRefs[i]`: idle counter-rotation (unchanged). */}
      {SUBSTRATE_GYRO_GIMBAL_RINGS.slice(0, effectiveRingCount).map((axis, ringIdx) => (
        <group
          key={`gimbal-ring-${ringIdx}`}
          ref={(node) => {
            ringTiltRefs.current[ringIdx] = node;
          }}
        >
          <group
            ref={(node) => {
              ringScaleRefs.current[ringIdx] = node;
            }}
          >
            <group
              ref={(node) => {
                ringSpinRefs.current[ringIdx] = node;
              }}
            >
              {/* `<line>` (LINE_STRIP) so `setDrawRange` actually
                  trims the visible arc as the ring tilts open. The
                  great-circle geometry's first vertex == last so the
                  ring still closes at draw progress 1. */}
              <threeLine
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
              {/* Pivot diamonds at cardinal positions on each ring.
                  Wrapped in a scale group so they pop in geometrically
                  as the ring's draw-on completes (Principle 4: emerge
                  via geometry, never via opacity). */}
              <group
                ref={(node) => {
                  pivotScaleRefs.current[ringIdx] = node;
                }}
                scale={0}
              >
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
          </group>
        </group>
      ))}
    </group>
  );
}
