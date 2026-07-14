"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { lerp, smoothstep, useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getSmoothedThoughtformOffsetX } from "./motionFollower";
import { STATION_THOUGHTFORM, getThoughtformBootEnvelope } from "./sceneGeom";

/**
 * GatewayThroat — the visible interior of the portal at the parked
 * Thoughtform beat (the "you can see the wormhole through the gate"
 * hint).
 *
 * Problem this solves: at the opening park the compass gate reads as
 * a flat picture on the right of the frame. The real corridor
 * (`LatentWormholeWalls` leg 1) deliberately reveals only AFTER the
 * user leaves the park (0.12–0.24), and the `ThoughtformAtmosphere`
 * behind the gate is unstructured dust — so nothing communicates that
 * the portal has an inside. This layer gives the gate a receding
 * throat without breaking the "parked beat stays clean" doctrine,
 * because it is scoped to the gate's own footprint, not the corridor
 * axis.
 *
 * Composition (all dots, matching the wormhole's particle vocabulary —
 * the gate itself is crisp linework, so the throat visibly dissolves
 * from instrument-lines into substrate-dots with depth):
 *
 *   1. PORTAL ECHOES — 6 dotted square loops behind the gate plane,
 *      each deeper one slightly smaller and dimmer. Repeated
 *      diminishing echoes of the same shape are the strongest
 *      monocular depth cue available (perspective convergence +
 *      texture gradient), and because the geometry is world-fixed,
 *      the camera's look-bob / centering pan produces real parallax
 *      between the gate frame and the deep echoes for free.
 *   2. THROAT RAILS — 8 dotted vanishing lines along the echo
 *      corners + edge midpoints, the longitudinal "tube" cue that
 *      hands off visually to the wormhole rails the user flies
 *      through seconds later.
 *   3. FAR GLIMMER — a sparse twinkling cluster past the last echo
 *      (clock-driven, same sanctioned life-signal family as the
 *      atmosphere twinkle + compass orbit dots). Reads as open space
 *      beyond the door — the same trick the corridor uses for its
 *      far exit mouth.
 *
 * Choreography contract:
 *
 *   - Welded to the gate: position.x tracks
 *     `STATION_THOUGHTFORM.x + getSmoothedThoughtformOffsetX()` per
 *     frame, identical to `ThoughtformCompassGate`, so the throat
 *     rides the centering pan with zero drift.
 *   - Boot: alpha gets the same `getThoughtformBootEnvelope` lift
 *     (× (1 + boot·0.18)) as the compass, so the throat powers on
 *     with the gateway instead of being a separate object.
 *   - HANDOFF: fades out across [0.125, 0.21] while the real leg-1
 *     wormhole walls reveal across [0.12, 0.24]. The two overlap as
 *     a cross-dissolve, so the hinted tunnel reads as BECOMING the
 *     wormhole — the user never sees two competing structures.
 *   - World-fixed doctrine (ADR-018): structure dots hold still;
 *     only the glimmer twinkles (clock-driven, precedented). No
 *     idle drift, no spin — the gate's own breath-spin over a
 *     static throat is itself a relative-motion depth cue.
 *
 * Desktop-only (same `innerWidth >= 760` gate as the walls layer);
 * the centred mobile composition keeps the gate footprint clean.
 */

// ── Palette (matches the wormhole walls) ──────────────────────────

const DAWN_SOFT_HEX = "#d6cdb5";
const GOLD_HEX = "#caa554";

// ── Throat geometry constants ─────────────────────────────────────

/** Echo plane depths behind the gate plane (local Z, world units).
 *  Spacing accelerates with depth so the PROJECTED gaps stay roughly
 *  even — uniform world spacing would perspective-compress the far
 *  echoes into a single clump. */
const ECHO_DEPTHS = [-0.55, -1.25, -2.1, -3.15, -4.4, -5.9] as const;

