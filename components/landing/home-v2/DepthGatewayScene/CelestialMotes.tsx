"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { smoothstep, useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getBuildApproachFade, getThoughtformBootEnvelope } from "./sceneGeom";

/**
 * CelestialMotes — small sphere-shaped particle clusters that drift
 * through the latent corridor like planetoids passing the camera.
 *
 * Inspired by Star Atlas' "Depths of the universe" beat, where the
 * particle planet flies past the viewer as the camera travels. This
 * is the SHAPE-AWARE companion to `LatentFieldTunnel`:
 *
 *   - LatentFieldTunnel  : abstract field of latent points + edges +
 *                          token motes. The substrate.
 *   - CelestialMotes     : a small set of identifiable spherical
 *                          clusters with parallax depth, slow self-
 *                          rotation, and per-mote colour. The
 *                          celestial objects.
 *
 * Hard motion rule: motes ONLY move when the visitor scrolls. They
 * sit perfectly still at rest. This is the same contract enforced
 * by `LatentFieldTunnel` (AMBIENT_DRIFT = 0).
 *
 * Composition rules:
 *   - Each mote is a Fibonacci sphere of ~28 points so the
 *     silhouette reads as a discrete object, not loose dust.
 *   - Per-mote colour tint (cool dawn → warm gold) gives variety
 *     across the field without leaving the palette.
 *   - Slow per-mote Y rotation makes the spheres feel alive while
 *     drifting, even at rest there's the option of a tiny spin —
 *     but rotation is gated on `active` so out-of-corridor frames
 *     stay completely silent.
 *   - Motes spawn FURTHER from the optical axis than latent points
 *     (a wider `CENTRE_AVOID`) so they consistently fly past the
 *     brandmark rather than through it.
 */

// ─── Density (per-viewport) ─────────────────────────────────────

const MOTE_COUNT_DESKTOP = 12;
const MOTE_COUNT_TABLET = 8;
const MOTE_COUNT_MOBILE = 0;

/** Points per mote. 40 reads as a coherent sphere silhouette at
 *  typical viewing distances while staying lightweight (~480
 *  vertices total for the desktop tier). */
const POINTS_PER_MOTE = 40;

// ─── Spatial constants ──────────────────────────────────────────

/** Cone half-angle scaling. Slightly tighter than the latent field
 *  so motes stay closer to the corridor's optical axis — Star Atlas-
 *  style planetoids drift PAST the camera, not from the edges. */
const CONE_TAN_X = 0.85;
const CONE_TAN_Y = 0.55;

/** Z range — same depth as the latent field so motes share its
 *  parallax. */
const FAR_Z = -28;
const NEAR_Z = 9;

const PASS_MARGIN = 1.5;

/** Centre-avoid radius (fraction of cone radius). Higher than the
 *  latent field's avoid (0.06) — motes are larger objects and need
 *  to clear the brandmark to read as "passing by" rather than
 *  "overlapping". Tuned low enough that motes consistently fly past
 *  WITHIN the visible viewport rather than orbiting at the rails. */
const CENTRE_AVOID = 0.18;

/** Per-mote sphere radius range (world units). Tuned so a typical
 *  mote at mid-tunnel depth projects to a clearly identifiable
 *  cluster rather than a few sub-pixel specks. */
const MOTE_RADIUS_MIN = 0.28;
const MOTE_RADIUS_MAX = 0.85;

/** Per-mote spin range (radians / sec). Always positive but
 *  sign-randomised below so motes counter-rotate for visual
 *  interest. */
const MOTE_SPIN_MIN = 0.05;
const MOTE_SPIN_MAX = 0.22;

/** Visibility band (world units from the camera). */
const VISIBLE_NEAR = 0.6;
const VISIBLE_FAR = 26;

// ─── Motion + alpha envelopes ───────────────────────────────────

const SCROLL_GAIN = 28;
const ALPHA_RESPONSE = 5;

const AMBIENT_OPACITY = 0.7;
const PEAK_OPACITY = 1.0;
const BOOT_LIFT = 0.2;

