"use client";

import { forwardRef, useEffect, useState, useRef } from "react";
import { ThoughtformSigil, type ParticlePosition } from "../ThoughtformSigil";

// Spark particle for transition effect
// ═══════════════════════════════════════════════════════════════════
// TRANSITION PARTICLE SYSTEM
// Uses Thoughtform brand particle aesthetic: GRID=3, fillRect, organic noise
// Particles disperse from brandmark and flow toward sigil center
// ═══════════════════════════════════════════════════════════════════

const GRID = 3; // Sacred Thoughtform grid unit

interface TransitionParticle {
  x: number;
  y: number;
  baseX: number; // Origin position
  baseY: number;
  targetX: number; // Target position
  targetY: number;
  progress: number; // 0 = at origin, 1 = at target
  phase: number; // For noise offset
  speed: number;
  size: number;
  alpha: number;
  noiseOffsetX: number;
  noiseOffsetY: number;
  wanderStrength: number;
  emergeDelay: number; // Staggered emergence
}

// Noise function for organic movement (from ThoughtformSigil)
function noise2D(x: number, y: number, time: number): number {
  const sin1 = Math.sin(x * 0.05 + time * 0.001);
  const sin2 = Math.sin(y * 0.05 + time * 0.0015);
  const sin3 = Math.sin((x + y) * 0.03 + time * 0.0008);
  return (sin1 + sin2 + sin3) / 3;
}

