"use client";

import { ThoughtformSigil } from "../ThoughtformSigil";

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

interface HeroBackgroundSigilProps {
  scrollProgress: number;
  config?: SigilConfig;
}

export function HeroBackgroundSigil({ scrollProgress, config }: HeroBackgroundSigilProps) {
  if (config?.enabled === false) {
    return null;
  }

  // Background sigil visible in hero section, fades out as we scroll
  const heroSigilStart = 0;
  const heroSigilEnd = 0.02;

  let sigilOpacity = 1;

  if (scrollProgress >= heroSigilStart && scrollProgress < heroSigilEnd) {
    // Fade out as we scroll
    const fadeOut = scrollProgress / heroSigilEnd;
    sigilOpacity = 1 - fadeOut;
  } else if (scrollProgress >= heroSigilEnd) {
    // Fully faded out
    sigilOpacity = 0;
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        opacity: sigilOpacity,
        pointerEvents: "none",
        zIndex: 0, // Behind gateway (which is zIndex 1)
        transition: "opacity 0.5s ease-out",
      }}
    >
      <ThoughtformSigil
        size={config?.size ?? 500}
        particleCount={config?.particleCount ?? 700}
        color={config?.color ?? "202, 165, 84"}
        scrollProgress={1.0} // Always fully formed
        particleSize={(config?.particleSize ?? 1.0) * 0.8} // Slightly smaller particles for distance effect
        opacity={(config?.opacity ?? 1.0) * 0.6} // Reduced opacity for background/distance
        wanderStrength={config?.wanderStrength ?? 1.0}
        pulseSpeed={config?.pulseSpeed ?? 1.0}
        returnStrength={config?.returnStrength ?? 1.0}
      />
    </div>
  );
}
