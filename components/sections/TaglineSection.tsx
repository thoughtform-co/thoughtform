"use client";

import { WaveCanvas } from "@/components/canvas/WaveCanvas";

interface TaglineSectionProps {
  hideDefaultBackground?: boolean;
}

export function TaglineSection({ hideDefaultBackground }: TaglineSectionProps) {
  return (
    <section className="section-spacing-compact relative overflow-hidden">
      {!hideDefaultBackground && <WaveCanvas />}

      <div className="container-narrow relative z-10 text-center">
        <div className="font-mono text-[clamp(1rem,2vw,1.25rem)] tracking-[0.15em] uppercase text-gold">
          Intuition is the Interface
        </div>
      </div>
    </section>
  );
}
