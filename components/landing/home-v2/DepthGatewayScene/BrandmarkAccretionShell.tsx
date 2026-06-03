"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getBrandmarkAccretionLayers, getBrandmarkWorldPosition } from "./sceneGeom";

/**
 * BrandmarkAccretionShell — progressive layers that accumulate
 * AROUND the brandmark as it travels through the corridor (ADR-013
 * north-star contract: the mark itself never changes, but what
 * surrounds it accretes). Plan 03adb0dd · W3.
 *
 * The shell tracks `getBrandmarkWorldPosition(paintProgress)` every
 * frame so all sub-meshes stay centred on the mark through Lead
 * mode. Each sub-layer fades in on its own reveal envelope from
 * `CORRIDOR_TIMELINE.accretion` (`getBrandmarkAccretionLayers`):
 *
 *   - Navigate halo : thin bearing-tick ring (transient cue). Reads
 *                     as the mark being on instrument flight.
 *   - Encode nodes  : 6 wireframe "rack" cards in an annulus around
 *                     the mark + additive data nodes scattered in
 *                     the same band. Reads as judgment being encoded
 *                     into nodes around the north star.
 *   - Build surfaces: 5 stacked translucent wireframe interface
 *                     planes fanning around the mark. Reads as
 *                     surfaces / MCP-style endpoints sitting on top
 *                     of the encoded substrate. Recedes into the
 *                     substrate cloud at landing so the morph
 *                     silhouette can read.
 *
 * Geometry follows the established home-v2 patterns: `lineLoop` /
 * `lineSegments` for wireframes, additive `points` for data nodes.
 * No instanced meshes (ADR-018). All three sub-layers share one
 * group transform so the shell is repositioned with a single
 * `group.position.copy(...)` per frame.
 *
 * Center stays clear — the rack frames sit in an annulus and the
 * planes sit on a half-shell behind the mark so the brandmark itself
 * remains the optical centre.
 *
 * Mobile / reduced-motion: counts drop and the Build surface stack
 * thins (Encode racks 6 → 3, nodes 60 → 24). The shell is still
 * rendered so the "more layered the further it travels" read holds,
 * just at a lighter density.
 */

const ANNULUS_INNER = 0.7;
const ANNULUS_OUTER = 1.65;

const NAVIGATE_HALO_RADIUS = 0.55;
const NAVIGATE_TICK_COUNT = 24;
const NAVIGATE_TICK_INNER = 0.5;
const NAVIGATE_TICK_OUTER = 0.6;

const ENCODE_RACK_COUNT_DESKTOP = 6;
const ENCODE_RACK_COUNT_MOBILE = 3;
const ENCODE_NODE_COUNT_DESKTOP = 60;
const ENCODE_NODE_COUNT_MOBILE = 24;
const ENCODE_RACK_WIDTH = 0.28;
const ENCODE_RACK_HEIGHT = 0.36;
const ENCODE_RACK_RADIUS = 1.15;

const BUILD_PLANE_COUNT_DESKTOP = 5;
const BUILD_PLANE_COUNT_MOBILE = 3;
const BUILD_PLANE_WIDTH = 1.5;
const BUILD_PLANE_HEIGHT = 0.95;
const BUILD_PLANE_FAN_ARC = Math.PI * 0.72;
const BUILD_PLANE_RADIUS = 1.45;
const BUILD_PLANE_Z_STEP = -0.18;

const COLOR_GOLD = new THREE.Color("#caa554");
const COLOR_DAWN = new THREE.Color("#ebe3d6");

// ─── Geometry builders ────────────────────────────────────────────

/** A single closed-loop ring in the XY plane. Used for the Navigate
 *  halo (one ring) and the Encode annulus reference grid. */
function buildRingGeometry(radius: number, segments = 96): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  const positions = new Float32Array(segments * 3);
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    positions[i * 3] = Math.cos(t) * radius;
    positions[i * 3 + 1] = Math.sin(t) * radius;
    positions[i * 3 + 2] = 0;
  }
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

/** Radial ticks around the halo — small line segments pointing
 *  outward at evenly spaced angles. Mirrors the compass-gate tick
 *  pattern so the halo reads as "instrument" not "decorative ring". */
