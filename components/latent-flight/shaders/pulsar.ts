/**
 * The neutron star's shaders — corona, equatorial disc, jets and beams (one
 * cone program), the hairlines (field lines, disc rings, the spin axis) and
 * the screen-space flash.
 *
 * Every emitter is additive over void and its colour is a palette uniform,
 * never a literal; the DRAWING carries the object (hairlines at dawn .22–.28)
 * and the glow is secondary. Gold appears in exactly one place: the beam and
 * corona tint while `uCross` is up, plus the flash — the scene's one signal.
 */

export const coronaVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const coronaFragment = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uGoldLit;
uniform float uGain;
uniform float uTint;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  vec2 p = vUv - 0.5;
  float d = length(p) * 2.0;
  float a = 0.35 * pow(max(0.0, 1.0 - d), 3.0) * uGain * uOpacity;
  if (a < 0.003) discard;
  gl_FragColor = vec4(mix(uColor, uGoldLit, uTint), a);
}
`;

/** The disc: a Keplerian, differentially rotating heat field on an annulus.
 *  The angular coordinate is wrapped to an INTEGER number of texture repeats
 *  so the seam at ±π never shows. */
export const discVertex = /* glsl */ `
varying vec2 vP;
void main() {
  vP = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const discFragment = /* glsl */ `
uniform sampler2D uNoise;
uniform vec3 uDawn;
uniform vec3 uHot;
uniform float uRin;
uniform float uRout;
uniform float uTime;
uniform float uSpin;
uniform float uOpacity;
varying vec2 vP;
void main() {
  float r = length(vP);
  float ang = atan(vP.y, vP.x);
  float ring = smoothstep(uRin, uRin + 0.25, r) * (1.0 - smoothstep(uRout - 0.6, uRout, r));
  float omega = uSpin * pow(max(r, uRin) / uRin, -1.5);
  float turn = (ang - uTime * omega) / 6.2831853;
  float f = texture2D(uNoise, vec2(fract(turn) * 3.0, r * 0.35)).r * 0.65
          + texture2D(uNoise, vec2(fract(turn * 1.0 + 0.29) * 5.0, r * 0.7 + 0.29)).r * 0.35;
  float heat = (1.0 - smoothstep(uRin, uRin + 0.5, r)) * f;
  vec3 col = mix(uDawn, uHot, smoothstep(0.55, 1.0, heat));
  float a = ring * (0.08 + 0.42 * f) * uOpacity;
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
}
`;

/** One open-cone program for the jets (short, on the spin axis) and the
 *  beams (long, on the magnetic axis). Brightest at the silhouette, so a
 *  cone reads as streaming gas rather than a solid tube. */
export const coneVertex = /* glsl */ `
uniform float uLen;
varying float vT;
varying float vAng;
varying float vEdge;
void main() {
  vT = clamp(position.y / uLen, 0.0, 1.0);
  vAng = atan(position.z, position.x) / 6.2831853 + 0.5;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 n = normalize(normalMatrix * normal);
  vec3 v = normalize(-mv.xyz);
  vEdge = 1.0 - abs(dot(n, v));
  gl_Position = projectionMatrix * mv;
}
`;

export const coneFragment = /* glsl */ `
uniform sampler2D uNoise;
uniform vec3 uColor;
uniform vec3 uGoldLit;
uniform float uTime;
uniform float uOpacity;
uniform float uCross;
uniform float uTurb;
uniform float uFall;
varying float vT;
varying float vAng;
varying float vEdge;
void main() {
  float falloff = pow(1.0 - vT, uFall);
  float turb = 1.0 - uTurb + uTurb * texture2D(uNoise, vec2(vAng * 2.0, vT * 3.0 - uTime * 0.4)).r;
  float edge = 0.35 + 0.65 * pow(vEdge, 0.7);
  vec3 col = mix(uColor, uGoldLit, uCross * 0.5);
  float a = falloff * turb * edge * uOpacity * (1.0 + 1.4 * uCross);
  if (a < 0.003) discard;
  gl_FragColor = vec4(col, a);
}
`;

/** Hairlines with a depth fade: the far hemisphere of the field-line cage
 *  recedes to ×0.42 so the drawing has a front and a back. */
export const lineVertex = /* glsl */ `
uniform float uNear;
uniform float uFar;
varying float vFade;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vFade = mix(1.0, 0.42, smoothstep(uNear, uFar, -mv.z));
  gl_Position = projectionMatrix * mv;
}
`;

export const lineFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vFade;
void main() {
  float a = uOpacity * vFade;
  if (a < 0.002) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

/** The flash: a screen-space additive quad, gold, alpha `0.04 × crossing`. */
export const flashVertex = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}
`;

export const flashFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
void main() {
  if (uAlpha < 0.001) discard;
  gl_FragColor = vec4(uColor, uAlpha);
}
`;
