"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import type { ThreeJSPreset } from "@/lib/types";

interface ThreeBackgroundProps {
  preset: ThreeJSPreset;
  opacity?: number;
}

// ═══════════════════════════════════════════════════════════════════
// STARFIELD PRESET
// ═══════════════════════════════════════════════════════════════════

function StarfieldScene() {
  const ref = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Spherical distribution
      const radius = Math.random() * 10 + 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Gold-tinted white stars
      const intensity = 0.5 + Math.random() * 0.5;
      colors[i * 3] = 0.92 * intensity; // R
      colors[i * 3 + 1] = 0.89 * intensity; // G
      colors[i * 3 + 2] = 0.84 * intensity; // B
    }

    return [positions, colors];
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        vertexColors
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PARTICLES PRESET
// ═══════════════════════════════════════════════════════════════════

function ParticlesScene() {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 2000;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    return positions;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      const positions = ref.current.geometry.attributes.position;
      const time = state.clock.elapsedTime;

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);

        // Gentle wave motion
        positions.setZ(
          i,
          Math.sin(x * 0.5 + time * 0.5) * Math.cos(y * 0.5 + time * 0.3) * 0.5
        );
      }

      positions.needsUpdate = true;
      ref.current.rotation.y = time * 0.01;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#CAA554"
        size={0.03}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

// ═══════════════════════════════════════════════════════════════════
// GEOMETRIC PRESET - Points-based wireframe effect
// ═══════════════════════════════════════════════════════════════════

function GeometricScene() {
  const ref = useRef<THREE.Points>(null);

  // Generate points along geometric shapes
  const positions = useMemo(() => {
    const points: number[] = [];
    
    // Torus points
    const majorR = 2;
    const minorR = 0.5;
    for (let i = 0; i < 200; i++) {
      const theta = (i / 200) * Math.PI * 2;
      const phi = (i * 7 / 200) * Math.PI * 2; // spiral
      
      const x = (majorR + minorR * Math.cos(phi)) * Math.cos(theta);
      const y = (majorR + minorR * Math.cos(phi)) * Math.sin(theta);
      const z = minorR * Math.sin(phi);
      
      points.push(x, y, z);
    }
    
    // Orbiting points
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      points.push(Math.cos(angle) * 3, 0, Math.sin(angle) * 3);
    }
    
    return new Float32Array(points);
  }, []);

  useFrame((state) => {
    if (ref.current) {
      const time = state.clock.elapsedTime;
      ref.current.rotation.y = time * 0.1;
      ref.current.rotation.x = time * 0.05;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#CAA554"
        size={0.04}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.7}
      />
    </Points>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

const PRESET_SCENES: Record<ThreeJSPreset, React.ComponentType> = {
  starfield: StarfieldScene,
  particles: ParticlesScene,
  geometric: GeometricScene,
};

export function ThreeBackground({ preset, opacity = 0.5 }: ThreeBackgroundProps) {
  const SceneComponent = PRESET_SCENES[preset];

  if (!SceneComponent) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-0"
      style={{ opacity }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <SceneComponent />
      </Canvas>
    </div>
  );
}