// Transition particles canvas - Thoughtform brand aesthetic
function TransitionSparks({
  active,
  intensity,
  originX,
  originY,
  targetX,
  targetY,
  progress,
}: {
  active: boolean;
  intensity: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  progress: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<TransitionParticle[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const initializedRef = useRef(false);

  // Initialize particles once when transition starts
  useEffect(() => {
    if (!active || initializedRef.current) return;
    initializedRef.current = true;

    // Create particles that will travel from origin to target
    const particleCount = 150;
    const particles: TransitionParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      // Spawn in a dispersed pattern around the origin (brandmark area)
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 80;
      const spawnX = originX + Math.cos(angle) * radius;
      const spawnY = originY + Math.sin(angle) * radius;

      particles.push({
        x: spawnX,
        y: spawnY,
        baseX: spawnX,
        baseY: spawnY,
        targetX: targetX + (Math.random() - 0.5) * 150,
        targetY: targetY + (Math.random() - 0.5) * 150,
        progress: 0,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.7,
        size: GRID * (0.8 + Math.random() * 0.6),
        alpha: 0.4 + Math.random() * 0.5,
        noiseOffsetX: Math.random() * 1000,
        noiseOffsetY: Math.random() * 1000,
        wanderStrength: 15 + Math.random() * 25,
        emergeDelay: Math.random() * 0.3, // Stagger emergence
      });
    }

    particlesRef.current = particles;
  }, [active, originX, originY, targetX, targetY]);

  // Reset when transition ends
  useEffect(() => {
    if (!active) {
      initializedRef.current = false;
      particlesRef.current = [];
    }
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const setupCanvas = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    setupCanvas();

    const handleResize = () => {
      setupCanvas();
    };
    window.addEventListener("resize", handleResize);

    const animate = () => {
      const time = timeRef.current;

      // Clear with subtle trail (motion blur effect)
      ctx.fillStyle = "rgba(5, 4, 3, 0.15)";
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      if (active && particlesRef.current.length > 0) {
        particlesRef.current.forEach((particle) => {
          // Calculate this particle's emergence based on global progress
          const adjustedProgress = Math.max(
            0,
            (progress - particle.emergeDelay) / (1 - particle.emergeDelay)
          );
          const easedProgress = easeOutCubic(Math.min(1, adjustedProgress));

          // Update particle progress toward target
          particle.progress = easedProgress;

          // Interpolate position from origin to target
          const baseX = particle.baseX + (particle.targetX - particle.baseX) * particle.progress;
          const baseY = particle.baseY + (particle.targetY - particle.baseY) * particle.progress;

          // Add organic noise-based wandering (Thoughtform style)
          const noiseX = noise2D(particle.noiseOffsetX, time * 0.1, time) * particle.wanderStrength;
          const noiseY =
            noise2D(particle.noiseOffsetY, time * 0.1 + 100, time) * particle.wanderStrength;

          // Reduce wander as particles approach target
          const wanderFactor = 1 - particle.progress * 0.7;

          particle.x = baseX + noiseX * wanderFactor;
          particle.y = baseY + noiseY * wanderFactor;

          // Alpha: fade in at start, fade out at end
          let alpha = particle.alpha * intensity;
          if (particle.progress < 0.2) {
            alpha *= particle.progress / 0.2; // Fade in
          } else if (particle.progress > 0.8) {
            alpha *= (1 - particle.progress) / 0.2; // Fade out
          }

          // Pulsing
          const pulse = 1 + Math.sin(time * 0.05 + particle.phase) * 0.15;
          alpha *= pulse;

          // Skip invisible particles
          if (alpha < 0.01) return;

          // Occasional glitch displacement (Thoughtform style)
          let glitchX = 0,
            glitchY = 0;
          if (Math.random() < 0.003) {
            glitchX = (Math.random() - 0.5) * GRID * 4;
            glitchY = (Math.random() - 0.5) * GRID * 2;
          }

          // Grid snap (SACRED RULE)
          const px = Math.floor((particle.x + glitchX) / GRID) * GRID;
          const py = Math.floor((particle.y + glitchY) / GRID) * GRID;

          // Draw as grid-snapped square (Thoughtform aesthetic)
          ctx.fillStyle = `rgba(202, 165, 84, ${alpha})`; // Tensor Gold
          ctx.fillRect(px, py, particle.size, particle.size);
        });
      }

      timeRef.current++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [active, intensity, progress]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 15,
        opacity: active ? 1 : 0,
        transition: "opacity 0.3s ease-out",
      }}
    />
  );
}

interface SigilConfig {
  enabled?: boolean;
  size?: number;
  particleCount?: number;
  color?: string;
  particleSize?: number;
  opacity?: number;
  wanderStrength?: number;
  pulseSpeed?: number;
  returnStrength?: number;
}

interface SigilSectionProps {
  scrollProgress: number;
  config?: SigilConfig;
  onParticlePositions: React.MutableRefObject<ParticlePosition[]>;
  /** Origin position for brandmark-to-sigil animation (screen coordinates) */
  originPos?: { x: number; y: number } | null;
  /** Destination position for sigil-to-navbar animation when leaving definition section */
  destinationPos?: { x: number; y: number; width: number; height: number } | null;
  /** Hero→Definition transition progress (0-1) for positioning animation */
  transitionProgress?: number;
}

// Easing function for smooth animation
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export const SigilSection = forwardRef<HTMLDivElement, SigilSectionProps>(function SigilSection(
  {
    scrollProgress,
    config,
    onParticlePositions,
    originPos,
    destinationPos,
    transitionProgress = 0,
  },
  ref
) {
  // Track viewport center for animation
  const [viewportCenter, setViewportCenter] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateCenter = () => {
      setViewportCenter({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
    };
    updateCenter();
    window.addEventListener("resize", updateCenter);
    return () => window.removeEventListener("resize", updateCenter);
  }, []);

  // Sigil appears during definition section (0.02 to 0.18), then moves to navbar logo
  const sigilInStart = 0.02;
  const sigilInEnd = 0.08;
  const sigilOutStart = 0.15; // Start moving toward navbar
  const sigilOutEnd = 0.3; // Complete arrival at navbar (slower animation)

  let sigilOpacity = 0;
  let sigilScrollProgress = 0;

  // Exit progress: 0 = at center, 1 = at navbar logo
  let exitProgress = 0;

  if (scrollProgress < sigilInStart) {
    // Before sigil appears
    sigilOpacity = 0;
    sigilScrollProgress = 0;
  } else if (scrollProgress >= sigilInStart && scrollProgress < sigilInEnd) {
    // Fading in during definition section
    const fadeIn = (scrollProgress - sigilInStart) / (sigilInEnd - sigilInStart);
    sigilOpacity = fadeIn;
    // Map to the emergence range that ThoughtformSigil expects (0.02 to 0.08)
    sigilScrollProgress = sigilInStart + fadeIn * (sigilInEnd - sigilInStart);
  } else if (scrollProgress >= sigilInEnd && scrollProgress < sigilOutStart) {
    // Fully visible in definition section
    sigilOpacity = 1;
    sigilScrollProgress = sigilInEnd; // Fully formed
  } else if (scrollProgress >= sigilOutStart && scrollProgress < sigilOutEnd) {
    // Moving toward navbar logo - stay visible until nearly at destination
    exitProgress = (scrollProgress - sigilOutStart) / (sigilOutEnd - sigilOutStart);
    const easedExit = easeOutCubic(exitProgress);

    // Keep opacity at 1 for 98% of movement, only fade in final 2%
    // This ensures particles are visible until they're fully inside the navbar icon
    sigilOpacity = exitProgress < 0.98 ? 1 : 1 - (exitProgress - 0.98) / 0.02;

    // Reverse the emergence animation as it moves - particles fold back
    sigilScrollProgress = sigilInEnd - easedExit * (sigilInEnd - sigilInStart);
  } else {
    // After arriving at navbar
    sigilOpacity = 0;
    sigilScrollProgress = sigilInStart;
    exitProgress = 1;
  }

  if (config?.enabled === false) {
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════
  // SIGIL POSITION ANIMATION
  // Entry: Brandmark → Center (during hero→definition transition)
  // Exit: Center → Navbar Logo (when leaving definition section)
  // ═══════════════════════════════════════════════════════════════════
  const sigilSize = config?.size ?? 220;
  const navbarLogoSize = destinationPos?.width ?? 22;

  // Calculate transform based on transition progress and exit progress
  let transformStyle = "translate(-50%, -50%)"; // Default: centered
  let scaleValue = 1;

  // ═══════════════════════════════════════════════════════════════════
  // ENHANCED TRANSITION EFFECTS
  // Boost particle count, size, and brightness during transition
  // Peak intensity EARLY in the transition (when leaving brandmark)
  // ═══════════════════════════════════════════════════════════════════

  // Calculate transition intensity - STRONGEST at the START (0.1-0.4 range)
  // This makes the "burst" from the brandmark most visible
  let transitionIntensity = 0;
  if (transitionProgress < 0.1) {
    transitionIntensity = transitionProgress * 10; // Ramp up 0-1
  } else if (transitionProgress < 0.4) {
    transitionIntensity = 1; // Full intensity during early transition
  } else if (transitionProgress < 0.7) {
    transitionIntensity = 1 - (transitionProgress - 0.4) / 0.3; // Fade out
  } else {
    transitionIntensity = 0;
  }

  // Boost values during transition for more dramatic effect
  const baseParticleCount = config?.particleCount ?? 500;
  const boostParticleCount = Math.floor(baseParticleCount + transitionIntensity * 500); // Up to 1000 particles at peak

  const baseParticleSize = config?.particleSize ?? 1.0;
  const boostParticleSize = baseParticleSize + transitionIntensity * 1.2; // Up to 2.2x size at peak

  const baseOpacity = config?.opacity ?? 1.0;
  const boostOpacity = Math.min(2.0, baseOpacity + transitionIntensity * 1.0); // Up to 2x brightness at peak

  // Increase wander strength during transition for more dynamic movement
  const baseWanderStrength = config?.wanderStrength ?? 1.0;
  const boostWanderStrength = baseWanderStrength + transitionIntensity * 2.5; // More energetic particle movement

  // Glow intensity for the container (CSS filter) - STRONGER
  const glowIntensity = transitionIntensity * 25; // 0 to 25px blur at peak

  if (exitProgress > 0 && destinationPos) {
    // ═══════════════════════════════════════════════════════════════════
    // EXIT ANIMATION: Center → Navbar Logo
    // Sigil moves from viewport center to navbar logo position
    // ═══════════════════════════════════════════════════════════════════
    const easedExit = easeOutCubic(exitProgress);

    // Calculate offset from center to navbar logo
    const destOffsetX = destinationPos.x - viewportCenter.x;
    const destOffsetY = destinationPos.y - viewportCenter.y;

    // Interpolate from center (0 offset) to destination offset
    const currentOffsetX = destOffsetX * easedExit;
    const currentOffsetY = destOffsetY * easedExit;

    // Scale: shrink from full (1) to navbar logo size ratio
    // Final scale should match navbar logo size
    const targetScale = navbarLogoSize / sigilSize;
    scaleValue = 1 - (1 - targetScale) * easedExit;

    // Apply transform
    transformStyle = `translate(calc(-50% + ${currentOffsetX}px), calc(-50% + ${currentOffsetY}px)) scale(${scaleValue})`;
  } else if (originPos && transitionProgress < 1) {
    // ═══════════════════════════════════════════════════════════════════
    // ENTRY ANIMATION: Brandmark → Center
    // ═══════════════════════════════════════════════════════════════════
    const easedT = easeOutCubic(transitionProgress);

    // Calculate offset from center to origin
    const originOffsetX = originPos.x - viewportCenter.x;
    const originOffsetY = originPos.y - viewportCenter.y;

    // Interpolate from origin offset to center (0 offset)
    const currentOffsetX = originOffsetX * (1 - easedT);
    const currentOffsetY = originOffsetY * (1 - easedT);

    // Scale: start small (0.3) at brandmark, grow to full (1) at center
    scaleValue = 0.3 + 0.7 * easedT;

    // Apply transform
    transformStyle = `translate(calc(-50% + ${currentOffsetX}px), calc(-50% + ${currentOffsetY}px)) scale(${scaleValue})`;
  }

  // Show sparks during early-mid transition (0.05 to 0.7 progress)
  const sparksActive = transitionProgress > 0.05 && transitionProgress < 0.7;

  // Get origin position (brandmark) or fallback to a reasonable default
  const sparkOriginX = originPos?.x ?? viewportCenter.x - 200;
  const sparkOriginY = originPos?.y ?? viewportCenter.y - 100;

  return (
    <>
      {/* Transition spark particles - emanate from brandmark origin */}
      <TransitionSparks
        active={sparksActive}
        intensity={transitionIntensity}
        originX={sparkOriginX}
        originY={sparkOriginY}
        targetX={viewportCenter.x}
        targetY={viewportCenter.y}
        progress={transitionProgress}
      />

      <div
        ref={ref}
        className="fixed-sigil-container"
        style={{
          opacity: sigilOpacity,
          pointerEvents: "none",
          transform: transformStyle,
          transformOrigin: "center center",
          filter:
            glowIntensity > 0
              ? `drop-shadow(0 0 ${glowIntensity}px rgba(202, 165, 84, 0.6))`
              : undefined,
        }}
      >
        <ThoughtformSigil
          size={sigilSize}
          particleCount={boostParticleCount}
          color={config?.color ?? "202, 165, 84"}
          scrollProgress={sigilScrollProgress}
          particleSize={boostParticleSize}
          opacity={boostOpacity}
          wanderStrength={boostWanderStrength}
          pulseSpeed={config?.pulseSpeed ?? 1.0}
          returnStrength={config?.returnStrength ?? 1.0}
          onParticlePositions={onParticlePositions}
        />
      </div>
    </>
  );
});
