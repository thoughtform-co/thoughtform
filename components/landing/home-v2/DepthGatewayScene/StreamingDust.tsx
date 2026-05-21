"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";

/**
 * StreamingDust — atmospheric particle field flowing far-Z → near-Z
 * across the home-v2 stage. Provides the "we are flying through
 * space" travel signal (Star Atlas's ambient dust, WorldQuant
 * Foundry's depth particles) layer that paints regardless of
 * which chamber is active.
 *
 * Each particle has a world position. Every frame:
 *   1. Advance the particle's z toward the camera by
 *      `baseFlow*dt + scrollVelocity*scrollGain*dt`.
 *      - `baseFlow` keeps the field in constant slow motion even
 *         when the user isn't scrolling (idle drift).
 *      - `scrollVelocity` (from `depthGatewayStore`) amplifies the
 *         flow rate during active scroll so the motion intensifies
 *         when the user is moving through the stage.
 *   2. When the particle's z passes the camera (`z > cameraZ + 2`),
 *      respawn it at far-Z with a new random XY within the visible
 *      frustum at that depth. Continuous wrap-around → infinite
 *      tunnel of dust.
 *
 * Shader-driven alpha falloff:
 *   - Particles fade IN as they approach from far (so they don't
 *     pop in suddenly at the far plane).
 *   - Particles fade OUT as they approach the camera (so they don't
 *     pop out at the near plane).
 *   - Net effect: a smooth band of visible dust in the middle of
 *     the camera's depth window, moving toward the viewer.
 *
 * Rendered behind the brandmark + L/R bodies. Transparent additive
 * blending so it composites cleanly over the void shield.
 */

/** Far-Z spawn point. Particles wrap to this z when they pass the
 *  camera. Pulled in from −40 to −25 so respawned particles spend
 *  less time off-screen before becoming visible — the field
 *  always reads as a dense river of dust. */
const FAR_Z = -25;

/** Distance ahead of the camera at which a particle is considered
 *  "passed" and gets respawned at FAR_Z. */
const PASS_MARGIN = 1.5;

/** Idle drift speed in world-units per second. Keeps the field
 *  alive even when the user is not scrolling — the user sees
 *  noticeable forward motion on first paint, before touching the
 *  scroll wheel. Tuned high enough that a particle traverses the
 *  visible window (~28 world units) in ~6 seconds. */
const BASE_FLOW = 4.5;

/** Scroll velocity gain. Multiplied by the depth-gateway store's
 *  per-frame velocity (in progress-units per second) to produce
 *  additional world-units per second of flow during active scroll. */
const SCROLL_GAIN = 8.0;

/** Frustum cone half-angle scaling. At FOV 42° the camera's
 *  vertical half-angle tan is 0.384. We spawn particles inside
 *  this cone (slightly wider than the strict viewport) so the
 *  field paints across the whole visible screen at every depth. */
const CONE_TAN = 0.4;

/** Per-particle alpha shaping. Particles fade in / out across these
 *  z-distance windows from the camera. Tightened so most of the
 *  visible window holds peak opacity (more "dense river" than
 *  "scattered stars"). */
const VISIBLE_NEAR = 1.0;
const VISIBLE_NEAR_FADE = 0.4;
const VISIBLE_FAR = 24;
const VISIBLE_FAR_FADE = 5;

interface StreamingDustProps {
  /** Override the particle count. Defaults adapt to viewport size
   *  in the component (smaller on mobile). */
  count?: number;
}

const vertexShader = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
uniform float uVisibleNear;
uniform float uVisibleNearFade;
uniform float uVisibleFar;
uniform float uVisibleFarFade;
uniform vec3 uCameraPos;

attribute float aSeed;

varying float vAlpha;
varying float vSeed;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  // Distance from this particle to the camera in world space.
  float dist = distance(position, uCameraPos);
  // Fade in as the particle approaches from far, fade out as it
  // gets close to the camera (so neither pop in nor pop out).
  float farFade = smoothstep(uVisibleFar, uVisibleFar - uVisibleFarFade, dist);
  float nearFade = smoothstep(uVisibleNear - uVisibleNearFade, uVisibleNear + 0.5, dist);
  vAlpha = farFade * nearFade;
  vSeed = aSeed;

  gl_Position = projectionMatrix * mv;
  // Size scales gently with distance (closer = bigger) for depth cue.
  float sizeFactor = clamp(8.0 / max(0.6, dist), 0.5, 2.5);
  gl_PointSize = uPointSize * uPixelRatio * sizeFactor;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;

varying float vAlpha;
varying float vSeed;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  // Soft round dot with brighter core.
  float soft = smoothstep(0.5, 0.05, d);
  // Per-particle seed → subtle alpha variance so the field doesn't
  // read as a uniform grid.
  float jitter = 0.7 + fract(vSeed * 41.0) * 0.3;
  float alpha = soft * vAlpha * uOpacity * jitter;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

