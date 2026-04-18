"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useParticleScene } from "@/lib/contexts/ParticleSceneContext";
import { easeInOutCubic } from "@/lib/utils";

const DAWN = new THREE.Color("#ebe3d6");
const GOLD = new THREE.Color("#caa554");

const RAIL_COUNT = 240;
const DIAMOND_COUNT = 80;
const RAIL_WIDTH = 720;
const DIAMOND_SIZE = 22;

export const CONTINUUM_WORLD_Z = -900;
export const CONTINUUM_WORLD_Y = 60;
export const CONTINUUM_DIAMOND_WORLD_X: [number, number, number] = [
  (-RAIL_WIDTH / 2) * 0.75,
  0,
  (RAIL_WIDTH / 2) * 0.75,
];

function diamondShape(size: number, count: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  const edges: Array<[[number, number], [number, number]]> = [
    [
      [0, size],
      [size, 0],
    ],
    [
      [size, 0],
      [0, -size],
    ],
    [
      [0, -size],
      [-size, 0],
    ],
    [
      [-size, 0],
      [0, size],
    ],
  ];
  const perEdge = Math.floor(count / 4);
  for (const [[x1, y1], [x2, y2]] of edges) {
    for (let i = 0; i < perEdge; i++) {
      const t = i / perEdge;
      pts.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
    }
  }
  return pts;
}

export function ContinuumSpectrumField() {
  const pointsRef = useRef<THREE.Points>(null);
  const { phaseRef } = useParticleScene();

  const { geometry, material, targets, count } = useMemo(() => {
    const total = RAIL_COUNT + DIAMOND_COUNT * 3;
    const pos = new Float32Array(total * 3);
    const col = new Float32Array(total * 3);
    const tgt = new Float32Array(total * 3);
    const tmp = new THREE.Color();

    let idx = 0;

    for (let i = 0; i < RAIL_COUNT; i++) {
      const t = i / (RAIL_COUNT - 1);
      const x = -RAIL_WIDTH / 2 + t * RAIL_WIDTH;
      const yJitter = (Math.random() - 0.5) * 1.5;
      tgt[idx * 3] = x;
      tgt[idx * 3 + 1] = yJitter;
      tgt[idx * 3 + 2] = 0;

      pos[idx * 3] = x;
      pos[idx * 3 + 1] = yJitter;
      pos[idx * 3 + 2] = 0;

      tmp.copy(DAWN).multiplyScalar(0.75 + Math.random() * 0.25);
      col[idx * 3] = tmp.r;
      col[idx * 3 + 1] = tmp.g;
      col[idx * 3 + 2] = tmp.b;
      idx++;
    }

    for (let d = 0; d < 3; d++) {
      const cx = CONTINUUM_DIAMOND_WORLD_X[d];
      const diamondPts = diamondShape(DIAMOND_SIZE, DIAMOND_COUNT);
      for (let i = 0; i < DIAMOND_COUNT; i++) {
        const p = diamondPts[i] ?? [0, 0];
        tgt[idx * 3] = cx + p[0];
        tgt[idx * 3 + 1] = p[1];
        tgt[idx * 3 + 2] = 0;

        pos[idx * 3] = cx + p[0];
        pos[idx * 3 + 1] = p[1];
        pos[idx * 3 + 2] = 0;

        tmp.copy(GOLD).lerp(DAWN, Math.random() * 0.25);
        col[idx * 3] = tmp.r;
        col[idx * 3 + 1] = tmp.g;
        col[idx * 3 + 2] = tmp.b;
        idx++;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 5,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, material: mat, targets: tgt, count: total };
  }, []);

  useFrame((state) => {
    const pts = pointsRef.current;
    if (!pts) return;
    const phase = phaseRef.current;
    const time = state.clock.elapsedTime;

    let reveal = 0;
    if (phase) {
      if (phase.section === "manifesto") {
        reveal = easeInOutCubic(Math.min(1, phase.progress / 0.3));
        if (phase.progress > 0.9) {
          reveal = easeInOutCubic(Math.max(0, 1 - (phase.progress - 0.9) / 0.1));
        }
      } else if (phase.section === "definition" && phase.progress > 0.7) {
        reveal = easeInOutCubic((phase.progress - 0.7) / 0.3) * 0.4;
      }
    }

    const posAttr = pts.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const breatheY = Math.sin(time * 0.9 + i * 0.13) * 1.2;
      const tx = targets[i3];
      const ty = targets[i3 + 1] + breatheY;
      const tz = targets[i3 + 2];

      const seed = i * 17.31;
      const dx = Math.sin(seed) * 240;
      const dy = Math.cos(seed * 1.3) * 160;
      const dz = Math.sin(seed * 0.7) * 140;

      arr[i3] = tx + dx * (1 - reveal);
      arr[i3 + 1] = ty + dy * (1 - reveal);
      arr[i3 + 2] = tz + dz * (1 - reveal);
    }
    posAttr.needsUpdate = true;

    const mat = pts.material as THREE.PointsMaterial;
    mat.opacity += (reveal - mat.opacity) * 0.15;
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      position={[0, CONTINUUM_WORLD_Y, CONTINUUM_WORLD_Z]}
      frustumCulled={false}
    />
  );
}
