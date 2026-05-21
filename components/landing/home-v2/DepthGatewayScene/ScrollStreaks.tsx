"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";

/**
 * ScrollStreaks — near-camera particle streaks whose flow is
 * strictly proportional to scroll velocity (ADR-018).
 *
 * Replaces the previous `StreamingDust` ambient drift. The new
 * model:
 *
 *   - When the user is NOT scrolling, particles do not advance.
 *     They sit at their spawned z. Their alpha decays to 0 so the
 *     field is effectively invisible at rest.
 *   - When the user IS scrolling forward (velocity > 0), particles
 *     advance toward the camera at a rate proportional to velocity.
 *     Alpha ramps up with |velocity|.
 *   - Backward scroll (velocity < 0) advances particles AWAY from
 *     the camera at the same rate so the parallax cue mirrors the
 *     direction of travel.
 *
 * This is the "I am moving" signal: present only when the user is
 * moving, absent otherwise. Together with the static starfield it
 * solves the original feedback ("the stars shouldn't move when I'm
 * not scrolling, it breaks the immersion of flying through space").
 */

/** Far-Z spawn point. Particles wrap to this z when they pass the
 *  camera (forward scroll) or to the camera+near (backward scroll). */
const FAR_Z = -22;
const NEAR_Z = 8;

/** Distance ahead of the camera at which a forward-moving particle
 *  gets respawned at FAR_Z. */
const PASS_MARGIN = 1.5;

/** Velocity → flow speed gain. Multiplied by |velocity| (in
 *  progress-units per second) to produce world-units per second of
 *  particle flow. */
const SCROLL_GAIN = 30;

/** How quickly the visible-alpha tracks the absolute velocity.
 *  Higher = snappier intensity ramp. */
const ALPHA_RESPONSE = 6;

/** Frustum cone half-angle scaling. At FOV ~38° the camera's
 *  vertical half-angle tan is ~0.34. We spawn particles inside a
 *  slightly wider cone so the streaks paint across the visible
 *  screen at every depth. */
const CONE_TAN = 0.42;

/** Visible window from the camera (in world units). */
const VISIBLE_NEAR = 0.6;
const VISIBLE_FAR = 22;

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

  float farFade = smoothstep(uVisibleFar, uVisibleFar - 3.0, dist);
  float nearFade = smoothstep(uVisibleNear, uVisibleNear + 1.0, dist);
  vAlpha = farFade * nearFade;
  vSeed = aSeed;

  gl_Position = projectionMatrix * mv;
  float sizeFactor = clamp(6.0 / max(0.5, dist), 0.4, 2.3);
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
  float soft = smoothstep(0.5, 0.05, d);
  float jitter = 0.7 + fract(vSeed * 41.0) * 0.3;
  float alpha = soft * vAlpha * uOpacity * jitter;
  if (alpha < 0.012) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

interface ScrollStreaksProps {
  /** Override particle count. Defaults adapt to viewport. */
  count?: number;
}

export function ScrollStreaks({ count }: ScrollStreaksProps = {}) {
  const { camera } = useThree();
  const pointsRef = useRef<THREE.Points>(null);
  const lastTime = useRef<number>(-1);
  const visibleAlpha = useRef<number>(0);

  const particleCount = useMemo(() => {
    if (count != null) return count;
    if (typeof window === "undefined") return 1400;
    const w = window.innerWidth;
    if (w < 760) return 900;
    if (w < 1280) return 1600;
    return 2200;
  }, [count]);

  const geometry = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const seeds = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      // Distribute z across the visible window uniformly so the
      // field is populated on first paint and forward/backward
      // scroll instantly produces streaks throughout the depth.
      const z = NEAR_Z - Math.random() * (NEAR_Z - FAR_Z);
      // XY: spawn inside a perspective cone scaled to the camera
      // distance at this depth.
      const camDist = Math.max(0.5, NEAR_Z - z);
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

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uPointSize: { value: 4.2 },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uCameraPos: { value: new THREE.Vector3() },
        uVisibleNear: { value: VISIBLE_NEAR },
        uVisibleFar: { value: VISIBLE_FAR },
        uColor: { value: new THREE.Color("#f0e6cf") },
        uOpacity: { value: 0 },
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
    const velocity = transform.velocity;
    const active = transform.active;

    material.uniforms.uPixelRatio.value = state.viewport.dpr;
    const camPos = material.uniforms.uCameraPos.value as THREE.Vector3;
    camPos.copy(camera.position);

    // Visible alpha ramps with |velocity|, capped at 1, smoothed
    // toward target. When idle (velocity ~= 0) the field decays to
    // invisible.
    const targetAlpha = Math.min(1, Math.abs(velocity) * 2.5);
    const k = 1 - Math.exp(-ALPHA_RESPONSE * dt);
    visibleAlpha.current = visibleAlpha.current + (targetAlpha - visibleAlpha.current) * k;
    material.uniforms.uOpacity.value = visibleAlpha.current * 0.85;

    if (!active) {
      return;
    }

    // No motion when idle — flow is STRICTLY proportional to
    // velocity. Sign of velocity → direction of flow.
    const flowSpeed = velocity * SCROLL_GAIN;
    if (Math.abs(flowSpeed) < 0.001) return;

    const advance = flowSpeed * dt;
    const camZ = camera.position.z;
    const passLine = camZ + PASS_MARGIN; // forward scroll respawn line
    const backLine = camZ - 12; // backward scroll respawn line (behind)

    const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = positions.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3 + 2;
      let z = arr[idx] + advance;
      if (advance > 0 && z > passLine) {
        // Forward respawn: behind the deepest visible point.
        z = camZ + FAR_Z;
        const camDist = Math.max(0.5, camZ - z);
        const r = Math.sqrt(Math.random()) * camDist * CONE_TAN;
        const theta = Math.random() * Math.PI * 2;
        arr[i * 3] = Math.cos(theta) * r;
        arr[i * 3 + 1] = Math.sin(theta) * r * 0.7;
      } else if (advance < 0 && z < backLine) {
        // Backward respawn: in front of the camera.
        z = camZ + NEAR_Z * 0.5;
        const camDist = Math.max(0.5, z - camZ);
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