export function StreamingDust({ count }: StreamingDustProps = {}) {
  const { camera } = useThree();
  const pointsRef = useRef<THREE.Points>(null);
  const lastTime = useRef<number>(-1);

  // Resolve particle count: smaller on mobile so we don't pay GPU
  // cost for invisible specks. devicePixelRatio + viewport check
  // is a cheap heuristic.
  const particleCount = useMemo(() => {
    if (count != null) return count;
    if (typeof window === "undefined") return 2500;
    const w = window.innerWidth;
    if (w < 760) return 1800;
    if (w < 1280) return 3000;
    return 4000;
  }, [count]);

  // ── Initial geometry ─────────────────────────────────────────
  const geometry = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const seeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Distribute initial z uniformly across the visible window so
      // the field is densely populated on first paint (no waiting
      // for particles to flow into view).
      const z = FAR_Z + Math.random() * (PASS_MARGIN - FAR_Z);
      // Spawn XY inside a perspective cone scaled to the camera's
      // visible frustum at that depth. We measure the camera-to-
      // particle distance from CAMERA_START.z (8) since the camera
      // dollies forward from there — particles spawned at far-Z
      // need to cover the visible frame at the FARTHEST camera
      // position. Sqrt for radial uniform fill.
      const camDist = 8 - z; // CAMERA_START z is 8
      const r = Math.sqrt(Math.random()) * camDist * CONE_TAN;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.sin(theta) * r * 0.7;
      positions[i * 3 + 2] = z;
      seeds[i] = Math.random();
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return geom;
  }, [particleCount]);

  // ── Material ─────────────────────────────────────────────────
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        // Particle base size in screen px (multiplied by pixel ratio
        // and a per-particle distance factor in the vertex shader).
        // Tuned to be CLEARLY visible against the void shield
        // without competing with the brandmark cloud — readable
        // dust grains, not pinprick stars.
        uPointSize: { value: 5.0 },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uVisibleNear: { value: VISIBLE_NEAR },
        uVisibleNearFade: { value: VISIBLE_NEAR_FADE },
        uVisibleFar: { value: VISIBLE_FAR },
        uVisibleFarFade: { value: VISIBLE_FAR_FADE },
        uCameraPos: { value: new THREE.Vector3() },
        // Warm-dawn tint pulled toward white so the dust reads
        // bright against the void without being overtly gold (the
        // brandmark owns the gold register).
        uColor: { value: new THREE.Color("#f0e6cf") },
        uOpacity: { value: 0.95 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useEffect(() => {
    return () => {
      material.dispose();
      geometry.dispose();
    };
  }, [material, geometry]);

  // ── Per-frame: advance z, wrap, push uniforms ────────────────
  useFrame((state) => {
    const points = pointsRef.current;
    if (!points) return;

    const now = state.clock.elapsedTime;
    const lastT = lastTime.current;
    lastTime.current = now;
    if (lastT < 0) return; // first frame: no dt yet

    const dt = Math.min(0.1, now - lastT); // clamp dt to avoid huge jumps
    const transform = useDepthGatewayStore.getState().transform;
    const velocity = transform.velocity;
    const active = transform.active;

    material.uniforms.uPixelRatio.value = state.viewport.dpr;
    const camPos = material.uniforms.uCameraPos.value as THREE.Vector3;
    camPos.copy(camera.position);

    // Idle drift is always on; scroll velocity adds to it (only
    // when scrolling forward — negative velocity slows the flow
    // but doesn't reverse it, so the dust never moves "away" from
    // the camera). Even when stage isn't active, run a slow
    // background drift so the dust never freezes statically.
    const effectiveFlow = BASE_FLOW + Math.max(0, velocity) * SCROLL_GAIN;
    const advance = effectiveFlow * dt;

    if (!active) {
      // Off-stage: still tick uniforms but skip the heavy buffer
      // update — dust doesn't need to flow when it's not visible.
      return;
    }

    const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = positions.array as Float32Array;
    const camZ = camera.position.z;
    const passLine = camZ + PASS_MARGIN;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3 + 2;
      let z = arr[idx] + advance;
      if (z > passLine) {
        // Respawn at far-Z with new random XY inside the perspective
        // cone at the FARTHEST camera distance (CAMERA_START.z = 8).
        // Slight z jitter so respawned particles don't align in a
        // single rank.
        z = FAR_Z + Math.random() * 3;
        const camDist = 8 - z;
        const r = Math.sqrt(Math.random()) * camDist * CONE_TAN;
        const theta = Math.random() * Math.PI * 2;
        arr[i * 3] = Math.cos(theta) * r;
        arr[i * 3 + 1] = Math.sin(theta) * r * 0.7;
      }
      arr[idx] = z;
    }
    positions.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}
