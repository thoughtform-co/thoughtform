/**
 * stageBatch — the stage's dense line work as ONE draw call (ADR-140).
 *
 * Copied by hand from the Evangelion / P(doom) video engine's `lines.ts`
 * (Giacomo Magnanini, adapted by Luis Bizarro; MIT) — GPU capsule segments as
 * an instanced quad, anti-aliased in physical pixels — and re-cut for a
 * drawing that ARRIVES: every segment carries its own reveal window and its
 * group, and the shader does the draw-on and the sweep, so sixty isolines of
 * the curve's effort surface, a graticule and a dozen rings cost what one
 * drei `Line` costs. Never imported across repos (ADR-106).
 *
 * ⚠ WIDTHS ARE CSS PX, as drei's `lineWidth` is, so a batched hairline and a
 * drei donor run sit on the same ladder. `pxScale` is the RENDERER's dpr —
 * never `window.devicePixelRatio` (the corridor's "thick starfield").
 *
 * ⚠ PREMULTIPLIED, ON A CUSTOM BLEND. Additive (One, One) on dark is what
 * makes two crossing hairlines brighter where they cross — a hologram; on
 * light the lines are INK and take (One, OneMinusSrcAlpha), or additive dawn
 * over parchment would be invisible (`holoPalette`'s whole file header).
 */

import * as THREE from "three";

import type { StageLine, StageRole } from "./stageGeom";

const VERT = /* glsl */ `
precision highp float;
in vec3 position;           // quad corner: x in {0,1} along the segment, y in {-1,1} across
in vec3 iA; in vec3 iB;      // the segment, in world
in vec4 iColor;              // linear rgb, alpha
in float iWidth;             // CSS px
in vec2 iReveal;             // the draw-on window, in its clock's progress
in float iGroup;             // 0 = the intro's clock, 1..4 = a group's
uniform mat4 projectionMatrix; uniform mat4 modelViewMatrix;
uniform vec2 res;            // the canvas in CSS px
uniform float pxScale;       // physical px per CSS px
uniform float uProgress;     // the intro's clock
uniform vec4 uGroups;        // each group's clock
uniform int uSweepAxis;
out vec2 vLocal; out float vLen; out float vHalfW; out vec4 vColor; out float vSweepC; out float vSwept;

float clockOf(float g) {
  if (g < 0.5) return uProgress;
  int i = int(g + 0.5) - 1;
  return i == 0 ? uGroups.x : (i == 1 ? uGroups.y : (i == 2 ? uGroups.z : uGroups.w));
}

void main() {
  float p = clockOf(iGroup);
  float r = smoothstep(iReveal.x, iReveal.y, p);
  if (r <= 0.0005) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  // The draw-on: the segment grows from A toward B as its window opens.
  vec3 b = mix(iA, iB, r);
  vec4 ca = projectionMatrix * modelViewMatrix * vec4(iA, 1.0);
  vec4 cb = projectionMatrix * modelViewMatrix * vec4(b, 1.0);
  if (ca.w <= 0.0 || cb.w <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec2 sa = ca.xy / ca.w * 0.5 * res * pxScale, sb = cb.xy / cb.w * 0.5 * res * pxScale;
  float w = iWidth * pxScale;
  float hw = max(w * 0.5, 0.35) + 1.0; // +1 physical px for AA
  vec2 d = sb - sa; float len = length(d);
  vec2 dir = len > 1e-4 ? d / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  float along = mix(-hw, len + hw, position.x);
  vec2 q = sa + dir * along + nrm * position.y * hw;
  float z = mix(ca.z / ca.w, cb.z / cb.w, position.x);
  gl_Position = vec4(q / (0.5 * res * pxScale), z, 1.0);
  vLocal = vec2(along, position.y * hw);
  vLen = len; vHalfW = max(w * 0.5, 0.35);
  // Thin lines fade instead of shrinking below 0.7 px, so a hairline stays smooth.
  vColor = iColor * vec4(1.0, 1.0, 1.0, min(1.0, w / 0.7));
  // The sweep's coordinate, interpolated along the segment; grouped lines are
  // never swept (they arrive on their own clock, after the intro).
  vec3 wp = mix(iA, b, position.x);
  vSweepC = uSweepAxis == 0 ? wp.x : (uSweepAxis == 1 ? wp.y : wp.z);
  vSwept = iGroup < 0.5 ? 1.0 : 0.0;
}`;

const FRAG = /* glsl */ `
precision highp float;
in vec2 vLocal; in float vLen; in float vHalfW; in vec4 vColor; in float vSweepC; in float vSwept;
out vec4 fragColor;
uniform float uAlpha;
uniform bool uSweepOn;
uniform float uSweep;
uniform float uSweepWidth;
uniform vec3 uSweepColor;
void main() {
  float x = clamp(vLocal.x, 0.0, vLen);
  float d = length(vec2(vLocal.x - x, vLocal.y)) - vHalfW; // capsule SDF, physical px
  float cov = clamp(0.5 - d, 0.0, 1.0);
  vec3 col = vColor.rgb;
  float a = cov * vColor.a * uAlpha;
  if (uSweepOn && vSwept > 0.5) {
    // Ahead of the front: not yet drawn. At the front: lit.
    if (vSweepC > uSweep) discard;
    float g = (vSweepC - uSweep) / max(uSweepWidth, 1e-4);
    float glow = exp(-g * g);
    col += uSweepColor * glow * 1.4;
    a = min(1.0, a + glow * cov * 0.5);
  }
  if (a <= 0.0) discard;
  fragColor = vec4(col * a, a);
}`;

