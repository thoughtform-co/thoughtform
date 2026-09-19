/**
 * cardFigureVolume — V · VOLUME: the services figure as a three.js point
 * cloud floated over the card face (the 2026-09-19 lab pass).
 *
 * The same record the raster and the wire draw (`serviceFigures`), given its
 * third dimension back: the constellation's Fibonacci sphere is a SPHERE, and
 * `cardViz` projected it flat. Here the nodes sit at their own depth over
 * the poster band, as PT Mono glyph sprites, with the chords as hairlines —
 * ASCII in depth. Nothing animates it: it is static geometry inside the
 * card's group, so it moves with the card and with nothing else, which is
 * ADR-021's "card content scrolls with its card" clause — and the ring's own
 * turn plus the rig's pointer-look give it real parallax, which is what
 * makes a hologram read as one.
 *
 * ⚠ THE FACE BAKES THE TYPE ALONE under this figure (`viz: "none"`): the band
 * is the cloud's, and a drawing under a cloud is two drawings.
 *
 * ⚠ THE FIRST ShaderMaterial ON THE RING. Two things the built-in materials
 * did for free must be done here: the output colour space (three encodes
 * built-ins to `outputColorSpace`; a raw shader writes linear and the gold
 * goes muddy — `#include <colorspace_fragment>` is the fix) and NormalBlending
 * (ADR-023: additive saturates into a blob). Every alpha rides `uOpacity`,
 * which the ring's frame loop sets from the face's own alpha, so the figure
 * and the type are one material at every t.
 *
 * ⚠ AN UNBOUND SAMPLER READS OPAQUE BLACK, which under `uColor` is a field of
 * gold squares. The atlas lands after `waitForCardFonts()`; until then the
 * loop holds `uOpacity` at 0 — the same "never on screen unmapped" discipline
 * the drawer and the phone back keep.
 */

import * as THREE from "three";

import { BAKE_H, BAKE_W, PAD_X } from "./ringCtaBox";
import { FIGURE_INK, figureFor, near, type FigureSlot } from "@/lib/services-ring/serviceFigures";

/** The ring's own floor (`CorridorArmillary`'s phone rule): under it, no
 *  figure at all — never half a figure. */
export const VOLUME_QUALITY_FLOOR = 0.35;

/** The poster band (`ServicesCardRing`'s `vizBoxFor("poster")`), bake px. */
const BAND = { x: PAD_X, y: 358, w: BAKE_W - PAD_X * 2, h: 656 } as const;

/**
 * The figure's depth as a fraction of its radius — 1 is the full sphere. The
 * one dial this material has: the near hemisphere protrudes toward the
 * viewer by this much of R, in front of the face.
 */
export const VOLUME_DEPTH = 0.55;

/** Sprite sizes in bake px (per 1360 of card height). */
const SPRITE_PX = { unlit: 20, lit: 30, open: 26, markPer: 2.6 } as const;

export const ATLAS_TILE = 64;
export const ATLAS_COLS = 4;
export const ATLAS_ROWS = 1;
/** Tile index per node class. */
export const GLYPH = { unlit: 0, lit: 1, mark: 2, open: 3 } as const;

/**
 * The glyph atlas: four tiles, white on transparent, tinted by `uColor`.
 * Two are TYPE (`·` and `+`, PT Mono — call after `waitForCardFonts()` or
 * the tiles bake in the fallback face forever) and two are SHAPES (the
 * diamond, the open square), because a mark is a mark in every material.
 */
