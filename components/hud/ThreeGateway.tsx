"use client";

import React from "react";
import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { type GatewayConfig, type GatewayShape, GATEWAY_SHAPE_IS_ATTRACTOR, DEFAULT_GATEWAY } from "@/lib/particle-config";

// ═══════════════════════════════════════════════════════════════
// THREE.JS GATEWAY - SOLID ARCHITECTURAL PORTAL
// Geometric shapes (2D outlines) and Strange Attractors (3D chaos)
// ═══════════════════════════════════════════════════════════════

const DEFAULT_PRIMARY = "#ebe3d6";
const DEFAULT_ACCENT = "#caa554";

// ─── STRANGE ATTRACTOR GENERATORS ───
// Generate 3D point clouds from mathematical chaos systems

interface AttractorPoint { x: number; y: number; z: number; }

function generateAttractorPoints(type: GatewayShape, count: number): AttractorPoint[] {
  const points: AttractorPoint[] = [];
  const dt = 0.005;
  const warmup = 500;
  
  // Initial conditions
  let x = 0.1 + Math.random() * 0.1;
  let y = 0.1 + Math.random() * 0.1;
  let z = 0.1 + Math.random() * 0.1;
  
  for (let i = 0; i < count + warmup; i++) {
    let dx = 0, dy = 0, dz = 0;
    
    switch (type) {
      case 'lorenz': {
        const sigma = 10, rho = 28, beta = 8/3;
        dx = sigma * (y - x);
        dy = x * (rho - z) - y;
        dz = x * y - beta * z;
        break;
      }
      case 'thomas': {
        const b = 0.208186;
        dx = Math.sin(y) - b * x;
        dy = Math.sin(z) - b * y;
        dz = Math.sin(x) - b * z;
        break;
      }
      case 'aizawa': {
        const a = 0.95, b = 0.7, c = 0.6, d = 3.5, e = 0.25, f = 0.1;
        dx = (z - b) * x - d * y;
        dy = d * x + (z - b) * y;
        dz = c + a * z - (z * z * z) / 3 - (x * x + y * y) * (1 + e * z) + f * z * x * x * x;
        break;
      }
      case 'sprott': {
        const a = 0.4, b = 1.2;
        dx = a * y * z;
        dy = x - y;
        dz = b - x * y;
        break;
      }
      case 'rossler': {
        const a = 0.2, b = 0.2, c = 5.7;
        dx = -(y + z);
        dy = x + a * y;
        dz = b + z * (x - c);
        break;
      }
      case 'dadras': {
        const p = 3, q = 2.7, r = 1.7, s = 2, e = 9;
        dx = y - p * x + q * y * z;
        dy = r * y - x * z + z;
        dz = s * x * y - e * z;
        break;
      }
      case 'galaxy': {
        // Galaxy is parametric, not differential
        if (i >= warmup) {
          const t = (i - warmup) * 0.01;
          const arm = (i - warmup) % 2;
          const armAngle = arm * Math.PI;
          const r = Math.pow(t % 10, 0.5) * 2;
          const spiral = t * 0.3 + armAngle;
          points.push({
            x: r * Math.cos(spiral) + (Math.random() - 0.5) * 0.5,
            y: (Math.random() - 0.5) * 0.3 * Math.exp(-r * 0.1),
            z: r * Math.sin(spiral) + (Math.random() - 0.5) * 0.5,
          });
        }
        continue;
      }
      default:
        continue;
    }
    
    // Euler integration
    x += dx * dt;
    y += dy * dt;
    z += dz * dt;
    
    if (i >= warmup) {
      points.push({ x, y, z });
    }
  }
  
  return normalizeAttractorPoints(points);
}

function normalizeAttractorPoints(points: AttractorPoint[]): AttractorPoint[] {
  if (points.length === 0) return points;
  
  // Find bounding box
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  
  for (const p of points) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
  }
  
  // Center and scale to fit radius of 1
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const rangeMax = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
  const scaleFactor = 2 / rangeMax;
  
  return points.map(p => ({
    x: (p.x - centerX) * scaleFactor,
    y: (p.y - centerY) * scaleFactor,
    z: (p.z - centerZ) * scaleFactor,
  }));
}

