"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { hexToRgb } from "@/lib/particle-config";

// ═══════════════════════════════════════════════════════════════
// IMAGE-TO-PARTICLE GATEWAY
// Converts a hero image into a particle field using depth mapping
// As scroll progresses, particles morph from image → topology
// ═══════════════════════════════════════════════════════════════

const GRID = 3;
const DAWN_RGB = "236, 227, 214";
const GOLD_RGB = "202, 165, 84";
const VOID_RGB = "5, 4, 3";

// Grid snapping
function snap(value: number): number {
  return Math.floor(value / GRID) * GRID;
}

// Draw pixel
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
  ctx.fillStyle = `rgba(${color}, ${Math.max(0, Math.min(1, alpha))})`;
  ctx.fillRect(px, py, size - 1, size - 1);
}

interface ImageParticle {
  // Source position (from image)
  srcX: number;
  srcY: number;
  srcZ: number; // from depth map
  
  // Target position (in particle system)
  targetX: number;
  targetY: number;
  targetZ: number;
  
  // Current interpolated position
  x: number;
  y: number;
  z: number;
  
  // Visual properties
  color: string;
  brightness: number;
  size: number;
  phase: number;
  
  // Particle type after transition
  finalType: "terrain" | "gateway" | "void";
}

interface TerrainParticle {
  x: number;
  y: number;
  z: number;
  color: string;
  phase: number;
  size: number;
}

interface ImageParticleGatewayProps {
  scrollProgress: number;
  heroImageSrc?: string;
  depthMapSrc?: string;
}

