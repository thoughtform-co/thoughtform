"use client";

import { useRef, useEffect, useCallback } from "react";

export interface PanelGlowProps {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Glow color (hex) */
  color?: string;
  /** Base glow intensity (0-1) */
  intensity?: number;
  /** Bloom strength */
  bloomIntensity?: number;
  /** Bloom radius/spread */
  bloomRadius?: number;
  /** Show edge lines */
  showEdges?: boolean;
  /** Pulse animation speed */
  pulseSpeed?: number;
  /** Pulse animation amount */
  pulseAmount?: number;
  /** Additional CSS class */
  className?: string;
}

// Parse hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 202, g: 165, b: 84 }; // Default gold
}

/**
 * PanelGlow - Canvas-based bloom effect for UI panels
 * Creates a soft HDR-like glow behind panel elements using 2D canvas with blur
 */
export function PanelGlow({
  width,
  height,
  color = "#caa554",
  intensity = 0.15,
  bloomIntensity = 1.5,
  bloomRadius = 0.8,
  showEdges = true,
  pulseSpeed = 0.5,
  pulseAmount = 0.05,
  className = "",
}: PanelGlowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rgb = hexToRgb(color);
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const pulse = Math.sin(elapsed * pulseSpeed) * pulseAmount;
    const currentIntensity = intensity + pulse;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate padding for glow spread
    const padding = 40;
    const glowX = padding;
    const glowY = padding;
    const glowW = width;
    const glowH = height;

    // Draw multiple layers for bloom effect
    ctx.globalCompositeOperation = "lighter";

    // Outer glow (largest, most diffuse)
    const outerBlur = bloomRadius * 60;
    ctx.filter = `blur(${outerBlur}px)`;
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentIntensity * bloomIntensity * 0.3})`;
    ctx.fillRect(glowX - 10, glowY - 10, glowW + 20, glowH + 20);

    // Middle glow
    const midBlur = bloomRadius * 30;
    ctx.filter = `blur(${midBlur}px)`;
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentIntensity * bloomIntensity * 0.5})`;
    ctx.fillRect(glowX, glowY, glowW, glowH);

    // Inner glow (sharpest)
    const innerBlur = bloomRadius * 15;
    ctx.filter = `blur(${innerBlur}px)`;
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentIntensity * bloomIntensity * 0.7})`;
    ctx.fillRect(glowX + 5, glowY + 5, glowW - 10, glowH - 10);

    // Edge highlights
    if (showEdges) {
      ctx.filter = `blur(${bloomRadius * 8}px)`;
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentIntensity * 2})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(glowX, glowY, glowW, glowH);
    }

    // Reset
    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-over";

    // Continue animation
    animationRef.current = requestAnimationFrame(render);
  }, [
    color,
    intensity,
    bloomIntensity,
    bloomRadius,
    showEdges,
    pulseSpeed,
    pulseAmount,
    width,
    height,
  ]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    render();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render]);

  // Canvas needs extra size for blur spread
  const canvasWidth = width + 80;
  const canvasHeight = height + 80;

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className={`panel-glow ${className}`}
      style={{
        position: "absolute",
        top: -40,
        left: -40,
        width: canvasWidth,
        height: canvasHeight,
        pointerEvents: "none",
        zIndex: -1,
      }}
    />
  );
}

export default PanelGlow;
