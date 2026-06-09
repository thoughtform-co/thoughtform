"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getBuildApproachFade, getThoughtformBootEnvelope } from "./sceneGeom";

/**
 * LatentFieldTunnel — layered latent-space visualisation that frames
 * the corridor as flying through the substrate of intelligence rather
 * than through a starfield.
 *
 * Replaces the earlier `WormholeTunnel`. Three composited sub-meshes
 * share one camera-relative cone, one flow envelope, and one
 * centre-avoid radius so the brandmark stays the dominant centre:
 *
 *   1. Latent POINTS — a rank-tiered field of luminous dots. Most
 *      particles are faint "field" points; a small subset are
 *      brighter, larger "anchor" stars. Reads as a density gradient,
 *      not a uniform snow.
 *   2. Embedding VECTORS — sparse, faint line segments connecting
 *      a deterministic subset of nearby points. Reads as the
 *      neighbourhood structure of an embedding space — the brandmark
 *      sits inside a small web of relationships rather than a void.
 *   3. Token MOTES — tiny PT Mono glyph fragments (current set in
 *      `TOKEN_STRINGS`: `01`, `ctx`, `vec`, `tok`, `emb`, `kv`,
 *      `Δ`, `λ`) drawn from a single canvas atlas via point-sprite
 *      UV offsets. Used very sparsely so they read as peripheral
 *      data artifacts, not UI labels.
 *
 * Motion envelope (shared by all three):
 *   - PERFECTLY STILL at rest. No ambient drift. The corridor only
 *     moves when the visitor scrolls — anything else would make the
 *     scene feel like an autonomous loop rather than a vehicle they
 *     are piloting through the latent space.
 *   - Velocity-proportional Z flow that intensifies alpha with
 *     |velocity|. Tokens get extra damping at very high velocity
 *     because rapidly streaking text reads as smear.
 *   - Boot-envelope boost during the Thoughtform centring so the
 *     latent field is at its richest the moment the gateway powers
 *     on.
 *   - Peripheral screen-space alpha fade so the field reads as
 *     focused near the optical axis (where the brandmark sits) and
 *     dissolves toward the viewport edges — the "fly past a bit
 *     centred, blurry near the edges" feel.
 *
 * Pairs with:
 *   - `StaticStarfield`  : deep backdrop, paint-only.
 *   - `ScrollStreaks`    : narrow warm streaks, velocity-only flash.
 *   - `ThoughtformAtmosphere` : warm boot-glow disk + local stars +
 *     stargate shockwave at the Thoughtform gate.
 */

// ─── Density tiers (art-directable, per-viewport) ────────────────

// Density tiers bumped 2026-05-25 to intensify the wormhole tunnel
// feel without changing the motion contract (still scroll-velocity-
// only, still no idle drift). +29% desktop / +28% tablet / +27% mobile.
const POINT_COUNT_DESKTOP = 3600;
const POINT_COUNT_TABLET = 2300;
const POINT_COUNT_MOBILE = 1400;

/** Fraction of points marked as bright "anchor" stars (the rest are
 *  faint "field" points). Anchors are noticeably larger + brighter
 *  and pick up a touch of warm gold — they read as the prominent
 *  nodes in the latent space. Set high enough that there's always
 *  several anchors in frame to give the field structure. */
const ANCHOR_RATIO = 0.13;

// Vector pair counts +20% alongside the point bump so the embedding
// graph keeps its visible neighbourhood density at the new tier.
const VECTOR_PAIR_COUNT_DESKTOP = 385;
const VECTOR_PAIR_COUNT_TABLET = 240;
const VECTOR_PAIR_COUNT_MOBILE = 110;

const TOKEN_COUNT_DESKTOP = 72;
const TOKEN_COUNT_TABLET = 42;
const TOKEN_COUNT_MOBILE = 0;

// ─── Spatial constants ──────────────────────────────────────────

/** Cone half-angle scaling. Wider than the previous wormhole tunnel
 *  (X 1.10 vs 0.95) so the field reaches further into the periphery
 *  and the brandmark sits inside a genuine "shaft". */
const CONE_TAN_X = 1.1;
/** Y is slightly squashed to match the 16:9-leaning corridor frame. */
const CONE_TAN_Y = 0.7;

/** Z range — deeper than the wormhole tunnel (FAR -30 vs -28) so
 *  near/far parallax differential is stronger when flowing. */
const FAR_Z = -30;
const NEAR_Z = 10;

/** World distance ahead of camera at which a forward-moving particle
 *  respawns at the far end of the tunnel. */
const PASS_MARGIN = 1.5;

/** Centre-avoid radius (fraction of the cone radius at any depth)
 *  that keeps the camera-forward axis clear so the brandmark stays
 *  the dominant centre. Kept small so the latent field paints
 *  closer to the brandmark's neighbourhood — the embedding graph
 *  is meant to wrap the mark, not orbit it from a wide ring. */
const CENTRE_AVOID_RADIUS = 0.06;

