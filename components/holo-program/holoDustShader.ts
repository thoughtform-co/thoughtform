/**
 * holoDustShader — the artifact's dust, in the corridor's own idiom.
 *
 * ⚠ THIS EXISTS BECAUSE `THREE.PointsMaterial` IS A HARD OPAQUE SQUARE.
 * three's points chain has no radial mask anywhere, so a `PointsMaterial`
 * with no `map` renders every mote as a filled quad — which is exactly what
 * the owner saw as "particles too thick". Every corridor painter
 * (StaticStarfield, CelestialMotes, CorridorPhotons) replaces it with a
 * `ShaderMaterial` carrying a `smoothstep` falloff, and so does this.
 *
 * Four things make the corridor's dust read as dust rather than specks, and
 * all four are here:
 *
 *   1. A RADIAL SOFT MASK — a tiny brilliant core plus a HALVED halo. The
 *      halo being half-strength is what stops a bright dot blooming into a
 *      blob.
 *   2. SIZE IN CSS PIXELS, not world units, with a CLAMPED reciprocal depth
 *      factor. Real `sizeAttenuation` (1/z) shrinks far motes to invisible
 *      sub-pixels and swells near ones; the corridor deliberately softens
 *      that curve instead.
 *   3. ⚠ `uPixelRatio` FROM THE RENDERER'S OWN DPR, never
 *      `window.devicePixelRatio`. Reading the raw value against a capped
 *      canvas DPR rasterised every star at ~2× its intended size — the
 *      recorded cause of the corridor's own "thick starfield" bug.
 *   4. A LOW BASE ALPHA AND AN EARLY `discard`, so additively stacked halo
 *      tails never accumulate into a haze floor.
 */

export const holoDustVertexShader = /* glsl */ `
  attribute float aRand;

  uniform float uPointSize;
  uniform float uPixelRatio;

  varying float vRand;

  void main() {
    vRand = aRand;

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;

    // A SOFTENED perspective: near motes may not swell without bound and far
    // ones may not vanish, so the cloud keeps its texture at every depth.
    float dist = max(0.5, -mv.z);
    float depthFactor = clamp(9.0 / dist, 0.4, 1.4);

    // Per-mote size variation, so the field is not a uniform stipple.
    float sizeJitter = 0.7 + aRand * 0.75;

    gl_PointSize = uPointSize * uPixelRatio * depthFactor * sizeJitter;
  }
`;

export const holoDustFragmentShader = /* glsl */ `
  precision mediump float;

  uniform vec3 uColor;
  uniform float uOpacity;

  varying float vRand;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);

    // Core + HALVED halo — the corridor's max(core, halo * 0.5) recipe.
    // (No backticks in here: this is a template literal.)
    float core = smoothstep(0.10, 0.0, d);
    float halo = smoothstep(0.5, 0.12, d);
    float soft = max(core, halo * 0.5);

    float jitter = 0.55 + fract(vRand * 41.0) * 0.45;
    float alpha = soft * jitter * uOpacity;

    // Cull the tails so additive stacking cannot build a haze floor.
    if (alpha < 0.012) discard;

    gl_FragColor = vec4(uColor, alpha);
  }
`;
