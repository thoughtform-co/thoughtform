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
  uniform float uStream;        // backward-Z momentum (vertex-only)
  // uGlitch / uTime are shared with the fragment shader; they MUST carry
  // a matching precision qualifier or the program silently fails to link
  // on WebGL2 ("Precisions of uniform differ between VERTEX and FRAGMENT
  // shaders"). The fragment runs \`precision mediump float\`, so these are
  // declared mediump here to match.
  uniform mediump float uGlitch; // 0 = no glitch, ~1 at handoff peak (bell)
  uniform mediump float uTime;   // wall-clock seconds (animates the tear)
  
  attribute vec2 aUV;
  attribute float aLuma;        // per-particle phase [0, 1)
  attribute float aEdgeWeight;  // edge proximity [0, 1]
  
  varying float vLuma;
  varying float vEdgeWeight;
  varying float vDepth;         // local Z, drives atmospheric dim
  
  // Cheap deterministic hash for the per-band scanline displacement.
  float hash11(float n) {
    return fract(sin(n * 12.9898) * 43758.5453);
  }
  
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
    
    // ── SUBTLE MATRIX GLITCH (uGlitch > 0) ───────────────────────
    // A gentle scanline tear that ONLY runs across the 2D → 3D handoff
    // band (uGlitch is a bell, 0 at both ends). Particles in the same
    // horizontal band shift together by a small amount; ~10% of bands
    // are "tear" bands that shift a touch further. Amplitudes are kept
    // small (a few percent of the brandmark half-width) so the dust
    // streaks in scanlines rather than scattering apart — it reads as
    // the mark briefly destabilising as it gains depth, integrated with
    // the soft-halo cloud rather than a harsh digital break.
    if (uGlitch > 0.001) {
      float band = floor(pos.y * 14.0);
      float bandSeed = hash11(band + floor(uTime * 11.0));
      float tear = step(0.9, hash11(band * 0.27 + 3.1));
      float lateral = (bandSeed - 0.5) * 2.0 + tear * sign(bandSeed - 0.5) * 0.5;
      pos.x += lateral * 0.022 * uGlitch;
      pos.y += (hash11(band * 0.7 + aLuma * 23.0) - 0.5) * 0.012 * uGlitch;
    }
    
    // ── Z-STREAM MOMENTUM (uStream > 0) ──────────────────────────
    // As the mark flies into the corridor toward the substrate sphere,
    // push particles toward the BACKGROUND (local −Z, deeper into the
    // corridor where the sphere wraps). A base component shifts the
    // whole silhouette back (the mark reads as flying backward into the
    // sphere); a seed-varied component trails individual particles
    // further, so the cloud gains a comet-tail sense of momentum rather
    // than translating as one rigid block. uStream is a scroll/velocity
    // envelope (0 outside the entry → sphere band), so the silhouette
    // settles back to home once the mark is parked inside the sphere.
    float streamFactor = 0.4 + 0.6 * pow(aLuma, 1.3);
    pos.z -= uStream * streamFactor;
    
    // Forward Z hand-off to the fragment shader. The brandmark home
    // dome puts particles in z ∈ [~-0.06, ~+0.21]; the GPGPU sim
    // perturbs them within that band. Fragment normalises into a
    // 0..1 brightness factor — streamed particles read dimmer as they
    // recede into the background, reinforcing the depth momentum.
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
  uniform float uGlitch;   // mediump via the precision stmt — matches vertex
  
  varying float vLuma;
  varying float vEdgeWeight;
  varying float vDepth;
  
  float hashF(float n) {
    return fract(sin(n * 12.9898) * 43758.5453);
  }
  
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
    
    // ── SUBTLE MATRIX GLITCH (uGlitch > 0) ───────────────────────
    // Stays in-palette so it reads as part of the gold dust, not an
    // alien CRT tear: a warm hue warble nudges a subset of cells
    // toward the dawn accent, and a gentle brightness flicker lifts /
    // dims cells. Both fade with uGlitch (a bell, 0 outside the
    // handoff), so the cloud is its normal soft-halo self everywhere
    // else. Paired with the vertex scanline shift, this reads as the
    // dust briefly "reconstituting" as the mark gains depth.
    if (uGlitch > 0.001) {
      float cellSeed = hashF(floor(vLuma * 53.0) + floor(uTime * 15.0));
      color = mix(color, uAccentColor, step(0.72, cellSeed) * 0.35 * uGlitch);
      color *= 1.0 + (cellSeed - 0.5) * 0.45 * uGlitch;
    }
    
    gl_FragColor = vec4(color, alpha * uOpacity);
  }
`;