// Cache attractor points by type
const attractorCache = new Map<GatewayShape, AttractorPoint[]>();

function getCachedAttractorPoints(type: GatewayShape, count: number = 3000): AttractorPoint[] {
  if (!attractorCache.has(type)) {
    attractorCache.set(type, generateAttractorPoints(type, count));
  }
  return attractorCache.get(type)!;
}

// Check if shape is an attractor
function isAttractorShape(shape: GatewayShape): boolean {
  return GATEWAY_SHAPE_IS_ATTRACTOR[shape] ?? false;
}

// ─── GEOMETRIC SHAPE GENERATORS ───
// Convert normalized angle (0-1) to (x, y) coordinates for each shape

type ShapePointFn = (t: number, radius: number) => { x: number; y: number };

const geometricShapeGenerators: Record<string, ShapePointFn> = {
  // Classic circle
  circle: (t, radius) => ({
    x: Math.cos(t * Math.PI * 2) * radius,
    y: Math.sin(t * Math.PI * 2) * radius,
  }),
  
  // 6-sided hexagon
  hexagon: (t, radius) => {
    const sides = 6;
    const angle = t * Math.PI * 2;
    const segment = Math.floor(t * sides) % sides;
    const segmentT = (t * sides) % 1;
    
    const angle1 = (segment / sides) * Math.PI * 2 - Math.PI / 2;
    const angle2 = ((segment + 1) / sides) * Math.PI * 2 - Math.PI / 2;
    
    const x1 = Math.cos(angle1) * radius;
    const y1 = Math.sin(angle1) * radius;
    const x2 = Math.cos(angle2) * radius;
    const y2 = Math.sin(angle2) * radius;
    
    return {
      x: x1 + (x2 - x1) * segmentT,
      y: y1 + (y2 - y1) * segmentT,
    };
  },
  
  // 8-sided octagon
  octagon: (t, radius) => {
    const sides = 8;
    const segment = Math.floor(t * sides) % sides;
    const segmentT = (t * sides) % 1;
    
    const angle1 = (segment / sides) * Math.PI * 2 - Math.PI / 8;
    const angle2 = ((segment + 1) / sides) * Math.PI * 2 - Math.PI / 8;
    
    const x1 = Math.cos(angle1) * radius;
    const y1 = Math.sin(angle1) * radius;
    const x2 = Math.cos(angle2) * radius;
    const y2 = Math.sin(angle2) * radius;
    
    return {
      x: x1 + (x2 - x1) * segmentT,
      y: y1 + (y2 - y1) * segmentT,
    };
  },
  
  // Diamond (rotated square)
  diamond: (t, radius) => {
    const sides = 4;
    const segment = Math.floor(t * sides) % sides;
    const segmentT = (t * sides) % 1;
    
    // Points at top, right, bottom, left
    const points = [
      { x: 0, y: radius },
      { x: radius, y: 0 },
      { x: 0, y: -radius },
      { x: -radius, y: 0 },
    ];
    
    const p1 = points[segment];
    const p2 = points[(segment + 1) % 4];
    
    return {
      x: p1.x + (p2.x - p1.x) * segmentT,
      y: p1.y + (p2.y - p1.y) * segmentT,
    };
  },
  
  // Arch/doorway - semicircle on top, straight sides, flat bottom
  arch: (t, radius) => {
    // Split: 0-0.4 = top semicircle, 0.4-0.7 = right side, 0.7-0.8 = bottom, 0.8-1.0 = left side
    const archHeight = radius * 1.3;
    const archWidth = radius * 0.8;
    
    if (t < 0.5) {
      // Top semicircle (top half of the arch)
      const archT = t / 0.5;
      const angle = Math.PI - archT * Math.PI; // PI to 0
      return {
        x: Math.cos(angle) * archWidth,
        y: Math.sin(angle) * archWidth + (archHeight - archWidth),
      };
    } else if (t < 0.65) {
      // Right side going down
      const sideT = (t - 0.5) / 0.15;
      return {
        x: archWidth,
        y: (archHeight - archWidth) * (1 - sideT) - archHeight * 0.3,
      };
    } else if (t < 0.85) {
      // Bottom going left
      const bottomT = (t - 0.65) / 0.2;
      return {
        x: archWidth - bottomT * archWidth * 2,
        y: -archHeight * 0.3,
      };
    } else {
      // Left side going up
      const sideT = (t - 0.85) / 0.15;
      return {
        x: -archWidth,
        y: -archHeight * 0.3 + sideT * (archHeight - archWidth + archHeight * 0.3),
      };
    }
  },
  
  // Wide ellipse
  ellipse: (t, radius) => ({
    x: Math.cos(t * Math.PI * 2) * radius * 1.4,
    y: Math.sin(t * Math.PI * 2) * radius * 0.75,
  }),
};

