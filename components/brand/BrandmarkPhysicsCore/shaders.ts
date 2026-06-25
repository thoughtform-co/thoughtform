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
 *
 * ── Render-mode switch (lab; ADR-023 addendum) ─────────────────
 * The fragment shader carries an opt-in `uShape` branch that
 * rewrites only the per-particle COVERAGE MASK. Eight modes today
 * (defaults to `dot`, byte-identical to the corridor / parked
 * centerpiece):
 *
 *   0 dot      — soft radial speck (original)
 *   1 dither   — Bayer-stippled soft disc
 *   2 voxel    — hard square + diagonal bevel
 *   3 glyph    — procedural SDF symbol (plus / cross / square / …)
 *   4 dash     — oriented short stroke (rotated by `aAngle`)
 *   5 cell     — hard outlined square (raster / LED panel feel)
 *   6 bracket  — corner registration bracket
 *   7 scan     — oriented scan-slit + bright leading edge
 *
 * Modes 4 / 6 / 7 rotate `gl_PointCoord` by `aAngle` (radians),
 * which `sampleBrandmarkParticles` writes from the SVG-outline
 * tangent. With the legacy `dome-fill` basis the angles are 0 so
 * those modes degenerate to axis-aligned variants — still useful,
 * still byte-stable on the corridor default.
 */

