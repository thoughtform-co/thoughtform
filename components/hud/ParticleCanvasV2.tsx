"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  type ParticleSystemConfig,
  type LandmarkConfig,
  hexToRgb,
  DEFAULT_CONFIG,
} from "@/lib/particle-config";

// ═══════════════════════════════════════════════════════════════
// THOUGHTFORM PARTICLE SYSTEM V2
// Dynamic config-driven version for admin control
// ═══════════════════════════════════════════════════════════════

const GRID = 3;
const ALERT_RGB = "255, 107, 53";

// Grid snapping function
function snap(value: number): number {
  return Math.floor(value / GRID) * GRID;
}

// Core pixel drawing function
function drawPixel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  alpha: number,
  size: number = GRID
) {
  const px = snap(x);
  const py = snap(y);
  if (color.includes(",")) {
    ctx.fillStyle = `rgba(${color}, ${alpha})`;
  } else {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
  }
  ctx.fillRect(px, py, size - 1, size - 1);
}

interface Particle {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  type: "star" | "geo" | "terrain" | "gateway";
  color: string;
  size: number;
  phase: number;
  landmark?: number;
  landmarkId?: string;
}

function createPoint(
  x: number,
  y: number,
  z: number,
  type: "star" | "geo" | "terrain" | "gateway",
  color: string,
  landmark?: number,
  landmarkId?: string
): Particle {
  return {
    x,
    y,
    z,
    baseX: x,
    baseY: y,
    type,
    color,
    size: 1 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
    landmark,
    landmarkId,
  };
}

/**
 * Calculate terrain Y position at given X, Z coordinates
 */
function getTerrainY(
  x: number,
  z: number,
  config: ParticleSystemConfig["manifold"]
): number {
  const clampedZ = Math.max(800, Math.min(8800, z));
  const r = (clampedZ - 800) / 50;
  const c = x / 65 + 35;

  const wavePhase = r * 0.02;
  const y =
    400 +
    Math.sin(c * config.waveFrequency + wavePhase) * config.waveAmplitude +
    Math.cos(r * 0.12) * 150 +
    Math.sin(c * 0.35 + r * 0.15) * 70 +
    Math.sin(r * 0.08) * 100;

  return y;
}

// ═══════════════════════════════════════════════════════════════
// SHAPE GENERATORS
// ═══════════════════════════════════════════════════════════════

function generateGatewayShape(
  particles: Particle[],
  landmark: LandmarkConfig,
  index: number,
  manifoldConfig: ParticleSystemConfig["manifold"]
): void {
  const colorRgb = hexToRgb(landmark.color);
  const scale = landmark.scale;
  const density = landmark.density;
  const baseX = landmark.position.x;
  const baseZ = landmark.position.z;
  const radius = 400 * scale;

  // Concentric rings
  const ringCount = Math.floor(8 * density);
  for (let ring = 0; ring < ringCount; ring++) {
    const ringRadius = radius - ring * (20 * scale);
    const points = Math.max(20, Math.floor((80 - ring * 5) * density));
    const z = baseZ + ring * 15;

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const x = baseX + Math.cos(angle) * ringRadius;
      const y = landmark.position.y + Math.sin(angle) * ringRadius;
      particles.push(createPoint(x, y, z, "gateway", colorRgb, index, landmark.id));
    }
  }

  // Inner spiral
  const spiralPoints = Math.floor(150 * density);
  for (let i = 0; i < spiralPoints; i++) {
    const t = i / spiralPoints;
    const angle = t * Math.PI * 2 * 5;
    const spiralRadius = (1 - t) * radius * 0.9;
    const z = baseZ + 100 + t * 600;
    const x = baseX + Math.cos(angle) * spiralRadius;
    const y = landmark.position.y + Math.sin(angle) * spiralRadius * 0.8;
    particles.push(createPoint(x, y, z, "gateway", colorRgb, index, landmark.id));
  }

  // Core glow
  const corePoints = Math.floor(60 * density);
  for (let i = 0; i < corePoints; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 80 * scale;
    const x = baseX + Math.cos(angle) * dist;
    const y = landmark.position.y + Math.sin(angle) * dist;
    const z = baseZ + 50 + Math.random() * 100;
    particles.push(createPoint(x, y, z, "gateway", colorRgb, index, landmark.id));
  }
}

