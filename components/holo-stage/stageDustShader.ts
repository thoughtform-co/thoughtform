/**
 * stageDustShader — the stage's motes, in two materials (ADR-140).
 *
 * `holoDustShader` (ADR-080) is the corridor's dust: a soft core with a halved
 * halo, CSS-px size, a softened depth factor, an early `discard`. This is that
 * shader with the three things the workshop's figures add, kept separate so
 * the trajectory's painter is untouched:
 *
 *   1. ORDER. `aOrder` 0..1 per mote: 0 is a LATTICE mote — a crisp square
 *      frozen on its home, a grid you can count — and 1 a CLOUD mote — the
 *      soft dot, drifting around its home on a seeded phase. The spectrum's
 *      one argument is this attribute (software is deterministic, intelligence
 *      is probabilistic); the stages and the curve pass no `order`, so every
 *      mote is a cloud mote at rest, byte for byte the old look.
 *   2. THE SWEEP. A mote ahead of the gold front is not drawn; one at the
 *      front glows. No fade (the house's reveal law): `step`, not `mix`.
 *   3. A FLAT VIEW. The spectrum looks straight at its plane, so the depth
 *      factor is a constant there.
 *
 * ⚠ DRIFT IS DETERMINISTIC per `aRand` and the wall clock, never `Math.random`
 * — the same law the seeded motes obey (ADR-130 U1).
 */

export const stageDustVertexShader = /* glsl */ `
  attribute float aRand;
  attribute float aOrder;

  uniform float uPointSize;
  uniform float uPixelRatio;
  uniform float uTime;
  uniform float uDrift;
  uniform bool uFlat;
  uniform bool uSweepOn;
  uniform int uSweepAxis;
  uniform float uSweep;
  uniform float uSweepWidth;

  varying float vRand;
  varying float vOrder;
  varying float vSweep;
  varying float vGlow;

  void main() {
    vRand = aRand;
    vOrder = aOrder;

    vec3 pos = position;
    if (uDrift > 0.0 && aOrder > 0.0) {
      // A slow, seeded wander around the home: two incommensurate phases per
      // axis so no two motes share a path, amplitude the order times the drift.
      float ph = aRand * 6.28318530718;
      vec3 w = vec3(
        sin(uTime * 0.31 + ph * 3.1),
        cos(uTime * 0.23 + ph * 2.3) * 0.6,
        sin(uTime * 0.27 + ph * 1.7)
      );
      pos += w * (uDrift * aOrder * (0.55 + 0.45 * aRand));
    }

    float c = uSweepAxis == 0 ? pos.x : (uSweepAxis == 1 ? pos.y : pos.z);
    vSweep = uSweepOn ? step(c, uSweep) : 1.0;
    float d = (c - uSweep) / max(uSweepWidth, 1e-4);
    vGlow = uSweepOn ? exp(-d * d) : 0.0;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // A SOFTENED perspective (the corridor's), or none on a flat plane.
    float dist = max(0.5, -mv.z);
    float depthFactor = uFlat ? 1.0 : clamp(9.0 / dist, 0.4, 1.4);

    // A lattice mote is one size; a cloud mote varies.
    float sizeJitter = mix(1.0, 0.7 + aRand * 0.75, aOrder);

    gl_PointSize = uPointSize * uPixelRatio * depthFactor * sizeJitter;
  }
`;

export const stageDustFragmentShader = /* glsl */ `
  precision mediump float;

  uniform vec3 uColor;
  uniform vec3 uSweepColor;
  uniform float uOpacity;

  varying float vRand;
  varying float vOrder;
  varying float vSweep;
  varying float vGlow;

  void main() {
    if (vSweep < 0.5) discard;

    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);

    // The cloud mote: core + HALVED halo (the corridor's recipe).
    float core = smoothstep(0.10, 0.0, d);
    float halo = smoothstep(0.5, 0.12, d);
    float soft = max(core, halo * 0.5);

    // The lattice mote: a crisp square, a touch of AA on its edge.
    vec2 q = abs(uv);
    float edge = max(q.x, q.y);
    float square = 1.0 - smoothstep(0.26, 0.32, edge);

    float mask = mix(square, soft, vOrder);
    float jitter = mix(0.85, 0.55 + fract(vRand * 41.0) * 0.45, vOrder);
    float alpha = mask * jitter * uOpacity;

    // The front lights what it passes, briefly.
    vec3 col = uColor + uSweepColor * vGlow * 1.6;
    alpha += vGlow * mask * 0.5;

    // Cull the tails so additive stacking cannot build a haze floor.
    if (alpha < 0.012) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;
