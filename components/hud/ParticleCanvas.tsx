"use client";

import { useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// THOUGHTFORM PARTICLE SYSTEM
// Following brand guidelines: sharp geometry, grid-snapped, no glow
// ═══════════════════════════════════════════════════════════════

const GRID = 3;
const DAWN = "#ebe3d6";
const GOLD = "#caa554";
const ALERT = "#ff6b35";

// Semantic ASCII characters for close particles
const CHARS = ["λ", "δ", "θ", "φ", "ψ", "Σ", "π", "∇", "∞", "∂", "⟨", "⟩"];

// Grid snapping function
function snap(value: number): number {
  return Math.floor(value / GRID) * GRID;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  baseY: number; // Original Y for emergence animation
  type: "star" | "geo" | "terrain";
  color: string;
  char: string;
  size: number;
  landmark?: number; // Which section this belongs to (0=terrain, 1-4=sections)
}

function createPoint(
  x: number,
  y: number,
  z: number,
  type: "star" | "geo" | "terrain",
  color: string,
  landmark?: number
): Particle {
  return {
    x,
    y,
    z,
    baseY: y,
    type,
    color,
    char: CHARS[Math.floor(Math.random() * CHARS.length)],
    size: 1 + Math.random(),
    landmark,
  };
}

/**
 * Calculate terrain Y position at given X, Z coordinates
 * This matches the terrain generation formula exactly
 * Terrain: 160 rows (r: 0-159), 70 columns (c: 0-69)
 * Z range: 800 to 8800 (row * 50 + 800)
 * X range: -2275 to +2275 ((c - 35) * 65)
 */
function getTerrainY(x: number, z: number): number {
  // Clamp Z to terrain range
  const clampedZ = Math.max(800, Math.min(8800, z));
  // Convert Z to row index (terrain spans Z: 800 to 8800, step 50)
  const r = (clampedZ - 800) / 50;
  
  // Convert X to column value (terrain: (c - 35) * 65, so c = x/65 + 35)
  const c = (x / 65) + 35;
  
  // Use same wave formula as terrain generation
  const wavePhase = r * 0.02;
  const y = 400 
    + Math.sin(c * 0.2 + wavePhase) * 180
    + Math.cos(r * 0.12) * 150
    + Math.sin(c * 0.35 + r * 0.15) * 70
    + Math.sin(r * 0.08) * 100;
  
  return y;
}

function initParticles(): Particle[] {
  const particles: Particle[] = [];

  // ─── A. STARFIELD (Background, ambient) ───
  for (let i = 0; i < 500; i++) {
    particles.push(
      createPoint(
        (Math.random() - 0.5) * 6000,
        (Math.random() - 0.5) * 6000,
        Math.random() * 8000,
        "star",
        DAWN
      )
    );
  }

  // ─── B. TOPOLOGY MOUNTAIN (Extended terrain through entire journey) ───
  // This terrain extends through the entire scroll journey (Z: 800 to 8800)
  // It scrolls WITH the content, creating the sense of traveling across it
  // The terrain evolves as you travel - waves shift phase, creating organic morphing
  // 160 rows × 70 columns - fills background throughout the entire journey
  for (let r = 0; r < 160; r++) {
    for (let c = 0; c < 70; c++) {
      const x = (c - 35) * 65; // Wide spread to fill screen
      const z = 800 + (r * 50); // Spans Z: 800 to 8800 across entire journey
      
      // Multi-wave terrain that evolves as you travel
      const wavePhase = r * 0.02; // Terrain morphs as you progress
      const y = 400 
        + Math.sin(c * 0.2 + wavePhase) * 180  // Primary wave with phase shift
        + Math.cos(r * 0.12) * 150              // Secondary wave
        + Math.sin(c * 0.35 + r * 0.15) * 70    // Detail wave
        + Math.sin(r * 0.08) * 100;             // Long-wave undulation over distance
      
      particles.push(createPoint(x, y, z, "terrain", GOLD, 0));
    }
  }

  // ─── C. LANDMARK 1: GATEWAY PORTAL (Section 1 - Hero) ───
  // Portal emerges from terrain surface
  const portalOffsetX = 200;
  const portalZ = 1500;
  const terrainYAtPortal = getTerrainY(portalOffsetX, portalZ);
  
  for (let layer = 0; layer < 12; layer++) {
    const z = portalZ + layer * 40;
    const radius = 300 - layer * 18;
    const points = Math.max(20, 40 - layer * 2);
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const x = portalOffsetX + Math.cos(angle) * radius;
      const terrainY = getTerrainY(x, z);
      // Portal rings emerge from terrain, rising upward
      const y = terrainY - 50 + Math.sin(angle) * radius * 0.3;
      particles.push(createPoint(x, y, z, "geo", GOLD, 1));
    }
  }
  // Inner spiral emerging from terrain
  for (let i = 0; i < 80; i++) {
    const t = i / 80;
    const angle = t * Math.PI * 2 * 3;
    const radius = (1 - t) * 250;
    const z = portalZ + 50 + t * 350;
    const x = portalOffsetX + Math.cos(angle) * radius;
    const terrainY = getTerrainY(x, z);
    const y = terrainY - 30 + Math.sin(angle) * radius * 0.2;
    particles.push(createPoint(x, y, z, "geo", DAWN, 1));
  }

  // ─── D. LANDMARK 2: GEOMETRIC TOWER (Section 2 - Manifesto) ───
  // "AI Isn't Software" - A crystalline data structure emerging from terrain
  // Represents AI as alien intelligence rising from the topology of meaning
  const manifestoCenterX = 0;
  const manifestoZ = 2900;
  const terrainYAtManifesto = getTerrainY(manifestoCenterX, manifestoZ);
  
  // Base foundation squares - embedded in terrain
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = manifestoCenterX + (col - 1) * 80;
      const z = manifestoZ + (row - 1) * 25;
      const terrainY = getTerrainY(x, z);
      // Foundation squares sit ON terrain
      const y = terrainY;
      particles.push(createPoint(x, y, z, "geo", GOLD, 2));
    }
  }
  
  // Rising geometric tower - interconnected squares growing upward
  // Creates a crystalline/geometric structure that supports the "alien intelligence" narrative
  for (let level = 0; level < 8; level++) {
    const height = level * 35;
    const baseY = terrainYAtManifesto + height;
    
    // Each level is a square pattern, smaller as it rises
    const levelSize = 180 - level * 15;
    const pointsPerSide = 8 - Math.floor(level / 2);
    
    // Bottom square of level
    for (let i = 0; i < pointsPerSide; i++) {
      const t = i / pointsPerSide;
      const x = manifestoCenterX + (t - 0.5) * levelSize;
      const z = manifestoZ - levelSize * 0.5;
      particles.push(createPoint(x, baseY, z, "geo", DAWN, 2));
    }
    // Top square of level
    for (let i = 0; i < pointsPerSide; i++) {
      const t = i / pointsPerSide;
      const x = manifestoCenterX + (t - 0.5) * levelSize;
      const z = manifestoZ + levelSize * 0.5;
      particles.push(createPoint(x, baseY, z, "geo", DAWN, 2));
    }
    // Left square of level
    for (let i = 0; i < pointsPerSide; i++) {
      const t = i / pointsPerSide;
      const z = manifestoZ + (t - 0.5) * levelSize;
      const x = manifestoCenterX - levelSize * 0.5;
      particles.push(createPoint(x, baseY, z, "geo", DAWN, 2));
    }
    // Right square of level
    for (let i = 0; i < pointsPerSide; i++) {
      const t = i / pointsPerSide;
      const z = manifestoZ + (t - 0.5) * levelSize;
      const x = manifestoCenterX + levelSize * 0.5;
      particles.push(createPoint(x, baseY, z, "geo", DAWN, 2));
    }
    
    // Vertical connectors between levels (rising columns)
    if (level > 0) {
      for (let corner = 0; corner < 4; corner++) {
        const angle = (corner / 4) * Math.PI * 2;
        const cornerX = manifestoCenterX + Math.cos(angle) * levelSize * 0.35;
        const cornerZ = manifestoZ + Math.sin(angle) * levelSize * 0.35;
        particles.push(createPoint(cornerX, baseY - 17, cornerZ, "geo", GOLD, 2));
      }
    }
  }
  
  // Top accent - geometric cap
  const topY = terrainYAtManifesto + 8 * 35 + 20;
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const radius = 40;
    const x = manifestoCenterX + Math.cos(angle) * radius;
    const z = manifestoZ + Math.sin(angle) * radius;
    particles.push(createPoint(x, topY, z, "geo", GOLD, 2));
  }

  // ─── E. LANDMARK 3: TRAJECTORY TUNNEL (Section 3 - Services) ───
  // Helix tunnel emerging from terrain surface
  const tunnelStartZ = 5500;
  for (let i = 0; i < 600; i++) {
    const z = tunnelStartZ + i * 4.5;
    const rad = 320 + Math.sin(i * 0.08) * 80;
    const angle = i * 0.14;
    const x = Math.cos(angle) * rad;
    // Calculate terrain Y at this position, then offset tunnel upward from it
    const terrainY = getTerrainY(x, z);
    // Tunnel spirals upward from terrain, creating a rising helix
    const baseHeight = terrainY + 50;
    const y = baseHeight + Math.sin(angle) * rad * 0.6;
    particles.push(createPoint(x, y, z, "geo", DAWN, 3));
  }

  // ─── F. LANDMARK 4: EVENT HORIZON (Section 4 - Contact) ───
  // Sphere/singularity emerging from terrain - final destination
  const horizonCenterX = 0;
  const horizonZ = 8500;
  const terrainYAtHorizon = getTerrainY(horizonCenterX, horizonZ);
  
  // Sphere particles arranged in layers, bottom half embedded in terrain
  for (let i = 0; i < 700; i++) {
    const r = 450;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = horizonCenterX + r * Math.sin(phi) * Math.cos(theta);
    const z = horizonZ + r * Math.cos(phi) * 0.3;
    // Calculate terrain Y, then position sphere emerging from it
    const terrainY = getTerrainY(x, z);
    // Bottom half of sphere sits on terrain, top half rises
    const sphereY = terrainYAtHorizon + r * Math.sin(phi) * Math.sin(theta);
    const y = Math.max(terrainY - 100, sphereY); // Don't go below terrain
    particles.push(createPoint(x, y, z, "geo", ALERT, 4));
  }

  return particles;
}

