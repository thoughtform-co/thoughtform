"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { lerp, useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getSmoothedEpilogueProgress } from "./motionFollower";
import { getSubstrateRealmEnvelope } from "./sceneGeom";
import {
  HFOV_TAN,
  INT_Z,
  PARK_CAM_Z,
  REALM_ROW_BIAS,
  REALM_WIDTH_MARGIN,
  REALM_Z_FAR,
  REALM_Z_NEAR,
  terrainHeight,
} from "./substrateTerrain";

/**
 * SubstrateTopography — the realm OUTSIDE the wormhole, and the
 * THRESHOLD WAVE that transports you into it (v3.12c, ADR-018).
 *
 * Two coupled systems in one painter:
 *
 * 1. THE REALM — a latent-topography valley far BELOW the flight
 *    line. The camera and sphere never move (their positions are
 *    owned by the corridor); the terrain sits deep beneath them, so
 *    arriving at Build reads as hanging high in the sky over a vast
 *    topology — basin floor under the optical axis, ridges rising
 *    toward the periphery, the whole landscape receding past the
 *    visible-far haze. Dotted rows double as contour lines.
 *
 * 2. THE CROSSING — a gravitational-wave transition. Exiting a
 *    wormhole should be an EVENT, not a fade. At the threshold a
 *    DISSIPATING PARTICLE WAVE radiates out of the sphere — not
 *    ruled concentric rings: a circular band of scattered dots
 *    (the sphere's own silhouette expanding) whose spread widens
 *    and loosens as it travels, like energy dissipating through
 *    the latent medium (Colorpong "Cosmos" reference, recast in
 *    the dawn/gold system). In its wake the realm UNFURLS:
 *
 *      - terrain reveal is keyed to DEPTH from the parked
 *        viewpoint: the nearest ground (bottom of the frame)
 *        catches first, then the front rolls away along the Z
 *        axis to the horizon — the realm unfurls beneath the
 *        visitor while the particle wave sweeps the sky above it.
 *        A small lateral fan ripples each row outward from the
 *        optical axis a beat after its centre;
 *      - points at the unfurl front carry a gold-lifted flash and
 *        a small vertical swell (the ground ripples as the wave
 *        crosses it);
 *      - behind the front the realm settles to its resting state.
 *
 *    SPEED RAMPS (v3.12c ramp pass): the wave channel rides a
 *    CASCADED damped follower (two exponential stages → zero
 *    velocity at onset) plus a quintic remap for the terrain — the
 *    editorial slow-in / fast-middle / slow-out of an AE speed
 *    ramp, frame-rate independent, converging to the exact
 *    scrubbed value when the user parks. The particle front runs
 *    a slightly snappier single-stage chase so the SHOCK leads
 *    and the unfurl follows. Scroll-symmetric throughout.
 *
 * ADR-018 contract:
 *   - World-fixed geometry, built once, deterministic (hash-seeded)
 *     — no idle motion; the only animation channels are the damped
 *     followers settling and camera parallax.
 *   - Per-frame work is uniform writes only.
 *   - Skipped on mobile-narrow viewports (same gate as the walls).
 *   - Recedes (not vanishes) during the epilogue flyover.
 */

// ── Palette ──────────────────────────────────────────────────────

const DAWN_HEX = "#ebe3d6";
const DAWN_SOFT_HEX = "#d6cdb5";
const GOLD_HEX = "#caa554";

// ── Camera-frame + terrain-layout constants ─────────────────────
// Extracted to `substrateTerrain.ts` (single source of the relief
// math): INT_Z, PARK_CAM_Z, HFOV_TAN, REALM_Z_NEAR/FAR,
// REALM_ROW_BIAS, REALM_WIDTH_MARGIN and the terrainHeight() relief.
// Imported above; the values are unchanged and the built realm
// buffer is bit-identical.

/** Terrain rows (Z slices) and samples per row. Anisotropic on
 *  purpose: dense along X, discrete in Z — from high above, the
 *  rows read as topographic contour lines crossing the valley. */
const REALM_ROWS = 38;
const REALM_SAMPLES_PER_ROW = 164;

/** Visibility + material. */
const REALM_VISIBLE_FAR = 74;
const REALM_OPACITY_BASE = 1.05;

/** Epilogue recession floor. */
const REALM_EPILOGUE_FLOOR = 0.4;