function generateTowerShape(
  particles: Particle[],
  landmark: LandmarkConfig,
  index: number,
  manifoldConfig: ParticleSystemConfig["manifold"]
): void {
  const colorRgb = hexToRgb(landmark.color);
  const scale = landmark.scale;
  const density = landmark.density;
  const centerX = landmark.position.x;
  const centerZ = landmark.position.z;
  const terrainY = getTerrainY(centerX, centerZ, manifoldConfig);

  const levels = Math.floor(12 * density);
  for (let level = 0; level < levels; level++) {
    const height = level * 40 * scale;
    const baseY = terrainY - height;
    const levelSize = (220 - level * 15) * scale;
    const pointsPerSide = Math.max(3, 10 - Math.floor(level / 3));

    // Square layers
    for (let side = 0; side < 4; side++) {
      for (let i = 0; i < pointsPerSide; i++) {
        const t = i / pointsPerSide;
        let x: number, z: number;

        if (side === 0) {
          x = centerX + (t - 0.5) * levelSize;
          z = centerZ - levelSize * 0.3;
        } else if (side === 1) {
          x = centerX + (t - 0.5) * levelSize;
          z = centerZ + levelSize * 0.3;
        } else if (side === 2) {
          z = centerZ + (t - 0.5) * levelSize * 0.6;
          x = centerX - levelSize * 0.5;
        } else {
          z = centerZ + (t - 0.5) * levelSize * 0.6;
          x = centerX + levelSize * 0.5;
        }

        particles.push(createPoint(x, baseY, z, "geo", colorRgb, index, landmark.id));
      }
    }

    // Vertical connectors
    if (level > 0 && level < 10) {
      for (let corner = 0; corner < 4; corner++) {
        const angle = (corner / 4) * Math.PI * 2 + Math.PI / 4;
        const cornerX = centerX + Math.cos(angle) * levelSize * 0.4;
        const cornerZ = centerZ + Math.sin(angle) * levelSize * 0.25;
        particles.push(createPoint(cornerX, baseY + 20, cornerZ, "geo", colorRgb, index, landmark.id));
      }
    }
  }

  // Tower apex
  const apexPoints = Math.floor(20 * density);
  for (let i = 0; i < apexPoints; i++) {
    const angle = (i / apexPoints) * Math.PI * 2;
    const radius = (30 - i * 0.5) * scale;
    const x = centerX + Math.cos(angle) * radius;
    const z = centerZ + Math.sin(angle) * radius * 0.5;
    const y = terrainY - levels * 40 * scale - 30;
    particles.push(createPoint(x, y, z, "geo", colorRgb, index, landmark.id));
  }
}

function generateHelixShape(
  particles: Particle[],
  landmark: LandmarkConfig,
  index: number,
  manifoldConfig: ParticleSystemConfig["manifold"]
): void {
  const colorRgb = hexToRgb(landmark.color);
  const scale = landmark.scale;
  const density = landmark.density;
  const startZ = landmark.position.z;

  const points = Math.floor(500 * density);
  for (let i = 0; i < points; i++) {
    const z = startZ + i * 5;
    const rad = (280 + Math.sin(i * 0.1) * 60) * scale;
    const angle = i * 0.15;
    const x = Math.cos(angle) * rad;
    const terrainY = getTerrainY(x, z, manifoldConfig);
    const baseHeight = terrainY - 80;
    const y = baseHeight + Math.sin(angle) * rad * 0.5;
    particles.push(createPoint(x, y, z, "geo", colorRgb, index, landmark.id));

    // Second strand
    if (i % 2 === 0) {
      const x2 = Math.cos(angle + Math.PI) * rad * 0.7;
      const y2 = baseHeight + Math.sin(angle + Math.PI) * rad * 0.35;
      particles.push(createPoint(x2, y2, z, "geo", colorRgb, index, landmark.id));
    }
  }
}

