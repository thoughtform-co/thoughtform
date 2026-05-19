"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { createCometMaterial } from "./celestialMaterials";
import { TRAJECTORY_CURVES, orbitEmerge, type TrajectorySpec } from "./intelligenceLayerGeom";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";

/**
 * TrajectoryFlows — slow, continuous particle drift along each
 * non-ghost trajectory so the three spheres feel materially connected:
 * trusted material streams from Sources → Substrate → Surfaces, plus a
 * reverse confirmation drift on the lower arc. The faster, brighter
 * comet (`CometStream`) still rides the main host curve as the
 * lead-flow accent — these are the gentler ambient streams.
 */

const DAWN = new THREE.Color("#ebe3d6");
const GOLD = new THREE.Color("#caa554");
const PARTICLES_PER_FLOW = 56;

interface FlowSpec {
  trajectory: TrajectorySpec;
  curve: THREE.CatmullRomCurve3;
  phaseOffset: number;
  speed: number;
  /** Reverse particle direction — used to suggest confirmation /
   *  feedback loops returning from Surfaces back to Substrate. */
  reverse: boolean;
  color: THREE.Color;
  pointSize: number;
}

function buildBaseGeom(): THREE.BufferGeometry {
  const positions = new Float32Array(PARTICLES_PER_FLOW * 3);
  const brightness = new Float32Array(PARTICLES_PER_FLOW);
  const sizes = new Float32Array(PARTICLES_PER_FLOW);
  for (let i = 0; i < PARTICLES_PER_FLOW; i++) {
    brightness[i] = 0;
    sizes[i] = 0.7 + ((i * 0.6180339887) % 1) * 0.5;
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setAttribute("aBrightness", new THREE.BufferAttribute(brightness, 1));
  geom.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  return geom;
}

export function TrajectoryFlows() {
  const flows = useMemo<FlowSpec[]>(() => {
    const result: FlowSpec[] = [];
    for (const traj of TRAJECTORY_CURVES) {
      if (traj.ghost) continue;
      const curve = new THREE.CatmullRomCurve3(traj.points.map((p) => new THREE.Vector3(...p)));
      const isMain = traj.id === "main";
      const isLower = traj.id === "lower";
      result.push({
        trajectory: traj,
        curve,
        phaseOffset: isMain ? 0.0 : isLower ? 0.45 : 0.22,
        // Comet is fast on main; this ambient stream on main is slower
        // and reads as the "trail" behind the comet.
        speed: isMain ? 0.022 : 0.014,
        reverse: isLower,
        color: traj.color === "gold" ? GOLD : DAWN,
        pointSize: isMain ? 3.6 : 2.8,
      });
    }
    return result;
  }, []);

  const geoms = useMemo(() => flows.map(() => buildBaseGeom()), [flows]);
  const mats = useMemo(
    () =>
      flows.map((f) => {
        const mat = createCometMaterial(0.55);
        mat.uniforms.uColor.value = f.color;
        mat.uniforms.uPointSize.value = f.pointSize;
        return mat;
      }),
    [flows]
  );

  const scratch = useMemo(() => new THREE.Vector3(), []);
  const pointsRefs = useRef<(THREE.Points | null)[]>([]);

  useFrame((state) => {
    const presence =
      0.4 + orbitEmerge(useBrandmarkJourneyStore.getState().transform.ringProgress) * 0.6;
    const t = state.clock.elapsedTime;

    flows.forEach((flow, fi) => {
      const ref = pointsRefs.current[fi];
      if (!ref) return;
      const geom = ref.geometry as THREE.BufferGeometry;
      const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;
      const brAttr = geom.getAttribute("aBrightness") as THREE.BufferAttribute;

      const phase = (((t * flow.speed + flow.phaseOffset) % 1) + 1) % 1;

      for (let i = 0; i < PARTICLES_PER_FLOW; i++) {
        const offset = i / PARTICLES_PER_FLOW;
        let tAlong = (phase + offset) % 1;
        if (flow.reverse) tAlong = 1 - tAlong;

        flow.curve.getPoint(tAlong, scratch);
        posAttr.setXYZ(i, scratch.x, scratch.y, scratch.z);

        // Soft head/tail fade on each particle's individual phase along
        // the curve so the flow reads as drifting matter rather than a
        // strobe of equal points. Each particle also has its own slow
        // pulse driven by uTime so the stream feels alive.
        const slot = (phase + offset * 0.83) % 1;
        const headFade = smoothstep(0, 0.08, slot);
        const tailFade = 1 - smoothstep(0.78, 1, slot);
        const pulse = 0.65 + Math.sin(t * 0.6 + i * 1.3) * 0.18;
        brAttr.setX(i, headFade * tailFade * pulse);
      }
      posAttr.needsUpdate = true;
      brAttr.needsUpdate = true;

      const mat = mats[fi];
      mat.uniforms.uOpacity.value = presence * (flow.trajectory.id === "main" ? 0.62 : 0.48);
      mat.uniforms.uPixelRatio.value = state.viewport.dpr;
    });
  });

  return (
    <group>
      {flows.map((flow, i) => (
        <points
          key={flow.trajectory.id}
          ref={(el: THREE.Points | null) => {
            pointsRefs.current[i] = el;
          }}
          geometry={geoms[i]}
          material={mats[i]}
        />
      ))}
    </group>
  );
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