export function buildFigureAtlas(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_TILE * ATLAS_COLS;
  canvas.height = ATLAS_TILE * ATLAS_ROWS;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const c = ATLAS_TILE / 2;
    // 0 · the estate — a small centred dot.
    ctx.font = '400 60px "PT Mono", "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillText("·", c, c + 2);
    // 1 · a lit node.
    ctx.fillText("+", ATLAS_TILE + c, c + 2);
    // 2 · the mark — a diamond, filling the tile.
    ctx.beginPath();
    ctx.moveTo(2 * ATLAS_TILE + c, 6);
    ctx.lineTo(3 * ATLAS_TILE - 6, c);
    ctx.lineTo(2 * ATLAS_TILE + c, ATLAS_TILE - 6);
    ctx.lineTo(2 * ATLAS_TILE + 6, c);
    ctx.closePath();
    ctx.fill();
    // 3 · the open square — the person-led work.
    ctx.lineWidth = 6;
    ctx.strokeRect(3 * ATLAS_TILE + 10, 10, ATLAS_TILE - 20, ATLAS_TILE - 20);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

export interface FigureGeometries {
  points: THREE.BufferGeometry;
  lines: THREE.BufferGeometry;
}

/**
 * The figure in CARD-LOCAL units: x right, y up, z toward the viewer, the
 * band's centre where the bake puts it and the radius the band's own
 * (height-bound, ADR-086). Marks are extra sprites just above their node.
 */
export function buildFigureGeometry(
  slot: FigureSlot,
  cardW: number,
  cardHeight: number
): FigureGeometries {
  const fig = figureFor(slot);
  const sx = cardW / BAKE_W;
  const sy = cardHeight / BAKE_H;
  const R = (BAND.h / 2) * sy;
  const cx = (BAND.x + BAND.w / 2 - BAKE_W / 2) * sx;
  const cy = (BAKE_H / 2 - (BAND.y + BAND.h / 2)) * sy;
  const depth = R * VOLUME_DEPTH;
  const open = new Set(fig.unlinked);

  const n = fig.points.length + fig.marks.length;
  const pos = new Float32Array(n * 3);
  const glyph = new Float32Array(n);
  const world = new Float32Array(n);
  const alpha = new Float32Array(n);
  fig.points.forEach((p, i) => {
    const nz = near(p.z);
    pos[i * 3] = cx + p.x * R;
    pos[i * 3 + 1] = cy - p.y * R;
    pos[i * 3 + 2] = p.z * depth;
    if (open.has(i)) {
      glyph[i] = GLYPH.open;
      world[i] = SPRITE_PX.open * sy;
      alpha[i] = 0.55 + nz * 0.3;
    } else if (fig.lit[i]) {
      glyph[i] = GLYPH.lit;
      world[i] = SPRITE_PX.lit * sy;
      alpha[i] = FIGURE_INK.node.lit(nz);
    } else {
      glyph[i] = GLYPH.unlit;
      world[i] = SPRITE_PX.unlit * sy;
      alpha[i] = FIGURE_INK.node.unlit(nz);
    }
  });
  fig.marks.forEach((m, k) => {
    const i = fig.points.length + k;
    const p = fig.points[m.i];
    pos[i * 3] = cx + p.x * R;
    pos[i * 3 + 1] = cy - p.y * R;
    pos[i * 3 + 2] = p.z * depth + 0.003;
    glyph[i] = GLYPH.mark;
    world[i] = m.r * SPRITE_PX.markPer * sy;
    alpha[i] = 1;
  });
  const points = new THREE.BufferGeometry();
  points.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  points.setAttribute("aGlyph", new THREE.BufferAttribute(glyph, 1));
  points.setAttribute("aWorld", new THREE.BufferAttribute(world, 1));
  points.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1));

  const m = fig.edges.length;
  const lpos = new Float32Array(m * 6);
  const lalpha = new Float32Array(m * 2);
  fig.edges.forEach((e, k) => {
    const a = fig.points[e.a];
    const b = fig.points[e.b];
    const ink = FIGURE_INK[e.kind].alpha(near((a.z + b.z) / 2));
    lpos[k * 6] = cx + a.x * R;
    lpos[k * 6 + 1] = cy - a.y * R;
    lpos[k * 6 + 2] = a.z * depth;
    lpos[k * 6 + 3] = cx + b.x * R;
    lpos[k * 6 + 4] = cy - b.y * R;
    lpos[k * 6 + 5] = b.z * depth;
    lalpha[k * 2] = ink;
    lalpha[k * 2 + 1] = ink;
  });
  const lines = new THREE.BufferGeometry();
  lines.setAttribute("position", new THREE.BufferAttribute(lpos, 3));
  lines.setAttribute("aAlpha", new THREE.BufferAttribute(lalpha, 1));

  return { points, lines };
}