// Get shape generator - falls back to circle for attractors (they use different rendering)
function getShapeGenerator(shape: GatewayShape): ShapePointFn {
  if (isAttractorShape(shape)) {
    return geometricShapeGenerators.circle; // Attractor shapes use their own 3D rendering
  }
  return geometricShapeGenerators[shape] || geometricShapeGenerators.circle;
}

// FIXED particle counts - NEVER change these dynamically
const TORUS_PARTICLES = 10000;
const EDGE_PARTICLES = 3000;
const TUNNEL_RING_COUNT = 40;
const TUNNEL_PARTICLES_PER_RING = 150;
const INNER_RING_PARTICLES = 4000;
const SPIRAL_ARMS = 8;
const SPIRAL_POINTS_PER_ARM = 300;
const CORE_PARTICLES = 500;
const INTERIOR_PARTICLES = 5000;
const DEPTH_MARKER_COUNT = 6;
const DEPTH_MARKER_RING_PARTICLES = 80;
const DEPTH_MARKER_SPIRAL_ARMS = 4;
const DEPTH_MARKER_SPIRAL_POINTS = 50;

// ─── SOLID SHAPE RING (no depth, no curve needed) ───
function SolidShapeRing({ 
  opacity, 
  color, 
  density,
  shape
}: { 
  opacity: number; 
  color: string; 
  density: number;
  shape: GatewayShape;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const getPoint = getShapeGenerator(shape);
  
  const positions = useMemo(() => {
    const points: number[] = [];
    const R = 1.0;
    const thickness = 0.12;
    
    for (let i = 0; i < TORUS_PARTICLES; i++) {
      const t = i / TORUS_PARTICLES;
      const { x, y } = getPoint(t, R);
      
      // Add thickness variation (like a torus cross-section)
      const thicknessAngle = Math.random() * Math.PI * 2;
      const thicknessR = thickness * (0.8 + Math.random() * 0.4);
      
      // Normal direction for thickness (perpendicular to the shape edge)
      const nextT = (t + 0.001) % 1;
      const next = getPoint(nextT, R);
      const dx = next.x - x;
      const dy = next.y - y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len; // Normal perpendicular to edge
      const ny = dx / len;
      
      points.push(
        x + nx * thicknessR * Math.cos(thicknessAngle),
        y + ny * thicknessR * Math.cos(thicknessAngle),
        thicknessR * Math.sin(thicknessAngle) * 0.3
      );
    }
    
    return new Float32Array(points);
  }, [getPoint]);
  
  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      pointsRef.current.scale.setScalar(1 + Math.sin(time * 0.3) * 0.008);
      
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.85 * opacity * density;
    }
  });
  
  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color={color} size={0.014} sizeAttenuation depthWrite={false} opacity={0.85} />
    </Points>
  );
}

// ─── EDGE GLOW RING (no depth, no curve needed) ───
function EdgeGlowRing({ 
  opacity, 
  color, 
  density,
  shape
}: { 
  opacity: number; 
  color: string; 
  density: number;
  shape: GatewayShape;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const getPoint = getShapeGenerator(shape);
  
  const positions = useMemo(() => {
    const points: number[] = [];
    const baseRadius = 1.12;
    const layers = 5;
    const pointsPerLayer = EDGE_PARTICLES / layers;
    
    for (let layer = 0; layer < layers; layer++) {
      const layerScale = 1 + layer * 0.02;
      const layerZ = layer * 0.015;
      
      for (let i = 0; i < pointsPerLayer; i++) {
        const t = i / pointsPerLayer;
        const { x, y } = getPoint(t, baseRadius * layerScale);
        const jitter = (Math.random() - 0.5) * 0.03;
        
        points.push(
          x + jitter,
          y + jitter,
          layerZ + (Math.random() - 0.5) * 0.02
        );
      }
    }
    
    return new Float32Array(points);
  }, [getPoint]);
  
  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      const pulse = 0.85 + Math.sin(time * 1.5) * 0.15;
      
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.95 * opacity * density * pulse;
    }
  });
  
  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color={color} size={0.018} sizeAttenuation depthWrite={false} opacity={0.95} />
    </Points>
  );
}