function buildHaloTicksGeometry(): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  const positions = new Float32Array(NAVIGATE_TICK_COUNT * 2 * 3);
  for (let i = 0; i < NAVIGATE_TICK_COUNT; i++) {
    const t = (i / NAVIGATE_TICK_COUNT) * Math.PI * 2;
    const cx = Math.cos(t);
    const cy = Math.sin(t);
    positions[i * 6] = cx * NAVIGATE_TICK_INNER;
    positions[i * 6 + 1] = cy * NAVIGATE_TICK_INNER;
    positions[i * 6 + 2] = 0;
    positions[i * 6 + 3] = cx * NAVIGATE_TICK_OUTER;
    positions[i * 6 + 4] = cy * NAVIGATE_TICK_OUTER;
    positions[i * 6 + 5] = 0;
  }
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

/** Wireframe "rack" card outlines arranged in an annulus around
 *  the mark. Each rack is a thin rectangle facing the camera, with
 *  a couple of internal divider lines so it reads as a stack of
 *  shelves / records rather than a plain frame. The racks sit at
 *  fixed angular positions on a ring of `ENCODE_RACK_RADIUS`. */
function buildEncodeRacksGeometry(count: number): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  const SEGMENTS_PER_RACK = 4 + 3; // 4 frame + 3 dividers
  const positions = new Float32Array(count * SEGMENTS_PER_RACK * 2 * 3);
  let p = 0;

  const writeSeg = (ax: number, ay: number, bx: number, by: number, z: number) => {
    positions[p++] = ax;
    positions[p++] = ay;
    positions[p++] = z;
    positions[p++] = bx;
    positions[p++] = by;
    positions[p++] = z;
  };

  const w = ENCODE_RACK_WIDTH * 0.5;
  const h = ENCODE_RACK_HEIGHT * 0.5;

  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    const cx = Math.cos(t) * ENCODE_RACK_RADIUS;
    const cy = Math.sin(t) * ENCODE_RACK_RADIUS;
    const z = 0;

    // Frame (4 segs).
    writeSeg(cx - w, cy - h, cx + w, cy - h, z);
    writeSeg(cx + w, cy - h, cx + w, cy + h, z);
    writeSeg(cx + w, cy + h, cx - w, cy + h, z);
    writeSeg(cx - w, cy + h, cx - w, cy - h, z);
    // Internal dividers (3 segs across).
    writeSeg(cx - w * 0.85, cy + h * 0.45, cx + w * 0.85, cy + h * 0.45, z);
    writeSeg(cx - w * 0.85, cy, cx + w * 0.85, cy, z);
    writeSeg(cx - w * 0.85, cy - h * 0.45, cx + w * 0.85, cy - h * 0.45, z);
  }

  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

/** Additive data-node point cloud scattered in the same annulus as
 *  the racks. Center is kept clear so the brandmark stays focal. */
function buildEncodeNodesGeometry(count: number): {
  geometry: THREE.BufferGeometry;
  positions: Float32Array;
} {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;
    const r = ANNULUS_INNER + Math.random() * (ANNULUS_OUTER - ANNULUS_INNER);
    positions[i * 3] = Math.cos(t) * r;
    positions[i * 3 + 1] = Math.sin(t) * r;
    // Light Z scatter so the nodes feel volumetric, not flat.
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return { geometry: g, positions };
}

/** Stacked wireframe interface planes fanning behind the mark.
 *  Each plane is a flat rectangle at angle `theta` around the
 *  mark, with internal "header bar + body grid" lines so it reads
 *  as a surface tile (Chat / Code / Web / API / Agents — the
 *  thoughtform-strategy headless-surface family) rather than a
 *  blank quad. */
