"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  cameraSpaceDepth,
  depthFocusOpacity,
  getIntelligenceSubstratePresence,
  STATION_DIAGNOSTIC,
  STATION_INTELLIGENCE,
  type DepthFocusWindow,
} from "./sceneGeom";

/**
 * BuildArtifact — the holographic Build artifact + the Encode→Build
 * substrate streams (Refinement 3, ADR-018 world-owned corridor).
 *
 * When the lead brandmark lands at Build and morphs into the substrate
 * sphere (`SubstrateMorphCloud`), it powers on a holographic artifact
 * AROUND the sphere — a wireframe grid pedestal, a few floating
 * wireframe panels, and data streams descending from the sphere into
 * the grid. Meanwhile, "encoded substrate examples" stream FROM the
 * Encode station INTO the artifact across passthrough-02, so Encode and
 * Build read as one causal chain (judgment encoded at Encode → tools
 * running on it at Build).
 *
 * Two pieces with different coordinate spaces:
 *
 *   - {@link BuildArtifact} is LOCAL to the Intelligence gate group
 *     (mounted inside `IntelligenceGate`), so it composes around the
 *     substrate sphere in the same local frame. Its grid + panels fade
 *     in with the substrate PRESENCE; the descending streams intensify
 *     with the substrate MORPH, so the artifact "boots up" as the
 *     sphere forms.
 *   - {@link EncodeToBuildStreams} is WORLD-SPACE (mounted at top level),
 *     because it spans corridor-Z from the Encode station to the Build
 *     station. Particles drift Encode→Build; a depth-focus window on the
 *     stream midpoint emerges them on approach and dissolves them once
 *     the camera lands.
 *
 * The substrate sphere stays the focal point — every alpha ceiling here
 * is low so the artifact reads as supporting scaffolding, not a second
 * hero. Mobile-narrow viewports skip both pieces.
 */

const GOLD = new THREE.Color(0.79, 0.65, 0.33);
const DAWN = new THREE.Color("#ebe3d6");

function isWideViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth >= 760;
}

// ── Geometry builders ────────────────────────────────────────────────

/** Wireframe grid in the local XZ plane (a holographic pedestal). */
function buildGrid(half: number, divisions: number): THREE.BufferGeometry {
  const pos: number[] = [];
  const step = (half * 2) / divisions;
  for (let i = 0; i <= divisions; i++) {
    const c = -half + i * step;
    pos.push(c, 0, -half, c, 0, half); // line parallel to Z
    pos.push(-half, 0, c, half, 0, c); // line parallel to X
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return geom;
}

// NOTE: the floating wireframe panels were removed in the 2026-06-02
// cleanup — the first pass read as ugly empty black rectangles. Proper
// holographic panels (matching the shared references) will be rebuilt
// here in a follow-up. For now the artifact is just the grid pedestal +
// descending streams.

// ── Local artifact: grid + descending streams ────────────────────────

const GRID_HALF = 1.95;
const GRID_DIVISIONS = 11;
const GRID_Y = -1.4;
const SPHERE_R = 0.55;

const DESCEND_CURVES = 4;
const DESCEND_PER_CURVE = 30;
const DESCEND_SPEED = 0.16;

const GRID_ALPHA = 0.3;
const DESCEND_ALPHA = 0.6;

export function BuildArtifact() {
  const groupRef = useRef<THREE.Group>(null);
  const enabled = useMemo(() => isWideViewport(), []);

  const gridGeom = useMemo(() => (enabled ? buildGrid(GRID_HALF, GRID_DIVISIONS) : null), [enabled]);

  const gridMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: DAWN.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  // Descending data streams: sphere surface → grid.
  const descend = useMemo(() => {
    if (!enabled) return null;
    const curves: THREE.CatmullRomCurve3[] = [];
    for (let c = 0; c < DESCEND_CURVES; c++) {
      const ang = (c / DESCEND_CURVES) * Math.PI * 2 + 0.35;
      const start = new THREE.Vector3(
        Math.cos(ang) * SPHERE_R * 0.8,
        -SPHERE_R * 0.45 + 0.1,
        Math.sin(ang) * SPHERE_R * 0.8 + 0.1
      );
      const end = new THREE.Vector3(
        Math.cos(ang) * GRID_HALF * 0.72,
        GRID_Y + 0.02,
        Math.sin(ang) * GRID_HALF * 0.72
      );
      const mid = start.clone().lerp(end, 0.5);
      mid.x *= 1.25;
      mid.z *= 1.25;
      mid.y += 0.18;
      curves.push(new THREE.CatmullRomCurve3([start, mid, end]));
    }
    const total = DESCEND_CURVES * DESCEND_PER_CURVE;
    const positions = new Float32Array(total * 3);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: GOLD.clone(),
      size: 0.05,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    });
    return { curves, geom, mat, positions };
  }, [enabled]);

  useEffect(() => {
    return () => {
      gridGeom?.dispose();
      gridMat.dispose();
      descend?.geom.dispose();
      descend?.mat.dispose();
    };
  }, [gridGeom, gridMat, descend]);

  const scratch = useRef(new THREE.Vector3()).current;

  useFrame(({ clock }) => {
    const grp = groupRef.current;
    if (!grp) return;
    const transform = useDepthGatewayStore.getState().transform;
    if (!transform.active) {
      grp.visible = false;
      return;
    }
    const { presence, morph } = getIntelligenceSubstratePresence(transform);
    if (presence <= 0.001) {
      grp.visible = false;
      return;
    }
    grp.visible = true;

    // Grid boots up with presence; streams intensify with morph so they
    // appear as the sphere powers on.
    gridMat.opacity = presence * GRID_ALPHA;

    if (descend) {
      const t = clock.elapsedTime;
      const arr = descend.positions;
      for (let c = 0; c < DESCEND_CURVES; c++) {
        const curve = descend.curves[c];
        for (let k = 0; k < DESCEND_PER_CURVE; k++) {
          const baseT = k / DESCEND_PER_CURVE;
          const tt = (baseT + t * DESCEND_SPEED) % 1;
          curve.getPoint(tt, scratch);
          const idx = (c * DESCEND_PER_CURVE + k) * 3;
          arr[idx] = scratch.x;
          arr[idx + 1] = scratch.y;
          arr[idx + 2] = scratch.z;
        }
      }
      descend.geom.attributes.position.needsUpdate = true;
      descend.mat.opacity = morph * DESCEND_ALPHA;
    }
  });

  if (!enabled || !gridGeom) return null;

  return (
    <group ref={groupRef} visible={false}>
      <group position={[0, GRID_Y, 0]} rotation={[0.06, 0, 0]}>
        <lineSegments geometry={gridGeom} material={gridMat} />
      </group>
      {descend && <points geometry={descend.geom} material={descend.mat} />}
    </group>
  );
}