// ─── TUNNEL DEPTH RINGS (with curvature and width support) ───
function TunnelDepthRings({ 
  opacity, 
  color, 
  density,
  tunnelDepth,
  tunnelCurve,
  tunnelWidth,
  shape
}: { 
  opacity: number; 
  color: string; 
  density: number;
  tunnelDepth: number;
  tunnelCurve: number;
  tunnelWidth: number;
  shape: GatewayShape;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  // Store base X, Y positions and depth values for curve/width recalculation
  const baseDataRef = useRef<{ baseX: number[]; baseY: number[]; depths: number[] } | null>(null);
  const getPoint = getShapeGenerator(shape);
  
  const positions = useMemo(() => {
    const points: number[] = [];
    const baseX: number[] = [];
    const baseY: number[] = [];
    const depths: number[] = [];
    const startRadius = 0.95;
    
    for (let ring = 0; ring < TUNNEL_RING_COUNT; ring++) {
      const t = ring / (TUNNEL_RING_COUNT - 1);
      const radius = startRadius * (1 - t * 0.4);
      
      for (let i = 0; i < TUNNEL_PARTICLES_PER_RING; i++) {
        const pointT = i / TUNNEL_PARTICLES_PER_RING;
        const { x: shapeX, y: shapeY } = getPoint(pointT, 1);
        const jitter = (Math.random() - 0.5) * 0.03;
        const x = shapeX * radius + jitter;
        const y = shapeY * radius + jitter;
        
        baseX.push(x);
        baseY.push(y);
        depths.push(t);
        
        points.push(x, y, t);
      }
    }
    
    baseDataRef.current = { baseX, baseY, depths };
    return new Float32Array(points);
  }, [getPoint]);
  
  // Update positions when tunnelCurve or tunnelWidth changes
  useEffect(() => {
    if (!pointsRef.current || !baseDataRef.current) return;
    
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const { baseX, baseY, depths } = baseDataRef.current;
    
    for (let i = 0; i < baseX.length; i++) {
      const t = depths[i];
      // Width scales more at the back (depth-dependent), multiplied by 2 for stronger effect
      const widthScale = 1 + (tunnelWidth - 1) * t * 2;
      const curveOffset = tunnelCurve * t * t * 2;
      
      posArray[i * 3] = baseX[i] * widthScale + curveOffset;
      posArray[i * 3 + 1] = baseY[i] * widthScale;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  }, [tunnelCurve, tunnelWidth]);
  
  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.scale.z = 8 * tunnelDepth;
      
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.65 * opacity * density;
    }
  });
  
  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color={color} size={0.010} sizeAttenuation depthWrite={false} opacity={0.65} />
    </Points>
  );
}

// ─── INNER ACCENT RING (no depth, no curve needed) ───
function InnerAccentRing({ 
  opacity, 
  color, 
  density,
  shape
}: { 
  opacity: number; 
  color: string; 
  density: number;
  shape: GatewayShape;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const getPoint = getShapeGenerator(shape);
  
  const positions = useMemo(() => {
    const points: number[] = [];
    const radius = 0.88;
    const thickness = 0.06;
    const layers = 6;
    const pointsPerLayer = INNER_RING_PARTICLES / layers;
    
    for (let layer = 0; layer < layers; layer++) {
      const layerZ = layer * 0.04;
      
      for (let i = 0; i < pointsPerLayer; i++) {
        const t = i / pointsPerLayer;
        const r = radius + (Math.random() - 0.5) * thickness;
        const { x, y } = getPoint(t, r);
        
        points.push(x, y, layerZ + (Math.random() - 0.5) * 0.02);
      }
    }
    
    return new Float32Array(points);
  }, [getPoint]);
  
  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      const pulse = 0.7 + Math.sin(time * 1.2) * 0.3;
      
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.9 * opacity * density * pulse;
    }
  });
  
  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color={color} size={0.016} sizeAttenuation depthWrite={false} opacity={0.9} />
    </Points>
  );
}