export function ImageParticleGateway({
  scrollProgress,
  heroImageSrc = "/images/gateway-hero.png",
  depthMapSrc = "/images/gateway-depth.png",
}: ImageParticleGatewayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageParticlesRef = useRef<ImageParticle[]>([]);
  const terrainParticlesRef = useRef<TerrainParticle[]>([]);
  const animationRef = useRef<number>(0);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const scrollProgressRef = useRef(0);
  const timeRef = useRef(0);
  const loadedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);

  const FOCAL = 400;
  const MAX_DEPTH = 7000;
  const TRANSITION_START = 0.05; // When particles start transitioning (earlier)
  const TRANSITION_END = 0.22; // When fully transitioned to topology (faster)
  const IMAGE_PARTICLES_END = 0.30; // When image particles completely disappear

  // Load and sample the hero image + depth map
  const loadImages = useCallback(async () => {
    if (loadedRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = dimensionsRef.current;
    if (width === 0) return;

    try {
      // Load both images
      const [heroImg, depthImg] = await Promise.all([
        loadImage(heroImageSrc),
        loadImage(depthMapSrc),
      ]);

      // Create offscreen canvases for sampling
      const heroCanvas = document.createElement("canvas");
      const depthCanvas = document.createElement("canvas");
      
      // Use image's aspect ratio - HIGHER resolution for bigger gateway
      const aspectRatio = heroImg.width / heroImg.height;
      const sampleWidth = 500; // Higher sample resolution for more detail
      const sampleHeight = Math.floor(sampleWidth / aspectRatio);
      
      heroCanvas.width = sampleWidth;
      heroCanvas.height = sampleHeight;
      depthCanvas.width = sampleWidth;
      depthCanvas.height = sampleHeight;
      
      const heroCtx = heroCanvas.getContext("2d")!;
      const depthCtx = depthCanvas.getContext("2d")!;
      
      heroCtx.drawImage(heroImg, 0, 0, sampleWidth, sampleHeight);
      depthCtx.drawImage(depthImg, 0, 0, sampleWidth, sampleHeight);
      
      const heroData = heroCtx.getImageData(0, 0, sampleWidth, sampleHeight);
      const depthData = depthCtx.getImageData(0, 0, sampleWidth, sampleHeight);
      
      // Sample particles from image
      const particles: ImageParticle[] = [];
      const step = 3; // Sample every Nth pixel
      
      for (let py = 0; py < sampleHeight; py += step) {
        for (let px = 0; px < sampleWidth; px += step) {
          const i = (py * sampleWidth + px) * 4;
          
          const r = heroData.data[i];
          const g = heroData.data[i + 1];
          const b = heroData.data[i + 2];
          const a = heroData.data[i + 3];
          
          // Get depth (white = close, black = far)
          const depth = depthData.data[i]; // Using red channel
          
          // Skip fully transparent or very dark pixels
          const brightness = (r + g + b) / (3 * 255);
          if (a < 50 || brightness < 0.06) continue;
          
          // Convert to screen coordinates - LARGER spread to fill more of screen
          const screenX = ((px / sampleWidth) - 0.5) * width * 1.8;
          const screenY = ((py / sampleHeight) - 0.5) * height * 1.6;
          
          // Depth: 0-255 → Z position - CLOSER to camera (100-800 range)
          const normalizedDepth = depth / 255;
          const srcZ = 100 + (1 - normalizedDepth) * 700; // Much closer!
          
          // Calculate target position in topology
          // Particles from the portal center go into the gateway
          // Terrain particles spread into the manifold
          const distFromCenter = Math.sqrt(
            Math.pow((px / sampleWidth) - 0.55, 2) + // Portal is right of center
            Math.pow((py / sampleHeight) - 0.45, 2)
          );
          
          let targetX: number, targetY: number, targetZ: number;
          let finalType: "terrain" | "gateway" | "void";
          
          if (distFromCenter < 0.22) {
            // Inside the portal → flies TOWARD camera and past us
            const angle = Math.atan2(
              (py / sampleHeight) - 0.45,
              (px / sampleWidth) - 0.55
            );
            const radius = distFromCenter * 600;
            // Target is BEHIND the camera (negative Z or very small Z)
            // This makes particles fly "through" us
            targetX = Math.cos(angle) * radius * 3 + screenX * 0.5;
            targetY = Math.sin(angle) * radius * 2 + screenY * 0.3;
            targetZ = -500 - Math.random() * 500; // Behind camera!
            finalType = "gateway";
          } else if (py / sampleHeight > 0.50) {
            // Lower terrain → spreads outward and fades
            targetX = screenX * 2.5;
            targetY = screenY * 1.5 + 200;
            targetZ = -200 - Math.random() * 400; // Also exits behind camera
            finalType = "terrain";
          } else {
            // Sky/background → fades to void quickly
            targetX = screenX * 3;
            targetY = screenY * 2 - 300;
            targetZ = -100 - Math.random() * 300;
            finalType = "void";
          }
          
          // Color: mix original color toward brand colors based on position
          let color: string;
          if (finalType === "gateway") {
            color = GOLD_RGB;
          } else if (finalType === "terrain") {
            color = DAWN_RGB;
          } else {
            // Blend original color
            color = `${Math.round(r * 0.7 + 236 * 0.3)}, ${Math.round(g * 0.7 + 227 * 0.3)}, ${Math.round(b * 0.7 + 214 * 0.3)}`;
          }
          
          particles.push({
            srcX: screenX,
            srcY: screenY,
            srcZ,
            targetX,
            targetY,
            targetZ,
            x: screenX,
            y: screenY,
            z: srcZ,
            color,
            brightness,
            size: 1 + brightness * 1.5,
            phase: Math.random() * Math.PI * 2,
            finalType,
          });
        }
      }
      
      imageParticlesRef.current = particles;
      
      // Generate terrain - SAME AS MAIN LANDING PAGE (ParticleCanvasV2)
      const terrain: TerrainParticle[] = [];
      const rows = 140;
      const columns = 60;
      const waveAmplitude = 180;
      const waveFrequency = 0.2;
      
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
          const x = (c - columns / 2) * 70;  // Same as main page
          const z = 1200 + r * 55;           // Same as main page
          const wavePhase = r * 0.02;
          const y = 400 +
            Math.sin(c * waveFrequency + wavePhase) * waveAmplitude +
            Math.cos(r * 0.12) * 150 +
            Math.sin(c * 0.35 + r * 0.15) * 70 +
            Math.sin(r * 0.08) * 100;
          
          terrain.push({
            x, y, z,
            color: DAWN_RGB,
            phase: Math.random() * Math.PI * 2,
            size: 1 + Math.random() * 0.5,
          });
        }
      }
      terrainParticlesRef.current = terrain;
      
      loadedRef.current = true;
      setIsLoading(false);
      
    } catch (err) {
      console.error("Failed to load gateway images:", err);
      setIsLoading(false);
    }
  }, [heroImageSrc, depthMapSrc]);

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
    
    // Reload images when resized (to recalculate positions)
    if (!loadedRef.current) {
      loadImages();
    }
  }, [loadImages]);

  useEffect(() => {
    resize();
    loadImages();

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

      const time = timeRef.current;
      const scrollP = scrollProgressRef.current;
      
      // Calculate transition progress
      const transitionP = Math.max(0, Math.min(1, 
        (scrollP - TRANSITION_START) / (TRANSITION_END - TRANSITION_START)
      ));
      
      // Calculate fade-out progress for image particles
      const imageParticleFade = scrollP < TRANSITION_END 
        ? 1 
        : Math.max(0, 1 - (scrollP - TRANSITION_END) / (IMAGE_PARTICLES_END - TRANSITION_END));
      
      // Easing function for smooth transition
      const easeInOutCubic = (t: number) => 
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const easedTransition = easeInOutCubic(transitionP);
      
      // Camera movement as we "fly through" the portal - FASTER zoom
      const zoomProgress = Math.min(1, scrollP * 5);
      const cameraZ = zoomProgress * 2000; // Push camera further forward
      const scrollZ = scrollP * 8000;
      
      // Skip image particles entirely after they've faded out (performance)
      const shouldRenderImageParticles = scrollP < IMAGE_PARTICLES_END;

      // Clear canvas
      ctx.fillStyle = "#050504";
      ctx.fillRect(0, 0, width, height);

      // Vanishing point - SAME AS MAIN PAGE (right-focused)
      const cx = width * (0.5 + easedTransition * 0.2); // Shifts right during transition
      const cy = height * 0.5; // Same as main page

      // ─── RENDER IMAGE PARTICLES (only until they've faded out) ───
      if (shouldRenderImageParticles && imageParticlesRef.current.length > 0) {
        const imageParticles = imageParticlesRef.current;
        
        // Sort by Z for proper depth rendering
        const sorted = [...imageParticles].sort((a, b) => b.z - a.z);
        
        sorted.forEach((p) => {
          // Interpolate between source and target positions
          const morphX = p.srcX + (p.targetX - p.srcX) * easedTransition;
          const morphY = p.srcY + (p.targetY - p.srcY) * easedTransition;
          const morphZ = p.srcZ + (p.targetZ - p.srcZ) * easedTransition;
          
          // Apply camera movement - particles fly toward and past us
          const relZ = morphZ - cameraZ;
          
          // Skip particles that have passed behind camera
          if (relZ < 20) return;
          if (relZ > MAX_DEPTH) return;
          
          // All particle types fade out progressively
          let typeFade = imageParticleFade;
          if (p.finalType === "void") {
            // Void fades faster
            typeFade *= Math.max(0, 1 - easedTransition * 1.5);
          } else if (p.finalType === "terrain") {
            // Terrain fades medium
            typeFade *= Math.max(0, 1 - easedTransition * 1.2);
          }
          // Gateway particles stay longest but still fade
          
          if (typeFade < 0.02) return;
          
          // Perspective projection
          const scale = FOCAL / relZ;
          
          // Breathing animation - increases as we zoom through
          const breatheIntensity = 1 + easedTransition * 2;
          const breatheX = Math.sin(time * 0.015 + p.phase) * (4 * breatheIntensity);
          const breatheY = Math.cos(time * 0.012 + p.phase * 1.3) * (3 * breatheIntensity);
          
          const screenX = cx + (morphX + breatheX) * scale;
          const screenY = cy + (morphY + breatheY) * scale;
          
          // Bounds check - allow wider bounds during zoom
          const boundsPadding = 200 + easedTransition * 300;
          if (screenX < -boundsPadding || screenX > width + boundsPadding) return;
          if (screenY < -boundsPadding || screenY > height + boundsPadding) return;
          
          // Alpha calculation
          const depthAlpha = Math.min(1, (1 - relZ / MAX_DEPTH) * 2 + 0.3);
          const proximityBoost = relZ < 600 ? 1 + (1 - relZ / 600) * 0.8 : 1;
          const breatheAlpha = 0.85 + Math.sin(time * 0.02 + p.phase) * 0.15;
          
          const finalAlpha = depthAlpha * breatheAlpha * proximityBoost * p.brightness * typeFade;
          
          if (finalAlpha < 0.02) return;
          
          // Size scales up dramatically as particles fly past - creates "warp" effect
          const baseSize = p.size * GRID;
          const warpSize = 1 + easedTransition * 1.5; // Particles get bigger as they pass
          const size = Math.max(GRID, baseSize * scale * warpSize * 1.8);
          
          // Color: blend toward brand colors during transition
          let color = p.color;
          if (p.finalType === "gateway") {
            color = GOLD_RGB;
          } else if (easedTransition > 0.2) {
            color = DAWN_RGB;
          }
          
          drawPixel(ctx, screenX, screenY, color, finalAlpha, size);
          
          // Gateway particles get a dramatic glow as they fly past
          if (p.finalType === "gateway" && scale > 0.3) {
            const glowPulse = Math.sin(time * 0.03 + p.phase) * 0.4 + 0.6;
            const glowIntensity = Math.min(1, scale * 1.5);
            drawPixel(ctx, screenX, screenY, GOLD_RGB, finalAlpha * 0.2 * glowPulse * glowIntensity, size * 4);
          }
        });
      }
      
      // ─── RENDER EXTENDED TERRAIN (manifold - SAME AS MAIN PAGE) ───
      if (terrainParticlesRef.current.length > 0) {
        // Terrain fades in as image particles fade out
        const baseTerrainAlpha = 0.20; // Subtle at start
        const growthAlpha = scrollP < 0.05 
          ? 0 
          : Math.min(0.80, (scrollP - 0.05) / 0.15); // Full by 20% scroll
        const terrainAlpha = baseTerrainAlpha + growthAlpha;
        const terrainOpacity = 0.45; // Same as main page
        
        // Use same vanishing point as main page for terrain
        const terrainCx = width * 0.7;
        
        terrainParticlesRef.current.forEach((p) => {
          // Same Z calculation as main page
          const relZ = p.z - scrollZ;
          
          if (relZ <= 30 || relZ > MAX_DEPTH) return;
          
          const scale = FOCAL / relZ;
          
          // Breathing animation - same as main page
          const breatheX = Math.sin(time * 0.015 + p.phase) * 5;
          const breatheY = Math.cos(time * 0.012 + p.phase * 1.3) * 4;
          
          const screenX = terrainCx + (p.x + breatheX) * scale;
          const screenY = cy + (p.y + breatheY) * scale;
          
          // Bounds check - same as main page
          if (screenX < -150 || screenX > width + 150) return;
          if (screenY < -150 || screenY > height + 150) return;
          
          // Y-culling for terrain (only show in lower portion)
          if (screenY < height * 0.35) return;
          
          // Alpha calculation - same formula as main page
          const normalizedDepth = relZ / MAX_DEPTH;
          const depthAlpha = Math.min(1, (1 - normalizedDepth) * 1.5 + 0.3);
          const proximityBoost = relZ < 1500 ? 1 + (1 - relZ / 1500) * 0.8 : 1;
          const breatheAlphaVal = 0.85 + Math.sin(time * 0.02 + p.phase) * 0.15;
          const finalAlpha = depthAlpha * breatheAlphaVal * terrainAlpha * terrainOpacity * proximityBoost;
          
          if (finalAlpha < 0.02) return;
          
          // Size calculation - same as main page
          const sizeMultiplier = Math.min(2.5, 0.6 + scale * 1.2);
          const size = Math.max(GRID, GRID * sizeMultiplier);
          drawPixel(ctx, screenX, screenY, DAWN_RGB, finalAlpha, size);
        });
      }
      
      // ─── PORTAL HALO EFFECT - Bigger and more prominent ───
      if (scrollP < 0.20) {
        const haloFade = 1 - scrollP / 0.20;
        const pulse = Math.sin(time * 0.025) * 0.3 + 0.7;
        
        // Portal center - shifted right to match key visual
        const portalScale = FOCAL / (400 - cameraZ * 0.3);
        const portalCenterX = cx + 180 * portalScale;
        const portalCenterY = cy - 20 * portalScale;
        
        // More rings, bigger radius
        for (let ring = 0; ring < 8; ring++) {
          const baseRadius = (120 + ring * 60) * (1 + zoomProgress * 1.5);
          const radius = baseRadius * Math.max(0.5, portalScale);
          const alpha = 0.04 * (1 - ring / 8) * pulse * haloFade;
          const points = Math.floor(radius / 2.5);
          
          for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2 + time * 0.004 * (ring % 2 === 0 ? 1 : -1);
            const jitter = Math.sin(time * 0.05 + i) * 3;
            if (Math.random() > 0.5) {
              drawPixel(
                ctx,
                portalCenterX + Math.cos(angle) * (radius + jitter),
                portalCenterY + Math.sin(angle) * (radius + jitter),
                GOLD_RGB,
                alpha
              );
            }
          }
        }
        
        // Inner glow - pulsing center
        const innerGlow = 0.08 * pulse * haloFade;
        for (let i = 0; i < 30; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * 80 * portalScale;
          drawPixel(
            ctx,
            portalCenterX + Math.cos(angle) * dist,
            portalCenterY + Math.sin(angle) * dist,
            GOLD_RGB,
            innerGlow * (1 - dist / (80 * portalScale))
          );
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
  }, [resize, loadImages]);

  return (
    <div className="space-background">
      <canvas ref={canvasRef} className="space-canvas" />
      {isLoading && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "rgba(236, 227, 214, 0.5)",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          letterSpacing: "0.1em",
        }}>
          INITIALIZING GATEWAY...
        </div>
      )}
    </div>
  );
}

// Helper to load images
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

