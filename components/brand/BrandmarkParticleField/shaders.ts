/**
 * Shaders for the brandmark atmosphere.
 *
 * Kept as TypeScript template literals so we don't have to configure
 * a webpack `.glsl` loader in `next.config.mjs`. This is the same
 * pattern used by every R3F-in-Next.js example in the ecosystem.
 *
 * Vector-first refactor: the cloud no longer paints the brandmark
 * shape. The crisp brandmark is rendered as vector SVG by
 * `BrandmarkVectorActor`; this shader paints luminous atmospheric
 * grain that lives around and inside the vector mark. The fragment
 * shader now draws soft RADIAL dots with additive blending — every
 * particle reads as a point of light rather than a paper tile.
 *
 * The vertex shader does four things:
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
 *   3. Squash-rotation (legacy): a single scalar `uRotationY` uniform
 *      applies a 2D affine transform that approximates a Y-axis 3D
 *      rotation. Now redundant with the vector actor's honest CSS 3D
 *      rotation, but retained so the atmosphere tilts in sympathy
 *      with the brandmark during the substrate window. Set to 0 to
 *      disable.
 *
 *   4. Pixel-to-NDC projection: rather than rely on an external
 *      camera matrix, the shader converts pixel-space coordinates
 *      (which is what `getBoundingClientRect()` gives us) into NDC
 *      directly using `uViewport`. Y is flipped because client
 *      coords are top-down. This keeps the journey hook pixel-native
 *      and means we don't need to recompute camera uniforms on
 *      resize.
 *
 * The fragment shader now paints a soft RADIAL falloff — each point
 * is a luminous gold speck rather than a paper tile. Combined with
 * additive blending on the material this reads as constellation dust
 * around the brandmark; sparse densities read as scattered sparks,
 * higher densities glow as a halo. The papercraft tile aesthetic is
 * intentionally gone.
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
uniform float uRotationY;   // radians; 2D squash approximation of Y-axis 3D rotation
uniform float uShapeBlend;  // [0..1] lerp between aHome (full mark) and aHomeRing (ring-only)

attribute vec2 aHome;       // [-0.5, 0.5] normalised inside viewBox (full mark)
attribute vec2 aHomeRing;   // [-0.5, 0.5] normalised inside viewBox (ring-only)
attribute vec2 aSeed;       // stable per-particle seed
attribute float aRank;      // [0, count)

varying float vAlpha;

// Perspective-shear amplitude. At peak tilt, the top/bottom edges of
// the brandmark slide horizontally by roughly SHEAR_SCALE * half-height
// per unit of vertical offset. Tuned visually so the squash reads as
// the brandmark tipping back rather than just getting narrower.
// Small enough that subtle tilt at low rotationY barely registers;
// substantial enough that peak tilt reads as real 3D foreshortening.
const float SHEAR_SCALE = 0.18;

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

  // === ADR-014: per-particle shape blend ===
  //
  // The brandmark can sample to multiple topologies (currently full
  // mark vs ring-only). Each particle has a paired home in both
  // shapes, indexed by its rank. mix() at uShapeBlend gives a
  // continuous lerp so the cloud morphs cleanly between the two
  // (no teleports, no opacity fades — Principle 4 of ADR-013).
  vec2 blendedHome = mix(aHome, aHomeRing, uShapeBlend);

  // === ADR-013: 2D squash-rotation around the brandmark centre ===
  //
  // Apply the squash to blendedHome BEFORE adding wander, so the
  // wander stays in the post-squash coordinate frame (particles
  // breathe inside the squashed silhouette, not outside it).
  //
  //   cosR = cos(rotationY)      → horizontal scale factor
  //   sinR = sin(rotationY)      → drives the perspective shear
  //
  // At rotationY = 0:   cosR = 1, sinR = 0  → identity (axis-aligned).
  // At rotationY = pi/2: cosR = 0           → all particles collapse
  //                                            to the vertical axis
  //                                            (edge-on read).
  float cosR = cos(uRotationY);
  float sinR = sin(uRotationY);
  vec2 squashedHome = vec2(
    blendedHome.x * cosR + blendedHome.y * sinR * SHEAR_SCALE,
    blendedHome.y
  );

  // Pixel-space final position. squashedHome is half-unit normalised
  // so we scale by 2 * uHalfSize. Wander is in [-1..1] band, scaled
  // by uHalfSize so dispersion of 1.0 lets particles wander a full
  // half-rect from their home. Wander is intentionally NOT squashed
  // — at peak tilt the wander becomes the only "thickness" of the
  // cloud, which reads as the brandmark's atmosphere.
  vec2 pixelPos = uCenter + squashedHome * 2.0 * uHalfSize + wander * uDispersion * uHalfSize;

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
  // Soft radial falloff — each point is a luminous speck with a
  // bright core and a smooth outer fade to alpha 0. Combined with
  // additive blending on the material, dense regions glow as a
  // halo while sparse regions read as discrete sparks.
  //
  // gl_PointCoord is [0,1]^2 across the rendered point square.
  // length(gl_PointCoord - 0.5) is the distance from centre in [0,
  // sqrt(0.5)]. Inside 0.35 we hold full intensity, then ramp to 0
  // by 0.5 — a tight bright core surrounded by a quick soft halo.
  float d = length(gl_PointCoord - vec2(0.5));
  float alpha = 1.0 - smoothstep(0.35, 0.5, d);
  if (alpha <= 0.001) discard;
  gl_FragColor = vec4(uTint, vAlpha * alpha);
}
`;

/**
 * Silhouette shader pair for the sigil → miss → … particle brandmark
 * (ADR-019). The crisp vector at Thoughtform dissolves into this
 * point cloud the moment the visitor enters the sigil → miss travel
 * leg, and stays as the particle brandmark from the Diagnostic dock
 * onward.
 *
 * The vertex shader is the pixel-space sibling of the substrate
 * morph: each point reads its home from the brandmark's `[-0.5, 0.5]`
 * normalised viewBox sample (`aHome`) and is placed into screen
 * coordinates via the journey transform's `uCenter` + `uHalfSize`.
 *
 * Differences from `brandmarkVertexShader` (the atmosphere station):
 *
 *   1. No rank clip — the silhouette is always at full density. The
 *      visible particle count is fixed at mesh-build time so the
 *      brandmark reads as a solid filled mark of soft dots.
 *   2. No shape blend — the silhouette only paints the canonical
 *      `full` topology. The ring topology lives inside the substrate
 *      window and is owned by the vector actor's stacked ring glyph.
 *   3. Cover-in by morph — `uMorph` (0 → 1) drives a gentle radial
 *      inflation from the rect centre so the silhouette emerges from
 *      the vector mark's centre rather than popping into existence
 *      pre-formed. Past `MORPH_FULL` the geometry is identity.
 *   4. Opacity gated by `uOpacity * smoothstep(0, MORPH_FULL, uMorph)`
 *      so when `silhouetteMorph = 0` the mesh renders nothing — saves
 *      the fragment shader for sigil parked state where the vector
 *      owns the mark alone.
 */
