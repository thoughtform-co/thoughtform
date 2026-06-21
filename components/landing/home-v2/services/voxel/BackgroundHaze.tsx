"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, ShaderMaterial, type Texture } from "three";
import { hazeFragmentShader, hazeVertexShader } from "./shaders";
import { VOXEL_PALETTE } from "./voxelTypes";

interface BackgroundHazeProps {
  noiseTex: Texture;
}

/**
 * Warm rolling fog plane behind the blocks — the atmosphere that gives the
 * rogierdeboeve look its depth. Two drifting perlin samples + a radial
 * vignette so the center glows and the edges fall to ember.
 */
export function BackgroundHaze({ noiseTex }: BackgroundHazeProps) {
  const matRef = useRef<ShaderMaterial>(null);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: hazeVertexShader,
        fragmentShader: hazeFragmentShader,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          tNoise: { value: noiseTex },
          uColorA: { value: new Color(VOXEL_PALETTE.fog) },
          uColorB: { value: new Color("#5a2d1a") },
        },
      }),
    [noiseTex],
  );

  useFrame((_, delta) => {
    if (matRef.current) matRef.current.uniforms.uTime.value += Math.min(delta, 0.05);
  });

  return (
    <mesh position={[0, 0, -8]} renderOrder={-1}>
      <planeGeometry args={[70, 40]} />
      <primitive object={material} ref={matRef} attach="material" />
    </mesh>
  );
}
