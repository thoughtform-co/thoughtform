"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { lerp, useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getSmoothedEpilogueProgress } from "./motionFollower";
import { STATION_INTELLIGENCE, getSubstrateRealmEnvelope } from "./sceneGeom";

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

// ── Camera-frame constants (desktop tuning view) ────────────────

const INT_Z = STATION_INTELLIGENCE.position[2];
/** Camera Z when parked at Build — terrain composition + unfurl
 *  depth normalization are computed against this viewpoint. */
const PARK_CAM_Z = INT_Z + STATION_INTELLIGENCE.parkDistance;

/** tan(horizontal half-FOV) at the desktop tuning frame: 38°
 *  vertical FOV, ~16:9 aspect. Used for frustum-width row sizing
 *  and the unfurl's lateral-fan screen-x term. */
const HFOV_TAN = 0.612;

// ── Terrain layout ───────────────────────────────────────────────

/** Terrain Z span. The near edge starts where ground first enters
 *  the parked camera's lower frame edge (≈ 8 units ahead at the
 *  valley depth below) — nearer rows would never be visible from
 *  the park and would only waste points. */
const REALM_Z_NEAR = INT_Z - 1.5;
const REALM_Z_FAR = INT_Z - 52;

/** Terrain rows (Z slices) and samples per row. Anisotropic on
 *  purpose: dense along X, discrete in Z — from high above, the
 *  rows read as topographic contour lines crossing the valley. */
const REALM_ROWS = 30;
const REALM_SAMPLES_PER_ROW = 150;

/** Row Z distribution bias (> 1 packs rows toward the near edge —
 *  perspective compresses the far rows on screen anyway). */
const REALM_ROW_BIAS = 1.18;

/** Row width margin past the frustum so the valley always bleeds
 *  past the frame edges. */
const REALM_WIDTH_MARGIN = 1.14;

/** Valley placement (v3.12c "higher in the sky" revision). The
 *  camera stays exactly where the corridor parks it — the TERRAIN
 *  dropped. Base floor ~3.4 units below the flight line puts the
 *  visible horizon in the lower third of the frame; the far rise
 *  keeps a legible horizon band instead of an abrupt cut. */
const REALM_BASE_Y = -3.4;
const REALM_HORIZON_LIFT = 0.35;

/** Valley cross-profile: the floor stays deep under the optical
 *  axis and BOWLS upward toward the frame edges — distant ridge
 *  flanks rising at the periphery. */
const REALM_BOWL_RISE = 0.9;
const REALM_BOWL_POWER = 1.8;

/** Relief amplitude: calm basin floor, stronger ridges at the
 *  flanks. */
const REALM_BASIN_AMP = 0.26;
const REALM_EDGE_AMP = 1.25;
const REALM_EDGE_POWER = 1.65;

/** Hard ceiling so no crest ever climbs toward the sphere/copy
 *  band even where the sine stack aligns with the bowl rise. */
const REALM_Y_CEILING = -1.05;

/** Visibility + material. */
const REALM_VISIBLE_FAR = 64;
const REALM_OPACITY_BASE = 0.85;

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
const WAVE_R_MAX = 5.4;

/** Dissipating particle band (replaces the v3.12c ring train).
 *  ~900 dots scattered around the front radius: spread starts as a
 *  tight shell hugging the sphere and loosens as the wave travels
 *  (`BAND_SPREAD_*`), a fraction of particles trail behind the
 *  front stretching back toward the sphere (`TRAIL_PULL`), sizes
 *  are tiered with sparse bold pips (the Colorpong read), and the
 *  whole field dims as it dissipates — energy spreading over area. */
const WAVE_PARTICLE_COUNT = 1600;
/** Band spread (world units around the front radius). Stays TIGHT
 *  through the crossing (growth curve `pow(phase, 1.6)` in the
 *  shader) and only loosens near the end — the front must read as
 *  a coherent wavefront mid-frame, dissolving as it exits. First
 *  build spread linearly to 1.7 over the whole life and the band
 *  thinned into unreadable specks before it ever crossed. */
