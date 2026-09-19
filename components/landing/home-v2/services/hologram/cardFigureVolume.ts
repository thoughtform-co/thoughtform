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
import { HOLO_LIGHT, type Body } from "@/lib/services-ring/figureFields";
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
export const ATLAS_ROWS = 4;
/** Tile index per node class (the record's cloud), and the first tile of the
 *  LATTICE's shaded ramp (nine glyphs, dark → light, at 4…12). */
export const GLYPH = { unlit: 0, lit: 1, mark: 2, open: 3, ramp0: 4 } as const;
/** The lattice's ramp — the raster's own (`cardViz.ts` VOL_RAMP), so the 2D
 *  and the 3D materials letter the same body with the same characters. */
export const LATTICE_RAMP = ["·", ":", "-", "=", "+", "*", "#", "%", "@"] as const;

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
    // 4…12 · the lattice's shaded ramp, PT Mono, one glyph per tile.
    ctx.font = '400 54px "PT Mono", "IBM Plex Mono", ui-monospace, monospace';
    LATTICE_RAMP.forEach((g, k) => {
      const i = GLYPH.ramp0 + k;
      const col = i % ATLAS_COLS;
      const row = Math.floor(i / ATLAS_COLS);
      ctx.fillText(g, col * ATLAS_TILE + c, row * ATLAS_TILE + c + 2);
    });
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

/* ═══════════════════════════════════════════════════════════════════════════
   THE LATTICE (owner, 2026-09-19, round three: "continue a bit with volume,
   where they protrude a bit … use a bit of the raster and have them
   protrude … not from the back of the card, only from the front, like some
   sort of hologram").

   A body from `figureFields` voxelised on the CARD'S OWN CELL GRID — the
   raster's pitch in x and y, the same pitch in z — keeping the surface shell,
   every cell a glyph off the shaded ramp (one light, ambient, rim, depth),
   every cell a sprite at its cell's world size. From the front it is the
   raster; the ring's turn and the rig's pointer-look reveal its depth. And it
   is thrown UP from the face: the body's back is seated on the face plane and
   the whole of it protrudes toward the viewer, never through the card.

   Cells are sorted far to near once, so NormalBlending composites them in
   depth order without a depth write (a depth write here would punch holes in
   the brandmark's point pass, the same reason the face keeps `depthWrite`
   off — `.claude/rules/services-ring.md`).
   ═══════════════════════════════════════════════════════════════════════════ */

/** The raster's cell, bake px — lockstep with `cardViz.ts` RASTER_PX. */
export const LATTICE_CELL_PX = 18;
/** The lattice's pitch in the band's unit space: one cell at R = 328. */
export const LATTICE_PITCH = LATTICE_CELL_PX / 328;
/** How much of the body's unit depth is spent in front of the face, in R. */
export const LATTICE_RELIEF = 0.62;
/** The grid's reach in unit space, each axis. */
const LATTICE_REACH = 1.25;
const LATTICE_EPS = 0.02;

/**
 * One body, one lattice. Returns the same two geometries the record's cloud
 * does (points + lines) so the ring mounts either through one child; the
 * lattice's lines are empty.
 */
