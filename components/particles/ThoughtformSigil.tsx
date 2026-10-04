"use client";

import { useRef, useEffect } from "react";

import { BRANDMARK_PATHS } from "@/lib/brandmark/brandmarkPaths";

// Exported type for particle position data
export interface ParticlePosition {
  x: number;
  y: number;
  screenX: number;
  screenY: number;
  alpha: number;
  size: number;
}

interface ThoughtformSigilProps {
  size?: number;
  color?: string;
  particleCount?: number;
  className?: string;
  scrollProgress?: number; // 0-1, controls emergence from manifold
  // New config-driven props
  particleSize?: number; // Multiplier for particle size (default 1.0)
  opacity?: number; // Multiplier for opacity (default 1.0)
  wanderStrength?: number; // Multiplier for particle drift (default 1.0)
  pulseSpeed?: number; // Multiplier for breathing animation (default 1.0)
  returnStrength?: number; // Multiplier for snap-back force (default 1.0)
  // Callback to expose particle positions for external use (e.g., connector lines)
  onParticlePositions?: React.RefObject<ParticlePosition[]>;
}

const GRID = 3; // Base unit from Signal System

// Thoughtform Brandmark SVG paths: the one record, `lib/brandmark/brandmarkPaths.ts`.

// Original viewBox dimensions
const VIEWBOX_WIDTH = 430.99;
const VIEWBOX_HEIGHT = 436;

interface Particle {
  x: number;
  y: number;
  z: number; // Simulated depth (0 = front, 1 = far back in manifold)
  baseX: number; // Target position in brandmark
  baseY: number;
  originX: number; // Starting position (manifold)
  originY: number;
  originZ: number; // Starting depth (deep in manifold)
  vx: number;
  vy: number;
  vz: number; // Velocity on z-axis
  alpha: number;
  baseAlpha: number;
  phase: number;
  size: number;
  baseSize: number;
  noiseOffsetX: number;
  noiseOffsetY: number;
  wanderStrength: number;
  returnStrength: number;
  pulseSpeed: number;
  emergenceDelay: number; // Staggered emergence timing
}

// Simple noise function for organic movement
function noise2D(x: number, y: number, time: number): number {
  const sin1 = Math.sin(x * 0.05 + time * 0.001);
  const sin2 = Math.sin(y * 0.07 - time * 0.0012);
  const sin3 = Math.sin((x + y) * 0.03 + time * 0.0008);
  const sin4 = Math.sin(Math.sqrt(x * x + y * y) * 0.02 + time * 0.0015);
  return (sin1 + sin2 + sin3 + sin4) / 4;
}

function samplePointsFromPaths(
  paths: readonly string[],
  targetCount: number,
  canvasSize: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];

  // Create offscreen canvas for path testing
  const offscreen = document.createElement("canvas");
  const scale = canvasSize / Math.max(VIEWBOX_WIDTH, VIEWBOX_HEIGHT);
  offscreen.width = canvasSize;
  offscreen.height = canvasSize;
  const ctx = offscreen.getContext("2d");
  if (!ctx) return points;

  // Create Path2D objects for all paths
  const path2Ds = paths.map((d) => {
    const path = new Path2D();
    // Scale the path to fit canvas
    const scaledD = d; // Path data stays the same, we'll scale during testing
    path.addPath(new Path2D(scaledD), {
      a: scale,
      b: 0,
      c: 0,
      d: scale,
      e: 0,
      f: 0,
    });
    return path;
  });

  // Sample points using rejection sampling
  const maxAttempts = targetCount * 50;
  let attempts = 0;

  while (points.length < targetCount && attempts < maxAttempts) {
    const x = Math.random() * canvasSize;
    const y = Math.random() * canvasSize;

    // Check if point is inside any path
    for (const path of path2Ds) {
      if (ctx.isPointInPath(path, x, y) || ctx.isPointInStroke(path, x, y)) {
        points.push({ x, y });
        break;
      }
    }
    attempts++;
  }

  // If we didn't get enough points, add some along the paths by sampling the stroke
  if (points.length < targetCount * 0.5) {
    // Fallback: sample along path boundaries
    ctx.lineWidth = 8 * scale;
    for (const path of path2Ds) {
      for (let i = 0; i < targetCount / paths.length; i++) {
        const x = Math.random() * canvasSize;
        const y = Math.random() * canvasSize;
        if (ctx.isPointInStroke(path, x, y)) {
          points.push({ x, y });
        }
      }
    }
  }

  return points;
}

