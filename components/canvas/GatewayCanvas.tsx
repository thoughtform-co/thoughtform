"use client";

import { useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════
// GATEWAY VISUALIZATION
// Torus with terrain, annotations, stars, and orbiting sphere
// ═══════════════════════════════════════════════════════════════════

const colors = {
  void: "#070604",
  gold: [202, 165, 84] as [number, number, number],
  dawn: [236, 227, 214] as [number, number, number],
  teal: [91, 138, 122] as [number, number, number],
};

function rgba(color: [number, number, number], alpha: number): string {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
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

export function GatewayCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const angleYRef = useRef<number>(0);
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
    const torusSegments = 80;
    const tubeSegments = 40;

    for (let i = 0; i < torusSegments; i++) {
      for (let j = 0; j < tubeSegments; j++) {
        const theta = (i / torusSegments) * Math.PI * 2;
        const phi = (j / tubeSegments) * Math.PI * 2;

        const x = (majorR + minorR * Math.cos(phi)) * Math.cos(theta);
        const y = (majorR + minorR * Math.cos(phi)) * Math.sin(theta);
        const z = minorR * Math.sin(phi);

        torusPoints.push({ x, y, z, phi, theta });
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // GENERATE TERRAIN POINTS
    // ═══════════════════════════════════════════════════════════════════

    const terrainPoints: TerrainPoint[] = [];
    const terrainWidth = 12;
    const terrainDepth = 8;
    const terrainResX = 80;
    const terrainResZ = 50;

    for (let i = 0; i < terrainResX; i++) {
      for (let j = 0; j < terrainResZ; j++) {
        const x = (i / terrainResX - 0.5) * terrainWidth;
        const z = (j / terrainResZ - 0.5) * terrainDepth - 1;

        let y = -2.0;

        const distFromCenter = Math.sqrt(x * x + (z + 0.5) * (z + 0.5));

        if (distFromCenter < 4) {
          const wave = Math.cos(distFromCenter * 0.8) * 0.5;
          y += wave * (1 - distFromCenter / 4);
        }

        y += Math.sin(x * 2 + z * 1.5) * 0.1;
        y += Math.cos(z * 3) * 0.05;

        if (x > 2) {
          y += Math.sin((x - 2) * 1.5) * 0.3;
        }

        if (x < -2) {
          y -= 0.3 + Math.abs(x + 2) * 0.1;
        }

        terrainPoints.push({ x, y, z, i, j });
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // GENERATE ANNOTATION LINES
    // ═══════════════════════════════════════════════════════════════════

    const annotations: Annotation[] = [];
    const numAnnotations = 12;

    for (let i = 0; i < numAnnotations; i++) {
      const angle =
        (i / numAnnotations) * Math.PI * 2 + Math.random() * 0.3;
      const startR = majorR + minorR + 0.3;
      const endR = startR + 1.5 + Math.random() * 2;

      const startX = Math.cos(angle) * startR;
      const startY = Math.sin(angle) * startR * 0.3;
      const startZ = Math.sin(angle) * 0.5;

      const endX = Math.cos(angle) * endR;
      const endY =
        Math.sin(angle) * endR * 0.3 + (Math.random() - 0.5) * 0.5;
      const endZ = startZ + (Math.random() - 0.5) * 0.5;

      annotations.push({
        start: { x: startX, y: startY, z: startZ },
        end: { x: endX, y: endY, z: endZ },
        hasNode: Math.random() > 0.3,
        hasTick: Math.random() > 0.5,
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // GENERATE STAR POINTS
    // ═══════════════════════════════════════════════════════════════════

    const starPoints: StarPoint[] = [];
    for (let i = 0; i < 150; i++) {
      starPoints.push({
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.3) * 10,
        z: (Math.random() - 0.5) * 10,
        size: Math.random() * 1.5 + 0.5,
        twinkle: Math.random() * Math.PI * 2,
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // PROJECTION & DRAW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    const angleX = 0.15;
    const gridSize = 2;

    function project(x: number, y: number, z: number): ProjectedPoint {
      const w = canvas!.width / window.devicePixelRatio;
      const h = canvas!.height / window.devicePixelRatio;

      const cosY = Math.cos(angleYRef.current);
      const sinY = Math.sin(angleYRef.current);
      let rx = x * cosY - z * sinY;
      let rz = x * sinY + z * cosY;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const ry = y * cosX - rz * sinX;
      rz = y * sinX + rz * cosX;

      const fov = 4;
      const perspective = fov / (fov + rz);

      const scale = Math.min(w, h) * 0.12;

      return {
        x: w * 0.5 + rx * scale * perspective,
        y: h * 0.5 - ry * scale * perspective,
        z: rz,
        scale: perspective,
      };
    }

    function drawPixel(
      x: number,
      y: number,
      color: [number, number, number],
      alpha: number,
      size: number = gridSize
    ) {
      const px = Math.floor(x / size) * size;
      const py = Math.floor(y / size) * size;
      ctx.fillStyle = rgba(color, alpha);
      ctx.fillRect(px, py, size - 0.5, size - 0.5);
    }

    function drawLine(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color: [number, number, number],
      alpha: number,
      width: number = 1
    ) {
      ctx.strokeStyle = rgba(color, alpha);
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // ═══════════════════════════════════════════════════════════════════
    // RESIZE HANDLER
    // ═══════════════════════════════════════════════════════════════════

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

      // Fade trail
      ctx.fillStyle = "rgba(7, 6, 4, 0.12)";
      ctx.fillRect(0, 0, w, h);

      timeRef.current += 0.016;
      const time = timeRef.current;

      // ─────────────────────────────────────────────────────────────────
      // DRAW STARS
      // ─────────────────────────────────────────────────────────────────

      for (const star of starPoints) {
        const p = project(star.x, star.y, star.z);
        if (p.z < -3) continue;

        const twinkle = Math.sin(time * 2 + star.twinkle) * 0.3 + 0.7;
        const alpha = 0.2 * twinkle * p.scale;

        drawPixel(p.x, p.y, colors.dawn, alpha, star.size);
      }

      // ─────────────────────────────────────────────────────────────────
      // DRAW ANNOTATION LINES
      // ─────────────────────────────────────────────────────────────────

      for (const ann of annotations) {
        const p1 = project(ann.start.x, ann.start.y, ann.start.z);
        const p2 = project(ann.end.x, ann.end.y, ann.end.z);

        drawLine(p1.x, p1.y, p2.x, p2.y, colors.dawn, 0.15, 0.5);

        if (ann.hasNode) {
          ctx.beginPath();
          ctx.arc(p2.x, p2.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = rgba(colors.dawn, 0.3);
          ctx.fill();
        }

        if (ann.hasTick) {
          const mx = (p1.x + p2.x) / 2;
          const my = (p1.y + p2.y) / 2;
          const angle =
            Math.atan2(p2.y - p1.y, p2.x - p1.x) + Math.PI / 2;
          const tickLen = 4;
          drawLine(
            mx - Math.cos(angle) * tickLen,
            my - Math.sin(angle) * tickLen,
            mx + Math.cos(angle) * tickLen,
            my + Math.sin(angle) * tickLen,
            colors.dawn,
            0.2,
            0.5
          );
        }
      }

      // ─────────────────────────────────────────────────────────────────
      // DRAW TERRAIN
      // ─────────────────────────────────────────────────────────────────

      const sortedTerrain = terrainPoints
        .map((p) => ({ ...p, proj: project(p.x, p.y, p.z) }))
        .filter((p) => p.proj.z > -4)
        .sort((a, b) => b.proj.z - a.proj.z);

      for (const p of sortedTerrain) {
        const depth = (p.proj.z + 4) / 8;
        const alpha = 0.15 + depth * 0.5;

        const color = depth > 0.5 ? colors.dawn : colors.gold;

        const waveOffset =
          Math.sin(time * 0.5 + p.i * 0.1 + p.j * 0.15) * 0.02;

        drawPixel(
          p.proj.x,
          p.proj.y + waveOffset * 100 * p.proj.scale,
          color,
          alpha * 0.7,
          gridSize
        );
      }

      // ─────────────────────────────────────────────────────────────────
      // DRAW TORUS
      // ─────────────────────────────────────────────────────────────────

      const sortedTorus = torusPoints
        .map((p) => ({ ...p, proj: project(p.x, p.y, p.z) }))
        .sort((a, b) => b.proj.z - a.proj.z);

      for (const p of sortedTorus) {
        const depth = (p.proj.z + 3) / 6;

        const isInner = Math.cos(p.phi) < 0;

        let alpha = 0.2 + depth * 0.7;

        const lightAngle =
          Math.cos(p.theta + angleYRef.current) * 0.3 + 0.7;
        alpha *= lightAngle;

        const color =
          depth > 0.4 && !isInner ? colors.dawn : colors.gold;

        drawPixel(
          p.proj.x,
          p.proj.y,
          color,
          isInner ? alpha * 0.5 : alpha,
          gridSize
        );
      }

      // ─────────────────────────────────────────────────────────────────
      // DRAW ORBITING SPHERE
      // ─────────────────────────────────────────────────────────────────

      const sphereAngle = time * 0.3;
      const sphereX = Math.cos(sphereAngle) * 5;
      const sphereY = -1.5;
      const sphereZ = Math.sin(sphereAngle) * 2 - 2;

      for (let i = 0; i < 30; i++) {
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = Math.random() * Math.PI;
        const r = 0.15;

        const sx = sphereX + r * Math.sin(angle2) * Math.cos(angle1);
        const sy = sphereY + r * Math.sin(angle2) * Math.sin(angle1);
        const sz = sphereZ + r * Math.cos(angle2);

        const sp = project(sx, sy, sz);
        drawPixel(sp.x, sp.y, colors.dawn, 0.4, 1.5);
      }

      // Very slow rotation
      angleYRef.current += 0.001;

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