function generateSphereShape(
  particles: Particle[],
  landmark: LandmarkConfig,
  index: number,
  manifoldConfig: ParticleSystemConfig["manifold"]
): void {
  const colorRgb = hexToRgb(landmark.color);
  const scale = landmark.scale;
  const density = landmark.density;
  const centerX = landmark.position.x;
  const centerZ = landmark.position.z;
  const terrainY = getTerrainY(centerX, centerZ, manifoldConfig);
  const r = 400 * scale;

  // Sphere surface
  const surfacePoints = Math.floor(600 * density);
  for (let i = 0; i < surfacePoints; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = centerX + r * Math.sin(phi) * Math.cos(theta);
    const z = centerZ + r * Math.cos(phi) * 0.25;
    const sphereY = terrainY - 150 + r * Math.sin(phi) * Math.sin(theta);
    particles.push(createPoint(x, sphereY, z, "geo", colorRgb, index, landmark.id));
  }

  // Core rings
  const ringCount = Math.floor(6 * density);
  for (let ring = 0; ring < ringCount; ring++) {
    const radius = (50 + ring * 40) * scale;
    const z = centerZ;
    const ringPoints = 25 + ring * 6;
    for (let i = 0; i < ringPoints; i++) {
      const angle = (i / ringPoints) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = terrainY - 150 + Math.sin(angle) * radius;
      particles.push(createPoint(x, y, z, "geo", colorRgb, index, landmark.id));
    }
  }
}

