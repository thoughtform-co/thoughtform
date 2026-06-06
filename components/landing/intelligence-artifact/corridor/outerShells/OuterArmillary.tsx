"use client";

/**
 * OuterArmillary — outer shell as a gimbal of three great-circle
 * rings on different axes. Ports ride the rings (two per ring).
 * Each ring counter-rotates around its own normal so the shell
 * reads as a precision instrument cradling the brain — completely
 * different geometric class from the brain's faceted ball.
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
import {
  buildDiamondGeometry,
  buildFilledDiamondGeometry,
  makeLineMaterial,
  makeMeshMaterial,
} from "../../artifactPrimitives";
import type { CorridorOuterShellProps } from "../CorridorArtifact";
import {
  OUTER_PORT_OVERLAP,
  OUTER_PORT_SIZE,
  OUTER_SHELL_RADIUS,
  OUTER_SHELL_SPIN_RATE,
} from "./shared";

const RING_OPACITY = 0.7;
const PORT_OUTLINE_OPACITY = 0.85;
const PORT_FILL_OPACITY = 0.78;

/** Three great-circle ring axes (Euler tilts applied to the XZ
 *  ring plane). Picked so the three rings cross at distinct angles
 *  rather than running parallel. */
const RING_AXES: ReadonlyArray<{
  tilt: readonly [number, number, number];
  /** Per-ring spin rate (rad/s). Mixed sign + magnitude so the
   *  rings counter-rotate at different speeds, reading as a
   *  gyroscope. */
  spin: number;
}> = [
  { tilt: [0, 0, 0], spin: OUTER_SHELL_SPIN_RATE },
  { tilt: [Math.PI / 2, 0, 0], spin: -OUTER_SHELL_SPIN_RATE * 0.65 },
  { tilt: [0, 0, Math.PI / 2], spin: OUTER_SHELL_SPIN_RATE * 0.45 },
];

/** Per-ring port count. Six total ports across three rings = 2 each
 *  (placed 180° apart on each ring) so the shell carries the same
 *  six "headless surfaces" semantic as the geodesic baseline. */
const PORTS_PER_RING = 2;
const TOTAL_PORTS = RING_AXES.length * PORTS_PER_RING;

function buildGreatCircle(radius: number, segments = 96): THREE.BufferGeometry {
  const positions = new Float32Array((segments + 1) * 3);
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * radius;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = Math.sin(a) * radius;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

export function OuterArmillary({ reveal, reducedMotion = false }: CorridorOuterShellProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const portGroupRefs = useRef<(THREE.Group | null)[]>([]);

  const ringGeom = useMemo(() => buildGreatCircle(OUTER_SHELL_RADIUS, 96), []);
  const portOutlineGeom = useMemo(() => buildDiamondGeometry(OUTER_PORT_SIZE), []);
  const portFilledGeom = useMemo(() => buildFilledDiamondGeometry(OUTER_PORT_SIZE * 0.55), []);

  const mats = useMemo(
    () => ({
      ring: makeLineMaterial(COLOR_SURFACES, RING_OPACITY, true),
      portOutline: makeLineMaterial(COLOR_SURFACES, PORT_OUTLINE_OPACITY, true),
      portFilled: makeMeshMaterial(COLOR_SURFACES, PORT_FILL_OPACITY),
    }),
    []
  );

  useEffect(() => {
    return () => {
      ringGeom.dispose();
      portOutlineGeom.dispose();
      portFilledGeom.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [ringGeom, portOutlineGeom, portFilledGeom, mats]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      return;
    }
    group.visible = true;
    group.scale.setScalar(foldEmerge(reveal).scale);

    // Per-ring counter-rotation. Spin axis is the ring's normal
    // (local Y after the tilt is applied), so spinning the ring's
    // group on its local Y matches the great-circle axis.
    for (let i = 0; i < RING_AXES.length; i++) {
      const node = ringGroupRefs.current[i];
      if (!node || reducedMotion) continue;
      node.rotation.y += RING_AXES[i].spin * delta;
    }

    // Per-port fold-in (position overshoots beyond the ring radius
    // then settles inward), staggered across all six.
    for (let i = 0; i < TOTAL_PORTS; i++) {
      const portGroup = portGroupRefs.current[i];
      if (!portGroup) continue;
      const stagger = petalStagger(reveal, i, TOTAL_PORTS, OUTER_PORT_OVERLAP);
      const { scale, positionFactor } = foldEmerge(stagger);
      if (scale <= EMERGE_EPSILON) {
        portGroup.visible = false;
        continue;
      }
      portGroup.visible = true;
      const ringIdx = Math.floor(i / PORTS_PER_RING);
      const localIdx = i % PORTS_PER_RING;
      const a = (localIdx / PORTS_PER_RING) * Math.PI * 2;
      // Ports sit on the local XZ plane of their parent ring group,
      // which is then tilted — the parent's rotation carries the
      // port onto the right great-circle path.
      const x = Math.cos(a) * OUTER_SHELL_RADIUS;
      const z = Math.sin(a) * OUTER_SHELL_RADIUS;
      portGroup.position.set(x * positionFactor, 0, z * positionFactor);
      portGroup.scale.setScalar(scale);
      // Re-parent visually: we mount ports inside the per-ring
      // tilted group so they inherit the ring's rotation
      // automatically. See JSX below.
      void ringIdx;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {RING_AXES.map((axis, ringIdx) => (
        <group
          key={`ring-${ringIdx}`}
          ref={(node) => {
            ringGroupRefs.current[ringIdx] = node;
          }}
          rotation={[axis.tilt[0], axis.tilt[1], axis.tilt[2]]}
        >
          <lineLoop geometry={ringGeom} material={mats.ring} frustumCulled={false} />
          {Array.from({ length: PORTS_PER_RING }).map((_, localIdx) => {
            const portIdx = ringIdx * PORTS_PER_RING + localIdx;
            return (
              <group
                key={`port-${portIdx}`}
                ref={(node) => {
                  portGroupRefs.current[portIdx] = node;
                }}
                visible={false}
              >
                <lineLoop
                  geometry={portOutlineGeom}
                  material={mats.portOutline}
                  frustumCulled={false}
                />
                <mesh geometry={portFilledGeom} material={mats.portFilled} frustumCulled={false} />
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
}
