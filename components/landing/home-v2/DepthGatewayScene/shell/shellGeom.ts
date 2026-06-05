/**
 * shellGeom — corridor-tuned constants for the brandmark's accreted
 * shell (substrate core, source orbits, surfaces skin).
 *
 * The accretion shell follows the guiding-star brandmark as it flies
 * Navigate -> Encode -> Build down the depth corridor (ADR-018). Each
 * layer emerges geometrically on its phase window and PERSISTS so the
 * mark visibly accumulates the layers of the intelligence-layer shell
 * and lands on the fully-assembled artifact at the Build station.
 *
 * World-unit sizing is anchored to the Intelligence substrate sphere
 * radius (`SUBSTRATE_HALF * SUBSTRATE_TO_SPHERE_RATIO` = 0.22 * 2.5 =
 * 0.55 world units, see `IntelligenceGate.tsx`) using the SAME
 * proportions as the standalone `NestedShellSphere` shell artifact
 * (substrate core : sources : surfaces ≈ 1.00 : 1.55 : 2.25):
 *
 *   - Substrate dodecahedron wraps the 0.55 sphere with a tight ~1.27x
 *     ratio (0.70) — visually proportional to the brandmark / sphere
 *     it cages, just like the lab artifact (where the cage is at 0.92
 *     and the brandmark cloud half-extent is 0.75, ratio 1.22x).
 *   - Source orbits sit OUTSIDE the cage in a band ~0.88..1.65 — every
 *     orbit's `min(rx, rx*eccentricity)` clears the dodecahedron with
 *     breathing room so the constellation visibly orbits AROUND the
 *     substrate, not through it.
 *   - Surfaces outer skin at 1.85 — ~2.6x the dodec, ~3.4x the
 *     substrate sphere; still fits the Intelligence gate `halfExtent`
 *     2.0 with breathing room and clears the outermost orbit.
 *
 * Tilts on the source orbits use Euler angles applied to an XY ellipse
 * via `buildTiltedRingLineLoop` (celestialRingUtils.ts) so each orbit
 * lives on its own 3D-inclined plane — a real solar system of crossing
 * ellipses, not coplanar rings.
 */

import * as THREE from "three";
import {
  COLOR_GOLD,
  COLOR_SOURCES,
  COLOR_SURFACES,
} from "@/components/landing/intelligence-artifact/artifactGeom";

// ── Substrate core (inside-out layer 1) ──────────────────────────────

/** Outer dodecahedron wrap radius. Tight 1.27x wrap around the
 *  0.55-radius substrate sphere — mirrors the standalone shell's
 *  cage-to-cloud ratio (0.92 / 0.75 = 1.22x). Sized this way so the
 *  cage reads as a proportional wrapper around the brandmark / sphere
 *  it cages, not as an oversized halo. The source orbits below MUST
 *  stay outside this radius. */
export const SUBSTRATE_DODEC_RADIUS = 0.7;

/** Inner geodesic shell radius. Sits inside the substrate sphere as
 *  a faint dawn hairline at ~0.6x the dodecahedron (matching the lab
 *  shell's inner detail-2 geodesic at 0.62x the core radius). At the
 *  Build landing the substrate morph cloud eclipses it visually; it
 *  reads strongest during the Navigate / Encode beats before the
 *  sphere has formed, where it gives the cage internal depth. */
export const SUBSTRATE_INNER_RADIUS = 0.42;

/** Dodecahedron subdivision detail. `0` keeps the canonical 12-face
 *  pentagonal cage — distinctive and recognizable. */
export const SUBSTRATE_DODEC_DETAIL = 0;

// ── Sources (inside-out layer 2) ─────────────────────────────────────

/** One inclined ellipse around the brandmark. `rx` is the semi-major
 *  radius (world units); `eccentricity = ry/rx` makes the orbit flat
 *  or round. `tilt` is XYZ Euler in radians, applied to the XY-plane
 *  ellipse, so each orbit lives on its own 3D-inclined plane. */
export interface ShellOrbit {
  /** Stable id (also used as a React key). */
  id: string;
  /** Semi-major axis (world units). */
  rx: number;
  /** Ellipse eccentricity = ry / rx (1 = round, 0.4 = very flat). */
  eccentricity: number;
  /** XYZ Euler tilt in radians applied to the XY ellipse. */
  tilt: readonly [number, number, number];
  /** Per-orbit revolve period (seconds for a full revolution). */
  periodSec: number;
  /** Revolve direction: +1 = positive parametric angle, -1 = inverted. */
  dir: 1 | -1;
  /** Starting parametric angle (radians) so the planets don't all
   *  start at the same phase. */
  phaseRad: number;
  /** Source-pip diamond radius (world units). */
  pipRadius: number;
  /** Stroke + pip color (hex literal — matches role-tier palette). */
  color: number;
  /** Base orbit ring opacity at full reveal. */
  baseAlpha: number;
}