/** Echo half-sides. Start just inside the gate's outer square loop
 *  (0.75) and shrink ~5.5% per step BEYOND natural perspective so
 *  the throat visibly converges — a parallel tube would read as a
 *  box, not a passage. */
const ECHO_HALF_SIDES = [0.709, 0.668, 0.626, 0.585, 0.544, 0.503] as const;

/** Per-echo base alpha — diminishing into dark. The first echo sits
 *  between the gate's faint outer loops (0.32/0.36) and its gold
 *  inner loops (0.56/0.76), so the throat is legible at the initial
 *  park (boot = 0 until ~0.03) while the gate stays the crisp
 *  foreground instrument. */
const ECHO_ALPHAS = [0.375, 0.305, 0.245, 0.19, 0.145, 0.105] as const;

/** Approximate world-unit spacing between echo perimeter dots. */
const ECHO_DOT_SPACING = 0.16;

/** Dots per throat rail (corner/midpoint vanishing lines). */
const RAIL_DOTS = 8;

/** Far-glimmer cluster: sparse dots past the last echo. */
const GLIMMER_COUNT = 36;
const GLIMMER_Z_NEAR = -6.5;
const GLIMMER_Z_SPREAD = -1.1;
const GLIMMER_R_MIN = 0.1;
const GLIMMER_R_MAX = 0.42;

/** Handoff fade window (paintProgress): the throat dissolves while
 *  the real leg-1 wormhole reveals (0.12–0.24), centring the
 *  cross-dissolve around ~0.17. Starts just after the dolly release
 *  (0.109) so the parked read is untouched. */
const HANDOFF_FADE_START = 0.125;
const HANDOFF_FADE_END = 0.21;

/** Boot-envelope alpha boost — same constant family as the compass
 *  (`COMPASS_BOOT_BOOST = 0.18`). */
const THROAT_BOOT_BOOST = 0.18;

/** Global material opacity once parked (pre-boost). */
const OPACITY_BASE = 0.92;

// ── Shaders ───────────────────────────────────────────────────────

const throatVertex = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
uniform vec3 uCameraPos;
uniform float uTime;

attribute vec3 aColor;
attribute float aAlpha;
attribute float aSize;
// < 0 → static structure dot. >= 0 → glimmer dot; value is the
// per-dot twinkle phase.
attribute float aTwinklePhase;

varying vec3 vColor;
varying float vAlpha;

