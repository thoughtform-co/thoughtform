"use client";

import { forwardRef, useEffect, useState, useRef } from "react";
import { ThoughtformSigil, type ParticlePosition } from "../ThoughtformSigil";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";

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
  const isMobile = useIsMobile();

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

  // Sigil appears during definition section (0.02 to 0.18), then recedes into the
  // background as a giant "celestial body" during the definition → manifesto morph.
  const sigilInStart = 0.02;
  const sigilInEnd = 0.08;
  const sigilOutStart = 0.15; // Start the celestial recession
  const sigilOutEnd = 0.4; // Fully "in the sky" by manifesto lock-in
  const sigilFadeEnd = 0.72; // Fade away after manifesto settles (keeps the "sky body" present longer)

  let sigilOpacity = 0;
  let sigilScrollProgress = 0;

  // Exit progress: 0 = in front (centered), 1 = fully receded (background)
  let exitProgress = 0;
  // Distant "celestial body": must still read behind the manifold horizon, so keep it bright.
  const backgroundTargetOpacity = isMobile ? 0.32 : 0.58;

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
    // Receding into the sky - become a large, distant "celestial" background body
    exitProgress = (scrollProgress - sigilOutStart) / (sigilOutEnd - sigilOutStart);
    const easedExit = easeOutCubic(exitProgress);

    // Fade from fully present → subtle background presence
    sigilOpacity = 1 - easedExit * (1 - backgroundTargetOpacity);

    // Keep the sigil fully formed (no fold-back) so it reads like a stable celestial body.
    sigilScrollProgress = sigilInEnd;
  } else {
    // After the transition completes, keep the celestial body faintly present, then fade out.
    exitProgress = scrollProgress >= sigilOutEnd ? 1 : 0;
    sigilScrollProgress = sigilInEnd;

    if (scrollProgress < sigilOutEnd) {
      sigilOpacity = 1;
    } else if (scrollProgress >= sigilOutEnd && scrollProgress < sigilFadeEnd) {
      const fade = (scrollProgress - sigilOutEnd) / (sigilFadeEnd - sigilOutEnd);
      sigilOpacity = backgroundTargetOpacity * (1 - fade);
    } else {
      sigilOpacity = 0;
    }
  }

  if (config?.enabled === false) {
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════
  // SIGIL POSITION ANIMATION
  // Entry: Brandmark → Center (during hero→definition transition)
  // Exit: Center → Sky (scale up + blur + low opacity)
  // ═══════════════════════════════════════════════════════════════════
  const sigilSize = config?.size ?? 220;
  const baseScale = isMobile ? 0.7 : 1;
  const isCelestial = exitProgress > 0;

  // Calculate transform based on transition progress and exit progress
  let transformStyle = `translate(-50%, -50%) scale(${baseScale})`; // Default: centered
  let scaleValue = baseScale;

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
  // On mobile: reduce particle counts for performance
  const mobileMultiplier = isMobile ? 0.5 : 1;
  const baseParticleCount = (config?.particleCount ?? 500) * mobileMultiplier;
  const boostParticleCount = Math.floor(
    baseParticleCount + transitionIntensity * 500 * mobileMultiplier
  );

  const baseParticleSize = config?.particleSize ?? 1.0;
  const boostParticleSize = baseParticleSize + transitionIntensity * 1.2;

  const baseOpacity = config?.opacity ?? 1.0;
  const boostOpacity = Math.min(2.0, baseOpacity + transitionIntensity * 1.0);

  // Increase wander strength during transition for more dynamic movement
  const baseWanderStrength = config?.wanderStrength ?? 1.0;
  const boostWanderStrength = baseWanderStrength + transitionIntensity * 2.5;

  // Glow intensity for the container (CSS filter) - STRONGER on desktop, reduced on mobile
  const glowIntensity = transitionIntensity * (isMobile ? 15 : 25);
  // Celestial tuning (independent of hero transitionIntensity)
  const celestialT = isCelestial ? easeOutCubic(exitProgress) : 0;
  const celestialParticleSize = boostParticleSize * (1 - celestialT * (isMobile ? 0.35 : 0.45));
  const celestialOpacity = Math.min(2.6, boostOpacity * (1 + celestialT * 1.4));

  if (exitProgress > 0) {
    // ═══════════════════════════════════════════════════════════════════
    // EXIT ANIMATION: Center → Sky (celestial recession)
    // The sigil scales up and drifts upward, becoming a distant body behind the HUD.
    // If we have the navbar logo position, we bias toward it (without "landing" in it).
    // ═══════════════════════════════════════════════════════════════════
    const easedExit = easeOutCubic(exitProgress);

    // Huge + distant: place it near the manifold horizon (not the navbar).
    const celestialTargetScale = isMobile ? 3.6 : 5.6;
    // Keep it near the horizon line (slightly above center) so it reads as a distant sky body.
    const targetOffsetX = 0;
    const targetOffsetY = -viewportCenter.y * (isMobile ? 0.06 : 0.12);

    // Interpolate from center (0 offset) to sky target offset
    const currentOffsetX = targetOffsetX * easedExit;
    const currentOffsetY = targetOffsetY * easedExit;

    // Scale up to become a huge, distant celestial body
    scaleValue = baseScale * (1 + (celestialTargetScale - 1) * easedExit);

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
    scaleValue = baseScale * (0.3 + 0.7 * easedT);

    // Apply transform
    transformStyle = `translate(calc(-50% + ${currentOffsetX}px), calc(-50% + ${currentOffsetY}px)) scale(${scaleValue})`;
  }

  // Show sparks during early-mid transition (0.05 to 0.7 progress)
  // Disable sparks on mobile for performance
  const sparksActive = !isMobile && transitionProgress > 0.05 && transitionProgress < 0.7;

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
          // Manifold (space-background) is z-index: 0 — to feel distant, we must go behind it.
          zIndex: isCelestial ? -1 : 5,
          mixBlendMode: isCelestial ? "screen" : undefined,
          // Fade the bottom so it feels like it's partially occluded by the horizon.
          WebkitMaskImage: isCelestial
            ? "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 52%, rgba(0,0,0,0) 82%, rgba(0,0,0,0) 100%)"
            : undefined,
          maskImage: isCelestial
            ? "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 52%, rgba(0,0,0,0) 82%, rgba(0,0,0,0) 100%)"
            : undefined,
          filter: (() => {
            if (exitProgress > 0) {
              const easedExit = easeOutCubic(exitProgress);
              const blurPx = (isMobile ? 2.5 : 4.5) * easedExit;
              const halo1 = glowIntensity + (isMobile ? 70 : 130) * easedExit;
              const halo2 = glowIntensity + (isMobile ? 140 : 260) * easedExit;
              const bright = 1 + 0.35 * easedExit;
              return `blur(${blurPx}px) brightness(${bright}) saturate(${1 + 0.15 * easedExit}) drop-shadow(0 0 ${halo1}px rgba(202, 165, 84, 0.85)) drop-shadow(0 0 ${halo2}px rgba(202, 165, 84, 0.25))`;
            }
            if (glowIntensity > 0) {
              return `drop-shadow(0 0 ${glowIntensity}px rgba(202, 165, 84, 0.6))`;
            }
            return undefined;
          })(),
        }}
      >
        <ThoughtformSigil
          size={sigilSize}
          particleCount={boostParticleCount}
          color={config?.color ?? "202, 165, 84"}
          scrollProgress={sigilScrollProgress}
          particleSize={celestialParticleSize}
          opacity={celestialOpacity}
          wanderStrength={boostWanderStrength}
          pulseSpeed={config?.pulseSpeed ?? 1.0}
          returnStrength={config?.returnStrength ?? 1.0}
          onParticlePositions={onParticlePositions}
        />
      </div>
    </>
  );
});
