"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import {
  type ParticleSystemConfig,
  type LandmarkConfig,
  hexToRgb,
  DEFAULT_CONFIG,
} from "@/lib/particle-config";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";

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

/**
 * Blend an RGB color toward a muted gray based on depth
 * Creates the atmospheric, Dragonfly-style depth fade
 * @param rgbString - "r, g, b" format
 * @param depth - normalized depth (0 = close, 1 = far)
 * @param intensity - how much to desaturate (0-1)
 */
function desaturateByDepth(rgbString: string, depth: number, intensity: number = 0.8): string {
  const parts = rgbString.split(",").map((s) => parseInt(s.trim()));
  if (parts.length !== 3) return rgbString;

  const [r, g, b] = parts;

  // Target: muted warm gray that matches the void background
  const targetGray = { r: 35, g: 33, b: 30 }; // Warm dark gray

  // Calculate blend factor based on depth
  // Closer particles retain more color, far particles become gray
  const blendFactor = Math.min(1, depth * intensity);

  const newR = Math.round(r + (targetGray.r - r) * blendFactor);
  const newG = Math.round(g + (targetGray.g - g) * blendFactor);
  const newB = Math.round(b + (targetGray.b - b) * blendFactor);

  return `${newR}, ${newG}, ${newB}`;
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
 * Includes mountain range effect in far background
 */
function getTerrainY(x: number, z: number, config: ParticleSystemConfig["manifold"]): number {
  const clampedZ = Math.max(800, Math.min(8800, z));
  const r = (clampedZ - 800) / 50;
  const c = x / 65 + 35;

  const wavePhase = r * 0.02;
  let y =
    400 +
    Math.sin(c * config.waveFrequency + wavePhase) * config.waveAmplitude +
    Math.cos(r * 0.12) * 150 +
    Math.sin(c * 0.35 + r * 0.15) * 70 +
    Math.sin(r * 0.08) * 100;

  // Mountain range effect in far background (after row ~100)
  const mountainStart = 100;
  if (r > mountainStart) {
    const mountainProgress = (r - mountainStart) / (config.rows - mountainStart);
    const maxMountainHeight = 400;
    const mountainHeight = mountainProgress * maxMountainHeight;

    const peakFreq1 = 0.08;
    const peakFreq2 = 0.15;
    const peakFreq3 = 0.03;

    const peak1 = Math.pow(Math.max(0, Math.sin(c * peakFreq1 + 1.5)), 2) * mountainHeight;
    const peak2 = Math.pow(Math.max(0, Math.sin(c * peakFreq2 + 0.8)), 2) * mountainHeight * 0.6;
    const peak3 = Math.pow(Math.max(0, Math.sin(c * peakFreq3)), 1.5) * mountainHeight * 0.8;

    y -= (peak1 + peak2 + peak3) * 0.7;
  }

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
        particles.push(
          createPoint(cornerX, baseY + 20, cornerZ, "geo", colorRgb, index, landmark.id)
        );
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

/**
 * ZIGGURAT SHAPE - A stepped structure that EMERGES from the manifold terrain
 * Like a sacred mountain or tree growing from the landscape
 * Uses "geo" type for highlight rendering (no depth desaturation)
 */
function generateZigguratShape(
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

  // Get the terrain height at this position - we emerge FROM it
  const terrainY = getTerrainY(centerX, centerZ, manifoldConfig);

  // ─── ROOT SYSTEM: Particles that blend into the manifold ───
  // Creates visual connection to the terrain
  const rootCount = Math.floor(80 * density);
  for (let i = 0; i < rootCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 100 + Math.random() * 250 * scale;
    const x = centerX + Math.cos(angle) * dist;
    const z = centerZ + Math.sin(angle) * dist * 0.4;
    const localTerrainY = getTerrainY(x, z, manifoldConfig);
    // Roots sit ON the terrain, slightly above
    const y = localTerrainY - Math.random() * 20;
    particles.push(createPoint(x, y, z, "geo", colorRgb, index, landmark.id));
  }

  // ─── ZIGGURAT TIERS: Stepped layers rising upward ───
  const tierCount = Math.floor(8 * density);
  const baseSize = 300 * scale;
  const tierHeight = 35 * scale;

  for (let tier = 0; tier < tierCount; tier++) {
    const tierRatio = 1 - (tier / tierCount) * 0.7; // Each tier gets smaller
    const tierSize = baseSize * tierRatio;
    const y = terrainY - tier * tierHeight; // Rising up (Y goes negative for up in this system)
    const zOffset = centerZ + tier * 8; // Slight z offset for depth

    // Square platform edges for each tier
    const pointsPerSide = Math.max(4, Math.floor(12 * tierRatio * density));

    for (let side = 0; side < 4; side++) {
      for (let i = 0; i < pointsPerSide; i++) {
        const t = i / pointsPerSide;
        let x: number, z: number;

        if (side === 0) {
          // Front
          x = centerX + (t - 0.5) * tierSize;
          z = zOffset - tierSize * 0.25;
        } else if (side === 1) {
          // Back
          x = centerX + (t - 0.5) * tierSize;
          z = zOffset + tierSize * 0.25;
        } else if (side === 2) {
          // Left
          x = centerX - tierSize * 0.5;
          z = zOffset + (t - 0.5) * tierSize * 0.5;
        } else {
          // Right
          x = centerX + tierSize * 0.5;
          z = zOffset + (t - 0.5) * tierSize * 0.5;
        }

        particles.push(createPoint(x, y, z, "geo", colorRgb, index, landmark.id));

        // Add some fill particles on the platform surface
        if (i % 2 === 0 && tier < tierCount - 2) {
          const fillX = x + (Math.random() - 0.5) * 30;
          const fillZ = z + (Math.random() - 0.5) * 15;
          particles.push(createPoint(fillX, y - 5, fillZ, "geo", colorRgb, index, landmark.id));
        }
      }
    }

    // Vertical connectors between tiers (pillars)
    if (tier > 0 && tier < tierCount - 1) {
      const pillarCount = 4;
      for (let p = 0; p < pillarCount; p++) {
        const angle = (p / pillarCount) * Math.PI * 2 + Math.PI / 4;
        const pillarDist = tierSize * 0.35;
        const px = centerX + Math.cos(angle) * pillarDist;
        const pz = zOffset + Math.sin(angle) * pillarDist * 0.4;

        // Vertical line of particles
        for (let h = 0; h < 3; h++) {
          const py = y + h * (tierHeight / 3);
          particles.push(createPoint(px, py, pz, "geo", colorRgb, index, landmark.id));
        }
      }
    }
  }

  // ─── APEX: Crown of the ziggurat ───
  const apexY = terrainY - tierCount * tierHeight - 20;
  const apexPoints = Math.floor(30 * density);

  // Central spire
  for (let i = 0; i < 5; i++) {
    particles.push(
      createPoint(
        centerX,
        apexY - i * 15,
        centerZ + tierCount * 8,
        "geo",
        colorRgb,
        index,
        landmark.id
      )
    );
  }

  // Radiating crown particles
  for (let i = 0; i < apexPoints; i++) {
    const angle = (i / apexPoints) * Math.PI * 2;
    const dist = 30 + Math.random() * 40 * scale;
    const x = centerX + Math.cos(angle) * dist;
    const z = centerZ + tierCount * 8 + Math.sin(angle) * dist * 0.3;
    const y = apexY - Math.random() * 30;
    particles.push(createPoint(x, y, z, "geo", colorRgb, index, landmark.id));
  }

  // ─── ASCENDING PARTICLES: Like energy/light rising ───
  const ascendCount = Math.floor(40 * density);
  for (let i = 0; i < ascendCount; i++) {
    const t = i / ascendCount;
    const spiralAngle = t * Math.PI * 4;
    const spiralRadius = (1 - t) * 80 * scale;
    const x = centerX + Math.cos(spiralAngle) * spiralRadius;
    const z = centerZ + (tierCount * 8) / 2 + Math.sin(spiralAngle) * spiralRadius * 0.3;
    const y = terrainY - t * (tierCount * tierHeight + 80);
    particles.push(createPoint(x, y, z, "geo", colorRgb, index, landmark.id));
  }
}

/**
 * LORENZ ATTRACTOR - The famous butterfly-shaped chaotic attractor
 * Floats above the manifold as a mathematical sculpture
 * dx/dt = σ(y - x), dy/dt = x(ρ - z) - y, dz/dt = xy - βz
 */
function generateLorenzShape(
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
  const baseY = landmark.position.y || 200; // Float above terrain

  // Lorenz system parameters
  const sigma = 10;
  const rho = 28;
  const beta = 8 / 3;
  const dt = 0.005;

  const numPoints = Math.floor(3000 * density);
  const visualScale = 12 * scale;

  // Starting point
  let x = 0.1,
    y = 0,
    z = 0;

  for (let i = 0; i < numPoints; i++) {
    // Lorenz equations
    const dx = sigma * (y - x);
    const dy = x * (rho - z) - y;
    const dz = x * y - beta * z;

    x += dx * dt;
    y += dy * dt;
    z += dz * dt;

    // Map attractor coordinates to world space
    // The Lorenz attractor is roughly centered around (0, 0, 25) with wings extending ±20
    const worldX = centerX + x * visualScale;
    const worldY = baseY - z * visualScale * 0.5; // Z becomes height (inverted)
    const worldZ = centerZ + y * visualScale * 0.4; // Y becomes depth (compressed for perspective)

    particles.push(createPoint(worldX, worldY, worldZ, "geo", colorRgb, index, landmark.id));
  }
}

/**
 * HALVORSEN ATTRACTOR - Symmetrical three-lobed chaotic attractor
 * dx/dt = -ax - 4y - 4z - y², dy/dt = -ay - 4z - 4x - z², dz/dt = -az - 4x - 4y - x²
 */
function generateHalvorsenShape(
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
  const baseY = landmark.position.y || 200;

  // Halvorsen parameters
  const a = 1.89;
  const dt = 0.005;

  const numPoints = Math.floor(2500 * density);
  const visualScale = 40 * scale;

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

    const worldX = centerX + x * visualScale;
    const worldY = baseY - z * visualScale * 0.4;
    const worldZ = centerZ + y * visualScale * 0.3;

    particles.push(createPoint(worldX, worldY, worldZ, "geo", colorRgb, index, landmark.id));
  }
}

/**
 * RÖSSLER ATTRACTOR - Spiral-shaped chaotic attractor with a folded band
 * dx/dt = -y - z, dy/dt = x + ay, dz/dt = b + z(x - c)
 */
function generateRosslerShape(
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
  const baseY = landmark.position.y || 200;

  // Rössler parameters
  const a = 0.2;
  const b = 0.2;
  const c = 5.7;
  const dt = 0.02;

  const numPoints = Math.floor(2000 * density);
  const visualScale = 15 * scale;

  let x = 0.1,
    y = 0,
    z = 0;

  for (let i = 0; i < numPoints; i++) {
    const dx = -y - z;
    const dy = x + a * y;
    const dz = b + z * (x - c);

    x += dx * dt;
    y += dy * dt;
    z += dz * dt;

    const worldX = centerX + x * visualScale;
    const worldY = baseY - z * visualScale * 0.3;
    const worldZ = centerZ + y * visualScale * 0.3;

    particles.push(createPoint(worldX, worldY, worldZ, "geo", colorRgb, index, landmark.id));
  }
}

/**
 * ORBIT SHAPE - Clean concentric paths for celestial navigation
 */
function generateOrbitShape(
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

  const radius = 500 * scale;
  // Higher base point count so orbits read like clean UI rings (less chunky)
  const points = Math.floor(1400 * density);

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * radius;
    const z = centerZ + Math.sin(angle) * radius;

    // Positioned slightly above the manifold to float like a UI element
    const terrainY = getTerrainY(x, z, manifoldConfig);
    const y = terrainY - 40;

    particles.push(createPoint(x, y, z, "geo", colorRgb, index, landmark.id));

    // Add vertical "pulsar" lines at cardinal points
    if (i % (points / 8) === 0) {
      for (let j = 0; j < 12; j++) {
        particles.push(createPoint(x, y - j * 25, z, "geo", colorRgb, index, landmark.id));
      }
    }
  }
}

