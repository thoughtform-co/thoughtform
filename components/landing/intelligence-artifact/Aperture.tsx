"use client";

/**
 * Aperture — variant G of the intelligence-layer artifact.
 *
 * Substrate as instrument. The substrate icosphere is faceted with
 * triangular panels; a deliberate SUBSET of those facets is
 * highlighted as "interface windows" — each carries a short uppercase
 * label (API / MCP / Web / Slack / Cursor / Claude). The poetic move:
 * an interface IS a window, so the geodesic sphere literally becomes
 * a frame full of windows the layer can be called through.
 *
 * Around the substrate, the Sources orbit as small planets on
 * individual tilted elliptical paths. Each planet has its own angular
 * velocity, so the constellation reads as a working system in motion
 * (work flowing in from many sources) rather than a static diagram.
 *
 * Composition:
 *
 *   - SubstrateBrandmark (centre, gold): brandmark cloud only — the
 *     wireframe is rendered locally by this variant so we can light
 *     up specific facets.
 *   - Geodesic sphere wireframe (detail = 0, 20 facets) at the same
 *     radius. Six highlighted facets are filled with dawn at low
 *     alpha + a brighter outline; the rest paint as ordinary gold
 *     edges so the windows read as a deliberate subset.
 *   - Interface window labels (dawn, mono uppercase) projected onto
 *     each highlighted facet's centroid every frame. Back-face
 *     culling hides labels whose facet has rotated behind the sphere.
 *   - Source planets (Atreides green, four): each on its own
 *     elliptical orbit with a faint hairline path. Spin rates vary so
 *     the planets never align into a circle.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { AnchorProjector } from "./AnchorProjector";
import {
  APERTURE_WINDOWS,
  type ArtifactAnchors,
  COLOR_GOLD,
  COLOR_GOLD_RIM,
  COLOR_SOURCES,
  COLOR_SURFACES,
  GATEWAY_RADIUS,
  GATEWAY_Z_END,
  GATEWAY_Z_START,
  PHASES,
  PYLON_CAP_SIZE,
  SUBSTRATE_RADIUS,
  clamp01,
  lerp,
  phasePresence,
  smoothstep,
} from "./artifactGeom";
import {
  buildFilledDiamondGeometry,
  buildPolygonGeometry,
  buildXYPolygonGeometry,
  makeLineMaterial,
  makeMeshMaterial,
} from "./artifactPrimitives";
import { SubstrateBrandmark } from "./SubstrateBrandmark";

interface ApertureProps {
  progress: number;
  reducedMotion?: boolean;
}

/** Icosahedron detail for the wireframe + windows. 0 = 20 large
 *  triangular faces, which is the right granularity for "a few
 *  windows on the sphere". */
const ICO_DETAIL = 0;

/** Sphere radius. Matches `SubstrateBrandmark`'s default so the
 *  brandmark cloud fits inside the wireframe cleanly. */
const APERTURE_RADIUS = SUBSTRATE_RADIUS;

/** How far outside the sphere surface the window label sits. */
const WINDOW_LABEL_OFFSET = 0.35;

interface PlanetSpec {
  /** Orbit semi-major axis. */
  radius: number;
  /** Orbit eccentricity (radius * (1 - e) along minor axis). */
  flatten: number;
  /** Orbit tilt euler (radians). */
  tilt: readonly [number, number, number];
  /** Angular speed (radians per second). */
  speed: number;
  /** Phase offset so the planets never align at start. */
  phase: number;
}

const PLANETS: readonly PlanetSpec[] = [
  {
    radius: APERTURE_RADIUS * 1.6,
    flatten: 0.92,
    tilt: [(28 * Math.PI) / 180, 0, (12 * Math.PI) / 180],
    speed: 0.32,
    phase: 0,
  },
  {
    radius: APERTURE_RADIUS * 1.95,
    flatten: 0.85,
    tilt: [(-18 * Math.PI) / 180, (10 * Math.PI) / 180, (-6 * Math.PI) / 180],
    speed: 0.21,
    phase: Math.PI * 0.4,
  },
  {
    radius: APERTURE_RADIUS * 2.25,
    flatten: 0.94,
    tilt: [(42 * Math.PI) / 180, 0, (-22 * Math.PI) / 180],
    speed: 0.14,
    phase: Math.PI * 0.9,
  },
  {
    radius: APERTURE_RADIUS * 1.75,
    flatten: 0.88,
    tilt: [(-8 * Math.PI) / 180, (-14 * Math.PI) / 180, (28 * Math.PI) / 180],
    speed: 0.26,
    phase: Math.PI * 1.5,
  },
];

const CAMERA_POSITION: readonly [number, number, number] = [0, 0.55, 5.4];
const CAMERA_LOOK_AT: readonly [number, number, number] = [0, 0, 0];

