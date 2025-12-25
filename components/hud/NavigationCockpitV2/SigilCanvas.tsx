"use client";

import { useRef, useEffect, useMemo, useCallback } from "react";
import { generateSigilPoints, type SigilShape, type Point } from "@/lib/sigil-geometries";

// ═══════════════════════════════════════════════════════════════════
// SIGIL CANVAS
// Particle-based sigil renderer with animation
// Uses the same aesthetic as ThoughtformSigil (grid-snapped squares)
// ═══════════════════════════════════════════════════════════════════

const GRID = 3; // Base unit from Signal System

export interface SigilConfig {
  shape: SigilShape;
  particleCount: number;
  color: string; // RGB format: "202, 165, 84"
  animationParams: {
    drift?: number; // Wander strength (0-2, default 1)
    pulse?: number; // Breathing speed (0-2, default 1)
    glitch?: number; // Glitch frequency (0-1, default 0.1)
  };
}

export const DEFAULT_SIGIL_CONFIG: SigilConfig = {
  shape: "torus",
  particleCount: 200,
  color: "202, 165, 84", // Tensor Gold
  animationParams: {
    drift: 1,
    pulse: 1,
    glitch: 0.1,
  },
};

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  baseAlpha: number;
  alpha: number;
  size: number;
  baseSize: number;
  phase: number;
  noiseOffsetX: number;
  noiseOffsetY: number;
  vx: number;
  vy: number;
}

interface SigilCanvasProps {
  config: SigilConfig;
  size?: number;
  seed?: number;
  className?: string;
  /** If true, particles can render beyond the canvas bounds (overflow visible) */
  allowSpill?: boolean;
}

// Noise function for organic movement
function noise2D(x: number, y: number, time: number): number {
  const sin1 = Math.sin(x * 0.05 + time * 0.001);
  const sin2 = Math.sin(y * 0.07 - time * 0.0012);
  const sin3 = Math.sin((x + y) * 0.03 + time * 0.0008);
  return (sin1 + sin2 + sin3) / 3;
}

export function SigilCanvas({
  config,
  size = 160,
  seed = 42,
  className = "",
  allowSpill = true,
}: SigilCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);
  const configRef = useRef(config);

  // Update config ref when config changes
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Generate initial points based on shape
  const basePoints = useMemo(() => {
    return generateSigilPoints(config.shape, {
      size,
      particleCount: config.particleCount,
      seed,
    });
  }, [config.shape, config.particleCount, size, seed]);

  // Initialize particles from base points
  const initializeParticles = useCallback(() => {
    const center = size / 2;
    particlesRef.current = basePoints.map((point, i) => {
      const baseAlpha = point.alpha ?? 0.4 + Math.random() * 0.5;
      return {
        x: point.x,
        y: point.y,
        baseX: point.x - center,
        baseY: point.y - center,
        baseAlpha,
        alpha: baseAlpha,
        size: GRID - 1 + Math.random() * 0.5,
        baseSize: GRID - 1 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        noiseOffsetX: Math.random() * 1000,
        noiseOffsetY: Math.random() * 1000,
        vx: 0,
        vy: 0,
      };
    });
  }, [basePoints, size]);

  // Re-initialize particles when base points change
  useEffect(() => {
    initializeParticles();
  }, [initializeParticles]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const canvasSize = allowSpill ? size * 1.4 : size; // Extra space for spill
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    ctx.scale(dpr, dpr);

    const center = canvasSize / 2;
    const offset = allowSpill ? (canvasSize - size) / 2 : 0;

    function render() {
      if (!ctx) return;
      const time = timeRef.current;
      const cfg = configRef.current;
      const drift = cfg.animationParams.drift ?? 1;
      const pulse = cfg.animationParams.pulse ?? 1;
      const glitch = cfg.animationParams.glitch ?? 0.1;

      ctx.clearRect(0, 0, canvasSize, canvasSize);

      particlesRef.current.forEach((particle) => {
        // Noise-based wandering
        const noiseX = noise2D(particle.noiseOffsetX, time * 0.1, time);
        const noiseY = noise2D(particle.noiseOffsetY, time * 0.1 + 100, time);

        // Apply drift force
        particle.vx += noiseX * 0.15 * drift;
        particle.vy += noiseY * 0.15 * drift;

        // Return force to base position
        const dx = particle.baseX + center - particle.x;
        const dy = particle.baseY + center - particle.y;
        particle.vx += dx * 0.02;
        particle.vy += dy * 0.02;

        // Damping
        particle.vx *= 0.92;
        particle.vy *= 0.92;

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Breathing animation
        const breathe = Math.sin(time * 0.003 * pulse + particle.phase) * 0.2 + 1;

        // Distance-based fade
        const distFromBase = Math.sqrt(dx * dx + dy * dy);
        const distanceFade = Math.max(0.3, 1 - distFromBase * 0.01);

        particle.alpha = particle.baseAlpha * breathe * distanceFade;
        particle.size = particle.baseSize * (0.9 + breathe * 0.1);

        // Skip if not visible
        if (particle.alpha < 0.01 || particle.size < 0.5) return;

        // Occasional glitch displacement
        let glitchX = 0;
        let glitchY = 0;
        if (Math.random() < glitch * 0.01) {
          glitchX = (Math.random() - 0.5) * GRID * 4;
          glitchY = (Math.random() - 0.5) * GRID * 2;
        }

        // Grid snap (Thoughtform sacred rule)
        const px = Math.floor((particle.x + glitchX + offset) / GRID) * GRID;
        const py = Math.floor((particle.y + glitchY + offset) / GRID) * GRID;

        ctx.fillStyle = `rgba(${cfg.color}, ${particle.alpha})`;
        ctx.fillRect(px, py, particle.size, particle.size);
      });

      timeRef.current++;
      animationRef.current = requestAnimationFrame(render);
    }

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [size, allowSpill]);

  const canvasStyle: React.CSSProperties = {
    width: allowSpill ? size * 1.4 : size,
    height: allowSpill ? size * 1.4 : size,
    margin: allowSpill ? -(size * 0.2) : 0, // Negative margin to center
  };

  return <canvas ref={canvasRef} className={className} style={canvasStyle} />;
}

export default SigilCanvas;