/**
 * GRID LINES - Structured X/Z axis grid (not random dots)
 * Creates the technical topology grid seen in strategy games
 */
function generateGridlinesShape(
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
  const baseY = landmark.position.y || 400;

  const gridSize = 2000 * scale;
  const gridSpacing = 250 / density; // Wider line spacing for cleaner grid
  const linePointSpacing = 3; // Very tight for smooth lines

  // Calculate grid bounds
  const halfGrid = gridSize / 2;
  const numLines = Math.floor(gridSize / gridSpacing);

  // Z-axis lines (running front to back)
  for (let i = 0; i <= numLines; i++) {
    const x = centerX - halfGrid + i * gridSpacing;
    for (let z = centerZ - halfGrid; z <= centerZ + halfGrid; z += linePointSpacing) {
      // Add subtle wave to the grid for topology
      const waveY = Math.sin(x * 0.003 + z * 0.002) * 40 + Math.cos(z * 0.003) * 25;
      const y = baseY + waveY;
      particles.push(createPoint(x, y, z, "geo", colorRgb, index, landmark.id));
    }
  }

  // X-axis lines (running left to right)
  for (let i = 0; i <= numLines; i++) {
    const z = centerZ - halfGrid + i * gridSpacing;
    for (let x = centerX - halfGrid; x <= centerX + halfGrid; x += linePointSpacing) {
      const waveY = Math.sin(x * 0.003 + z * 0.002) * 40 + Math.cos(z * 0.003) * 25;
      const y = baseY + waveY;
      particles.push(createPoint(x, y, z, "geo", colorRgb, index, landmark.id));
    }
  }
}