const APERTURE_ANCHORS: ArtifactAnchors = {
  // Sources anchor — sits on the largest orbit so the leader connects
  // to where a planet visibly is when the artifact has fully resolved.
  sources: [PLANETS[2].radius * 0.95, 0.1, 0],
  // Substrate anchor — sphere centre.
  substrate: [0, 0, 0],
  // Surfaces anchor — placed on the rim of the FIRST highlighted
  // window so the leader connects to a real interface facet.
  surfaces: [0, APERTURE_RADIUS * 0.85, APERTURE_RADIUS * 0.55],
};

/** Compute the centroid AND outward normal of every face of a
 *  triangular `IcosahedronGeometry`. Indices into the returned array
 *  match face indices used by `APERTURE_WINDOWS.faceIndex`. */
interface FaceInfo {
  centroid: THREE.Vector3;
  normal: THREE.Vector3;
}

function buildFaceInfo(geom: THREE.BufferGeometry): FaceInfo[] {
  const pos = geom.getAttribute("position") as THREE.BufferAttribute;
  const out: FaceInfo[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const total = pos.count / 3;
  for (let f = 0; f < total; f++) {
    a.fromBufferAttribute(pos, f * 3 + 0);
    b.fromBufferAttribute(pos, f * 3 + 1);
    c.fromBufferAttribute(pos, f * 3 + 2);
    const centroid = new THREE.Vector3(
      (a.x + b.x + c.x) / 3,
      (a.y + b.y + c.y) / 3,
      (a.z + b.z + c.z) / 3
    );
    ab.copy(b).sub(a);
    ac.copy(c).sub(a);
    const normal = new THREE.Vector3().crossVectors(ab, ac).normalize();
    out.push({ centroid, normal });
  }
  return out;
}

/** Build a `BufferGeometry` containing JUST the highlighted faces (as
 *  triangle soup) so they can be painted with a filled mesh. */
function buildHighlightedFacesGeometry(
  base: THREE.BufferGeometry,
  faceIndices: ReadonlyArray<number>
): THREE.BufferGeometry {
  const pos = base.getAttribute("position") as THREE.BufferAttribute;
  const positions = new Float32Array(faceIndices.length * 3 * 3);
  faceIndices.forEach((f, slot) => {
    for (let v = 0; v < 3; v++) {
      const baseIdx = f * 3 + v;
      positions[slot * 9 + v * 3] = pos.getX(baseIdx);
      positions[slot * 9 + v * 3 + 1] = pos.getY(baseIdx);
      positions[slot * 9 + v * 3 + 2] = pos.getZ(baseIdx);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.computeVertexNormals();
  return g;
}

/** Build a `BufferGeometry` containing the triangle edges of the
 *  highlighted faces as line segments, for the bright outline. */
function buildHighlightedFaceEdgesGeometry(
  base: THREE.BufferGeometry,
  faceIndices: ReadonlyArray<number>
): THREE.BufferGeometry {
  const pos = base.getAttribute("position") as THREE.BufferAttribute;
  // 3 edges per face, 2 vertices per edge.
  const positions = new Float32Array(faceIndices.length * 3 * 2 * 3);
  let cursor = 0;
  for (const f of faceIndices) {
    const a = [pos.getX(f * 3), pos.getY(f * 3), pos.getZ(f * 3)];
    const b = [pos.getX(f * 3 + 1), pos.getY(f * 3 + 1), pos.getZ(f * 3 + 1)];
    const c = [pos.getX(f * 3 + 2), pos.getY(f * 3 + 2), pos.getZ(f * 3 + 2)];
    const writeEdge = (p: number[], q: number[]) => {
      positions[cursor++] = p[0];
      positions[cursor++] = p[1];
      positions[cursor++] = p[2];
      positions[cursor++] = q[0];
      positions[cursor++] = q[1];
      positions[cursor++] = q[2];
    };
    writeEdge(a, b);
    writeEdge(b, c);
    writeEdge(c, a);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

/** Build a tilted ellipse on the XY plane (later rotated via group). */
function buildOrbitGeometry(
  radius: number,
  flatten: number,
  segments: number = 96
): THREE.BufferGeometry {
  const positions = new Float32Array(segments * 3);
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * radius;
    positions[i * 3 + 1] = Math.sin(a) * radius * flatten;
    positions[i * 3 + 2] = 0;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

export function Aperture({ progress, reducedMotion = false }: ApertureProps) {
  const rootRef = useRef<THREE.Group>(null);
  const planetRefs = useRef<Array<THREE.Group | null>>([]);
  const lastWrite = useRef<Record<string, string>>({});

  // ── Geometries ─────────────────────────────────────────────────
  const geoms = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(APERTURE_RADIUS, ICO_DETAIL);
    const baseEdges = new THREE.EdgesGeometry(ico);

    const faceIndices = APERTURE_WINDOWS.map((w) => w.faceIndex);
    const highlightFaces = buildHighlightedFacesGeometry(ico, faceIndices);
    const highlightEdges = buildHighlightedFaceEdgesGeometry(ico, faceIndices);

    const faceInfo = buildFaceInfo(ico);

    // We keep the ico itself disposed because we've already extracted
    // edges + per-face data from it.
    ico.dispose();

    const orbits = PLANETS.map((p) => buildOrbitGeometry(p.radius, p.flatten));
    const planetDiamond = buildFilledDiamondGeometry(PYLON_CAP_SIZE * 0.6);

    const gateway = buildPolygonGeometry(GATEWAY_RADIUS, 24, 0);

    // Surfaces leader anchor stake — a small diamond rendered at the
    // chosen `APERTURE_ANCHORS.surfaces` position so the leader line
    // visibly attaches to something on the sphere rather than empty
    // space.
    const surfacesAnchorMarker = buildXYPolygonGeometry(0.08, 4);

    return {
      baseEdges,
      highlightFaces,
      highlightEdges,
      faceInfo,
      orbits,
      planetDiamond,
      gateway,
      surfacesAnchorMarker,
    };
  }, []);

  // ── Materials ──────────────────────────────────────────────────
  const mats = useMemo(
    () => ({
      baseEdges: makeLineMaterial(COLOR_GOLD, 0, true),
      windowFill: makeMeshMaterial(COLOR_SURFACES, 0),
      windowEdges: makeLineMaterial(COLOR_SURFACES, 0, true),
      orbit: makeLineMaterial(COLOR_SOURCES, 0),
      planet: makeMeshMaterial(COLOR_SOURCES, 0),
      surfacesAnchorMarker: makeLineMaterial(COLOR_GOLD_RIM, 0, true),
      gateway: makeLineMaterial(COLOR_GOLD, 0, true),
    }),
    []
  );

  // ── Dispose ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      geoms.baseEdges.dispose();
      geoms.highlightFaces.dispose();
      geoms.highlightEdges.dispose();
      geoms.orbits.forEach((g) => g.dispose());
      geoms.planetDiamond.dispose();
      geoms.gateway.dispose();
      geoms.surfacesAnchorMarker.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [geoms, mats]);

  // ── Per-frame ──────────────────────────────────────────────────
  const { camera, gl, scene } = useThree();
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const cameraScratch = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const p = clamp01(progress);

    const gatewayP = phasePresence(p, PHASES.gateway, 0.04);
    const sourcesP = phasePresence(p, PHASES.sources);
    const substrateP = phasePresence(p, PHASES.substrate);
    const surfacesP = phasePresence(p, PHASES.surfaces);
    const resolvedP = phasePresence(p, PHASES.resolved);
    void substrateP;

    mats.baseEdges.opacity = substrateP * 0.55;
    mats.windowFill.opacity = surfacesP * 0.22;
    mats.windowEdges.opacity = surfacesP * 0.9;
    mats.orbit.opacity = sourcesP * 0.35;
    mats.planet.opacity = sourcesP * 0.95;
    mats.surfacesAnchorMarker.opacity = surfacesP * 0.75;
    mats.gateway.opacity = gatewayP * 0.95;

    // Spin the whole artifact slowly so all six windows rotate into
    // view over a cycle. Disabled in reduced motion.
    if (rootRef.current && !reducedMotion) {
      const spin = 0.05 + resolvedP * 0.04;
      rootRef.current.rotation.y += spin * (1 / 60);
    }

    // Orbit the planets. Each planet group's parent applies the orbit
    // tilt; the child position lerps around an ellipse in its local
    // frame.
    if (!reducedMotion) {
      planetRefs.current.forEach((group, i) => {
        if (!group) return;
        const spec = PLANETS[i];
        const angle = spec.phase + t * spec.speed;
        const x = Math.cos(angle) * spec.radius;
        const y = Math.sin(angle) * spec.radius * spec.flatten;
        group.position.set(x, y, 0);
      });
    }

    // Project window label centroids to screen pixels + back-face
    // cull. We update inline styles on `[data-aperture-window]`
    // DIVs (rendered as siblings of the canvas in
    // IntelligenceArtifactScene). Visibility falls off as the facet
    // normal turns away from the camera.
    scene.updateMatrixWorld();
    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) return;

    const rootWorld = rootRef.current?.matrixWorld ?? null;
    // Camera world position for the back-face dot product.
    camera.getWorldPosition(cameraScratch);

    for (const win of APERTURE_WINDOWS) {
      const info = geoms.faceInfo[win.faceIndex];
      if (!info) continue;
      scratch.copy(info.centroid);
      if (rootWorld) scratch.applyMatrix4(rootWorld);
      // Outward offset for the label position.
      const offsetVec = info.normal.clone();
      if (rootWorld) {
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(rootWorld);
        offsetVec.applyMatrix3(normalMatrix).normalize();
      }
      scratch.addScaledVector(offsetVec, WINDOW_LABEL_OFFSET);

      // Back-face: compute the face normal's dot with the
      // camera-to-facet direction. If negative, the facet is facing
      // away from the camera; hide the label.
      const facingDot = offsetVec.dot(
        new THREE.Vector3().copy(cameraScratch).sub(scratch).normalize()
      );

      const projected = scratch.project(camera);
      if (
        !Number.isFinite(projected.x) ||
        !Number.isFinite(projected.y) ||
        projected.z > 1.05 ||
        projected.z < -1.05
      ) {
        continue;
      }
      const px = ((projected.x + 1) / 2) * rect.width;
      const py = ((1 - projected.y) / 2) * rect.height;

      const labelEl = document.querySelector<HTMLElement>(`[data-aperture-window="${win.id}"]`);
      if (!labelEl) continue;
      const xKey = `${win.id}-x`;
      const yKey = `${win.id}-y`;
      const oKey = `${win.id}-o`;
      const xVal = `${px.toFixed(1)}px`;
      const yVal = `${py.toFixed(1)}px`;
      const opacity = surfacesP * clamp01(facingDot * 1.6);
      const oVal = opacity.toFixed(3);
      if (lastWrite.current[xKey] !== xVal) {
        labelEl.style.left = xVal;
        lastWrite.current[xKey] = xVal;
      }
      if (lastWrite.current[yKey] !== yVal) {
        labelEl.style.top = yVal;
        lastWrite.current[yKey] = yVal;
      }
      if (lastWrite.current[oKey] !== oVal) {
        labelEl.style.opacity = oVal;
        lastWrite.current[oKey] = oVal;
      }
    }

    // Camera back to Aperture frame each tick.
    state.camera.position.set(...CAMERA_POSITION);
    state.camera.lookAt(...CAMERA_LOOK_AT);
  });

  const gatewayZ = lerp(GATEWAY_Z_START, GATEWAY_Z_END, smoothstep(0, 0.16, progress));
  const substratePresence = phasePresence(clamp01(progress), PHASES.substrate);
  const resolvedPresence = phasePresence(clamp01(progress), PHASES.resolved);

  return (
    <group ref={rootRef}>
      <ambientLight intensity={0.32} />

      <lineLoop
        geometry={geoms.gateway}
        material={mats.gateway}
        position={[0, 1.0, gatewayZ]}
        frustumCulled={false}
      />

      {/* Geodesic substrate wireframe (detail = 0, large facets) */}
      <lineSegments geometry={geoms.baseEdges} material={mats.baseEdges} frustumCulled={false} />

      {/* Highlighted interface windows: filled mesh + bright outline */}
      <mesh geometry={geoms.highlightFaces} material={mats.windowFill} frustumCulled={false} />
      <lineSegments
        geometry={geoms.highlightEdges}
        material={mats.windowEdges}
        frustumCulled={false}
      />

      {/* Substrate cloud + brandmark (no outer shell — we render our own) */}
      <SubstrateBrandmark
        presence={substratePresence}
        resolved={resolvedPresence}
        reducedMotion={reducedMotion}
        radius={APERTURE_RADIUS}
        showOuterShell={false}
        showInnerShell={false}
      />

      {/* Surfaces anchor marker — tiny diamond at the leader's tip so
          the line lands on visible geometry. */}
      <lineLoop
        geometry={geoms.surfacesAnchorMarker}
        material={mats.surfacesAnchorMarker}
        position={APERTURE_ANCHORS.surfaces as [number, number, number]}
        frustumCulled={false}
      />

      {/* Orbiting source planets. Each orbit is a tilted ellipse in
          its own parent group; the inner planet group is repositioned
          per frame to traverse the ellipse. */}
      {PLANETS.map((spec, i) => (
        <group key={`orbit-${i}`} rotation={spec.tilt}>
          <lineLoop geometry={geoms.orbits[i]} material={mats.orbit} frustumCulled={false} />
          <group
            ref={(g) => {
              planetRefs.current[i] = g;
            }}
          >
            <mesh geometry={geoms.planetDiamond} material={mats.planet} frustumCulled={false} />
          </group>
        </group>
      ))}

      <AnchorProjector anchors={APERTURE_ANCHORS} trackGroupRef={rootRef} />
    </group>
  );
}
