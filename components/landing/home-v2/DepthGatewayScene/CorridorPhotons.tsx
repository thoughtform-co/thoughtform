"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useDepthGatewayStore, smoothstep } from "@/lib/stores/depthGatewayStore";
import {
  LEG_1_REVEAL_END,
  LEG_1_REVEAL_START,
  LEG_2_REVEAL_END,
  LEG_2_REVEAL_START,
  RAIL_COUNT_PER_LEG,
  VISIBLE_FAR,
  VISIBLE_NEAR,
  sampleRailPoint,
} from "./LatentWormholeWalls";

/**
 * CorridorPhotons — sparse fast comets that fly along the wormhole
 * rails toward the corridor end (ADR-018, polish round 2).
 *
 * Reads:
 *   - The same rail parameterisation that `LatentWormholeWalls`
 *     paints (`sampleRailPoint`) so photons trace the visible rails
 *     exactly — no drifting between the comet and the lattice.
 *   - Leg reveal windows (`LEG_*_REVEAL_*`) — photons only spawn on a
 *     leg the user can already see, so a photon never appears in
 *     empty space.
 *   - Camera-space depth band (`VISIBLE_NEAR/FAR`) so photons fade
 *     consistently with the rails they ride.
 *
 * Design notes:
 *   - Driven by `state.clock.elapsedTime`, NOT scroll velocity. The
 *     corridor rails themselves are velocity-gated; photons are the
 *     idle-life signal that the substrate isn't a still photograph
 *     even when the user is parked reading copy.
 *   - Sparse by construction: at most `MAX_PHOTONS` live at once,
 *     spawn cadence randomised in [`SPAWN_MIN_S`, `SPAWN_MAX_S`].
 *   - Each photon picks a FULL rail (not the every-third partial) so
 *     it always reaches the leg end instead of fading at the partial
 *     midpoint, which would read as a glitch rather than a flyby.
 *   - Reduced motion: hides the whole layer (no spawning, no draw).
 */

/** Max simultaneous photons. Sized for "occasional" reading — most
 *  frames have 1–3 live photons; the cap is just a safety. */
const MAX_PHOTONS = 24;

/** Spawn cadence (seconds between attempts). Long enough that the
 *  user notices each photon as an event, short enough that the
 *  corridor never reads as static across a scrolling beat. */
const SPAWN_MIN_S = 1.5;
const SPAWN_MAX_S = 3.5;

/** Single-photon traversal time (seconds, t=0 → t=1). Photons fly
 *  noticeably faster than the camera dolly so they read as light
 *  pulses, not as more rail dots. */
const TRAVERSE_MIN_S = 1.4;
const TRAVERSE_MAX_S = 2.2;

const PHOTON_GOLD_HEX = "#caa554";

/** Vertex shader — same depth-fade language as the walls, plus a
 *  birth/death alpha envelope on `aLife` so photons fade in at the
 *  start of their flight and fade out at the end (no pop). */
const photonsVertex = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
uniform vec3 uCameraPos;
uniform float uVisibleNear;
uniform float uVisibleFar;
uniform float uOpacity;

attribute float aAlpha;
attribute float aLife;

varying float vAlpha;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = distance(position, uCameraPos);

  float near = smoothstep(uVisibleNear * 0.5, uVisibleNear, dist);
  float far = 1.0 - smoothstep(uVisibleFar * 0.85, uVisibleFar, dist);
  float depthFade = clamp(near * far, 0.0, 1.0);

  // Life envelope — soft fade-in at start, soft fade-out at end of
  // traversal so photons don't pop on/off at the rail endpoints.
  float lifeFade = smoothstep(0.0, 0.08, aLife) * (1.0 - smoothstep(0.88, 1.0, aLife));

  vAlpha = uOpacity * depthFade * aAlpha * lifeFade;

  // Point size eases up briefly mid-flight so the photon reads as a
  // discrete pulse rather than a uniform sprite — peaks at the
  // halfway point of the rail traversal.
  float sizeEnv = 0.85 + 0.6 * (1.0 - abs(aLife - 0.5) * 2.0);

  gl_PointSize = uPointSize * uPixelRatio * sizeEnv;
  gl_PointSize *= 1.0 / -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

/** Fragment shader — round soft-disk falloff (matches the rails'
 *  visual language). Additive blending in the material handles the
 *  bright bloom against the dotted lattice. */
const photonsFragment = /* glsl */ `
precision mediump float;

uniform vec3 uColor;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv);
  if (r > 0.5) discard;
  // Sharper centre, softer edge — reads as a pinpoint of light.
  float disk = pow(1.0 - r * 2.0, 1.6);
  gl_FragColor = vec4(uColor, vAlpha * disk);
}
`;