/** Radial-density exponent. `sqrt(random)` gives uniform AREA
 *  density (every annulus carries the same point count). A larger
 *  exponent pulls density toward the centre — what we want here so
 *  the field paints THROUGH the brandmark's neighbourhood and
 *  thins toward the periphery, instead of spreading uniformly to
 *  the HUD rails. */
const CENTRE_BIAS_EXP = 1.6;

/** Peripheral screen-space fade window. Alpha is multiplied by
 *  `smoothstep(EDGE_FADE_END, EDGE_FADE_START, ndcRadius)` so points
 *  near the optical centre paint at full alpha and points beyond
 *  the EDGE_FADE_END NDC radius are clipped. Values are in NDC space
 *  ([0, sqrt(2)] from the centre to the screen corner). */
const EDGE_FADE_START = 0.55;
const EDGE_FADE_END = 1.15;

/** Visible band (world units from the camera). */
const VISIBLE_NEAR = 0.5;
const VISIBLE_FAR = 28;

/** Maximum world-space distance allowed between the two endpoints of
 *  an embedding vector. Pairs that stretch beyond this (e.g. when one
 *  endpoint has just respawned at the far end of the tunnel) are
 *  hidden until the next reseed by writing both endpoints to the
 *  same coordinate. */
const VECTOR_MAX_LENGTH = 2.2;

// ─── Motion constants ───────────────────────────────────────────

/** Multiplier from |scroll velocity| (progress-units / s) to
 *  world-units / s of particle flow. Bumped slightly to compensate
 *  for removing the ambient drift — when the user IS scrolling, the
 *  field should respond decisively. */
const SCROLL_GAIN = 28;

/** Ambient forward drift while idle.
 *
 *  HARD ZERO by design. The corridor is meant to read as "I am
 *  traveling through the latent space whenever I scroll, and the
 *  space holds perfectly still whenever I stop." Any non-zero drift
 *  breaks that contract — it makes the scene feel like an
 *  autonomous loop rather than a vehicle the visitor is piloting.
 *  Star Atlas treats its corridor the same way. Do not raise. */
const AMBIENT_DRIFT = 0;

/** How quickly each sub-mesh's smoothed alpha tracks its target. */
const ALPHA_RESPONSE = 5;

// ─── Per-sub-mesh alpha envelopes ───────────────────────────────

/** Points: visible at rest, stronger at scroll. The parked
 *  Thoughtform read should feel like a deep field, not a flat wall
 *  of already-legible data. */
const POINT_AMBIENT = 0.52;
const POINT_PEAK = 1.0;
const POINT_BOOT_LIFT = 0.2;

/** Vectors: almost hidden at rest; they become readable when the
 *  visitor scrolls and the field actually flies past. */
const VECTOR_AMBIENT = 0.08;
const VECTOR_PEAK = 0.95;
const VECTOR_BOOT_LIFT = 0.14;

/** Tokens: near-silent while parked. Legible notation is reserved
 *  for travel, where it can pass the camera instead of sitting as
 *  foreground UI behind the Thoughtform gate. */
const TOKEN_AMBIENT = 0.025;
const TOKEN_PEAK = 1.0;
const TOKEN_BOOT_LIFT = 0.05;
const TOKEN_VELOCITY_DAMP = 0.55;

/** Parked Thoughtform gate window. The latent field is GATED OFF
 *  across the parked Thoughtform beat (progress < 0.12) and ramps
 *  in across the early pass-01a flythrough so the opening view of
 *  the corridor is just the brandmark + compass + warm atmosphere —
 *  no dense camera-axis particle cloud floating over the off-axis
 *  brandmark (the W4 floating-particle bug, plan 03adb0dd). The
 *  field reaches full ambient strength by progress 0.20, well
 *  before the visitor reaches the Navigate gate.
 *
 *  Multiplied into the alpha targets for ALL THREE sub-meshes
 *  (points, vectors, tokens) so the gating is uniform — gating the
 *  point opacity alone would still leave faint embedding lines
 *  visible at rest. */
const THOUGHTFORM_GATE_END = 0.12;
const LATENT_REVEAL_END = 0.2;
function latentParkedReveal(paintProgress: number): number {
  if (paintProgress <= THOUGHTFORM_GATE_END) return 0;
  if (paintProgress >= LATENT_REVEAL_END) return 1;
  const t = (paintProgress - THOUGHTFORM_GATE_END) / (LATENT_REVEAL_END - THOUGHTFORM_GATE_END);
  return t * t * (3 - 2 * t);
}

// ─── Token atlas ────────────────────────────────────────────────

/** Token strings. Mix of latent-ish notation: dimensions, ops,
 *  short hex-like fragments. Intentionally short (≤ 3 chars) so
 *  they remain legible when rendered as small point sprites — and
 *  intentionally non-marketing so they read as ambient data, not
 *  copy. Avoids special punctuation that would render as garbage
 *  on font fallbacks. */
