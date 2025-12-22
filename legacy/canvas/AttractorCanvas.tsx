"use client";

import { useEffect, useRef } from "react";

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export function AttractorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    // Halvorsen attractor parameters
    const a = 1.89;
    const dt = 0.005;
    const numPoints = 2500;
    const points: Point3D[] = [];

    // Generate attractor points
    let x = 1,
      y = 0,
      z = 0;

    for (let i = 0; i < numPoints; i++) {
      const dx = -a * x - 4 * y - 4 * z - y * y;
      const dy = -a * y - 4 * z - 4 * x - z * z;
      const dz = -a * z - 4 * x - 4 * y - x * x;

      x += dx * dt;
      y += dy * dt;
      z += dz * dt;

      points.push({ x, y, z });
    }

    let angle = 0;

    const draw = () => {
      // Fade trail
      ctx.fillStyle = "rgba(7, 6, 4, 0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const scale = Math.min(canvas.width, canvas.height) / 14;

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const gridSize = 3;

      for (const p of points) {
        // Rotate around Y axis
        const rx = p.x * cosA - p.z * sinA;
        const rz = p.x * sinA + p.z * cosA;

        // Perspective
        const perspective = 1 / (1 + rz * 0.1);
        const sx = centerX + rx * scale * perspective;
        const sy = centerY + p.y * scale * perspective;

        // Depth-based alpha
        const depth = (rz + 5) / 10;
        const alpha = 0.2 + depth * 0.5;

        // Pixelated rendering
        const px = Math.floor(sx / gridSize) * gridSize;
        const py = Math.floor(sy / gridSize) * gridSize;

        ctx.fillStyle = `rgba(202, 165, 84, ${alpha})`;
        ctx.fillRect(px, py, gridSize - 1, gridSize - 1);
      }

      angle += 0.002;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full z-0 opacity-40"
      aria-hidden="true"
    />
  );
}
