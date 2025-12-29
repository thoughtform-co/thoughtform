"use client";

import { useEffect, useMemo, useRef } from "react";
import { getShapeGenerator, isValidShape, type Vec3 } from "@/lib/particle-geometry";

type ManifoldParams = {
  rows: number;
  columns: number;
  spreadX: number;
  spreadZ: number;
  waveAmplitude: number;
  waveFrequency: number;
};

const GRID_SNAP = 2;

function snap(v: number) {
  return Math.floor(v / GRID_SNAP) * GRID_SNAP;
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

/**
 * Same terrain function signature as ParticleCanvasV2, but stripped to the essentials.
 * (We keep the recognizable Thoughtform manifold wave language for consistency.)
 */
function getTerrainY(x: number, z: number, config: ManifoldParams): number {
  // Match ParticleCanvasV2's depth domain (roughly 800..8800)
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

  // Keep mountains very subtle for an isometric "map" feel (lower cost / less clutter)
  const mountainStart = 100;
  if (r > mountainStart) {
    const mountainProgress = (r - mountainStart) / (config.rows - mountainStart);
    const mountainHeight = mountainProgress * 240;

    const peak1 = Math.pow(Math.max(0, Math.sin(c * 0.08 + 1.5)), 2) * mountainHeight;
    const peak2 = Math.pow(Math.max(0, Math.sin(c * 0.15 + 0.8)), 2) * mountainHeight * 0.6;
    const peak3 = Math.pow(Math.max(0, Math.sin(c * 0.03)), 1.5) * mountainHeight * 0.8;

    y -= (peak1 + peak2 + peak3) * 0.5;
  }

  return y;
}

type GridNode = {
  x: number;
  y: number;
  z: number;
};

function projectIso(
  p: GridNode,
  camera: { panX: number; panZ: number; scale: number; elevScale: number; cx: number; cy: number }
): { x: number; y: number } {
  const wx = p.x - camera.panX;
  const wz = p.z - camera.panZ;

  // ParticleCanvasV2 convention: smaller y renders higher on screen.
  const elevation = 400 - p.y;

  const sx = camera.cx + (wx - wz) * camera.scale;
  const sy = camera.cy + (wx + wz) * camera.scale * 0.5 - elevation * camera.elevScale;

  return { x: sx, y: sy };
}

export function IsometricTopoGridCanvas({ scrollProgress }: { scrollProgress: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const dimsRef = useRef({ w: 0, h: 0, dpr: 1 });

  const manifold: ManifoldParams = useMemo(
    () => ({
      rows: 220,
      columns: 46,
      spreadX: 1.05,
      spreadZ: 1.0,
      waveAmplitude: 160,
      waveFrequency: 0.16,
    }),
    []
  );

  // Precompute grid nodes once (world space)
  const grid = useMemo(() => {
    const nodes: GridNode[] = [];
    const { rows, columns, spreadX, spreadZ } = manifold;

    // Keep density modest: we draw as lines, so we don't need thousands of particles.
    const stepX = 90 * spreadX;
    const stepZ = 85 * spreadZ;

    for (let r = 0; r < rows; r += 2) {
      for (let c = 0; c < columns; c += 1) {
        const x = (c - columns / 2) * stepX;
        const z = 800 + r * stepZ;
        const y = getTerrainY(x, z, manifold);
        nodes.push({ x, y, z });
      }
    }

    const rowCount = Math.ceil(rows / 2);
    const colCount = columns;
    return { nodes, rowCount, colCount };
  }, [manifold]);

  // Precompute the central artifact points (particle system / registry)
  const artifact = useMemo(() => {
    const shapeId = "tf_fractureSpire";
    if (!isValidShape(shapeId)) return [] as GridNode[];
    const gen = getShapeGenerator(shapeId);

    const pointCount = 700;
    const seed = 4242;
    const pts: Vec3[] = gen({ seed, pointCount, size: 1 });

    const centerX = 0;
    const centerZ = 5200;
    const terrainY = getTerrainY(centerX, centerZ, manifold);

    const worldScale = 520;
    const out: GridNode[] = [];
    for (const p of pts) {
      const x = centerX + p.x * worldScale;
      const z = centerZ + p.z * worldScale * 0.55;
      // Lift above terrain: subtract to move "up" (smaller y)
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

    const render = () => {
      const { w, h } = dimsRef.current;
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const p = clamp01(scrollProgress);

      // Camera pans through the grid along Z (travel).
      const travelStart = 1200;
      const travelEnd = 8800;
      const panZ = travelStart + p * (travelEnd - travelStart);

      // Center map in the viewport.
      const camera = {
        panX: 0,
        panZ,
        // Scale chosen so the grid occupies most of the screen (no horizon band).
        scale: Math.min(w, h) * 0.00018,
        elevScale: Math.min(w, h) * 0.00025,
        cx: w * 0.5,
        cy: h * 0.52,
      };

      // Clear
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#050504";
      ctx.fillRect(0, 0, w, h);

      // Draw topo grid (lines) — a single path is much cheaper than thousands of WebGL line objects.
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(235, 227, 214, 0.10)";
      ctx.beginPath();

      const { nodes, rowCount, colCount } = grid;
      const idx = (r: number, c: number) => r * colCount + c;

      // Row lines (every 2nd row for readability)
      for (let r = 0; r < rowCount; r += 2) {
        let started = false;
        for (let c = 0; c < colCount; c++) {
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

      // Column lines (every 4th column for less density)
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

      // Major contours: cheap “rings” centered on the current camera focus
      ctx.strokeStyle = "rgba(202, 165, 84, 0.08)";
      ctx.beginPath();
      for (let ring = 1; ring <= 6; ring++) {
        const radius = ring * 480;
        const points = 120;
        let started = false;
        for (let i = 0; i <= points; i++) {
          const a = (i / points) * Math.PI * 2;
          const x = Math.cos(a) * radius;
          const z = panZ + Math.sin(a) * radius * 0.7;
          const y = getTerrainY(x, z, manifold) - ring * 12;
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

      // Draw central artifact (particles)
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(202, 165, 84, 0.95)";
      for (const pt of artifact) {
        const s = projectIso(pt, camera);
        const x = snap(s.x);
        const y = snap(s.y);
        // cull offscreen
        if (x < -20 || x > w + 20 || y < -20 || y > h + 20) continue;
        ctx.fillRect(x, y, 3, 3);
      }
      ctx.restore();

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [artifact, grid, manifold, scrollProgress]);

  return (
    <div className="space-background">
      <canvas ref={canvasRef} className="space-canvas" />
    </div>
  );
}
