"use client";

import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface GlowParticle {
  x: number;
  y: number;
  size: number;
  color?: string;
  alpha?: number;
}

export interface GlowLayerProps {
  particles: GlowParticle[];
  width: number;
  height: number;
  glowIntensity?: number;
  bloomRadius?: number;
  softness?: number;
  blendMode?: GlobalCompositeOperation;
  backgroundColor?: string;
  className?: string;
}

/**
 * GlowLayer - Canvas rendering layer with bloom and glow effects.
 * Renders particles with soft edges, bloom halos, and additive blending.
 */
export function GlowLayer({
  particles,
  width,
  height,
  glowIntensity = 0.6,
  bloomRadius = 0.4,
  softness = 0.7,
  blendMode = "lighter",
  backgroundColor = "transparent",
  className,
}: GlowLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear with background
    if (backgroundColor === "transparent") {
      ctx.clearRect(0, 0, width, height);
    } else {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    // Set blend mode for glow accumulation
    ctx.globalCompositeOperation = blendMode;

    particles.forEach((particle) => {
      const { x, y, size, color = "#d4af37", alpha = 1 } = particle;

      // Calculate glow size based on settings
      const glowSize = size * (1 + bloomRadius * 3);
      const shadowBlurAmount = glowSize * glowIntensity * 2;

      // Soft particle with radial gradient
      if (softness > 0) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);

        // Parse color for gradient stops
        const coreAlpha = alpha * (1 - softness * 0.3);
        const edgeAlpha = alpha * softness * 0.5;

        gradient.addColorStop(0, `${color}`);
        gradient.addColorStop(0.3, adjustAlpha(color, coreAlpha));
        gradient.addColorStop(0.7, adjustAlpha(color, edgeAlpha));
        gradient.addColorStop(1, adjustAlpha(color, 0));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bloom halo effect
      if (glowIntensity > 0) {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = shadowBlurAmount;
        ctx.fillStyle = adjustAlpha(color, alpha * 0.8);
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Core particle
      ctx.fillStyle = adjustAlpha(color, alpha);
      ctx.beginPath();
      ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Reset blend mode
    ctx.globalCompositeOperation = "source-over";
  }, [particles, width, height, glowIntensity, bloomRadius, softness, blendMode, backgroundColor]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={cn("pointer-events-none", className)}
    />
  );
}

// Helper to adjust alpha of a color
function adjustAlpha(color: string, alpha: number): string {
  // Handle hex colors
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
  }

  // Handle rgb/rgba
  if (color.startsWith("rgb")) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${Math.max(0, Math.min(1, alpha))})`;
    }
  }

  return color;
}