const TOKEN_STRINGS = ["01", "ctx", "vec", "tok", "emb", "kv", "Δ", "λ"];
const TOKEN_ATLAS_COLS = 4;
const TOKEN_ATLAS_ROWS = 2;
/** Square tiles so each glyph maps cleanly into a square point
 *  sprite without aspect-ratio stretching. */
const TOKEN_TILE_W = 128;
const TOKEN_TILE_H = 128;

// ─── Helpers ────────────────────────────────────────────────────

function pickCount(desktop: number, tablet: number, mobile: number): number {
  if (typeof window === "undefined") return desktop;
  const w = window.innerWidth;
  if (w < 760) return mobile;
  if (w < 1280) return tablet;
  return desktop;
}

/** Sample an XY position inside the wide cone at the given camera
 *  distance, biased toward the centre so the field reads as focused
 *  around the optical axis rather than uniformly spread to the
 *  edges. `CENTRE_BIAS_EXP` controls the bias — higher values pull
 *  density further inward. */
function spawnXY(camDist: number, out: [number, number]): void {
  const radialBand = 1 - CENTRE_AVOID_RADIUS;
  // `random ^ (1/exp)` for exp > 1 pulls samples toward 0 (centre).
  // Compare to the previous `sqrt(random)` (= `random^0.5`) which
  // gave uniform area density.
  const radialT = Math.pow(Math.random(), 1 / CENTRE_BIAS_EXP);
  const r = (CENTRE_AVOID_RADIUS + radialT * radialBand) * camDist;
  const theta = Math.random() * Math.PI * 2;
  out[0] = Math.cos(theta) * r * CONE_TAN_X;
  out[1] = Math.sin(theta) * r * CONE_TAN_Y;
}

/** Token-specific spawn band. Tokens sit in the MIDDLE band of the
 *  cone — not at the centre (where they'd compete with the
 *  brandmark) and not at the periphery (where they'd collide with
 *  the HUD rails, rail numbers, copy block, and CTA button). The
 *  band [0.32, 0.62] of the cone radius gives a clean midfield
 *  around the compass without encroaching on any of those zones. */
const TOKEN_INNER_RADIUS = 0.32;
const TOKEN_OUTER_RADIUS = 0.62;
function spawnTokenXY(camDist: number, out: [number, number]): void {
  const band = TOKEN_OUTER_RADIUS - TOKEN_INNER_RADIUS;
  const r = (TOKEN_INNER_RADIUS + Math.random() * band) * camDist;
  const theta = Math.random() * Math.PI * 2;
  out[0] = Math.cos(theta) * r * CONE_TAN_X;
  out[1] = Math.sin(theta) * r * CONE_TAN_Y;
}

/** Build the token atlas as a single CanvasTexture. Each tile holds
 *  one glyph string, white on transparent (tinted by the shader's
 *  `uColor` so the palette stays consistent with the design system). */
function buildTokenAtlas(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TOKEN_ATLAS_COLS * TOKEN_TILE_W;
  canvas.height = TOKEN_ATLAS_ROWS * TOKEN_TILE_H;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Large font relative to the 128 px tile so the glyph fills
    // most of the sprite even when the point is rendered small.
    ctx.font = 'bold 52px "PT Mono", ui-monospace, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < TOKEN_STRINGS.length; i++) {
      const col = i % TOKEN_ATLAS_COLS;
      const row = Math.floor(i / TOKEN_ATLAS_COLS);
      const cx = col * TOKEN_TILE_W + TOKEN_TILE_W / 2;
      const cy = row * TOKEN_TILE_H + TOKEN_TILE_H / 2;
      ctx.fillText(TOKEN_STRINGS[i], cx, cy);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

/** Pair points into embedding vectors. For each requested pair, pick a
 *  source index, scan a small random pool of candidates, and keep the
 *  closest under VECTOR_MAX_LENGTH. Returns a flat Uint16Array of
 *  pair indices [iA0, iB0, iA1, iB1, ...]. Deterministic per init. */
function buildVectorPairs(
  positions: Float32Array,
  pointCount: number,
  pairCount: number
): Uint16Array {
  const pairs = new Uint16Array(pairCount * 2);
  const CANDIDATE_POOL = 32;
  let written = 0;
  let attempts = 0;
  const maxAttempts = pairCount * 6;
  while (written < pairCount && attempts < maxAttempts) {
    attempts++;
    const iA = Math.floor(Math.random() * pointCount);
    const ax = positions[iA * 3];
    const ay = positions[iA * 3 + 1];
    const az = positions[iA * 3 + 2];
    let bestIB = -1;
    let bestDist = Infinity;
    for (let k = 0; k < CANDIDATE_POOL; k++) {
      const iC = Math.floor(Math.random() * pointCount);
      if (iC === iA) continue;
      const dx = positions[iC * 3] - ax;
      const dy = positions[iC * 3 + 1] - ay;
      const dz = positions[iC * 3 + 2] - az;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < bestDist) {
        bestDist = d2;
        bestIB = iC;
      }
    }
    if (bestIB >= 0 && bestDist < VECTOR_MAX_LENGTH * VECTOR_MAX_LENGTH) {
      pairs[written * 2] = iA;
      pairs[written * 2 + 1] = bestIB;
      written++;
    }
  }
  // If we couldn't fill, the unused slots stay at index 0 (renders
  // as a zero-length segment that the shader discards). Acceptable.
  return pairs;
}