/** Peripheral screen-space fade window. Motes near the optical axis
 *  paint at full alpha; motes near the screen corners soften but
 *  NEVER fully vanish — they ARE the celestial objects flying past,
 *  the whole point is that the visitor sees them streak by. The
 *  shader applies a floor (see EDGE_FADE_FLOOR in the vertex shader)
 *  so peripheral motes stay visible at a dimmer alpha. */
const EDGE_FADE_START = 0.85;
const EDGE_FADE_END = 1.5;
/** Minimum edge-fade alpha. Motes at the viewport corner still
 *  paint at this fraction of their full alpha. */
const EDGE_FADE_FLOOR = 0.45;

// ─── Colour palette ─────────────────────────────────────────────

const COOL_COLOR = new THREE.Color("#cfc5af");
const WARM_COLOR = new THREE.Color("#caa554");

// ─── Helpers ────────────────────────────────────────────────────

function pickCount(desktop: number, tablet: number, mobile: number): number {
  if (typeof window === "undefined") return desktop;
  const w = window.innerWidth;
  if (w < 760) return mobile;
  if (w < 1280) return tablet;
  return desktop;
}

/** Build local-frame point offsets for one mote using a Fibonacci
 *  sphere distribution. Output is `[x0, y0, z0, x1, y1, z1, ...]`
 *  on the sphere surface at the given radius. */
function fibonacciSphereOffsets(
  n: number,
  radius: number,
  out: Float32Array,
  offset: number
): void {
  const phi = Math.PI * (Math.sqrt(5) - 1);
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;
    out[offset + i * 3] = Math.cos(theta) * r * radius;
    out[offset + i * 3 + 1] = y * radius;
    out[offset + i * 3 + 2] = Math.sin(theta) * r * radius;
  }
}

/** Sample a mote centre XY inside the cone at the given camera
 *  distance, OUTSIDE the centre-avoid radius. */
function spawnMoteXY(camDist: number, out: [number, number]): void {
  const band = 1 - CENTRE_AVOID;
  // Uniform sampling across the annulus so motes don't pile up at
  // the inner ring — they're meant to feel scattered.
  const r = (CENTRE_AVOID + Math.sqrt(Math.random()) * band) * camDist;
  const theta = Math.random() * Math.PI * 2;
  out[0] = Math.cos(theta) * r * CONE_TAN_X;
  out[1] = Math.sin(theta) * r * CONE_TAN_Y;
}

// ─── Shaders ────────────────────────────────────────────────────

const motesVertex = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
uniform vec3 uCameraPos;
uniform float uVisibleNear;
uniform float uVisibleFar;
uniform float uEdgeFadeStart;
uniform float uEdgeFadeEnd;
uniform float uEdgeFadeFloor;

attribute float aSeed;
attribute float aTint;
attribute float aRank;

varying float vAlpha;
varying float vSeed;
varying float vTint;
varying float vRank;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = distance(position, uCameraPos);

  float farFade = smoothstep(uVisibleFar, uVisibleFar - 4.0, dist);
  float nearFade = smoothstep(uVisibleNear, uVisibleNear + 1.2, dist);

  gl_Position = projectionMatrix * mv;
  vec2 ndc = gl_Position.xy / max(gl_Position.w, 0.0001);
  // Soft edge fade with a floor — peripheral motes dim but stay
  // visible so the visitor sees them streak by toward the periphery.
  float edgeFadeRaw = smoothstep(uEdgeFadeEnd, uEdgeFadeStart, length(ndc));
  float edgeFade = mix(uEdgeFadeFloor, 1.0, edgeFadeRaw);

  vAlpha = farFade * nearFade * edgeFade;
  vSeed = aSeed;
  vTint = aTint;
  vRank = aRank;

  // Rank inside the mote — a few brighter "anchor" points per mote
  // give each sphere a sense of internal structure (some dots stand
  // out, others recede).
  float rankSize = mix(0.85, 1.6, aRank);
  // Closer motes get noticeably larger points so the parallax fly-
  // past has weight; far motes stay compact.
  float sizeFactor = clamp(7.5 / max(0.5, dist), 0.55, 3.0);
  gl_PointSize = uPointSize * uPixelRatio * sizeFactor * rankSize;
}
`;

const motesFragment = /* glsl */ `
uniform vec3 uColorCool;
uniform vec3 uColorWarm;
uniform float uOpacity;

