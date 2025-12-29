"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, Line, Html } from "@react-three/drei";
import * as THREE from "three";
import type { IsometricSection } from "@/design/isometric/sections";
import { ISOMETRIC_SECTIONS } from "@/design/isometric/sections";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS & THEME - Matching Thoughtform palette
// ═══════════════════════════════════════════════════════════════

const COLORS = {
  background: "#0a0908",
  terrain: "#ebe3d6", // Dawn/cream for contours
  accent: "#caa554", // Gold
  alert: "#e74c3c", // Red for connections
  glow: "#FF6B35", // Orange glow
  grid: "#1a1816",
};

// ═══════════════════════════════════════════════════════════════
// TERRAIN GENERATION - Same logic as ParticleCanvasV2
// ═══════════════════════════════════════════════════════════════

const MANIFOLD_CONFIG = {
  waveFrequency: 0.08,
  waveAmplitude: 180,
  rows: 160,
};

/**
 * Calculate terrain height at given X, Z coordinates
 * This is the EXACT same function from ParticleCanvasV2
 */
function getTerrainY(x: number, z: number): number {
  const config = MANIFOLD_CONFIG;
  const clampedZ = Math.max(0, Math.min(160, z));
  const r = clampedZ;
  const c = x / 65 + 35;

  const wavePhase = r * 0.02;
  let y =
    Math.sin(c * config.waveFrequency + wavePhase) * config.waveAmplitude +
    Math.cos(r * 0.12) * 150 +
    Math.sin(c * 0.35 + r * 0.15) * 70 +
    Math.sin(r * 0.08) * 100;

  // Mountain range effect in far background (after row ~100)
  const mountainStart = 100;
  if (r > mountainStart) {
    const mountainProgress = (r - mountainStart) / (config.rows - mountainStart);
    const maxMountainHeight = 400;
    const mountainHeight = mountainProgress * maxMountainHeight;

    const peakFreq1 = 0.08;
    const peakFreq2 = 0.15;
    const peakFreq3 = 0.03;

    const peak1 = Math.pow(Math.max(0, Math.sin(c * peakFreq1 + 1.5)), 2) * mountainHeight;
    const peak2 = Math.pow(Math.max(0, Math.sin(c * peakFreq2 + 0.8)), 2) * mountainHeight * 0.6;
    const peak3 = Math.pow(Math.max(0, Math.sin(c * peakFreq3)), 1.5) * mountainHeight * 0.8;

    y -= (peak1 + peak2 + peak3) * 0.7;
  }

  return y * 0.015; // Scale down for Three.js units
}

// ═══════════════════════════════════════════════════════════════
// TOPOGRAPHIC CONTOUR LINES - Smooth flowing curves
// ═══════════════════════════════════════════════════════════════