const WAVE_BAND_SPREAD_LAUNCH = 0.1;
const WAVE_BAND_SPREAD_MAX = 0.9;
const WAVE_TRAIL_PULL = 0.3;
const WAVE_FRONT_PEAK_ALPHA = 1.0;

/** Unfurl cascade. The ground catches at the BOTTOM of the frame
 *  as the wave launches, then rolls away along the Z axis to the
 *  horizon. Depth owns the per-point delay; a small lateral fan
 *  makes each row ripple outward from the optical axis a beat
 *  after its centre; jitter keeps the rolling front shimmering.
 *  Sum of spans + jitter + reveal band stays < 1 so the whole
 *  realm is resolved when the wave channel saturates. */
const WAVE_UNFURL_SPAN = 0.68;
const WAVE_LATERAL_FAN = 0.1;
const WAVE_DELAY_JITTER = 0.05;
/** Camera-distance band (from the parked viewpoint) across which
 *  the unfurl travels: first visible ground at the frame's bottom
 *  edge → the far haze. */
const WAVE_UNFURL_NEAR_DIST = 7;
const WAVE_UNFURL_FAR_DIST = 58;

/** Per-point ignition band width (in wave-time units). Widened
 *  0.075 → 0.13 in the ramp pass — each row eases up over a longer
 *  beat instead of popping. */
const WAVE_REVEAL_BAND = 0.13;
/** Flash half-width — the gold-lifted band riding the unfurl
 *  front. Widened with the reveal band so the highlight breathes. */
const WAVE_FLASH_WIDTH = 0.11;
/** Vertical swell at the unfurl front (world units). */
const WAVE_SWELL = 0.28;

/** Speed-ramp followers (v3.12c ramp pass).
 *  - FRONT: single-stage chase, snappier — the shock LEADS.
 *  - TERRAIN: cascaded two-stage chase (zero-velocity onset) +
 *    quintic remap — the unfurl follows with an editorial
 *    slow-in / slow-out. Settle ≈ 1s on a fast flick. */
const WAVE_FRONT_RESPONSE = 7.0;
const WAVE_TERRAIN_RESPONSE = 5.0;

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
  // point's delay is its normalized depth from the parked viewpoint
  // so the realm rolls open near → far.
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
  vColor = mix(aColor, GOLD, flash * 0.45);
  vAlpha = on * farFade * nearFade * (1.0 + 2.0 * flash);

  float sizeFactor = clamp(11.0 / max(0.5, dist), 0.42, 1.6);
  gl_PointSize = uPointSize * uPixelRatio * sizeFactor * aSize * (1.0 + 0.5 * flash);
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