function buildBuildSurfacesGeometry(count: number): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  const SEGMENTS_PER_PLANE = 4 + 1 + 3; // frame + header + 3 grid lines
  const positions = new Float32Array(count * SEGMENTS_PER_PLANE * 2 * 3);
  let p = 0;

  const writeSeg = (ax: number, ay: number, az: number, bx: number, by: number, bz: number) => {
    positions[p++] = ax;
    positions[p++] = ay;
    positions[p++] = az;
    positions[p++] = bx;
    positions[p++] = by;
    positions[p++] = bz;
  };

  const w = BUILD_PLANE_WIDTH * 0.5;
  const h = BUILD_PLANE_HEIGHT * 0.5;

  for (let i = 0; i < count; i++) {
    // Distribute planes across the fan arc, centred on -Z behind
    // the mark, opening upward. The middle plane sits dead behind
    // the brandmark; the others fan around it.
    const tIdx = count === 1 ? 0 : i / (count - 1) - 0.5; // -0.5 .. 0.5
    const theta = tIdx * BUILD_PLANE_FAN_ARC;
    const r = BUILD_PLANE_RADIUS;
    const cx = Math.sin(theta) * r;
    const cy = 0;
    // Z stepped so deeper planes sit further back — accumulated
    // surface stack feel rather than co-planar overlap.
    const cz = Math.cos(theta) * BUILD_PLANE_Z_STEP * Math.abs(tIdx * 2) - 0.35;

    // Plane normal turns toward the brandmark so the rectangles
    // face inward. Compute basis vectors in the plane.
    const nx = -Math.sin(theta);
    const nz = -Math.cos(theta);
    // Right axis (in-plane, perpendicular to normal in the XZ
    // plane): rotate normal by 90° around Y.
    const rx = -nz;
    const rz = nx;
    // Up axis is world-Y (no plane tilt).
    const ux = 0;
    const uy = 1;
    const uz = 0;

    const corner = (sx: number, sy: number): [number, number, number] => [
      cx + rx * (w * sx) + ux * (h * sy),
      cy + uy * (h * sy),
      cz + rz * (w * sx) + uz * (h * sy),
    ];

    const tl = corner(-1, 1);
    const tr = corner(1, 1);
    const br = corner(1, -1);
    const bl = corner(-1, -1);

    // Frame.
    writeSeg(tl[0], tl[1], tl[2], tr[0], tr[1], tr[2]);
    writeSeg(tr[0], tr[1], tr[2], br[0], br[1], br[2]);
    writeSeg(br[0], br[1], br[2], bl[0], bl[1], bl[2]);
    writeSeg(bl[0], bl[1], bl[2], tl[0], tl[1], tl[2]);

    // Header bar (a single horizontal line ~80% across, just under
    // the top edge — reads as a window chrome).
    const headerA = corner(-0.85, 0.7);
    const headerB = corner(0.85, 0.7);
    writeSeg(headerA[0], headerA[1], headerA[2], headerB[0], headerB[1], headerB[2]);

    // Three short body lines (text-like glyphs at ~70% / 50% / 30%
    // width to read as content rows).
    const widths = [0.7, 0.5, 0.3];
    const ys = [0.3, 0, -0.3];
    for (let row = 0; row < 3; row++) {
      const a = corner(-0.85, ys[row]);
      const b = corner(-0.85 + widths[row] * 1.6, ys[row]);
      writeSeg(a[0], a[1], a[2], b[0], b[1], b[2]);
    }
  }

  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

// ─── Materials ────────────────────────────────────────────────────

function makeLineMaterial(color: THREE.Color, opacity: number): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

