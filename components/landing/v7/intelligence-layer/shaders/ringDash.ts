/** Progress-driven dash along tube ring circumference (ADR-016). */
export const ringDashVertex = /* glsl */ `
attribute float aAlong;
varying float vAlong;
varying vec3 vNormal;

void main() {
  vAlong = aAlong;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const ringDashFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uProgress;
uniform float uGlow;

varying float vAlong;
varying vec3 vNormal;

void main() {
  // Edge bias so the rim of the tube reads as a hairline.
  float edge = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
  // Always-on base ring so the orbit is visible even at progress 0;
  // progress-driven fill brightens the leading arc to highlight the
  // scroll handoff.
  float baseAlpha = 0.55 * (0.55 + edge * 0.4);
  float fill = step(vAlong, uProgress);
  float head = smoothstep(uProgress - 0.08, uProgress, vAlong);
  float fillAlpha = fill * (0.35 + head * uGlow);
  float alpha = uOpacity * clamp(baseAlpha + fillAlpha, 0.0, 1.0);
  if (alpha < 0.015) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;
