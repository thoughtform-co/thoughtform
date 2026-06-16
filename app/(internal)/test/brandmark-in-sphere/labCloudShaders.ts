/**
 * Shaders for the lab brandmark cloud (`/test/brandmark-in-sphere`).
 *
 * Lab-only: lets a designer compare different particle "looks" of
 * the brandmark — sprite shape (soft dot / hard square / hollow ring
 * / 4-point star / plus-cross / filled disc), motion (twinkle /
 * wander), and topology morph (full mark <-> Fibonacci sphere) — all
 * shown inside the real Navigate `ShellSubstrateGyro` sphere.
 *
 * Production painters live elsewhere and are intentionally NOT
 * touched: the soft-dot sprite hardcoded in
 * `components/brand/BrandmarkParticleField/shaders.ts` and
 * `components/brand/BrandmarkPhysicsCore/shaders.ts` is the canonical
 * production look. This shader's `uStyle` switch exists so the
 * designer can quickly compare alternatives in context.
 */

export const labCloudVertexShader = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
uniform float uTime;
uniform float uWander;
uniform float uSphereMorph;
uniform float uVisibleCount;
uniform float uOpacity;
uniform float uTwinkle;

attribute vec3 aHome;        // brandmark home (XY in [-0.5, 0.5], Z = optional dome+jitter)
attribute vec3 aSphereHome;  // paired Fibonacci sphere home (radius ~0.5)
attribute vec2 aSeed;        // stable per-particle seed
attribute float aRank;       // [0, count) — used for rank clip + per-particle tint

varying float vAlpha;
varying float vRank;
varying float vSeed;

void main() {
  // Rank clip — same density-dial pattern as the production
  // atmosphere station: hide particles whose rank exceeds the
  // visible-count threshold without rebuilding the buffer.
  if (aRank > uVisibleCount) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    gl_PointSize = 0.0;
    vAlpha = 0.0;
    return;
  }

  // === Wander ===
  // Two-frequency sinusoidal drift seeded per-particle. Identical
  // pattern to the production atmosphere — kept as a comparable
  // baseline for the designer.
  vec3 wander = vec3(
    sin(aSeed.x * 1.7 + uTime * 0.55) * 0.55 +
      sin(aSeed.x * 0.41 + uTime * 1.13) * 0.22,
    cos(aSeed.y * 1.9 + uTime * 0.47) * 0.55 +
      cos(aSeed.y * 0.37 + uTime * 0.91) * 0.22,
    sin((aSeed.x + aSeed.y) * 0.83 + uTime * 0.61) * 0.40
  );

  // Brandmark <-> Fibonacci sphere lerp. uSphereMorph = 0 -> pure
  // brandmark; 1 -> sphere. Particle pairing is index-by-index so
  // the morph is a continuous flow rather than a pop.
  vec3 home = mix(aHome, aSphereHome, uSphereMorph);

  // Wander amplitude is tied to the cloud's natural extent (~0.5)
  // so it scales sensibly when the wrapping group is scaled.
  vec3 pos = home + wander * uWander * 0.18;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  // Distance falloff so points near the camera don't grow too big
  // and far points don't disappear. Same envelope shape as the
  // gyro surface shader (capped at 2x).
  float dist = max(0.4, -mv.z);
  float sizeFactor = clamp(2.5 / dist, 0.5, 2.0);

  // Per-particle size variation — accent particles (rank > 0.85)
  // get a small bump so the cloud reads with internal contrast.
  float rankBump = mix(0.85, 1.25, smoothstep(0.5, 1.0, aRank / max(1.0, uVisibleCount)));

  gl_PointSize = uPointSize * uPixelRatio * sizeFactor * rankBump;

  // Per-particle twinkle — modulates alpha, not size, so the
  // silhouette stays solid while individual specks breathe.
  float twinklePhase = aSeed.x * 3.1 + uTime * 1.7;
  float twinkle = mix(1.0, 0.45 + 0.55 * sin(twinklePhase), uTwinkle);

  vAlpha = uOpacity * twinkle;
  vRank = aRank / max(1.0, uVisibleCount);
  vSeed = aSeed.x;
}
`;

export const labCloudFragmentShader = /* glsl */ `
precision mediump float;

uniform vec3 uColor;
uniform vec3 uAccent;
uniform int uStyle;

varying float vAlpha;
varying float vRank;
varying float vSeed;

// Style codes — keep in sync with the SPRITE_STYLES array in
// LabBrandmarkCloud.tsx.
//   0 = soft dot         (radial smoothstep — production look)
//   1 = hard square      (full square sprite)
//   2 = hollow ring      (thin annulus)
//   3 = 4-point star     (cross with axis-aligned arms)
//   4 = plus-cross       (sharp axis-aligned cross)
//   5 = filled disc      (hard circle, no halo)

void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float d = length(c);
  vec2 ac = abs(c);

  float alpha = 0.0;

  if (uStyle == 0) {
    // Soft dot — same falloff family the production atmosphere uses.
    alpha = 1.0 - smoothstep(0.30, 0.5, d);
  } else if (uStyle == 1) {
    // Hard square — full sprite tile, slight edge soften so it
    // anti-aliases against neighbours.
    float edge = max(ac.x, ac.y);
    alpha = 1.0 - smoothstep(0.46, 0.5, edge);
  } else if (uStyle == 2) {
    // Hollow ring — band centred at d ≈ 0.32.
    float band = smoothstep(0.5, 0.36, d) * smoothstep(0.18, 0.30, d);
    alpha = band;
  } else if (uStyle == 3) {
    // 4-point star — wide cross arms with a bright core. Each arm
    // is the perpendicular axis kept thin while the parallel axis
    // is allowed to extend further out. Combined with a centre dot
    // for crispness.
    float armX = (1.0 - smoothstep(0.10, 0.28, ac.y)) * (1.0 - smoothstep(0.30, 0.50, ac.x));
    float armY = (1.0 - smoothstep(0.10, 0.28, ac.x)) * (1.0 - smoothstep(0.30, 0.50, ac.y));
    float core = 1.0 - smoothstep(0.04, 0.18, d);
    alpha = max(max(armX, armY), core);
  } else if (uStyle == 4) {
    // Plus-cross — sharper than the star, no diagonal falloff.
    float thick = 0.10;
    float armX = step(ac.y, thick) * step(ac.x, 0.46);
    float armY = step(ac.x, thick) * step(ac.y, 0.46);
    alpha = max(armX, armY);
  } else if (uStyle == 5) {
    // Filled disc — hard circle with a 1-pixel anti-aliased edge.
    alpha = 1.0 - smoothstep(0.46, 0.50, d);
  } else {
    alpha = 1.0 - smoothstep(0.30, 0.5, d);
  }

  if (alpha <= 0.005) discard;

  // Per-particle tint mix — accent particles (high rank) lean
  // toward uAccent. Adds quiet internal contrast within the cloud
  // so it doesn't read as a flat colour stamp.
  vec3 col = mix(uColor, uAccent, smoothstep(0.6, 1.0, vRank));

  gl_FragColor = vec4(col, alpha * vAlpha);
}
`;