// ── Encode → Build streams (world-space) ─────────────────────────────

const ENCODE_CURVES = 3;
const ENCODE_PER_CURVE = 40;
const ENCODE_SPEED = 0.085;
const ENCODE_ALPHA = 0.5;

/** Depth-focus window on the stream midpoint: emerges on approach across
 *  passthrough-02, dissolves once the camera lands at Build. */
const ENCODE_FADE_WINDOW: DepthFocusWindow = { near: 2, nearFade: 2.5, far: 14, farFade: 5 };

export function EncodeToBuildStreams() {
  const enabled = useMemo(() => isWideViewport(), []);

  const flow = useMemo(() => {
    if (!enabled) return null;
    const encode = STATION_DIAGNOSTIC.position;
    const build = STATION_INTELLIGENCE.position;

    // Three lateral lanes, offset off the X≈0 brandmark path so the
    // streams flank the corridor centre rather than run through the mark.
    const lanes: Array<[number, number]> = [
      [-1.3, 0.5],
      [1.4, -0.4],
      [0.4, 1.0],
    ];
    const curves: THREE.CatmullRomCurve3[] = [];
    for (let c = 0; c < ENCODE_CURVES; c++) {
      const [ox, oy] = lanes[c % lanes.length];
      const start = new THREE.Vector3(encode[0] + ox, encode[1] + oy, encode[2]);
      const end = new THREE.Vector3(build[0] + ox * 0.35, build[1] + oy * 0.35, build[2]);
      // Two gentle mid control points so the lane bows toward the axis
      // as it nears Build (the examples converge into the artifact).
      const m1 = start.clone().lerp(end, 0.4);
      m1.x += ox * 0.15;
      const m2 = start.clone().lerp(end, 0.75);
      m2.x = end.x * 1.1;
      curves.push(new THREE.CatmullRomCurve3([start, m1, m2, end]));
    }

    const total = ENCODE_CURVES * ENCODE_PER_CURVE;
    const positions = new Float32Array(total * 3);
    const colors = new Float32Array(total * 3);
    for (let c = 0; c < ENCODE_CURVES; c++) {
      for (let k = 0; k < ENCODE_PER_CURVE; k++) {
        const idx = (c * ENCODE_PER_CURVE + k) * 3;
        // Alternate gold / dawn motes so the stream reads as mixed
        // encoded fragments rather than a uniform ribbon.
        const col = (c + k) % 3 === 0 ? GOLD : DAWN;
        colors[idx] = col.r;
        colors[idx + 1] = col.g;
        colors[idx + 2] = col.b;
      }
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.07,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    });
    const midpoint: [number, number, number] = [
      (encode[0] + build[0]) / 2,
      (encode[1] + build[1]) / 2,
      (encode[2] + build[2]) / 2,
    ];
    return { curves, geom, mat, positions, midpoint };
  }, [enabled]);

  useEffect(() => {
    return () => {
      flow?.geom.dispose();
      flow?.mat.dispose();
    };
  }, [flow]);

  const pointsRef = useRef<THREE.Points>(null);
  const scratch = useRef(new THREE.Vector3()).current;

  useFrame(({ clock }) => {
    if (!flow) return;
    const pts = pointsRef.current;
    if (!pts) return;
    const { progress, active } = useDepthGatewayStore.getState().transform;
    if (!active) {
      pts.visible = false;
      return;
    }
    const opacity = depthFocusOpacity(
      cameraSpaceDepth(progress, flow.midpoint),
      ENCODE_FADE_WINDOW
    );
    if (opacity <= 0.001) {
      pts.visible = false;
      return;
    }
    pts.visible = true;

    const t = clock.elapsedTime;
    const arr = flow.positions;
    for (let c = 0; c < ENCODE_CURVES; c++) {
      const curve = flow.curves[c];
      for (let k = 0; k < ENCODE_PER_CURVE; k++) {
        const baseT = k / ENCODE_PER_CURVE;
        const tt = (baseT + t * ENCODE_SPEED) % 1;
        curve.getPoint(tt, scratch);
        const idx = (c * ENCODE_PER_CURVE + k) * 3;
        arr[idx] = scratch.x;
        arr[idx + 1] = scratch.y;
        arr[idx + 2] = scratch.z;
      }
    }
    flow.geom.attributes.position.needsUpdate = true;
    flow.mat.opacity = opacity * ENCODE_ALPHA;
  });

  if (!flow) return null;

  return <points ref={pointsRef} geometry={flow.geom} material={flow.mat} frustumCulled={false} />;
}
