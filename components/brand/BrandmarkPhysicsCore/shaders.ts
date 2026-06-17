/**
 * Shaders for the corridor `BrandmarkPhysicsCore` (ADR-023).
 *
 * Visual brief: the cloud should read as the BRIGHT CORE of the
 * intelligence-layer artifact — a luminous body of dust nested
 * inside the substrate gimbal — not as solid gold paint stamped on
 * top of the scene. To achieve that, the fragment shader does
 * three things together:
 *
 *   1. **Wide soft halo per particle** — `smoothstep(0.05, 0.50, d)`
 *      gives each speck a Gaussian-feeling falloff. Sparse areas
 *      read as fireflies; dense areas accumulate into a soft glow
 *      via additive blending instead of saturating into a hard mass.
 *
 *   2. **Per-particle brightness variance** — seed-driven `vLuma`
 *      gates each particle's alpha through a `[0.35, 1.0]` band.
 *      Roughly half the cloud reads at "atmosphere" intensity;
 *      the other half catches light brighter. The brandmark is no
 *      longer a uniform field — it's a population of dust motes,
 *      each catching the gimbal's light a little differently.
 *
 *   3. **Atmospheric depth dim** — back-of-dome particles (negative
 *      Z, behind the silhouette plane) read dimmer; front particles
 *      (positive Z, dome forward) read brighter. The brandmark's
 *      total Z extent is small (~0.18 normalised) so the gradient
 *      is gentle, but it's enough to give the cloud true volumetric
 *      depth instead of looking like a flat decal.
 *
 * Plus a wider per-particle pulse with seed-varied frequency so
 * the cloud flickers organically rather than breathing as one
 * synchronised mass.
 *
 * Position is read every frame from the GPGPU sim's
 * `uPositionTexture` at the per-particle UV. The render pipeline
 * uses the standard `projectionMatrix * modelViewMatrix` so the
 * cloud is a real 3D object (the dome reads as foreshortening
 * when the camera is off-axis).
 *
 * Point size is in CSS pixels with no `(K / Z)` perspective scale —
 * the corridor camera sits ~6.2 world units away and the legacy
 * gpgpu shader's `(300 / Z)` factor blew the points up to ~145
 * pixels each, saturating the cloud into a featureless blob. Pixel-
 * space sizing matches the v7 `BrandmarkSilhouettePoints` style.
 */

export const brandmarkCoreVertexShader = /* glsl */ `
  uniform sampler2D uPositionTexture;
  uniform float uPointSize;     // CSS pixels
  uniform float uPixelRatio;
  uniform float uDepth;         // 0 = flat 2D silhouette, 1 = full 3D dome
  
  attribute vec2 aUV;
  attribute float aLuma;        // per-particle phase [0, 1)
  attribute float aEdgeWeight;  // edge proximity [0, 1]
  
  varying float vLuma;
  varying float vEdgeWeight;
  varying float vDepth;         // local Z, drives atmospheric dim
  
  void main() {
    vLuma = aLuma;
    vEdgeWeight = aEdgeWeight;
    
    // Sim-driven position. The texture is updated each frame by the
    // GPGPU compute pass (or, on the static path, by a one-shot
    // home-positions DataTexture).
    vec4 posData = texture2D(uPositionTexture, aUV);
    vec3 pos = posData.xyz;
    
    // 2D → 3D MORPH (ADR-023). The brandmark silhouette lives entirely
    // in XY (the dome + jitter only ever displace Z — see
    // sampleBrandmarkParticles). Scaling Z by uDepth therefore morphs
    // the cloud continuously between the FLAT 2D silhouette (uDepth = 0,
    // pixel-identical to the SVG brandmark it hands off from) and the
    // full 3D domed mark (uDepth = 1). The XY silhouette is preserved at
    // every value, so the mark reads as the SAME brandmark gaining depth
    // — not a different object fading in.
    pos.z *= uDepth;
    
    // Forward Z hand-off to the fragment shader. The brandmark home
    // dome puts particles in z ∈ [~-0.06, ~+0.21]; the GPGPU sim
    // perturbs them within that band. Fragment normalises into a
    // 0..1 brightness factor.
    vDepth = pos.z;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Pixel-space size with subtle per-particle variation. Edge
    // particles get a small size bump so the silhouette limb reads
    // hotter; the variance keeps the cloud from looking like a
    // uniform texture.
    float sizeMul = 0.78 + aEdgeWeight * 0.32 + aLuma * 0.18;
    gl_PointSize = uPointSize * uPixelRatio * sizeMul;
  }
`;

export const brandmarkCoreFragmentShader = /* glsl */ `
  precision mediump float;
  
  uniform vec3 uColor;
  uniform vec3 uAccentColor;
  uniform float uOpacity;
  uniform float uTime;
  
  varying float vLuma;
  varying float vEdgeWeight;
  varying float vDepth;
  
  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c);
    
    // Soft radial dot — full intensity in the central core, then a
    // smooth ramp to alpha 0 at d = 0.5. Tighter than the previous
    // pass (0.22 → 0.50) so each particle reads as a more discrete
    // speck of light, matching the airy stipple feel of the
    // CorridorSeamPixelField in #services. Dense overlap still
    // accumulates into a soft glow under additive blending; tight
    // single particles read crisply against the dark background.
    float alpha = 1.0 - smoothstep(0.30, 0.50, d);
    if (alpha < 0.005) discard;
    
    // Per-particle brightness variance. \`vLuma\` is the deterministic
    // PRNG seed in [0, 1). Mapping through [0.55, 1.0] gives the
    // cloud a fireflies-in-fog quality — every particle reads, but
    // the brighter ones catch the light hotter so the silhouette
    // doesn't paint as a uniform field.
    float twinkle = 0.55 + 0.45 * vLuma;
    alpha *= twinkle;
    
    // Atmospheric depth dim. The brandmark's Z range is small but
    // perceptible — the dome bulges to ~+0.18 at the centre and
    // back-jitter pulls some particles to ~-0.06. Mapping that to
    // a [0.7, 1.0] brightness factor gives genuine volumetric
    // depth (front-of-dome particles catch the light, back-jitter
    // particles recede) without crushing the back layer into
    // invisibility.
    float depthFactor = 0.70 + 0.30 * smoothstep(-0.06, 0.18, vDepth);
    
    // Tint blend. Edge particles (high \`vEdgeWeight\`, near the
    // silhouette extremes) trend toward the rim accent. Mix amount
    // is conservative so the body stays anchored in the gold body
    // tone — only the limb hints toward dawn.
    vec3 color = mix(uColor, uAccentColor, vEdgeWeight * 0.55);
    color *= depthFactor;
    
    // Per-particle pulse with seed-varied phase AND frequency so
    // the cloud flickers organically rather than breathing as one
    // synchronised mass. Frequency varies in [0.6, 2.0] Hz; ±10%
    // brightness amplitude is enough to register as life without
    // looking like the cloud is strobing.
    float pulseFreq = 0.6 + vLuma * 1.4;
    float pulse = sin(uTime * pulseFreq + vLuma * 6.28) * 0.10 + 0.90;
    color *= pulse;
    
    gl_FragColor = vec4(color, alpha * uOpacity);
  }
`;