// Easing function for smooth emergence
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function ThoughtformSigil({
  size = 160,
  color = "202, 165, 84", // Tensor Gold RGB
  particleCount = 300,
  className = "",
  scrollProgress = 1, // Default fully formed
  particleSize = 1.0,
  opacity = 1.0,
  wanderStrength = 1.0,
  pulseSpeed = 1.0,
  returnStrength = 1.0,
  onParticlePositions,
}: ThoughtformSigilProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const initializedRef = useRef(false);

  // Initialize particles once
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const sampledPoints = samplePointsFromPaths(BRANDMARK_PATHS, particleCount, size);
    const center = size / 2;

    particlesRef.current = sampledPoints.map((point) => {
      const baseX = point.x - center;
      const baseY = point.y - center;
      const baseAlpha = 0.3 + Math.random() * 0.6;
      const baseSize = GRID - 1 + Math.random();

      // Origin: particles emerge from depth (z-axis) within the manifold
      // They start scattered but closer to their final X/Y position
      // The key effect is they come from "behind" (high z = far away)
      const spreadFactor = 0.3 + Math.random() * 0.4; // How spread out they start
      const originX = baseX * spreadFactor + (Math.random() - 0.5) * size * 0.3;
      const originY = baseY * spreadFactor + (Math.random() - 0.5) * size * 0.3 + size * 0.15; // Slight downward bias
      const originZ = 0.6 + Math.random() * 0.4; // Start deep in manifold (0.6-1.0)

      return {
        x: originX,
        y: originY,
        z: originZ,
        baseX,
        baseY,
        originX,
        originY,
        originZ,
        vx: 0,
        vy: 0,
        vz: 0,
        alpha: 0,
        baseAlpha,
        phase: Math.random() * Math.PI * 2,
        size: baseSize * 0.2, // Start very small (far away)
        baseSize,
        noiseOffsetX: Math.random() * 1000,
        noiseOffsetY: Math.random() * 1000,
        wanderStrength: 0.3 + Math.random() * 0.7,
        returnStrength: 0.01 + Math.random() * 0.02,
        pulseSpeed: 0.002 + Math.random() * 0.003,
        emergenceDelay: Math.random() * 0.3, // Stagger emergence
      };
    });
  }, [particleCount, size]);

  // Store props in refs for animation loop
  const scrollRef = useRef(scrollProgress);
  const configRef = useRef({ particleSize, opacity, wanderStrength, pulseSpeed, returnStrength });

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    configRef.current = { particleSize, opacity, wanderStrength, pulseSpeed, returnStrength };
  }, [particleSize, opacity, wanderStrength, pulseSpeed, returnStrength]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const center = size / 2;
    let time = 0;

    function render() {
      if (!ctx) return;

      ctx.clearRect(0, 0, size, size);

      // Emergence timing: particles form quickly as scroll begins
      const emergenceStart = 0.02;
      const emergenceEnd = 0.08;
      const currentScroll = scrollRef.current;
      const emergenceProgress = Math.max(
        0,
        Math.min(1, (currentScroll - emergenceStart) / (emergenceEnd - emergenceStart))
      );

      // Global pulse wave (only active when formed)
      const globalPulse = Math.sin(time * 0.001) * 0.5 + 0.5;
      const waveX = Math.cos(time * 0.0005) * 30 * emergenceProgress;
      const waveY = Math.sin(time * 0.0007) * 30 * emergenceProgress;

      particlesRef.current.forEach((particle) => {
        // Calculate this particle's emergence (staggered)
        const particleEmergence = Math.max(
          0,
          Math.min(1, (emergenceProgress - particle.emergenceDelay) / (1 - particle.emergenceDelay))
        );
        const easedEmergence = easeOutCubic(particleEmergence);

        // Z-axis: move from deep (originZ) to front (0)
        const targetZ = particle.originZ * (1 - easedEmergence);
        const dz = targetZ - particle.z;
        particle.vz += dz * 0.1;
        particle.vz *= 0.9;
        particle.z += particle.vz;
        particle.z = Math.max(0, particle.z); // Clamp to front

        // Get current config values
        const cfg = configRef.current;

        // Depth-based scaling: far = small, close = full size
        const depthScale = 1 - particle.z * 0.8; // At z=1 (far), scale is 0.2; at z=0, scale is 1
        particle.size = particle.baseSize * depthScale * cfg.particleSize;

        // Target position interpolated between origin and base
        // Also apply perspective: particles converge toward center when far away
        const perspectiveFactor = 1 - particle.z * 0.5;
        const targetX =
          particle.originX +
          (particle.baseX - particle.originX) * easedEmergence * perspectiveFactor;
        const targetY =
          particle.originY +
          (particle.baseY - particle.originY) * easedEmergence * perspectiveFactor;

        // Noise-based wandering force (increases as particle forms and comes forward)
        const noiseX = noise2D(particle.x + particle.noiseOffsetX, particle.y, time);
        const noiseY = noise2D(particle.x, particle.y + particle.noiseOffsetY, time);

        // Apply wandering force (scaled by emergence and depth)
        const wanderScale = easedEmergence * depthScale;
        particle.vx += noiseX * particle.wanderStrength * 0.1 * wanderScale * cfg.wanderStrength;
        particle.vy += noiseY * particle.wanderStrength * 0.1 * wanderScale * cfg.wanderStrength;

        // Return force toward target position
        const dx = targetX - particle.x;
        const dy = targetY - particle.y;

        // Stronger pull during emergence, lighter once formed
        const pullStrength =
          emergenceProgress < 1 ? 0.1 : particle.returnStrength * cfg.returnStrength;
        particle.vx += dx * pullStrength;
        particle.vy += dy * pullStrength;

        // Slight attraction toward global wave center (only when formed and close)
        if (easedEmergence > 0.5 && particle.z < 0.3) {
          const waveDx = waveX - particle.x;
          const waveDy = waveY - particle.y;
          const waveDist = Math.sqrt(waveDx * waveDx + waveDy * waveDy) + 1;
          particle.vx += (waveDx / waveDist) * 0.01 * globalPulse * easedEmergence;
          particle.vy += (waveDy / waveDist) * 0.01 * globalPulse * easedEmergence;
        }

        // Damping
        particle.vx *= 0.9;
        particle.vy *= 0.9;

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Alpha based on emergence, depth, and breathing
        const distFromTarget = Math.sqrt(dx * dx + dy * dy);
        const breathe =
          Math.sin(time * particle.pulseSpeed * cfg.pulseSpeed + particle.phase) * 0.3 + 1;
        const distanceFade = Math.max(0.3, 1 - distFromTarget * 0.015);

        // Depth-based alpha: particles fade when far away
        const depthAlpha = Math.pow(depthScale, 0.5); // Fade more gently

        // Fade in as particle emerges
        const emergenceAlpha = easedEmergence;
        const alpha =
          particle.baseAlpha * breathe * distanceFade * emergenceAlpha * depthAlpha * cfg.opacity;

        // Store alpha on particle for external access
        particle.alpha = alpha;

        // Skip if not visible
        if (alpha < 0.01 || particle.size < 0.5) return;

        // Occasional glitch displacement
        let glitchX = 0,
          glitchY = 0;
        if (Math.random() < 0.001 && easedEmergence > 0.8) {
          glitchX = (Math.random() - 0.5) * GRID * 4;
          glitchY = (Math.random() - 0.5) * GRID * 2;
        }

        // Grid snap
        const px = Math.floor((particle.x + glitchX + center) / GRID) * GRID;
        const py = Math.floor((particle.y + glitchY + center) / GRID) * GRID;

        ctx.fillStyle = `rgba(${color}, ${alpha})`;
        ctx.fillRect(px, py, particle.size, particle.size);
      });

      // Update particle positions for external use (connector lines)
      if (onParticlePositions) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const positions: ParticlePosition[] = particlesRef.current
            .filter((p) => p.size > 0.5) // Include particles that have emerged
            .map((p) => ({
              x: p.x,
              y: p.y,
              screenX: rect.left + rect.width / 2 + p.x,
              screenY: rect.top + rect.height / 2 + p.y,
              alpha: p.alpha,
              size: p.size,
            }));
          onParticlePositions.current = positions;
        }
      }

      time++;
      animationRef.current = requestAnimationFrame(render);
    }

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onParticlePositions is a stable ref
  }, [size, color]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: size,
        height: size,
      }}
    />
  );
}
