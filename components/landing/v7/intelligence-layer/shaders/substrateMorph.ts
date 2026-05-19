/**
 * substrateMorph — vertex + fragment shader for the substrate-sphere
 * morph point cloud (ADR-017).
 *
 * The substrate sphere's particle cloud is the SAME mesh that
 * paints the brandmark during the substrate window. Two per-vertex
 * attributes give each point a START and an END home:
 *
 *   - `aHomeBrandmark` — sampled from the brandmark SVG by
 *     `sampleShape`, in the SVG's [-0.5, 0.5] normalised space.
 *   - `aHomeSphere`    — Fibonacci sphere on the unit shell (matches
 *     `buildSphereCloudGeometry(0.46, ...)`'s output).
 *   - `aSphereNormal`  — companion surface normal for the rim glow.
 *   - `aSeed`          — per-particle seed for shader variation.
 *
 * The vertex shader composes both world-space targets and lerps
 * between them by `uSubstrateMorph`:
 *
 *   - At `uSubstrateMorph = 0` the cloud sits on a plane at
 *     z = `uBrandmarkZ`, centred on `uBrandmarkCenter` and sized to
 *     `uBrandmarkSize`. Read: a flat brandmark in particles.
 *   - At `uSubstrateMorph = 1` the cloud is a Fibonacci sphere of
 *     radius `uSphereRadius` centred on `uSphereCenter`. Read: the
 *     encoded substrate sphere.
 *
 * The breathing displacement (small radial wobble along the sphere
 * normal) is multiplied by `uSubstrateMorph` so it only manifests
 * once the cloud has settled into the sphere — during the morph the
 * brandmark stays crisp.
 *
 * The rim factor + front-hemisphere falloff likewise scale with
 * `uSubstrateMorph` so the brandmark renders as a flat luminous
 * silhouette (every point fully visible regardless of where it sits
 * relative to the camera) and only acquires the spherical rim
 * lighting as it morphs into the sphere shell.
 */

export const substrateMorphVertex = /* glsl */ `
uniform float uTime;
uniform float uPointSize;
uniform float uPixelRatio;
uniform float uPresence;
uniform float uSubstrateMorph;
uniform vec3 uBrandmarkCenter;
uniform float uBrandmarkZ;
uniform vec2 uBrandmarkSize;
uniform vec3 uSphereCenter;
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
  // ─── Brandmark target ────────────────────────────────────────
  // aHomeBrandmark is in the brandmark's normalised [-0.5, 0.5]
  // space (SVG y-down convention — flip y so up-on-page is up
  // in world). The painter places the brandmark centred at
  // uBrandmarkCenter on the z = uBrandmarkZ plane so the cloud
  // reads as a flat mark in 3D.
  vec3 brandmarkTarget = vec3(
    uBrandmarkCenter.x + aHomeBrandmark.x * uBrandmarkSize.x,
    uBrandmarkCenter.y - aHomeBrandmark.y * uBrandmarkSize.y,
    uBrandmarkZ
  );

  // ─── Sphere target ───────────────────────────────────────────
  // aHomeSphere is on the unit shell; scale into world units and
  // translate to the substrate body's centre. Breathing only kicks
  // in once the cloud has settled into the sphere (multiplied by
  // uSubstrateMorph) so we don't see the brandmark "wobble"
  // pre-morph.
  float breath = sin(aSeed * 6.2831 + uTime * 0.45) * 0.012;
  float ripple = sin(aSeed * 17.0 + uTime * 0.9) * 0.006;
  vec3 sphereLocal = aHomeSphere
    + aSphereNormal * (breath + ripple * (0.4 + aSeed * 0.6)) * uSubstrateMorph;
  vec3 sphereTarget = uSphereCenter + sphereLocal * uSphereRadius;

  // ─── Mix ─────────────────────────────────────────────────────
  // Direct linear blend between the two world-space targets. At
  // morph = 0 the cloud is exactly the brandmark; at morph = 1 the
  // cloud is exactly the sphere.
  vec3 worldPos = mix(brandmarkTarget, sphereTarget, uSubstrateMorph);

  vec4 mv = modelViewMatrix * vec4(worldPos, 1.0);

  // Rim factor — only meaningful in sphere mode. Use the sphere's
  // surface normal so the rim glow lights up as the cloud forms the
  // sphere shell. Scaled by morph so the brandmark stays flat-tinted.
  vec3 viewN = normalize(normalMatrix * aSphereNormal);
  float facing = clamp(abs(viewN.z), 0.0, 1.0);
  float rim = pow(1.0 - facing, 1.0) * uSubstrateMorph;
  vRim = rim;
  vSeed = aSeed;
  vMorph = uSubstrateMorph;

  // Front-hemisphere falloff is sphere-only — in brandmark mode
  // every point should be visible regardless of which hemisphere
  // its sphere normal lives on. We blend the falloff in by morph
  // so back-hemisphere points only fade as the sphere forms.
  float frontness = smoothstep(-0.45, 0.15, viewN.z);
  float frontnessActive = mix(1.0, frontness, uSubstrateMorph);
  vAlpha = (0.55 + frontnessActive * 0.45 + rim * 0.35) * uPresence;

  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPointSize * uPixelRatio * (0.85 + rim * 0.45 + frontness * 0.2);
}
`;

export const substrateMorphFragment = /* glsl */ `
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
  // Soft radial dot with a slightly brighter core. Same falloff
  // family as sphereCloud -- the substrate cloud reads identical
  // at uSubstrateMorph = 1 as the legacy sphere did.
  float soft = smoothstep(0.5, 0.04, d);
  float core = smoothstep(0.22, 0.0, d);

  float sparkle = step(0.985, fract(vSeed * 41.0)) * 0.6;
  vec3 col = mix(uColor, uRimColor, clamp(vRim + sparkle, 0.0, 1.0));

  float alpha = (soft * 0.85 + core * 0.5) * vAlpha * uOpacity;
  if (alpha < 0.012) discard;
  gl_FragColor = vec4(col, alpha);
}
`;
