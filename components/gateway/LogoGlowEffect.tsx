"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

interface LogoGlowEffectProps {
  active: boolean;
  size: number;
}

// Subtle particle glow effect that pulses around the logo
function GlowParticles({ active }: { active: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);

  // Create a ring of particles around the logo
  const positions = useMemo(() => {
    const count = 24;
    const radius = 0.6;
    const points = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      points[i * 3] = Math.cos(angle) * radius;
      points[i * 3 + 1] = Math.sin(angle) * radius;
      points[i * 3 + 2] = 0;
    }

    return points;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current || !active) return;

    const time = state.clock.elapsedTime;

    // Gentle pulsing rotation
    pointsRef.current.rotation.z = time * 0.5;

    // Scale particles based on pulse
    const pulse = Math.sin(time * 3) * 0.1 + 1;
    pointsRef.current.scale.setScalar(pulse);
  });

  if (!active) return null;

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#caa554"
        size={0.08}
        sizeAttenuation={false}
        depthWrite={false}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

// Shimmer effect - additional particles that sparkle
function ShimmerParticles({ active }: { active: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 12;
    const radius = 0.4;
    const points = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const offset = (Math.random() - 0.5) * 0.2;
      points[i * 3] = Math.cos(angle) * (radius + offset);
      points[i * 3 + 1] = Math.sin(angle) * (radius + offset);
      points[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }

    return points;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current || !active) return;

    const time = state.clock.elapsedTime;

    // Counter-rotation for visual interest
    pointsRef.current.rotation.z = -time * 0.8;

    // Twinkle effect
    const twinkle = Math.sin(time * 5) * 0.3 + 0.7;
    pointsRef.current.scale.setScalar(twinkle);
  });

  if (!active) return null;

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#ece3d6"
        size={0.05}
        sizeAttenuation={false}
        depthWrite={false}
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

export function LogoGlowEffect({ active, size }: LogoGlowEffectProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: size * 3,
        height: size * 3,
        pointerEvents: "none",
        opacity: active ? 1 : 0,
        transition: "opacity 0.2s ease-out",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 1], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <GlowParticles active={active} />
        <ShimmerParticles active={active} />
      </Canvas>
    </div>
  );
}
