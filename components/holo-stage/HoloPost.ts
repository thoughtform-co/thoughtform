/**
 * HoloPost — the stage's light (ADR-140, round four).
 *
 * The P(doom) / Evangelion engine's post chain (bizarro/evangelion, MIT,
 * (c) 2026 Giacomo Magnanini, Luis Bizarro — `app/src/engine/post.ts`),
 * copied by hand from the house's own port in `01_thoughtform-motion` and cut
 * to what a figure on the page needs: a bloom PYRAMID (a thresholded
 * prefilter, a 13-tap downsample through seven mips, a 9-tap tent upsample
 * that adds each level back), a warm-gold HALATION tap fed only by what
 * passes the threshold, the tone SHOULDER that rolls a donor at 2–3× linear
 * into a white-hot core, the CRT RASTER multiplied over the frame, and the
 * vignette. Grain stays with the composer's `Noise` effect, which also does
 * the output encoding; this pass reads linear HDR and writes linear HDR.
 *
 * ⚠ WHY A PYRAMID AND NOT THE TWO `Bloom` EFFECTS IT REPLACES: the measured
 * look (grammar.md §4) is a donor core at ≈ (255, 244, 226), FWHM 3 px, its
 * 10 %-width ≈ 30 px at 1920, and NO halo past ~5 px on structure. A single
 * mipmap bloom at a 0.62 threshold lifted everything a little and the donor
 * not enough; the prefilter's knee and the per-level tent are what put the
 * energy where the reference has it. The threshold sits ABOVE every
 * structure line (≤ 0.8 linear) and BELOW the donor (≥ 2.0).
 *
 * ⚠ LIGHT IS A DIFFERENT DRAWING. On paper the threshold sits above the
 * paper's own luminance (0.97 — at 0.62 the whole ground bloomed by one unit,
 * a rectangle the width of the beat, ADR-140 §8), the halation is zero, the
 * raster is zero and the vignette is zero. Mounted in both themes at those
 * values; the composer's child count never changes between themes.
 *
 * A `postprocessing` `Pass`; R3F's composer mounts it as a `<primitive>`.
 */

import { Pass } from "postprocessing";
import * as THREE from "three";

export interface HoloPostParams {
  exposure: number;
  bloom: number;
  bloomThreshold: number;
  bloomKnee: number;
  bloomRadius: number;
  /** Warm-gold halation around what passes the bloom threshold. */
  halation: number;
  /** The halation's hue, as a linear rgb triple (normalised in the shader). */
  halationColor: readonly [number, number, number];
  vignette: number;
  /** CRT raster strength (3-physical-px pitch). 0 = off. */
  scan: number;
  /** A faint rolling bright band, multiplied by `scan`. */
  roll: number;
}

/** The dark drawing's dials — grammar.md §4, the motion study's own values. */
export const HOLO_POST_DARK: HoloPostParams = {
  exposure: 1,
  bloom: 0.5,
  bloomThreshold: 0.85,
  bloomKnee: 0.4,
  bloomRadius: 0.75,
  halation: 0.18,
  halationColor: [0.5972, 0.3763, 0.0908],
  vignette: 0.25,
  scan: 0.1,
  roll: 0.25,
};

/** The ink drawing's dials: bloom with nothing to lift, no phosphor. */
export const HOLO_POST_LIGHT: HoloPostParams = {
  exposure: 1,
  bloom: 0.08,
  bloomThreshold: 0.97,
  bloomKnee: 0.1,
  bloomRadius: 0.6,
  halation: 0,
  halationColor: [0.2423, 0.1499, 0.0144],
  vignette: 0,
  scan: 0,
  roll: 0,
};

const MIPS = 7;

