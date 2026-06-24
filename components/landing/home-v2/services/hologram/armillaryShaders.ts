/**
 * Shaders for the Services hologram artifact (the volumetric brandmark).
 *
 * The vertex shader morphs each particle between its flat-glyph home and
 * its 3D-armillary home via a single `uFlyIn` scrub, then projects with the
 * REAL perspective camera (`projectionMatrix * modelViewMatrix`) — so the
 * cloud gains genuine depth, parallax, and near/far size falloff. This is
 * the fix for the orthographic `gl_Position.z = 0` flatness of the v7
 * journey painters: here the artifact is a true 3D object floating in the
 * scene.
 *
 * The fragment shader is the same soft-radial-dot + additive family as the
 * journey painters (the documented contract — no solid squares), with a
 * view-depth dim so the back of the sphere recedes and a faint shell tier.
 */

export const armillaryVertexShader = /* glsl */ `
  uniform float uFlyIn;       // 0 = flat glyph, 1 = full armillary
  uniform float uTime;
  uniform float uPointSize;   // base size in CSS px
  uniform float uPixelRatio;
  uniform float uDensity;     // 0..1 rank-clip threshold (shell thins first)
  uniform float uFocal;       // perspective size factor (≈ camera distance)
  uniform float uScale;       // world scale of the artifact

  attribute vec3 aFlatHome;
  attribute vec3 aArmHome;
  attribute float aSeed;
  attribute float aPart;      // 0 ring · 1 axis · 2 shell
  attribute float aEdge;

  varying float vEdge;
  varying float vSeed;
  varying float vViewDepth;
  varying float vPart;
  varying float vViewY;

  void main() {
    vEdge = aEdge;
    vSeed = aSeed;
    vPart = aPart;

    // Staggered smootherstep so the mark UNFOLDS (particles ease open at
    // slightly different times) rather than snapping as one rigid block.
    float stagger = aSeed * 0.28;
    float local = clamp((uFlyIn - stagger) / (1.0 - 0.28), 0.0, 1.0);
    float t = local * local * local * (local * (local * 6.0 - 15.0) + 10.0);

    vec3 pos = mix(aFlatHome, aArmHome, t) * uScale;

    // Density rank-clip. Shell (part 2) thins first; structure (ring/axis)
    // survives ~60% longer so the artifact never loses its skeleton.
    float keep = (aPart > 1.5) ? uDensity : mix(uDensity, 1.0, 0.6);
    if (aSeed > keep) {
      gl_PointSize = 0.0;
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // off-clip, rasterises nothing
      return;
    }

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vViewDepth = -mv.z;
    vViewY = mv.y;
    gl_Position = projectionMatrix * mv;

    // Real perspective point sizing — nearer particles read bigger, which
    // is most of what sells the depth. Edge structure gets a small bump.
    float sizeEdge = mix(0.6, 1.4, aEdge);
    float persp = uFocal / max(0.25, -mv.z);
    gl_PointSize = uPointSize * uPixelRatio * sizeEdge * persp;
  }
`;

export const armillaryFragmentShader = /* glsl */ `
  precision mediump float;

  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uNear;   // view depth mapped to brightest
  uniform float uFar;    // view depth mapped to dimmest
  uniform float uScan;      // view-space Y of the scan band (animated)
  uniform float uScanWidth; // half-thickness of the scan band
  uniform float uScanGain;  // brightness lift on the scan band

  varying float vEdge;
  varying float vSeed;
  varying float vViewDepth;
  varying float vPart;
  varying float vViewY;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    // Soft radial dot (ADR-015 contract — no hard squares on the mark).
    float mask = 1.0 - smoothstep(0.16, 0.5, d);
    if (mask < 0.01) discard;

    // Atmospheric view-depth dim: back of the sphere recedes into the void.
    float dn = clamp((vViewDepth - uNear) / max(0.001, (uFar - uNear)), 0.0, 1.0);
    float depthDim = mix(1.0, 0.42, dn);

    // Organic per-particle twinkle (seed-varied phase + frequency).
    float pulse = sin(uTime * (0.6 + vSeed * 1.4) + vSeed * 6.2831) * 0.08 + 0.92;
    float tw = (0.7 + 0.3 * vSeed) * pulse;

    // Edge structure leans toward the dawn accent at the limb.
    vec3 col = mix(uColor, uAccent, vEdge * 0.5) * depthDim;

    float partAlpha = (vPart > 1.5) ? 0.3 : 1.0; // shell dust stays faint
    float a = mask * uOpacity * depthDim * tw * partAlpha;

    // Radar scan sweep — a bright band travelling vertically through the
    // artifact lifts the particles it passes (toward the hot accent), so the
    // mark reads as a holographic contact being actively scanned.
    float scan = smoothstep(uScanWidth, 0.0, abs(vViewY - uScan));
    col += uAccent * scan * uScanGain;
    a += scan * uScanGain * 0.12 * mask;

    gl_FragColor = vec4(col, a);
  }
`;
