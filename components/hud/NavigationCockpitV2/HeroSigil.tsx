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

interface HeroSigilProps {
  scrollProgress: number;
  config?: SigilConfig;
}

export function HeroSigil({ scrollProgress, config }: HeroSigilProps) {
  if (config?.enabled === false) {
    return null;
  }

  // Hero sigil visible from start, fades out as we scroll (0 to 0.02)
  const heroSigilStart = 0;
  const heroSigilEnd = 0.02;

  let sigilOpacity = 1;
  // ThoughtformSigil uses scrollProgress 0.02-0.08 for emergence
  // Pass 0.08+ for fully formed, lower values cause particles to scatter
  let sigilScrollProgress = 0.08; // Start fully formed
  let scale = 1;

  if (scrollProgress >= heroSigilStart && scrollProgress < heroSigilEnd) {
    // Fade out and dissolve as we scroll
    const fadeOut = scrollProgress / heroSigilEnd;
    sigilOpacity = 1 - fadeOut;
    // Particles dissolve/scatter as they flow into gateway
    // Going below 0.02 makes particles scatter (before emergence)
    sigilScrollProgress = 0.08 - fadeOut * 0.07; // From fully formed (0.08) to scattering (0.01)
    scale = 1 - fadeOut * 0.2; // Slight shrink
  } else if (scrollProgress >= heroSigilEnd) {
    // Fully faded out
    sigilOpacity = 0;
    return null;
  }

  return (
    <div
      style={{
        position: "relative",
        opacity: sigilOpacity,
        transform: `scale(${scale})`,
        transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
        pointerEvents: "none",
      }}
    >
      <ThoughtformSigil
        size={config?.size ?? 450}
        particleCount={config?.particleCount ?? 700}
        color={config?.color ?? "202, 165, 84"}
        scrollProgress={sigilScrollProgress}
        particleSize={config?.particleSize ?? 1.2}
        opacity={config?.opacity ?? 1.0}
        wanderStrength={(config?.wanderStrength ?? 1.0) * (1 + (1 - sigilScrollProgress) * 2)}
        pulseSpeed={config?.pulseSpeed ?? 1.0}
        returnStrength={(config?.returnStrength ?? 1.0) * sigilScrollProgress}
      />
    </div>
  );
}
