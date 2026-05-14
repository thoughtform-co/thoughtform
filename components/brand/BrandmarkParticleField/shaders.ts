/**
 * Shaders for the brandmark particle artifact.
 *
 * Kept as TypeScript template literals so we don't have to configure
 * a webpack `.glsl` loader in `next.config.mjs`. This is the same
 * pattern used by every R3F-in-Next.js example in the ecosystem.
 *
 * The vertex shader does three things:
 *
 *   1. Rank-clip: particles with `aRank > uVisibleCount` are pushed
 *      off-screen and their point size goes to zero. This is how the
 *      density dial works without rebuilding the buffer geometry —
 *      we just lower `uVisibleCount` and the GPU skips those points
 *      at zero fragment cost.
 *
 *   2. Wander: each particle has a deterministic per-particle `aSeed`
 *      that drives a two-frequency sinusoidal drift centred on its
 *      `aHome` position. `uDispersion` scales the drift amplitude
 *      against `uHalfSize` so the wander looks proportional to the
 *      station's rect at any size.
 *
 *   3. Pixel-to-NDC projection: rather than rely on an external
 *      camera matrix, the shader converts pixel-space coordinates
 *      (which is what `getBoundingClientRect()` gives us) into NDC
 *      directly using `uViewport`. Y is flipped because client
 *      coords are top-down. This keeps the choreography hook
 *      pixel-native and means we don't need to recompute camera
 *      uniforms on resize.
 *
 * The fragment shader paints a solid square — no antialiasing, no
 * radial falloff — which keeps the Canvas-2D `fillRect(GRID, GRID)`
 * aesthetic from `ParticleWordmarkMorph.tsx` and lets the dense
 * cloud read as a filled mark at full density without anti-aliased
 * dot edges softening the silhouette.
 */

export const brandmarkVertexShader = /* glsl */ `
uniform vec2 uViewport;     // pixels (window.innerWidth, window.innerHeight)
uniform vec2 uCenter;       // pixels (rect center)
uniform vec2 uHalfSize;     // pixels (rect.width / 2, rect.height / 2)
uniform float uOpacity;     // [0..1]
uniform float uVisibleCount;// rank clip threshold
uniform float uDispersion;  // [0..1] wander multiplier
uniform float uTime;        // seconds
uniform float uPointSize;   // base px (multiplied by uPixelRatio)
uniform float uPixelRatio;

attribute vec2 aHome;       // [-0.5, 0.5] normalised inside viewBox
attribute vec2 aSeed;       // stable per-particle seed
attribute float aRank;      // [0, count)

varying float vAlpha;

void main() {
  // Rank clip — push hidden particles far off-screen. The fragment
  // shader never runs for them because gl_PointSize is also zero.
  if (aRank > uVisibleCount) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    gl_PointSize = 0.0;
    vAlpha = 0.0;
    return;
  }

  // Two-frequency sinusoidal wander. The seed offsets each particle's
  // phase so the cloud breathes asynchronously rather than pulsing.
  vec2 wander = vec2(
    sin(aSeed.x * 1.7 + uTime * 0.55) * 0.55 +
      sin(aSeed.x * 0.41 + uTime * 1.13) * 0.22,
    cos(aSeed.y * 1.9 + uTime * 0.47) * 0.55 +
      cos(aSeed.y * 0.37 + uTime * 0.91) * 0.22
  );

  // Pixel-space final position. aHome is half-unit normalised so we
  // scale by 2 * uHalfSize. Wander is in [-1..1] band, scaled by
  // uHalfSize so dispersion of 1.0 lets particles wander a full
  // half-rect from their home.
  vec2 pixelPos = uCenter + aHome * 2.0 * uHalfSize + wander * uDispersion * uHalfSize;

  // Convert pixel coords to clip-space NDC. Client Y is top-down,
  // NDC Y is bottom-up — flip the y component.
  vec2 ndc = (pixelPos / uViewport) * 2.0 - 1.0;
  ndc.y = -ndc.y;

  gl_Position = vec4(ndc, 0.0, 1.0);
  gl_PointSize = uPointSize * uPixelRatio;
  vAlpha = uOpacity;
}
`;

export const brandmarkFragmentShader = /* glsl */ `
precision mediump float;

uniform vec3 uTint;

varying float vAlpha;

void main() {
  // Solid square coverage — no antialiasing, no radial falloff. This
  // matches the Canvas-2D \`fillRect(GRID, GRID)\` aesthetic used by
  // ThoughtformSigil and ParticleWordmarkMorph, so a high-density
  // cloud reads as a hard-edged filled mark and a low-density cloud
  // reads as discrete pixels rather than soft dust.
  gl_FragColor = vec4(uTint, vAlpha);
}
`;