function makePointsMaterial(size: number, opacity: number): THREE.PointsMaterial {
  return new THREE.PointsMaterial({
    color: COLOR_GOLD,
    size,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
}

// ─── Component ────────────────────────────────────────────────────

export function BrandmarkAccretionShell() {
  const tier = useDeviceTier();
  const isMobile = tier === "mobile";

  const rackCount = isMobile ? ENCODE_RACK_COUNT_MOBILE : ENCODE_RACK_COUNT_DESKTOP;
  const nodeCount = isMobile ? ENCODE_NODE_COUNT_MOBILE : ENCODE_NODE_COUNT_DESKTOP;
  const planeCount = isMobile ? BUILD_PLANE_COUNT_MOBILE : BUILD_PLANE_COUNT_DESKTOP;

  // Group transforms repositioned every frame so the whole shell
  // tracks the brandmark world position. Refs are typed loosely
  // because R3F's `<group>` returns a `THREE.Group` via ref.
  const shellGroupRef = useRef<THREE.Group>(null);
  const navigateGroupRef = useRef<THREE.Group>(null);
  const encodeGroupRef = useRef<THREE.Group>(null);
  const buildGroupRef = useRef<THREE.Group>(null);

  // ── Geometries ──────────────────────────────────────────────────

  const navigateHaloGeometry = useMemo(() => buildRingGeometry(NAVIGATE_HALO_RADIUS), []);
  const navigateTicksGeometry = useMemo(() => buildHaloTicksGeometry(), []);
  const encodeRacksGeometry = useMemo(() => buildEncodeRacksGeometry(rackCount), [rackCount]);
  const encodeNodesGeometry = useMemo(
    () => buildEncodeNodesGeometry(nodeCount).geometry,
    [nodeCount]
  );
  const buildSurfacesGeometry = useMemo(() => buildBuildSurfacesGeometry(planeCount), [planeCount]);

  // ── Materials ───────────────────────────────────────────────────

  const navigateHaloMaterial = useMemo(() => makeLineMaterial(COLOR_GOLD, 0), []);
  const navigateTicksMaterial = useMemo(() => makeLineMaterial(COLOR_GOLD, 0), []);
  const encodeRacksMaterial = useMemo(() => makeLineMaterial(COLOR_DAWN, 0), []);
  const encodeNodesMaterial = useMemo(() => makePointsMaterial(0.06, 0), []);
  const buildSurfacesMaterial = useMemo(() => makeLineMaterial(COLOR_DAWN, 0), []);

  useEffect(() => {
    return () => {
      navigateHaloGeometry.dispose();
      navigateTicksGeometry.dispose();
      encodeRacksGeometry.dispose();
      encodeNodesGeometry.dispose();
      buildSurfacesGeometry.dispose();
      navigateHaloMaterial.dispose();
      navigateTicksMaterial.dispose();
      encodeRacksMaterial.dispose();
      encodeNodesMaterial.dispose();
      buildSurfacesMaterial.dispose();
    };
  }, [
    navigateHaloGeometry,
    navigateTicksGeometry,
    encodeRacksGeometry,
    encodeNodesGeometry,
    buildSurfacesGeometry,
    navigateHaloMaterial,
    navigateTicksMaterial,
    encodeRacksMaterial,
    encodeNodesMaterial,
    buildSurfacesMaterial,
  ]);

  // ── Per-frame: track brandmark + drive layer reveals ────────────

  useFrame((state) => {
    const shell = shellGroupRef.current;
    if (!shell) return;

    const transform = useDepthGatewayStore.getState().transform;
    const { paintProgress, active, armed } = transform;
    const painting = active || armed;

    if (!painting) {
      shell.visible = false;
      return;
    }

    // Position the whole shell on the brandmark every frame.
    const [bx, by, bz] = getBrandmarkWorldPosition(paintProgress);
    shell.visible = true;
    shell.position.set(bx, by, bz);

    // Drive per-layer reveals.
    const layers = getBrandmarkAccretionLayers(paintProgress);
    navigateHaloMaterial.opacity = layers.navigate * 0.55;
    navigateTicksMaterial.opacity = layers.navigate * 0.7;
    encodeRacksMaterial.opacity = layers.encode * 0.55;
    encodeNodesMaterial.opacity = layers.encode * 0.85;
    buildSurfacesMaterial.opacity = layers.build * 0.5;

    // Visibility skips for fully-faded sub-layers (cheaper than
    // submitting zero-alpha draw calls every frame).
    if (navigateGroupRef.current) navigateGroupRef.current.visible = layers.navigate > 0.005;
    if (encodeGroupRef.current) encodeGroupRef.current.visible = layers.encode > 0.005;
    if (buildGroupRef.current) buildGroupRef.current.visible = layers.build > 0.005;

    // Subtle live motion: the Encode rack ring rotates slowly so the
    // accretion reads as "alive", not static decoration. Tied to
    // clock time, not scroll, so it breathes during parked beats
    // too. Build plane fan oscillates ±5° around its base angle for
    // the same reason. Navigate halo stays still — its tick ring is
    // the static instrument cue.
    const now = state.clock.elapsedTime;
    if (encodeGroupRef.current) {
      encodeGroupRef.current.rotation.z = now * 0.04;
    }
    if (buildGroupRef.current) {
      buildGroupRef.current.rotation.y = Math.sin(now * 0.25) * 0.06;
    }
  });

  return (
    <group ref={shellGroupRef} visible={false}>
      {/* Navigate halo — thin ring + radial ticks */}
      <group ref={navigateGroupRef} visible={false}>
        <lineLoop
          geometry={navigateHaloGeometry}
          material={navigateHaloMaterial}
          frustumCulled={false}
        />
        <lineSegments
          geometry={navigateTicksGeometry}
          material={navigateTicksMaterial}
          frustumCulled={false}
        />
      </group>

      {/* Encode racks + data nodes */}
      <group ref={encodeGroupRef} visible={false}>
        <lineSegments
          geometry={encodeRacksGeometry}
          material={encodeRacksMaterial}
          frustumCulled={false}
        />
        <points
          geometry={encodeNodesGeometry}
          material={encodeNodesMaterial}
          frustumCulled={false}
        />
      </group>

      {/* Build surface planes */}
      <group ref={buildGroupRef} visible={false}>
        <lineSegments
          geometry={buildSurfacesGeometry}
          material={buildSurfacesMaterial}
          frustumCulled={false}
        />
      </group>
    </group>
  );
}