const FS_VERT = /* glsl */ `
precision highp float;
in vec3 position;
out vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const HEAD = /* glsl */ `
precision highp float;
precision highp int;
in vec2 vUv;
out vec4 fragColor;
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
`;

const PREFILTER = /* glsl */ `
uniform sampler2D src; uniform vec2 texel; uniform float threshold, knee;
void main() {
  vec3 c = vec3(0.0);
  c += texture(src, vUv + texel * vec2(-1, -1)).rgb; c += texture(src, vUv + texel * vec2(1, -1)).rgb;
  c += texture(src, vUv + texel * vec2(-1, 1)).rgb;  c += texture(src, vUv + texel * vec2(1, 1)).rgb;
  c *= 0.25;
  c = min(c, vec3(40.0));
  float l = max(c.r, max(c.g, c.b));
  float rq = clamp(l - threshold + knee, 0.0, 2.0 * knee);
  rq = rq * rq / (4.0 * knee + 1e-5);
  float w = max(rq, l - threshold) / max(l, 1e-5);
  fragColor = vec4(c * w, 1.0);
}`;

const DOWN = /* glsl */ `
uniform sampler2D src; uniform vec2 texel;
void main() {
  vec3 a = texture(src, vUv + texel * vec2(-2, -2)).rgb, b = texture(src, vUv + texel * vec2(0, -2)).rgb, c = texture(src, vUv + texel * vec2(2, -2)).rgb;
  vec3 d = texture(src, vUv + texel * vec2(-1, -1)).rgb, e = texture(src, vUv + texel * vec2(1, -1)).rgb;
  vec3 f = texture(src, vUv + texel * vec2(-2, 0)).rgb, g = texture(src, vUv).rgb, h = texture(src, vUv + texel * vec2(2, 0)).rgb;
  vec3 i = texture(src, vUv + texel * vec2(-1, 1)).rgb, j = texture(src, vUv + texel * vec2(1, 1)).rgb;
  vec3 k = texture(src, vUv + texel * vec2(-2, 2)).rgb, l = texture(src, vUv + texel * vec2(0, 2)).rgb, m = texture(src, vUv + texel * vec2(2, 2)).rgb;
  vec3 o = (d + e + i + j) * 0.125 + (a + b + g + f) * 0.03125 + (b + c + h + g) * 0.03125 + (f + g + l + k) * 0.03125 + (g + h + m + l) * 0.03125;
  fragColor = vec4(o, 1.0);
}`;

const UP = /* glsl */ `
uniform sampler2D src; uniform sampler2D prev; uniform vec2 texel; uniform float radius;
void main() {
  vec2 o = texel * radius;
  vec3 s = texture(src, vUv - o).rgb + 2.0 * texture(src, vUv + vec2(0, -o.y)).rgb + texture(src, vUv + vec2(o.x, -o.y)).rgb
    + 2.0 * texture(src, vUv + vec2(-o.x, 0)).rgb + 4.0 * texture(src, vUv).rgb + 2.0 * texture(src, vUv + vec2(o.x, 0)).rgb
    + texture(src, vUv + vec2(-o.x, o.y)).rgb + 2.0 * texture(src, vUv + vec2(0, o.y)).rgb + texture(src, vUv + o).rgb;
  fragColor = vec4(texture(prev, vUv).rgb + s / 16.0, 1.0);
}`;

const FINAL = /* glsl */ `
uniform sampler2D src; uniform sampler2D bloomTex; uniform sampler2D haloTex;
uniform float exposure, bloom, halation, vignette, time, scan, roll;
uniform vec3 haloColor;
uniform vec2 res;
vec3 shoulder(vec3 x) {
  const float k = 0.72;
  vec3 y = mix(x, k + (1.0 - k) * (1.0 - exp(-(x - k) / (1.0 - k))), step(k, x));
  float over = max(max(x.r, x.g), x.b);
  return mix(y, vec3(1.0), smoothstep(2.0, 12.0, over) * 0.85);
}
void main() {
  vec2 uv = vUv;
  vec2 dc = uv - 0.5;
  vec3 col = texture(src, uv).rgb;
  vec3 bl = texture(bloomTex, uv).rgb;
  vec3 ha = texture(haloTex, uv).rgb;
  col += bl * bloom;
  col += normalize(haloColor) * 1.2 * luma(ha) * halation;
  col *= exposure;
  /* the CRT raster, multiplied over the frame: three physical px a line */
  vec2 px = gl_FragCoord.xy;
  float line = 0.5 + 0.5 * cos(px.y * 6.28318530718 / 3.0);
  float rollBand = roll * 0.04 * smoothstep(0.0, 1.0, 1.0 - abs(fract(vUv.y * 0.6 - time * 0.12) - 0.5) * 8.0);
  col *= 1.0 - scan * (1.0 - line) * 0.9;
  col += col * scan * rollBand * 4.0;
  col = shoulder(col);
  float v = smoothstep(0.95, 0.25, length(dc * vec2(1.0, 0.8)));
  col *= mix(1.0, v, vignette);
  fragColor = vec4(max(col, 0.0), 1.0);
}`;

let quadGeom: THREE.BufferGeometry | null = null;
function quad(): THREE.BufferGeometry {
  if (!quadGeom) {
    quadGeom = new THREE.BufferGeometry();
    quadGeom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)
    );
  }
  return quadGeom;
}

/** One fullscreen program: its own scene and camera, GLSL ES 3.0. */
class FS {
  readonly mat: THREE.RawShaderMaterial;
  private readonly scene = new THREE.Scene();
  private readonly cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  constructor(frag: string, uniforms: Record<string, THREE.IUniform>) {
    this.mat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FS_VERT,
      fragmentShader: HEAD + frag,
      uniforms,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    });
    const mesh = new THREE.Mesh(quad(), this.mat);
    mesh.frustumCulled = false;
    this.scene.add(mesh);
  }
  get u() {
    return this.mat.uniforms;
  }
  render(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget | null) {
    renderer.setRenderTarget(target);
    renderer.render(this.scene, this.cam);
  }
  dispose() {
    this.mat.dispose();
  }
}

function makeRT(w: number, h: number): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(Math.max(2, Math.round(w)), Math.max(2, Math.round(h)), {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

export class HoloPostPass extends Pass {
  params: HoloPostParams;
  private readonly prefilter: FS;
  private readonly down: FS;
  private readonly up: FS;
  private readonly final: FS;
  private mips: THREE.WebGLRenderTarget[] = [];
  private ups: THREE.WebGLRenderTarget[] = [];
  private w = 2;
  private h = 2;
  private clock = 0;

  constructor(params: HoloPostParams) {
    super("HoloPostPass");
    this.params = params;
    this.needsSwap = true;
    this.prefilter = new FS(PREFILTER, {
      src: { value: null },
      texel: { value: new THREE.Vector2() },
      threshold: { value: params.bloomThreshold },
      knee: { value: params.bloomKnee },
    });
    this.down = new FS(DOWN, { src: { value: null }, texel: { value: new THREE.Vector2() } });
    this.up = new FS(UP, {
      src: { value: null },
      prev: { value: null },
      texel: { value: new THREE.Vector2() },
      radius: { value: 1 },
    });
    this.final = new FS(FINAL, {
      src: { value: null },
      bloomTex: { value: null },
      haloTex: { value: null },
      exposure: { value: 1 },
      bloom: { value: 0.5 },
      halation: { value: 0.18 },
      vignette: { value: 0.25 },
      time: { value: 0 },
      scan: { value: 0.1 },
      roll: { value: 0.25 },
      haloColor: { value: new THREE.Vector3(...params.halationColor) },
      res: { value: new THREE.Vector2(2, 2) },
    });
  }

  private allocate(width: number, height: number) {
    for (const t of this.mips) t.dispose();
    for (const t of this.ups) t.dispose();
    this.mips = [];
    this.ups = [];
    let w = width >> 1;
    let h = height >> 1;
    for (let i = 0; i < MIPS; i++) {
      this.mips.push(makeRT(w, h));
      this.ups.push(makeRT(w, h));
      w = Math.max(2, w >> 1);
      h = Math.max(2, h >> 1);
    }
    this.w = width;
    this.h = height;
  }

  override setSize(width: number, height: number): void {
    if (width !== this.w || height !== this.h || this.mips.length === 0) {
      this.allocate(width, height);
    }
  }

  override render(
    renderer: THREE.WebGLRenderer,
    inputBuffer: THREE.WebGLRenderTarget | null,
    outputBuffer: THREE.WebGLRenderTarget | null,
    deltaTime?: number
  ): void {
    if (!inputBuffer) return;
    if (this.mips.length === 0) this.allocate(inputBuffer.width, inputBuffer.height);
    this.clock += deltaTime ?? 1 / 60;
    const p = this.params;
    const src = inputBuffer.texture;

    this.prefilter.u.src.value = src;
    (this.prefilter.u.texel.value as THREE.Vector2).set(
      1 / inputBuffer.width,
      1 / inputBuffer.height
    );
    this.prefilter.u.threshold.value = p.bloomThreshold;
    this.prefilter.u.knee.value = p.bloomKnee;
    this.prefilter.render(renderer, this.mips[0]);
    for (let i = 1; i < MIPS; i++) {
      const s = this.mips[i - 1];
      this.down.u.src.value = s.texture;
      (this.down.u.texel.value as THREE.Vector2).set(1 / s.width, 1 / s.height);
      this.down.render(renderer, this.mips[i]);
    }
    let prevTex = this.mips[MIPS - 1].texture;
    for (let i = MIPS - 2; i >= 0; i--) {
      const small = i === MIPS - 2 ? this.mips[MIPS - 1] : this.ups[i + 1];
      this.up.u.src.value = prevTex;
      this.up.u.prev.value = this.mips[i].texture;
      (this.up.u.texel.value as THREE.Vector2).set(1 / small.width, 1 / small.height);
      this.up.u.radius.value = 0.5 + p.bloomRadius;
      this.up.render(renderer, this.ups[i]);
      prevTex = this.ups[i].texture;
    }
    const f = this.final.u;
    f.src.value = src;
    f.bloomTex.value = this.ups[0].texture;
    f.haloTex.value = this.ups[3].texture;
    f.exposure.value = p.exposure;
    f.bloom.value = p.bloom / 3;
    f.halation.value = p.halation;
    f.vignette.value = p.vignette;
    f.time.value = this.clock;
    f.scan.value = p.scan;
    f.roll.value = p.roll;
    (f.haloColor.value as THREE.Vector3).set(...p.halationColor);
    (f.res.value as THREE.Vector2).set(inputBuffer.width, inputBuffer.height);
    this.final.render(renderer, this.renderToScreen ? null : outputBuffer);
  }

  override dispose(): void {
    for (const t of this.mips) t.dispose();
    for (const t of this.ups) t.dispose();
    this.mips = [];
    this.ups = [];
    this.prefilter.dispose();
    this.down.dispose();
    this.up.dispose();
    this.final.dispose();
  }
}