// ─── DEPTH SPIRAL (with curvature and width support) ───
function DepthSpiral({
  opacity,
  color,
  density,
  tunnelDepth,
  tunnelCurve,
  tunnelWidth,
  shape
}: {
  opacity: number;
  color: string;
  density: number;
  tunnelDepth: number;
  tunnelCurve: number;
  tunnelWidth: number;
  shape: GatewayShape;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const baseDataRef = useRef<{ baseX: number[]; baseY: number[]; depths: number[] } | null>(null);
  const getPoint = getShapeGenerator(shape);

  const positions = useMemo(() => {
    const points: number[] = [];
    const baseX: number[] = [];
    const baseY: number[] = [];
    const depths: number[] = [];

    // Spiral arms that follow the shape
    for (let arm = 0; arm < SPIRAL_ARMS; arm++) {
      const baseT = arm / SPIRAL_ARMS;

      for (let i = 0; i < SPIRAL_POINTS_PER_ARM; i++) {
        const depthT = i / (SPIRAL_POINTS_PER_ARM - 1);
        const radius = 0.75 * (1 - depthT * 0.5);
        // Spiral around the shape as we go deeper
        const shapeT = (baseT + depthT * 0.25) % 1;
        const { x: shapeX, y: shapeY } = getPoint(shapeT, 1);
        const jitter = (Math.random() - 0.5) * 0.05;
        const x = shapeX * radius + jitter;
        const y = shapeY * radius + jitter;

        baseX.push(x);
        baseY.push(y);
        depths.push(depthT);

        points.push(x, y, depthT);
      }
    }

    // Central core (keeps circular motion for all shapes)
    for (let i = 0; i < CORE_PARTICLES; i++) {
      const t = i / (CORE_PARTICLES - 1);
      const radius = 0.3 * (1 - t * 0.7);
      const angle = t * Math.PI * 15;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      baseX.push(x);
      baseY.push(y);
      depths.push(t * 0.8);

      points.push(x, y, t * 0.8);
    }

    baseDataRef.current = { baseX, baseY, depths };
    return new Float32Array(points);
  }, []);
  
  useEffect(() => {
    if (!pointsRef.current || !baseDataRef.current) return;
    
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const { baseX, baseY, depths } = baseDataRef.current;
    
    for (let i = 0; i < baseX.length; i++) {
      const t = depths[i];
      const widthScale = 1 + (tunnelWidth - 1) * t * 2;
      const curveOffset = tunnelCurve * t * t * 2;
      
      posArray[i * 3] = baseX[i] * widthScale + curveOffset;
      posArray[i * 3 + 1] = baseY[i] * widthScale;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  }, [tunnelCurve, tunnelWidth]);
  
  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      pointsRef.current.rotation.z = time * 0.03;
      pointsRef.current.scale.z = 6 * tunnelDepth;
      
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.55 * opacity * density;
    }
  });
  
  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color={color} size={0.008} sizeAttenuation depthWrite={false} opacity={0.55} />
    </Points>
  );
}