// ── Threshold wave ("the Crossing") ─────────────────────────────

/** The wave's world plane: centred on the sphere (optical axis) at
 *  the Build station Z. */
const WAVE_CENTER_Y = 0;
const WAVE_PLANE_Z = INT_Z;

/** Launch radius — the sphere's limb. The wave is the sphere's own
 *  CIRCULAR silhouette expanding (v3.12c shape note: matches the
 *  artifact, not the corridor's oval), so it visibly emerges from
 *  the artifact itself. */
const WAVE_R_LAUNCH = 1.5;
/** Radius at which the dissipating band has cleared every frame
 *  corner at the park viewpoint (half-diagonal ≈ 4.4 at the wave
 *  plane; margin past it so the last particles exit off-screen). */
const WAVE_R_MAX = 6.35;

/** Diagram cascade (v3.13b — instrument rebalance). The crossing keeps
 *  its full-screen layered reach, but each layer is one of four QUIET
 *  archetypes — hairline ring, grain arcs, bearing ticks, anchor pips —
 *  plus sparse dotted filaments on every third layer. The mass of the
 *  effect is fine dawn-soft dots at low alpha; diamonds and gold are
 *  reserved for the few registration markers, so the threshold reads
 *  as drafted instrument layers rather than a wall of identical
 *  bright dots. */
const WAVE_DIAGRAM_LAYER_COUNT = 9;
const WAVE_LAYER_DELAY_SPAN = 0.24;
const WAVE_LAYER_RADIUS_OFFSET = 0.46;
const WAVE_SPOKE_RADIUS_SPAN = 1.0;
const WAVE_FRONT_PEAK_ALPHA = 1.55;

/** Unfurl cascade. The ground now catches from the sphere's footprint,
 *  not from the viewport bottom: the same diagram circles that open
 *  out of the artifact trigger the terrain beneath them, then the
 *  surface rolls away like a carpet across X/Z. Sum of span + jitter
 *  stays < 1 so the whole realm is resolved when the wave channel
 *  saturates. */
const WAVE_UNFURL_SPAN = 0.78;
const WAVE_DELAY_JITTER = 0.05;
/** Ground-plane rollout origin: the terrain starts just behind the
 *  sphere plane, so the first ignition appears below the artifact
 *  and not at the camera's lower frame edge. */
const WAVE_ROLLOUT_ORIGIN_Z = REALM_Z_NEAR;
const WAVE_ROLLOUT_Z_REACH = Math.abs(REALM_Z_FAR - REALM_Z_NEAR);
/** Lateral contribution is screen-normalized so the front reads as an
 *  expanding circle/ellipse from the sphere even as rows widen with
 *  perspective. Kept below 1 so the rollout's dominant direction is
 *  forward into the landscape, not sideways to the rails. */
const WAVE_ROLLOUT_X_WEIGHT = 0.58;
const WAVE_ROLLOUT_RADIUS_POWER = 0.86;

/** Per-point ignition band width (in wave-time units). Widened
 *  0.075 → 0.13 in the ramp pass — each row eases up over a longer
 *  beat instead of popping. */
const WAVE_REVEAL_BAND = 0.18;
/** Flash half-width — the gold-lifted band riding the unfurl
 *  front. Widened with the reveal band so the highlight breathes. */
const WAVE_FLASH_WIDTH = 0.14;
/** Vertical swell at the unfurl front (world units). */
const WAVE_SWELL = 0.28;

/** Speed-ramp followers (v3.12c ramp pass).
 *  - FRONT: cascaded two-stage chase — the diagram rings now have
 *    zero-velocity onset too, so the visible threshold doesn't kick.
 *  - TERRAIN: cascaded two-stage chase (zero-velocity onset) +
 *    quintic remap — the unfurl follows with an editorial
 *    slow-in / slow-out. Settle ≈ 1s on a fast flick. */
const WAVE_FRONT_RESPONSE = 5.8;
const WAVE_TERRAIN_RESPONSE = 3.2;

// ── Shaders ──────────────────────────────────────────────────────

const realmVertex = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
uniform vec3 uCameraPos;
uniform float uWave;

attribute vec3 aColor;
attribute float aSize;
attribute float aDelay;

varying vec3 vColor;
varying float vAlpha;