// Dissipating particle wave — every particle's position is derived
// per frame from uFrontPhase alone (static attributes), so the
// whole front is one draw call with zero CPU vertex work.
const waveVertex = /* glsl */ `
uniform float uPixelRatio;
uniform float uFrontPhase;

attribute float aAngle;
attribute float aRadial;
attribute float aTrail;
attribute float aSize;
attribute vec3 aColor;
attribute float aShimmer;

varying vec3 vColor;
varying float vAlpha;

const float R_LAUNCH = ${WAVE_R_LAUNCH.toFixed(2)};
const float R_MAX = ${WAVE_R_MAX.toFixed(2)};
const float SPREAD_LAUNCH = ${WAVE_BAND_SPREAD_LAUNCH.toFixed(2)};
const float SPREAD_MAX = ${WAVE_BAND_SPREAD_MAX.toFixed(2)};
const float TRAIL_PULL = ${WAVE_TRAIL_PULL.toFixed(2)};
const vec3 DAWN_SOFT = vec3(0.839, 0.804, 0.710);

void main() {
  float phase = uFrontPhase;

  // Front radius travels at constant speed (a gravitational wave).
  // The scatter band stays TIGHT through the crossing and only
  // loosens late (pow 1.6) — coherent front mid-frame, dissolving
  // into dust as it exits the corners.
  float front = mix(R_LAUNCH, R_MAX, phase);
  float spread = mix(SPREAD_LAUNCH, SPREAD_MAX, pow(phase, 1.6));

  // Particle radius: a dense spine on the front (aRadial² pulls the
  // gaussian scatter toward the centre line), with trailing
  // particles stretched back toward the sphere — the wake.
  float scatter = aRadial * abs(aRadial);
  float r = front + scatter * spread - aTrail * (front - R_LAUNCH) * TRAIL_PULL;

  vec3 pos = vec3(cos(aAngle) * r, WAVE_CENTER_Y_GLSL + sin(aAngle) * r, 0.0);
  vec4 mv = modelViewMatrix * vec4(pos.x, pos.y, ${WAVE_PLANE_Z.toFixed(2)}, 1.0);
  gl_Position = projectionMatrix * mv;

  // Alpha: launch ramp → sustained crossing → dissipation to zero.
  // Per-particle terms: trailing wake dims, off-band scatter dims,
  // and a phase-keyed shimmer varies neighbours so the band reads
  // as living particles, not a stamped ring. (Shimmer is a function
  // of phase — scroll-driven, never idle.) A crest factor front-
  // loads the energy: the wave is BRIGHT leaving the sphere and
  // spends itself across the frame.
  float launch = smoothstep(0.0, 0.06, phase);
  float dissipate = pow(max(0.0, 1.0 - phase), 0.45);
  float crest = 1.0 + 0.5 * (1.0 - phase);
  float bandWeight = mix(1.0, 0.65, min(1.0, abs(aRadial)));
  float trailDamp = 1.0 - aTrail * 0.35;
  float shimmer = 0.85 + 0.15 * sin(aShimmer * 6.2832 + phase * 9.0);
  vAlpha = launch * dissipate * crest * bandWeight * trailDamp * shimmer;

  // Colour cools toward dawn-soft as the energy dissipates.
  vColor = mix(aColor, DAWN_SOFT, phase * 0.45);

  // Particles shrink slightly as the wave spends itself.
  gl_PointSize = aSize * uPixelRatio * mix(1.2, 0.7, phase);
}
`;

