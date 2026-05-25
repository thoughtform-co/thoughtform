"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getThoughtformBootEnvelope } from "./sceneGeom";

/**
 * WormholeTunnel — soft, wide near-camera star field that paints
 * the corridor as a luminous tunnel around the brandmark.
 *
 * Sits alongside `ScrollStreaks`. The two layers are deliberately
 * different:
 *
 *   - `ScrollStreaks`  : NARROW, WARM, idle-invisible. Velocity-only
 *                        streak signal — the "I am moving NOW"
 *                        flash that punctuates an active scroll.
 *   - `WormholeTunnel` : WIDE, COOLER, faintly visible at rest.
 *                        Provides ambient TUNNEL STRUCTURE so the
 *                        corridor reads as a luminous shaft around
 *                        the brandmark even when the visitor pauses,
 *                        and intensifies into a strong parallax
 *                        wormhole as soon as forward scroll resumes.
 *
 * Composition rules:
 *
 *   1. Uniformly distribute particles across a wide perspective cone
 *      so the camera-forward axis (where the brandmark sits) is the
 *      darkest point of the field — peripheral parallax is what
 *      sells the tunnel. The brandmark stays the dominant visual.
 *   2. Per-particle Z drift is proportional to scroll velocity
 *      (forward + backward), MATCHING `ScrollStreaks` direction so
 *      the two layers always agree on which way "down" is.
 *   3. A tiny ambient forward drift survives at rest so the tunnel
 *      feels alive (very slow, single-pixel-per-second class), but
 *      it never reads as "the stars are moving without me".
 *   4. Alpha lifts smoothly with |velocity| and gets a small extra
 *      boost during the Thoughtform boot envelope so the tunnel is
 *      most pronounced as the gateway powers on.
 *
 * Together with the `StaticStarfield` (deep backdrop) and
 * `ScrollStreaks` (velocity-only streaks), this layer completes the
 * three-tier depth story: deep stars hold the void, tunnel stars
 * frame the brandmark, streaks punctuate active scroll.
 */

/** Cone half-angle scaling. Wider than `ScrollStreaks` (0.42) so
 *  the field paints across the peripheral viewport, framing the
 *  brandmark from a wider radius. */
const CONE_TAN_X = 0.95;
/** Y is slightly squashed so the tunnel reads as a horizontal
 *  shaft framing the brandmark, not a perfect cone — matches the
 *  16:9-leaning corridor composition. */
const CONE_TAN_Y = 0.62;

/** Z range — deeper than `ScrollStreaks` for stronger parallax
 *  between near and far stars when flowing. */
const FAR_Z = -28;
const NEAR_Z = 9;

/** Distance ahead of the camera at which a forward-moving particle
 *  respawns at the far end of the tunnel. */
const PASS_MARGIN = 1.5;

/** Visible band (world units from the camera). */
const VISIBLE_NEAR = 0.55;
const VISIBLE_FAR = 26;

/** Multiplier from |velocity| (progress-units / s) to world-units / s
 *  of particle flow. A touch slower than `ScrollStreaks` so the two
 *  layers read as distinct parallax planes rather than a single
 *  thick streak. */
const SCROLL_GAIN = 22;

/** Ambient forward drift while idle — strictly tiny so the tunnel
 *  feels alive without reading as motion the user didn't trigger.
 *  At ~0.05 world-units / s on a corridor depth of ~37 units, a
 *  particle takes ~12 minutes to traverse the full tunnel idle. */
const AMBIENT_DRIFT = 0.05;

/** How quickly the visible alpha tracks |velocity|. */
const ALPHA_RESPONSE = 5;

/** Alpha bookends. */
const AMBIENT_OPACITY = 0.22;
const PEAK_OPACITY = 0.7;

/** Extra boost applied to the alpha while the Thoughtform boot
 *  envelope is engaged, so the wormhole reads its strongest right
 *  as the gateway powers on. */
const BOOT_ALPHA_BOOST = 0.25;

/** Avoid spawning particles directly on the camera-forward axis so
 *  the centre (where the brandmark sits) stays clear and the
 *  parallax tunnel frames the mark rather than overlaying it. */
const CENTRE_AVOID_RADIUS = 0.18;

const vertexShader = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
uniform vec3 uCameraPos;
uniform float uVisibleNear;
uniform float uVisibleFar;

attribute float aSeed;

varying float vAlpha;
varying float vSeed;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = distance(position, uCameraPos);

  float farFade = smoothstep(uVisibleFar, uVisibleFar - 4.0, dist);
  float nearFade = smoothstep(uVisibleNear, uVisibleNear + 1.2, dist);
  vAlpha = farFade * nearFade;
  vSeed = aSeed;

  gl_Position = projectionMatrix * mv;
  // Near stars are slightly larger so the parallax depth reads;
  // far stars are tiny so they don't dominate the field.
  float sizeFactor = clamp(5.5 / max(0.5, dist), 0.32, 2.6);
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
  // Tight bright core + soft halo so the points read as stars,
  // not blur. Tighter than ScrollStreaks because we have more of
  // them — overlap would otherwise mush into a glow.
  float core = smoothstep(0.14, 0.0, d);
  float halo = smoothstep(0.5, 0.16, d);
  float soft = max(core, halo * 0.5);
  float jitter = 0.6 + fract(vSeed * 41.0) * 0.4;
  float alpha = soft * vAlpha * uOpacity * jitter;
  if (alpha < 0.012) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