/** A solar-system of six inclined elliptical orbits around the
 *  brandmark. Mix of round and flat ellipses, spread tilts across
 *  every axis so the orbits visibly cross when seen face-on (the
 *  astronomy-poster reference). Colors mix Sources green, gold, and
 *  dawn so the field reads as a layered chart, not a single-hue
 *  ring stack.
 *
 *  **Invariant — orbits sit OUTSIDE the substrate dodecahedron.** For
 *  every orbit, `min(rx, rx * eccentricity)` must be >= `SUBSTRATE_DODEC_RADIUS
 *  + 0.15` (clearance) so the orbit's closest approach to origin is
 *  clearly outside the cage in 3D space. The cage is a rigid solid;
 *  orbits are 1D paths that flow AROUND it. Without this clearance the
 *  flat ellipses cut through the cage and the inside-out story breaks. */
export const SHELL_ORBITS: readonly ShellOrbit[] = [
  {
    id: "01",
    rx: 1.1,
    eccentricity: 0.92,
    // Front-tilted plane, modest left bank — the "primary" inner orbit.
    // min radius = 1.01, clears the 0.70 dodec with 0.31 breathing.
    tilt: [0.42, 0.0, 0.22],
    periodSec: 18,
    dir: -1,
    phaseRad: 0.6,
    pipRadius: 0.04,
    color: COLOR_SOURCES,
    baseAlpha: 0.7,
  },
  {
    id: "02",
    rx: 1.55,
    eccentricity: 0.6,
    // Flat horizon orbit on a strong Y-axis tilt — reads as a long
    // ellipse crossing the others. min radius = 0.93, clears the dodec
    // with 0.23 breathing.
    tilt: [0.15, 0.62, -0.38],
    periodSec: 26,
    dir: 1,
    phaseRad: 1.4,
    pipRadius: 0.036,
    color: COLOR_SURFACES,
    baseAlpha: 0.55,
  },
  {
    id: "03",
    rx: 1.25,
    eccentricity: 0.95,
    // Steep polar tilt — the orbit sweeps near-vertical, crossing the
    // equatorial orbits at the top/bottom of its arc. min radius =
    // 1.19, clears comfortably.
    tilt: [1.18, 0.28, 0.0],
    periodSec: 22,
    dir: -1,
    phaseRad: 2.1,
    pipRadius: 0.04,
    color: COLOR_SOURCES,
    baseAlpha: 0.65,
  },
  {
    id: "04",
    rx: 1.6,
    eccentricity: 0.55,
    // Very flat + long horizon, tipped on the Y axis so it reads as
    // a wide outer track passing behind the inner orbits. min radius
    // = 0.88, clears with 0.18 breathing.
    tilt: [0.0, 1.25, 0.26],
    periodSec: 30,
    dir: 1,
    phaseRad: 3.6,
    pipRadius: 0.038,
    color: COLOR_GOLD,
    baseAlpha: 0.55,
  },
  {
    id: "05",
    rx: 1.0,
    eccentricity: 0.92,
    // Tight inner orbit on a triple-axis tilt — gives the innermost
    // body the most dynamic angle in the constellation. min radius =
    // 0.92, the closest orbit to the dodec.
    tilt: [0.72, -0.55, 0.62],
    periodSec: 14,
    dir: -1,
    phaseRad: 4.6,
    pipRadius: 0.032,
    color: COLOR_SURFACES,
    baseAlpha: 0.5,
  },
  {
    id: "06",
    rx: 1.5,
    eccentricity: 0.62,
    // Counter-tilted outer orbit — its inclination opposes orbit 02's
    // so the two long horizons read as a deliberate X-cross. min
    // radius = 0.93.
    tilt: [-0.42, 0.45, -0.82],
    periodSec: 24,
    dir: 1,
    phaseRad: 5.4,
    pipRadius: 0.036,
    color: COLOR_SOURCES,
    baseAlpha: 0.6,
  },
];

// ── Surfaces (inside-out layer 3) ────────────────────────────────────

/** Outer surfaces shell radius. Fits comfortably inside the
 *  Intelligence gate's `halfExtent` 2.0 with breathing room so the
 *  hairline wireframe doesn't run into the depth-corridor walls. */
export const SURFACES_OUTER_RADIUS = 1.85;