// ─── Shaders: latent points ─────────────────────────────────────

const pointsVertex = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
uniform vec3 uCameraPos;
uniform float uVisibleNear;
uniform float uVisibleFar;
uniform float uEdgeFadeStart;
uniform float uEdgeFadeEnd;

attribute float aSeed;
attribute float aRank;

varying float vAlpha;
varying float vSeed;
varying float vRank;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = distance(position, uCameraPos);

  float farFade = smoothstep(uVisibleFar, uVisibleFar - 5.0, dist);
  float nearFade = smoothstep(uVisibleNear, uVisibleNear + 1.2, dist);

  gl_Position = projectionMatrix * mv;
  // Screen-space edge fade — points near the optical axis paint at
  // full alpha; points beyond the uEdgeFadeEnd NDC radius vanish.
  // Anchor stars resist the fade slightly (they are meant to be the
  // bright nodes that survive in the periphery).
  vec2 ndc = gl_Position.xy / max(gl_Position.w, 0.0001);
  float ndcRadius = length(ndc);
  float edgeFade = smoothstep(uEdgeFadeEnd, uEdgeFadeStart, ndcRadius);
  edgeFade = mix(edgeFade, max(edgeFade, 0.35), aRank);

  vAlpha = farFade * nearFade * edgeFade;
  vSeed = aSeed;
  vRank = aRank;

  // Rank-based size: even the lowest-rank field star gets enough
  // pixels to read as a point (rankSize floor 1.0), while anchor
  // stars are noticeably larger and create the density gradient
  // that prevents the field from reading as uniform snow.
  float rankSize = mix(1.0, 2.6, aRank);
  // Generous distance floor so far stars don't shrink to sub-pixel
  // dots that vanish against the void.
  float sizeFactor = clamp(6.5 / max(0.5, dist), 0.55, 3.2);
  gl_PointSize = uPointSize * uPixelRatio * sizeFactor * rankSize;
}
`;

const pointsFragment = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uAnchorColor;
uniform float uOpacity;

varying float vAlpha;
varying float vSeed;
varying float vRank;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  // Anchor stars get tighter, brighter cores; field stars stay soft.
  float coreRadius = mix(0.06, 0.14, vRank);
  float core = smoothstep(coreRadius, 0.0, d);
  float halo = smoothstep(0.5, 0.12, d);
  float soft = max(core, halo * 0.5);
  float jitter = 0.65 + fract(vSeed * 41.0) * 0.35;
  // Anchor stars pick up a touch of warm gold; field stays cool dawn.
  vec3 col = mix(uColor, uAnchorColor, vRank * 0.55);
  float alpha = soft * vAlpha * uOpacity * jitter;
  if (alpha < 0.008) discard;
  gl_FragColor = vec4(col, alpha);
}
`;

// ─── Shaders: embedding vectors ─────────────────────────────────

const vectorsVertex = /* glsl */ `
uniform vec3 uCameraPos;
uniform float uVisibleNear;
uniform float uVisibleFar;
uniform float uEdgeFadeStart;
uniform float uEdgeFadeEnd;

attribute float aSeed;

varying float vAlpha;
varying float vSeed;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = distance(position, uCameraPos);
  float farFade = smoothstep(uVisibleFar, uVisibleFar - 6.0, dist);
  float nearFade = smoothstep(uVisibleNear, uVisibleNear + 1.5, dist);

  gl_Position = projectionMatrix * mv;
  vec2 ndc = gl_Position.xy / max(gl_Position.w, 0.0001);
  float edgeFade = smoothstep(uEdgeFadeEnd, uEdgeFadeStart, length(ndc));

  vAlpha = farFade * nearFade * edgeFade;
  vSeed = aSeed;
}
`;

const vectorsFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;

varying float vAlpha;
varying float vSeed;

