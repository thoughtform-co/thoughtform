"use client";

import { useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════
// GATEWAY CARDINAL FLOW
// Torus gateway with Halvorsen attractor flowing through
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
  gatewayX: 0.68,
  gatewayY: 0.45,
  scale: 0.14,
  halvorsen: {
    a: 1.4,
    dt: 0.004,
    points: 12000,
    scale: 0.25,
    flowSpeed: 0.5, // Increased from 0.15
    opacity: 0.6, // Slightly more visible
  },
  // Animation speeds
  pulseSpeed: 1.2, // Torus breathing
  torusRotation: 1.5, // Energy wave around ring
  terrainWave: 1.0, // Terrain undulation
  starTwinkle: 3.0, // Star sparkle speed
};

const colors = {
  void: "#070604",
  gold: [202, 165, 84] as [number, number, number],
  dawn: [236, 227, 214] as [number, number, number],
  teal: [91, 138, 122] as [number, number, number],
  geometry: [202, 165, 84] as [number, number, number],
  alterity: [91, 138, 122] as [number, number, number],
  dynamics: [170, 130, 90] as [number, number, number],
};

function rgba(color: [number, number, number], alpha: number): string {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

function lerpColor(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number
): [number, number, number] {
  return [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t];
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface TorusPoint extends Point3D {
  phi: number;
  theta: number;
}

interface HalvorsenPoint extends Point3D {
  cardinal: number;
  index: number;
}

interface TerrainPoint extends Point3D {
  i: number;
  j: number;
}

interface Annotation {
  start: Point3D;
  end: Point3D;
  hasNode: boolean;
  hasTick: boolean;
}

interface StarPoint extends Point3D {
  size: number;
  twinkle: number;
}

interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
  scale: number;
}

export function GatewayCardinalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ═══════════════════════════════════════════════════════════════════
    // GENERATE TORUS POINTS
    // ═══════════════════════════════════════════════════════════════════

    const torusPoints: TorusPoint[] = [];
    const majorR = 2.2;
    const minorR = 0.9;

    for (let i = 0; i < 80; i++) {
      for (let j = 0; j < 40; j++) {
        const theta = (i / 80) * Math.PI * 2;
        const phi = (j / 40) * Math.PI * 2;
        const x = (majorR + minorR * Math.cos(phi)) * Math.cos(theta);
        const y = (majorR + minorR * Math.cos(phi)) * Math.sin(theta);
        const z = minorR * Math.sin(phi);
        torusPoints.push({ x, y, z, phi, theta });
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // GENERATE HALVORSEN ATTRACTOR
    // ═══════════════════════════════════════════════════════════════════

    const halvorsenPoints: HalvorsenPoint[] = [];
    const { a, dt, points } = CONFIG.halvorsen;
    let hx = 1,
      hy = 0,
      hz = 0;

    for (let i = 0; i < 500; i++) {
      const dx = -a * hx - 4 * hy - 4 * hz - hy * hy;
      const dy = -a * hy - 4 * hz - 4 * hx - hz * hz;
      const dz = -a * hz - 4 * hx - 4 * hy - hx * hx;
      hx += dx * dt;
      hy += dy * dt;
      hz += dz * dt;
    }

    for (let i = 0; i < points; i++) {
      const dx = -a * hx - 4 * hy - 4 * hz - hy * hy;
      const dy = -a * hy - 4 * hz - 4 * hx - hz * hz;
      const dz = -a * hz - 4 * hx - 4 * hy - hx * hx;
      hx += dx * dt;
      hy += dy * dt;
      hz += dz * dt;

      const absX = Math.abs(hx);
      const absY = Math.abs(hy);
      const absZ = Math.abs(hz);
      let cardinal = 0;
      if (absX > absY && absX > absZ) cardinal = 0;
      else if (absY > absZ) cardinal = 1;
      else cardinal = 2;

      halvorsenPoints.push({ x: hx, y: hy, z: hz, cardinal, index: i });
    }

    // ═══════════════════════════════════════════════════════════════════
    // GENERATE TERRAIN
    // ═══════════════════════════════════════════════════════════════════

    const terrainPoints: TerrainPoint[] = [];
    for (let i = 0; i < 120; i++) {
      for (let j = 0; j < 50; j++) {
        const x = (i / 120 - 0.5) * 18;
        const z = (j / 50 - 0.5) * 8 - 1;
        let y = -2.0;

        const gatewayWorldX = 3.5;
        const dist = Math.sqrt((x - gatewayWorldX) ** 2 + (z + 0.5) ** 2);
        if (dist < 4) y += Math.cos(dist * 0.8) * 0.5 * (1 - dist / 4);
        y += Math.sin(x * 2 + z * 1.5) * 0.1 + Math.cos(z * 3) * 0.05;
        if (x > gatewayWorldX - 1) y += Math.sin((x - gatewayWorldX + 1) * 1.2) * 0.25;
        if (x < -2) y -= 0.2 + Math.abs(x + 2) * 0.05;

        terrainPoints.push({ x, y, z, i, j });
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // GENERATE ANNOTATIONS & STARS
    // ═══════════════════════════════════════════════════════════════════

    const annotations: Annotation[] = [];
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
      const startR = majorR + minorR + 0.3;
      const endR = startR + 1.5 + Math.random() * 2.5;
      annotations.push({
        start: {
          x: Math.cos(angle) * startR,
          y: Math.sin(angle) * startR * 0.3,
          z: Math.sin(angle) * 0.5,
        },
        end: {
          x: Math.cos(angle) * endR,
          y: Math.sin(angle) * endR * 0.3 + (Math.random() - 0.5) * 0.5,
          z: Math.sin(angle) * 0.5 + (Math.random() - 0.5) * 0.5,
        },
        hasNode: Math.random() > 0.3,
        hasTick: Math.random() > 0.5,
      });
    }

    const starPoints: StarPoint[] = [];
    for (let i = 0; i < 200; i++) {
      starPoints.push({
        x: (Math.random() - 0.5) * 30,
        y: (Math.random() - 0.4) * 12,
        z: (Math.random() - 0.5) * 15,
        size: Math.random() * 1.5 + 0.5,
        twinkle: Math.random() * Math.PI * 2,
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // PROJECTION & DRAW
    // ═══════════════════════════════════════════════════════════════════

    const angleX = 0.15;
    const gridSize = 2;

    function projectGateway(x: number, y: number, z: number): ProjectedPoint {
      const w = canvas!.width / window.devicePixelRatio;
      const h = canvas!.height / window.devicePixelRatio;
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const ry = y * cosX - z * sinX;
      const rz = y * sinX + z * cosX;
      const fov = 4;
      const perspective = fov / (fov + rz);
      const scale = Math.min(w, h) * CONFIG.scale;
      return {
        x: w * CONFIG.gatewayX + x * scale * perspective,
        y: h * CONFIG.gatewayY - ry * scale * perspective,
        z: rz,
        scale: perspective,
      };
    }

    function projectStar(x: number, y: number, z: number): ProjectedPoint {
      const w = canvas!.width / window.devicePixelRatio;
      const h = canvas!.height / window.devicePixelRatio;
      const fov = 4;
      const perspective = fov / (fov + z);
      const scale = Math.min(w, h) * 0.08;
      return {
        x: w * 0.5 + x * scale * perspective,
        y: h * 0.5 - y * scale * perspective,
        z,
        scale: perspective,
      };
    }

    function drawPixel(
      x: number,
      y: number,
      color: [number, number, number],
      alpha: number,
      size = gridSize
    ) {
      const px = Math.floor(x / size) * size;
      const py = Math.floor(y / size) * size;
      ctx!.fillStyle = rgba(color, alpha);
      ctx!.fillRect(px, py, size - 0.5, size - 0.5);
    }

    function drawLine(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color: [number, number, number],
      alpha: number,
      width = 1
    ) {
      ctx!.strokeStyle = rgba(color, alpha);
      ctx!.lineWidth = width;
      ctx!.beginPath();
      ctx!.moveTo(x1, y1);
      ctx!.lineTo(x2, y2);
      ctx!.stroke();
    }

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      canvas!.width = parent.clientWidth * window.devicePixelRatio;
      canvas!.height = parent.clientHeight * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    resize();
    window.addEventListener("resize", resize);

    // ═══════════════════════════════════════════════════════════════════
    // MAIN DRAW LOOP
    // ═══════════════════════════════════════════════════════════════════

    function draw() {
      const w = canvas!.width / window.devicePixelRatio;
      const h = canvas!.height / window.devicePixelRatio;

      ctx!.fillStyle = "rgba(7, 6, 4, 0.1)";
      ctx!.fillRect(0, 0, w, h);

      timeRef.current += 0.016;
      const time = timeRef.current;
      const pulse = Math.sin(time * CONFIG.pulseSpeed) * 0.03;
      const flowOffset = time * CONFIG.halvorsen.flowSpeed;

      // Stars
      for (const star of starPoints) {
        const p = projectStar(star.x, star.y, star.z);
        if (p.z < -5) continue;
        const twinkle = Math.sin(time * CONFIG.starTwinkle + star.twinkle) * 0.3 + 0.7;
        drawPixel(p.x, p.y, colors.dawn, 0.15 * twinkle * p.scale, star.size);
      }

      // Annotations
      for (const ann of annotations) {
        const p1 = projectGateway(ann.start.x, ann.start.y, ann.start.z);
        const p2 = projectGateway(ann.end.x, ann.end.y, ann.end.z);
        drawLine(p1.x, p1.y, p2.x, p2.y, colors.dawn, 0.12, 0.5);
        if (ann.hasNode) {
          ctx!.beginPath();
          ctx!.arc(p2.x, p2.y, 2, 0, Math.PI * 2);
          ctx!.fillStyle = rgba(colors.dawn, 0.25);
          ctx!.fill();
        }
        if (ann.hasTick) {
          const mx = (p1.x + p2.x) / 2;
          const my = (p1.y + p2.y) / 2;
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) + Math.PI / 2;
          drawLine(
            mx - Math.cos(angle) * 4,
            my - Math.sin(angle) * 4,
            mx + Math.cos(angle) * 4,
            my + Math.sin(angle) * 4,
            colors.dawn,
            0.18,
            0.5
          );
        }
      }

      // Terrain
      const sortedTerrain = terrainPoints
        .map((p) => ({ ...p, proj: projectGateway(p.x, p.y, p.z) }))
        .filter((p) => p.proj.z > -4 && p.proj.x > -50 && p.proj.x < w + 50)
        .sort((a, b) => b.proj.z - a.proj.z);

      for (const p of sortedTerrain) {
        const depth = (p.proj.z + 4) / 8;
        let alpha = (0.12 + depth * 0.45) * Math.min(1, p.proj.x / (w * 0.3)) * 0.65;
        const color = depth > 0.5 ? colors.dawn : colors.gold;
        const waveOffset = Math.sin(time * CONFIG.terrainWave + p.i * 0.1 + p.j * 0.15) * 0.02;
        drawPixel(p.proj.x, p.proj.y + waveOffset * 100 * p.proj.scale, color, alpha, gridSize);
      }

      // Halvorsen
      const cardinalColors = [colors.geometry, colors.alterity, colors.dynamics];
      const hScale = CONFIG.halvorsen.scale;

      const sortedHalvorsen = halvorsenPoints
        .map((p) => {
          const zFlow = Math.sin(flowOffset + p.index * 0.0003) * 0.8;
          return {
            ...p,
            proj: projectGateway(p.x * hScale, p.y * hScale, p.z * hScale + zFlow),
            flow: (Math.sin(flowOffset + p.index * 0.0005) + 1) / 2,
          };
        })
        .sort((a, b) => b.proj.z - a.proj.z);

      for (const p of sortedHalvorsen) {
        const depth = (p.proj.z + 3) / 6;
        let alpha = (0.1 + depth * 0.4) * CONFIG.halvorsen.opacity * (0.5 + p.flow * 0.5);
        const color = lerpColor(cardinalColors[p.cardinal], colors.dawn, p.flow * 0.3);
        drawPixel(p.proj.x, p.proj.y, color, alpha, 1.5);
      }

      // Torus
      const sortedTorus = torusPoints
        .map((p) => ({
          ...p,
          x: p.x * (1 + pulse),
          y: p.y * (1 + pulse),
          z: p.z * (1 + pulse),
        }))
        .map((p) => ({ ...p, proj: projectGateway(p.x, p.y, p.z) }))
        .sort((a, b) => b.proj.z - a.proj.z);

      for (const p of sortedTorus) {
        const depth = (p.proj.z + 3) / 6;
        const isInner = Math.cos(p.phi) < 0;
        let alpha =
          (0.2 + depth * 0.7) * (Math.sin(p.theta * 2 - time * CONFIG.torusRotation) * 0.15 + 0.85);
        const color = depth > 0.4 && !isInner ? colors.dawn : colors.gold;
        drawPixel(p.proj.x, p.proj.y, color, isInner ? alpha * 0.5 : alpha, gridSize);
      }

      // Moon
      for (let i = 0; i < 35; i++) {
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = Math.random() * Math.PI;
        const r = 0.18;
        const sp = projectGateway(
          4.5 + r * Math.sin(angle2) * Math.cos(angle1),
          -2.2 + r * Math.sin(angle2) * Math.sin(angle1),
          -2 + r * Math.cos(angle2)
        );
        drawPixel(sp.x, sp.y, colors.dawn, 0.35, 1.5);
      }

      animationRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: colors.void }}
    />
  );
}