// ─── INTERIOR FILL (with curvature and width support) ───
function InteriorFill({
  opacity,
  color,
  density,
  tunnelDepth,
  tunnelCurve,
  tunnelWidth,
  shape
}: {
  opacity: number;
  color: string;
  density: number;
  tunnelDepth: number;
  tunnelCurve: number;
  tunnelWidth: number;
  shape: GatewayShape;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const baseDataRef = useRef<{ baseX: number[]; baseY: number[]; depths: number[] } | null>(null);
  const getPoint = getShapeGenerator(shape);

  const positions = useMemo(() => {
    const points: number[] = [];
    const baseX: number[] = [];
    const baseY: number[] = [];
    const depths: number[] = [];

    for (let i = 0; i < INTERIOR_PARTICLES; i++) {
      const depthT = Math.random();
      const maxRadius = 0.85 * (1 - depthT * 0.35);
      // Random position along the shape contour, scaled by random radius
      const shapeT = Math.random();
      const radiusScale = Math.random() * maxRadius;
      const { x: shapeX, y: shapeY } = getPoint(shapeT, radiusScale);
      
      baseX.push(shapeX);
      baseY.push(shapeY);
      depths.push(depthT);

      points.push(shapeX, shapeY, depthT);
    }

    baseDataRef.current = { baseX, baseY, depths };
    return new Float32Array(points);
  }, [getPoint]);
  
  useEffect(() => {
    if (!pointsRef.current || !baseDataRef.current) return;
    
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const { baseX, baseY, depths } = baseDataRef.current;
    
    for (let i = 0; i < baseX.length; i++) {
      const t = depths[i];
      const widthScale = 1 + (tunnelWidth - 1) * t * 2;
      const curveOffset = tunnelCurve * t * t * 2;
      
      posArray[i * 3] = baseX[i] * widthScale + curveOffset;
      posArray[i * 3 + 1] = baseY[i] * widthScale;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  }, [tunnelCurve, tunnelWidth]);
  
  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      pointsRef.current.rotation.z = Math.sin(time * 0.1) * 0.02;
      pointsRef.current.scale.z = 7 * tunnelDepth;
      
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.40 * opacity * density;
    }
  });
  
  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color={color} size={0.007} sizeAttenuation depthWrite={false} opacity={0.40} />
    </Points>
  );
}

// ─── GOLD DEPTH MARKERS (with curvature and width support) ───
function GoldDepthMarkers({
  opacity,
  color,
  density,
  tunnelDepth,
  tunnelCurve,
  tunnelWidth,
  shape
}: {
  opacity: number;
  color: string;
  density: number;
  tunnelDepth: number;
  tunnelCurve: number;
  tunnelWidth: number;
  shape: GatewayShape;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const baseDataRef = useRef<{ baseX: number[]; baseY: number[]; depths: number[] } | null>(null);
  const getPoint = getShapeGenerator(shape);

  const positions = useMemo(() => {
    const points: number[] = [];
    const baseX: number[] = [];
    const baseY: number[] = [];
    const depths: number[] = [];

    // Depth marker rings following the shape
    for (let marker = 0; marker < DEPTH_MARKER_COUNT; marker++) {
      const depthT = marker / (DEPTH_MARKER_COUNT - 1);
      const radius = 0.82 * (1 - depthT * 0.3);

      for (let i = 0; i < DEPTH_MARKER_RING_PARTICLES; i++) {
        const shapeT = (i / DEPTH_MARKER_RING_PARTICLES + marker * 0.05) % 1;
        const { x: shapeX, y: shapeY } = getPoint(shapeT, radius);

        baseX.push(shapeX);
        baseY.push(shapeY);
        depths.push(depthT);

        points.push(shapeX, shapeY, depthT);
      }
    }

    // Spiral accent following the shape
    for (let arm = 0; arm < DEPTH_MARKER_SPIRAL_ARMS; arm++) {
      const baseT = arm / DEPTH_MARKER_SPIRAL_ARMS;

      for (let i = 0; i < DEPTH_MARKER_SPIRAL_POINTS; i++) {
        const depthT = i / (DEPTH_MARKER_SPIRAL_POINTS - 1);
        const radius = 0.78 * (1 - depthT * 0.25);
        const shapeT = (baseT + depthT * 0.1) % 1;
        const { x: shapeX, y: shapeY } = getPoint(shapeT, radius);

        baseX.push(shapeX);
        baseY.push(shapeY);
        depths.push(depthT * 0.8);

        points.push(shapeX, shapeY, depthT * 0.8);
      }
    }

    baseDataRef.current = { baseX, baseY, depths };
    return new Float32Array(points);
  }, [getPoint]);
  
  useEffect(() => {
    if (!pointsRef.current || !baseDataRef.current) return;
    
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const { baseX, baseY, depths } = baseDataRef.current;
    
    for (let i = 0; i < baseX.length; i++) {
      const t = depths[i];
      const widthScale = 1 + (tunnelWidth - 1) * t * 2;
      const curveOffset = tunnelCurve * t * t * 2;
      
      posArray[i * 3] = baseX[i] * widthScale + curveOffset;
      posArray[i * 3 + 1] = baseY[i] * widthScale;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  }, [tunnelCurve, tunnelWidth]);
  
  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      const pulse = 0.75 + Math.sin(time * 1.8) * 0.25;
      pointsRef.current.scale.z = 5 * tunnelDepth;
      
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.80 * opacity * density * pulse;
    }
  });
  
  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color={color} size={0.018} sizeAttenuation depthWrite={false} opacity={0.80} />
    </Points>
  );
}

