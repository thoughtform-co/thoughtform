"use client";

import { useRef, forwardRef } from "react";
import { ThoughtformSigil, type ParticlePosition } from "../ThoughtformSigil";

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
}

export const SigilSection = forwardRef<HTMLDivElement, SigilSectionProps>(function SigilSection(
  { scrollProgress, config, onParticlePositions },
  ref
) {
  // Sigil appears during definition section (0.02 to 0.25), fades out after
  const sigilInStart = 0.02;
  const sigilInEnd = 0.08;
  const sigilOutStart = 0.25;
  const sigilOutEnd = 0.35;

  let sigilOpacity = 0;
  let sigilScrollProgress = 0;

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
    // Fading out after definition section
    const fadeOut = (scrollProgress - sigilOutStart) / (sigilOutEnd - sigilOutStart);
    sigilOpacity = 1 - fadeOut;
    // Reverse the emergence animation by going backwards through the range
    sigilScrollProgress = sigilInEnd - fadeOut * (sigilInEnd - sigilInStart);
  } else {
    // After fade out
    sigilOpacity = 0;
    sigilScrollProgress = sigilInStart;
  }

  if (config?.enabled === false) {
    return null;
  }

  return (
    <div
      ref={ref}
      className="fixed-sigil-container"
      style={{
        opacity: sigilOpacity,
        pointerEvents: "none",
      }}
    >
      <ThoughtformSigil
        size={config?.size ?? 220}
        particleCount={config?.particleCount ?? 500}
        color={config?.color ?? "202, 165, 84"}
        scrollProgress={sigilScrollProgress}
        particleSize={config?.particleSize ?? 1.0}
        opacity={config?.opacity ?? 1.0}
        wanderStrength={config?.wanderStrength ?? 1.0}
        pulseSpeed={config?.pulseSpeed ?? 1.0}
        returnStrength={config?.returnStrength ?? 1.0}
        onParticlePositions={onParticlePositions}
      />
    </div>
  );
});
