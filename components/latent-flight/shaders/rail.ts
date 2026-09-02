/**
 * Rail lattice shaders — hairlines with a near clip, a far fog and one gold
 * rung.
 *
 * The lattice is world-fixed geometry the camera flies through, so every
 * fade is a function of view-space distance: strings inside the glass
 * (closer than the chrome's depth) clip away before they can cross the
 * frame, and the far end dissolves before the strings converge into a
 * starburst at the vanishing point. `aRank` carries the tick's weight
 * (majors full, minors 0.55 — the ladder's own hierarchy); `aArc` is the
 * vertex's arc length along the course so ONE rung — the one at the glass,
 * just ahead of the vessel — can go gold without touching the geometry.
 */

export const railVertex = /* glsl */ `
attribute float aRank;
attribute float aArc;
uniform float uShipArc;
uniform float uGlass;
uniform float uSpan;
uniform float uVelocity;
uniform float uGoldable;
varying float vFade;
varying float vGold;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = -mv.z;
  float near = smoothstep(0.25, 1.6, dist);
  // The far fog starts early: the corridor is crisp where it meets the
  // chrome and a glimpse by the first bend, never a sheet of 26 lines
  // folding around a corner in full view.
  float far = 1.0 - smoothstep(uSpan * 0.15, uSpan * 0.42, dist);
  float vel = 1.0 + clamp(uVelocity, 0.0, 2.0) * 0.35;
  vFade = near * far * (0.55 + 0.45 * aRank) * vel;
  vGold = uGoldable * (1.0 - smoothstep(0.0, 1.2, abs(aArc - (uShipArc + uGlass))));
  gl_Position = projectionMatrix * mv;
}
`;

export const railFragment = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uGold;
uniform float uOpacity;
varying float vFade;
varying float vGold;
void main() {
  float a = vFade * uOpacity * (1.0 + vGold);
  if (a < 0.004) discard;
  gl_FragColor = vec4(mix(uColor, uGold, vGold), min(a, 1.0));
}
`;
