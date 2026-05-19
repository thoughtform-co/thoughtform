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
  float edge = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
  float fill = step(vAlong, uProgress);
  float head = smoothstep(uProgress - 0.06, uProgress, vAlong);
  float alpha = uOpacity * fill * (0.55 + edge * 0.35 + head * uGlow);
  if (alpha < 0.02) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;