// ─── FLYING CAMERA ───
function FlyingCamera({ scrollProgress, gatewayX }: { scrollProgress: number; gatewayX: number }) {
  const { camera } = useThree();
  
  useFrame(() => {
    const z = scrollProgress * 18 * 5;
    const x = scrollProgress < 0.08 ? gatewayX * (scrollProgress / 0.08) : gatewayX;
    
    camera.position.set(x, 0.15, z);
    camera.lookAt(gatewayX, 0.15, z + 10);
  });
  
  return null;
}

// ─── GATEWAY SCENE ───
// ─── STRANGE ATTRACTOR PORTAL ───
// Renders the 3D attractor point cloud as the gateway
const ATTRACTOR_PARTICLE_COUNT = 4000;

function AttractorPortal({
  opacity,
  primaryColor,
  accentColor,
  density,
  shape,
}: {
  opacity: number;
  primaryColor: string;
  accentColor: string;
  density: number;
  shape: GatewayShape;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const accentPointsRef = useRef<THREE.Points>(null);
  
  const { positions, accentPositions } = useMemo(() => {
    const attractorPoints = getCachedAttractorPoints(shape, ATTRACTOR_PARTICLE_COUNT);
    
    // Main particles
    const mainPoints: number[] = [];
    const accentPoints: number[] = [];
    
    attractorPoints.forEach((p, i) => {
      // Add some jitter for organic feel
      const jitter = 0.02;
      const x = p.x + (Math.random() - 0.5) * jitter;
      const y = p.y + (Math.random() - 0.5) * jitter;
      const z = p.z + (Math.random() - 0.5) * jitter;
      
      mainPoints.push(x, y, z);
      
      // Every 5th particle gets an accent version slightly offset
      if (i % 5 === 0) {
        accentPoints.push(
          x + (Math.random() - 0.5) * 0.03,
          y + (Math.random() - 0.5) * 0.03,
          z + (Math.random() - 0.5) * 0.03
        );
      }
    });
    
    return {
      positions: new Float32Array(mainPoints),
      accentPositions: new Float32Array(accentPoints),
    };
  }, [shape]);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (pointsRef.current) {
      // Slow rotation
      pointsRef.current.rotation.y = time * 0.1;
      pointsRef.current.rotation.x = Math.sin(time * 0.05) * 0.1;
      
      // Breathing scale
      const breathe = 1 + Math.sin(time * 0.5) * 0.02;
      pointsRef.current.scale.setScalar(breathe);
      
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.7 * opacity * density;
    }
    
    if (accentPointsRef.current) {
      accentPointsRef.current.rotation.y = time * 0.1;
      accentPointsRef.current.rotation.x = Math.sin(time * 0.05) * 0.1;
      
      const breathe = 1 + Math.sin(time * 0.5) * 0.02;
      accentPointsRef.current.scale.setScalar(breathe);
      
      const material = accentPointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.9 * opacity * density * (0.7 + Math.sin(time * 1.2) * 0.3);
    }
  });
  
  return (
    <group>
      {/* Main attractor particles */}
      <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial 
          transparent 
          color={primaryColor} 
          size={0.015} 
          sizeAttenuation 
          depthWrite={false} 
          opacity={0.7} 
        />
      </Points>
      
      {/* Accent particles (gold highlights) */}
      <Points ref={accentPointsRef} positions={accentPositions} stride={3} frustumCulled={false}>
        <PointMaterial 
          transparent 
          color={accentColor} 
          size={0.02} 
          sizeAttenuation 
          depthWrite={false} 
          opacity={0.9} 
        />
      </Points>
    </group>
  );
}

interface GatewaySceneProps {
  scrollProgress: number;
  config: GatewayConfig;
}