/**
 * CONTOUR LINES - Topographic elevation rings
 * Creates concentric elevation contours like a topographic map
 */
function generateContourShape(
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
  const baseY = landmark.position.y || 400;

  const numContours = Math.floor(15 * density);
  const maxRadius = 600 * scale;
  const contourSpacing = maxRadius / numContours;
  const pointsPerContour = Math.floor(400 * density); // Much denser rings

  for (let c = 1; c <= numContours; c++) {
    const radius = c * contourSpacing;
    // Each contour at different elevation
    const elevation = -c * 12; // Rising up (negative Y = higher)

    for (let i = 0; i < pointsPerContour; i++) {
      const angle = (i / pointsPerContour) * Math.PI * 2;
      // Add some organic wobble to the contours
      const wobble = Math.sin(angle * 7 + c * 0.4) * 15 * (c / numContours);
      const r = radius + wobble;

      const x = centerX + Math.cos(angle) * r;
      const z = centerZ + Math.sin(angle) * r * 0.7; // Compress for isometric view
      const y = baseY + elevation;

      particles.push(createPoint(x, y, z, "geo", colorRgb, index, landmark.id));
    }
  }
}

/**
 * WIREFRAME SPHERE - Clean geometric wireframe (like the red sphere in reference)
 */
function generateWireframeSphereShape(
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
  const baseY = landmark.position.y || 200;

  const radius = 150 * scale;
  const latLines = Math.floor(10 * density); // Horizontal rings
  const longLines = Math.floor(16 * density); // Vertical lines
  const pointsPerLine = Math.floor(80 * density); // Much denser lines

  // Latitude lines (horizontal rings)
  for (let lat = 1; lat < latLines; lat++) {
    const phi = (lat / latLines) * Math.PI; // 0 to PI
    const ringRadius = radius * Math.sin(phi);
    const ringY = baseY - radius * Math.cos(phi);

    for (let i = 0; i < pointsPerLine; i++) {
      const theta = (i / pointsPerLine) * Math.PI * 2;
      const x = centerX + ringRadius * Math.cos(theta);
      const z = centerZ + ringRadius * Math.sin(theta) * 0.5; // Compressed for isometric
      particles.push(createPoint(x, ringY, z, "geo", colorRgb, index, landmark.id));
    }
  }

  // Longitude lines (vertical arcs)
  for (let lon = 0; lon < longLines; lon++) {
    const theta = (lon / longLines) * Math.PI * 2;

    for (let i = 0; i <= pointsPerLine; i++) {
      const phi = (i / pointsPerLine) * Math.PI;
      const x = centerX + radius * Math.sin(phi) * Math.cos(theta);
      const y = baseY - radius * Math.cos(phi);
      const z = centerZ + radius * Math.sin(phi) * Math.sin(theta) * 0.5;
      particles.push(createPoint(x, y, z, "geo", colorRgb, index, landmark.id));
    }
  }
}

