/** Per-body atmosphere point sprites (ADR-016). */
export const atmosphereParticleVertex = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
uniform float uTime;

attribute float aSeed;
attribute float aShell;

varying float vAlpha;

void main() {
  vec3 pos = position;
  float drift = sin(aSeed * 6.283 + uTime * 0.35) * 0.02 * aShell;
  pos.xy += vec2(cos(aSeed * 12.0), sin(aSeed * 9.0)) * drift;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  float dist = length(mv.xyz);
  vAlpha = smoothstep(0.15, 0.85, aShell) * (0.35 + 0.65 * smoothstep(2.5, 0.8, dist));
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPointSize * uPixelRatio * (1.0 + aShell * 0.6);
}
`;

export const atmosphereParticleFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;

varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float soft = smoothstep(0.5, 0.0, d);
  float alpha = soft * vAlpha * uOpacity;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;