interface ParticleCanvasProps {
  scrollProgress: number;
}

export function ParticleCanvas({ scrollProgress }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const scrollProgressRef = useRef(0);

  const FOCAL = 400;
  const MAX_DEPTH = 6500; // Extended to show more terrain as it scrolls through

  // Update scroll progress ref when prop changes
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
    particlesRef.current = initParticles();
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

      const scrollP = scrollProgressRef.current;
      const scrollZ = scrollP * 8500; // Extended range to match terrain (8800 max)
      
      // Determine which section we're in (1-4)
      const currentSection = Math.floor(scrollP * 4) + 1;
      const sectionProgress = (scrollP * 4) % 1; // 0-1 within current section

      // Trail effect (don't fully clear) - creates motion blur
      ctx.fillStyle = "rgba(5, 5, 4, 0.88)";
      ctx.fillRect(0, 0, width, height);

      // Split vanishing points - stars center, geometry right (fixed position)
      // This creates the "looking out window" effect with integrated terrain
      const cx_stars = width * 0.5;   // Stars: Center (fly straight)
      const cx_geo = width * 0.72;    // Geo/Terrain: Right (look out window) - fixed position
      const cy = height * 0.52;

      // Sort by depth for proper layering
      // All particles scroll with content, including terrain
      const sorted = [...particlesRef.current].sort((a, b) => {
        return (b.z - scrollZ) - (a.z - scrollZ);
      });

      sorted.forEach((p) => {
        let relZ: number;
        let particleAlpha = 1;
        let yOffset = 0;
        let terrainAlphaMultiplier = 1;

        if (p.type === "terrain") {
          // TERRAIN: Scrolls with content, extends through entire journey (Z: 800-8800)
          // Always visible because it spans the full scroll range
          relZ = p.z - scrollZ;
          terrainAlphaMultiplier = 0.7; // Slightly more visible (70%) since it's the main feature
        } else if (p.type === "star") {
          // STARS: Loop infinitely
          relZ = p.z - scrollZ;
          while (relZ < 0) relZ += 8000;
          while (relZ > 8000) relZ -= 8000;
        } else {
          // LANDMARKS: Scroll with content but fade based on section
          relZ = p.z - scrollZ;
          
          // Calculate landmark visibility based on current section
          if (p.landmark) {
            const landmarkSection = p.landmark;
            const sectionDist = Math.abs(currentSection - landmarkSection);
            
            if (sectionDist === 0) {
              // Current section: fully visible, emerge from terrain
              particleAlpha = 1;
              // Emergence animation: objects grow upward from terrain as section comes into view
              const emergence = Math.min(1, sectionProgress * 1.5);
              // Scale from terrain up, so particles closer to terrain Y stay put, higher ones scale down
              yOffset = 0; // Objects already positioned at terrain, just fade/grow in
              particleAlpha *= emergence; // Fade in as they emerge
            } else if (sectionDist === 1) {
              // Adjacent section: partially visible
              particleAlpha = 0.4;
            } else {
              // Far sections: hidden
              particleAlpha = 0;
              return;
            }
          }
        }

        // Culling - terrain extends through entire journey, so use larger bounds
        if (p.type === "terrain") {
          // Terrain spans entire journey, allow wider range
          if (relZ <= 50 || relZ > MAX_DEPTH) return;
        } else {
          if (relZ <= 10 || relZ > MAX_DEPTH) return;
        }

        const scale = FOCAL / relZ;
        const center = p.type === "star" ? cx_stars : cx_geo;
        const x = center + p.x * scale;
        const y = cy + (p.y + yOffset) * scale;

        // Out of bounds check - more lenient for terrain
        if (p.type === "terrain") {
          // Allow terrain to extend beyond viewport for full coverage
          if (x < -200 || x > width + 200 || y < -200 || y > height + 200) return;
        } else {
          if (x < -50 || x > width + 50 || y < -50 || y > height + 50) return;
        }

        // Depth-based alpha (closer = more visible)
        const depthAlpha = Math.min(1, (1 - relZ / MAX_DEPTH) * 1.8);
        
        // Apply terrain subtlety multiplier
        ctx.globalAlpha = depthAlpha * particleAlpha * terrainAlphaMultiplier;
        ctx.fillStyle = p.color;

        if ((p.type === "geo" || p.type === "terrain") && scale > 0.35) {
          // Close particles: render as ASCII characters
          const fontSize = Math.max(8, Math.min(18, 12 * scale));
          ctx.font = `${fontSize}px "IBM Plex Sans", sans-serif`;
          ctx.fillText(p.char, snap(x), snap(y));
        } else if (p.type === "geo" || p.type === "terrain") {
          // Distant particles: grid-snapped squares
          const size = Math.max(GRID, GRID * scale);
          ctx.fillRect(snap(x), snap(y), size - 1, size - 1);
        } else {
          // Stars: smaller, dimmer squares
          const size = Math.max(GRID, p.size * scale * GRID);
          ctx.globalAlpha = depthAlpha * 0.4;
          ctx.fillRect(snap(x), snap(y), size - 1, size - 1);
        }
      });

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(render);
    };

    window.addEventListener("resize", resize);
    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [resize]);

  return (
    <div className="space-background">
      <canvas ref={canvasRef} className="space-canvas" />
    </div>
  );
}

