/* The brand mark as a 3D solid, and the numbers the scene builds on.

   The mark's own vector paths (`lib/brandmark/brandmarkPaths.ts`, the one
   record) extruded with three's ExtrudeGeometry: no asset, no new format. The
   scene's unit is the ring's outer radius: the mark's centre (the ring's inner
   circle, measured at 209.3, 229.4 in the 430.99 × 436 viewBox) is the origin,
   y up, the face at +z. Every other number here is in the same units. */

import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { BRANDMARK_PATHS, BRANDMARK_VIEWBOX } from "@/lib/brandmark/brandmarkPaths";

const CX = 209.3;
const CY = 229.4;
const UNIT = 206; // mark units per scene unit: the ring's outer radius
const toScene = (mx: number, my: number): [number, number] => [(mx - CX) / UNIT, -(my - CY) / UNIT];

/** The extrusion, scene units. */
export const DEPTH = 0.09;

/** The slanted bar: a point on its centre line, its direction (down the
    bar), its normal toward the machine side (+x), its half width. */
const A = toScene(238.75, 20);
const B = toScene(169.5, 400);
const len = Math.hypot(B[0] - A[0], B[1] - A[1]);
const dir: [number, number] = [(B[0] - A[0]) / len, (B[1] - A[1]) / len];
export const SLANT = { a: A, normal: [-dir[1], dir[0]] as [number, number], half: 11.56 / UNIT };
if (SLANT.normal[0] < 0) SLANT.normal = [-SLANT.normal[0], -SLANT.normal[1]];

/** The level bar's band, y. */
export const LEVEL = { mid: -((219 + 236.2) / 2 - CY) / UNIT, half: (236.2 - 219) / 2 / UNIT };

/** Where the bars cross. */
export const CROSSING: [number, number] = (() => {
  const t = (LEVEL.mid - A[1]) / dir[1];
  return [A[0] + dir[0] * t, LEVEL.mid];
})();

/** Inside the ring's thinnest inner edge (179.8 / 206), less a margin. */
export const INNER = 0.84;

/** The mark extruded: the ring (paths 0, 1) and the bars and stepped block
    (path 5). The hairline paths extrude into slivers and are left out. */
export function markSolid(): THREE.BufferGeometry {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BRANDMARK_VIEWBOX.w} ${BRANDMARK_VIEWBOX.h}">${[0, 1, 5].map((i) => `<path d="${BRANDMARK_PATHS[i]}"/>`).join("")}</svg>`;
  const data = new SVGLoader().parse(svg);
  const depth = DEPTH * UNIT;
  const parts: THREE.BufferGeometry[] = [];
  for (const path of data.paths) {
    for (const shape of SVGLoader.createShapes(path)) {
      const g = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelThickness: 1.6,
        bevelSize: 1.1,
        bevelSegments: 4,
        curveSegments: 48,
      });
      parts.push(g.index ? g.toNonIndexed() : g);
    }
  }
  const merged = mergeGeometries(parts, false)!;
  parts.forEach((p) => p.dispose());
  // centre on the ring, flip to y up with a rotation (a negative scale would
  // turn the faces inside out), the face toward +z, ring radius 1
  const m = new THREE.Matrix4()
    .makeScale(1 / UNIT, 1 / UNIT, 1 / UNIT)
    .multiply(new THREE.Matrix4().makeRotationX(Math.PI))
    .multiply(new THREE.Matrix4().makeTranslation(-CX, -CY, -depth / 2));
  merged.applyMatrix4(m);
  merged.computeVertexNormals();
  return merged;
}

/** The ring's middle radius at an angle (scene radians, counter-clockwise from
    +x), for the light that runs round it: the logo's ring is thick at the
    lower left and thin at the top right. */
export const ringMid = (phi: number) => 0.93 - 0.035 * Math.cos(phi - Math.PI * 1.22);
