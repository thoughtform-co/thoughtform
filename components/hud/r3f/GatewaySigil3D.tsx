"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useParticleScene } from "@/lib/contexts/ParticleSceneContext";

const GOLD = new THREE.Color("#caa554");
const DAWN = new THREE.Color("#ebe3d6");

/**
 * The Thoughtform North Star — a ring formation of gold particles with a
 * central crosshair. Sits at world z=0 so the camera approaches and passes
 * through it during the hero→definition scroll band.
 */
export function GatewaySigil3D() {
  const pointsRef = useRef<THREE.Points>(null);
  const { phaseRef } = useParticleScene();

  const { positions, colors, count } = useMemo(() => {
    const RING_COUNT = 180;
    const CROSS_COUNT = 60;
    const SPOKE_COUNT = 40;
    const RING_RADIUS = 70;
    const total = RING_COUNT + CROSS_COUNT * 2 + SPOKE_COUNT * 4;

    const pos = new Float32Array(total * 3);
    const col = new Float32Array(total * 3);
    const tmp = new THREE.Color();

    let idx = 0;
    const push = (x: number, y: number, z: number, color: THREE.Color) => {
      pos[idx * 3] = x;
      pos[idx * 3 + 1] = y;
      pos[idx * 3 + 2] = z;
      col[idx * 3] = color.r;
      col[idx * 3 + 1] = color.g;
      col[idx * 3 + 2] = color.b;
      idx++;
    };

    // Ring
    for (let i = 0; i < RING_COUNT; i++) {
      const a = (i / RING_COUNT) * Math.PI * 2;
      const jitter = (Math.random() - 0.5) * 1.5;
      push(
        Math.cos(a) * (RING_RADIUS + jitter),
        Math.sin(a) * (RING_RADIUS + jitter),
        (Math.random() - 0.5) * 2,
        tmp.copy(GOLD).lerp(DAWN, Math.random() * 0.3)
      );
    }

    // Vertical crosshair
    for (let i = 0; i < CROSS_COUNT; i++) {
      const t = i / CROSS_COUNT;
      const y = (t - 0.5) * RING_RADIUS * 2.4;
      push(0, y, 0, tmp.copy(GOLD).lerp(DAWN, 0.15));
    }

    // Horizontal crosshair
    for (let i = 0; i < CROSS_COUNT; i++) {
      const t = i / CROSS_COUNT;
      const x = (t - 0.5) * RING_RADIUS * 2.4;
      push(x, 0, 0, tmp.copy(GOLD).lerp(DAWN, 0.15));
    }

    // Diamond spokes
    for (let spoke = 0; spoke < 4; spoke++) {
      const dirAngle = (spoke / 4) * Math.PI * 2 + Math.PI / 4;
      for (let i = 0; i < SPOKE_COUNT; i++) {
        const t = i / SPOKE_COUNT;
        const r = RING_RADIUS * 0.35 * t;
        push(Math.cos(dirAngle) * r, Math.sin(dirAngle) * r, 0, tmp.copy(GOLD));
      }
    }

    return { positions: pos, colors: col, count: total };
  }, []);

  useFrame((state) => {
    const group = pointsRef.current;
    if (!group) return;
    const t = state.clock.elapsedTime;
    const phase = phaseRef.current;

    // Rotate slowly around Y for life.
    group.rotation.z = t * 0.05;

    // Fade out past the definition phase.
    let targetOpacity = 1;
    if (phase && phase.section === "manifesto") targetOpacity = 1 - phase.progress * 0.7;
    if (phase && (phase.section === "services" || phase.section === "contact")) targetOpacity = 0.1;

    const mat = group.material as THREE.PointsMaterial;
    mat.opacity += (targetOpacity - mat.opacity) * 0.1;

    // Breathing
    const breathe = 1 + Math.sin(t * 0.8) * 0.015;
    group.scale.setScalar(breathe);
  });

  return (
    <points ref={pointsRef} position={[0, 40, -200]} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2.4}
        vertexColors
        transparent
        opacity={1}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
