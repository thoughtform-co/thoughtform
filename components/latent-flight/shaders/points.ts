/**
 * Point shaders — the stars and the foreground dust.
 *
 * The house point recipe (StaticStarfield / holoDustShader): a core plus a
 * HALVED halo, size in CSS px × the renderer's real pixel ratio (synced
 * every frame — never `window.devicePixelRatio`), a low base alpha, an early
 * discard, additive blending with no depth write. No `.glsl` files: three
 * consumes template literals, and a loader would be a build-config change
 * this branch does not make.
 */

export const starVertex = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
uniform float uTime;
uniform float uTwinkle;
attribute float aMag;
attribute float aPhase;
varying float vMag;
varying float vTw;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float size = uPointSize * mix(0.7, 1.9, aMag);
  float tw = 1.0;
  if (aMag > 0.6) {
    tw = 1.0 + uTwinkle * 0.12 * sin(uTime * (0.7 + aPhase * 1.4) + aPhase * 6.2831853);
  }
  gl_PointSize = max(1.0, size * uPixelRatio * tw);
  vMag = aMag;
  vTw = tw;
}
`;

export const starFragment = /* glsl */ `
uniform vec3 uSoft;
uniform vec3 uDawn;
uniform vec3 uHot;
uniform float uOpacity;
varying float vMag;
varying float vTw;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float core = smoothstep(0.10, 0.0, d);
  float halo = smoothstep(0.5, 0.12, d);
  float soft = max(core, halo * 0.5);
  vec3 col = mix(uSoft, uDawn, smoothstep(0.2, 0.7, vMag));
  col = mix(col, uHot, smoothstep(0.85, 1.0, vMag));
  float a = soft * (0.5 + 0.5 * vMag) * vTw * uOpacity;
  if (a < 0.012) discard;
  gl_FragColor = vec4(col, a);
}
`;

/**
 * Foreground dust: camera-relative wrap on the point's OWN phase (the time
 * tunnel's law — offsetting by the camera before wrapping freezes the field),
 * a shallow near clip so a mote passing the lens dies before it explodes,
 * and a far fade well inside the span.
 */
export const dustVertex = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
uniform float uCamZ;
uniform float uSpan;
uniform float uVelocity;
attribute float aSeed;
varying float vFade;
void main() {
  vec3 p = position;
  float rel = mod(uCamZ - p.z, uSpan);
  float z = uCamZ - rel;
  vec4 mv = modelViewMatrix * vec4(p.x, p.y, z, 1.0);
  float dist = -mv.z;
  float near = smoothstep(0.6, 3.0, dist);
  float far = 1.0 - smoothstep(uSpan * 0.5, uSpan * 0.72, dist);
  float vel = 1.0 + clamp(uVelocity, 0.0, 2.0) * 0.45;
  vFade = near * far * (0.6 + 0.4 * aSeed) * vel;
  float depthScale = clamp(6.0 / max(dist, 1.0), 0.5, 1.4);
  gl_PointSize = max(1.0, uPointSize * uPixelRatio * mix(1.0, 2.0, aSeed) * depthScale);
  gl_Position = projectionMatrix * mv;
}
`;

export const dustFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vFade;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float core = smoothstep(0.10, 0.0, d);
  float halo = smoothstep(0.5, 0.12, d);
  float soft = max(core, halo * 0.5);
  float a = soft * 0.25 * vFade * uOpacity;
  if (a < 0.008) discard;
  gl_FragColor = vec4(uColor, a);
}
`;