/** Detail level for the outer geodesic shell. `1` gives the classic
 *  80-face icosahedron — reads as engineered without looking
 *  low-poly. */
export const SURFACES_GEODESIC_DETAIL = 1;

/** Number of port-pip diamonds around the surfaces shell rim.
 *  Six pips reads as the canonical surface endpoints (Web / API /
 *  MCP / Slack / Cursor / Claude — the same family the standalone
 *  Aperture variant uses) without crowding the wireframe. */
export const SURFACES_PORT_COUNT = 6;

/** Outline diamond half-extent for the port pips (world units). */
export const SURFACES_PORT_SIZE = 0.085;

/** Y-axis tilt applied to the surfaces port ring so the pips don't
 *  sit on a primary axis — gives the outer skin a hand-flown feel. */
export const SURFACES_PORT_TILT_Y = (12 * Math.PI) / 180;

// ── Petal-unfold helpers (2026-06-05 revision) ──────────────────────
//
// The shell layers deploy with PETAL UNFOLD motion: each individual
// element (a dodecahedron face, a source orbit, a surfaces port)
// starts COLLAPSED AT THE BRAND MARK CENTER (position 0, scale 0)
// and unfolds OUTWARD to its final position + size as its per-element
// reveal ramps. Per-element reveals are STAGGERED inside the parent
// layer's reveal window so the layer reads as origami petals opening
// in a cascade around the mark, not a single uniform scale-up.
//
// Brandmark Principle 4 (`brandmark-choreography` skill): decorations
// emerge GEOMETRICALLY via scale + position lerp, NEVER via opacity.

/** Visibility-skip threshold. Layers/elements with reveal below this
 *  hide their group entirely so the GPU doesn't spend draw calls on
 *  zero-scale geometry. */
export const EMERGE_EPSILON = 0.005;

/** Stagger an individual element's reveal inside the parent layer's
 *  reveal window. Element 0 starts unfolding at parent reveal 0;
 *  element `total - 1` finishes at parent reveal 1; intermediate
 *  elements unfold in between with `overlap` controlling how much
 *  consecutive windows overlap (0 = no overlap / strict round-robin,
 *  1 = all elements unfold together).
 *
 *  With `overlap = 0.55` and `total = 12`, each element's window
 *  spans ~17% of the parent reveal and neighbours overlap by ~55%
 *  — reads as a cascade, not a slow parade. */