export const brandmarkCoreVertexShader = /* glsl */ `
  uniform sampler2D uPositionTexture;
  uniform float uPointSize;     // CSS pixels
  uniform float uPixelRatio;
  uniform float uDepth;         // 0 = flat 2D silhouette, 1 = full 3D dome
  uniform float uCoverMorph;    // 0 = particles collapsed at rect centre, 1 = full home positions
  uniform float uStream;        // backward-Z momentum (vertex-only)
  // uGlitch / uTime are shared with the fragment shader; they MUST carry
  // a matching precision qualifier or the program silently fails to link
  // on WebGL2 ("Precisions of uniform differ between VERTEX and FRAGMENT
  // shaders"). The fragment runs \`precision mediump float\`, so these are
  // declared mediump here to match.
  uniform mediump float uGlitch; // 0 = no glitch, ~1 at handoff peak (bell)
  uniform mediump float uTime;   // wall-clock seconds (animates the tear)
  // 0 = luminous "dust" (corridor / sphere look); 1 = clean uniform field
  // (the Services centerpiece). Ramps with the shrink-in so the sphere is
  // untouched and the mark cleans up as it settles. Declared mediump to
  // match the fragment (shared-uniform precision rule, see uGlitch/uTime).
  uniform mediump float uCleanField;
  // Centerpiece tuners (vertex-only → plain highp, NOT shared with the fragment,
  // so no precision-match constraint per Invariant 8). Material defaults equal
  // the production values, so the corridor + centerpiece are unchanged unless a
  // consumer (the tuning lab) overrides them.
  uniform float uCorridorKeep;       // surviving particle fraction at clean = 0 (corridor)
  uniform float uCleanFieldKeep;     // surviving particle fraction at clean = 1 (centerpiece)
  uniform float uCleanFieldDotScale; // dot-size multiplier at clean = 1

  attribute vec2 aUV;
  attribute float aLuma;        // per-particle phase [0, 1)
  attribute float aEdgeWeight;  // edge proximity [0, 1]
  attribute float aAngle;       // per-particle orientation (radians, vertex-only varying-to-fragment)
  attribute vec3 aTarget3D;     // ADR-023 2026-06-25 hybrid: volumetric wireframe home (LOCAL space)

  varying float vLuma;
  varying float vEdgeWeight;
  varying float vDepth;         // local Z, drives atmospheric dim
  varying float vAngle;         // forwarded to fragment so dash / scan / bracket can rotate
  varying float vCoverMorph;    // [0, 1] cover-in factor — fragment alpha gate

  // Cheap deterministic hash for the per-band scanline displacement.
  float hash11(float n) {
    return fract(sin(n * 12.9898) * 43758.5453);
  }
  
  void main() {
    vLuma = aLuma;
    vEdgeWeight = aEdgeWeight;
    vAngle = aAngle;
    
    // Sim-driven position. The texture is updated each frame by the
    // GPGPU compute pass (or, on the static path, by a one-shot
    // home-positions DataTexture).
    vec4 posData = texture2D(uPositionTexture, aUV);
    vec3 pos = posData.xyz;
    
    // ── 2D COVER-IN MORPH (ADR-023 morph rev., 2026-06-24 cover-in pass) ──
    // Particles start collapsed at the model origin (which IS the rect
    // centre, because the brandmark is sampled in [-0.5, 0.5] and the
    // group is positioned at the live world brandmark anchor) and inflate
    // radially to their home positions as uCoverMorph rises 0 → 1. This is
    // what turns the SVG → particle transition from a renderer cross-fade
    // (the bug the user described: "PowerPoint dissolve") into a true
    // geometric MORPH: the mark visibly GROWS from the centre of the
    // crisp SVG it is replacing, rather than dust appearing as a parallel
    // cloud while the SVG fades. Eased with smoothstep over [0, COVER_FULL]
    // so the start is gentle. Mirrors the v7 silhouette painter
    // (brandmarkSilhouetteVertexShader → coverIn pattern) so both
    // brandmark systems share the same handoff grammar.
    //
    // At coverIn = 1 the XY silhouette is identical to the SVG paint
    // (dome-fill basis samples the same filled paths), so the SVG cut
    // under matched cover is invisible. The Z-axis is unaffected here —
    // uDepth below owns the flat → 3D extrude on a later, decoupled
    // clock so the morph sequences as: cover XY 0 → 1, then extrude Z
    // 0 → 1, both inside the substrate-wrap window.
    const float COVER_FULL = 0.6;
    float coverIn = smoothstep(0.0, COVER_FULL, uCoverMorph);
    pos.xy *= coverIn;
    vCoverMorph = coverIn;
    
    // ── WIND-BLOWN FLAT → WIREFRAME MORPH (ADR-023 2026-06-25 hybrid) ─────
    // The sim position pos is the matched-pixel seed at uDepth = 0 — a
    // crisp particle copy of the SVG silhouette at the exact screen rect
    // the SVG occupied the previous frame (matched-pixel handoff: the
    // SVG cuts to display:none in the same frame, so the eye sees no
    // swap). aTarget3D is each particle's destination on the volumetric
    // wireframe brandmark (sampled from /models/brandmark/brandmark.glb
    // via sampleBrandmark3D).
    //
    // Each particle has a deterministic stagger from seed + polar
    // position so they don't all leave at once. As uDepth rises, each
    // particle interpolates from its matched-pixel seed to its wireframe
    // home along a windswept arc: backward on local Z (camera-back, the
    // "blown into the distance" axis) with low-amplitude tangent + asym
    // XY drift peaking mid-flow. By uDepth = 1 every particle has
    // settled exactly on its wireframe home.
    //
    // The drift amplitudes are intentionally larger than the prior
    // async-flow revision (Z dip 0.30 + 0.20·staggerSeed vs prior 0.10
    // + 0.08·staggerSeed; flow window 0.55 vs prior 0.42) so the
    // recession actually reads as "blown deeper into the corridor"
    // rather than a small wobble. See ADR-023 Invariants 13–14.
    vec3 seedPos = pos;
    float radial = length(seedPos.xy);
    float angle = atan(seedPos.y, seedPos.x);
    float staggerSeed = fract(aLuma * 0.73 + sin(angle * 2.0) * 0.17 + radial * 0.31);
    float flowStart = mix(0.02, 0.45, staggerSeed);
    float flowEnd = min(1.0, flowStart + 0.55);
    float flowT = smoothstep(flowStart, flowEnd, uDepth);
    float flowBell = sin(flowT * 3.14159265);

    // Smoothstep T (eased) so the start holds at the matched-pixel seed
    // and the landing settles cleanly on aTarget3D — a linear mix here
    // would arrive abruptly at uDepth = 1.
    //
    // Flat-Z source: in the corridor (with targetHomes set) the sim is
    // seeded at matched-pixel positions whose Z is already 0, so this
    // is identity. In the lab fallback (no targetHomes set; aTarget3D
    // resolves to the sampled dome home), forcing Z=0 here recovers
    // the historical depth-ramp behaviour: pos.z = 0 at uDepth=0,
    // pos.z = homeZ at uDepth=1, so the depth slider still flattens
    // and extrudes the silhouette as it always did.
    vec3 flatSeed = vec3(seedPos.xy, 0.0);
    float landedT = flowT * flowT * (3.0 - 2.0 * flowT);
    pos = mix(flatSeed, aTarget3D, landedT);

    // Wind drift: low-frequency tangent orbit + asymmetric jitter peaking
    // at the flow midpoint and returning to 0 at both endpoints. Keeps
    // the matched-pixel rest pristine and the wireframe landing clean
    // while the morph midpoint feels organic.
    vec2 tangent = normalize(vec2(-seedPos.y, seedPos.x) + vec2(0.0001, 0.0001));
    float orbitDir = sign(sin(angle * 3.0 + aLuma * 6.28318));
    vec2 asym = vec2(
      sin(aLuma * 14.7 + angle * 1.5),
      cos(aLuma * 11.3 - angle * 1.1)
    );
    pos.xy += (tangent * orbitDir * 0.045 + asym * 0.018) * flowBell * (1.0 - uCleanField);
    // Wind blow — recede along local Z mid-flow, then settle. The
    // sign here drives toward LOCAL -Z (the brandmark group's "back",
    // which is away from the camera in the corridor's forward-facing
    // pose) so the user reads "blown into the distance".
    pos.z -= flowBell * (0.30 + 0.20 * staggerSeed) * (1.0 - uCleanField);
    
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
    // Cover-in size ramp so particles condense into focus rather than
    // appearing as full-size dots from frame one when they're clustered
    // at the rect centre. Identity at coverIn = 1, so the parked corridor
    // / sphere / centerpiece look is byte-identical. Mirrors the v7
    // silhouette painter's sizeRamp.
    float sizeRamp = 0.4 + 0.6 * coverIn;
    sizeMul *= sizeRamp;
    // Clean-field: collapse the per-particle size variance to a uniform,
    // FINE speck. With the denser count (3600, see BrandmarkPhysicsCore) the
    // Services centerpiece has enough points to read as a continuous,
    // evenly-spread field at a much smaller dot — so we shrink the dots here
    // rather than holding them near full size. Uniform + small is what turns
    // the sparse fat-bead ("Christmas lights") read into a fine, spread-out
    // particle field (vos9x.com centerpiece reference).
    sizeMul = mix(sizeMul, uCleanFieldDotScale, uCleanField);

    // ── Density rank-clip — both ends tunable (decoupled) ────────
    // keepFrac ramps uCorridorKeep (clean = 0, corridor) → uCleanFieldKeep
    // (clean = 1, parked centerpiece). aLuma is uniform in [0, 1), so keepFrac
    // is the surviving fraction; clipped particles collapse to zero point size
    // (they rasterise no fragments — the cheapest cull, no fragment discard).
    // This lets the corridor thin a LARGE global count back down (so it stays
    // calm) while the centerpiece draws densely from the same cloud — the
    // count is shared, the draw is not. The threshold slides with uCleanField,
    // so points thin in/out gradually across the shrink-in rather than popping.
    // uCorridorKeep defaults to 1.0 (no corridor thinning) for the lab + other
    // consumers. gl_Position is already written above, so the early return is
    // safe (same pattern as the v7 silhouette rank-clip).
    //
    // Corridor density tied to DEPTH (single-painter morph, 2026-06-24
    // debug-confirmed). The brandmark is the particle core END-TO-END — there
    // is no SVG to cover, so the FLAT resting mark (uDepth → 0) must read as a
    // SOLID, near-pixel-perfect silhouette: draw the FULL count. As the mark
    // gains depth and disperses into the substrate sphere (uDepth → 1) it
    // relaxes to the calm corridor budget (uCorridorKeep ≈ 0.27) so the
    // in-sphere core reads as luminous dust, not a solid plate. The runtime
    // logs proved the prior failure: a thinned (~1600) dim particle cloud
    // could never match the crisp SVG, so the SVG opacity-fade against it read
    // as a cross-dissolve. Full density at the flat mark is what lets the
    // particles BE the mark. Centerpiece end (uCleanField = 1) is unchanged.
    float depthKeep = mix(1.0, uCorridorKeep, smoothstep(0.0, 0.6, uDepth));
    float keepFrac = mix(depthKeep, uCleanFieldKeep, uCleanField);
    if (aLuma >= keepFrac) {
      gl_PointSize = 0.0;
      return;
    }
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
  uniform float uCleanField; // 0 = luminous dust, 1 = clean uniform field
  uniform float uCleanFieldEdge; // dot-falloff inner edge at clean = 1 (crispness)
  // ── Render-mode switch (lab; ADR-023 addendum) ───────────────
  // All fragment-only → plain precision, no vertex/fragment precision-match
  // constraint (Invariant 8). The defaults (uShape 0 = dot, additive blending
  // set on the material) keep the corridor + parked centerpiece byte-identical;
  // only the tuning lab overrides them to explore retro-futuristic looks.
  uniform int uShape;            // 0 dot · 1 dither · 2 voxel · 3 glyph · 4 dash · 5 cell · 6 bracket · 7 scan
  uniform int uGlyph;            // 0 plus · 1 cross · 2 square · 3 ring · 4 diamond · 5 asterisk
  uniform float uShapeStroke;    // glyph stroke half-width · voxel gap · shape weight
  uniform float uPrimitiveAspect; // dash / scan length:width ratio (1 = square, >1 = elongated)
  uniform float uLineJitter;      // perpendicular jitter on oriented primitives (0..1)
  // Independent "freeze motion" channel (fragment-only). 0 = animate the
  // per-particle pulse + brightness twinkle as normal; 1 = lock them at their
  // mean value so the cloud reads as a STATIC dither / raster / wire field
  // without changing colour, density, or dot scale. This is decoupled from
  // uCleanField so the corridor / centerpiece appearance is untouched — the
  // toggle exists for static-render looks (dither / cell / bracket) where the
  // animated pulse + sim micro-jitter looked "wobbly like liquid".
  uniform float uFreezeMotion;

  varying float vLuma;
  varying float vEdgeWeight;
  varying float vDepth;
  varying float vAngle;
  varying float vCoverMorph;    // [0, 1] cover-in factor — alpha gate during SVG → particle handoff
  
  float hashF(float n) {
    return fract(sin(n * 12.9898) * 43758.5453);
  }

  // ── Render-mode helpers ──────────────────────────────────────
  // Ordered 4×4 Bayer threshold, computed ARITHMETICALLY (the recursive
  // bayer2 → bayer4 construction) so there is NO dynamic array indexing —
  // a hard requirement under GLSL ES 1.00, which this material compiles as
  // even on a WebGL2 context. Returns a per-pixel threshold in [0, 1).
  float bayer2(vec2 a) {
    a = floor(a);
    return fract(a.x / 2.0 + a.y * a.y * 0.75);
  }
  float bayer4(vec2 a) {
    return bayer2(0.5 * a) * 0.25 + bayer2(a);
  }

  // Signed-distance helpers for the procedural glyph SDFs (all array-free).
  float sdBox(vec2 p, vec2 b) {
    vec2 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  }
  vec2 rot45(vec2 p) {
    float s = 0.70710678;
    return vec2(p.x * s - p.y * s, p.x * s + p.y * s);
  }
  // Rotate vec2 by an angle in radians.
  vec2 rotByAngle(vec2 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
  }

  // Procedural glyph mask over centred coord p in [-0.5, 0.5]. w is the
  // stroke half-width (uShapeStroke). Small smoothstep for a touch of AA so
  // the symbols read crisp but not jagged at small point sizes.
  float glyphMask(vec2 p, int g, float w) {
    float aa = 0.03;
    float sdf = 1.0;
    if (g == 0) {            // plus
      sdf = min(sdBox(p, vec2(0.45, w)), sdBox(p, vec2(w, 0.45)));
    } else if (g == 1) {     // cross / ×
      vec2 q = rot45(p);
      sdf = min(sdBox(q, vec2(0.45, w)), sdBox(q, vec2(w, 0.45)));
    } else if (g == 2) {     // square outline
      sdf = abs(sdBox(p, vec2(0.40))) - w;
    } else if (g == 3) {     // ring
      sdf = abs(length(p) - 0.38) - w;
    } else if (g == 4) {     // diamond outline
      vec2 q = rot45(p);
      sdf = abs(sdBox(q, vec2(0.34))) - w;
    } else {                 // asterisk (plus ∪ cross → 8 spokes)
      float a = min(sdBox(p, vec2(0.45, w * 0.8)), sdBox(p, vec2(w * 0.8, 0.45)));
      vec2 q = rot45(p);
      float b = min(sdBox(q, vec2(0.45, w * 0.8)), sdBox(q, vec2(w * 0.8, 0.45)));
      sdf = min(a, b);
    }
    return 1.0 - smoothstep(-aa, aa, sdf);
  }

  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c);

    // ── Per-particle coverage MASK by render mode ────────────────
    // The mask is the only thing the mode switch changes; it then feeds the
    // SAME color pipeline below (twinkle / depth / tint / pulse / glitch), so
    // every mode keeps the brandmark's palette + clean-field behaviour. The
    // default branch (uShape 0) is the original soft radial dot, byte-for-byte,
    // so the corridor + parked centerpiece are unchanged when nothing overrides
    // uShape. shade is a voxel-only bevel multiplier (1.0 in every other mode).
    float mask;
    float shade = 1.0;
    if (uShape == 1) {
      // DITHER — convert the soft radial coverage to a 1-bit stipple via an
      // ordered screen-space Bayer threshold. Each speck becomes a dithered
      // disc; overlapping specks read as a retro halftone field (best paired
      // with Normal blending so it doesn't bloom back into glow).
      float soft = 1.0 - smoothstep(0.0, 0.5, d);
      float thr = bayer4(gl_FragCoord.xy);
      mask = step(thr, soft);
    } else if (uShape == 2) {
      // VOXEL — hard square with a small gap + a diagonal quadrant bevel so
      // each speck reads as a lit cube face / LED cell.
      float gap = clamp(uShapeStroke, 0.02, 0.3);
      mask = step(max(abs(c.x), abs(c.y)), 0.5 - gap);
      shade = clamp(1.0 + (-c.x - c.y) * 0.6, 0.0, 1.8); // brighter toward top-left
    } else if (uShape == 3) {
      // GLYPH — procedural SDF symbol per particle (selected by uGlyph).
      mask = glyphMask(c, uGlyph, max(0.02, uShapeStroke));
    } else if (uShape == 4) {
      // DASH — oriented short stroke. Rotates c by -vAngle so the long axis
      // of the dash aligns with the local contour tangent (svg-outline /
      // model-wire). Width = uShapeStroke; length = width * uPrimitiveAspect
      // (clamped so the dash always fits the point sprite). Small AA band so
      // the strokes read crisp without looking jagged.
      vec2 q = rotByAngle(c, -vAngle);
      // Perpendicular jitter — moves the dash sideways inside the point
      // sprite by a small amount so neighbouring dashes don't perfectly
      // overlap into a continuous bar.
      q.y += (hashF(vLuma * 113.0) - 0.5) * uLineJitter * 0.6;
      float halfWid = clamp(uShapeStroke, 0.03, 0.25);
      float halfLen = clamp(halfWid * uPrimitiveAspect, halfWid, 0.48);
      float sdf = sdBox(q, vec2(halfLen, halfWid));
      float aa = 0.04;
      mask = 1.0 - smoothstep(-aa, aa, sdf);
    } else if (uShape == 5) {
      // CELL — hard outlined square. Stroke width = uShapeStroke; an LED /
      // pixel-grid feel. No bevel (it's a wireframe cell, not a lit face).
      float gap = clamp(uShapeStroke, 0.02, 0.25);
      float outer = step(max(abs(c.x), abs(c.y)), 0.45);
      float inner = step(max(abs(c.x), abs(c.y)), 0.45 - gap);
      mask = clamp(outer - inner, 0.0, 1.0);
    } else if (uShape == 6) {
      // BRACKET — corner registration mark (the HUD reticle motif). Two
      // short L-arms in the top-left corner of the sprite, then rotated
      // by vAngle so the brackets snap to the contour. Reads as a row of
      // tactical registration marks along the silhouette edge.
      vec2 q = rotByAngle(c, -vAngle);
      // Move origin to top-left so the L sits in one corner.
      q -= vec2(-0.35, 0.35);
      float armLen = 0.30;
      float armWid = clamp(uShapeStroke, 0.03, 0.18);
      float h = sdBox(q + vec2(armLen * 0.5, 0.0), vec2(armLen * 0.5, armWid));
      float v = sdBox(q + vec2(0.0, -armLen * 0.5), vec2(armWid, armLen * 0.5));
      float aa = 0.03;
      mask = 1.0 - smoothstep(-aa, aa, min(h, v));
    } else if (uShape == 7) {
      // SCAN — oriented scan slit + bright leading edge. Used to imply a
      // raster pass running along the contour. Long thin rectangle along
      // the tangent, with a bright "head" on the leading edge.
      vec2 q = rotByAngle(c, -vAngle);
      float halfWid = clamp(uShapeStroke * 0.5, 0.02, 0.15);
      float halfLen = clamp(halfWid * uPrimitiveAspect * 1.6, halfWid, 0.48);
      float slit = sdBox(q, vec2(halfLen, halfWid));
      float aa = 0.04;
      float body = 1.0 - smoothstep(-aa, aa, slit);
      // Leading-edge brightness: the +x end of the slit is hotter.
      float head = smoothstep(0.0, halfLen, q.x) * step(slit, 0.0);
      mask = clamp(body + head * 0.5, 0.0, 1.4);
    } else {
      // DOT (default) — original soft radial speck. Tighter at the parked
      // centerpiece via uCleanFieldEdge so the dense field stays crisp.
      float dotEdge0 = mix(0.30, uCleanFieldEdge, uCleanField);
      mask = 1.0 - smoothstep(dotEdge0, 0.50, d);
    }

    float alpha = mask;
    if (alpha < 0.005) discard;
    
    // Per-particle brightness variance. \`vLuma\` is the deterministic
    // PRNG seed in [0, 1). Mapping through [0.55, 1.0] gives the
    // cloud a fireflies-in-fog quality — every particle reads, but
    // the brighter ones catch the light hotter so the silhouette
    // doesn't paint as a uniform field.
    // Clean-field flattens the per-particle brightness variance to a
    // uniform value — this is the main fix for the "Christmas lights" read.
    // uFreezeMotion is a SECOND, decoupled "stillness" channel that flattens
    // the twinkle without dragging the rest of the centerpiece treatment with
    // it (so a dither / raster look stays animated in colour but static in
    // brightness). max() means EITHER channel can request stillness.
    float stillness = max(uCleanField, uFreezeMotion);
    float twinkle = mix(0.55 + 0.45 * vLuma, 1.0, stillness);
    alpha *= twinkle;
    
    // Atmospheric depth dim. The brandmark's Z range is small but
    // perceptible — the dome bulges to ~+0.18 at the centre and
    // back-jitter pulls some particles to ~-0.06. Mapping that to
    // a [0.7, 1.0] brightness factor gives genuine volumetric
    // depth (front-of-dome particles catch the light, back-jitter
    // particles recede) without crushing the back layer into
    // invisibility.
    float depthFactor = 0.70 + 0.30 * smoothstep(-0.06, 0.18, vDepth);
    // Clean-field lifts the dim toward full, uniform brightness (the mark
    // is flat at the centerpiece, so there is no depth to convey there).
    depthFactor = mix(depthFactor, 1.0, uCleanField);

    // Tint blend. Edge particles (high \`vEdgeWeight\`, near the
    // silhouette extremes) trend toward the rim accent. Mix amount
    // is conservative so the body stays anchored in the gold body
    // tone — only the limb hints toward dawn.
    vec3 color = mix(uColor, uAccentColor, vEdgeWeight * 0.55);
    // Clean-field pulls the rim-accent variance back toward the uniform
    // body gold so the field reads as one even tone (stays on-brand —
    // blends with the gold sphere rather than going monochrome/cool).
    color = mix(color, uColor, uCleanField * 0.7);
    color *= depthFactor;
    color *= shade; // voxel bevel (1.0 in every other mode)
    
    // Per-particle pulse with seed-varied phase AND frequency so
    // the cloud flickers organically rather than breathing as one
    // synchronised mass. Frequency varies in [0.6, 2.0] Hz; ±10%
    // brightness amplitude is enough to register as life without
    // looking like the cloud is strobing.
    float pulseFreq = 0.6 + vLuma * 1.4;
    float pulse = sin(uTime * pulseFreq + vLuma * 6.28) * 0.10 + 0.90;
    // Clean-field stills the per-particle flicker so the centerpiece reads
    // calm and steady (the breathing is corridor-only character). The
    // uFreezeMotion channel (max() with uCleanField above) also stills the
    // pulse independently so a corridor-look dither / raster preset can run
    // without the "wobble like liquid" the animated pulse produces on hard
    // pixel cells.
    pulse = mix(pulse, 1.0, stillness);
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
    
    // Cover-in alpha gate (ADR-023 morph rev.). vCoverMorph is the
    // vertex-stage smoothstep over uCoverMorph, identical to v7's
    // silhouette painter. Replaces the actor's previous separate
    // opacity-reveal envelope: the actor now writes uOpacity at full
    // corridor brightness across the entire wrap window and the cover-in
    // owns the visibility ramp. At coverIn = 1 (post-cut and beyond) the
    // multiplier is identity, so the parked corridor / sphere /
    // centerpiece look is byte-identical.
    gl_FragColor = vec4(color, alpha * uOpacity * vCoverMorph);
  }
`;