const waveFragment = /* glsl */ `
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

// ── Geometry ─────────────────────────────────────────────────────

/** Deterministic hash — the terrain must be identical every load
 *  (ADR-018 "same landmarks every visit"). */
function hash(n: number): number {
  const s = Math.sin(n) * 43758.5453;
  return s - Math.floor(s);
}

/** Layered-sine relief over the valley bowl. */
function terrainHeight(x: number, z: number, edgeT: number, rowT: number): number {
  const rolling =
    0.42 * Math.sin(x * 0.19 + z * 0.115 + 1.7) +
    0.27 * Math.sin(x * 0.45 - z * 0.085 + 4.2) +
    0.6 * Math.sin(x * 0.065 + z * 0.05 + 2.4);
  const amp = REALM_BASIN_AMP + REALM_EDGE_AMP * Math.pow(edgeT, REALM_EDGE_POWER);
  const bowl = REALM_BOWL_RISE * Math.pow(edgeT, REALM_BOWL_POWER);
  const base = REALM_BASE_Y + rowT * REALM_HORIZON_LIFT + bowl;
  return Math.min(REALM_Y_CEILING, base + rolling * amp);
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

      // Unfurl delay: DEPTH owns the cascade (near ground first,
      // horizon last); a small lateral fan ripples each row outward
      // from the optical axis; jitter keeps the front shimmering.
      const pdist = Math.max(1, PARK_CAM_Z - z);
      const depthNorm = Math.min(
        1,
        Math.max(
          0,
          (pdist - WAVE_UNFURL_NEAR_DIST) / (WAVE_UNFURL_FAR_DIST - WAVE_UNFURL_NEAR_DIST)
        )
      );
      const sxAbs = Math.min(1, Math.abs(x / (pdist * HFOV_TAN)));
      delays.push(depthNorm * WAVE_UNFURL_SPAN + sxAbs * WAVE_LATERAL_FAN + h2 * WAVE_DELAY_JITTER);
    }
  }

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    sizes: new Float32Array(sizes),
    delays: new Float32Array(delays),
  };
}

/** Build the dissipating wave-particle attributes. Positions are
 *  computed per frame in the vertex shader from `uFrontPhase`; the
 *  buffer only carries each particle's identity. */
function buildWaveParticles(): {
  positions: Float32Array;
  angles: Float32Array;
  radials: Float32Array;
  trails: Float32Array;
  sizes: Float32Array;
  colors: Float32Array;
  shimmers: Float32Array;
} {
  const n = WAVE_PARTICLE_COUNT;
  const positions = new Float32Array(n * 3); // dummy (shader-owned)
  const angles = new Float32Array(n);
  const radials = new Float32Array(n);
  const trails = new Float32Array(n);
  const sizes = new Float32Array(n);
  const colors = new Float32Array(n * 3);
  const shimmers = new Float32Array(n);

  const gold = new THREE.Color(GOLD_HEX);
  const dawn = new THREE.Color(DAWN_HEX);
  const dawnSoft = new THREE.Color(DAWN_SOFT_HEX);

  const GOLDEN_ANGLE = 2.39996;

  for (let i = 0; i < n; i++) {
    const h1 = hash(i * 12.9898 + 4.5453);
    const h2 = hash(i * 78.233 + 1.047);
    const h3 = hash(i * 39.425 + 2.665);
    const h4 = hash(i * 27.619 + 0.731);

    // Golden-angle base + jitter: even coverage, organic clusters.
    angles[i] = (i * GOLDEN_ANGLE + h1 * 0.9) % (Math.PI * 2);

    // Roughly gaussian radial scatter (sum of two uniforms − 1).
    radials[i] = h2 + h3 - 1;

    // Most particles ride the front; a tail fraction trails back
    // toward the sphere (pow biases toward 0 = front).
    trails[i] = Math.pow(h4, 1.7);

    // Size tiers — mostly fine grain, sparse bold pips (the
    // Colorpong "Cosmos" read). Sized in device pixels (no
    // distance attenuation — the wave plane sits at a near-
    // constant camera distance through its lifetime).
    let size: number;
    if (h3 > 0.94) size = 13.0 + h1 * 6.0;
    else if (h3 > 0.74) size = 7.5 + h1 * 3.0;
    else size = 4.0 + h1 * 2.6;
    sizes[i] = size;

    // Palette: gold carries the energy, dawn/dawn-soft the scatter.
    const c = h2 < 0.45 ? gold : h2 < 0.78 ? dawn : dawnSoft;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    shimmers[i] = h4;
  }

  return { positions, angles, radials, trails, sizes, colors, shimmers };
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
  /** Front chase (single-stage — the shock leads). */
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
        uPointSize: { value: 6.5 },
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
    const { positions, angles, radials, trails, sizes, colors, shimmers } = buildWaveParticles();
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
    geom.setAttribute("aRadial", new THREE.BufferAttribute(radials, 1));
    geom.setAttribute("aTrail", new THREE.BufferAttribute(trails, 1));
    geom.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geom.setAttribute("aShimmer", new THREE.BufferAttribute(shimmers, 1));
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

    // FRONT: single-stage chase — the shock leads. Snappy enough to
    // feel attached to the scroll, slow enough that a flick still
    // sweeps rather than pops.
    const kFront = 1 - Math.exp(-WAVE_FRONT_RESPONSE * dt);
    frontRef.current += (waveTarget - frontRef.current) * kFront;

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

    // Dissipating particle wave.
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