const vec3 GOLD = vec3(0.792, 0.647, 0.329);

void main() {
  // Unfurl terms. uWave is the terrain's EASED wave channel; each
  // point's delay is its world-space radial distance from the
  // sphere-footprint origin, so the realm rolls out from the circle.
  float on = smoothstep(aDelay, aDelay + ${WAVE_REVEAL_BAND.toFixed(3)}, uWave);
  float frontDist = abs(uWave - aDelay);
  float flash = smoothstep(${WAVE_FLASH_WIDTH.toFixed(3)}, 0.0, frontDist);

  // The ground swells as the front crosses it — the gravitational-
  // wave displacement. Static buffers; the motion lives entirely in
  // this uniform-driven term.
  vec3 pos = position;
  pos.y += flash * ${WAVE_SWELL.toFixed(2)};

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  float dist = distance(position, uCameraPos);

  // Atmospheric depth: the valley dissolves into haze toward the
  // horizon instead of ending at a hard far plane.
  float farFade = smoothstep(${REALM_VISIBLE_FAR.toFixed(1)}, ${(REALM_VISIBLE_FAR - 16).toFixed(
    1
  )}, dist);
  float nearFade = smoothstep(2.5, 5.0, dist);

  // Gold-lifted flash at the front; resting palette in the wake.
  vColor = mix(aColor, GOLD, flash * 0.6);
  vAlpha = on * farFade * nearFade * (1.0 + 2.8 * flash);

  float sizeFactor = clamp(11.0 / max(0.5, dist), 0.42, 1.6);
  gl_PointSize = uPointSize * uPixelRatio * sizeFactor * aSize * (1.0 + 0.8 * flash);
}
`;

const realmFragment = /* glsl */ `
uniform float uOpacity;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  // Soft round dots — same family as the wormhole walls so the
  // realm reads as the same latent material, just landscape-shaped.
  float core = smoothstep(0.5, 0.0, d);
  float alpha = core * vAlpha * uOpacity;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(vColor, alpha);
}
`;

// Diagram cascade — every particle's position is derived per frame
// from uFrontPhase alone (static attributes), so the whole crossing is
// one draw call with zero CPU vertex work.
const waveVertex = /* glsl */ `
uniform float uPixelRatio;
uniform float uFrontPhase;

attribute float aAngle;
attribute float aRadiusOffset;
attribute float aDelay;
attribute float aSize;
attribute vec3 aColor;
attribute float aAlpha;
attribute float aShimmer;
// 0 = soft round grain dot, 1 = crisp diamond registration marker.
attribute float aShape;

varying vec3 vColor;
varying float vAlpha;
varying float vShape;

const float R_LAUNCH = ${WAVE_R_LAUNCH.toFixed(2)};
const float R_MAX = ${WAVE_R_MAX.toFixed(2)};
const vec3 DAWN_SOFT = vec3(0.839, 0.804, 0.710);

