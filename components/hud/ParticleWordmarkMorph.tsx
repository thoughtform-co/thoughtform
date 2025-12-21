"use client";

import { useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════
// THOUGHTFORM PARTICLE SYSTEM CONSTANTS
// Matches ThoughtformSigil aesthetic for brand consistency
// ═══════════════════════════════════════════════════════════════════

const GRID = 3; // Sacred Thoughtform grid unit - NEVER change this

// Noise function for organic movement (same as ThoughtformSigil)
function noise2D(x: number, y: number, time: number): number {
  const sin1 = Math.sin(x * 0.05 + time * 0.001);
  const sin2 = Math.sin(y * 0.05 + time * 0.0015);
  const sin3 = Math.sin((x + y) * 0.03 + time * 0.0008);
  return (sin1 + sin2 + sin3) / 3;
}

// Hero wordmark paths (stacked layout) - all dawn paths from Wordmark.tsx (excluding Vector I)
// ViewBox: 0 0 1178.18 494.93
const HERO_WORDMARK_PATHS = [
  "M517.7,108.78c0,59.15-39.04,108.78-107.06,108.78s-107.06-49.63-107.06-108.78S342.62,0,410.64,0s107.06,49.63,107.06,108.78ZM491.63,108.78c0-56.24-28.32-103.49-80.86-103.49s-80.86,47.38-80.86,103.49,28.32,103.49,80.86,103.49,80.86-47.38,80.86-103.49Z",
  "M598.29,273.54v9.93h-106.93v210.02h-25.94v-219.94h133-.13Z",
  "M557,373.58h-70.27v9.93h70.27v-9.93Z",
  "M734.59,483.95h-89.72v9.79h89.72v-9.79Z",
  "M618.54,316.94h-25.94v133.39h25.94v-133.39h0Z",
  "M786.47,316.94h-25.94v133.39h25.94v-133.39h0Z",
  "M734.59,283.46v-9.53h-89.99v9.53h-25.94v33.48h25.94v-33.22h89.99v33.22h25.94v-33.48h-25.94Z",
  "M644.87,450.47h-25.94v33.48h25.94v-33.48Z",
  "M760.53,450.47h-25.94v33.48h25.94v-33.48Z",
  "M912.58,283.46v100.31h-85.09v-100.31h85.09v-10.45h-111.16v220.74h26.07v-99.25h40.89v33.48h25.28v44.07h25.94v-44.07h-25.94v-33.48h18.92v-10.85h21.84v-100.31h-21.84v.13Z",
  "M930.98,472.17h-11.38v21.7h11.38v-21.7Z",
  "M1117.7,273.01v44.73h-25.67v43.27h-10.45v44.73h10.45v-44.73h25.67v132.6h25.81v-220.74h-25.81v.13Z",
  "M1009.06,361.14v-43.27h-25.67v-44.73h-25.81v220.74h25.81v-132.6h25.67v44.73h10.45v-44.73h-10.45v-.13Z",
  "M1035.26,405.87h-15.75v44.33h15.75v-44.33h0Z",
  "M1081.84,405.87h-15.75v44.33h15.75v-44.33h0Z",
  "M1066.09,450.2h-30.83v43.67h30.83v-43.67h0Z",
  "M877.38,1.85v4.9c7.68-.13,15.62-.66,16.54,8.73l-.26,188.45c-1.72,8.2-9.66,6.48-16.28,6.48v4.9h59.68v-4.9c-14.03.93-16.54-.79-17.47-14.56v-87.47h68.95v95.68c0,6.48-12.04,6.88-16.54,6.22v4.9h59.82v-4.9c-7.28,0-15.48,1.72-16.54-7.81l.66-190.56c2.12-6.22,10.72-5.16,15.88-5.29V1.59h-59.68v4.9c3.97,0,9.4-.53,13.1,1.46,1.06.66,3.57,3.97,3.57,4.76v85.75h-67.62l-1.32-1.32V19.19c0-.26.79-5.69.93-6.35,1.72-7.54,10.32-6.35,16.41-6.35V1.46h-59.82.13l-.13.4Z",
  "M301.33,1.72h-59.82v4.9h.93c1.99,0,4.76,0,7.41.26h.66c2.91.4,5.56,1.32,6.75,3.44.4.53,1.72,4.63,1.72,4.9v83.24h-69.87V15.22c0-.26,1.46-4.5,1.72-4.9,1.19-2.12,3.84-3.04,6.75-3.44h.66c2.65-.4,5.43-.26,7.41-.26h.93V1.72h-59.82v4.9h0c3.57.13,6.75,0,9.26.53h.53c4.1.79,6.88,3.18,7.68,9.93v181.43c-.93,12.57-5.96,12.44-17.47,11.91v4.9h59.82v-4.9h-7.68c-.66,0-1.46,0-2.12-.26-2.51-.4-4.63-1.32-5.96-3.71-.26-.66-1.72-4.63-1.72-4.9v-92.37h69.87v92.37c0,.26-1.46,4.23-1.72,4.9-1.32,2.38-3.57,3.31-5.96,3.71h-9.79v4.9h59.82v-4.9c-11.65.53-16.54.66-17.47-11.91V16.81c.79-6.75,3.44-9.13,7.68-9.93h.53c2.65-.4,5.82-.26,9.26-.26h0V1.59h0v.13Z",
  "M744.52,107.32l1.85,1.32,79.93.66c4.5,1.72,4.9,9.53,5.29,13.9,1.59,22.76-1.32,47.51,0,70.53l-.53,2.12c-32.29,25.94-80.86,21.31-107.99-9.93-45.13-52.27-30.83-175.87,51.48-180.64,14.16-.79,48.7,5.43,53.07,21.7,4.1,15.88-8.87,23.03-18.13,32.95v1.59l2.51,2.38,38.51-38.51c-43.01-37.72-119.37-32.95-155.23,12.44-34.27,43.54-31.89,123.47,14.16,158.14,38.64,29.11,111.96,29.91,147.29-5.43l.66-75.43c1.46-8.07,10.19-6.22,16.41-6.35v-9.93h-129.56v8.6h.4l-.13-.13Z",
  "M1178.18,28.19h-4.5s-5.56-11.65-10.32-14.82c-6.88-4.76-16.54-6.75-25.01-6.62h-2.25c-2.25.13-3.97.53-5.43,1.06-.26,0-.53.13-.66.26-.13,0-.26.13-.53.26-1.99,1.06-3.04,2.65-3.57,4.76h0c0,.26-.13.4-.26.66v186.99c-.13,3.97,3.04,9.53,7.15,9.53h12.7v4.9h-66.17v-4.9h12.7c4.1,0,7.28-5.56,7.15-9.53V13.76c0-.26-.13-.4-.26-.66h0c-.53-2.12-1.59-3.71-3.57-4.76-.13,0-.26-.13-.53-.26-.26,0-.4-.13-.66-.26-1.32-.53-3.18-.93-5.29-1.06h-2.25c-8.47-.26-18.13,1.85-25.01,6.62-4.63,3.18-10.32,14.82-10.32,14.82h-4.5l4.5-20.78,1.19-5.43h119.76l1.19,5.43,4.5,20.78h.26Z",
  "M134.19,28.19h-4.5s-5.56-11.65-10.32-14.82c-6.88-4.76-16.54-6.75-25.01-6.62h-2.25c-2.25.13-3.97.53-5.43,1.06-.26,0-.53.13-.66.26-.13,0-.26.13-.53.26-1.99,1.06-3.04,2.65-3.57,4.76h0c0,.26-.13.4-.26.66v186.99c-.13,3.97,3.04,9.53,7.15,9.53h12.7v4.9H35.2v-4.9h12.7c4.1,0,7.28-5.56,7.15-9.53V13.76c0-.26-.13-.4-.26-.66h0c-.53-2.12-1.46-3.71-3.57-4.76-.13,0-.26-.13-.53-.26-.26,0-.4-.13-.66-.26-1.32-.53-3.18-.93-5.43-1.06h-2.25c-8.47-.26-18,1.85-25.01,6.62-4.63,3.18-10.32,14.82-10.32,14.82H2.65L7.15,7.41l1.19-5.43h119.76l1.19,5.43,4.5,20.78h.4Z",
  "M631.5,1.85v4.9c8.47,0,15.48-.66,16.54,9.53-2.38,49.36,3.18,101.63,0,150.86-1.85,29.11-18.26,47.38-48.7,45.13-24.09-1.72-33.61-20.11-36-41.82V15.62c.26-9.4,9.26-8.87,16.54-8.73V1.98h-59.68v4.9c11.65-.66,15.22.79,16.81,8.73v137.76c-.26,34.27,13.1,60.87,53.46,63.92,35.86,2.65,60.08-10.72,62.73-48.43,3.31-49.1-2.51-101.9,0-151.39,1.32-10.98,6.88-10.45,16.54-10.45V2.12h-38.24v-.26Z",
];

// Inline sans wordmark paths (from WordmarkSans.tsx)
// ViewBox: 0 0 1227 143
const INLINE_WORDMARK_PATHS = [
  // T
  "M85.18,19.52h-2.89s-3.64-7.55-6.7-9.6c-4.51-3.07-10.72-4.42-16.25-4.28-.5,0-.99.05-1.46.08-1.46.13-2.61.34-3.49.69-.16.05-.31.11-.44.17-.11.05-.2.11-.31.17-1.32.67-1.95,1.71-2.31,3.1,0,.02-.02.05-.02.08-.06.14-.11.28-.16.44v121.13c-.11,2.59,1.96,6.19,4.65,6.19h8.27v3.2H21.08v-3.2h8.27c2.68,0,4.76-3.6,4.65-6.19V10.36c-.05-.14-.09-.28-.16-.44,0-.03,0-.05-.02-.08-.36-1.39-.99-2.43-2.31-3.1-.11-.06-.2-.11-.31-.17-.14-.06-.28-.13-.44-.17-.88-.34-2.03-.56-3.49-.69-.47-.03-.96-.06-1.46-.08-5.53-.14-11.73,1.21-16.25,4.28-3.05,2.05-6.7,9.6-6.7,9.6H0L2.95,6.08l.77-3.56h77.74l.77,3.56,2.95,13.44Z",
  // H
  "M193.63,2.37h-38.87v3.2c.2,0,.41,0,.63-.02,1.27.02,3.08-.03,4.8.19.14.02.28.03.42.06,1.88.28,3.61.89,4.38,2.24.22.31,1.15,2.99,1.15,3.2v53.96h-45.39V11.23c0-.2.93-2.88,1.13-3.2.78-1.35,2.51-1.96,4.39-2.24.14-.03.28-.05.42-.06,1.73-.22,3.53-.17,4.8-.17h.61v-3.2h-38.87v3.2h.03l-.03.09c2.31,0,4.35-.08,6.06.2.11.02.22.05.33.06,2.7.53,4.49,2.07,4.99,6.44v117.52c-.63,8.15-3.83,8.04-11.38,7.74v3.2h38.87v-3.2c-.38-.03-.77-.03-1.19-.02-.63,0-1.27.03-1.95.05-.61.02-1.22.02-1.84,0-.47-.02-.93-.06-1.37-.14-1.59-.24-3-.86-3.89-2.37-.2-.42-1.13-2.99-1.13-3.2v-59.85h45.39v59.85c0,.2-.93,2.77-1.15,3.2-.9,1.5-2.31,2.13-3.88,2.37-.12.03-.27.05-.41.06-.31.03-.63.06-.96.08-.63.03-1.26.02-1.88,0-.5-.02-1.01-.03-1.48-.05h-.31c-.47,0-.91,0-1.32.02v3.2h38.87v-3.2c-7.54.3-10.74.41-11.37-7.74V12.36c.5-4.37,2.28-5.91,4.99-6.44.11-.02.22-.05.31-.06,1.71-.28,3.75-.2,6.06-.2l-.03-.09h.03v-3.2Z",
  // O
  "M334.17,71.71c0,38.29-25.34,70.46-69.48,70.46s-69.48-32.17-69.48-70.46S220.57,1.24,264.69,1.24s69.48,32.17,69.48,70.46v.02ZM317.24,71.71c0-36.43-18.4-67.09-52.53-67.09s-52.53,30.66-52.53,67.09,18.4,67.09,52.53,67.09,52.53-30.66,52.53-67.09Z",
  // U
  "M408.02,2.46v3.2c5.48,0,10.03-.41,10.75,6.19-1.55,31.98,2.07,65.82,0,97.7-1.24,18.88-11.88,30.65-31.63,29.2-15.6-1.13-21.8-13-23.36-27.14V11.33c.2-6.09,6-5.78,10.75-5.67v-3.2h-38.76v3.2c7.55-.42,9.92.52,10.88,5.64v89.26c-.17,22.22,8.48,39.47,34.69,41.39,23.26,1.76,38.98-6.91,40.74-31.37,2.17-31.77-1.65-66.02,0-98.11.83-7.11,4.44-6.82,10.75-6.82v-3.2h-24.82Z",
  // G
  "M481.43,70.76l1.24.83,51.9.41c2.89,1.13,3.2,6.19,3.41,8.98,1.04,14.76-.83,30.74,0,45.7l-.31,1.35c-20.99,16.81-52.51,13.82-70.09-6.39-29.26-33.84-20.06-113.9,33.39-117.01,9.2-.52,31.63,3.51,34.43,14.04,2.68,10.33-5.79,14.96-11.79,21.36v1.03l1.65,1.55,25.02-24.97c-27.91-24.46-77.54-21.36-100.79,8.05-22.23,28.17-20.67,79.95,9.2,102.45,25.12,18.88,72.67,19.4,95.62-3.51l.41-48.9c.93-5.26,6.61-4.03,10.64-4.12v-6.39h-84.14v5.58h.2l.02-.03Z",
  // H
  "M567.65,2.46v3.2c4.96-.11,10.12-.41,10.75,5.67l-.2,122.05c-1.13,5.36-6.31,4.23-10.55,4.23v3.2h38.76v-3.2c-9.09.63-10.75-.52-11.36-9.38v-56.64h44.76v62.01c0,4.23-7.85,4.43-10.75,4.03v3.2h38.87v-3.2c-4.76,0-10.03,1.13-10.75-5.06l.41-123.49c1.35-4.03,6.92-3.31,10.35-3.4v-3.21h-38.76v3.2c2.59,0,6.11-.31,8.48.92.72.41,2.28,2.59,2.28,3.1v55.51h-43.94l-.83-.83V13.91c0-.2.52-3.71.63-4.12,1.13-4.86,6.72-4.12,10.64-4.12v-3.21h-38.87.11Z",
  // T
  "M762.97,19.52h-2.89s-3.64-7.55-6.7-9.6c-4.51-3.07-10.72-4.42-16.25-4.28-.5,0-.99.05-1.46.08-1.46.13-2.61.34-3.48.69-.16.05-.31.11-.44.17-.11.05-.2.11-.31.17-1.32.67-1.95,1.71-2.31,3.1,0,.02-.02.05-.02.08-.06.14-.11.28-.16.44v121.13c-.11,2.59,1.96,6.19,4.65,6.19h8.27v3.2h-43v-3.2h8.27c2.68,0,4.76-3.6,4.65-6.19V10.36c-.05-.14-.09-.28-.16-.44,0-.03,0-.05-.02-.08-.36-1.39-.99-2.43-2.31-3.1-.11-.06-.2-.11-.31-.17-.14-.06-.28-.13-.44-.17-.88-.34-2.02-.56-3.48-.69-.47-.03-.96-.06-1.46-.08-5.53-.14-11.73,1.21-16.25,4.28-3.05,2.05-6.7,9.6-6.7,9.6h-2.89l2.95-13.44.77-3.56h77.74l.77,3.56,2.95,13.44.02.02Z",
  // F
  "M872.98.31v6.44h-69.45v136.08h-16.88V.31h86.33Z",
  "M846.23,65.16h-45.65v6.44h45.65v-6.44Z",
  // O
  "M961.49,136.65h-58.21v6.35h58.21v-6.35Z",
  "M886.2,28.47h-16.88v86.45h16.88V28.47Z",
  "M995.23,28.47h-16.88v86.45h16.88V28.47Z",
  "M961.49,6.75V.58h-58.41v6.17h-16.86v21.72h16.86V6.91h58.41v21.56h16.86V6.75h-16.86Z",
  "M903.28,114.94h-16.88v21.72h16.88v-21.72Z",
  "M978.37,114.94h-16.88v21.72h16.88v-21.72Z",
  // R
  "M1077.06,6.75v64.96h-55.24V6.75h55.24V0h-72.16v143h16.92v-64.27h26.53v21.65h16.42v28.58h16.83v-28.58h-16.83v-21.65h12.29v-7.02h14.16V6.75h-14.16Z",
  "M1089.04,128.96h-7.39v14.02h7.39v-14.02Z",
  // M
  "M1210.28,0v29h-16.66v28.05h-6.75v29h6.77v-28.95h16.64v85.91h16.72V0h-16.72Z",
  "M1139.75,57.05v-28.05h-16.66V0h-16.72v143h16.72V57.09h16.66v28.95h6.76v-29h-6.76Z",
  "M1156.73,86.05h-10.22v28.69h10.22v-28.69Z",
  "M1186.97,86.05h-10.22v28.69h10.22v-28.69Z",
  "M1176.75,114.74h-20.02v28.26h20.02v-28.26Z",
];

const HERO_BOUNDS = { minX: 0, maxX: 1178.18, minY: 0, maxY: 494.93 };
const INLINE_BOUNDS = { minX: 0, maxX: 1227, minY: 0, maxY: 143 };

interface MorphPoint {
  srcX: number;
  srcY: number;
  tgtX: number;
  tgtY: number;
  phase: number;
  baseAlpha: number;
  // Thoughtform particle system additions
  noiseOffsetX: number;
  noiseOffsetY: number;
  wanderStrength: number;
  size: number;
  emergeDelay: number; // Staggered emergence timing
}

interface ParticleWordmarkMorphProps {
  /** Direct morph progress (0-1). If provided, overrides scrollProgress threshold calculation */
  morphProgress?: number;
  /** Legacy: scroll progress for internal threshold calculation (deprecated, use morphProgress) */
  scrollProgress?: number;
  wordmarkBounds?: DOMRect | null;
  targetBounds?: { x: number; y: number; width: number; height: number } | null;
  visible?: boolean;
}

function samplePointsFromPaths(
  paths: string[],
  bounds: typeof HERO_BOUNDS,
  density: number = 800
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return points;

  canvas.width = bounds.maxX;
  canvas.height = bounds.maxY;

  // Create paths
  const path2Ds = paths.map((p) => new Path2D(p));

  let tries = 0;
  const maxTries = density * 30;

  while (points.length < density && tries < maxTries) {
    tries++;
    const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
    const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);

    // Check if point is in any path
    for (const path of path2Ds) {
      if (ctx.isPointInPath(path, x, y)) {
        points.push({ x, y });
        break;
      }
    }
  }

  return points;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function ParticleWordmarkMorph({
  morphProgress: morphProgressProp,
  scrollProgress = 0,
  wordmarkBounds,
  targetBounds,
  visible = true,
}: ParticleWordmarkMorphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const pointsRef = useRef<MorphPoint[]>([]);
  const initializedRef = useRef(false);

  const initializePoints = useCallback(() => {
    if (initializedRef.current) return;
    if (typeof window === "undefined") return;

    const POINT_COUNT = 1000;

    // Sample from hero wordmark
    const heroPoints = samplePointsFromPaths(HERO_WORDMARK_PATHS, HERO_BOUNDS, POINT_COUNT);

    // Sample from inline wordmark
    const inlinePoints = samplePointsFromPaths(INLINE_WORDMARK_PATHS, INLINE_BOUNDS, POINT_COUNT);

    // Match and create morph points with Thoughtform particle properties
    const morphPoints: MorphPoint[] = [];

    for (let i = 0; i < POINT_COUNT; i++) {
      const src = heroPoints[i % heroPoints.length];
      const tgt = inlinePoints[i % inlinePoints.length];

      // Normalize to center-relative coordinates
      morphPoints.push({
        srcX: src.x - HERO_BOUNDS.maxX / 2,
        srcY: src.y - HERO_BOUNDS.maxY / 2,
        tgtX: tgt.x - INLINE_BOUNDS.maxX / 2,
        tgtY: tgt.y - INLINE_BOUNDS.maxY / 2,
        phase: Math.random() * Math.PI * 2,
        baseAlpha: 0.4 + Math.random() * 0.5,
        // Thoughtform particle system properties
        noiseOffsetX: Math.random() * 1000,
        noiseOffsetY: Math.random() * 1000,
        wanderStrength: 8 + Math.random() * 12, // Organic drift amount
        size: GRID * (0.8 + Math.random() * 0.4), // Vary particle size slightly
        emergeDelay: Math.random() * 0.2, // Stagger emergence for wave effect
      });
    }

    pointsRef.current = morphPoints;
    initializedRef.current = true;
  }, []);

  useEffect(() => {
    initializePoints();
  }, [initializePoints]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    let time = 0;

    const draw = () => {
      time++;

      // Clear canvas each frame - don't use trail effect here as it covers the gateway/manifold
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!pointsRef.current.length) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      // Use morphProgressProp if provided, otherwise fall back to legacy threshold calculation
      let morphProgress: number;
      let particleOpacity: number;

      if (morphProgressProp !== undefined) {
        // New API: direct progress control (0-1)
        morphProgress = morphProgressProp;
        // Opacity ramps in quickly at start, stays at 1
        particleOpacity = Math.min(1, morphProgressProp * 5); // Full opacity by progress 0.2
      } else {
        // Legacy API: calculate from scrollProgress thresholds
        const morphStart = 0.15;
        const morphEnd = 0.25;
        const rawProgress = Math.max(
          0,
          Math.min(1, (scrollProgress - morphStart) / (morphEnd - morphStart))
        );
        morphProgress = easeInOutCubic(rawProgress);

        const fadeInStart = 0.15;
        const fadeInEnd = 0.18;
        const fadeInProgress = Math.max(
          0,
          Math.min(1, (scrollProgress - fadeInStart) / (fadeInEnd - fadeInStart))
        );
        particleOpacity = scrollProgress >= fadeInEnd ? 1 : fadeInProgress;
      }

      // Calculate positions - follow same trajectory as Vector I
      let centerX: number, centerY: number, scale: number;

      // Default to target position (top of viewport) if available
      if (targetBounds) {
        centerX = targetBounds.x + targetBounds.width / 2;
        centerY = targetBounds.y + targetBounds.height / 2;
        scale =
          Math.min(
            targetBounds.width / INLINE_BOUNDS.maxX,
            (targetBounds.height * 0.5) / INLINE_BOUNDS.maxY
          ) * 1.5;
      } else {
        centerX = window.innerWidth / 2;
        centerY = window.innerHeight / 2;
        scale = 1;
      }

      // Interpolate during morph - from hero wordmark to target position
      if (morphProgress > 0 && morphProgress < 1 && wordmarkBounds && targetBounds) {
        const srcCenterX = wordmarkBounds.left + wordmarkBounds.width / 2;
        const srcCenterY = wordmarkBounds.top + wordmarkBounds.height / 2;
        const tgtCenterX = targetBounds.x + targetBounds.width / 2;
        const tgtCenterY = targetBounds.y + targetBounds.height / 2;

        centerX = srcCenterX + (tgtCenterX - srcCenterX) * morphProgress;
        centerY = srcCenterY + (tgtCenterY - srcCenterY) * morphProgress;

        const srcScale =
          Math.min(
            wordmarkBounds.width / HERO_BOUNDS.maxX,
            wordmarkBounds.height / HERO_BOUNDS.maxY
          ) * 1.2;
        const tgtScale =
          Math.min(
            targetBounds.width / INLINE_BOUNDS.maxX,
            (targetBounds.height * 0.5) / INLINE_BOUNDS.maxY
          ) * 1.5;
        scale = srcScale + (tgtScale - srcScale) * morphProgress;
      } else if (morphProgress >= 1 && targetBounds) {
        // After morph completes, ensure we're at target position
        centerX = targetBounds.x + targetBounds.width / 2;
        centerY = targetBounds.y + targetBounds.height / 2;
        scale =
          Math.min(
            targetBounds.width / INLINE_BOUNDS.maxX,
            (targetBounds.height * 0.5) / INLINE_BOUNDS.maxY
          ) * 1.5;
      }

      // Draw particles with Thoughtform aesthetic
      for (const point of pointsRef.current) {
        // Calculate staggered emergence for wave effect
        const adjustedProgress = Math.max(
          0,
          (morphProgress - point.emergeDelay) / (1 - point.emergeDelay)
        );
        const easedProgress = easeInOutCubic(Math.min(1, adjustedProgress));

        // Interpolate position from source to target
        const x = point.srcX + (point.tgtX - point.srcX) * easedProgress;
        const y = point.srcY + (point.tgtY - point.srcY) * easedProgress;

        // Organic noise-based wandering (Thoughtform style)
        const noiseX = noise2D(point.noiseOffsetX, time * 0.1, time) * point.wanderStrength;
        const noiseY = noise2D(point.noiseOffsetY, time * 0.1 + 100, time) * point.wanderStrength;

        // Reduce wander during mid-transition for more controlled morph
        const wanderFactor = 1 - Math.sin(morphProgress * Math.PI) * 0.5;

        // Breathing animation
        const breathe = Math.sin(time * 0.02 + point.phase) * 2;

        const screenX = centerX + x * scale + noiseX * wanderFactor + breathe * 0.3;
        const screenY = centerY + y * scale + noiseY * wanderFactor + breathe * 0.2;

        // Occasional glitch displacement (Thoughtform style)
        let glitchX = 0,
          glitchY = 0;
        if (Math.random() < 0.002 && morphProgress > 0.2 && morphProgress < 0.8) {
          glitchX = (Math.random() - 0.5) * GRID * 4;
          glitchY = (Math.random() - 0.5) * GRID * 2;
        }

        // GRID snap (SACRED RULE)
        const px = Math.floor((screenX + glitchX) / GRID) * GRID;
        const py = Math.floor((screenY + glitchY) / GRID) * GRID;

        // Pulsing alpha
        const pulse = 0.85 + Math.sin(time * 0.015 + point.phase) * 0.15;
        let alpha = point.baseAlpha * pulse * particleOpacity;

        // Fade edges for smoother look
        if (morphProgress < 0.1) {
          alpha *= morphProgress / 0.1;
        } else if (morphProgress > 0.9) {
          alpha *= (1 - morphProgress) / 0.1;
        }

        // Skip invisible particles
        if (alpha < 0.01) continue;

        // Semantic Dawn color: rgb(236, 227, 214) - Thoughtform brand color
        ctx.fillStyle = `rgba(236, 227, 214, ${alpha})`;
        ctx.fillRect(px, py, point.size, point.size);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [morphProgressProp, scrollProgress, wordmarkBounds, targetBounds, visible]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 2, // Above manifold (0) and gateway (1), but below wordmark container (10)
        backgroundColor: "transparent", // Ensure transparent background
      }}
    />
  );
}