export function petalStagger(reveal: number, idx: number, total: number, overlap = 0.55): number {
  if (total <= 1) return reveal;
  // Solve for window size `f` so the first element starts at 0, the
  // last ends at 1, and consecutive windows overlap by `overlap * f`.
  // Derivation: with step = (1 - f) / (total - 1) between starts and
  // overlap fraction p of f, f - step = p * f  =>
  // f = 1 / [(1 - p)(total - 1) + 1].
  const f = 1 / ((1 - overlap) * (total - 1) + 1);
  const step = (1 - f) / (total - 1);
  const start = idx * step;
  const t = (reveal - start) / f;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/** Per-element unfold output. `scale` is applied via `group.scale.setScalar`;
 *  `positionT` is the lerp factor from origin (0,0,0) to the element's
 *  final outward position. Both share the same smootherstep curve so
 *  the face's position and size ramp together — no mismatch where a
 *  face is at full size at the origin. */
export interface PetalEmerge {
  scale: number;
  positionT: number;
}

/** Map a staggered per-element reveal to its `{scale, positionT}`
 *  pair. Uses smootherstep (6t^5 - 15t^4 + 10t^3) for elegant
 *  ease-in-and-out — gentler than smoothstep so the unfold reads as
 *  a settle rather than a snap. */
export function petalEmerge(stagger: number): PetalEmerge {
  const t = stagger < 0 ? 0 : stagger > 1 ? 1 : stagger;
  const s = t * t * t * (t * (t * 6 - 15) + 10);
  return { scale: s, positionT: s };
}

/** Legacy single-scalar emerge helper. Kept as an alias of the new
 *  `petalEmerge(reveal).scale` so any caller that hasn't migrated to
 *  per-element unfold still gets the same smootherstep scale ramp. */
export function splitEmerge(reveal: number): number {
  return petalEmerge(reveal).scale;
}

// ── Dodecahedron face decomposition (ShellSubstrate) ─────────────────

/** A single pentagonal face of a regular dodecahedron, expressed in
 *  the world-space frame of the shell (parent group). The pentagon's
 *  vertices are given as offsets FROM the face centroid, so a face
 *  rendered at `group.position = centroid` paints in its correct
 *  world orientation — no quaternion needed because the offsets
 *  already encode the face plane.
 *
 *  Used by `ShellSubstrate` to render each face as its own
 *  `<lineLoop>` sub-group that petal-unfolds from origin -> centroid. */
export interface DodecahedronFace {
  /** World-space final position of the face centroid. */
  centroid: [number, number, number];
  /** World-space outward unit normal of the face. */
  normal: [number, number, number];
  /** The five pentagon vertices in face-local coords (vertex - centroid),
   *  ordered counter-clockwise around the face centroid in the face plane. */
  localVertices: Array<[number, number, number]>;
}

/** Decompose a regular dodecahedron of the given circumradius (vertex
 *  distance from center) into its 12 pentagonal faces. Uses
 *  `THREE.DodecahedronGeometry` to source the canonical vertex set,
 *  then clusters its 36 triangles by face normal and angle-sorts the
 *  pentagon vertices around each face centroid.
 *
 *  Geometry is allocated + immediately disposed inside the helper;
 *  the returned face descriptors are plain JS data that the consumer
 *  can use to build its own per-face line-loop geometries. */
export function buildDodecahedronFaces(radius: number): DodecahedronFace[] {
  const geom = new THREE.DodecahedronGeometry(radius, 0);
  const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;
  const normalAttr = geom.getAttribute("normal") as THREE.BufferAttribute;
  const triCount = posAttr.count / 3;

  interface RawFace {
    normal: [number, number, number];
    verts: Array<[number, number, number]>;
  }
  const rawFaces: RawFace[] = [];

  for (let t = 0; t < triCount; t++) {
    const i0 = t * 3;
    const nx = normalAttr.getX(i0);
    const ny = normalAttr.getY(i0);
    const nz = normalAttr.getZ(i0);

    let face = rawFaces.find(
      (f) =>
        Math.abs(f.normal[0] - nx) < 1e-3 &&
        Math.abs(f.normal[1] - ny) < 1e-3 &&
        Math.abs(f.normal[2] - nz) < 1e-3
    );
    if (!face) {
      face = { normal: [nx, ny, nz], verts: [] };
      rawFaces.push(face);
    }
    for (let v = 0; v < 3; v++) {
      const vx = posAttr.getX(i0 + v);
      const vy = posAttr.getY(i0 + v);
      const vz = posAttr.getZ(i0 + v);
      const dup = face.verts.some(
        ([ex, ey, ez]) =>
          Math.abs(ex - vx) < 1e-3 && Math.abs(ey - vy) < 1e-3 && Math.abs(ez - vz) < 1e-3
      );
      if (!dup) face.verts.push([vx, vy, vz]);
    }
  }

  geom.dispose();

  // Build the per-face descriptor: centroid, normal, and pentagon
  // vertices sorted angularly around the centroid in the face plane.
  return rawFaces.map((face) => {
    const cx = face.verts.reduce((s, v) => s + v[0], 0) / face.verts.length;
    const cy = face.verts.reduce((s, v) => s + v[1], 0) / face.verts.length;
    const cz = face.verts.reduce((s, v) => s + v[2], 0) / face.verts.length;
    const centroid: [number, number, number] = [cx, cy, cz];

    // Build a 2D basis in the face plane for angle sorting. Pick a
    // reference 'up' direction that's not parallel to the face normal.
    const [nx, ny, nz] = face.normal;
    const refUp: [number, number, number] = Math.abs(ny) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const ux = refUp[1] * nz - refUp[2] * ny;
    const uy = refUp[2] * nx - refUp[0] * nz;
    const uz = refUp[0] * ny - refUp[1] * nx;
    const uLen = Math.max(1e-6, Math.sqrt(ux * ux + uy * uy + uz * uz));
    const u: [number, number, number] = [ux / uLen, uy / uLen, uz / uLen];
    const v: [number, number, number] = [
      ny * u[2] - nz * u[1],
      nz * u[0] - nx * u[2],
      nx * u[1] - ny * u[0],
    ];

    const withAngle = face.verts.map((vert) => {
      const dx = vert[0] - cx;
      const dy = vert[1] - cy;
      const dz = vert[2] - cz;
      const uc = dx * u[0] + dy * u[1] + dz * u[2];
      const vc = dx * v[0] + dy * v[1] + dz * v[2];
      return { vert, angle: Math.atan2(vc, uc) };
    });
    withAngle.sort((a, b) => a.angle - b.angle);

    const localVertices: Array<[number, number, number]> = withAngle.map(({ vert }) => [
      vert[0] - cx,
      vert[1] - cy,
      vert[2] - cz,
    ]);

    return { centroid, normal: face.normal, localVertices };
  });
}