interface PhotonState {
  active: boolean;
  /** Which leg this photon is travelling along (0 or 1). */
  leg: 0 | 1;
  /** Rail index within the leg (0..RAIL_COUNT_PER_LEG-1). */
  railIdx: number;
  /** Normalised position along the rail (0 → leg start, 1 → leg end). */
  t: number;
  /** Per-second advance rate so traversal lasts [TRAVERSE_MIN, MAX]. */
  speed: number;
}

/** Pick a rail index that is "full" — the every-third-rail partial
 *  rails end at t≈0.55, so a photon on one of them would visibly
 *  fade out mid-corridor, reading as a glitch. */
function pickFullRail(rng: () => number): number {
  // 13 of every 20 rails are full; loop a few times in the rare
  // case we land on a partial.
  for (let attempt = 0; attempt < 6; attempt++) {
    const idx = Math.floor(rng() * RAIL_COUNT_PER_LEG);
    if (idx % 3 !== 2) return idx;
  }
  return 0;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function CorridorPhotons() {
  const pointsRef = useRef<THREE.Points>(null);

  const reducedMotion = useMemo(() => prefersReducedMotion(), []);

  // Skip on narrow viewports — same gate as the walls. Photons are a
  // detail layer; we don't pay the cost on phones (where the wormhole
  // walls themselves are also skipped).
  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    if (reducedMotion) return false;
    return window.innerWidth >= 760;
  }, [reducedMotion]);

  // Persistent photon pool + frame-mutable buffers. Allocating once
  // and writing per-frame keeps GC quiet across the whole scroll.
  const photons = useRef<PhotonState[]>(
    Array.from({ length: MAX_PHOTONS }, () => ({
      active: false,
      leg: 0,
      railIdx: 0,
      t: 0,
      speed: 1,
    }))
  );
  const positions = useRef(new Float32Array(MAX_PHOTONS * 3));
  const alphas = useRef(new Float32Array(MAX_PHOTONS));
  const lifes = useRef(new Float32Array(MAX_PHOTONS));

  /** Time of last spawn attempt (clock.elapsedTime). The next attempt
   *  is delayed by a random interval inside [SPAWN_MIN_S, SPAWN_MAX_S]
   *  so photon arrivals don't land on a metronome. */
  const lastSpawn = useRef<number>(-1);
  const nextSpawnDelay = useRef<number>(SPAWN_MIN_S + Math.random() * (SPAWN_MAX_S - SPAWN_MIN_S));
  const lastTime = useRef<number>(-1);

  const geometry = useMemo(() => {
    if (!enabled) return null;
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions.current, 3));
    geom.setAttribute("aAlpha", new THREE.BufferAttribute(alphas.current, 1));
    geom.setAttribute("aLife", new THREE.BufferAttribute(lifes.current, 1));
    return geom;
  }, [enabled]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: photonsVertex,
      fragmentShader: photonsFragment,
      uniforms: {
        uPointSize: { value: 8.5 },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uCameraPos: { value: new THREE.Vector3() },
        uVisibleNear: { value: VISIBLE_NEAR },
        uVisibleFar: { value: VISIBLE_FAR },
        uColor: { value: new THREE.Color(PHOTON_GOLD_HEX) },
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
      geometry?.dispose();
    };
  }, [material, geometry]);

  useFrame((state) => {
    if (!geometry) return;
    const { camera, viewport } = state;
    const now = state.clock.elapsedTime;
    const lastT = lastTime.current;
    lastTime.current = now;
    // Clamp dt to >= 0: R3F resets clock.elapsedTime to 0 on every
    // frameloop "always" <-> "demand" toggle (corridor re-engagement),
    // so an unclamped `now - lastT` goes large-negative and corrupts the
    // photon spawn/life accumulators. See LatentWormholeWalls for the
    // full root-cause note (same clock-reset trigger).
    const dt = lastT < 0 ? 0 : Math.max(0, Math.min(0.1, now - lastT));

    const transform = useDepthGatewayStore.getState().transform;
    const { paintProgress, active, armed } = transform;
    const painting = active || armed;

    material.uniforms.uPixelRatio.value = viewport.dpr;
    (material.uniforms.uCameraPos.value as THREE.Vector3).copy(camera.position);

    if (!painting) {
      material.uniforms.uOpacity.value = 0;
      // Draw gate (2026-07-16 perf pass, ADR-047 U5) — same-frame with
      // the zero-opacity write.
      if (pointsRef.current) pointsRef.current.visible = false;
      // Reset all photons to inactive so a re-engage starts from a
      // clean cadence rather than carrying stale traversals across
      // a long disengage.
      for (let i = 0; i < MAX_PHOTONS; i++) {
        photons.current[i].active = false;
        alphas.current[i] = 0;
        lifes.current[i] = 0;
      }
      const alphaAttr = geometry.getAttribute("aAlpha") as THREE.BufferAttribute;
      const lifeAttr = geometry.getAttribute("aLife") as THREE.BufferAttribute;
      alphaAttr.needsUpdate = true;
      lifeAttr.needsUpdate = true;
      lastSpawn.current = -1;
      return;
    }

    // Per-leg reveal — gates BOTH spawning (no photons on a leg the
    // user can't see yet) and the global opacity multiplier (so the
    // layer fades in with the lattice it rides).
    const reveal1 = smoothstep(LEG_1_REVEAL_START, LEG_1_REVEAL_END, paintProgress);
    const reveal2 = smoothstep(LEG_2_REVEAL_START, LEG_2_REVEAL_END, paintProgress);
    const layerReveal = Math.max(reveal1, reveal2);
    material.uniforms.uOpacity.value = layerReveal;
    // Draw gate (2026-07-16 perf pass, ADR-047 U5) — same-frame with the
    // opacity write. Only closes pre-reveal; through the epilogue
    // layerReveal holds 1, so this is a safe no-op there.
    if (pointsRef.current) pointsRef.current.visible = layerReveal > 0.002;

    // 1) Advance every active photon. Photons that finish their rail
    //    deactivate; their slot is reusable on the next spawn.
    for (let i = 0; i < MAX_PHOTONS; i++) {
      const ph = photons.current[i];
      if (!ph.active) {
        alphas.current[i] = 0;
        lifes.current[i] = 0;
        continue;
      }
      ph.t += ph.speed * dt;
      if (ph.t >= 1) {
        ph.active = false;
        alphas.current[i] = 0;
        lifes.current[i] = 0;
        continue;
      }
      const p = sampleRailPoint(ph.leg, ph.railIdx, ph.t);
      positions.current[i * 3 + 0] = p.x;
      positions.current[i * 3 + 1] = p.y;
      positions.current[i * 3 + 2] = p.z;
      // Per-photon alpha is layered on top of the layer reveal — set
      // to 1 here so the shader's life envelope owns the fade shape.
      alphas.current[i] = 1;
      lifes.current[i] = ph.t;
    }

    // 2) Maybe spawn a new photon. Only when at least one leg has
    //    revealed enough to host a credible flyby — `MIN_LEG_REVEAL`
    //    keeps photons from appearing inside an empty leg before the
    //    lattice is even visible. Spawn cadence is random per-shot.
    if (lastSpawn.current < 0) lastSpawn.current = now;
    const sinceLast = now - lastSpawn.current;
    const MIN_LEG_REVEAL = 0.35;
    const canSpawnLeg1 = reveal1 >= MIN_LEG_REVEAL;
    const canSpawnLeg2 = reveal2 >= MIN_LEG_REVEAL;
    const anyLeg = canSpawnLeg1 || canSpawnLeg2;
    if (anyLeg && sinceLast >= nextSpawnDelay.current) {
      // Find the first free slot.
      let freeIdx = -1;
      for (let i = 0; i < MAX_PHOTONS; i++) {
        if (!photons.current[i].active) {
          freeIdx = i;
          break;
        }
      }
      if (freeIdx >= 0) {
        // Pick a leg that's actually visible. If both are, weight by
        // their reveal so the active leg gets the bulk of photons.
        let leg: 0 | 1;
        if (canSpawnLeg1 && canSpawnLeg2) {
          const w1 = reveal1;
          const wTotal = w1 + reveal2;
          leg = Math.random() * wTotal < w1 ? 0 : 1;
        } else {
          leg = canSpawnLeg1 ? 0 : 1;
        }
        const railIdx = pickFullRail(Math.random);
        const traversal = TRAVERSE_MIN_S + Math.random() * (TRAVERSE_MAX_S - TRAVERSE_MIN_S);
        const ph = photons.current[freeIdx];
        ph.active = true;
        ph.leg = leg;
        ph.railIdx = railIdx;
        ph.t = 0;
        ph.speed = 1 / traversal;
      }
      lastSpawn.current = now;
      nextSpawnDelay.current = SPAWN_MIN_S + Math.random() * (SPAWN_MAX_S - SPAWN_MIN_S);
    }

    const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const alphaAttr = geometry.getAttribute("aAlpha") as THREE.BufferAttribute;
    const lifeAttr = geometry.getAttribute("aLife") as THREE.BufferAttribute;
    posAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
    lifeAttr.needsUpdate = true;
  });

  if (!geometry) return null;

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}
