/**
 * Shaders for the VOLUMETRIC brandmark hologram (the real 3D mesh sampled by
 * `sampleBrandmark3D`).
 *
 * Every particle carries a model-space normal, so the fragment shader can
 * apply a Fresnel facing term. This is what
 * turns "a glowing cloud" into "a hologram":
 *
 *   - WIRE points (part 0/1) — the structural edges. Always bright, drawn as
 *     tangent-aligned scan/dash sprites (the retrofuturistic vector read).
 *   - SURFACE points (part 3) — sparse fill. Front-facing (cap) points fade
 *     toward nothing; only grazing/rim points brighten. This both kills the
 *     additive-blob failure mode (caps no longer saturate) and reads as a
 *     translucent volume you can see THROUGH.
 *   - SHELL points (part 2) — faint round dust.
 *
 * `normalMatrix` and `modelViewMatrix` are injected automatically by THREE for
 * ShaderMaterial, so the facing term is computed in view space and stays
 * correct as the mark turns.
 */

export const volumetricVertexShader = /* glsl */ `
  uniform float uFlyIn;       // 0 = flat silhouette, 1 = full 3D mesh
  uniform mediump float uTime; // mediump: MUST match the fragment (shared uniform → link error otherwise)
  uniform float uPointSize;   // base size in CSS px
  uniform float uPixelRatio;
  uniform float uDensity;     // 0..1 rank-clip threshold (shell thins first)
  uniform float uFocal;       // perspective size factor (camera distance)
  uniform float uScale;       // world scale of the artifact
  uniform float uTransform;   // 0 = dome blob, 1 = assembled wireframe (scroll morph)
  uniform float uEntropy;     // 0 = settled, >0 = dusty dispersion along normals
  uniform mediump float uGlitch; // 0 = clean, >0 = jitter + tears; mediump to match the fragment

  attribute vec3 aFlatHome;
  attribute vec3 aArmHome;
  attribute vec3 aDomeHome;
  attribute vec3 aNormal;
  attribute float aSeed;
  attribute float aPart;      // 0 wire, 1 scan accent, 2 shell, 3 surface
  attribute float aEdge;
  attribute float aAngle;

  varying float vEdge;
  varying float vSeed;
  varying float vViewDepth;
  varying float vPart;
  varying float vViewY;
  varying float vAngle;
  varying float vFacing;      // |n · viewDir| : 1 = facing camera, 0 = edge-on

  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    vEdge = aEdge;
    vSeed = aSeed;
    vPart = aPart;
    vAngle = aAngle;

    // Per-particle stagger so morphs read as a reorganising swarm, not a rigid
    // lerp (particles arrive at their targets at slightly different times).
    float stagger = aSeed * 0.22;
    float localFly = clamp((uFlyIn - stagger) / (1.0 - 0.22), 0.0, 1.0);
    float tFly = localFly * localFly * localFly * (localFly * (localFly * 6.0 - 15.0) + 10.0);
    vec3 wirePos = mix(aFlatHome, aArmHome, tFly);

    // Scroll transformation: migrate from the dome blob onto the wireframe.
    float localTr = clamp((uTransform - stagger) / (1.0 - 0.22), 0.0, 1.0);
    float tTr = localTr * localTr * localTr * (localTr * (localTr * 6.0 - 15.0) + 10.0);
    vec3 pos = mix(aDomeHome, wirePos, tTr);

    // Dusty dispersion that settles to 0 (holographic haze → crisp wireframe).
    pos += aNormal * (uEntropy * 0.35 * (0.5 + 0.5 * aSeed));

    // Glitch / latent-space resolve: stepped (quantised-in-time) digital jitter
    // + horizontal "datamosh" band tears. Peaks mid-morph (uGlitch), 0 parked.
    if (uGlitch > 0.001) {
      float tq = floor(uTime * 11.0); // stepped clock → jumps, not smooth drift
      vec3 j = vec3(
        hash(aSeed * 1.7 + tq),
        hash(aSeed * 2.3 + tq * 1.31),
        hash(aSeed * 3.1 + tq * 0.77)
      ) - 0.5;
      pos += j * uGlitch * 0.45;
      float band = step(0.55, fract(pos.y * 2.5 + tq * 0.27));
      pos.x += band * (hash(tq + aPart) - 0.5) * uGlitch * 0.6; // band tear / shear
    }
    pos *= uScale;

    // Shell thins first as density drops; structure (wire/surface) holds.
    float keep = (aPart > 1.5 && aPart < 2.5) ? uDensity : mix(uDensity, 1.0, 0.72);
    if (aSeed > keep) {
      gl_PointSize = 0.0;
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      return;
    }

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vViewDepth = -mv.z;
    vViewY = mv.y;

    vec3 nView = normalize(normalMatrix * aNormal);
    vec3 viewDir = normalize(-mv.xyz);
    vFacing = abs(dot(nView, viewDir));

    gl_Position = projectionMatrix * mv;

    float partBoost = (aPart > 1.5 && aPart < 2.5) ? 0.72 : 1.2;
    float sizeEdge = mix(0.8, 1.3, aEdge) * partBoost;
    float persp = uFocal / max(0.25, -mv.z);
    gl_PointSize = uPointSize * uPixelRatio * sizeEdge * persp;
  }
`;