void main() {
  // Slow per-vector twinkle so the embedding graph reads as alive
  // (faintly firing connections) rather than static linework.
  float twinkle = 0.72 + 0.28 * sin(uTime * 0.6 + vSeed * 17.0);
  float jitter = 0.6 + fract(vSeed * 31.0) * 0.4;
  float alpha = vAlpha * uOpacity * jitter * twinkle;
  if (alpha < 0.005) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

// ─── Shaders: token motes ───────────────────────────────────────

const tokensVertex = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
uniform vec3 uCameraPos;
uniform float uVisibleNear;
uniform float uVisibleFar;
uniform float uEdgeFadeStart;
uniform float uEdgeFadeEnd;

attribute float aSeed;
attribute float aTokenIdx;

varying float vAlpha;
varying float vSeed;
varying float vTokenIdx;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = distance(position, uCameraPos);
  float farFade = smoothstep(uVisibleFar, uVisibleFar - 6.0, dist);
  float nearFade = smoothstep(uVisibleNear, uVisibleNear + 2.0, dist);

  gl_Position = projectionMatrix * mv;
  // Same screen-space edge fade as points + vectors so the three
  // layers all dissolve together toward the periphery.
  vec2 ndc = gl_Position.xy / max(gl_Position.w, 0.0001);
  float edgeFade = smoothstep(uEdgeFadeEnd, uEdgeFadeStart, length(ndc));

  vAlpha = farFade * nearFade * edgeFade;
  vSeed = aSeed;
  vTokenIdx = aTokenIdx;

  // Tokens use a larger base point so the glyph atlas tile is
  // legible at typical viewing distance. Distance falloff is gentle
  // because tokens are already sparse; we want each one to read.
  float sizeFactor = clamp(13.0 / max(0.5, dist), 0.75, 3.4);
  gl_PointSize = uPointSize * uPixelRatio * sizeFactor;
}
`;

const tokensFragment = /* glsl */ `
uniform sampler2D uAtlas;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uCols;
uniform float uRows;

varying float vAlpha;
varying float vSeed;
varying float vTokenIdx;