function GatewayScene({ scrollProgress, config }: GatewaySceneProps) {
  const opacity = scrollProgress > 0.06
    ? Math.max(0, 1 - (scrollProgress - 0.06) * 10)
    : 1;

  if (opacity <= 0) return null;

  const primaryColor = config.primaryColor || DEFAULT_PRIMARY;
  const accentColor = config.accentColor || DEFAULT_ACCENT;
  const density = config.density || 1.0;
  const tunnelDepth = config.tunnelDepth || 1.0;
  const tunnelCurve = config.tunnelCurve || 0;
  const tunnelWidth = config.tunnelWidth || 1.0;
  const shape = config.shape || "circle";
  
  // Check if this is an attractor shape (3D point cloud) vs geometric (2D outline)
  const isAttractor = isAttractorShape(shape);

  return (
    <>
      <FlyingCamera scrollProgress={scrollProgress} gatewayX={config.positionX} />

      <group
        position={[config.positionX, config.positionY + 0.05, 4]}
        rotation={[0.1, config.rotationY, 0]}
        scale={config.scale}
      >
        {isAttractor ? (
          // Render 3D strange attractor
          <AttractorPortal
            opacity={opacity}
            primaryColor={primaryColor}
            accentColor={accentColor}
            density={density}
            shape={shape}
          />
        ) : (
          // Render geometric 2D outline with tunnel
          <>
            <SolidShapeRing opacity={opacity} color={primaryColor} density={density} shape={shape} />
            <EdgeGlowRing opacity={opacity} color={primaryColor} density={density} shape={shape} />
            <TunnelDepthRings
              opacity={opacity}
              color={primaryColor}
              density={density}
              tunnelDepth={tunnelDepth}
              tunnelCurve={tunnelCurve}
              tunnelWidth={tunnelWidth}
              shape={shape}
            />
            <InnerAccentRing opacity={opacity} color={accentColor} density={density} shape={shape} />
            <DepthSpiral
              opacity={opacity}
              color={primaryColor}
              density={density}
              tunnelDepth={tunnelDepth}
              tunnelCurve={tunnelCurve}
              tunnelWidth={tunnelWidth}
              shape={shape}
            />
            <InteriorFill
              opacity={opacity}
              color={primaryColor}
              density={density}
              tunnelDepth={tunnelDepth}
              tunnelCurve={tunnelCurve}
              tunnelWidth={tunnelWidth}
              shape={shape}
            />
            <GoldDepthMarkers
              opacity={opacity}
              color={accentColor}
              density={density}
              tunnelDepth={tunnelDepth}
              tunnelCurve={tunnelCurve}
              tunnelWidth={tunnelWidth}
              shape={shape}
            />
          </>
        )}
      </group>
    </>
  );
}

// ─── MAIN COMPONENT ───
interface ThreeGatewayProps {
  scrollProgress: number;
  config?: GatewayConfig;
  children?: React.ReactNode;
}

export function ThreeGateway({ scrollProgress, config, children }: ThreeGatewayProps) {
  const gatewayConfig = { ...DEFAULT_GATEWAY, ...config };

  if (!gatewayConfig.enabled || scrollProgress > 0.20) return null;

  // Calculate screen position offset based on 3D gateway position
  // Camera FOV = 60, gateway is at z = 4
  // Visible height at z=4: 2 * 4 * tan(30°) ≈ 4.62 units
  // For 16:9 aspect, visible width ≈ 8.2 units
  const fovRadians = (60 * Math.PI) / 180;
  const visibleHeight = 2 * 4 * Math.tan(fovRadians / 2);
  
  // Convert 3D position to screen percentage (relative to center)
  // positionX in Three.js: negative = left, positive = right
  // But due to camera looking down -Z, we need to flip X
  const offsetXPercent = (-gatewayConfig.positionX / visibleHeight) * 100;
  const offsetYPercent = (-gatewayConfig.positionY / visibleHeight) * 100;

  return (
    <div 
      style={{ 
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 0], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <GatewayScene scrollProgress={scrollProgress} config={gatewayConfig} />
      </Canvas>
      {children && (
        <div style={{ 
          position: "absolute", 
          pointerEvents: "none",
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // Offset to match 3D gateway position
            transform: `translate(${offsetXPercent}vh, ${offsetYPercent}vh)`,
          }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