const pointsVertex = /* glsl */ `
uniform float uProj;
attribute float aGlyph;
attribute float aWorld;
attribute float aAlpha;
varying float vGlyph;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  // A sprite the size of aWorld card units at this depth: the group's own
  // scale rides the model-view matrix, so read it off the first column.
  float s = length(modelViewMatrix[0].xyz);
  gl_PointSize = aWorld * s * uProj / max(0.05, -mv.z);
  vGlyph = aGlyph;
  vAlpha = aAlpha;
}
`;

const pointsFragment = /* glsl */ `
uniform sampler2D uAtlas;
uniform vec3 uInk;
uniform vec3 uGold;
uniform float uOpacity;
uniform float uCols;
uniform float uRows;
varying float vGlyph;
varying float vAlpha;
void main() {
  float col = mod(vGlyph, uCols);
  float row = floor(vGlyph / uCols);
  vec2 uv = vec2((col + gl_PointCoord.x) / uCols, (row + (1.0 - gl_PointCoord.y)) / uRows);
  float a = texture2D(uAtlas, uv).a * vAlpha * uOpacity;
  if (a < 0.01) discard;
  // ADR-086's ink law in every material: nodes in ink, the diamond in gold.
  vec3 c = (vGlyph > 1.5 && vGlyph < 2.5) ? uGold : uInk;
  gl_FragColor = vec4(c, a);
  #include <colorspace_fragment>
}
`;

const linesVertex = /* glsl */ `
attribute float aAlpha;
varying float vAlpha;
void main() {
  vAlpha = aAlpha;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const linesFragment = /* glsl */ `
uniform vec3 uInk;
uniform float uOpacity;
varying float vAlpha;
void main() {
  float a = vAlpha * uOpacity;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uInk, a);
  #include <colorspace_fragment>
}
`;

export interface FigureMaterials {
  points: THREE.ShaderMaterial;
  lines: THREE.ShaderMaterial;
}

/** One pair per card — the opacity clock is per card. `ink` is the face's
 *  reading ink for the theme (dawn on dark, latent night on parchment) and
 *  `gold` the mark's; `atlas` may be null until the fonts land, and the loop
 *  keeps the opacity at 0 while it is. */
export function createFigureMaterials(
  ink: string,
  gold: string,
  atlas: THREE.Texture | null
): FigureMaterials {
  const inkColour = new THREE.Color(ink);
  const goldColour = new THREE.Color(gold);
  const points = new THREE.ShaderMaterial({
    vertexShader: pointsVertex,
    fragmentShader: pointsFragment,
    uniforms: {
      uAtlas: { value: atlas },
      uInk: { value: inkColour },
      uGold: { value: goldColour },
      uOpacity: { value: 0 },
      uProj: { value: 1 },
      uCols: { value: ATLAS_COLS },
      uRows: { value: ATLAS_ROWS },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
  });
  const lines = new THREE.ShaderMaterial({
    vertexShader: linesVertex,
    fragmentShader: linesFragment,
    uniforms: {
      uInk: { value: inkColour },
      uOpacity: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
  });
  return { points, lines };
}

/** Device px per world unit at distance 1 — what turns `aWorld` into a
 *  `gl_PointSize`. Read once per frame off the canvas the ring is in. */
export function figureProjection(camera: THREE.Camera, cssHeight: number, dpr: number): number {
  const fov = (camera as THREE.PerspectiveCamera).fov ?? 40;
  return (cssHeight / (2 * Math.tan((fov * Math.PI) / 360))) * dpr;
}