void main() {
  float col = mod(vTokenIdx, uCols);
  float row = floor(vTokenIdx / uCols);
  // gl_PointCoord origin is top-left; flip Y so the atlas reads
  // correctly without having to vertically flip the canvas.
  vec2 tileUv = vec2(
    (col + gl_PointCoord.x) / uCols,
    (row + (1.0 - gl_PointCoord.y)) / uRows
  );
  vec4 sampleColor = texture2D(uAtlas, tileUv);
  float jitter = 0.7 + fract(vSeed * 23.0) * 0.3;
  float alpha = sampleColor.a * vAlpha * uOpacity * jitter;
  if (alpha < 0.012) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

// ─── Component ──────────────────────────────────────────────────

export function LatentFieldTunnel() {
  const { camera } = useThree();

  const pointsRef = useRef<THREE.Points>(null);
  const vectorsRef = useRef<THREE.LineSegments>(null);
  const tokensRef = useRef<THREE.Points>(null);

  const lastTime = useRef<number>(-1);
  const pointsAlpha = useRef<number>(0);
  const vectorsAlpha = useRef<number>(0);
  const tokensAlpha = useRef<number>(0);

  const pointCount = useMemo(
    () => pickCount(POINT_COUNT_DESKTOP, POINT_COUNT_TABLET, POINT_COUNT_MOBILE),
    []
  );
  const vectorPairCount = useMemo(
    () => pickCount(VECTOR_PAIR_COUNT_DESKTOP, VECTOR_PAIR_COUNT_TABLET, VECTOR_PAIR_COUNT_MOBILE),
    []
  );
  const tokenCount = useMemo(
    () => pickCount(TOKEN_COUNT_DESKTOP, TOKEN_COUNT_TABLET, TOKEN_COUNT_MOBILE),
    []
  );

  // ── Geometries ────────────────────────────────────────────────

  const { pointsGeometry, vectorsGeometry, vectorPairs } = useMemo(() => {
    const positions = new Float32Array(pointCount * 3);
    const seeds = new Float32Array(pointCount);
    const ranks = new Float32Array(pointCount);
    const tmp: [number, number] = [0, 0];
    for (let i = 0; i < pointCount; i++) {
      const z = NEAR_Z - Math.random() * (NEAR_Z - FAR_Z);
      const camDist = Math.max(0.5, NEAR_Z - z);
      spawnXY(camDist, tmp);
      positions[i * 3] = tmp[0];
      positions[i * 3 + 1] = tmp[1];
      positions[i * 3 + 2] = z;
      seeds[i] = Math.random();
      // A small subset are bright "anchor" stars. The rest get a
      // shallow rank in [0, ~0.4] so even field stars have some
      // size variance (no two stars are identical).
      ranks[i] = Math.random() < ANCHOR_RATIO ? 0.7 + Math.random() * 0.3 : Math.random() * 0.38;
    }
    const pGeom = new THREE.BufferGeometry();
    pGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pGeom.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    pGeom.setAttribute("aRank", new THREE.BufferAttribute(ranks, 1));

    // Build vector pairs from the same positions so the edges
    // visualise real neighbourhood structure (not random spaghetti).
    const pairs = buildVectorPairs(positions, pointCount, vectorPairCount);
    const vPositions = new Float32Array(vectorPairCount * 2 * 3);
    const vSeeds = new Float32Array(vectorPairCount * 2);
    for (let i = 0; i < vectorPairCount; i++) {
      const iA = pairs[i * 2];
      const iB = pairs[i * 2 + 1];
      vPositions[i * 6] = positions[iA * 3];
      vPositions[i * 6 + 1] = positions[iA * 3 + 1];
      vPositions[i * 6 + 2] = positions[iA * 3 + 2];
      vPositions[i * 6 + 3] = positions[iB * 3];
      vPositions[i * 6 + 4] = positions[iB * 3 + 1];
      vPositions[i * 6 + 5] = positions[iB * 3 + 2];
      // Both endpoints share the same seed so each segment twinkles
      // as a unit, not as two independently fluttering ends.
      const s = Math.random();
      vSeeds[i * 2] = s;
      vSeeds[i * 2 + 1] = s;
    }
    const vGeom = new THREE.BufferGeometry();
    vGeom.setAttribute("position", new THREE.BufferAttribute(vPositions, 3));
    vGeom.setAttribute("aSeed", new THREE.BufferAttribute(vSeeds, 1));

    return { pointsGeometry: pGeom, vectorsGeometry: vGeom, vectorPairs: pairs };
  }, [pointCount, vectorPairCount]);

  const tokensGeometry = useMemo(() => {
    if (tokenCount === 0) return null;
    const positions = new Float32Array(tokenCount * 3);
    const seeds = new Float32Array(tokenCount);
    const tokenIdxs = new Float32Array(tokenCount);
    const tmp: [number, number] = [0, 0];
    for (let i = 0; i < tokenCount; i++) {
      // Tokens spawn further from camera on average so they read as
      // distant data artifacts drifting forward, not in-your-face UI.
      const z = NEAR_Z - 2.5 - Math.random() * (NEAR_Z - FAR_Z - 2.5);
      const camDist = Math.max(1.2, NEAR_Z - z);
      spawnTokenXY(camDist, tmp);
      positions[i * 3] = tmp[0];
      positions[i * 3 + 1] = tmp[1];
      positions[i * 3 + 2] = z;
      seeds[i] = Math.random();
      tokenIdxs[i] = Math.floor(Math.random() * TOKEN_STRINGS.length);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    g.setAttribute("aTokenIdx", new THREE.BufferAttribute(tokenIdxs, 1));
    return g;
  }, [tokenCount]);

  // ── Materials ─────────────────────────────────────────────────

  const tokenAtlas = useMemo(() => {
    if (typeof window === "undefined" || tokenCount === 0) return null;
    return buildTokenAtlas();
  }, [tokenCount]);

  const pointsMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: pointsVertex,
      fragmentShader: pointsFragment,
      uniforms: {
        // Bumped from 3.4 to 4.8 so field stars read as deliberate
        // points and anchor stars as substantial nodes — not a
        // pixel-dust smear that disappears against the void.
        uPointSize: { value: 4.8 },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uCameraPos: { value: new THREE.Vector3() },
        uVisibleNear: { value: VISIBLE_NEAR },
        uVisibleFar: { value: VISIBLE_FAR },
        uEdgeFadeStart: { value: EDGE_FADE_START },
        uEdgeFadeEnd: { value: EDGE_FADE_END },
        uColor: { value: new THREE.Color("#e3ddd1") },
        uAnchorColor: { value: new THREE.Color("#caa554") },
        uOpacity: { value: POINT_AMBIENT },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  const vectorsMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: vectorsVertex,
      fragmentShader: vectorsFragment,
      uniforms: {
        uCameraPos: { value: new THREE.Vector3() },
        uVisibleNear: { value: VISIBLE_NEAR },
        uVisibleFar: { value: VISIBLE_FAR },
        uEdgeFadeStart: { value: EDGE_FADE_START },
        uEdgeFadeEnd: { value: EDGE_FADE_END },
        // Slightly warmer + brighter than the cool point body so the
        // embedding edges read as live signal rather than dim dust.
        uColor: { value: new THREE.Color("#d6cdb5") },
        uOpacity: { value: VECTOR_AMBIENT },
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  const tokensMaterial = useMemo(() => {
    if (!tokenAtlas) return null;
    return new THREE.ShaderMaterial({
      vertexShader: tokensVertex,
      fragmentShader: tokensFragment,
      uniforms: {
        // Large base point so the atlas tile renders with the glyph
        // legible at typical viewing distance; depth + jitter keep
        // it from becoming a foreground UI element.
        uPointSize: { value: 22.0 },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uCameraPos: { value: new THREE.Vector3() },
        uVisibleNear: { value: VISIBLE_NEAR },
        uVisibleFar: { value: VISIBLE_FAR },
        uEdgeFadeStart: { value: EDGE_FADE_START },
        uEdgeFadeEnd: { value: EDGE_FADE_END },
        uAtlas: { value: tokenAtlas },
        uColor: { value: new THREE.Color("#d8d0bc") },
        uOpacity: { value: TOKEN_AMBIENT },
        uCols: { value: TOKEN_ATLAS_COLS },
        uRows: { value: TOKEN_ATLAS_ROWS },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [tokenAtlas]);

  // ── Disposal ──────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      pointsMaterial.dispose();
      vectorsMaterial.dispose();
      tokensMaterial?.dispose();
      pointsGeometry.dispose();
      vectorsGeometry.dispose();
      tokensGeometry?.dispose();
      tokenAtlas?.dispose();
    };
  }, [
    pointsMaterial,
    vectorsMaterial,
    tokensMaterial,
    pointsGeometry,
    vectorsGeometry,
    tokensGeometry,
    tokenAtlas,
  ]);

  // ── Per-frame flow + alpha envelopes ──────────────────────────

  useFrame((state) => {
    const points = pointsRef.current;
    const vectors = vectorsRef.current;
    if (!points || !vectors) return;

    const now = state.clock.elapsedTime;
    const lastT = lastTime.current;
    lastTime.current = now;
    if (lastT < 0) return;
    const dt = Math.min(0.1, now - lastT);

    const transform = useDepthGatewayStore.getState().transform;
    const { velocity, active, armed, paintProgress } = transform;
    const painting = active || armed;

    pointsMaterial.uniforms.uPixelRatio.value = state.viewport.dpr;
    const pCamPos = pointsMaterial.uniforms.uCameraPos.value as THREE.Vector3;
    pCamPos.copy(camera.position);
    const vCamPos = vectorsMaterial.uniforms.uCameraPos.value as THREE.Vector3;
    vCamPos.copy(camera.position);
    vectorsMaterial.uniforms.uTime.value = now;
    if (tokensMaterial) {
      tokensMaterial.uniforms.uPixelRatio.value = state.viewport.dpr;
      const tCamPos = tokensMaterial.uniforms.uCameraPos.value as THREE.Vector3;
      tCamPos.copy(camera.position);
    }

    if (!painting) {
      pointsAlpha.current = 0;
      vectorsAlpha.current = 0;
      tokensAlpha.current = 0;
      pointsMaterial.uniforms.uOpacity.value = 0;
      vectorsMaterial.uniforms.uOpacity.value = 0;
      if (tokensMaterial) tokensMaterial.uniforms.uOpacity.value = 0;
      return;
    }

    // Per-sub-mesh alpha targets share the same envelope structure
    // (ambient floor + velocity lift + boot lift) so the three
    // layers always agree on intensity. The parked-Thoughtform gate
    // multiplies the WHOLE envelope so the opening beat reads clean
    // (W4, plan 03adb0dd).
    const boot = getThoughtformBootEnvelope(paintProgress);
    const absV = Math.abs(velocity);
    const velocityT = Math.min(1, absV * 2.0);
    const parkedReveal = latentParkedReveal(paintProgress);

    // Build-approach declutter (v3.1) — the camera-relative latent
    // field is ambient atmosphere; fade it out across the approach
    // to the Build park so the gimbal + stack carry the read. Stays
    // at 0 through the epilogue since paintProgress is pinned at 1.
    const buildFade = getBuildApproachFade(paintProgress);

    const pointsTarget =
      (POINT_AMBIENT + velocityT * (POINT_PEAK - POINT_AMBIENT) + boot * POINT_BOOT_LIFT) *
      parkedReveal *
      buildFade;
    const vectorsTarget =
      (VECTOR_AMBIENT + velocityT * (VECTOR_PEAK - VECTOR_AMBIENT) + boot * VECTOR_BOOT_LIFT) *
      parkedReveal *
      buildFade;
    // Tokens damp at high velocity so they don't smear into illegible
    // streaks during a fast scroll. The damping multiplier scales
    // down the velocity lift but leaves ambient + boot intact.
    const tokensVelocityLift =
      velocityT * (TOKEN_PEAK - TOKEN_AMBIENT) * (1 - velocityT * TOKEN_VELOCITY_DAMP);
    const tokensTarget =
      (TOKEN_AMBIENT + tokensVelocityLift + boot * TOKEN_BOOT_LIFT) * parkedReveal * buildFade;

    const k = 1 - Math.exp(-ALPHA_RESPONSE * dt);
    pointsAlpha.current += (pointsTarget - pointsAlpha.current) * k;
    vectorsAlpha.current += (vectorsTarget - vectorsAlpha.current) * k;
    tokensAlpha.current += (tokensTarget - tokensAlpha.current) * k;

    pointsMaterial.uniforms.uOpacity.value = Math.min(1, pointsAlpha.current);
    vectorsMaterial.uniforms.uOpacity.value = Math.min(1, vectorsAlpha.current);
    if (tokensMaterial) {
      tokensMaterial.uniforms.uOpacity.value = Math.min(1, tokensAlpha.current);
    }

    // ── Flow: advance points + tokens, sync vector endpoints ────
    const flowSpeed = velocity * SCROLL_GAIN + AMBIENT_DRIFT;
    const advance = flowSpeed * dt;
    if (Math.abs(advance) < 1e-4) return;

    const camZ = camera.position.z;
    const passLine = camZ + PASS_MARGIN;
    const backLine = camZ - 14;

    const pPos = pointsGeometry.getAttribute("position") as THREE.BufferAttribute;
    const pArr = pPos.array as Float32Array;
    const tmp: [number, number] = [0, 0];

    for (let i = 0; i < pointCount; i++) {
      const idx = i * 3 + 2;
      let z = pArr[idx] + advance;
      if (advance > 0 && z > passLine) {
        z = camZ + FAR_Z;
        const camDist = Math.max(0.5, camZ - z);
        spawnXY(camDist, tmp);
        pArr[i * 3] = tmp[0];
        pArr[i * 3 + 1] = tmp[1];
      } else if (advance < 0 && z < backLine) {
        z = camZ + NEAR_Z * 0.5;
        const camDist = Math.max(0.5, z - camZ);
        spawnXY(camDist, tmp);
        pArr[i * 3] = tmp[0];
        pArr[i * 3 + 1] = tmp[1];
      }
      pArr[idx] = z;
    }
    pPos.needsUpdate = true;

    // Sync vector endpoints from the updated point positions. Pairs
    // whose endpoints have stretched too far (because one endpoint
    // wrapped) get collapsed to a zero-length segment so the shader
    // discards them until they organically pair up again or get
    // reseeded on the next page load.
    const vPos = vectorsGeometry.getAttribute("position") as THREE.BufferAttribute;
    const vArr = vPos.array as Float32Array;
    const maxLenSq = VECTOR_MAX_LENGTH * VECTOR_MAX_LENGTH;
    for (let i = 0; i < vectorPairCount; i++) {
      const iA = vectorPairs[i * 2];
      const iB = vectorPairs[i * 2 + 1];
      const ax = pArr[iA * 3];
      const ay = pArr[iA * 3 + 1];
      const az = pArr[iA * 3 + 2];
      const bx = pArr[iB * 3];
      const by = pArr[iB * 3 + 1];
      const bz = pArr[iB * 3 + 2];
      const dx = bx - ax;
      const dy = by - ay;
      const dz = bz - az;
      if (dx * dx + dy * dy + dz * dz > maxLenSq) {
        // Collapse to a single point so the segment self-discards.
        vArr[i * 6] = ax;
        vArr[i * 6 + 1] = ay;
        vArr[i * 6 + 2] = az;
        vArr[i * 6 + 3] = ax;
        vArr[i * 6 + 4] = ay;
        vArr[i * 6 + 5] = az;
      } else {
        vArr[i * 6] = ax;
        vArr[i * 6 + 1] = ay;
        vArr[i * 6 + 2] = az;
        vArr[i * 6 + 3] = bx;
        vArr[i * 6 + 4] = by;
        vArr[i * 6 + 5] = bz;
      }
    }
    vPos.needsUpdate = true;

    // Tokens advance with the same flow but they're a separate buffer
    // so each can wrap independently.
    if (tokensGeometry && tokensRef.current) {
      const tPos = tokensGeometry.getAttribute("position") as THREE.BufferAttribute;
      const tIdx = tokensGeometry.getAttribute("aTokenIdx") as THREE.BufferAttribute;
      const tArr = tPos.array as Float32Array;
      const tIdxArr = tIdx.array as Float32Array;
      for (let i = 0; i < tokenCount; i++) {
        const idx = i * 3 + 2;
        let z = tArr[idx] + advance;
        if (advance > 0 && z > passLine) {
          z = camZ + FAR_Z;
          const camDist = Math.max(1.2, camZ - z);
          spawnTokenXY(camDist, tmp);
          tArr[i * 3] = tmp[0];
          tArr[i * 3 + 1] = tmp[1];
          // Reseed the glyph on respawn so the visible tokens
          // rotate over time and don't feel like a fixed sentence.
          tIdxArr[i] = Math.floor(Math.random() * TOKEN_STRINGS.length);
        } else if (advance < 0 && z < backLine) {
          z = camZ + NEAR_Z * 0.5;
          const camDist = Math.max(1.2, z - camZ);
          spawnTokenXY(camDist, tmp);
          tArr[i * 3] = tmp[0];
          tArr[i * 3 + 1] = tmp[1];
          tIdxArr[i] = Math.floor(Math.random() * TOKEN_STRINGS.length);
        }
        tArr[idx] = z;
      }
      tPos.needsUpdate = true;
      tIdx.needsUpdate = true;
    }
  });

  return (
    <>
      <points
        ref={pointsRef}
        geometry={pointsGeometry}
        material={pointsMaterial}
        frustumCulled={false}
      />
      <lineSegments
        ref={vectorsRef}
        geometry={vectorsGeometry}
        material={vectorsMaterial}
        frustumCulled={false}
      />
      {tokensGeometry && tokensMaterial && (
        <points
          ref={tokensRef}
          geometry={tokensGeometry}
          material={tokensMaterial}
          frustumCulled={false}
        />
      )}
    </>
  );
}
