/** Comet-stream sprites — bright head, sparse tail (ADR-016). */
export const cometParticleVertex = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;

attribute float aBrightness;
attribute float aSize;

varying float vAlpha;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vAlpha = aBrightness;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPointSize * uPixelRatio * aSize;
}
`;

export const cometParticleFragment = /* glsl */ `
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
