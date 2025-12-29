"use client";

import { useEffect, useMemo, useRef } from "react";
import { getShapeGenerator, isValidShape, type Vec3 } from "@/lib/particle-geometry";
import type { IsometricSection } from "./sections";
import { ISOMETRIC_SECTIONS } from "./sections";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const COLORS = {
  background: "#050505",
  terrain: "rgba(235, 227, 214, 0.18)",
  terrainMajor: "rgba(235, 227, 214, 0.35)",
  contour: "rgba(202, 165, 84, 0.12)",
  city: "#ffaa00",
  cityGlow: "#ff4400",
  fog: "#050505",
};

const GRID_SNAP = 2;

function snap(v: number) {
  return Math.floor(v / GRID_SNAP) * GRID_SNAP;
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ═══════════════════════════════════════════════════════════════
// TERRAIN GENERATION - Stepped like Gemini reference
// ═══════════════════════════════════════════════════════════════

type ManifoldParams = {
  rows: number;
  columns: number;
  spreadX: number;
  spreadZ: number;
  waveAmplitude: number;
  waveFrequency: number;
};

function getNoise(x: number, z: number): number {
  return Math.sin(x * 0.1) * Math.cos(z * 0.1) * 3 + Math.sin(x * 0.3 + z * 0.2) * 1.5;
}

function getTerrainY(x: number, z: number, config: ManifoldParams, stepped = false): number {
  const clampedZ = Math.max(800, Math.min(8800, z));
  const r = (clampedZ - 800) / 50;
  const c = x / 65 + 35;

  const wavePhase = r * 0.02;
  let y =
    400 +
    Math.sin(c * config.waveFrequency + wavePhase) * config.waveAmplitude +
    Math.cos(r * 0.12) * 150 +
    Math.sin(c * 0.35 + r * 0.15) * 70 +
    Math.sin(r * 0.08) * 100;

  // Mountain range in far background
  const mountainStart = 100;
  if (r > mountainStart) {
    const mountainProgress = (r - mountainStart) / (config.rows - mountainStart);
    const mountainHeight = mountainProgress * 240;

    const peak1 = Math.pow(Math.max(0, Math.sin(c * 0.08 + 1.5)), 2) * mountainHeight;
    const peak2 = Math.pow(Math.max(0, Math.sin(c * 0.15 + 0.8)), 2) * mountainHeight * 0.6;
    const peak3 = Math.pow(Math.max(0, Math.sin(c * 0.03)), 1.5) * mountainHeight * 0.8;

    y -= (peak1 + peak2 + peak3) * 0.5;
  }

  // Stepped terrain effect (like Gemini reference)
  if (stepped) {
    const stepHeight = 35;
    y = Math.floor(y / stepHeight) * stepHeight;
  }

  return y;
}

// ═══════════════════════════════════════════════════════════════
// ISOMETRIC PROJECTION - True isometric with scene rotation
// ═══════════════════════════════════════════════════════════════

type GridNode = {
  x: number;
  y: number;
  z: number;
};

type Camera = {
  panZ: number;
  rotationY: number; // Scene rotation
  cameraY: number; // Camera height
  zoom: number;
  cx: number;
  cy: number;
};

/**
 * Project 3D point to 2D screen coordinates using true isometric projection.
 * Includes scene rotation around Y-axis (like Gemini's scene.rotation.y).
 */
function projectIso(p: GridNode, camera: Camera): { x: number; y: number; depth: number } {
  // Translate to camera space (world origin at camera focus)
  let wx = p.x;
  let wz = p.z - camera.panZ;

  // Apply scene rotation around Y-axis
  const cos = Math.cos(camera.rotationY);
  const sin = Math.sin(camera.rotationY);
  const rx = wx * cos - wz * sin;
  const rz = wx * sin + wz * cos;
  wx = rx;
  wz = rz;

  // Elevation: smaller y = higher on screen
  const elevation = (400 - p.y) * 0.0015 * camera.cameraY;

  // True isometric projection (30° from horizontal)
  // At zoom 1: base scale factor
  const baseScale = 0.35 * camera.zoom;

  // Classic isometric formula: x-axis 30° left, y-axis 30° right
  const sx = camera.cx + (wx - wz) * baseScale;
  const sy = camera.cy + (wx + wz) * baseScale * 0.5 - elevation * camera.zoom;

  // Depth for sorting/fog
  const depth = wz;

  return { x: sx, y: sy, depth };
}

// ═══════════════════════════════════════════════════════════════
// CITY BUILDINGS - Glowing wireframe structures
// ═══════════════════════════════════════════════════════════════

type Building = {
  x: number;
  z: number;
  height: number;
  width: number;
};

function generateCity(centerX: number, centerZ: number, count: number): Building[] {
  const buildings: Building[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 600;
    buildings.push({
      x: centerX + Math.cos(angle) * radius,
      z: centerZ + Math.sin(angle) * radius,
      height: 80 + Math.random() * 320,
      width: 30 + Math.random() * 60,
    });
  }
  return buildings;
}

function drawBuilding(
  ctx: CanvasRenderingContext2D,
  building: Building,
  camera: Camera,
  config: ManifoldParams,
  time: number,
  screenW: number,
  screenH: number
) {
  const baseY = getTerrainY(building.x, building.z, config, true);
  const base = projectIso({ x: building.x, y: baseY, z: building.z }, camera);
  const top = projectIso({ x: building.x, y: baseY - building.height, z: building.z }, camera);

  // Skip if off-screen
  if (base.x < -100 || base.x > screenW + 100) return;
  if (base.y < -100 || base.y > screenH + 100) return;

  // Fog effect based on depth (buildings further away are dimmer)
  const fogAmount = clamp01(Math.abs(base.depth) / 2500);
  const alpha = clamp01(1 - fogAmount * 0.7);
  if (alpha < 0.1) return;

  // Pulse animation
  const pulse = 1 + Math.sin(time * 0.003 + building.x * 0.01) * 0.15;

  // Building wireframe - vertical line from base to top
  ctx.save();

  // Glow effect first (underneath)
  ctx.globalAlpha = alpha * 0.5 * pulse;
  ctx.shadowColor = COLORS.cityGlow;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = COLORS.cityGlow;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(snap(base.x), snap(base.y));
  ctx.lineTo(snap(top.x), snap(top.y));
  ctx.stroke();

  // Main building line
  ctx.shadowBlur = 0;
  ctx.globalAlpha = alpha * 0.95;
  ctx.strokeStyle = COLORS.city;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(snap(base.x), snap(base.y));
  ctx.lineTo(snap(top.x), snap(top.y));
  ctx.stroke();

  // Top cap (small horizontal line)
  const capSize = building.width * 0.015 * camera.zoom;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(snap(top.x - capSize), snap(top.y));
  ctx.lineTo(snap(top.x + capSize), snap(top.y));
  ctx.stroke();

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
// SCROLL INTERPOLATION - Gemini-style scrubbing
// ═══════════════════════════════════════════════════════════════

// Helper to get section property with fallback (backwards compatibility)
function getSectionProp<T extends keyof IsometricSection>(
  section: IsometricSection,
  prop: T,
  fallback: number
): number {
  const value = section[prop];
  return typeof value === "number" ? value : fallback;
}

function getSectionValues(
  sections: readonly IsometricSection[],
  scrollProgress: number
): {
  rotationY: number;
  cameraY: number;
  zoom: number;
  travelZ: number;
  activeSection: IsometricSection;
} {
  const p = clamp01(scrollProgress);

  // Find which section we're in
  let idx = 0;
  for (let i = 0; i < sections.length; i++) {
    const [start, end] = sections[i].range;
    if (p >= start && p <= end) {
      idx = i;
      break;
    }
    if (p > end) idx = i;
  }

  const from = sections[idx];
  const to = sections[Math.min(idx + 1, sections.length - 1)];

  // Local progress within section
  const [start, end] = from.range;
  const span = Math.max(1e-6, end - start);
  const localT = easeInOutCubic(clamp01((p - start) / span));

  // Default values for Gemini-style journey (if sections file hasn't updated)
  const defaultTravelStart = 1200;
  const defaultTravelEnd = 8800;
  const defaultRotation = 0;
  const defaultCameraY = 20;

  // Calculate travelZ from scroll progress if not provided in section
  const fallbackTravelZ = defaultTravelStart + p * (defaultTravelEnd - defaultTravelStart);

  // Apply rotation over scroll (0° to 90°) if not provided
  const fallbackRotation = p * (Math.PI / 2);

  // Camera drops from high to low over scroll
  const fallbackCameraY = lerp(20, 5, p);

  return {
    rotationY: lerp(
      getSectionProp(from, "rotationY", fallbackRotation),
      getSectionProp(to, "rotationY", fallbackRotation),
      localT
    ),
    cameraY: lerp(
      getSectionProp(from, "cameraY", fallbackCameraY),
      getSectionProp(to, "cameraY", fallbackCameraY),
      localT
    ),
    zoom: lerp(
      getSectionProp(from, "zoom", 1 + p * 3),
      getSectionProp(to, "zoom", 1 + p * 3),
      localT
    ),
    travelZ: lerp(
      getSectionProp(from, "travelZ", fallbackTravelZ),
      getSectionProp(to, "travelZ", fallbackTravelZ),
      localT
    ),
    activeSection: from,
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function IsometricTopoGridCanvas({
  scrollProgress,
  sections = ISOMETRIC_SECTIONS,
}: {
  scrollProgress: number;
  sections?: readonly IsometricSection[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const dimsRef = useRef({ w: 0, h: 0, dpr: 1 });
  const timeRef = useRef(0);

  const manifold: ManifoldParams = useMemo(
    () => ({
      rows: 220,
      columns: 50,
      spreadX: 1.05,
      spreadZ: 1.0,
      waveAmplitude: 160,
      waveFrequency: 0.16,
    }),
    []
  );

  // Precompute terrain grid
  const grid = useMemo(() => {
    const nodes: GridNode[] = [];
    const { rows, columns, spreadX, spreadZ } = manifold;

    const stepX = 90 * spreadX;
    const stepZ = 85 * spreadZ;

    for (let r = 0; r < rows; r += 2) {
      for (let c = 0; c < columns; c += 1) {
        const x = (c - columns / 2) * stepX;
        const z = 800 + r * stepZ;
        const y = getTerrainY(x, z, manifold, true); // Stepped terrain
        nodes.push({ x, y, z });
      }
    }

    const rowCount = Math.ceil(rows / 2);
    const colCount = columns;
    return { nodes, rowCount, colCount };
  }, [manifold]);

  // Precompute city buildings
  const city = useMemo(() => {
    return generateCity(0, 5200, 60);
  }, []);

  // Precompute artifact particles
  const artifact = useMemo(() => {
    const shapeId = "tf_fractureSpire";
    if (!isValidShape(shapeId)) return [] as GridNode[];
    const gen = getShapeGenerator(shapeId);

    const pointCount = 700;
    const seed = 4242;
    const pts: Vec3[] = gen({ seed, pointCount, size: 1 });

    const centerX = 0;
    const centerZ = 5200;
    const terrainY = getTerrainY(centerX, centerZ, manifold, true);

    const worldScale = 520;
    const out: GridNode[] = [];
    for (const p of pts) {
      const x = centerX + p.x * worldScale;
      const z = centerZ + p.z * worldScale * 0.55;
      const y = terrainY - 220 - p.y * worldScale * 0.9;
      out.push({ x, y, z });
    }
    return out;
  }, [manifold]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight;
      dimsRef.current = { w, h, dpr };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = (timestamp: number) => {
      timeRef.current = timestamp;
      const { w, h } = dimsRef.current;
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const { rotationY, cameraY, zoom, travelZ } = getSectionValues(sections, scrollProgress);

      const camera: Camera = {
        panZ: travelZ,
        rotationY,
        cameraY,
        zoom,
        cx: w * 0.5,
        cy: h * 0.5,
      };

      // Clear with background
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, w, h);

      // Draw terrain grid
      ctx.save();
      ctx.lineWidth = 1;

      const { nodes, rowCount, colCount } = grid;
      const idx = (r: number, c: number) => r * colCount + c;

      // Row lines (every 2nd row)
      ctx.strokeStyle = COLORS.terrain;
      ctx.beginPath();
      for (let r = 0; r < rowCount; r += 2) {
        let started = false;
        for (let c = 0; c < colCount; c++) {
          const pt = nodes[idx(r, c)];
          const s = projectIso(pt, camera);

          // Fog effect
          const fogAlpha = clamp01(1 - Math.abs(s.depth) / 4000);
          if (fogAlpha < 0.05) continue;

          const x = snap(s.x);
          const y = snap(s.y);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();

      // Column lines (every 4th column)
      ctx.beginPath();
      for (let c = 0; c < colCount; c += 4) {
        let started = false;
        for (let r = 0; r < rowCount; r++) {
          const pt = nodes[idx(r, c)];
          const s = projectIso(pt, camera);
          const x = snap(s.x);
          const y = snap(s.y);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();

      // Major contour rings
      ctx.strokeStyle = COLORS.contour;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let ring = 1; ring <= 6; ring++) {
        const radius = ring * 480;
        const points = 120;
        let started = false;
        for (let i = 0; i <= points; i++) {
          const a = (i / points) * Math.PI * 2;
          const x = Math.cos(a) * radius;
          const z = travelZ + Math.sin(a) * radius * 0.7;
          const y = getTerrainY(x, z, manifold, true) - ring * 12;
          const s = projectIso({ x, y, z }, camera);
          const sx = snap(s.x);
          const sy = snap(s.y);
          if (!started) {
            ctx.moveTo(sx, sy);
            started = true;
          } else {
            ctx.lineTo(sx, sy);
          }
        }
      }
      ctx.stroke();

      ctx.restore();

      // Draw city buildings
      for (const building of city) {
        drawBuilding(ctx, building, camera, manifold, timestamp, w, h);
      }

      // Draw central artifact
      ctx.save();
      ctx.fillStyle = COLORS.city;
      ctx.shadowColor = COLORS.cityGlow;
      ctx.shadowBlur = 8;
      for (const pt of artifact) {
        const s = projectIso(pt, camera);
        const fogAlpha = clamp01(1 - Math.abs(s.depth) / 3000);
        if (fogAlpha < 0.1) continue;

        const x = snap(s.x);
        const y = snap(s.y);
        if (x < -20 || x > w + 20 || y < -20 || y > h + 20) continue;

        ctx.globalAlpha = fogAlpha * 0.95;
        ctx.fillRect(x, y, 3, 3);
      }
      ctx.restore();

      // Fog gradient overlay (atmospheric depth)
      const gradient = ctx.createRadialGradient(
        w / 2,
        h / 2,
        0,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.7
      );
      gradient.addColorStop(0, "rgba(5, 5, 5, 0)");
      gradient.addColorStop(0.6, "rgba(5, 5, 5, 0.1)");
      gradient.addColorStop(1, "rgba(5, 5, 5, 0.6)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [artifact, city, grid, manifold, scrollProgress, sections]);

  return (
    <div className="fixed inset-0 z-0">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
