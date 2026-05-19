"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { createCometMaterial } from "./celestialMaterials";
import { getCometTrajectoryPoints, orbitEmerge } from "./intelligenceLayerGeom";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";

const PARTICLE_COUNT = 120;
const HEAD_COUNT = 8;

function buildCometGeometry(curve: THREE.CatmullRomCurve3): THREE.BufferGeometry {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const brightness = new Float32Array(PARTICLE_COUNT);
  const sizes = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const along = i / PARTICLE_COUNT;
    const pt = curve.getPoint(along);
    positions[i * 3] = pt.x;
    positions[i * 3 + 1] = pt.y;
    positions[i * 3 + 2] = pt.z;
    const tail = Math.pow(along, 2.2);
    const headBoost = i < HEAD_COUNT ? 1 - i / HEAD_COUNT : 0;
    brightness[i] = (1 - tail) * 0.35 + headBoost * 0.65;
    sizes[i] = 0.55 + headBoost * 1.1 + (1 - tail) * 0.25;
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setAttribute("aBrightness", new THREE.BufferAttribute(brightness, 1));
  geom.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  return geom;
}

export function CometStream() {
  const pointsRef = useRef<THREE.Points>(null);
  const mat = useMemo(() => createCometMaterial(), []);
  const curve = useMemo(() => {
    const pts = getCometTrajectoryPoints();
    return new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  }, []);
  const baseGeom = useMemo(() => buildCometGeometry(curve), [curve]);
  const scratch = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const progress = useBrandmarkJourneyStore.getState().transform.ringProgress;
    const emerge = orbitEmerge(progress);
    // Comet always visible (lower baseline alpha), brightens with emerge.
    const visibility = 0.4 + emerge * 0.6;
    const phase = (state.clock.elapsedTime * 0.08 + progress * 0.6) % 1;
    const positions = pointsRef.current?.geometry.getAttribute("position") as THREE.BufferAttribute;
    if (!positions) return;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const offset = i / PARTICLE_COUNT;
      const t = (phase + offset * 0.85) % 1;
      const fadeIn = smoothFade(t, 0.04);
      const fadeOut = 1 - smoothFade(t, 0.96);
      const along = t;
      curve.getPoint(along, scratch);
      positions.setXYZ(i, scratch.x, scratch.y, scratch.z);
      const bAttr = baseGeom.getAttribute("aBrightness") as THREE.BufferAttribute;
      const sAttr = baseGeom.getAttribute("aSize") as THREE.BufferAttribute;
      const b = (bAttr.getX(i) as number) * fadeIn * fadeOut * visibility;
      (pointsRef.current!.geometry.getAttribute("aBrightness") as THREE.BufferAttribute).setX(i, b);
      (pointsRef.current!.geometry.getAttribute("aSize") as THREE.BufferAttribute).setX(
        i,
        (sAttr.getX(i) as number) * (0.85 + emerge * 0.35)
      );
    }
    positions.needsUpdate = true;
    (pointsRef.current!.geometry.getAttribute("aBrightness") as THREE.BufferAttribute).needsUpdate =
      true;
    (pointsRef.current!.geometry.getAttribute("aSize") as THREE.BufferAttribute).needsUpdate = true;

    mat.uniforms.uOpacity.value = visibility;
    mat.uniforms.uPixelRatio.value = state.viewport.dpr;
    if (pointsRef.current) pointsRef.current.visible = true;
  });

  const liveGeom = useMemo(() => {
    const g = baseGeom.clone();
    g.setAttribute("aBrightness", baseGeom.getAttribute("aBrightness")!.clone());
    g.setAttribute("aSize", baseGeom.getAttribute("aSize")!.clone());
    return g;
  }, [baseGeom]);

  return <points ref={pointsRef} geometry={liveGeom} material={mat} />;
}

function smoothFade(t: number, edge: number): number {
  if (t < edge) return t / edge;
  if (t > 1 - edge) return (1 - t) / edge;
  return 1;
}