function generateRingShape(
  particles: Particle[],
  landmark: LandmarkConfig,
  index: number,
  manifoldConfig: ParticleSystemConfig["manifold"]
): void {
  const colorRgb = hexToRgb(landmark.color);
  const scale = landmark.scale;
  const density = landmark.density;
  const centerX = landmark.position.x;
  const centerZ = landmark.position.z;
  const terrainY = getTerrainY(centerX, centerZ, manifoldConfig);

  // Multiple concentric rings at different angles
  const ringCount = Math.floor(10 * density);
  for (let ring = 0; ring < ringCount; ring++) {
    const radius = (100 + ring * 35) * scale;
    const tilt = (ring % 3) * 0.2 - 0.2;
    const zOffset = ring * 15;
    const ringPoints = Math.floor((30 + ring * 4) * density);

    for (let i = 0; i < ringPoints; i++) {
      const angle = (i / ringPoints) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const yBase = terrainY - 100 + Math.sin(angle) * radius * (0.8 + tilt);
      const z = centerZ + zOffset + Math.sin(angle * 2) * 30;
      particles.push(createPoint(x, yBase, z, "geo", colorRgb, index, landmark.id));
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN INITIALIZATION
// ═══════════════════════════════════════════════════════════════

function initParticles(config: ParticleSystemConfig): Particle[] {
  const particles: Particle[] = [];
  const { manifold, landmarks } = config;

  const manifoldColorRgb = hexToRgb(manifold.color);

  // ─── TERRAIN (Manifold) ───
  for (let r = 0; r < manifold.rows; r++) {
    for (let c = 0; c < manifold.columns; c++) {
      const x = (c - manifold.columns / 2) * (70 * manifold.spreadX);
      const z = 1200 + r * (55 * manifold.spreadZ);

      const wavePhase = r * 0.02;
      const y =
        400 +
        Math.sin(c * manifold.waveFrequency + wavePhase) * manifold.waveAmplitude +
        Math.cos(r * 0.12) * 150 +
        Math.sin(c * 0.35 + r * 0.15) * 70 +
        Math.sin(r * 0.08) * 100;

      particles.push(createPoint(x, y, z, "terrain", manifoldColorRgb, 0));
    }
  }

  // ─── LANDMARKS ───
  landmarks.forEach((landmark, index) => {
    if (!landmark.enabled) return;

    const landmarkIndex = index + 1;

    switch (landmark.shape) {
      case "gateway":
        generateGatewayShape(particles, landmark, landmarkIndex, manifold);
        break;
      case "tower":
        generateTowerShape(particles, landmark, landmarkIndex, manifold);
        break;
      case "helix":
        generateHelixShape(particles, landmark, landmarkIndex, manifold);
        break;
      case "sphere":
        generateSphereShape(particles, landmark, landmarkIndex, manifold);
        break;
      case "ring":
        generateRingShape(particles, landmark, landmarkIndex, manifold);
        break;
    }
  });

  return particles;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

interface ParticleCanvasV2Props {
  scrollProgress: number;
  config?: ParticleSystemConfig;
}

export function ParticleCanvasV2({
  scrollProgress,
  config = DEFAULT_CONFIG,
}: ParticleCanvasV2Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const scrollProgressRef = useRef(0);
  const timeRef = useRef(0);
  const configRef = useRef(config);

  const FOCAL = 400;
  const MAX_DEPTH = 7000;

  // Update config ref when config changes
  useEffect(() => {
    configRef.current = config;
    // Reinitialize particles when config changes
    particlesRef.current = initParticles(config);
  }, [config]);

  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    dimensionsRef.current = { width, height };

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  useEffect(() => {
    particlesRef.current = initParticles(config);
    resize();

    const render = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      const { width, height } = dimensionsRef.current;
      if (width === 0 || height === 0) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      const currentConfig = configRef.current;
      const time = timeRef.current;
      const scrollP = scrollProgressRef.current;
      const scrollZ = scrollP * 9000;

      const currentSection = Math.floor(scrollP * 4) + 1;
      const sectionProgress = (scrollP * 4) % 1;

      // Full clear each frame - no trails, no artifacts
      ctx.fillStyle = "#050504";
      ctx.fillRect(0, 0, width, height);

      // Vanishing point - geometry focused right side
      const cx_geo = width * 0.7;
      const cy = height * 0.5;

      // Sort by depth
      const sorted = [...particlesRef.current].sort((a, b) => {
        return b.z - scrollZ - (a.z - scrollZ);
      });

      sorted.forEach((p) => {
        let relZ: number;
        let particleAlpha = 1;
        let terrainAlphaMultiplier = 1;

        if (p.type === "terrain") {
          relZ = p.z - scrollZ;
          terrainAlphaMultiplier = currentConfig.manifold.opacity;
        } else if (p.type === "gateway") {
          relZ = p.z - scrollZ;
          // Gateway fades as you scroll past hero
          if (scrollP > 0.15) {
            particleAlpha = Math.max(0, 1 - (scrollP - 0.15) * 4);
          }
        } else if (p.type === "star") {
          // Stars removed - skip
          return;
        } else {
          relZ = p.z - scrollZ;

          if (p.landmark) {
            const landmarkSection = p.landmark;
            const sectionDist = Math.abs(currentSection - landmarkSection);

            if (sectionDist === 0) {
              particleAlpha = 1;
              const emergence = Math.min(1, sectionProgress * 1.8);
              particleAlpha *= emergence;
            } else if (sectionDist === 1) {
              particleAlpha = 0.3;
            } else {
              particleAlpha = 0;
              return;
            }
          }
        }

        // Culling
        if (p.type === "terrain") {
          if (relZ <= 30 || relZ > MAX_DEPTH) return;
        } else {
          if (relZ <= 5 || relZ > MAX_DEPTH) return;
        }

        const scale = FOCAL / relZ;
        const center = cx_geo;

        // Breathing animation
        const breatheX = Math.sin(time * 0.015 + p.phase) * 5;
        const breatheY = Math.cos(time * 0.012 + p.phase * 1.3) * 4;

        const x = center + (p.x + breatheX) * scale;
        const y = cy + (p.y + breatheY) * scale;

        // Bounds check
        if (p.type === "terrain") {
          if (x < -150 || x > width + 150 || y < -150 || y > height + 150)
            return;
        } else {
          if (x < -50 || x > width + 50 || y < -50 || y > height + 50) return;
        }

        // Depth-based alpha with proximity boost
        // Nearby particles (low relZ) should be MORE visible
        const normalizedDepth = relZ / MAX_DEPTH; // 0 = close, 1 = far
        const depthAlpha = Math.min(1, (1 - normalizedDepth) * 1.5 + 0.3);
        
        // Proximity boost: particles closer to camera get brighter
        const proximityBoost = relZ < 1500 ? 1 + (1 - relZ / 1500) * 0.8 : 1;
        
        const breatheAlpha = 0.85 + Math.sin(time * 0.02 + p.phase) * 0.15;
        const finalAlpha =
          Math.min(1, depthAlpha * particleAlpha * terrainAlphaMultiplier * breatheAlpha * proximityBoost);

        ctx.globalAlpha = 1;

        if (p.type === "terrain") {
          // Terrain: only render in lower 60% of screen to avoid noise above
          if (y < height * 0.35) return;

          // Terrain: scale size based on depth, nearby = bigger
          const sizeMultiplier = Math.min(2.5, 0.6 + scale * 1.2);
          const size = Math.max(GRID, GRID * sizeMultiplier);
          drawPixel(ctx, x, y, p.color, finalAlpha, size);
        } else if (p.type === "gateway" || p.type === "geo") {
          // Gateway and landmarks: larger, more prominent
          const baseSize = p.type === "gateway" ? GRID * 2 : GRID * 1.6;
          const size = Math.max(GRID, baseSize * Math.min(3, scale * 2));
          drawPixel(ctx, x, y, p.color, finalAlpha, size);

          // Glow for close gateway particles
          if (p.type === "gateway" && scale > 0.6 && particleAlpha > 0.5) {
            const glowPulse = Math.sin(time * 0.03 + p.phase) * 0.35 + 0.65;
            if (glowPulse > 0.4) {
              drawPixel(
                ctx,
                x,
                y,
                p.color,
                finalAlpha * 0.12 * glowPulse,
                GRID * 5
              );
            }
          }
        }
      });

      // Gateway halo effect (visible in hero section)
      if (scrollP < 0.25) {
        const gatewayLandmark = currentConfig.landmarks.find(
          (l) => l.shape === "gateway" && l.enabled
        );
        if (gatewayLandmark) {
          const gatewayRelZ = gatewayLandmark.position.z - scrollZ;
          if (gatewayRelZ > 50 && gatewayRelZ < 2000) {
            const scale = FOCAL / gatewayRelZ;
            const gatewayX = cx_geo + gatewayLandmark.position.x * scale;
            const gatewayY = cy + gatewayLandmark.position.y * scale;
            const pulse = Math.sin(time * 0.02) * 0.2 + 0.8;
            const fadeOut =
              scrollP < 0.15 ? 1 : Math.max(0, 1 - (scrollP - 0.15) * 6);
            const gatewayColorRgb = hexToRgb(gatewayLandmark.color);

            for (let r = 0; r < 5; r++) {
              const radius = (200 + r * 60) * scale * gatewayLandmark.scale;
              const alpha = 0.02 * (1 - r / 5) * pulse * fadeOut;
              const points = Math.floor((radius / GRID) * 1.5);

              for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2 + time * 0.004;
                if (Math.random() > 0.5) {
                  drawPixel(
                    ctx,
                    gatewayX + Math.cos(angle) * radius,
                    gatewayY + Math.sin(angle) * radius,
                    gatewayColorRgb,
                    alpha
                  );
                }
              }
            }
          }
        }
      }

      ctx.globalAlpha = 1;
      timeRef.current++;
      animationRef.current = requestAnimationFrame(render);
    };

    window.addEventListener("resize", resize);
    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [resize, config]);

  return (
    <div className="space-background">
      <canvas ref={canvasRef} className="space-canvas" />
    </div>
  );
}
