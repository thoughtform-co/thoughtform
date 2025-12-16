"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { type GatewayConfig, DEFAULT_GATEWAY } from "@/lib/particle-config";

// ═══════════════════════════════════════════════════════════════
// THREE.JS GATEWAY - COMPACT PORTAL ON RIGHT SIDE
// Like thoughtform.co - a contained circular object, not scattered particles
// ═══════════════════════════════════════════════════════════════

// Default colors (overridable via config)
const DEFAULT_PRIMARY = "#ebe3d6";
const DEFAULT_ACCENT = "#caa554";

// ─── PORTAL OUTER RING (the main circular edge) ───
function PortalRing({ opacity, color }: { opacity: number; color: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const points: number[] = [];
    
    // Dense outer ring with thickness - FIXED counts
    const baseRadius = 1.0;
    const thickness = 0.15;
    const depthLayers = 8;
    const pointsPerRing = 250; // Fixed count
    
    for (let layer = 0; layer < depthLayers; layer++) {
      const z = layer * 0.08;
      
      for (let i = 0; i < pointsPerRing; i++) {
        const angle = (i / pointsPerRing) * Math.PI * 2;
        const r = baseRadius + (Math.random() - 0.5) * thickness;
        
        points.push(
          Math.cos(angle) * r,
          Math.sin(angle) * r,
          z + (Math.random() - 0.5) * 0.05
        );
      }
    }
    
    return new Float32Array(points);
  }, []);
  
  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      const breathe = Math.sin(time * 0.4) * 0.008;
      pointsRef.current.scale.setScalar(1 + breathe);
      
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.85 * opacity;
    }
  });
  
  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={0.012}
        sizeAttenuation
        depthWrite={false}
        opacity={0.85}
      />
    </Points>
  );
}

// ─── PORTAL TUNNEL (depth going INTO the portal) - WORMHOLE EFFECT ───
function PortalTunnel({ opacity, color }: { opacity: number; color: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const points: number[] = [];
    
    // Tunnel rings - FIXED particle counts for buffer stability
    const tunnelDepth = 35;
    const startRadius = 0.95;
    const particlesPerRing = 100; // Fixed count
    
    for (let d = 0; d < tunnelDepth; d++) {
      const t = d / tunnelDepth;
      const z = 0.2 + d * 0.18;
      const radius = startRadius - t * 0.25;
      
      for (let i = 0; i < particlesPerRing; i++) {
        const angle = (i / particlesPerRing) * Math.PI * 2;
        const jitter = (Math.random() - 0.5) * 0.04;
        
        points.push(
          Math.cos(angle) * (radius + jitter),
          Math.sin(angle) * (radius + jitter),
          z
        );
      }
    }
    
    // Spiral lines
    const spiralArms = 6;
    const pointsPerSpiral = 30;
    for (let arm = 0; arm < spiralArms; arm++) {
      const baseAngle = (arm / spiralArms) * Math.PI * 2;
      for (let d = 0; d < pointsPerSpiral; d++) {
        const t = d / pointsPerSpiral;
        const z = 0.5 + d * 0.15;
        const radius = 0.8 - t * 0.2;
        const angle = baseAngle + t * Math.PI * 0.4;
        
        points.push(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          z
        );
      }
    }
    
    return new Float32Array(points);
  }, []);
  
  useFrame(() => {
    if (pointsRef.current) {
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.5 * opacity;
    }
  });
  
  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={0.008}
        sizeAttenuation
        depthWrite={false}
        opacity={0.5}
      />
    </Points>
  );
}

// ─── GOLD INNER RING (accent) ───
function GoldInnerRing({ opacity, color }: { opacity: number; color: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const points: number[] = [];
    
    // Thin gold accent ring - FIXED counts
    const radius = 0.88;
    const layers = 4;
    const pointsPerLayer = 150; // Fixed count
    
    for (let layer = 0; layer < layers; layer++) {
      const z = layer * 0.05;
      
      for (let i = 0; i < pointsPerLayer; i++) {
        const angle = (i / pointsPerLayer) * Math.PI * 2;
        const r = radius + (Math.random() - 0.5) * 0.04;
        points.push(
          Math.cos(angle) * r,
          Math.sin(angle) * r,
          z
        );
      }
    }
    
    return new Float32Array(points);
  }, []);
  
  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      const pulse = Math.sin(time * 1.2) * 0.15 + 0.7;
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = pulse * opacity;
    }
  });
  
  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={0.015}
        sizeAttenuation
        depthWrite={false}
        opacity={0.7}
      />
    </Points>
  );
}