export const brandmarkSilhouetteVertexShader = /* glsl */ `
uniform vec2 uViewport;     // pixels (window.innerWidth, window.innerHeight)
uniform vec2 uCenter;       // pixels (rect center)
uniform vec2 uHalfSize;     // pixels (rect.width / 2, rect.height / 2)
uniform float uOpacity;     // [0..1] base opacity (transform.opacity)
uniform float uMorph;       // [0..1] silhouetteMorph
uniform float uTime;        // seconds
uniform float uPointSize;   // base px (multiplied by uPixelRatio)
uniform float uPixelRatio;
uniform float uSuppress;    // [0..1] external opacity multiplier (e.g. substrate handoff)

attribute vec2 aHome;       // [-0.5, 0.5] normalised inside viewBox (full mark)
attribute vec2 aSeed;       // stable per-particle seed

varying float vAlpha;

/** Morph value at which the silhouette has fully covered the
 *  vector mark. Past this the rect lerp owns the journey. The
 *  vector actor's cover-cut threshold is tuned just below this. */
const float MORPH_FULL = 0.6;

void main() {
  // Cover-in inflation. Particles start collapsed at the rect centre
  // (radial = 0) and inflate to their home position as uMorph crosses
  // [0, MORPH_FULL]. Past MORPH_FULL the home is identity. This makes
  // the silhouette emerge OUT of the vector mark rather than appear
  // pre-formed alongside it. Eased with a smoothstep so the start
  // is gentle (Principle 1: continuous geometric evolution).
  float coverIn = smoothstep(0.0, MORPH_FULL, uMorph);
  vec2 coveredHome = aHome * coverIn;

  // Subtle wander — same two-frequency sinusoidal pattern as the
  // atmosphere station, but at lower amplitude so the silhouette
  // breathes as a coherent mark rather than dispersing. Amplitude
  // scales with the morph so the wander only manifests once the
  // silhouette has formed.
  vec2 wander = vec2(
    sin(aSeed.x * 1.7 + uTime * 0.55) * 0.012 +
      sin(aSeed.x * 0.41 + uTime * 1.13) * 0.006,
    cos(aSeed.y * 1.9 + uTime * 0.47) * 0.012 +
      cos(aSeed.y * 0.37 + uTime * 0.91) * 0.006
  ) * coverIn;

  vec2 pixelPos = uCenter + (coveredHome + wander) * 2.0 * uHalfSize;

  // Convert pixel coords to clip-space NDC. Client Y is top-down,
  // NDC Y is bottom-up — flip the y component.
  vec2 ndc = (pixelPos / uViewport) * 2.0 - 1.0;
  ndc.y = -ndc.y;

  gl_Position = vec4(ndc, 0.0, 1.0);

  // Point size also ramps with the cover-in so the silhouette
  // condenses into focus rather than appearing as full-size dots
  // from frame one. At full cover the size is uPointSize.
  float sizeRamp = 0.4 + 0.6 * coverIn;
  gl_PointSize = uPointSize * uPixelRatio * sizeRamp;

  // Opacity gates: base journey opacity, the morph envelope (so the
  // mesh is invisible at silhouetteMorph = 0), and the external
  // suppression channel (substrate handoff).
  vAlpha = uOpacity * coverIn * uSuppress;
}
`;

export const brandmarkSilhouetteFragmentShader = /* glsl */ `
precision mediump float;

uniform vec3 uTint;

varying float vAlpha;

void main() {
  // Soft radial falloff — same family as the atmosphere shader so
  // the silhouette dots read with consistent visual language. A
  // slightly tighter core (0.30 vs 0.35) keeps the silhouette
  // crisp; the atmosphere field's wider halo is what we use for
  // luminous dust around the mark.
  float d = length(gl_PointCoord - vec2(0.5));
  float alpha = 1.0 - smoothstep(0.30, 0.5, d);
  if (alpha <= 0.001) discard;
  gl_FragColor = vec4(uTint, vAlpha * alpha);
}
`;