export function buildLatticeGeometry(
  body: Body,
  cardW: number,
  cardHeight: number
): FigureGeometries {
  const { field, marks } = body;
  const n = Math.ceil((LATTICE_REACH * 2) / LATTICE_PITCH);
  const at = (i: number) => -LATTICE_REACH + (i + 0.5) * LATTICE_PITCH;
  // Pass one: occupancy.
  const inside = new Uint8Array(n * n * n);
  const idx = (i: number, j: number, k: number) => (k * n + j) * n + i;
  for (let k = 0; k < n; k++) {
    const z = at(k);
    for (let j = 0; j < n; j++) {
      const y = at(j);
      for (let i = 0; i < n; i++) {
        const x = at(i);
        if (x * x + y * y > 1.3 * 1.3) continue;
        if (field(x, y, z) < 0) inside[idx(i, j, k)] = 1;
      }
    }
  }
  // Pass two: the shell — an inside cell with an outside neighbour.
  const shell: { x: number; y: number; z: number; lum: number }[] = [];
  const [lx, ly, lz] = HOLO_LIGHT;
  let zMin = Infinity;
  let zMax = -Infinity;
  for (let k = 0; k < n; k++) {
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        if (!inside[idx(i, j, k)]) continue;
        const open =
          i === 0 ||
          j === 0 ||
          k === 0 ||
          i === n - 1 ||
          j === n - 1 ||
          k === n - 1 ||
          !inside[idx(i - 1, j, k)] ||
          !inside[idx(i + 1, j, k)] ||
          !inside[idx(i, j - 1, k)] ||
          !inside[idx(i, j + 1, k)] ||
          !inside[idx(i, j, k - 1)] ||
          !inside[idx(i, j, k + 1)];
        if (!open) continue;
        const x = at(i);
        const y = at(j);
        const z = at(k);
        const nx = field(x + LATTICE_EPS, y, z) - field(x - LATTICE_EPS, y, z);
        const ny = field(x, y + LATTICE_EPS, z) - field(x, y - LATTICE_EPS, z);
        const nz = field(x, y, z + LATTICE_EPS) - field(x, y, z - LATTICE_EPS);
        const nl = Math.hypot(nx, ny, nz) || 1;
        const lambert = Math.max(0, (nx * lx + ny * ly + nz * lz) / nl);
        const facing = Math.abs(nz / nl);
        const rim = 0.32 * (1 - facing) * (1 - facing);
        const shade = Math.min(1, 0.3 + 0.7 * lambert + rim);
        shell.push({ x, y, z, lum: shade });
        if (z < zMin) zMin = z;
        if (z > zMax) zMax = z;
      }
    }
  }
  if (!shell.length) {
    zMin = 0;
    zMax = 1;
  }
  // Far to near, for the blend.
  shell.sort((a, b) => a.z - b.z);

  const sx = cardW / BAKE_W;
  const sy = cardHeight / BAKE_H;
  const R = (BAND.h / 2) * sy;
  const cx = (BAND.x + BAND.w / 2 - BAKE_W / 2) * sx;
  const cy = (BAKE_H / 2 - (BAND.y + BAND.h / 2)) * sy;
  const cell = LATTICE_CELL_PX * sy * 1.12;
  const span = Math.max(1e-6, zMax - zMin);
  // The body's back on the face plane, its depth spent in front of it.
  const toLocalZ = (z: number) => 0.004 + (z - zMin) * R * LATTICE_RELIEF;

  const count = shell.length + marks.length;
  const pos = new Float32Array(count * 3);
  const glyph = new Float32Array(count);
  const world = new Float32Array(count);
  const alpha = new Float32Array(count);
  shell.forEach((c, i) => {
    const depth = (c.z - zMin) / span;
    const lum = c.lum * (0.6 + 0.4 * depth);
    const ramp = Math.min(
      LATTICE_RAMP.length - 1,
      Math.floor(Math.pow(lum, 0.8) * LATTICE_RAMP.length)
    );
    pos[i * 3] = cx + c.x * R;
    pos[i * 3 + 1] = cy - c.y * R;
    pos[i * 3 + 2] = toLocalZ(c.z);
    glyph[i] = GLYPH.ramp0 + ramp;
    world[i] = cell;
    alpha[i] = 0.35 + 0.65 * lum;
  });
  // The marks sit on the surface at their own x, y — the first inside cell
  // marching from the front.
  marks.forEach((m, k) => {
    const i = shell.length + k;
    let z = LATTICE_REACH;
    while (z > -LATTICE_REACH && field(m.x, m.y, z) >= 0) z -= LATTICE_PITCH;
    pos[i * 3] = cx + m.x * R;
    pos[i * 3 + 1] = cy - m.y * R;
    pos[i * 3 + 2] = toLocalZ(Math.max(zMin, z)) + 0.004;
    glyph[i] = GLYPH.mark;
    world[i] = m.r * SPRITE_PX.markPer * sy;
    alpha[i] = 1;
  });
  const points = new THREE.BufferGeometry();
  points.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  points.setAttribute("aGlyph", new THREE.BufferAttribute(glyph, 1));
  points.setAttribute("aWorld", new THREE.BufferAttribute(world, 1));
  points.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1));
  const lines = new THREE.BufferGeometry();
  lines.setAttribute("position", new THREE.BufferAttribute(new Float32Array(0), 3));
  lines.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(0), 1));
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