void main() {
  // The throat group is translated laterally by the centering pan,
  // so camera distance must be computed from WORLD position (the
  // walls shader can use raw \`position\` only because its group sits
  // at identity).
  vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  float dist = distance(worldPos, uCameraPos);

  // Near-plane guard: if a fast flick carries the camera into the
  // throat before the handoff fade completes, dots passing the
  // camera dissolve instead of flashing across the frame.
  float nearFade = smoothstep(0.6, 1.8, dist);

  float twinkle = aTwinklePhase < 0.0
    ? 1.0
    : 0.72 + 0.28 * sin(uTime * 0.9 + aTwinklePhase);

  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;

  vColor = aColor;
  vAlpha = aAlpha * nearFade * twinkle;

  // Same distance-attenuation recipe as the wormhole walls so the
  // two layers read as one material family at the handoff.
  float sizeFactor = clamp(7.0 / max(0.5, dist), 0.55, 2.6);
  gl_PointSize = uPointSize * uPixelRatio * sizeFactor * aSize;
}
`;

const throatFragment = /* glsl */ `
uniform float uOpacity;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float core = smoothstep(0.5, 0.0, d);
  float alpha = core * vAlpha * uOpacity;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(vColor, alpha);
}
`;

// ── Geometry builder ──────────────────────────────────────────────

interface ThroatBuffers {
  positions: number[];
  colors: number[];
  alphas: number[];
  sizes: number[];
  twinklePhases: number[];
}

function pushDot(
  buf: ThroatBuffers,
  x: number,
  y: number,
  z: number,
  color: THREE.Color,
  alpha: number,
  size: number,
  twinklePhase = -1
): void {
  buf.positions.push(x, y, z);
  buf.colors.push(color.r, color.g, color.b);
  buf.alphas.push(alpha);
  buf.sizes.push(size);
  buf.twinklePhases.push(twinklePhase);
}

/** Deterministic 0..1 hash (same recipe as the walls builders). */
function hash01(n: number): number {
  const s = Math.sin(n) * 43758.5453;
  return s - Math.floor(s);
}

function buildThroat(): {
  positions: Float32Array;
  colors: Float32Array;
  alphas: Float32Array;
  sizes: Float32Array;
  twinklePhases: Float32Array;
} {
  const buf: ThroatBuffers = {
    positions: [],
    colors: [],
    alphas: [],
    sizes: [],
    twinklePhases: [],
  };
  const dawnSoft = new THREE.Color(DAWN_SOFT_HEX);
  const gold = new THREE.Color(GOLD_HEX);

  // 1 — Portal echoes: dotted square loops. Each edge is sampled
  // from corner A toward corner B excluding the endpoint, so corners
  // land exactly once. Corner dots are slightly larger; alternating
  // echoes carry gold corners (sparse — gold remains the brandmark's
  // colour, these are registration accents).
  for (let i = 0; i < ECHO_DEPTHS.length; i++) {
    const z = ECHO_DEPTHS[i];
    const h = ECHO_HALF_SIDES[i];
    const alpha = ECHO_ALPHAS[i];
    const corners: [number, number][] = [
      [-h, h],
      [h, h],
      [h, -h],
      [-h, -h],
    ];
    const dotsPerEdge = Math.max(4, Math.round((2 * h) / ECHO_DOT_SPACING));
    const cornerColor = i % 2 === 0 ? gold : dawnSoft;

    for (let e = 0; e < 4; e++) {
      const [ax, ay] = corners[e];
      const [bx, by] = corners[(e + 1) % 4];
      for (let k = 0; k < dotsPerEdge; k++) {
        const t = k / dotsPerEdge;
        const x = ax + (bx - ax) * t;
        const y = ay + (by - ay) * t;
        const isCorner = k === 0;
        pushDot(
          buf,
          x,
          y,
          z,
          isCorner ? cornerColor : dawnSoft,
          isCorner ? Math.min(1, alpha * 1.35) : alpha,
          isCorner ? 1.2 : 0.85
        );
      }
    }
  }

  // 2 — Throat rails: dotted vanishing lines along the 4 corners +
  // 4 edge midpoints, interpolating between the first and last echo
  // planes so they thread the whole stack.
  const railDirs: [number, number][] = [
    [-1, 1],
    [1, 1],
    [1, -1],
    [-1, -1], // corners
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0], // edge midpoints
  ];
  const firstZ = ECHO_DEPTHS[0];
  const lastZ = ECHO_DEPTHS[ECHO_DEPTHS.length - 1];
  const firstH = ECHO_HALF_SIDES[0];
  const lastH = ECHO_HALF_SIDES[ECHO_HALF_SIDES.length - 1];
  for (let r = 0; r < railDirs.length; r++) {
    const [dx, dy] = railDirs[r];
    for (let s = 0; s < RAIL_DOTS; s++) {
      const t = s / (RAIL_DOTS - 1);
      const z = lerp(firstZ, lastZ, t);
      const h = lerp(firstH, lastH, t);
      const alpha = lerp(0.16, 0.07, t);
      pushDot(buf, dx * h, dy * h, z, dawnSoft, alpha, 0.7);
    }
  }

  // 3 — Far glimmer: sparse twinkling dots past the last echo, inside
  // its aperture. Golden-angle disc scatter for an organic spread; a
  // few gold accents say "warm space beyond the door".
  for (let g = 0; g < GLIMMER_COUNT; g++) {
    const angle = g * 2.39996; // golden angle
    const rT = hash01(g * 12.9898 + 4.5453);
    const r = lerp(GLIMMER_R_MIN, GLIMMER_R_MAX, Math.sqrt(rT));
    const z = GLIMMER_Z_NEAR + hash01(g * 78.233 + 1.047) * GLIMMER_Z_SPREAD;
    const isGold = hash01(g * 39.425 + 2.665) > 0.86;
    const alpha = 0.1 + hash01(g * 27.619 + 0.731) * 0.12;
    const size = 0.5 + hash01(g * 51.31 + 3.17) * 0.35;
    pushDot(
      buf,
      Math.cos(angle) * r,
      Math.sin(angle) * r,
      z,
      isGold ? gold : dawnSoft,
      alpha,
      isGold ? size + 0.25 : size,
      hash01(g * 17.77 + 5.5) * Math.PI * 2
    );
  }

  return {
    positions: new Float32Array(buf.positions),
    colors: new Float32Array(buf.colors),
    alphas: new Float32Array(buf.alphas),
    sizes: new Float32Array(buf.sizes),
    twinklePhases: new Float32Array(buf.twinklePhases),
  };
}

// ── Component ─────────────────────────────────────────────────────

export function GatewayThroat() {
  const groupRef = useRef<THREE.Group>(null);
  // Accumulated shader time (ADR-038): clamped-dt accumulator replacing
  // absolute `clock.elapsedTime`, so the throat flow doesn't phase-snap
  // when R3F's clock jumps on demand->always re-engage. Advanced only
  // while painting.
  const phaseRef = useRef(0);

  // Desktop-only — same gate as `LatentWormholeWalls` /
  // `LatentTopographyContours`. The centred mobile composition keeps
  // the gate footprint clean.
  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 760;
  }, []);

  const geometry = useMemo(() => {
    if (!enabled) return null;
    const { positions, colors, alphas, sizes, twinklePhases } = buildThroat();
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geom.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    geom.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute("aTwinklePhase", new THREE.BufferAttribute(twinklePhases, 1));
    return geom;
  }, [enabled]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: throatVertex,
      fragmentShader: throatFragment,
      uniforms: {
        uPointSize: { value: 5.5 },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uCameraPos: { value: new THREE.Vector3() },
        uTime: { value: 0 },
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

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group || !geometry) return;

    const t = useDepthGatewayStore.getState().transform;
    const painting = t.active || t.armed;
    if (!painting) {
      group.visible = false;
      material.uniforms.uOpacity.value = 0;
      return;
    }
    group.visible = true;
    phaseRef.current += Math.min(0.1, Math.max(0, delta));
    const p = t.paintProgress;

    // Welded to the gate through the centering pan — identical
    // transform source to `ThoughtformCompassGate`.
    group.position.x = STATION_THOUGHTFORM.position[0] + getSmoothedThoughtformOffsetX();

    material.uniforms.uPixelRatio.value = state.viewport.dpr;
    material.uniforms.uTime.value = phaseRef.current;
    (material.uniforms.uCameraPos.value as THREE.Vector3).copy(state.camera.position);

    // Boot lift (gateway powers on as one beat) × handoff fade-out
    // (the throat dissolves as the real leg-1 wormhole reveals —
    // cross-dissolve, never two competing structures).
    const boot = getThoughtformBootEnvelope(p);
    const handoff = 1 - smoothstep(HANDOFF_FADE_START, HANDOFF_FADE_END, p);
    material.uniforms.uOpacity.value = OPACITY_BASE * handoff * (1 + boot * THROAT_BOOT_BOOST);
  });

  if (!geometry) return null;

  return (
    <group
      ref={groupRef}
      position={[
        STATION_THOUGHTFORM.position[0],
        STATION_THOUGHTFORM.position[1],
        STATION_THOUGHTFORM.position[2],
      ]}
      visible={false}
    >
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}
