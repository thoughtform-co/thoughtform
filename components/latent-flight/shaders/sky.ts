/**
 * Sky shaders — the dust band and the latent-space haze, both painted on
 * BackSide spheres welded to the camera (a sky, not a place).
 *
 * The noise is TRIPLANAR over the view direction: three taps of the shared
 * 2D field blended by the direction's components, so there is no polar
 * seam and no centre — the haze is a field, never a mandala around the star
 * or the vanishing point. Every alpha ramp below .06 is dithered with the
 * texture-independent hash so it never bands; that is the dither the post
 * chain does NOT carry as a grain pass.
 */

const TRIPLANAR = /* glsl */ `
float tri(sampler2D t, vec3 n, float s, vec2 o) {
  vec3 w = abs(n);
  w /= (w.x + w.y + w.z + 1e-5);
  return texture2D(t, n.yz * s + o).r * w.x
       + texture2D(t, n.zx * s + o).r * w.y
       + texture2D(t, n.xy * s + o).r * w.z;
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`;

export const skyVertex = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/** A faint warm band across the sky, tilted off the flight axis, with dark
 *  lanes carved through it. Peak alpha `uAlpha` (.06). */
export const bandFragment = /* glsl */ `
uniform sampler2D uNoise;
uniform vec3 uDawn;
uniform vec3 uBandUp;
uniform float uAlpha;
uniform float uDrift;
varying vec3 vDir;
${TRIPLANAR}
void main() {
  vec3 n = normalize(vDir);
  float lat = asin(clamp(dot(n, uBandUp), -1.0, 1.0));
  float band = exp(-pow(lat / 0.34, 2.0));
  float f = tri(uNoise, n, 0.9, vec2(uDrift)) * 0.6 + tri(uNoise, n, 2.6, vec2(0.37)) * 0.4;
  float lanes = 1.0 - 0.55 * smoothstep(0.58, 0.78, tri(uNoise, n, 1.5, vec2(0.61)));
  float a = band * (0.3 + 0.7 * f) * lanes * uAlpha;
  a += (hash12(gl_FragCoord.xy) - 0.5) / 255.0;
  gl_FragColor = vec4(uDawn, max(a, 0.0));
}
`;

/** The isoline haze: nine contours of a slowly drifting probability field,
 *  hairline-constant in screen space, every fourth a touch brighter (the
 *  ladder's own major/minor cadence). */
export const hazeFragment = /* glsl */ `
uniform sampler2D uNoise;
uniform vec3 uDawn;
uniform float uAlpha;
uniform float uDrift;
varying vec3 vDir;
${TRIPLANAR}
void main() {
  vec3 n = normalize(vDir);
  float f = tri(uNoise, n, 0.55, vec2(uDrift, -uDrift * 0.7)) * 0.7
          + tri(uNoise, n, 1.3, vec2(0.21 + uDrift * 0.5, 0.0)) * 0.3;
  float k = f * 9.0;
  float iso = abs(fract(k) - 0.5);
  float w = max(fwidth(k) * 1.4, 0.002);
  float line = 1.0 - smoothstep(0.0, w, iso);
  float major = step(mod(floor(k), 4.0), 0.5);
  float a = line * mix(0.035, 0.06, major) + f * 0.008;
  a += (hash12(gl_FragCoord.xy) - 0.5) / 255.0;
  gl_FragColor = vec4(uDawn, max(a, 0.0) * uAlpha);
}
`;
