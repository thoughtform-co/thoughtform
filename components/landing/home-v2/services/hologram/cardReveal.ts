/**
 * cardReveal — the PORTRAIT RASTER's hover reveal (lab round four,
 * 2026-09-19): the photograph resolving out of its own ASCII portrait through
 * a pixelated pop, on the ring's existing VEIL PLANE.
 *
 * The veil plane already IS the ring's "hover resolves the photograph"
 * mechanism (ADR-050 Update 3): a per-card plane 0.002 over the face whose
 * level damps toward a residue while the pointer is on the card. This
 * material keeps that contract in its verb and inverts it in its mechanism —
 * the FACE is the screen now (the photograph lettered as glyphs, baked), and
 * the veil plane carries the photograph proper, popping in cell by cell as
 * the damped level rises. The plane, its renderOrder, its z and its child
 * index are untouched, so `DECK_INTRA_ORDERS` walks the same list.
 *
 * ⚠ THE SAMPLE IS `texture2DGradEXT` WITH THE ORIGINAL UV's DERIVATIVES. The
 * mosaic snaps the sample point to a cell centre with `floor`, whose
 * derivatives are zero inside a cell and enormous at its edges — under mips
 * and anisotropy 8 the GPU would pick a coarse mip along every cell border
 * and draw a blurred hairline on the grid. Passing `dFdx(uv)` / `dFdy(uv)`
 * keeps the mip choice the plane's own. (three r170 defines
 * `texture2DGradEXT` as `textureGrad` for every ShaderMaterial.)
 *
 * ⚠ `.opacity` ON A ShaderMaterial IS A SILENT NO-OP — three never reads it
 * there. The frame loop writes `uOpacity` and `uReveal` through
 * `revealMaterialsRef`, keyed on the VARIANT, and holds `uOpacity` at 0 while
 * `uMap` is null (an unbound sampler reads opaque). `#include
 * <colorspace_fragment>` or the gold plate goes muddy (`cardFigureVolume`'s
 * finding); no tonemapping chunk — the ring's built-ins are `toneMapped:
 * false`.
 *
 * The two type bands (`uBands`) show the photograph CRISP and cross-fade it
 * on the same level, eased over the same 40px the bake uses, so the title
 * and the paragraph — baked identically into both textures — never move
 * through the transition. Every number comes from `lib/services-ring/reveal`
 * (three-free), which the vitest pins.
 */

import * as THREE from "three";

import { BAKE_H, BAKE_W } from "./ringCtaBox";
import {
  REVEAL_GRID_MIN,
  REVEAL_POP_GRID,
  revealBandEaseUv,
  revealBandsUv,
} from "@/lib/services-ring/reveal";

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/* ⚠ LOCKSTEP with \`lib/services-ring/reveal.ts\`: \`revealPop\` is
   smoothstep(0, 0.85, r), \`revealGrid\` is smoothstep(0.15, 1, r). */
const fragment = /* glsl */ `
uniform sampler2D uMap;
uniform float uReveal;
uniform float uOpacity;
uniform vec2 uPop;
uniform vec2 uGridMin;
uniform vec2 uFull;
uniform vec2 uBands;
uniform float uBandEase;
uniform float uSeed;
varying vec2 vUv;

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233)) + uSeed * 7.31) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  float r = clamp(uReveal, 0.0, 1.0);

  // The type bands: crisp, cross-faded on the level. 1 inside a band.
  float typeW = max(
    smoothstep(uBands.y - uBandEase, uBands.y, uv.y),
    1.0 - smoothstep(uBands.x, uBands.x + uBandEase, uv.y)
  );
  vec4 crisp = texture2D(uMap, uv);
  float crispA = smoothstep(0.0, 1.0, r);

  // The field: a fixed pop grid, a mosaic refining under it.
  vec2 cell = floor(uv * uPop);
  float pop = step(hash2(cell), smoothstep(0.0, 0.85, r));
  vec2 n = mix(uGridMin, uFull, smoothstep(0.15, 1.0, r));
  vec2 muv = (floor(uv * n) + 0.5) / n;
  vec4 mosaic = texture2DGradEXT(uMap, muv, dFdx(uv), dFdy(uv));

  vec3 rgb = mix(mosaic.rgb, crisp.rgb, typeW);
  float a = mix(pop, crispA, typeW) * uOpacity;
  if (a < 0.003) discard;
  gl_FragColor = vec4(rgb, a);
  #include <colorspace_fragment>
}
`;

/** One material per card — the level and the opacity are per card. `map` is
 *  the card's reveal texture (the same composition baked without the glyph
 *  pass), null until it lands; `seed` de-correlates the four pop patterns. */
export function createRevealMaterial(
  map: THREE.Texture | null,
  seed: number
): THREE.ShaderMaterial {
  const [lo, hi] = revealBandsUv();
  return new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      uMap: { value: map },
      uReveal: { value: 0 },
      uOpacity: { value: 0 },
      uPop: { value: new THREE.Vector2(REVEAL_POP_GRID[0], REVEAL_POP_GRID[1]) },
      uGridMin: { value: new THREE.Vector2(REVEAL_GRID_MIN[0], REVEAL_GRID_MIN[1]) },
      uFull: { value: new THREE.Vector2(BAKE_W, BAKE_H) },
      uBands: { value: new THREE.Vector2(lo, hi) },
      uBandEase: { value: revealBandEaseUv() },
      uSeed: { value: seed },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
  });
}

/** The frame loop's write: the damped reveal level, and the plane's alpha —
 *  the face's own (`faceO`), held at 0 until the texture is mapped. Lives
 *  here, beside the uniforms it names, so the loop states its intent in one
 *  call rather than four property writes. */
export function driveRevealMaterial(
  material: THREE.ShaderMaterial,
  level: number,
  faceO: number
): void {
  material.uniforms.uReveal.value = level;
  material.uniforms.uOpacity.value = material.uniforms.uMap.value ? faceO : 0;
}