export const volumetricFragmentShader = /* glsl */ `
  precision mediump float;

  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform float uOpacity;
  uniform mediump float uTime; // mediump: MUST match the vertex (shared uniform → link error otherwise)
  uniform float uNear;
  uniform float uFar;
  uniform float uScan;
  uniform float uScanWidth;
  uniform float uScanGain;
  uniform float uPrimitiveAspect;
  uniform mediump float uGlitch;

  varying float vEdge;
  varying float vSeed;
  varying float vViewDepth;
  varying float vPart;
  varying float vViewY;
  varying float vAngle;
  varying float vFacing;

  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  float strokeMask(vec2 p, float halfWidth) {
    float body = 1.0 - smoothstep(halfWidth, halfWidth + 0.035, abs(p.y));
    float caps = 1.0 - smoothstep(0.38, 0.5, abs(p.x));
    return body * caps;
  }

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);

    // Oriented frame for dash/scan sprites (wire) — rotate point-coord by tangent.
    float si = sin(vAngle);
    float co = cos(vAngle);
    vec2 r = vec2(c.x * co - c.y * si, c.x * si + c.y * co);
    r.y *= uPrimitiveAspect;

    float dotMask = 1.0 - smoothstep(0.16, 0.5, d);
    float softDot = 1.0 - smoothstep(0.0, 0.5, d);
    float dash = strokeMask(r, 0.095);
    float hairline = strokeMask(r, 0.035);

    bool isShell = (vPart > 1.5 && vPart < 2.5);
    bool isSurface = (vPart > 2.5);

    float mask;
    if (isShell) {
      mask = dotMask;
    } else if (isSurface) {
      mask = softDot;
    } else {
      mask = max(dash, hairline * step(0.5, vPart)); // wire / scan accent
    }
    if (mask < 0.01) discard;

    // View-depth dim so the far side of the volume recedes.
    float dn = clamp((vViewDepth - uNear) / max(0.001, (uFar - uNear)), 0.0, 1.0);
    float depthDim = mix(1.0, 0.42, dn);

    float pulse = sin(uTime * (0.45 + vSeed * 0.9) + vSeed * 6.2831) * 0.045 + 0.955;
    float tw = (0.76 + 0.24 * vSeed) * pulse;

    vec3 col = mix(uColor, uAccent, vEdge * 0.5) * depthDim;

    // Per-part alpha. Surface points get a Fresnel rim: front-facing caps fade
    // out (anti-blob + see-through volume), grazing rims glow.
    float partAlpha;
    if (isShell) {
      partAlpha = 0.24;
    } else if (isSurface) {
      float fres = pow(1.0 - vFacing, 1.6);  // 0 facing → 1 at the rim
      partAlpha = mix(0.04, 0.46, fres);
      col = mix(col, uAccent, fres * 0.5);   // rims tint toward dawn
    } else {
      partAlpha = mix(0.74, 1.0, vEdge);
    }

    float a = mask * uOpacity * depthDim * tw * partAlpha;

    // Radar scan sweep.
    float scan = smoothstep(uScanWidth, 0.0, abs(vViewY - uScan));
    col += uAccent * scan * uScanGain;
    a += scan * uScanGain * 0.12 * mask;

    // Data-stream flicker during the morph: some specks drop/strobe on a
    // stepped clock, with occasional bright accent pops. 0 = parked (no-op).
    if (uGlitch > 0.001) {
      float fl = hash(vSeed * 5.0 + floor(uTime * 14.0));
      a *= mix(1.0, 0.25 + 0.75 * fl, uGlitch);
      col += uAccent * step(0.88, fl) * uGlitch * 0.6;
    }

    gl_FragColor = vec4(col, a);
  }
`;