varying float vAlpha;
varying float vSeed;
varying float vTint;
varying float vRank;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  // Tight bright core + smooth halo. Anchor points get a slightly
  // larger core so they're the visibly bright dots inside each
  // sphere.
  float coreRadius = mix(0.10, 0.18, vRank);
  float core = smoothstep(coreRadius, 0.0, d);
  float halo = smoothstep(0.5, 0.14, d);
  float soft = max(core, halo * 0.55);
  float jitter = 0.7 + fract(vSeed * 41.0) * 0.3;
  vec3 col = mix(uColorCool, uColorWarm, vTint);
  float alpha = soft * vAlpha * uOpacity * jitter;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(col, alpha);
}
`;

// ─── Component ──────────────────────────────────────────────────

export function CelestialMotes() {
  const { camera } = useThree();
  const pointsRef = useRef<THREE.Points>(null);
  const lastTime = useRef<number>(-1);
  const smoothedAlpha = useRef<number>(0);

  const moteCount = useMemo(
    () => pickCount(MOTE_COUNT_DESKTOP, MOTE_COUNT_TABLET, MOTE_COUNT_MOBILE),
    []
  );
  const totalPoints = moteCount * POINTS_PER_MOTE;

  // Per-mote state lives in plain TypedArrays we mutate every
  // frame — `position` is recomputed from this state + the static
  // local offsets so the buffer attribute stays the single source
  // of truth seen by WebGL.
  const moteState = useMemo(() => {
    if (moteCount === 0) return null;
    const centres = new Float32Array(moteCount * 3);
    const radii = new Float32Array(moteCount);
    const spins = new Float32Array(moteCount);
    const angles = new Float32Array(moteCount);
    const tints = new Float32Array(moteCount);
    const tmpXY: [number, number] = [0, 0];
    for (let m = 0; m < moteCount; m++) {
      const z = NEAR_Z - Math.random() * (NEAR_Z - FAR_Z);
      const camDist = Math.max(0.8, NEAR_Z - z);
      spawnMoteXY(camDist, tmpXY);
      centres[m * 3] = tmpXY[0];
      centres[m * 3 + 1] = tmpXY[1];
      centres[m * 3 + 2] = z;
      radii[m] = MOTE_RADIUS_MIN + Math.random() * (MOTE_RADIUS_MAX - MOTE_RADIUS_MIN);
      const spin = MOTE_SPIN_MIN + Math.random() * (MOTE_SPIN_MAX - MOTE_SPIN_MIN);
      spins[m] = Math.random() < 0.5 ? -spin : spin;
      angles[m] = Math.random() * Math.PI * 2;
      tints[m] = Math.random();
    }
    return { centres, radii, spins, angles, tints };
  }, [moteCount]);

  const geometry = useMemo(() => {
    if (moteCount === 0 || !moteState) return null;
    const positions = new Float32Array(totalPoints * 3);
    const offsets = new Float32Array(totalPoints * 3);
    const seeds = new Float32Array(totalPoints);
    const tints = new Float32Array(totalPoints);
    const ranks = new Float32Array(totalPoints);
    for (let m = 0; m < moteCount; m++) {
      const cx = moteState.centres[m * 3];
      const cy = moteState.centres[m * 3 + 1];
      const cz = moteState.centres[m * 3 + 2];
      const tint = moteState.tints[m];
      fibonacciSphereOffsets(POINTS_PER_MOTE, moteState.radii[m], offsets, m * POINTS_PER_MOTE * 3);
      for (let i = 0; i < POINTS_PER_MOTE; i++) {
        const vIdx = m * POINTS_PER_MOTE + i;
        positions[vIdx * 3] = cx + offsets[vIdx * 3];
        positions[vIdx * 3 + 1] = cy + offsets[vIdx * 3 + 1];
        positions[vIdx * 3 + 2] = cz + offsets[vIdx * 3 + 2];
        seeds[vIdx] = Math.random();
        tints[vIdx] = tint;
        // Two or three points per mote are bright "anchor" dots; the
        // rest are gentler shell stars. Distributed by seed so the
        // bright spots are stable across the mote's life.
        ranks[vIdx] = Math.random() < 0.18 ? 0.8 + Math.random() * 0.2 : Math.random() * 0.45;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    g.setAttribute("aTint", new THREE.BufferAttribute(tints, 1));
    g.setAttribute("aRank", new THREE.BufferAttribute(ranks, 1));
    return { geometry: g, offsets };
  }, [moteCount, totalPoints, moteState]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: motesVertex,
      fragmentShader: motesFragment,
      uniforms: {
        // Bumped so individual mote dots render as visible particles
        // rather than sub-pixel specks, making the sphere silhouette
        // legible at all corridor distances.
        uPointSize: { value: 7.2 },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uCameraPos: { value: new THREE.Vector3() },
        uVisibleNear: { value: VISIBLE_NEAR },
        uVisibleFar: { value: VISIBLE_FAR },
        uEdgeFadeStart: { value: EDGE_FADE_START },
        uEdgeFadeEnd: { value: EDGE_FADE_END },
        uEdgeFadeFloor: { value: EDGE_FADE_FLOOR },
        uColorCool: { value: COOL_COLOR.clone() },
        uColorWarm: { value: WARM_COLOR.clone() },
        uOpacity: { value: AMBIENT_OPACITY },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useEffect(() => {
    return () => {
      material.dispose();
      geometry?.geometry.dispose();
    };
  }, [material, geometry]);

  useFrame((state) => {
    const points = pointsRef.current;
    if (!points || !geometry || !moteState) return;

    const now = state.clock.elapsedTime;
    const lastT = lastTime.current;
    lastTime.current = now;
    if (lastT < 0) return;
    // Clamp dt to >= 0: R3F resets clock.elapsedTime to 0 on every
    // frameloop "always" <-> "demand" toggle (corridor re-engagement),
    // so an unclamped `now - lastT` goes large-negative and would jump
    // the mote flow phase backward in one frame. See LatentWormholeWalls
    // for the full root-cause note (same clock-reset trigger).
    const dt = Math.max(0, Math.min(0.1, now - lastT));

    const transform = useDepthGatewayStore.getState().transform;
    const { velocity, active, armed } = transform;
    const painting = active || armed;

    material.uniforms.uPixelRatio.value = state.viewport.dpr;
    const camPos = material.uniforms.uCameraPos.value as THREE.Vector3;
    camPos.copy(camera.position);

    if (!painting) {
      smoothedAlpha.current = 0;
      material.uniforms.uOpacity.value = 0;
      return;
    }

    // Alpha envelope. Boot lift gives motes a small extra presence
    // when the gateway centres, matching the LatentFieldTunnel and
    // ThoughtformAtmosphere beat. Uses the SHARED boot envelope from
    // sceneGeom so all gateway-lit painters ramp on the same beat.
    const absV = Math.abs(velocity);
    const velocityT = Math.min(1, absV * 1.8);
    const bootEnv = getThoughtformBootEnvelope(transform.paintProgress);
    // Build-approach declutter — celestial motes drift across the
    // corridor as ambient; fade them out across the approach to the
    // Build park. v3.12 realm-transition pass: the clear is pulled
    // EARLIER than the shared `getBuildApproachFade` window
    // ([0.86, 0.97]) — motes scattered in the FAR_Z band would
    // otherwise still hover in the wormhole-mouth backdrop while the
    // exit aperture + substrate realm need a clean stage. Motes are
    // fully gone by 0.84, just before the threshold sequence begins.
    const buildFade = Math.min(
      getBuildApproachFade(transform.paintProgress),
      1 - smoothstep(0.76, 0.84, transform.paintProgress)
    );
    const target =
      (AMBIENT_OPACITY + velocityT * (PEAK_OPACITY - AMBIENT_OPACITY) + bootEnv * BOOT_LIFT) *
      buildFade;
    const k = 1 - Math.exp(-ALPHA_RESPONSE * dt);
    smoothedAlpha.current += (target - smoothedAlpha.current) * k;
    material.uniforms.uOpacity.value = Math.min(1, smoothedAlpha.current);

    // Flow: motes drift in lock-step with scroll velocity only —
    // exactly zero motion at rest. Rotation also gates on movement
    // so static frames stay perfectly silent.
    const advance = velocity * SCROLL_GAIN * dt;
    const camZ = camera.position.z;
    const passLine = camZ + PASS_MARGIN;
    const backLine = camZ - 14;

    const { centres, radii, spins, angles } = moteState;
    const tmpXY: [number, number] = [0, 0];

    // 1) Advance and respawn mote centres (and their shape) when
    //    they pass the camera plane.
    for (let m = 0; m < moteCount; m++) {
      let z = centres[m * 3 + 2] + advance;
      if (advance > 0 && z > passLine) {
        z = camZ + FAR_Z;
        const camDist = Math.max(0.8, camZ - z);
        spawnMoteXY(camDist, tmpXY);
        centres[m * 3] = tmpXY[0];
        centres[m * 3 + 1] = tmpXY[1];
        // Reroll the mote's size + spin so each respawn feels like
        // a NEW celestial object passing through, not the same one
        // looping. The geometry buffer for offsets is rebuilt below.
        radii[m] = MOTE_RADIUS_MIN + Math.random() * (MOTE_RADIUS_MAX - MOTE_RADIUS_MIN);
        const spin = MOTE_SPIN_MIN + Math.random() * (MOTE_SPIN_MAX - MOTE_SPIN_MIN);
        spins[m] = Math.random() < 0.5 ? -spin : spin;
        angles[m] = Math.random() * Math.PI * 2;
        fibonacciSphereOffsets(
          POINTS_PER_MOTE,
          radii[m],
          geometry.offsets,
          m * POINTS_PER_MOTE * 3
        );
      } else if (advance < 0 && z < backLine) {
        z = camZ + NEAR_Z * 0.5;
        const camDist = Math.max(0.8, z - camZ);
        spawnMoteXY(camDist, tmpXY);
        centres[m * 3] = tmpXY[0];
        centres[m * 3 + 1] = tmpXY[1];
      }
      centres[m * 3 + 2] = z;
    }

    // 2) Advance per-mote rotation. Only when the user is actively
    //    moving — at rest the spheres hold their pose so nothing
    //    moves except the brandmark world.
    if (Math.abs(advance) > 1e-4) {
      for (let m = 0; m < moteCount; m++) {
        angles[m] += spins[m] * dt;
      }
    }

    // 3) Write the per-vertex world positions = mote centre + Y-
    //    rotated local offset. Cheap inner loop (~252 verts max).
    const positionAttribute = geometry.geometry.getAttribute("position") as THREE.BufferAttribute;
    const posArr = positionAttribute.array as Float32Array;
    const offs = geometry.offsets;
    for (let m = 0; m < moteCount; m++) {
      const angle = angles[m];
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const cx = centres[m * 3];
      const cy = centres[m * 3 + 1];
      const cz = centres[m * 3 + 2];
      const baseVIdx = m * POINTS_PER_MOTE;
      for (let i = 0; i < POINTS_PER_MOTE; i++) {
        const vIdx = baseVIdx + i;
        const ox = offs[vIdx * 3];
        const oy = offs[vIdx * 3 + 1];
        const oz = offs[vIdx * 3 + 2];
        posArr[vIdx * 3] = cx + ox * cosA - oz * sinA;
        posArr[vIdx * 3 + 1] = cy + oy;
        posArr[vIdx * 3 + 2] = cz + ox * sinA + oz * cosA;
      }
    }
    positionAttribute.needsUpdate = true;
  });

  if (!geometry || moteCount === 0) return null;

  return (
    <points
      ref={pointsRef}
      geometry={geometry.geometry}
      material={material}
      frustumCulled={false}
    />
  );
}