function ContourLines() {
  const contours = useMemo(() => {
    const lines: { points: THREE.Vector3[]; isMajor: boolean }[] = [];
    const gridSize = 140;
    const gridResolution = 80;
    const step = gridSize / gridResolution;
    const contourInterval = 0.5;
    const minElevation = -4;
    const maxElevation = 4;

    // Sample terrain heights
    const heights: number[][] = [];
    for (let zi = 0; zi <= gridResolution; zi++) {
      heights[zi] = [];
      for (let xi = 0; xi <= gridResolution; xi++) {
        const x = (xi - gridResolution / 2) * step;
        const z = (zi / gridResolution) * 160;
        heights[zi][xi] = getTerrainY(x * 30, z);
      }
    }

    // Marching squares - trace closed contours
    let contourIndex = 0;
    for (let elevation = minElevation; elevation <= maxElevation; elevation += contourInterval) {
      const isMajor = contourIndex % 3 === 0;
      contourIndex++;

      // For each cell, check all 4 edges for contour crossings
      for (let zi = 0; zi < gridResolution; zi++) {
        for (let xi = 0; xi < gridResolution; xi++) {
          const h00 = heights[zi][xi];
          const h10 = heights[zi][xi + 1];
          const h01 = heights[zi + 1][xi];
          const h11 = heights[zi + 1][xi + 1];

          const crossings: THREE.Vector3[] = [];

          // Bottom edge (h00 to h10)
          if ((h00 <= elevation && h10 > elevation) || (h00 > elevation && h10 <= elevation)) {
            const t = (elevation - h00) / (h10 - h00);
            const x = (xi - gridResolution / 2 + t) * step;
            const z = zi * step - gridSize / 2;
            crossings.push(new THREE.Vector3(x, elevation, z));
          }

          // Right edge (h10 to h11)
          if ((h10 <= elevation && h11 > elevation) || (h10 > elevation && h11 <= elevation)) {
            const t = (elevation - h10) / (h11 - h10);
            const x = (xi + 1 - gridResolution / 2) * step;
            const z = (zi + t) * step - gridSize / 2;
            crossings.push(new THREE.Vector3(x, elevation, z));
          }

          // Top edge (h01 to h11)
          if ((h01 <= elevation && h11 > elevation) || (h01 > elevation && h11 <= elevation)) {
            const t = (elevation - h01) / (h11 - h01);
            const x = (xi - gridResolution / 2 + t) * step;
            const z = (zi + 1) * step - gridSize / 2;
            crossings.push(new THREE.Vector3(x, elevation, z));
          }

          // Left edge (h00 to h01)
          if ((h00 <= elevation && h01 > elevation) || (h00 > elevation && h01 <= elevation)) {
            const t = (elevation - h00) / (h01 - h00);
            const x = (xi - gridResolution / 2) * step;
            const z = (zi + t) * step - gridSize / 2;
            crossings.push(new THREE.Vector3(x, elevation, z));
          }

          // Connect crossings as line segments
          if (crossings.length >= 2) {
            lines.push({ points: crossings.slice(0, 2), isMajor });
            if (crossings.length === 4) {
              lines.push({ points: crossings.slice(2, 4), isMajor });
            }
          }
        }
      }
    }

    return lines;
  }, []);

  return (
    <group>
      {contours.map((contour, i) => (
        <Line
          key={i}
          points={contour.points}
          color={COLORS.terrain}
          lineWidth={contour.isMajor ? 1.5 : 0.8}
          transparent
          opacity={contour.isMajor ? 0.55 : 0.2}
        />
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// TOWER STRUCTURE - Golden crystalline city like reference
// ═══════════════════════════════════════════════════════════════

function DataTower({
  position,
  label,
  height = 15,
}: {
  position: [number, number, number];
  label: string;
  height?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Generate complex tower structure with many vertical bars
  const towerLines = useMemo(() => {
    const lines: THREE.Vector3[][] = [];
    const baseSize = 4;

    // Create many vertical bars at different heights - like a city skyline
    const barCount = 60;
    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2 + Math.random() * 0.3;
      const radiusVariation = 0.2 + Math.random() * 0.8;
      const radius = baseSize * radiusVariation;
      const barHeight = height * (0.3 + Math.random() * 0.7);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Vertical bar
      lines.push([new THREE.Vector3(x, 0, z), new THREE.Vector3(x * 0.6, barHeight, z * 0.6)]);
    }

    // Inner core - taller spires
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const radius = baseSize * 0.3 * (0.5 + Math.random() * 0.5);
      const barHeight = height * (0.8 + Math.random() * 0.4);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      lines.push([new THREE.Vector3(x, 0, z), new THREE.Vector3(x * 0.2, barHeight, z * 0.2)]);
    }

    // Central tallest spire
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = baseSize * 0.15;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      lines.push([new THREE.Vector3(x, 0, z), new THREE.Vector3(0, height * 1.4, 0)]);
    }

    // Horizontal platform rings
    const ringLevels = [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85];
    for (const levelRatio of ringLevels) {
      const y = levelRatio * height;
      const ringRadius = baseSize * (1 - levelRatio * 0.6);
      const ringPoints: THREE.Vector3[] = [];

      for (let i = 0; i <= 48; i++) {
        const angle = (i / 48) * Math.PI * 2;
        ringPoints.push(
          new THREE.Vector3(Math.cos(angle) * ringRadius, y, Math.sin(angle) * ringRadius)
        );
      }
      lines.push(ringPoints);
    }

    // Base platform square
    const platformSize = baseSize * 1.3;
    lines.push([
      new THREE.Vector3(-platformSize, 0, -platformSize * 0.6),
      new THREE.Vector3(platformSize, 0, -platformSize * 0.6),
      new THREE.Vector3(platformSize, 0, platformSize * 0.6),
      new THREE.Vector3(-platformSize, 0, platformSize * 0.6),
      new THREE.Vector3(-platformSize, 0, -platformSize * 0.6),
    ]);

    return lines;
  }, [height]);

  useFrame((state) => {
    if (groupRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
      groupRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={position}>
      <group ref={groupRef}>
        {/* Tower structure */}
        {towerLines.map((points, i) => (
          <Line
            key={i}
            points={points}
            color={COLORS.accent}
            lineWidth={i < 80 ? 1.2 : 1}
            transparent
            opacity={i < 60 ? 0.9 : 0.7}
          />
        ))}

        {/* Base glow disc */}
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[6, 32]} />
          <meshBasicMaterial color={COLORS.glow} transparent opacity={0.2} />
        </mesh>

        {/* Inner glow */}
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[3, 32]} />
          <meshBasicMaterial color={COLORS.accent} transparent opacity={0.3} />
        </mesh>

        {/* Point lights for glow effect */}
        <pointLight
          color={COLORS.accent}
          intensity={3}
          distance={30}
          position={[0, height / 3, 0]}
        />
        <pointLight color={COLORS.glow} intensity={1.5} distance={15} position={[0, 0.5, 0]} />
      </group>

      {/* Label */}
      <Html distanceFactor={35} position={[8, height * 0.6, 0]} transform sprite>
        <div className="flex flex-col gap-1 pointer-events-none font-mono min-w-[180px]">
          <div className="text-[10px] text-white/40 flex items-center gap-2">
            <span className="w-1 h-1 bg-white/40" />
            12.00.162.502
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-[10px] text-white/50 uppercase tracking-[0.25em]">City</span>
            <span className="text-4xl font-light text-white tracking-tight">{label}</span>
            <span className="text-xl text-[#caa554] tracking-tighter">{"////////"}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[9px] text-white/40 mt-3 border-t border-white/10 pt-2">
            <div className="flex justify-between gap-4">
              <span className="uppercase">Population</span>
              <span className="text-white/70 tabular-nums">5,450,765</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="uppercase">Timezone</span>
              <span className="text-white/70">UTC+3</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="uppercase">Est</span>
              <span className="text-white/70">27.10.1832</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="uppercase">ID</span>
              <span className="text-white/70 tabular-nums">74002450R</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="uppercase">Area</span>
              <span className="text-white/70">1,982²</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="uppercase">Status</span>
              <span className="text-[#caa554] font-medium">FC</span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONNECTION LINES - Red/orange like reference
// ═══════════════════════════════════════════════════════════════

function ConnectionLine({
  start,
  end,
}: {
  start: [number, number, number];
  end: [number, number, number];
}) {
  const points = useMemo(() => {
    return [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  }, [start, end]);

  return <Line points={points} color={COLORS.alert} lineWidth={1} transparent opacity={0.6} />;
}

// ═══════════════════════════════════════════════════════════════
// GRID PLANE - Subtle base grid
// ═══════════════════════════════════════════════════════════════

function BaseGrid() {
  const gridLines = useMemo(() => {
    const lines: THREE.Vector3[][] = [];
    const size = 120;
    const divisions = 30;
    const step = size / divisions;

    // Grid lines
    for (let i = -divisions / 2; i <= divisions / 2; i++) {
      const pos = i * step;
      // X-axis lines
      lines.push([new THREE.Vector3(-size / 2, -8, pos), new THREE.Vector3(size / 2, -8, pos)]);
      // Z-axis lines
      lines.push([new THREE.Vector3(pos, -8, -size / 2), new THREE.Vector3(pos, -8, size / 2)]);
    }

    return lines;
  }, []);

  return (
    <group>
      {gridLines.map((points, i) => (
        <Line
          key={i}
          points={points}
          color={COLORS.grid}
          lineWidth={0.5}
          transparent
          opacity={0.3}
        />
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// SMALL MARKERS - Corner brackets like reference
// ═══════════════════════════════════════════════════════════════

function CornerMarker({ position }: { position: [number, number, number] }) {
  const size = 1.5;
  const points = [
    // L-shape bracket
    [new THREE.Vector3(-size, 0, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -size)],
  ];

  return (
    <group position={position}>
      {points.map((pts, i) => (
        <Line key={i} points={pts} color="#3498db" lineWidth={2} transparent opacity={0.8} />
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCROLL CAMERA RIG - Fly/scroll through sections (main-page-style)
// ═══════════════════════════════════════════════════════════════

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getSectionSegment(
  sections: readonly IsometricSection[],
  scrollProgress: number
): { from: IsometricSection; to: IsometricSection; t: number } {
  const p = clamp01(scrollProgress);
  if (sections.length === 0) {
    throw new Error("IsometricManifold: sections must not be empty");
  }

  // Find segment i where p is within sections[i].range
  let i = 0;
  for (let idx = 0; idx < sections.length; idx++) {
    const [start, end] = sections[idx].range;
    if (p >= start && p <= end) {
      i = idx;
      break;
    }
    if (p > end) i = idx; // after this range -> keep last seen
  }

  const from = sections[i];
  const to = sections[Math.min(i + 1, sections.length - 1)];
  const [start, end] = from.range;
  const span = Math.max(1e-6, end - start);
  const localT = clamp01((p - start) / span);
  return { from, to, t: easeInOutCubic(localT) };
}

function ScrollCameraRig({
  scrollProgress,
  sections,
}: {
  scrollProgress: number;
  sections: readonly IsometricSection[];
}) {
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera;
  const scrollRef = useRef(scrollProgress);

  const targetV = useMemo(() => new THREE.Vector3(), []);
  const desiredTargetV = useMemo(() => new THREE.Vector3(), []);
  const desiredPosV = useMemo(() => new THREE.Vector3(), []);

  // Fixed isometric offset (camera position relative to target)
  const cameraOffset = useMemo(() => new THREE.Vector3(50, 70, 50), []);

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useFrame((_state, delta) => {
    const { from, to, t } = getSectionSegment(sections, scrollRef.current);

    desiredTargetV.set(
      THREE.MathUtils.lerp(from.target[0], to.target[0], t),
      THREE.MathUtils.lerp(from.target[1], to.target[1], t),
      THREE.MathUtils.lerp(from.target[2], to.target[2], t)
    );

    const desiredZoom = THREE.MathUtils.lerp(from.zoom, to.zoom, t);

    // Damped camera target + position
    targetV.x = THREE.MathUtils.damp(targetV.x, desiredTargetV.x, 6, delta);
    targetV.y = THREE.MathUtils.damp(targetV.y, desiredTargetV.y, 6, delta);
    targetV.z = THREE.MathUtils.damp(targetV.z, desiredTargetV.z, 6, delta);

    desiredPosV.copy(targetV).add(cameraOffset);

    camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredPosV.x, 6, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, desiredPosV.y, 6, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredPosV.z, 6, delta);

    camera.zoom = THREE.MathUtils.damp(camera.zoom, desiredZoom, 6, delta);
    camera.lookAt(targetV);
    camera.updateProjectionMatrix();
  });

  return null;
}

// ═══════════════════════════════════════════════════════════════
// PARTICLE FIELD - Terrain particles and ambient dust
// ═══════════════════════════════════════════════════════════════

function ParticleField() {
  const { terrainParticles, dustParticles } = useMemo(() => {
    const terrain: number[] = [];
    const dust: number[] = [];
    const terrainCount = 8000;
    const dustCount = 2000;

    // Terrain-following particles
    for (let i = 0; i < terrainCount; i++) {
      const x = (Math.random() - 0.5) * 120;
      const z = (Math.random() - 0.5) * 120;
      const terrainZ = ((z + 60) / 120) * 160;
      const y = getTerrainY(x * 30, terrainZ) + (Math.random() - 0.5) * 0.3;

      terrain.push(x, y, z);
    }

    // Floating dust particles
    for (let i = 0; i < dustCount; i++) {
      const x = (Math.random() - 0.5) * 140;
      const y = Math.random() * 15 - 5;
      const z = (Math.random() - 0.5) * 140;

      dust.push(x, y, z);
    }

    return {
      terrainParticles: new Float32Array(terrain),
      dustParticles: new Float32Array(dust),
    };
  }, []);

  return (
    <group>
      {/* Terrain particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={terrainParticles.length / 3}
            array={terrainParticles}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          color={COLORS.terrain}
          transparent
          opacity={0.4}
          sizeAttenuation
        />
      </points>

      {/* Ambient dust */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={dustParticles.length / 3}
            array={dustParticles}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color={COLORS.terrain}
          transparent
          opacity={0.15}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// GRID PATTERNS - Subtle background elements
// ═══════════════════════════════════════════════════════════════

function GridPatterns() {
  const patterns = useMemo(() => {
    const elements: { position: [number, number, number]; size: number }[] = [];

    // Scatter small grid squares across the terrain
    for (let i = 0; i < 40; i++) {
      const x = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      const terrainZ = ((z + 50) / 100) * 160;
      const y = getTerrainY(x * 30, terrainZ);

      elements.push({
        position: [x, y + 0.1, z],
        size: 1 + Math.random() * 2,
      });
    }

    return elements;
  }, []);

  return (
    <group>
      {patterns.map((el, i) => (
        <group key={i} position={el.position} rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}>
          <Line
            points={[
              new THREE.Vector3(-el.size, 0, -el.size),
              new THREE.Vector3(el.size, 0, -el.size),
              new THREE.Vector3(el.size, 0, el.size),
              new THREE.Vector3(-el.size, 0, el.size),
              new THREE.Vector3(-el.size, 0, -el.size),
            ]}
            color={COLORS.terrain}
            lineWidth={0.5}
            transparent
            opacity={0.1}
          />
        </group>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN SCENE
// ═══════════════════════════════════════════════════════════════

function ManifoldScene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[50, 80, 30]} intensity={0.6} />

      {/* Main terrain group */}
      <group position={[0, 0, 0]}>
        {/* Base grid */}
        <BaseGrid />

        {/* Topographic contours */}
        <ContourLines />

        {/* Grid patterns scattered on terrain */}
        <GridPatterns />

        {/* Scattered particles */}
        <ParticleField />

        {/* Main tower structure */}
        <DataTower position={[0, getTerrainY(0, 80), 0]} label="F01" height={22} />

        {/* Corner markers */}
        <CornerMarker position={[-12, getTerrainY(-360, 80) + 0.5, 8]} />
        <CornerMarker position={[15, getTerrainY(450, 80) + 0.5, 12]} />
        <CornerMarker position={[-18, getTerrainY(-540, 80) + 0.5, -15]} />
        <CornerMarker position={[8, getTerrainY(240, 80) + 0.5, -20]} />

        {/* Connection lines */}
        <ConnectionLine start={[-55, 6, -45]} end={[0, 12, 0]} />
        <ConnectionLine start={[55, 4, -35]} end={[0, 12, 0]} />
        <ConnectionLine start={[35, 5, 45]} end={[65, 3, 55]} />
        <ConnectionLine start={[-40, 3, 30]} end={[-60, 4, 45]} />
      </group>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function IsometricManifold({
  scrollProgress = 0,
  sections = ISOMETRIC_SECTIONS,
}: {
  /** Normalized scroll progress (0..1) */
  scrollProgress?: number;
  /** Section registry controlling alignment + travel speed */
  sections?: readonly IsometricSection[];
}) {
  return (
    <div className="w-full h-screen bg-[#0a0908] overflow-hidden">
      <Canvas shadows gl={{ antialias: true, alpha: true }}>
        {/* Orthographic Camera - steep isometric angle like reference */}
        <OrthographicCamera makeDefault zoom={10} position={[50, 70, 50]} near={0.1} far={1000} />

        <ScrollCameraRig scrollProgress={scrollProgress} sections={sections} />

        <ManifoldScene />
      </Canvas>

      {/* UI OVERLAY */}
      <div className="absolute top-6 left-6 z-10 font-mono pointer-events-none">
        <div className="flex items-center gap-3 text-[10px] text-white/40 uppercase tracking-[0.2em]">
          <div className="w-2 h-2 bg-[#caa554] rounded-full animate-pulse" />
          <span>Isometric Manifold // Sector View</span>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-10 font-mono text-right pointer-events-none">
        <div className="text-[9px] uppercase tracking-[0.3em] text-white/30">
          Thoughtform.co // Manifold_Projection_v2
        </div>
      </div>

      {/* SCANLINE OVERLAY */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] bg-[length:100%_2px,3px_100%]" />

      {/* VIGNETTE */}
      <div className="absolute inset-0 pointer-events-none z-40 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(10,9,8,0.8)_100%)]" />
    </div>
  );
}
