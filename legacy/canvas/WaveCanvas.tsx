"use client";

import { useEffect, useRef } from "react";

export function WaveCanvas() {
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

    let time = 0;
    const gridSize = 4;

    const draw = () => {
      // Clear
      ctx.fillStyle = "rgba(7, 6, 4, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const cols = Math.ceil(canvas.width / 30);
      const rows = Math.ceil(canvas.height / 30);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = (i / cols) * canvas.width;
          const y = (j / rows) * canvas.height;

          // Distance from center
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Wave equation
          const wave = Math.sin(dist * 0.02 - time * 2) * 0.5 + 0.5;

          // Secondary wave
          const wave2 = Math.sin(x * 0.01 + time) * Math.cos(y * 0.01 + time * 0.5) * 0.5 + 0.5;

          const alpha = wave * wave2 * 0.4;

          // Pixelated position
          const px = Math.floor(x / gridSize) * gridSize;
          const py = Math.floor(y / gridSize) * gridSize;

          // Teal color (Dynamics)
          ctx.fillStyle = `rgba(91, 138, 122, ${alpha})`;
          ctx.fillRect(px, py, gridSize - 1, gridSize - 1);
        }
      }

      time += 0.01;
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