// ─── GEOMETRIC ACCENT LINES (like in the key visual) ───
function GeometricLines({ opacity, color }: { opacity: number; color: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const points: number[] = [];
    
    // Radial lines extending outward - FIXED counts
    const numLines = 16;
    const innerRadius = 1.1;
    const outerRadius = 2.0;
    const pointsPerLine = 35;
    
    for (let line = 0; line < numLines; line++) {
      const baseAngle = (line / numLines) * Math.PI * 2;
      
      for (let p = 0; p < pointsPerLine; p++) {
        const t = p / pointsPerLine;
        const r = innerRadius + (outerRadius - innerRadius) * t;
        const angleJitter = (Math.random() - 0.5) * 0.015;
        
        points.push(
          Math.cos(baseAngle + angleJitter) * r,
          Math.sin(baseAngle + angleJitter) * r,
          (Math.random() - 0.5) * 0.08
        );
      }
    }
    
    // Orbit lines - FIXED count per orbit
    const orbitRadii = [1.15, 1.35, 1.6, 1.9];
    const pointsPerOrbit = 120; // Fixed count
    orbitRadii.forEach((orbitRadius, idx) => {
      for (let i = 0; i < pointsPerOrbit; i++) {
        const angle = (i / pointsPerOrbit) * Math.PI * 2;
        points.push(
          Math.cos(angle) * orbitRadius,
          Math.sin(angle) * orbitRadius,
          idx * 0.05
        );
      }
    });
    
    return new Float32Array(points);
  }, []);
  
  useFrame(() => {
    if (pointsRef.current) {
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.35 * opacity;
    }
  });
  
  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={0.006}
        sizeAttenuation
        depthWrite={false}
        opacity={0.35}
      />
    </Points>
  );
}

// ─── GRID EXTENDING TO MANIFOLD ───
function ManifoldGrid({ opacity, color }: { opacity: number; color: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const points: number[] = [];
    
    // Perspective grid lines - fade out, don't converge to a point
    const gridLines = 20;
    const startZ = 1;
    const endZ = 8; // Shorter - fades before endpoint
    
    for (let line = 0; line < gridLines; line++) {
      const baseAngle = (line / gridLines) * Math.PI * 2;
      const pointsPerLine = 35;
      
      for (let p = 0; p < pointsPerLine; p++) {
        const t = p / pointsPerLine;
        const z = startZ + t * (endZ - startZ);
        // Minimal narrowing - stays wide
        const startRadius = 1.0;
        const radius = startRadius - t * 0.3;
        
        points.push(
          Math.cos(baseAngle) * radius,
          Math.sin(baseAngle) * radius,
          z
        );
      }
    }
    
    // Only a few subtle rings - not at deep depths
    const ringDepths = [2, 4];
    ringDepths.forEach((depth, idx) => {
      const ringRadius = 0.85 - idx * 0.1;
      const pointsPerRing = 80;
      
      for (let i = 0; i < pointsPerRing; i++) {
        const angle = (i / pointsPerRing) * Math.PI * 2;
        points.push(
          Math.cos(angle) * ringRadius,
          Math.sin(angle) * ringRadius,
          depth
        );
      }
    });
    
    return new Float32Array(points);
  }, []);
  
  useFrame(() => {
    if (pointsRef.current) {
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.2 * opacity;
    }
  });
  
  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={0.005}
        sizeAttenuation
        depthWrite={false}
        opacity={0.2}
      />
    </Points>
  );
}

