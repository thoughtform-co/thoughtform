"use client";

/**
 * RoomEnvironmentRig — installs a PMREM-prefiltered `RoomEnvironment`
 * as `scene.environment` so PBR materials (MeshStandard /
 * MeshPhysical) get real image-based reflections WITHOUT shipping an
 * HDR asset or hitting the network.
 *
 * This is what makes the chrome / liquid-metal read work: matcap
 * bakes a fixed highlight, but a true env map reflects an actual
 * studio around the mesh — and, once this mounts inside the
 * intelligence-layer scene, it would reflect the surrounding
 * wireframe sphere too.
 *
 * `RoomEnvironment` is three's built-in neutral studio (a box of
 * area-light planes). We prefilter it once with `PMREMGenerator` and
 * dispose everything on unmount. Only mount this when a PBR material
 * is active — matcap materials ignore `scene.environment`, so there's
 * no reason to pay the PMREM cost otherwise.
 */

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export interface RoomEnvironmentRigProps {
  /** scene.environmentIntensity multiplier. Default 1. */
  intensity?: number;
  /** PMREM blur sigma — higher = softer reflections. Default 0.04. */
  blur?: number;
}

export function RoomEnvironmentRig({ intensity = 1, blur = 0.04 }: RoomEnvironmentRigProps) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envScene = new RoomEnvironment();
    const renderTarget = pmrem.fromScene(envScene, blur);
    const previous = scene.environment;
    scene.environment = renderTarget.texture;

    return () => {
      if (scene.environment === renderTarget.texture) {
        scene.environment = previous ?? null;
      }
      renderTarget.dispose();
      pmrem.dispose();
      // RoomEnvironment is a THREE.Scene of lit planes — dispose its
      // geometries + materials so we don't leak GPU buffers.
      envScene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) {
          material.forEach((m) => m.dispose());
        } else if (material) {
          (material as THREE.Material).dispose();
        }
      });
    };
  }, [gl, scene, blur]);

  // scene.environmentIntensity (three r163+) scales IBL contribution
  // globally without rebuilding the env map.
  useEffect(() => {
    const prev = scene.environmentIntensity;
    scene.environmentIntensity = intensity;
    return () => {
      scene.environmentIntensity = prev ?? 1;
    };
  }, [scene, intensity]);

  return null;
}
