/**
 * brandmarkCloud — vertex + fragment shader for the home-v2 persistent
 * brandmark point cloud.
 *
 * Adapted from `substrateMorph` (ADR-017) with three changes:
 *
 *   1. The brandmark home is in BODY-LOCAL space (not screen-projected
 *      world space). The painter sets the parent `<group>` position
 *      and scale from the scene-geometry helpers, so the shader's job
 *      is just to place each particle at its 2D brandmark home OR at
 *      its 3D Fibonacci-sphere home, then mix between them.
 *
 *   2. There's no DOM anchor un-projection — `uBrandmarkSize` is a
 *      simple per-call constant set by the React component. This
 *      lets the component drive the cloud entirely from
 *      `depthGatewayStore` without polling DOM rects.
 *
 *   3. `uPresence` and `uOpacity` are kept so the cloud can be faded
 *      in/out cleanly when the stage activates/deactivates.
 *
 * Uniforms:
 *   - uTime          — seconds elapsed (drives sphere breathing)
 *   - uPointSize     — base point size (px before DPR multiply)
 *   - uPixelRatio    — devicePixelRatio
 *   - uPresence      — global cloud opacity scalar (0..1)
 *   - uShapeMorph    — 0 = brandmark shape, 1 = Fibonacci sphere
 *   - uBrandmarkSize — local-space half-size of the flat brandmark
 *                       plate (XY). The Z plane is local z=0.
 *   - uSphereRadius  — local-space sphere radius (matches the
 *                       Fibonacci shell built in JS).
 *   - uColor         — body tint
 *   - uRimColor      — rim tint (used as sphere-shell rim glow)
 *   - uOpacity       — final material opacity multiplier
 */

export const brandmarkCloudVertex = /* glsl */ `
uniform float uTime;
uniform float uPointSize;
uniform float uPixelRatio;
uniform float uPresence;
uniform float uShapeMorph;
uniform vec2 uBrandmarkSize;
uniform float uSphereRadius;

attribute vec2 aHomeBrandmark;
attribute vec3 aHomeSphere;
attribute vec3 aSphereNormal;
attribute float aSeed;

varying float vRim;
varying float vAlpha;
varying float vSeed;
varying float vMorph;

void main() {
  // ─── Brandmark target (local space) ──────────────────────────
  // aHomeBrandmark is in [-0.5, 0.5]; flip Y to match SVG y-down →
  // world y-up. The plate sits at local z = 0 so when the painter
  // places the parent group at the brandmark's world position the
  // cloud paints in front of (the camera-facing side of) that group.
  vec3 brandmarkTarget = vec3(
    aHomeBrandmark.x * uBrandmarkSize.x,
    -aHomeBrandmark.y * uBrandmarkSize.y,
    0.0
  );

  // ─── Sphere target (local space) ─────────────────────────────
  // aHomeSphere lives on the unit shell; scale to the local sphere
  // radius. Breathing is multiplied by uShapeMorph so it only
  // manifests once the cloud has settled into the sphere.
  float breath = sin(aSeed * 6.2831 + uTime * 0.45) * 0.012;
  float ripple = sin(aSeed * 17.0 + uTime * 0.9) * 0.006;
  vec3 sphereLocal = aHomeSphere
    + aSphereNormal * (breath + ripple * (0.4 + aSeed * 0.6)) * uShapeMorph;
  vec3 sphereTarget = sphereLocal * uSphereRadius;

  // ─── Mix ─────────────────────────────────────────────────────
  vec3 localPos = mix(brandmarkTarget, sphereTarget, uShapeMorph);

  vec4 mv = modelViewMatrix * vec4(localPos, 1.0);

  // Rim factor — only meaningful in sphere mode. Use the sphere's
  // surface normal so the rim glow lights up as the cloud forms the
  // sphere shell.
  vec3 viewN = normalize(normalMatrix * aSphereNormal);
  float facing = clamp(abs(viewN.z), 0.0, 1.0);
  float rim = pow(1.0 - facing, 1.0) * uShapeMorph;
  vRim = rim;
  vSeed = aSeed;
  vMorph = uShapeMorph;

  // Front-hemisphere falloff is sphere-only — in brandmark mode
  // every point is visible regardless of hemisphere.
  float frontness = smoothstep(-0.45, 0.15, viewN.z);
  float frontnessActive = mix(1.0, frontness, uShapeMorph);
  vAlpha = (0.55 + frontnessActive * 0.45 + rim * 0.35) * uPresence;

  gl_Position = projectionMatrix * mv;

  // Distance-based point size — points farther from the camera in
  // view-space get smaller. -mv.z is the positive view-space
  // distance for a camera at the origin looking down -Z. A 0.45
  // exponent gives a gentle perspective falloff that keeps brandmark
  // particles legible as the camera approaches the intelligence
  // gate and still readable when the camera has dollied past it.
  float distFactor = 1.0 / max(0.4, pow(-mv.z, 0.45));
  gl_PointSize = uPointSize * uPixelRatio * distFactor * (0.85 + rim * 0.45 + frontness * 0.2);
}
`;

export const brandmarkCloudFragment = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uRimColor;
uniform float uOpacity;

varying float vRim;
varying float vAlpha;
varying float vSeed;
varying float vMorph;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float soft = smoothstep(0.5, 0.04, d);
  float core = smoothstep(0.22, 0.0, d);

  float sparkle = step(0.985, fract(vSeed * 41.0)) * 0.6;
  vec3 col = mix(uColor, uRimColor, clamp(vRim + sparkle, 0.0, 1.0));

  float alpha = (soft * 0.85 + core * 0.5) * vAlpha * uOpacity;
  if (alpha < 0.012) discard;
  gl_FragColor = vec4(col, alpha);
}
`;
