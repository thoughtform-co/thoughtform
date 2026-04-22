"use client";

import { useState, useEffect } from "react";
import { ThoughtformSigil } from "@/components/particles/ThoughtformSigil";

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
  const [mounted, setMounted] = useState(false);

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    if (mq.matches) {
      setMounted(true);
      return;
    }
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (config?.enabled === false) {
    return null;
  }

  // Background sigil visible in hero section, fades out as we scroll
  const heroSigilStart = 0;
  const heroSigilEnd = 0.02;

  let sigilOpacity = 1;

  if (scrollProgress >= heroSigilStart && scrollProgress < heroSigilEnd) {
    const fadeOut = scrollProgress / heroSigilEnd;
    sigilOpacity = 1 - fadeOut;
  } else if (scrollProgress >= heroSigilEnd) {
    sigilOpacity = 0;
    return null;
  }

  const mountScale = mounted ? 1 : 0.7;
  const mountBlur = mounted ? 1 : 3;

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${reducedMotion ? 1 : mountScale})`,
        opacity: sigilOpacity * (reducedMotion || mounted ? 1 : 0),
        pointerEvents: "none",
        zIndex: -1,
        transition: reducedMotion
          ? "none"
          : "transform 1.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.2s ease-out, filter 1.4s ease-out",
        filter: reducedMotion ? "blur(1px)" : `blur(${mountBlur}px)`,
      }}
    >
      <ThoughtformSigil
        size={config?.size ?? 500}
        particleCount={config?.particleCount ?? 700}
        color={config?.color ?? "202, 165, 84"}
        scrollProgress={1.0} // Always fully formed
        particleSize={(config?.particleSize ?? 1.0) * 0.7} // Smaller particles for greater distance
        opacity={(config?.opacity ?? 1.0) * 0.4} // Further reduced opacity for deep background
        wanderStrength={config?.wanderStrength ?? 1.0}
        pulseSpeed={config?.pulseSpeed ?? 1.0}
        returnStrength={config?.returnStrength ?? 1.0}
      />
    </div>
  );
}
