"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useParticleScene } from "@/lib/contexts/ParticleSceneContext";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";

const DAWN = new THREE.Color("#ebe3d6");
const VOID = new THREE.Color("#232120");

export function Terrain() {
  const pointsRef = useRef<THREE.Points>(null);
  const { particlesPositionsRef } = useParticleScene();
  const isMobile = useIsMobile();

  const config = useMemo(() => {
    return isMobile
      ? { rows: 60, cols: 120, spreadX: 26, spreadZ: 36, amp: 38, freq: 0.09 }
      : { rows: 110, cols: 220, spreadX: 22, spreadZ: 34, amp: 44, freq: 0.085 };
  }, [isMobile]);

  const { geometry, material } = useMemo(() => {
    const { rows, cols, spreadX, spreadZ } = config;
    const n = rows * cols;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const tmp = new THREE.Color();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = (r * cols + c) * 3;
        const x = (c - cols / 2) * spreadX + (Math.random() - 0.5) * 4;
        const z = -r * spreadZ - Math.random() * 8;
        pos[i] = x;
        pos[i + 1] = 0;
        pos[i + 2] = z;

        const depthT = r / rows;
        const fade = Math.pow(depthT, 0.55);
        tmp.copy(DAWN).lerp(VOID, fade * 0.78);
        col[i] = tmp.r;
        col[i + 1] = tmp.g;
        col[i + 2] = tmp.b;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    return { geometry: geo, material: mat };
  }, [config]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const { rows, cols, amp, freq } = config;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const t = state.clock.elapsedTime * 0.35;

    for (let r = 0; r < rows; r++) {
      const rowPhase = r * 0.12;
      const mountain = r > rows * 0.55 ? Math.pow((r - rows * 0.55) / (rows * 0.45), 1.8) * 180 : 0;
      for (let c = 0; c < cols; c++) {
        const i = (r * cols + c) * 3;
        const y =
          Math.sin(c * freq + rowPhase + t) * amp +
          Math.cos(r * 0.11 - t * 0.4) * amp * 0.55 +
          Math.sin(c * 0.35 + r * 0.14) * amp * 0.3 +
          mountain * Math.sin(c * 0.04 + r * 0.07);
        arr[i + 1] = y - 160;
      }
    }
    posAttr.needsUpdate = true;

    if (particlesPositionsRef.current !== arr) {
      particlesPositionsRef.current = arr;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}
