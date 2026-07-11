// Gateway Motion — GLSL for the plate-preserving treatments.
//
// Color pipeline: both canvases run <Canvas flat linear> and every texture
// is THREE.NoColorSpace, so sRGB-encoded plate bytes pass through the
// shader and land on the canvas untouched — WYSIWYG against an <img> of
// the same plate. Grain/sweep additions therefore operate in display
// space, matching how the CSS grain overlay composites.
//
// The same displacement math is specced for TouchDesigner in
// docs/gateway-motion/TOUCHDESIGNER.md — keep them in sync.

/** Fullscreen quad — no camera transform. */
export const FULLSCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/**
 * Treatment 2 — depth parallax.
 * Iterative depth-consistent reprojection: re-sample depth at the
 * displaced position a few rounds so foreground occludes background
 * instead of smearing (cheap steep-parallax stand-in, ample for
 * shifts of a few percent UV).
 */
export const PARALLAX_FRAG = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform sampler2D uPlate;
uniform sampler2D uDepth;
uniform sampler2D uMask;
uniform float uHasMask;
uniform vec4 uCover;      // xy = uv scale, zw = uv offset (cover-fit)
uniform vec2 uShift;      // parallax shift at (depth - focus) == 1, uv units
uniform float uFocus;     // depth pivot that stays put
uniform float uZoom;      // dolly zoom factor (<1 zooms in)
uniform vec2 uOrigin;     // zoom center in texture uv
uniform float uTime;
uniform float uGrain;
uniform float uSweepPos;  // travelling depth band; < 0 disables
uniform float uSweepWidth;
uniform vec3 uSweepColor;
uniform float uSweepIntensity;
uniform float uShimmer;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

void main() {
  vec2 uv = vUv * uCover.xy + uCover.zw;
  uv = (uv - uOrigin) * uZoom + uOrigin;

  // Depth-consistent reprojection (3 rounds converge for small shifts).
  vec2 p = uv;
  for (int i = 0; i < 3; i++) {
    float d = texture2D(uDepth, clamp(p, 0.001, 0.999)).r;
    p = uv + (d - uFocus) * uShift;
  }

  // Interior heat-shimmer, masked to the artifact when a matte exists.
  if (uShimmer > 0.0) {
    float m = uHasMask > 0.5 ? texture2D(uMask, clamp(p, 0.001, 0.999)).r : 1.0;
    vec2 wob = vec2(
      vnoise(p * 140.0 + vec2(0.0, uTime * 0.8)),
      vnoise(p * 140.0 + vec2(7.3, uTime * 0.8 + 3.1))
    ) - 0.5;
    p += wob * uShimmer * m * 0.004;
  }

  p = clamp(p, 0.001, 0.999);
  vec4 col = texture2D(uPlate, p);

  // Depth-driven light sweep — a band of light travelling through depth.
  if (uSweepPos >= 0.0) {
    float d = texture2D(uDepth, p).r;
    float band = 1.0 - smoothstep(0.0, uSweepWidth, abs(d - uSweepPos));
    float m = uHasMask > 0.5 ? texture2D(uMask, p).r : 1.0;
    float lum = dot(col.rgb, vec3(0.2126, 0.7152, 0.0722));
    col.rgb += uSweepColor * (band * m * uSweepIntensity * (0.25 + lum));
  }

  // Live grain (12 fps steps) — counters the "frozen grain" tell when the
  // plate moves. Screen-space so it never stretches with the parallax.
  float g = hash(vUv * vec2(1920.0, 1080.0) + floor(uTime * 12.0) * 17.0) - 0.5;
  col.rgb += g * uGrain;

  gl_FragColor = col;
}
`;

/**
 * Treatment 3 — 2.5D relief mesh. Vertices push along +Z by
 * (depth - focus) * relief, faded to zero near the frame border so the
 * silhouette of the plane never tears open against the background plane.
 */
export const MESH_VERT = /* glsl */ `
varying vec2 vUv;

uniform sampler2D uDepth;
uniform vec4 uCover;
uniform float uRelief;
uniform float uFocus;
uniform float uEdgeFade;

void main() {
  vUv = uv;
  vec2 tuv = uv * uCover.xy + uCover.zw;
  float d = texture2D(uDepth, tuv).r;
  float edge =
    smoothstep(0.0, uEdgeFade, uv.x) * smoothstep(1.0, 1.0 - uEdgeFade, uv.x) *
    smoothstep(0.0, uEdgeFade, uv.y) * smoothstep(1.0, 1.0 - uEdgeFade, uv.y);
  vec3 displaced = position + vec3(0.0, 0.0, (d - uFocus) * uRelief * edge);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

export const MESH_FRAG = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform sampler2D uPlate;
uniform vec4 uCover;
uniform float uTime;
uniform float uGrain;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 uv = clamp(vUv * uCover.xy + uCover.zw, 0.001, 0.999);
  vec4 col = texture2D(uPlate, uv);
  float g = hash(vUv * vec2(1920.0, 1080.0) + floor(uTime * 12.0) * 17.0) - 0.5;
  col.rgb += g * uGrain;
  gl_FragColor = col;
}
`;

/**
 * Cover-fit uv transform (uCover uniform): maps stage uv → texture uv so
 * the texture covers the stage, cropping the overflow axis. The crop
 * window is biased toward `focusX/focusY` (the artifact sits right of
 * center, so portrait viewports keep it in frame instead of centering).
 */
export function coverUv(
  stageW: number,
  stageH: number,
  texW: number,
  texH: number,
  focusX = 0.5,
  focusY = 0.5
): [number, number, number, number] {
  if (stageW <= 0 || stageH <= 0 || texW <= 0 || texH <= 0) return [1, 1, 0, 0];
  const k = Math.max(stageW / texW, stageH / texH);
  const fracX = stageW / (texW * k);
  const fracY = stageH / (texH * k);
  const centerX = Math.min(1 - fracX / 2, Math.max(fracX / 2, focusX));
  const centerY = Math.min(1 - fracY / 2, Math.max(fracY / 2, focusY));
  return [fracX, fracY, centerX - fracX / 2, centerY - fracY / 2];
}
