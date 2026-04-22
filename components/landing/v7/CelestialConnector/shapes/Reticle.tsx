import type { ReticleConfig } from "@/lib/celestial/schema";

interface ReticleProps {
  config: ReticleConfig;
}

export function Reticle({ config }: ReticleProps) {
  return (
    <>
      {config.crosshair && (
        <g stroke="var(--gold)" strokeOpacity="0.4" strokeWidth="0.5">
          <path d="M-56 0 L-18 0" />
          <path d="M18 0 L56 0" />
          <path d="M0 -56 L0 -18" />
          <path d="M0 18 L0 56" />
        </g>
      )}
      <g>
        <circle r={14} fill="var(--void)" stroke="var(--gold)" strokeWidth="0.6" />
        {config.centerShape === "diamond" && (
          <path d="M0 -7 L7 0 L0 7 L-7 0 Z" fill="var(--gold)" />
        )}
        {config.centerShape === "dot" && <circle r={4} fill="var(--gold)" />}
        {config.centerShape === "ring" && (
          <circle r={7} stroke="var(--gold)" strokeWidth="0.8" fill="none" />
        )}
      </g>
    </>
  );
}
