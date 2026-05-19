/** Fibonacci-sphere particle cloud — soft point sprites with a rim-glow
 *  bias so the silhouette of each body reads through luminous dust
 *  rather than a faceted icosphere. */
export const sphereCloudVertex = /* glsl */ `
uniform float uTime;
uniform float uPointSize;
uniform float uPixelRatio;
uniform float uPresence;

attribute float aSeed;
attribute vec3 aNormal;

varying float vRim;
varying float vAlpha;
varying float vSeed;

void main() {
  vec3 pos = position;
  // Slow radial drift along the surface normal — particles breathe in/out
  // of the shell so the body never reads as a static lattice.
  float breath = sin(aSeed * 6.2831 + uTime * 0.45) * 0.012;
  float ripple = sin(aSeed * 17.0 + uTime * 0.9) * 0.006;
  pos += aNormal * (breath + ripple * (0.4 + aSeed * 0.6));

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);

  // Rim factor: 1 at silhouette (normal perpendicular to view), 0 at pole
  // facing camera. Used to TINT the rim brighter, not to gate visibility.
  vec3 viewN = normalize(normalMatrix * aNormal);
  float facing = clamp(abs(viewN.z), 0.0, 1.0);
  float rim = pow(1.0 - facing, 1.0);
  vRim = rim;
  vSeed = aSeed;

  // Cull only points facing AWAY from the camera (back hemisphere) on a
  // soft curve — keeps the front hemisphere dense so the body reads as
  // a luminous planet, not a silhouette. viewN.z > 0 means the normal
  // points toward the camera (front-facing); < 0 means back-facing.
  float frontness = smoothstep(-0.45, 0.15, viewN.z);
  vAlpha = (0.55 + frontness * 0.45 + rim * 0.35) * uPresence;

  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPointSize * uPixelRatio * (0.85 + rim * 0.45 + frontness * 0.2);
}
`;

export const sphereCloudFragment = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uRimColor;
uniform float uOpacity;

varying float vRim;
varying float vAlpha;
varying float vSeed;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  // Soft radial falloff with a slightly brighter core for the
  // "gateway-particle" register.
  float soft = smoothstep(0.5, 0.04, d);
  float core = smoothstep(0.22, 0.0, d);

  // Sparkle: a handful of particles flare brighter, decoupled from rim,
  // so the cloud reads alive rather than evenly lit.
  float sparkle = step(0.985, fract(vSeed * 41.0)) * 0.6;

  vec3 col = mix(uColor, uRimColor, clamp(vRim + sparkle, 0.0, 1.0));
  float alpha = (soft * 0.85 + core * 0.5) * vAlpha * uOpacity;
  if (alpha < 0.012) discard;
  gl_FragColor = vec4(col, alpha);
}
`;
