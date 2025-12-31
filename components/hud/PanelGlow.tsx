"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

interface GlowPlaneProps {
  width: number;
  height: number;
  color: string;
  intensity: number;
  pulseSpeed?: number;
  pulseAmount?: number;
}

function GlowPlane({
  width,
  height,
  color,
  intensity,
  pulseSpeed = 0.5,
  pulseAmount = 0.1,
}: GlowPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  // Parse color
  const threeColor = useMemo(() => new THREE.Color(color), [color]);

  // Subtle pulse animation
  useFrame((state) => {
    if (materialRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed) * pulseAmount;
      materialRef.current.opacity = intensity + pulse;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        ref={materialRef}
        color={threeColor}
        transparent
        opacity={intensity}
        toneMapped={false}
      />
    </mesh>
  );
}

// Edge glow lines for that hand terminal look
function EdgeGlow({
  width,
  height,
  color,
  thickness = 0.02,
}: {
  width: number;
  height: number;
  color: string;
  thickness?: number;
}) {
  const threeColor = useMemo(() => new THREE.Color(color), [color]);

  // Create edge positions
  const edges = useMemo(
    () => [
      // Top edge
      {
        pos: [0, height / 2, 0.01] as [number, number, number],
        scale: [width, thickness, 1] as [number, number, number],
      },
      // Bottom edge
      {
        pos: [0, -height / 2, 0.01] as [number, number, number],
        scale: [width, thickness, 1] as [number, number, number],
      },
      // Left edge
      {
        pos: [-width / 2, 0, 0.01] as [number, number, number],
        scale: [thickness, height, 1] as [number, number, number],
      },
      // Right edge
      {
        pos: [width / 2, 0, 0.01] as [number, number, number],
        scale: [thickness, height, 1] as [number, number, number],
      },
    ],
    [width, height, thickness]
  );

  return (
    <>
      {edges.map((edge, i) => (
        <mesh key={i} position={edge.pos} scale={edge.scale}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color={threeColor} transparent opacity={0.8} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

export interface PanelGlowProps {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Glow color (hex) */
  color?: string;
  /** Base glow intensity (0-1) */
  intensity?: number;
  /** Bloom strength */
  bloomIntensity?: number;
  /** Bloom radius/spread */
  bloomRadius?: number;
  /** Show edge lines */
  showEdges?: boolean;
  /** Pulse animation speed */
  pulseSpeed?: number;
  /** Pulse animation amount */
  pulseAmount?: number;
  /** Additional CSS class */
  className?: string;
}

/**
 * PanelGlow - WebGL bloom effect for UI panels
 * Creates a true HDR bloom glow behind panel elements
 */
export function PanelGlow({
  width,
  height,
  color = "#caa554",
  intensity = 0.15,
  bloomIntensity = 1.5,
  bloomRadius = 0.8,
  showEdges = true,
  pulseSpeed = 0.5,
  pulseAmount = 0.05,
  className = "",
}: PanelGlowProps) {
  // Convert pixel dimensions to normalized units (assuming ~100px = 1 unit)
  const scale = 100;
  const w = width / scale;
  const h = height / scale;

  return (
    <div
      className={`panel-glow ${className}`}
      style={{
        position: "absolute",
        inset: -20, // Extend beyond panel for bloom spread
        pointerEvents: "none",
        zIndex: -1,
      }}
    >
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: "transparent" }}
      >
        {/* Main glow plane */}
        <GlowPlane
          width={w}
          height={h}
          color={color}
          intensity={intensity}
          pulseSpeed={pulseSpeed}
          pulseAmount={pulseAmount}
        />

        {/* Edge highlights */}
        {showEdges && <EdgeGlow width={w} height={h} color={color} thickness={0.03} />}

        {/* Bloom post-processing */}
        <EffectComposer>
          <Bloom
            intensity={bloomIntensity}
            luminanceThreshold={0}
            luminanceSmoothing={0.9}
            radius={bloomRadius}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

export default PanelGlow;
