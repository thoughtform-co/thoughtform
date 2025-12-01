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
// STARFIELD PRESET - Classic rotating star sphere
// ═══════════════════════════════════════════════════════════════════

function StarfieldScene() {
  const ref = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 10 + 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const intensity = 0.5 + Math.random() * 0.5;
      colors[i * 3] = 0.92 * intensity;
      colors[i * 3 + 1] = 0.89 * intensity;
      colors[i * 3 + 2] = 0.84 * intensity;
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
// PARTICLES PRESET - Wave motion particles
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
// GEOMETRIC PRESET - Torus wireframe points
// ═══════════════════════════════════════════════════════════════════

function GeometricScene() {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const points: number[] = [];

    const majorR = 2;
    const minorR = 0.5;
    for (let i = 0; i < 200; i++) {
      const theta = (i / 200) * Math.PI * 2;
      const phi = ((i * 7) / 200) * Math.PI * 2;

      const x = (majorR + minorR * Math.cos(phi)) * Math.cos(theta);
      const y = (majorR + minorR * Math.cos(phi)) * Math.sin(theta);
      const z = minorR * Math.sin(phi);

      points.push(x, y, z);
    }

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
// NEBULA PRESET - Colorful cloud-like particles
// ═══════════════════════════════════════════════════════════════════

function NebulaScene() {
  const ref = useRef<THREE.Points>(null);

  const [positions, colors, sizes] = useMemo(() => {
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    // Color palette: gold, teal, dawn
    const palette = [
      [0.79, 0.65, 0.33], // gold
      [0.37, 0.73, 0.69], // teal
      [0.93, 0.91, 0.87], // dawn
    ];

    for (let i = 0; i < count; i++) {
      // Gaussian distribution for nebula shape
      const r = Math.sqrt(-2 * Math.log(Math.random())) * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Pick random color from palette
      const color = palette[Math.floor(Math.random() * palette.length)];
      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = color[0] * brightness;
      colors[i * 3 + 1] = color[1] * brightness;
      colors[i * 3 + 2] = color[2] * brightness;

      sizes[i] = 0.01 + Math.random() * 0.03;
    }

    return [positions, colors, sizes];
  }, []);

  useFrame((state) => {
    if (ref.current) {
      const time = state.clock.elapsedTime;
      ref.current.rotation.y = time * 0.03;
      ref.current.rotation.z = Math.sin(time * 0.02) * 0.1;
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
        opacity={0.8}
      />
    </Points>
  );
}

// ═══════════════════════════════════════════════════════════════════
// GRID PRESET - Infinite grid plane effect
// ═══════════════════════════════════════════════════════════════════

function GridScene() {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const points: number[] = [];
    const size = 20;
    const divisions = 40;

    for (let i = 0; i <= divisions; i++) {
      for (let j = 0; j <= divisions; j++) {
        const x = (i / divisions - 0.5) * size;
        const z = (j / divisions - 0.5) * size;
        points.push(x, 0, z);
      }
    }

    return new Float32Array(points);
  }, []);

  useFrame((state) => {
    if (ref.current) {
      const positions = ref.current.geometry.attributes.position;
      const time = state.clock.elapsedTime;

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);

        // Create rolling wave effect
        const wave =
          Math.sin(x * 0.5 + time) * Math.sin(z * 0.5 + time * 0.8) * 0.5;
        positions.setY(i, wave);
      }

      positions.needsUpdate = true;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#5EBBB1"
        size={0.03}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.5}
      />
    </Points>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SPIRAL PRESET - DNA-like double helix
// ═══════════════════════════════════════════════════════════════════

function SpiralScene() {
  const ref = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const points: number[] = [];
    const colorArray: number[] = [];
    const turns = 4;
    const pointsPerTurn = 100;
    const height = 8;
    const radius = 1.5;

    // Double helix
    for (let helix = 0; helix < 2; helix++) {
      const offset = helix * Math.PI;

      for (let i = 0; i < turns * pointsPerTurn; i++) {
        const t = i / (turns * pointsPerTurn);
        const angle = t * turns * Math.PI * 2 + offset;

        const x = Math.cos(angle) * radius;
        const y = (t - 0.5) * height;
        const z = Math.sin(angle) * radius;

        points.push(x, y, z);

        // Gold for one helix, teal for the other
        if (helix === 0) {
          colorArray.push(0.79, 0.65, 0.33);
        } else {
          colorArray.push(0.37, 0.73, 0.69);
        }
      }
    }

    // Connecting rungs
    for (let i = 0; i < turns * 10; i++) {
      const t = i / (turns * 10);
      const angle = t * turns * Math.PI * 2;
      const y = (t - 0.5) * height;

      // 5 points per rung
      for (let j = 0; j <= 4; j++) {
        const r = radius * (j / 4);
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        points.push(x, y, z);
        colorArray.push(0.93, 0.91, 0.87);
      }
    }

    return [new Float32Array(points), new Float32Array(colorArray)];
  }, []);

  useFrame((state) => {
    if (ref.current) {
      const time = state.clock.elapsedTime;
      ref.current.rotation.y = time * 0.15;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        vertexColors
        size={0.03}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.8}
      />
    </Points>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VORTEX PRESET - Swirling tunnel effect
// ═══════════════════════════════════════════════════════════════════

function VortexScene() {
  const ref = useRef<THREE.Points>(null);
  const initialPositions = useRef<Float32Array | null>(null);

  const positions = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const radius = 0.5 + t * 3;
      const angle = t * Math.PI * 20;
      const z = (t - 0.5) * 10;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = z;
    }

    return positions;
  }, []);

  // Store initial positions
  useMemo(() => {
    initialPositions.current = new Float32Array(positions);
  }, [positions]);

  useFrame((state) => {
    if (ref.current && initialPositions.current) {
      const time = state.clock.elapsedTime;
      const posAttr = ref.current.geometry.attributes.position;

      for (let i = 0; i < posAttr.count; i++) {
        const t = i / posAttr.count;
        const origZ = initialPositions.current[i * 3 + 2];

        // Animate along z-axis
        let newZ = origZ + time * 2;
        // Loop back when past the end
        if (newZ > 5) {
          newZ = ((newZ + 5) % 10) - 5;
        }

        posAttr.setZ(i, newZ);
      }

      posAttr.needsUpdate = true;
      ref.current.rotation.z = time * 0.1;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#CAA554"
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
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
  nebula: NebulaScene,
  grid: GridScene,
  spiral: SpiralScene,
  vortex: VortexScene,
};

export function ThreeBackground({
  preset,
  opacity = 0.5,
}: ThreeBackgroundProps) {
  const SceneComponent = PRESET_SCENES[preset];

  if (!SceneComponent) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-0" style={{ opacity }}>
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
