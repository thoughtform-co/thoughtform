"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export interface ReflectiveEnvironmentRigProps {
  /** Overall studio/reflection intensity. Default 1.35. */
  intensity?: number;
  /** Refresh generated environment every frame for moving highlights. */
  animated?: boolean;
  /** Show in-scene color cards for refraction and edge context. */
  showReflectionCards?: boolean;
}

export function ReflectiveEnvironmentRig({
  intensity = 1.35,
  animated = true,
  showReflectionCards = true,
}: ReflectiveEnvironmentRigProps) {
  return (
    <>
      <Environment
        frames={animated ? Infinity : 1}
        resolution={512}
        environmentIntensity={intensity}
        background={false}
      >
        <AnimatedLightformers animated={animated} intensity={intensity} />
      </Environment>
      <ambientLight intensity={0.18 * intensity} color="#ebe3d6" />
      <spotLight
        position={[1.8, 2.6, 3.6]}
        angle={0.34}
        penumbra={0.8}
        intensity={3.4 * intensity}
        color="#ebe3d6"
      />
      <pointLight position={[-2.2, -0.5, 1.6]} intensity={1.2 * intensity} color="#58dac7" />
      <ReflectionCards visible={showReflectionCards} animated={animated} intensity={intensity} />
    </>
  );
}

interface AnimatedLightformersProps {
  animated: boolean;
  intensity: number;
}

function AnimatedLightformers({ animated, intensity }: AnimatedLightformersProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group || !animated) return;
    const t = clock.elapsedTime;
    group.rotation.y = Math.sin(t * 0.18) * 0.16;
    group.rotation.z = Math.cos(t * 0.14) * 0.05;
  });

  return (
    <group ref={groupRef}>
      <Lightformer
        form="rect"
        color="#ebe3d6"
        intensity={4.8 * intensity}
        scale={[5.8, 1.2, 1]}
        position={[0, 3.4, 2.2]}
        rotation={[Math.PI / 2.35, 0, 0]}
      />
      <Lightformer
        form="rect"
        color="#caa554"
        intensity={3.6 * intensity}
        scale={[1.1, 4.8, 1]}
        position={[-3.2, 0.2, 1.2]}
        rotation={[0, Math.PI / 2.8, 0.2]}
      />
      <Lightformer
        form="rect"
        color="#58dac7"
        intensity={2.4 * intensity}
        scale={[1.8, 3.6, 1]}
        position={[3.1, -0.4, 0.3]}
        rotation={[0, -Math.PI / 2.6, -0.16]}
      />
      <Lightformer
        form="ring"
        color="#e7f7ff"
        intensity={2.2 * intensity}
        scale={[2.8, 2.8, 1]}
        position={[0.2, -2.2, 2.4]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

interface ReflectionCardsProps {
  visible: boolean;
  animated: boolean;
  intensity: number;
}

function ReflectionCards({ visible, animated, intensity }: ReflectionCardsProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group || !animated) return;
    const t = clock.elapsedTime;
    group.position.x = Math.sin(t * 0.22) * 0.06;
    group.rotation.y = Math.sin(t * 0.2) * 0.08;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={[0, 0, -0.72]}>
      <mesh position={[-1.42, 0.04, 0]} rotation={[0, 0.32, 0]} scale={[0.08, 2.45, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          color="#caa554"
          transparent
          opacity={0.16 * intensity}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[1.42, -0.03, -0.04]} rotation={[0, -0.34, 0]} scale={[0.08, 2.25, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          color="#58dac7"
          transparent
          opacity={0.12 * intensity}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
