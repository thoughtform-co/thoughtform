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

  // ─── B. PERSISTENT TERRAIN (Always visible background) ───
  // This terrain fills the entire background and stays at fixed depth
  // It represents the "latent space" we're navigating - always there
  // Increased density to fill the screen more completely
  for (let r = 0; r < 60; r++) {
    for (let c = 0; c < 60; c++) {
      const x = (c - 30) * 70; // Wider spread to fill screen
      const z = 1500 + (r * 50); // Fixed Z depth, doesn't scroll away
      // Multi-wave terrain for organic topology
      const y =
        500 +
        Math.sin(c * 0.2) * 150 +
        Math.cos(r * 0.15) * 150 +
        Math.sin(c * 0.35 + r * 0.2) * 50;
      particles.push(createPoint(x, y, z, "terrain", GOLD, 0));
    }
  }

  // ─── C. LANDMARK 1: GATEWAY PORTAL (Section 1 - Hero) ───
  // Emerges from terrain when entering
  // Positioned to appear above terrain (Z: 1500-2000)
  const portalOffsetX = 200;
  for (let layer = 0; layer < 12; layer++) {
    const z = 1800 + layer * 40; // Positioned above terrain base
    const radius = 300 - layer * 18;
    const points = Math.max(20, 40 - layer * 2);
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const x = portalOffsetX + Math.cos(angle) * radius;
      const y = 200 + Math.sin(angle) * radius; // Positioned above terrain Y
      particles.push(createPoint(x, y, z, "geo", GOLD, 1));
    }
  }
  // Inner spiral
  for (let i = 0; i < 80; i++) {
    const t = i / 80;
    const angle = t * Math.PI * 2 * 3;
    const radius = (1 - t) * 250;
    const z = 1850 + t * 350;
    const x = portalOffsetX + Math.cos(angle) * radius;
    const y = 200 + Math.sin(angle) * radius;
    particles.push(createPoint(x, y, z, "geo", DAWN, 1));
  }

  // ─── D. LANDMARK 2: DATA OVERLAY (Section 2 - Manifesto) ───
  // Vertical data streams rising from terrain
  // Positioned to emerge from terrain surface
  for (let stream = 0; stream < 8; stream++) {
    const baseX = (stream - 4) * 120;
    const baseZ = 2800 + stream * 30; // Above terrain
    for (let i = 0; i < 25; i++) {
      const y = 550 - i * 30; // Rising from terrain base (~500)
      particles.push(createPoint(baseX, y, baseZ, "geo", DAWN, 2));
    }
  }
  // Horizontal scan lines
  for (let line = 0; line < 6; line++) {
    const y = 250 - line * 50; // Above terrain
    const z = 2900 + line * 20;
    for (let i = 0; i < 30; i++) {
      const x = (i - 15) * 40;
      particles.push(createPoint(x, y, z, "geo", GOLD, 2));
    }
  }

  // ─── E. LANDMARK 3: TRAJECTORY GRID (Section 3 - Services) ───
  // Perspective grid converging to vanishing point
  // Positioned to emerge from terrain
  for (let layer = 0; layer < 15; layer++) {
    const z = 4200 + layer * 80; // Above terrain range
    const size = 350 - layer * 18;
    const points = 35 - layer;
    for (let i = 0; i < points; i++) {
      const t = (i / points) * 2 - 1;
      particles.push(createPoint(t * size, -size * 0.6 + 200, z, "geo", GOLD, 3));
      particles.push(createPoint(t * size, size * 0.6 + 200, z, "geo", GOLD, 3));
      particles.push(createPoint(-size, t * size * 0.6 + 200, z, "geo", GOLD, 3));
      particles.push(createPoint(size, t * size * 0.6 + 200, z, "geo", GOLD, 3));
    }
  }
  // Helix tunnel
  for (let i = 0; i < 400; i++) {
    const z = 4300 + i * 3;
    const radius = 300 + Math.sin(i * 0.1) * 60;
    const angle = i * 0.18;
    const x = Math.cos(angle) * radius;
    const y = 200 + Math.sin(angle) * radius;
    particles.push(createPoint(x, y, z, "geo", DAWN, 3));
  }

  // ─── F. LANDMARK 4: EVENT HORIZON (Section 4 - Contact) ───
  // Sphere/singularity - final destination
  for (let i = 0; i < 600; i++) {
    const r = 400;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = 200 + r * Math.sin(phi) * Math.sin(theta); // Above terrain
    const z = 6000 + r * Math.cos(phi) * 0.5;
    particles.push(createPoint(x, y, z, "geo", ALERT, 4));
  }
  // Core rings
  for (let ring = 0; ring < 5; ring++) {
    const radius = 80 + ring * 50;
    const z = 6000;
    for (let i = 0; i < 25 + ring * 5; i++) {
      const angle = (i / (25 + ring * 5)) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = 200 + Math.sin(angle) * radius;
      particles.push(createPoint(x, y, z, "geo", GOLD, 4));
    }
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
  const MAX_DEPTH = 5000; // Increased to allow terrain to be visible

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
      const scrollZ = scrollP * 6000;
      
      // Determine which section we're in (0-4)
      const currentSection = Math.floor(scrollP * 4) + 1;
      const sectionProgress = (scrollP * 4) % 1; // 0-1 within current section

      // Trail effect (don't fully clear) - creates motion blur
      ctx.fillStyle = "rgba(5, 5, 4, 0.85)";
      ctx.fillRect(0, 0, width, height);

      // Dynamic vanishing point - starts centered, shifts right
      const scrollT = Math.min(1, scrollP * 3);
      const cx_stars = width * 0.5;
      const cx_geo = width * (0.5 + scrollT * 0.25);
      const cy = height * 0.5;

      // Sort by depth for proper layering
      const sorted = [...particlesRef.current].sort((a, b) => {
        const getZ = (p: Particle) => {
          if (p.type === "terrain") {
            // Terrain always at fixed relative Z (doesn't scroll)
            return p.z; // Use absolute Z from init (1500 + offset)
          }
          return p.z - scrollZ;
        };
        return getZ(b) - getZ(a);
      });

      sorted.forEach((p) => {
        let relZ: number;
        let particleAlpha = 1;
        let yOffset = 0;
        let terrainAlphaMultiplier = 1;

        if (p.type === "terrain") {
          // TERRAIN: Always visible at fixed depth (1500 + offset)
          // Never scrolls away - fills the entire background
          relZ = p.z; // Use absolute Z, not relative to scroll
          
          // Ensure terrain is always in visible range
          // If it goes out of bounds, it's still there but will be culled below
          terrainAlphaMultiplier = 0.6; // Subtle - 60% opacity for background
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
              // Emergence animation: particles rise up as section comes into view
              const emergence = Math.min(1, sectionProgress * 2);
              yOffset = (1 - emergence) * 150; // Rise from below/terrain
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

        // Culling - terrain should always be visible, so use larger bounds
        if (p.type === "terrain") {
          // Terrain can be visible even if slightly out of range
          if (relZ <= 100 || relZ > 5000) return;
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