interface WormholeTunnelProps {
  /** Override particle count. Defaults adapt to viewport. */
  count?: number;
}

/** Spawn a single particle's XY inside the wide cone, avoiding the
 *  central avoidance radius so the tunnel frames the brandmark. */
function spawnXY(camDist: number, out: [number, number]): void {
  const radialBand = 1 - CENTRE_AVOID_RADIUS;
  const r = (CENTRE_AVOID_RADIUS + Math.sqrt(Math.random()) * radialBand) * camDist;
  const theta = Math.random() * Math.PI * 2;
  out[0] = Math.cos(theta) * r * CONE_TAN_X;
  out[1] = Math.sin(theta) * r * CONE_TAN_Y;
}

export function WormholeTunnel({ count }: WormholeTunnelProps = {}) {
  const { camera } = useThree();
  const pointsRef = useRef<THREE.Points>(null);
  const lastTime = useRef<number>(-1);
  const visibleAlpha = useRef<number>(0);

  const particleCount = useMemo(() => {
    if (count != null) return count;
    if (typeof window === "undefined") return 2200;
    const w = window.innerWidth;
    if (w < 760) return 1400;
    if (w < 1280) return 2000;
    return 2800;
  }, [count]);

  const geometry = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const seeds = new Float32Array(particleCount);
    const tmp: [number, number] = [0, 0];
    for (let i = 0; i < particleCount; i++) {
      const z = NEAR_Z - Math.random() * (NEAR_Z - FAR_Z);
      const camDist = Math.max(0.5, NEAR_Z - z);
      spawnXY(camDist, tmp);
      positions[i * 3] = tmp[0];
      positions[i * 3 + 1] = tmp[1];
      positions[i * 3 + 2] = z;
      seeds[i] = Math.random();
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return geom;
  }, [particleCount]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uPointSize: { value: 2.8 },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uCameraPos: { value: new THREE.Vector3() },
        uVisibleNear: { value: VISIBLE_NEAR },
        uVisibleFar: { value: VISIBLE_FAR },
        // Cooler tint than ScrollStreaks' #f0e6cf so the two layers
        // separate optically — tunnel stars read as the cool void
        // surround, streaks as the warmer in-the-act gold flow.
        uColor: { value: new THREE.Color("#e8e3d8") },
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
      geometry.dispose();
    };
  }, [material, geometry]);

  useFrame((state) => {
    const points = pointsRef.current;
    if (!points) return;

    const now = state.clock.elapsedTime;
    const lastT = lastTime.current;
    lastTime.current = now;
    if (lastT < 0) return;
    const dt = Math.min(0.1, now - lastT);

    const transform = useDepthGatewayStore.getState().transform;
    const { velocity, active, armed, paintProgress } = transform;
    const painting = active || armed;

    material.uniforms.uPixelRatio.value = state.viewport.dpr;
    const camPos = material.uniforms.uCameraPos.value as THREE.Vector3;
    camPos.copy(camera.position);

    if (!painting) {
      // Out of the corridor entirely — relax to zero so the tunnel
      // never paints over the hero or tail sections.
      visibleAlpha.current = 0;
      material.uniforms.uOpacity.value = 0;
      return;
    }

    // Alpha envelope: ambient floor + |velocity| lift + boot boost.
    const boot = getThoughtformBootEnvelope(paintProgress);
    const targetVelocityLift =
      Math.min(1, Math.abs(velocity) * 2.0) * (PEAK_OPACITY - AMBIENT_OPACITY);
    const target = AMBIENT_OPACITY + targetVelocityLift + boot * BOOT_ALPHA_BOOST;
    const k = 1 - Math.exp(-ALPHA_RESPONSE * dt);
    visibleAlpha.current = visibleAlpha.current + (target - visibleAlpha.current) * k;
    material.uniforms.uOpacity.value = Math.min(1, visibleAlpha.current);

    // Flow: scroll-proportional + tiny ambient forward drift.
    const flowSpeed = velocity * SCROLL_GAIN + AMBIENT_DRIFT;
    const advance = flowSpeed * dt;
    if (Math.abs(advance) < 1e-4) return;

    const camZ = camera.position.z;
    const passLine = camZ + PASS_MARGIN;
    const backLine = camZ - 14;

    const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = positions.array as Float32Array;
    const tmp: [number, number] = [0, 0];

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3 + 2;
      let z = arr[idx] + advance;
      if (advance > 0 && z > passLine) {
        z = camZ + FAR_Z;
        const camDist = Math.max(0.5, camZ - z);
        spawnXY(camDist, tmp);
        arr[i * 3] = tmp[0];
        arr[i * 3 + 1] = tmp[1];
      } else if (advance < 0 && z < backLine) {
        z = camZ + NEAR_Z * 0.5;
        const camDist = Math.max(0.5, z - camZ);
        spawnXY(camDist, tmp);
        arr[i * 3] = tmp[0];
        arr[i * 3 + 1] = tmp[1];
      }
      arr[idx] = z;
    }
    positions.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}
