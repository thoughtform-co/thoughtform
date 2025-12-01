"use client";

import { useEffect, useRef } from "react";

interface TorusPoint {
  x: number;
  y: number;
  z: number;
  phi: number;
}

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize handler
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    // Torus parameters
    const majorR = 3;
    const minorR = 1.2;
    const segments = 60;
    const tubeSegments = 30;

    // Generate torus points
    const torusPoints: TorusPoint[] = [];
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < tubeSegments; j++) {
        const theta = (i / segments) * Math.PI * 2;
        const phi = (j / tubeSegments) * Math.PI * 2;

        const x = (majorR + minorR * Math.cos(phi)) * Math.cos(theta);
        const y = (majorR + minorR * Math.cos(phi)) * Math.sin(theta);
        const z = minorR * Math.sin(phi);

        torusPoints.push({ x, y, z, phi });
      }
    }

    let angleY = 0;
    const angleX = 0.3;

    const draw = () => {
      // Fade trail
      ctx.fillStyle = "rgba(7, 6, 4, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width * 0.65;
      const centerY = canvas.height * 0.5;
      const scale = Math.min(canvas.width, canvas.height) / 14;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      const gridSize = 2;

      for (const p of torusPoints) {
        // Rotate around Y axis
        let rx = p.x * cosY - p.z * sinY;
        let rz = p.x * sinY + p.z * cosY;

        // Rotate around X axis
        const ry = p.y * cosX - rz * sinX;
        rz = p.y * sinX + rz * cosX;

        // Perspective
        const perspective = 1 / (1 + rz * 0.08);
        const sx = centerX + rx * scale * perspective;
        const sy = centerY + ry * scale * perspective;

        // Depth-based alpha
        const depth = (rz + 5) / 10;
        const alpha = 0.2 + depth * 0.6;

        // Inner vs outer ring coloring
        const isInner = Math.cos(p.phi) < 0;

        // Pixelated rendering
        const px = Math.floor(sx / gridSize) * gridSize;
        const py = Math.floor(sy / gridSize) * gridSize;

        if (isInner) {
          ctx.fillStyle = `rgba(236, 227, 214, ${alpha * 0.6})`;
        } else {
          ctx.fillStyle = `rgba(202, 165, 84, ${alpha})`;
        }

        ctx.fillRect(px, py, gridSize, gridSize);
      }

      angleY += 0.003;
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
      className="absolute inset-0 w-full h-full z-0 opacity-60"
      aria-hidden="true"
    />
  );
}

