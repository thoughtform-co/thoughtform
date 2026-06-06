/**
 * brainCloud — vertex + fragment shader for the substrate brain
 * artifact (Phase 5 of the 2026-06-06 wrap-around revision).
 *
 * Adapted from `brandmarkCloud` with the brandmark/sphere morph
 * machinery removed — the brain is a STATIC 3D point cloud, no
 * shape morph, no sphere blend. Each particle reads its world
 * position from `attribute vec3 position` (set by `sampleBrainPoints`)
 * and paints a soft additive gold dot with subtle per-particle
 * twinkle.
 *
 * Uniforms:
 *   - uTime       — seconds elapsed (drives twinkle)
 *   - uPointSize  — base point size (px before DPR multiply)
 *   - uPixelRatio — devicePixelRatio
 *   - uPresence   — global cloud opacity scalar (0..1)
 *   - uColor      — body tint (gold)
 *   - uRimColor   — sparkle / rim tint (lighter gold)
 *   - uOpacity    — final material opacity multiplier
 */

export const brainCloudVertex = /* glsl */ `
uniform float uTime;
uniform float uPointSize;
uniform float uPixelRatio;
uniform float uPresence;

attribute float aSeed;

varying float vSeed;
varying float vAlpha;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;

  // Per-particle twinkle: oscillates between 0.7 and 1.0 with a
  // phase drawn from aSeed so the brain glitters as an instrument
  // rather than a rigid mesh.
  float twinkle = 0.85 + 0.15 * sin(aSeed * 6.2831 + uTime * 0.6);

  vSeed = aSeed;
  vAlpha = twinkle * uPresence;

  // Distance-based point size — mirrors brandmarkCloud's falloff so
  // the brain visually matches the traveling brandmark cloud at the
  // same world depth (both painters share the corridor's depth
  // grammar).
  float distFactor = 1.0 / max(0.4, pow(-mv.z, 0.45));
  gl_PointSize = uPointSize * uPixelRatio * distFactor * (0.85 + twinkle * 0.2);
}
`;

export const brainCloudFragment = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uRimColor;
uniform float uOpacity;

varying float vSeed;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float soft = smoothstep(0.5, 0.04, d);
  float core = smoothstep(0.22, 0.0, d);

  // Sparse "synapse spark" — ~1.5% of points get a rim tint pop so
  // the cloud feels alive without descending into a sparkle field.
  float sparkle = step(0.985, fract(vSeed * 41.0)) * 0.6;
  vec3 col = mix(uColor, uRimColor, clamp(sparkle, 0.0, 1.0));

  float alpha = (soft * 0.85 + core * 0.5) * vAlpha * uOpacity;
  if (alpha < 0.012) discard;
  gl_FragColor = vec4(col, alpha);
}
`;