// ─── SCATTERED PARTICLES (texture/atmosphere) ───
function ScatteredParticles({ opacity, color }: { opacity: number; color: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const points: number[] = [];
    
    // Particles scattered around the rim
    const rimParticles = 400;
    for (let i = 0; i < rimParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.85 + Math.random() * 0.5;
      const z = (Math.random() - 0.5) * 1.0;
      
      points.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        z
      );
    }
    
    // DENSE floating particles INSIDE the tunnel
    const tunnelParticles = 600;
    for (let i = 0; i < tunnelParticles; i++) {
      const t = Math.random() * 0.75;
      const z = 0.3 + t * 6;
      // Fill the interior - from center outward
      const maxRadius = 0.8 - t * 0.15;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * maxRadius; // Can be anywhere from 0 to maxRadius
      
      points.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        z
      );
    }
    
    return new Float32Array(points);
  }, []);
  
  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      // Subtle drift
      pointsRef.current.rotation.z = Math.sin(time * 0.1) * 0.02;
      
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.4 * opacity;
    }
  });
  
  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={0.01}
        sizeAttenuation
        depthWrite={false}
        opacity={0.4}
      />
    </Points>
  );
}

// ─── INTERIOR FLOW STREAKS (wormhole travel effect) ───
function InteriorStreaks({ opacity, color }: { opacity: number; color: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const points: number[] = [];
    
    // Radial streaks - FIXED counts
    const numStreaks = 40;
    const streakLength = 20; // Fixed length
    for (let streak = 0; streak < numStreaks; streak++) {
      const baseAngle = (streak / numStreaks) * Math.PI * 2;
      const baseRadius = 0.3 + (streak % 10) * 0.04; // Deterministic variation
      
      for (let p = 0; p < streakLength; p++) {
        const t = p / streakLength;
        const z = 0.5 + t * 5;
        const radius = baseRadius - t * 0.1;
        const angle = baseAngle + t * 0.2;
        
        points.push(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          z
        );
      }
    }
    
    // Central core particles - FIXED count
    const coreParticles = 300;
    for (let i = 0; i < coreParticles; i++) {
      const t = (i / coreParticles) * 0.8;
      const z = 0.8 + t * 4;
      const angle = (i / coreParticles) * Math.PI * 20; // Deterministic spiral
      const radius = (1 - i / coreParticles) * 0.5;
      
      points.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        z
      );
    }
    
    // Swirling bands - FIXED counts
    const numBands = 8;
    const pointsInBand = 50;
    for (let band = 0; band < numBands; band++) {
      const bandZ = 1 + band * 0.6;
      const bandRadius = 0.6 - band * 0.04;
      const bandOffset = band * 0.3;
      
      for (let i = 0; i < pointsInBand; i++) {
        const angle = (i / pointsInBand) * Math.PI * 2 + bandOffset;
        const jitter = ((i % 5) - 2) * 0.02; // Deterministic jitter
        
        points.push(
          Math.cos(angle) * (bandRadius + jitter),
          Math.sin(angle) * (bandRadius + jitter),
          bandZ
        );
      }
    }
    
    return new Float32Array(points);
  }, []);
  
  useFrame((state) => {
    if (pointsRef.current) {
      // Subtle rotation for flow effect
      const time = state.clock.elapsedTime;
      pointsRef.current.rotation.z = time * 0.03;
      
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.45 * opacity;
    }
  });
  
  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={0.007}
        sizeAttenuation
        depthWrite={false}
        opacity={0.45}
      />
    </Points>
  );
}

// ─── GOLD DEPTH MARKERS ───
function GoldDepthMarkers({ opacity, color }: { opacity: number; color: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const points: number[] = [];
    
    // Gold accent points - only near the entrance, not deep
    const depths = [0.8, 1.8, 3];
    depths.forEach((depth, idx) => {
      const radius = 0.8 - idx * 0.05;
      const numPoints = 12;
      
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2 + idx * 0.2;
        points.push(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          depth
        );
      }
    });
    
    // Short gold spiral accents - stay wide
    for (let arm = 0; arm < 4; arm++) {
      const baseAngle = (arm / 4) * Math.PI * 2;
      for (let p = 0; p < 18; p++) {
        const t = p / 18;
        const z = 0.5 + t * 3.5;
        const radius = 0.75 - t * 0.15; // Minimal narrowing
        const angle = baseAngle + t * Math.PI * 0.4;
        
        points.push(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          z
        );
      }
    }
    
    return new Float32Array(points);
  }, []);
  
  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      const pulse = Math.sin(time * 1.5) * 0.1 + 0.9;
      
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.6 * opacity * pulse;
    }
  });
  
  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={0.018}
        sizeAttenuation
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