export interface BatchColours {
  colourOf(role: StageRole): THREE.Color;
  additive: boolean;
}

export interface StageBatchUniforms {
  res: { value: THREE.Vector2 };
  pxScale: { value: number };
  uProgress: { value: number };
  uGroups: { value: THREE.Vector4 };
  uAlpha: { value: number };
  uSweepOn: { value: boolean };
  uSweepAxis: { value: number };
  uSweep: { value: number };
  uSweepWidth: { value: number };
  uSweepColor: { value: THREE.Color };
}

/**
 * Build the batch for every `batch` line in a spec. Static: the attributes are
 * written once, the shader does the rest. `groupIndex` maps a group name to
 * 1..4 (0 is the intro's own clock).
 */
export function buildStageBatch(
  lines: readonly StageLine[],
  colours: BatchColours,
  groupIndex: (g: string | undefined) => number,
  sweepColour: THREE.Color
): { mesh: THREE.Mesh; uniforms: StageBatchUniforms; dispose: () => void } | null {
  const segs: {
    a: readonly [number, number, number];
    b: readonly [number, number, number];
    c: THREE.Color;
    alpha: number;
    w: number;
    r: readonly [number, number];
    g: number;
  }[] = [];
  for (const l of lines) {
    if (!l.batch) continue;
    const c = colours.colourOf(l.role);
    const g = groupIndex(l.group);
    for (let i = 1; i < l.points.length; i++) {
      segs.push({
        a: l.points[i - 1],
        b: l.points[i],
        c,
        alpha: l.opacity,
        w: l.width,
        r: l.reveal,
        g,
      });
    }
  }
  if (segs.length === 0) return null;

  const n = segs.length;
  const geo = new THREE.InstancedBufferGeometry();
  const quad = new Float32Array([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0]);
  geo.setAttribute("position", new THREE.BufferAttribute(quad, 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const A = new Float32Array(n * 3);
  const B = new Float32Array(n * 3);
  const C = new Float32Array(n * 4);
  const W = new Float32Array(n);
  const R = new Float32Array(n * 2);
  const G = new Float32Array(n);
  segs.forEach((s, i) => {
    A[i * 3] = s.a[0];
    A[i * 3 + 1] = s.a[1];
    A[i * 3 + 2] = s.a[2];
    B[i * 3] = s.b[0];
    B[i * 3 + 1] = s.b[1];
    B[i * 3 + 2] = s.b[2];
    C[i * 4] = s.c.r;
    C[i * 4 + 1] = s.c.g;
    C[i * 4 + 2] = s.c.b;
    C[i * 4 + 3] = s.alpha;
    W[i] = s.w;
    R[i * 2] = s.r[0];
    R[i * 2 + 1] = s.r[1];
    G[i] = s.g;
  });
  geo.setAttribute("iA", new THREE.InstancedBufferAttribute(A, 3));
  geo.setAttribute("iB", new THREE.InstancedBufferAttribute(B, 3));
  geo.setAttribute("iColor", new THREE.InstancedBufferAttribute(C, 4));
  geo.setAttribute("iWidth", new THREE.InstancedBufferAttribute(W, 1));
  geo.setAttribute("iReveal", new THREE.InstancedBufferAttribute(R, 2));
  geo.setAttribute("iGroup", new THREE.InstancedBufferAttribute(G, 1));
  geo.instanceCount = n;

  const uniforms: StageBatchUniforms = {
    res: { value: new THREE.Vector2(1, 1) },
    pxScale: { value: 1 },
    uProgress: { value: 0 },
    uGroups: { value: new THREE.Vector4(0, 0, 0, 0) },
    uAlpha: { value: 1 },
    uSweepOn: { value: false },
    uSweepAxis: { value: 0 },
    uSweep: { value: 0 },
    uSweepWidth: { value: 1 },
    uSweepColor: { value: sweepColour.clone() },
  };
  const mat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
    transparent: true,
    depthWrite: false,
    /* ⚠ DEPTH-TESTED, like drei's runs. An opaque shaded face (the two dark
       blocks, ADR-130 U4) must hide the edges behind it, or the wire prints
       through the solid — the X-ray the owner rejected. The faces carry a
       polygon offset, so an edge ON a face still wins; the gold volume's
       faces write no depth, so its twelve edges all show, which is the
       hologram. */
    depthTest: true,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: colours.additive ? THREE.OneFactor : THREE.OneMinusSrcAlphaFactor,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return {
    mesh,
    uniforms,
    dispose: () => {
      geo.dispose();
      mat.dispose();
    },
  };
}
