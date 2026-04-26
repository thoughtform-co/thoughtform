"use client";

/**
 * v1 hero portal particle stack for the latent showcase only.
 * Ported from `components/gateway/ThreeGateway.tsx` (constants + SolidShapeRing … GoldDepthMarkers).
 */
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import type { GatewayShape } from "@/lib/particle-config";
import { getShapeGenerator } from "./latentShapePointFn";

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

function SolidShapeRing({
  opacity,
  color,
  density,
  shape,
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

      const thicknessAngle = Math.random() * Math.PI * 2;
      const thicknessR = thickness * (0.8 + Math.random() * 0.4);

      const nextT = (t + 0.001) % 1;
      const next = getPoint(nextT, R);
      const dx = next.x - x;
      const dy = next.y - y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len;
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
      <PointMaterial
        transparent
        color={color}
        size={0.014}
        sizeAttenuation
        depthWrite={false}
        opacity={0.85}
      />
    </Points>
  );
}

function EdgeGlowRing({
  opacity,
  color,
  density,
  shape,
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

        points.push(x + jitter, y + jitter, layerZ + (Math.random() - 0.5) * 0.02);
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
      <PointMaterial
        transparent
        color={color}
        size={0.018}
        sizeAttenuation
        depthWrite={false}
        opacity={0.95}
      />
    </Points>
  );
}

function TunnelDepthRings({
  opacity,
  color,
  density,
  tunnelDepth,
  tunnelCurve,
  tunnelWidth,
  shape,
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

  useEffect(() => {
    if (!pointsRef.current || !baseDataRef.current) return;

    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const { baseX, baseY, depths } = baseDataRef.current;

    for (let i = 0; i < baseX.length; i++) {
      const t = depths[i]!;
      const widthScale = 1 + (tunnelWidth - 1) * t * 2;
      const curveOffset = tunnelCurve * t * t * 2;

      posArray[i * 3] = baseX[i]! * widthScale + curveOffset;
      posArray[i * 3 + 1] = baseY[i]! * widthScale;
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
      <PointMaterial
        transparent
        color={color}
        size={0.01}
        sizeAttenuation
        depthWrite={false}
        opacity={0.65}
      />
    </Points>
  );
}

function InnerAccentRing({
  opacity,
  color,
  density,
  shape,
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
      <PointMaterial
        transparent
        color={color}
        size={0.016}
        sizeAttenuation
        depthWrite={false}
        opacity={0.9}
      />
    </Points>
  );
}

function DepthSpiral({
  opacity,
  color,
  density,
  tunnelDepth,
  tunnelCurve,
  tunnelWidth,
  shape,
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

    for (let arm = 0; arm < SPIRAL_ARMS; arm++) {
      const baseT = arm / SPIRAL_ARMS;

      for (let i = 0; i < SPIRAL_POINTS_PER_ARM; i++) {
        const depthT = i / (SPIRAL_POINTS_PER_ARM - 1);
        const radius = 0.75 * (1 - depthT * 0.5);
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
  }, [getPoint]);

  useEffect(() => {
    if (!pointsRef.current || !baseDataRef.current) return;

    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const { baseX, baseY, depths } = baseDataRef.current;

    for (let i = 0; i < baseX.length; i++) {
      const t = depths[i]!;
      const widthScale = 1 + (tunnelWidth - 1) * t * 2;
      const curveOffset = tunnelCurve * t * t * 2;

      posArray[i * 3] = baseX[i]! * widthScale + curveOffset;
      posArray[i * 3 + 1] = baseY[i]! * widthScale;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  }, [tunnelCurve, tunnelWidth]);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.scale.z = 6 * tunnelDepth;

      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.55 * opacity * density;
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
        opacity={0.55}
      />
    </Points>
  );
}

function InteriorFill({
  opacity,
  color,
  density,
  tunnelDepth,
  tunnelCurve,
  tunnelWidth,
  shape,
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
      const t = depths[i]!;
      const widthScale = 1 + (tunnelWidth - 1) * t * 2;
      const curveOffset = tunnelCurve * t * t * 2;

      posArray[i * 3] = baseX[i]! * widthScale + curveOffset;
      posArray[i * 3 + 1] = baseY[i]! * widthScale;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  }, [tunnelCurve, tunnelWidth]);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.scale.z = 7 * tunnelDepth;

      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.4 * opacity * density;
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
        opacity={0.4}
      />
    </Points>
  );
}

function GoldDepthMarkers({
  opacity,
  color,
  density,
  tunnelDepth,
  tunnelCurve,
  tunnelWidth,
  shape,
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
      const t = depths[i]!;
      const widthScale = 1 + (tunnelWidth - 1) * t * 2;
      const curveOffset = tunnelCurve * t * t * 2;

      posArray[i * 3] = baseX[i]! * widthScale + curveOffset;
      posArray[i * 3 + 1] = baseY[i]! * widthScale;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  }, [tunnelCurve, tunnelWidth]);

  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      const pulse = 0.75 + Math.sin(time * 1.8) * 0.25;
      pointsRef.current.scale.z = 5 * tunnelDepth;

      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.8 * opacity * density * pulse;
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
        opacity={0.8}
      />
    </Points>
  );
}

export interface LatentPortalContourProps {
  shape: GatewayShape;
  /** Scroll-driven scene fade (0–1) */
  opacity: number;
  density: number;
  tunnelDepth: number;
  tunnelCurve: number;
  tunnelWidth: number;
  primaryColor: string;
  accentColor: string;
}

export function LatentPortalContour({
  shape,
  opacity,
  density,
  tunnelDepth,
  tunnelCurve,
  tunnelWidth,
  primaryColor,
  accentColor,
}: LatentPortalContourProps) {
  return (
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
  );
}