float smootherstep01(float t) {
  float x = clamp(t, 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

void main() {
  float phase = uFrontPhase;

  // Each layer starts a beat after the previous one. The radius eases
  // twice so the diagram opens with a slow-in / fast-middle / slow-out
  // cadence instead of a stamped radial blast.
  float layerPhase = clamp((phase - aDelay) / max(0.001, 1.0 - aDelay * 0.35), 0.0, 1.0);
  // Reach the full viewport early enough to read as a threshold event,
  // but use a C2-continuous speed graph (zero velocity + acceleration
  // at the boundaries) so the visible rings don't kick on launch.
  float eased = smootherstep01(layerPhase / 0.68);
  float r = mix(R_LAUNCH + aRadiusOffset, R_MAX + aRadiusOffset * 0.25, eased);

  vec3 pos = vec3(cos(aAngle) * r, WAVE_CENTER_Y_GLSL + sin(aAngle) * r, 0.0);
  vec4 mv = modelViewMatrix * vec4(pos.x, pos.y, ${WAVE_PLANE_Z.toFixed(2)}, 1.0);
  gl_Position = projectionMatrix * mv;

  // Alpha: layer boot → sustained diagram read → off-frame yield.
  // Shimmer is phase-keyed, never idle, so a parked section is still.
  float boot = smoothstep(0.0, 0.08, layerPhase);
  float yield = 1.0 - smoothstep(0.88, 1.0, layerPhase);
  float shimmer = 0.94 + 0.06 * sin(aShimmer * 6.2832 + phase * 7.0);
  vAlpha = boot * yield * aAlpha * shimmer;

  // Colour cools toward dawn-soft as each layer travels outward.
  vColor = mix(aColor, DAWN_SOFT, layerPhase * 0.18);
  vShape = aShape;

  // Markers start a hair stronger, then settle into fine drafting
  // dots as the layer clears the frame.
  gl_PointSize = aSize * uPixelRatio * mix(1.18, 0.82, layerPhase);
}
`;

const waveFragment = /* glsl */ `
uniform float uOpacity;

varying vec3 vColor;
varying float vAlpha;
varying float vShape;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  // Two dot vocabularies (per-particle aShape): soft round grain for
  // the quiet mass of the diagram, crisp diamonds for the sparse
  // registration markers — same split the rest of the HUD uses.
  float roundCore = smoothstep(0.5, 0.12, length(uv));
  float diamondCore = 1.0 - smoothstep(0.2, 0.46, abs(uv.x) + abs(uv.y));
  float core = mix(roundCore, diamondCore, vShape);
  float alpha = core * vAlpha * uOpacity;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(vColor, alpha);
}
`;

// ── Geometry ─────────────────────────────────────────────────────

/** Deterministic hash — the terrain must be identical every load
 *  (ADR-018 "same landmarks every visit"). */
function hash(n: number): number {
  const s = Math.sin(n) * 43758.5453;
  return s - Math.floor(s);
}

function buildRealm(): {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  delays: Float32Array;
} {
  const positions: number[] = [];
  const colors: number[] = [];
  const sizes: number[] = [];
  const delays: number[] = [];

  const dawn = new THREE.Color(DAWN_HEX);
  const dawnSoft = new THREE.Color(DAWN_SOFT_HEX);
  const gold = new THREE.Color(GOLD_HEX);

  for (let r = 0; r < REALM_ROWS; r++) {
    const rowT = REALM_ROWS > 1 ? r / (REALM_ROWS - 1) : 0;
    const zRow = lerp(REALM_Z_NEAR, REALM_Z_FAR, Math.pow(rowT, REALM_ROW_BIAS));

    const camDist = Math.max(1, PARK_CAM_Z - zRow);
    const xHalf = HFOV_TAN * camDist * REALM_WIDTH_MARGIN + 0.6;
    const spacing = (xHalf * 2) / REALM_SAMPLES_PER_ROW;

    for (let i = 0; i < REALM_SAMPLES_PER_ROW; i++) {
      const seed = r * 977.13 + i * 13.7;
      const h1 = hash(seed + 0.731);
      const h2 = hash(seed + 4.547);
      const h3 = hash(seed + 9.193);

      const u = REALM_SAMPLES_PER_ROW > 1 ? i / (REALM_SAMPLES_PER_ROW - 1) : 0;
      const x = -xHalf + u * 2 * xHalf + (h1 - 0.5) * spacing * 0.4;
      const z = zRow + (h2 - 0.5) * 0.35;
      const edgeT = Math.min(1, Math.abs(x) / xHalf);
      const y = terrainHeight(x, z, edgeT, rowT) + (h3 - 0.5) * 0.05;

      positions.push(x, y, z);

      let c: THREE.Color;
      if (h3 > 0.96 && edgeT > 0.4) c = gold;
      else if (h3 > 0.7) c = dawn;
      else c = dawnSoft;
      colors.push(c.r, c.g, c.b);

      sizes.push(0.55 + h1 * 0.5 + rowT * 0.35);

      // Unfurl delay: the sphere's footprint owns the cascade. The
      // topology catches at the centre under the artifact, then rolls
      // outward/forward like a carpet from the diagram circles.
      const pdist = Math.max(1, PARK_CAM_Z - z);
      const forwardNorm = Math.min(
        1,
        Math.max(0, (WAVE_ROLLOUT_ORIGIN_Z - z) / WAVE_ROLLOUT_Z_REACH)
      );
      const sxAbs = Math.min(1, Math.abs(x / (pdist * HFOV_TAN)));
      const radialNorm = Math.min(
        1,
        Math.sqrt(forwardNorm * forwardNorm + Math.pow(sxAbs * WAVE_ROLLOUT_X_WEIGHT, 2))
      );
      delays.push(
        Math.pow(radialNorm, WAVE_ROLLOUT_RADIUS_POWER) * WAVE_UNFURL_SPAN + h2 * WAVE_DELAY_JITTER
      );
    }
  }

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    sizes: new Float32Array(sizes),
    delays: new Float32Array(delays),
  };
}

/** Build the diagram-cascade attributes. Positions are computed per
 *  frame in the vertex shader from `uFrontPhase`; the buffer only
 *  carries each particle's identity inside the layered diagram. */
/** Layer archetypes — each ring of the cascade is ONE of these, so the
 *  threshold layers read as different instrument strokes instead of
 *  the same loud arc repeated ten times. */
type WaveLayerKind = "hairline" | "grain" | "ticks" | "anchors";

const WAVE_LAYER_KINDS: readonly WaveLayerKind[] = [
  "hairline",
  "grain",
  "ticks",
  "grain",
  "hairline",
  "anchors",
  "grain",
  "ticks",
  "hairline",
];

function buildWaveParticles(): {
  positions: Float32Array;
  angles: Float32Array;
  radiusOffsets: Float32Array;
  delays: Float32Array;
  sizes: Float32Array;
  colors: Float32Array;
  alphas: Float32Array;
  shimmers: Float32Array;
  shapes: Float32Array;
} {
  const positions: number[] = []; // dummy (shader-owned)
  const angles: number[] = [];
  const radiusOffsets: number[] = [];
  const delays: number[] = [];
  const sizes: number[] = [];
  const colors: number[] = [];
  const alphas: number[] = [];
  const shimmers: number[] = [];
  const shapes: number[] = [];

  const gold = new THREE.Color(GOLD_HEX);
  const dawn = new THREE.Color(DAWN_HEX);
  const dawnSoft = new THREE.Color(DAWN_SOFT_HEX);

  const push = (
    angle: number,
    radiusOffset: number,
    delay: number,
    size: number,
    color: THREE.Color,
    alpha: number,
    shimmer: number,
    shape: 0 | 1
  ) => {
    positions.push(0, 0, 0);
    angles.push(angle);
    radiusOffsets.push(radiusOffset);
    delays.push(delay);
    sizes.push(size);
    colors.push(color.r, color.g, color.b);
    alphas.push(alpha);
    shimmers.push(shimmer);
    shapes.push(shape);
  };

  const tau = Math.PI * 2;

  for (let layer = 0; layer < WAVE_DIAGRAM_LAYER_COUNT; layer++) {
    const layerT = WAVE_DIAGRAM_LAYER_COUNT > 1 ? layer / (WAVE_DIAGRAM_LAYER_COUNT - 1) : 0;
    const delay = layerT * WAVE_LAYER_DELAY_SPAN;
    const layerSeed = layer * 997.13;
    const ringOffset = (layerT - 0.5) * WAVE_LAYER_RADIUS_OFFSET;
    const layerRotation = layer * 0.31;
    const kind = WAVE_LAYER_KINDS[layer % WAVE_LAYER_KINDS.length];

    if (kind === "hairline") {
      // A thin, near-continuous dotted circle — the quiet structural
      // stroke of the cascade. Fine round dots, no gold.
      const dots = 180;
      for (let i = 0; i < dots; i++) {
        const h = hash(layerSeed + i * 3.911);
        const angle = layerRotation + (i / dots) * tau + (h - 0.5) * 0.004;
        push(
          angle,
          ringOffset,
          delay,
          4.0 + h * 1.45,
          h > 0.62 ? dawn : dawnSoft,
          0.72 + h * 0.18,
          h,
          0
        );
      }
    } else if (kind === "grain") {
      // Loose dust arcs — scattered fine grain with radial jitter so
      // the layer reads as atmosphere, not a drawn line.
      const arcs = 3;
      const span = (tau / arcs) * 0.62;
      for (let a = 0; a < arcs; a++) {
        const centre = layerRotation + (a / arcs) * tau;
        const start = centre - span / 2;
        const dots = 48;
        for (let i = 0; i < dots; i++) {
          const h = hash(layerSeed + a * 53.17 + i * 7.13);
          const angle = start + (i / (dots - 1)) * span + (h - 0.5) * 0.012;
          const rJitter = (hash(layerSeed + a * 11.3 + i * 2.71 + 5.5) - 0.5) * 0.16;
          push(
            angle,
            ringOffset + rJitter,
            delay + h * 0.012,
            3.0 + h * 3.0,
            dawnSoft,
            0.35 + h * 0.25,
            h,
            0
          );
        }
      }
    } else if (kind === "ticks") {
      // Bearing ticks — sparse diamonds on a regular grid; one rare
      // gold cardinal per half-revolution keeps the wayfinding accent.
      const ticks = 14;
      for (let t = 0; t < ticks; t++) {
        const h = hash(layerSeed + t * 17.71 + 88.1);
        const angle = layerRotation * 0.5 + (t / ticks) * tau;
        const cardinal = t % 7 === 0;
        push(
          angle,
          ringOffset,
          delay + 0.01,
          cardinal ? 9.4 + h * 1.6 : 7.0 + h * 1.5,
          cardinal ? gold : dawn,
          cardinal ? 0.95 : 0.72,
          h,
          1
        );
      }
    } else {
      // Anchor pips — the rarest, most deliberate layer: eight
      // diamonds, alternating gold/dawn, slightly off the ring line.
      const pips = 8;
      for (let p = 0; p < pips; p++) {
        const h = hash(layerSeed + p * 23.91 + 41.7);
        const angle = layerRotation + (p / pips) * tau + tau / (pips * 2);
        const isGold = p % 2 === 0;
        push(
          angle,
          ringOffset + (h - 0.5) * 0.1,
          delay + 0.012,
          8.6 + h * 1.9,
          isGold ? gold : dawn,
          isGold ? 0.9 : 0.74,
          h,
          1
        );
      }
    }

    // Quiet dotted filaments on every third layer — they keep the
    // sphere visibly connected to the rollout without the starburst
    // read of full radial spokes on every ring.
    if (layer % 3 === 1) {
      const spokes = 5;
      for (let s = 0; s < spokes; s++) {
        const spokeAngle = layerRotation * 0.7 + (s / spokes) * tau + tau / (spokes * 2);
        const dots = 9;
        for (let d = 0; d < dots; d++) {
          const u = d / (dots - 1);
          const h = hash(layerSeed + s * 31.37 + d * 7.19 + 12.4);
          push(
            spokeAngle + (h - 0.5) * 0.005,
            ringOffset - WAVE_SPOKE_RADIUS_SPAN * (1 - u),
            delay + u * 0.03,
            2.6 + u * 2.1 + h * 0.9,
            dawnSoft,
            0.28 + u * 0.32,
            h,
            0
          );
        }
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    angles: new Float32Array(angles),
    radiusOffsets: new Float32Array(radiusOffsets),
    delays: new Float32Array(delays),
    sizes: new Float32Array(sizes),
    colors: new Float32Array(colors),
    alphas: new Float32Array(alphas),
    shimmers: new Float32Array(shimmers),
    shapes: new Float32Array(shapes),
  };
}

/** Quintic smootherstep — zero velocity AND acceleration at both
 *  ends. The terrain unfurl's progress-domain speed ramp. */
function quintic(t: number): number {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * x * (x * (x * 6 - 15) + 10);
}

// ── Component ────────────────────────────────────────────────────

export function SubstrateTopography() {
  const pointsRef = useRef<THREE.Points>(null);
  const wavePointsRef = useRef<THREE.Points>(null);
  /** Front chase (cascaded two-stage — smooth ring speed graph). */
  const frontMidRef = useRef<number>(0);
  const frontRef = useRef<number>(0);
  /** Terrain chase (cascaded two-stage — zero-velocity onset). */
  const terrainMidRef = useRef<number>(0);
  const terrainRef = useRef<number>(0);

  // Same mobile-narrow gate as the wormhole walls.
  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 760;
  }, []);

  const geometry = useMemo(() => {
    if (!enabled) return null;
    const { positions, colors, sizes, delays } = buildRealm();
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geom.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute("aDelay", new THREE.BufferAttribute(delays, 1));
    return geom;
  }, [enabled]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: realmVertex,
      fragmentShader: realmFragment,
      uniforms: {
        uPointSize: { value: 8.2 },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uCameraPos: { value: new THREE.Vector3() },
        uWave: { value: 0 },
        uOpacity: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  const waveGeometry = useMemo(() => {
    if (!enabled) return null;
    const { positions, angles, radiusOffsets, delays, sizes, colors, alphas, shimmers, shapes } =
      buildWaveParticles();
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
    geom.setAttribute("aRadiusOffset", new THREE.BufferAttribute(radiusOffsets, 1));
    geom.setAttribute("aDelay", new THREE.BufferAttribute(delays, 1));
    geom.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geom.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    geom.setAttribute("aShimmer", new THREE.BufferAttribute(shimmers, 1));
    geom.setAttribute("aShape", new THREE.BufferAttribute(shapes, 1));
    return geom;
  }, [enabled]);

  const waveMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: waveVertex.replace("WAVE_CENTER_Y_GLSL", WAVE_CENTER_Y.toFixed(2)),
      fragmentShader: waveFragment,
      uniforms: {
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uFrontPhase: { value: 0 },
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
      waveMaterial.dispose();
      waveGeometry?.dispose();
    };
  }, [material, geometry, waveMaterial, waveGeometry]);

  useFrame((state, delta) => {
    if (!geometry) return;
    const { camera, viewport } = state;
    const dt = Math.min(0.1, Math.max(0, delta));

    const { paintProgress, active, armed } = useDepthGatewayStore.getState().transform;
    const painting = active || armed;

    material.uniforms.uPixelRatio.value = viewport.dpr;
    waveMaterial.uniforms.uPixelRatio.value = viewport.dpr;
    (material.uniforms.uCameraPos.value as THREE.Vector3).copy(camera.position);

    if (!painting) {
      frontMidRef.current = 0;
      frontRef.current = 0;
      terrainMidRef.current = 0;
      terrainRef.current = 0;
      material.uniforms.uWave.value = 0;
      material.uniforms.uOpacity.value = 0;
      waveMaterial.uniforms.uFrontPhase.value = 0;
      waveMaterial.uniforms.uOpacity.value = 0;
      const wavePts = wavePointsRef.current;
      if (wavePts) wavePts.visible = false;
      return;
    }

    const waveTarget = getSubstrateRealmEnvelope(paintProgress);

    // FRONT: cascaded chase — the visible diagram rings get zero
    // initial velocity instead of the single-exponential kick.
    const kFront = 1 - Math.exp(-WAVE_FRONT_RESPONSE * dt);
    frontMidRef.current += (waveTarget - frontMidRef.current) * kFront;
    frontRef.current += (frontMidRef.current - frontRef.current) * kFront;

    // TERRAIN: cascaded two-stage chase + quintic remap — the AE
    // speed ramp. Zero velocity at onset (slow-in), exponential tail
    // (slow-out), quintic shaping the progress domain in between.
    const kTerrain = 1 - Math.exp(-WAVE_TERRAIN_RESPONSE * dt);
    terrainMidRef.current += (waveTarget - terrainMidRef.current) * kTerrain;
    terrainRef.current += (terrainMidRef.current - terrainRef.current) * kTerrain;
    material.uniforms.uWave.value = quintic(terrainRef.current);

    // Epilogue recession.
    const ep = getSmoothedEpilogueProgress();
    const epDamp = 1 - (1 - REALM_EPILOGUE_FLOOR) * epilogueBand(ep);
    material.uniforms.uOpacity.value = REALM_OPACITY_BASE * epDamp;

    // Diagram cascade.
    const phase = frontRef.current;
    waveMaterial.uniforms.uFrontPhase.value = phase;
    waveMaterial.uniforms.uOpacity.value = WAVE_FRONT_PEAK_ALPHA;
    const wavePts = wavePointsRef.current;
    if (wavePts) wavePts.visible = phase > 0.005 && phase < 0.995;
  });

  if (!geometry) return null;

  return (
    <group>
      <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
      {waveGeometry && (
        <points
          ref={wavePointsRef}
          geometry={waveGeometry}
          material={waveMaterial}
          visible={false}
          frustumCulled={false}
        />
      )}
    </group>
  );
}

/** Smoothstep of the epilogue flight band [0.1, 0.55] — local helper
 *  so the recession curve is owned here, next to its floor constant. */
function epilogueBand(ep: number): number {
  if (ep <= 0.1) return 0;
  if (ep >= 0.55) return 1;
  const t = (ep - 0.1) / 0.45;
  return t * t * (3 - 2 * t);
}
