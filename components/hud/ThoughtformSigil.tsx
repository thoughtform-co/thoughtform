"use client";

import { useRef, useEffect, useMemo } from "react";

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
  onParticlePositions?: React.MutableRefObject<ParticlePosition[]>;
}

const GRID = 3; // Base unit from Signal System

// Thoughtform Brandmark SVG paths
const BRANDMARK_PATHS = [
  // Outer arc top-right
  "M336.78,99.43c18.82,18.93,33.41,41.16,43.78,66.63,5.03,12.35,8.81,24.86,11.42,37.57h19.62c-1.91-18.99-6.54-37.52-13.79-55.54-10.01-24.71-24.56-46.73-43.78-66.02-19.17-19.29-41.16-33.97-65.92-43.99-7.9-3.24-15.9-5.92-23.95-8.1l-1.36,7.49-.9,4.91-1.41,7.49c2.87,1.11,5.79,2.28,8.65,3.54,25.51,10.99,48.06,26.33,67.63,46.02h.01Z",
  // Main circular ring
  "M383.13,314.65c-8.61,22.23-21.59,41.97-38.85,59.38-16.91,16.61-35.23,29.06-55,37.36-19.78,8.3-40.21,12.45-61.29,12.45-11.68,0-23.35-1.22-34.92-3.7-2.47-.46-4.93-1.01-7.4-1.67-2.42-.61-4.88-1.27-7.3-2.02-7.4-2.18-14.74-4.91-22.14-8.1-1.21-.51-2.47-1.06-3.67-1.62-1.16-.51-2.31-1.06-3.42-1.62-2.37-1.11-4.73-2.28-7.05-3.49-20.78-10.83-39.75-24.86-56.91-42.07-19.98-19.69-35.63-42.88-46.9-69.56-5.38-12.61-9.46-25.36-12.28-38.22-.6-2.53-1.11-5.06-1.56-7.59s-.85-5.06-1.21-7.59c-.81-5.87-1.41-11.85-1.71-17.77-.1-2.53-.2-5.06-.2-7.59-.05-.96-.05-1.92-.05-2.89,0-1.57,0-3.14.1-4.71.45-21.06,4.48-41.21,11.98-60.45,8.1-20.66,20.53-39.49,37.44-56.45,16.86-17.01,35.48-29.57,55.86-37.67,20.33-8.1,41.62-12.2,63.91-12.2,5.99,0,11.93.25,17.86.81l2.72-14.68c-26.82,0-53.19,5.32-79,15.95-25.92,10.63-49.06,26.12-69.39,46.63-20.73,20.81-36.38,43.99-46.95,69.51-6.59,15.85-11.12,32.05-13.59,48.55-.35,2.53-.7,5.06-.96,7.59-.3,2.53-.5,5.06-.7,7.59-.35,5.01-.55,10.02-.55,15.04,0,.91,0,1.82.05,2.73,0,2.53.1,5.06.25,7.59.1,2.53.25,5.06.5,7.59,1.76,19.9,6.49,39.24,14.14,57.97,9.96,24.3,24.56,46.12,43.78,65.41,19.93,19.74,42.57,34.78,67.93,45.21,3.72,1.52,7.5,2.99,11.27,4.25,2.42.86,4.83,1.67,7.25,2.38,2.42.76,4.88,1.47,7.3,2.13,7.5,2.03,15.1,3.59,22.74,4.71,2.52.35,5.03.71,7.55.96,2.52.3,5.03.51,7.55.66,4.88.41,9.76.56,14.64.56,26.87,0,52.84-5.11,78-15.34,25.16-10.23,47.71-25.41,67.68-45.51,20.33-20.81,35.78-44.2,46.35-70.07,7.1-17.42,11.78-35.18,14.09-53.31h-15.1c-.71,21.82-4.98,42.78-12.83,62.88h-.01Z",
  // Horizontal line left
  "M29.12,218.81l132.09-.05v.05H29.12h0Z",
  // Small connector
  "M163.32,250.35l12.58.05h-12.58v-.05Z",
  // Diagonal vector bottom
  "M179.17,408.81l30.34-158.46-29.79,158.61s-.35-.1-.55-.15h0Z",
  // Main diagonal vector with horizontal bars
  "M430.98,218.81l-5.23,17.77h-184.93l-10.32.05-2.47,13.72h-18.52l-30.34,158.46c-7.2-2.23-14.44-4.96-21.59-8.1l24.05-132.9h-8.86l3.12-17.42h-20.73l2.57-13.77H30.87c-.86-5.87-1.46-11.8-1.76-17.77h132.09l10.32-.05,2.47-13.72h18.52l29.54-157.85,1.36-7.49,1.41-7.44.2-1.21,1.41-7.49,1.36-7.44L230.76.06h23.6l-3.52,19.14-1.36,7.44-1.41,7.49-.65,3.44-1.36,7.49-1.41,7.54-23.9,129.71h.6l13.49.1-4.78,21.52h17.01l-.2,1.16-2.57,13.77h186.69v-.05h-.01Z",
  // Diagonal vector top
  "M254.35,0l-33.01,182.26h-.6L254.35,0h0Z",
];

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
  paths: string[],
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize particles once
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const sampledPoints = samplePointsFromPaths(BRANDMARK_PATHS, particleCount, size);
    const center = size / 2;

    particlesRef.current = sampledPoints.map((point, i) => {
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
