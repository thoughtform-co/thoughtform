/**
 * GLSL for the voxel media blocks, as TS template literals (repo
 * convention — no `.glsl` loader; mirrors `celestialMaterials.ts`).
 *
 * Technique faithful to rogierdeboeve.com:
 *   - vertex: per-instance Z displacement from a scrolling perlin texture,
 *     a center-out reveal fade, and a scale-compression "glitch" as each
 *     cube pushes out.
 *   - fragment: flat media colour per cube (one cube = one image cell),
 *     directional + ambient + Fresnel-rim lighting, exponential depth fog,
 *     and noise dithering to kill banding.
 *
 * `position`, `normal`, `instanceMatrix`, `modelViewMatrix`,
 * `projectionMatrix`, `normalMatrix` are auto-declared by three for a
 * ShaderMaterial on an InstancedMesh — we only declare `aUv` + our own
 * uniforms/varyings.
 */

export const voxelVertexShader = /* glsl */ `
  attribute vec2 aUv;            // per-instance cell-center UV into the media

  uniform float uTime;
  uniform float uReveal;         // 0..1, animated as the block enters
  uniform float uHover;          // 0..1, extra energy on hover
  uniform sampler2D tNoise;
  uniform float uDisplaceHeight;
  uniform float uNoiseSpeed;
  uniform float uNoiseScale;
  uniform float uGlitch;

  varying vec2 vUv;
  varying vec3 vNormalView;
  varying vec3 vViewPos;
  varying float vDisp;

  void main() {
    vUv = aUv;

    // scrolling tiling perlin → per-cube height
    vec2 nUv = aUv * uNoiseScale - uTime * uNoiseSpeed;
    float noise = texture2D(tNoise, nUv).r;     // 0..1
    float centered = noise - 0.5;               // -0.5..0.5

    // reveal from the center outward (reference fades by dist-to-center)
    float dist = length(aUv - 0.5) * 2.0;       // ~0 center .. ~1.4 corner
    float reveal = clamp(uReveal * 1.6 - dist * uReveal, 0.0, 1.0);

    float energy = clamp(reveal + uHover, 0.0, 1.0);
    float disp = centered * uDisplaceHeight * (reveal + uHover * 0.4);
    vDisp = disp;

    // scale-compression glitch + collapse hidden cubes so they "assemble"
    float scale = clamp(1.0 - abs(centered) * uGlitch, 0.35, 1.0);
    scale *= mix(0.12, 1.0, energy);

    vec3 local = position * scale;

    // place at instance cell (translate + non-uniform cell scale), push along Z
    vec4 worldish = instanceMatrix * vec4(local, 1.0);
    worldish.z += disp;

    vec4 mvPosition = modelViewMatrix * worldish;
    vViewPos = mvPosition.xyz;
    vNormalView = normalize(normalMatrix * normal);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const voxelFragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D tMedia;
  uniform sampler2D tDither;
  uniform vec3 uLightDir;        // view-space directional light
  uniform vec3 uLightColor;
  uniform vec3 uAmbient;
  uniform vec3 uRimColor;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uFogStart;       // distance before fog begins (keeps blocks crisp)
  uniform float uEmissive;       // self-illumination so dark media stays legible
  uniform float uOpacity;

  varying vec2 vUv;
  varying vec3 vNormalView;
  varying vec3 vViewPos;
  varying float vDisp;

  void main() {
    vec3 N = normalize(vNormalView);
    vec3 V = normalize(-vViewPos);
    vec3 L = normalize(uLightDir);

    vec3 albedo = texture2D(tMedia, vUv).rgb;

    float diff = max(dot(N, L), 0.0);
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);

    // media reads even unlit (dark source images stay legible), plus shading
    vec3 color = albedo * (uEmissive + uAmbient + uLightColor * diff);
    color += uRimColor * fres * 0.5;                  // ember rim
    color += uRimColor * max(vDisp, 0.0) * 0.35;      // glow on raised cubes

    // exponential fog measured from a start distance, so the block plane stays
    // crisp and only the deeper background falls to ember
    float depth = length(vViewPos);
    float fogFactor = clamp(1.0 - exp(-uFogDensity * max(0.0, depth - uFogStart)), 0.0, 0.85);
    color = mix(color, uFogColor, fogFactor);

    // dither (break up fog banding)
    float d = texture2D(tDither, gl_FragCoord.xy / 64.0).r - 0.5;
    color += d / 255.0 * 2.0;

    gl_FragColor = vec4(color, uOpacity);
  }
`;

/** Warm animated background haze — a big plane behind the blocks. */
export const hazeVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const hazeFragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform sampler2D tNoise;
  uniform vec3 uColorA;          // deep ember
  uniform vec3 uColorB;          // warm haze highlight
  varying vec2 vUv;

  void main() {
    // two drifting perlin samples → soft rolling fog
    float n1 = texture2D(tNoise, vUv * 1.5 + vec2(uTime * 0.012, uTime * 0.006)).r;
    float n2 = texture2D(tNoise, vUv * 0.7 - vec2(uTime * 0.008, uTime * 0.015)).r;
    float h = clamp(n1 * 0.6 + n2 * 0.6, 0.0, 1.0);

    // radial vignette so the center glows, edges fall to ember
    float vig = smoothstep(1.1, 0.2, length(vUv - 0.5) * 1.6);
    vec3 color = mix(uColorA, uColorB, h * vig);
    gl_FragColor = vec4(color, 1.0);
  }
`;