/**
 * STARFIELD - Scattered stars in 3D space (background layer)
 */
function generateStarfieldShape(
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
  const baseY = landmark.position.y || -200; // Above the grid (negative Y = up)

  const numStars = Math.floor(500 * density);
  const spreadX = 4000 * scale;
  const spreadZ = 6000 * scale;
  const spreadY = 800 * scale;

  for (let i = 0; i < numStars; i++) {
    const x = centerX + (Math.random() - 0.5) * spreadX;
    const z = centerZ + (Math.random() - 0.5) * spreadZ;
    const y = baseY - Math.random() * spreadY; // Scattered above

    particles.push(createPoint(x, y, z, "star", colorRgb, index, landmark.id));
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
      const z = 200 + r * (55 * manifold.spreadZ);

      const wavePhase = r * 0.02;

      // Base terrain waves
      let y =
        400 +
        Math.sin(c * manifold.waveFrequency + wavePhase) * manifold.waveAmplitude +
        Math.cos(r * 0.12) * 150 +
        Math.sin(c * 0.35 + r * 0.15) * 70 +
        Math.sin(r * 0.08) * 100;

      // ─── MOUNTAIN RANGE in far background ───
      // Mountains start appearing after row 100 (far back)
      const mountainStart = 100;
      if (r > mountainStart) {
        const mountainProgress = (r - mountainStart) / (manifold.rows - mountainStart);

        // Create multiple mountain peaks using overlapping sine waves
        const peakFreq1 = 0.08; // Main peaks
        const peakFreq2 = 0.15; // Secondary peaks
        const peakFreq3 = 0.03; // Broad mountain ranges

        // Mountain height increases towards the back
        const maxMountainHeight = 400;
        const mountainHeight = mountainProgress * maxMountainHeight;

        // Combine multiple frequencies for natural-looking mountain silhouette
        const peak1 = Math.pow(Math.max(0, Math.sin(c * peakFreq1 + 1.5)), 2) * mountainHeight;
        const peak2 =
          Math.pow(Math.max(0, Math.sin(c * peakFreq2 + 0.8)), 2) * mountainHeight * 0.6;
        const peak3 = Math.pow(Math.max(0, Math.sin(c * peakFreq3)), 1.5) * mountainHeight * 0.8;

        // Subtract from Y (negative Y = higher on screen)
        y -= (peak1 + peak2 + peak3) * 0.7;

        // Add some jagged variation for realism
        y -= Math.random() * mountainHeight * 0.1;
      }

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
      case "ziggurat":
        generateZigguratShape(particles, landmark, landmarkIndex, manifold);
        break;
      case "lorenz":
        generateLorenzShape(particles, landmark, landmarkIndex, manifold);
        break;
      case "halvorsen":
        generateHalvorsenShape(particles, landmark, landmarkIndex, manifold);
        break;
      case "rossler":
        generateRosslerShape(particles, landmark, landmarkIndex, manifold);
        break;
      case "orbit":
        generateOrbitShape(particles, landmark, landmarkIndex, manifold);
        break;
      case "gridlines":
        generateGridlinesShape(particles, landmark, landmarkIndex, manifold);
        break;
      case "contour":
        generateContourShape(particles, landmark, landmarkIndex, manifold);
        break;
      case "wireframeSphere":
        generateWireframeSphereShape(particles, landmark, landmarkIndex, manifold);
        break;
      case "starfield":
        generateStarfieldShape(particles, landmark, landmarkIndex, manifold);
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
  const isMobile = useIsMobile();

  // Mobile-optimized config with reduced density
  const mobileConfig = useMemo(() => {
    if (!isMobile) return config;

    return {
      ...config,
      manifold: {
        ...config.manifold,
        rows: Math.floor(config.manifold.rows * 0.5), // Half the rows
        columns: Math.floor(config.manifold.columns * 0.6), // 60% of columns
      },
      // Reduce landmark density on mobile
      landmarks: config.landmarks.map((l) => ({
        ...l,
        density: l.density * 0.5,
      })),
    };
  }, [config, isMobile]);

  // Update config ref when config changes
  useEffect(() => {
    configRef.current = mobileConfig;
    // Reinitialize particles when config changes
    particlesRef.current = initParticles(mobileConfig);
  }, [mobileConfig]);

  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // On mobile, use lower DPR for performance (cap at 1.5)
    const baseDpr = window.devicePixelRatio || 1;
    const dpr = isMobile ? Math.min(baseDpr, 1.5) : baseDpr;
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
  }, [isMobile]);

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

      // Camera settings from config
      const camera = currentConfig.camera;
      const MAX_DEPTH = camera.maxDepth ?? 12000;
      const FOCAL = camera.focalLength;
      const cx_geo = width * camera.vanishX;
      const cy = height * camera.vanishY;

      // Pre-calculate pitch/yaw/roll transforms
      const pitchRad = (camera.pitch * Math.PI) / 180;
      const yawRad = (camera.yaw * Math.PI) / 180;
      const rollRad = (camera.roll * Math.PI) / 180;
      const cosPitch = Math.cos(pitchRad);
      const sinPitch = Math.sin(pitchRad);
      const cosYaw = Math.cos(yawRad);
      const sinYaw = Math.sin(yawRad);
      const cosRoll = Math.cos(rollRad);
      const sinRoll = Math.sin(rollRad);

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
          // Starfield particles - fixed in space (don't scroll with terrain)
          relZ = p.z; // Stars are at fixed positions
          particleAlpha = 0.6 + Math.random() * 0.4; // Twinkle effect
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

        // Breathing animation
        const breatheX = Math.sin(time * 0.015 + p.phase) * 5;
        const breatheY = Math.cos(time * 0.012 + p.phase * 1.3) * 4;

        // Get world position with breathing and truck offset
        // Truck moves camera, so we offset particles in opposite direction
        let worldX = p.x + breatheX - camera.truckX;
        let worldZ = relZ;

        // Apply yaw rotation (horizontal rotation of the grid)
        const rotX = worldX * cosYaw - worldZ * sinYaw;
        const rotZ = worldX * sinYaw + worldZ * cosYaw;
        worldX = rotX;
        worldZ = rotZ;

        // Skip if behind camera after yaw rotation
        if (worldZ <= 5) return;

        // Perspective projection
        const scale = FOCAL / worldZ;

        // For pitch: compress vertical spread as we look more top-down
        // Also apply truckY offset (camera moves up = world appears to move down)
        const pitchFactor = cosPitch;
        const worldY = (p.y + breatheY - camera.truckY) * pitchFactor;

        // Calculate screen position before roll
        const preRollX = cx_geo + worldX * scale;
        const preRollY = cy + worldY * scale - sinPitch * 150 * scale;

        // Apply roll (2D rotation around screen center)
        const dx = preRollX - cx_geo;
        const dy = preRollY - cy;
        const x = cx_geo + dx * cosRoll - dy * sinRoll;
        const y = cy + dx * sinRoll + dy * cosRoll;

        // Bounds check
        if (p.type === "terrain") {
          if (x < -150 || x > width + 150 || y < -150 || y > height + 150) return;
        } else {
          if (x < -50 || x > width + 50 || y < -50 || y > height + 50) return;
        }

        // Depth-based alpha - atmospheric fade creates integration with background
        const normalizedDepth = worldZ / MAX_DEPTH; // 0 = close, 1 = far
        const depthAlpha = Math.min(1, (1 - normalizedDepth) * 1.2 + 0.2);

        // Subtle proximity boost: closer particles slightly more visible
        // Reduced from 0.8 to 0.3 for more subdued look
        const proximityBoost = worldZ < 1500 ? 1 + (1 - worldZ / 1500) * 0.3 : 1;

        // Subtle breathing animation
        const breatheAlpha = 0.9 + Math.sin(time * 0.015 + p.phase) * 0.1;
        const finalAlpha = Math.min(
          1,
          depthAlpha * particleAlpha * terrainAlphaMultiplier * breatheAlpha * proximityBoost
        );

        ctx.globalAlpha = 1;

        if (p.type === "terrain") {
          // Terrain: clip above certain screen percentage
          if (camera.terrainClipY > 0 && y < height * camera.terrainClipY) return;

          // Terrain: scale size based on depth, nearby = bigger
          const sizeMultiplier = Math.min(2.5, 0.6 + scale * 1.2);
          const size = Math.max(GRID, GRID * sizeMultiplier);

          // Distance blur effect: far particles get larger and softer
          const distanceBlur = normalizedDepth > 0.4 ? (normalizedDepth - 0.4) * 2 : 0;
          const blurredSize = size + distanceBlur * 3;

          // ATMOSPHERIC DEPTH FADE: particles fade to background as they recede
          // This creates the subdued, integrated look inspired by Dragonfly
          const atmosphericFade = Math.pow(normalizedDepth, 0.6); // Non-linear fade
          const blurredAlpha = finalAlpha * (1 - atmosphericFade * 0.7) * (1 - distanceBlur * 0.2);

          // Apply depth-based desaturation - far particles become muted gray
          const desaturatedColor = desaturateByDepth(p.color, normalizedDepth, 0.85);

          // Draw main particle with atmospheric color
          drawPixel(ctx, x, y, desaturatedColor, blurredAlpha, blurredSize);

          // Subtle bloom only for very close particles (creates depth without noise)
          if (normalizedDepth < 0.15 && finalAlpha > 0.4) {
            const bloomAlpha = blurredAlpha * 0.08;
            drawPixel(ctx, x, y, desaturatedColor, bloomAlpha, blurredSize * 2);
          }
        } else if (p.type === "gateway" || p.type === "geo") {
          // Check if this is a "highlight" landmark (attractors, ziggurat) that should POP
          const isHighlightLandmark =
            p.landmarkId === "ziggurat" ||
            p.landmarkId === "lorenz" ||
            p.landmarkId === "halvorsen" ||
            p.landmarkId === "rossler";

          let landmarkColor: string;
          let landmarkAlpha: number;

          if (isHighlightLandmark) {
            // HIGHLIGHT LANDMARKS: Full bright color, minimal fade
            // These should stand out dramatically from the subdued grid
            landmarkColor = p.color; // Use full original color (bright gold)
            const highlightFade = Math.pow(normalizedDepth, 1.2); // Gentler fade
            landmarkAlpha = finalAlpha * (1 - highlightFade * 0.3) * 1.2; // Boost visibility
          } else {
            // Regular landmarks: subtle desaturation
            landmarkColor = desaturateByDepth(p.color, normalizedDepth, 0.5);
            const landmarkAtmosphericFade = Math.pow(normalizedDepth, 0.8);
            landmarkAlpha = finalAlpha * (1 - landmarkAtmosphericFade * 0.5);
          }

          const baseSize = p.type === "gateway" ? GRID * 2 : GRID * 1.6;
          const size = Math.max(GRID, baseSize * Math.min(3, scale * 2));
          drawPixel(ctx, x, y, landmarkColor, landmarkAlpha, size);

          // Very subtle glow only for very close highlight landmarks
          // Removed aggressive glow to keep ziggurat crisp
          if (isHighlightLandmark && scale > 0.8 && normalizedDepth < 0.15) {
            drawPixel(ctx, x, y, landmarkColor, landmarkAlpha * 0.05, size * 1.5);
          }

          // Subtle glow for close gateway particles - more subdued
          if (p.type === "gateway" && scale > 0.6 && particleAlpha > 0.5) {
            const glowPulse = Math.sin(time * 0.03 + p.phase) * 0.25 + 0.5;
            if (glowPulse > 0.3 && normalizedDepth < 0.3) {
              drawPixel(ctx, x, y, landmarkColor, landmarkAlpha * 0.08 * glowPulse, GRID * 4);
            }
          }
        } else if (p.type === "star") {
          // STARFIELD RENDERING
          const twinkle = 0.4 + Math.sin(time * 0.05 + p.phase * 10) * 0.3;
          const starAlpha = finalAlpha * twinkle * 0.8;
          const starSize = GRID * (0.8 + Math.random() * 0.4);
          drawPixel(ctx, x, y, p.color, starAlpha, starSize);
        }
      });

      // Gateway halo effect (visible in hero section) - very subtle, atmospheric
      if (scrollP < 0.25) {
        const gatewayLandmark = currentConfig.landmarks.find(
          (l) => l.shape === "gateway" && l.enabled
        );
        if (gatewayLandmark) {
          let gRelZ = gatewayLandmark.position.z - scrollZ;
          if (gRelZ > 50 && gRelZ < 2000) {
            // Apply truck offset and yaw rotation to gateway position
            let gx = gatewayLandmark.position.x - camera.truckX;
            const gRotX = gx * cosYaw - gRelZ * sinYaw;
            const gRotZ = gx * sinYaw + gRelZ * cosYaw;
            gx = gRotX;
            gRelZ = gRotZ;

            if (gRelZ > 5) {
              const gScale = FOCAL / gRelZ;
              const gy = (gatewayLandmark.position.y - camera.truckY) * cosPitch;
              // Calculate screen position before roll
              const preGatewayX = cx_geo + gx * gScale;
              const preGatewayY = cy + gy * gScale - sinPitch * 150 * gScale;
              // Apply roll
              const gdx = preGatewayX - cx_geo;
              const gdy = preGatewayY - cy;
              const gatewayX = cx_geo + gdx * cosRoll - gdy * sinRoll;
              const gatewayY = cy + gdx * sinRoll + gdy * cosRoll;
              const pulse = Math.sin(time * 0.02) * 0.15 + 0.7; // More subtle pulse
              const fadeOut = scrollP < 0.15 ? 1 : Math.max(0, 1 - (scrollP - 0.15) * 6);

              // Desaturate the gateway color for atmospheric integration
              const gatewayColorRgb = hexToRgb(gatewayLandmark.color);
              const mutedGatewayColor = desaturateByDepth(gatewayColorRgb, 0.4, 0.6);

              // Fewer, more subtle rings
              for (let r = 0; r < 3; r++) {
                const radius = (200 + r * 80) * gScale * gatewayLandmark.scale;
                const alpha = 0.012 * (1 - r / 3) * pulse * fadeOut; // Much more subtle
                const points = Math.floor((radius / GRID) * 1.2);

                for (let i = 0; i < points; i++) {
                  const angle = (i / points) * Math.PI * 2 + time * 0.003;
                  if (Math.random() > 0.6) {
                    // Sparser
                    drawPixel(
                      ctx,
                      gatewayX + Math.cos(angle) * radius,
                      gatewayY + Math.sin(angle) * radius,
                      mutedGatewayColor,
                      alpha
                    );
                  }
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
