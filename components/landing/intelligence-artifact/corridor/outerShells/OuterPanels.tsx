"use client";

/**
 * OuterPanels — no enclosing ball. Six small flat framed plates
 * sit TANGENT to the implied sphere at the port positions; each
 * plate is literally a "headless surface" or port. A single faint
 * equator band connects them so the eye reads them as belonging to
 * the same outer layer without crowding the brain inside.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  EMERGE_EPSILON,
  foldEmerge,
  petalStagger,
} from "@/components/landing/home-v2/DepthGatewayScene/shell/shellGeom";
import { COLOR_SURFACES } from "../../artifactGeom";
import { buildPolygonGeometry, makeLineMaterial, makeMeshMaterial } from "../../artifactPrimitives";
import type { CorridorOuterShellProps } from "../CorridorArtifact";
import {
  OUTER_PORT_COUNT,
  OUTER_PORT_OVERLAP,
  OUTER_SHELL_RADIUS,
  OUTER_SHELL_SPIN_RATE,
  OUTER_SHELL_TILT_Y,
} from "./shared";

/** Half-extent of each tangent plate in world units (the plate is
 *  a rectangle of width 2*PLATE_HALF_W and height 2*PLATE_HALF_H). */
const PLATE_HALF_W = 0.22;
const PLATE_HALF_H = 0.18;
const PLATE_EDGE_OPACITY = 0.78;
const PLATE_FILL_OPACITY = 0.05;
const EQUATOR_OPACITY = 0.22;

/** Build a flat rectangle wireframe on the local XY plane (Z = 0)
 *  so the plate's normal is +Z. Returned as a `LineLoop`-ready
 *  geometry (4 vertices, closed). */
function buildPlateOutline(halfW: number, halfH: number): THREE.BufferGeometry {
  const positions = new Float32Array([
    -halfW,
    -halfH,
    0,
    halfW,
    -halfH,
    0,
    halfW,
    halfH,
    0,
    -halfW,
    halfH,
    0,
  ]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

/** Build a filled rectangle on the local XY plane (two triangles). */
function buildPlateFill(halfW: number, halfH: number): THREE.BufferGeometry {
  const positions = new Float32Array([
    -halfW,
    -halfH,
    0,
    halfW,
    -halfH,
    0,
    halfW,
    halfH,
    0,
    -halfW,
    -halfH,
    0,
    halfW,
    halfH,
    0,
    -halfW,
    halfH,
    0,
  ]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

export function OuterPanels({ reveal, reducedMotion = false }: CorridorOuterShellProps) {
  const groupRef = useRef<THREE.Group>(null);
  const spinGroupRef = useRef<THREE.Group>(null);
  const portGroupRefs = useRef<(THREE.Group | null)[]>([]);

  const plateOutline = useMemo(() => buildPlateOutline(PLATE_HALF_W, PLATE_HALF_H), []);
  const plateFill = useMemo(() => buildPlateFill(PLATE_HALF_W, PLATE_HALF_H), []);
  const equator = useMemo(() => buildPolygonGeometry(OUTER_SHELL_RADIUS, 96, 0), []);

  const mats = useMemo(
    () => ({
      plateOutline: makeLineMaterial(COLOR_SURFACES, PLATE_EDGE_OPACITY, false),
      plateFill: makeMeshMaterial(COLOR_SURFACES, PLATE_FILL_OPACITY),
      equator: makeLineMaterial(COLOR_SURFACES, EQUATOR_OPACITY, false),
    }),
    []
  );

  useEffect(() => {
    return () => {
      plateOutline.dispose();
      plateFill.dispose();
      equator.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [plateOutline, plateFill, equator, mats]);

  // Final port positions on the XZ plane + the rotation that makes
  // each plate's normal (local +Z) point radially outward.
  const portTransforms = useMemo(() => {
    const out: Array<{ pos: [number, number, number]; rotY: number }> = [];
    for (let i = 0; i < OUTER_PORT_COUNT; i++) {
      const a = (i / OUTER_PORT_COUNT) * Math.PI * 2;
      const x = Math.cos(a) * OUTER_SHELL_RADIUS;
      const z = Math.sin(a) * OUTER_SHELL_RADIUS;
      // Rotation around Y so the plate's +Z aligns with the radial
      // direction (x, 0, z) / R. A rotation by θ around Y sends +Z
      // to (sin θ, 0, cos θ); to get (cos a, 0, sin a) we need
      // θ = π/2 − a.
      const rotY = Math.PI / 2 - a;
      out.push({ pos: [x, 0, z], rotY });
    }
    return out;
  }, []);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      return;
    }
    group.visible = true;
    // Equator + the whole assembly use the shared foldEmerge scale
    // on the parent so the whole layer wraps in as one body. The
    // plates also lerp their positions outward via positionFactor
    // for the cascade.
    group.scale.setScalar(foldEmerge(reveal).scale);

    for (let i = 0; i < OUTER_PORT_COUNT; i++) {
      const portGroup = portGroupRefs.current[i];
      if (!portGroup) continue;
      const stagger = petalStagger(reveal, i, OUTER_PORT_COUNT, OUTER_PORT_OVERLAP);
      const { scale, positionFactor } = foldEmerge(stagger);
      if (scale <= EMERGE_EPSILON) {
        portGroup.visible = false;
        continue;
      }
      portGroup.visible = true;
      const t = portTransforms[i];
      portGroup.position.set(
        t.pos[0] * positionFactor,
        t.pos[1] * positionFactor,
        t.pos[2] * positionFactor
      );
      // Plate scale ramps with the cascade; rotation stays fixed
      // (set on the group's rotation prop below).
      portGroup.scale.setScalar(scale);
    }

    if (spinGroupRef.current && !reducedMotion) {
      spinGroupRef.current.rotation.y += OUTER_SHELL_SPIN_RATE * delta;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <group ref={spinGroupRef} rotation={[0, OUTER_SHELL_TILT_Y, 0]}>
        <lineLoop geometry={equator} material={mats.equator} frustumCulled={false} />
        {portTransforms.map((t, i) => (
          <group
            key={`plate-${i}`}
            ref={(node) => {
              portGroupRefs.current[i] = node;
            }}
            rotation={[0, t.rotY, 0]}
            visible={false}
          >
            <mesh geometry={plateFill} material={mats.plateFill} frustumCulled={false} />
            <lineLoop geometry={plateOutline} material={mats.plateOutline} frustumCulled={false} />
          </group>
        ))}
      </group>
    </group>
  );
}