// ─── FLYING CAMERA (moves through the gateway) ───
function FlyingCamera({ scrollProgress, gatewayX }: { scrollProgress: number; gatewayX: number }) {
  const { camera } = useThree();
  
  useFrame(() => {
    // Camera starts in front of gateway, flies THROUGH it
    const startZ = 0;
    const endZ = 18;
    const z = startZ + scrollProgress * endZ * 5;
    
    // Camera X: align with gateway center
    const x = scrollProgress < 0.08 ? gatewayX * (scrollProgress / 0.08) : gatewayX;
    
    camera.position.set(x, 0.15, z);
    camera.lookAt(gatewayX, 0.15, z + 10);
  });
  
  return null;
}

// ─── GATEWAY SCENE ───
interface GatewaySceneProps {
  scrollProgress: number;
  config: GatewayConfig;
}

function GatewayScene({ scrollProgress, config }: GatewaySceneProps) {
  // Calculate opacity - fade out AFTER we pass through
  // Gateway is at Z=4, we pass through around scrollProgress 0.06-0.14
  const opacity = scrollProgress > 0.06 
    ? Math.max(0, 1 - (scrollProgress - 0.06) * 10) 
    : 1;
  
  if (opacity <= 0) return null;

  const primaryColor = config.primaryColor || DEFAULT_PRIMARY;
  const accentColor = config.accentColor || DEFAULT_ACCENT;
  
  return (
    <>
      <FlyingCamera scrollProgress={scrollProgress} gatewayX={config.positionX} />
      
      {/* Gateway positioned via config */}
      <group 
        position={[config.positionX, config.positionY + 0.05, 4]}
        rotation={[0.1, config.rotationY, 0]}
        scale={config.scale}
      >
        {/* Core structure */}
        <PortalRing opacity={opacity} color={primaryColor} />
        <PortalTunnel opacity={opacity} color={primaryColor} />
        <GoldInnerRing opacity={opacity} color={accentColor} />
        
        {/* Geometric details */}
        <GeometricLines opacity={opacity} color={primaryColor} />
        
        {/* Grid extending toward manifold */}
        <ManifoldGrid opacity={opacity} color={primaryColor} />
        
        {/* INTERIOR - makes it feel like a wormhole */}
        <InteriorStreaks opacity={opacity} color={primaryColor} />
        
        {/* Texture and atmosphere */}
        <ScatteredParticles opacity={opacity} color={primaryColor} />
        
        {/* Gold accents for depth */}
        <GoldDepthMarkers opacity={opacity} color={accentColor} />
      </group>
    </>
  );
}

// ─── MAIN COMPONENT (Gateway Overlay Only) ───
interface ThreeGatewayProps {
  scrollProgress: number;
  config?: GatewayConfig;
}

export function ThreeGateway({ scrollProgress, config }: ThreeGatewayProps) {
  // Merge with defaults
  const gatewayConfig = { ...DEFAULT_GATEWAY, ...config };
  
  // Don't render if disabled or past the gateway
  if (!gatewayConfig.enabled || scrollProgress > 0.20) return null;
  
  return (
    <div 
      style={{ 
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1, // Above the canvas manifold
        pointerEvents: "none",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 0], fov: 60 }}
        gl={{ 
          antialias: true,
          alpha: true, // Transparent background!
        }}
        style={{ background: "transparent" }}
      >
        <GatewayScene scrollProgress={scrollProgress} config={gatewayConfig} />
      </Canvas>
    </div>
  );
}

