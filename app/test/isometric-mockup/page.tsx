"use client";

import { IsometricTopoGridCanvas } from "@/design/isometric/IsometricTopoGridCanvas";
import { ISOMETRIC_SECTIONS } from "@/design/isometric/sections";
import { useLenis } from "@/lib/hooks/useLenis";
import { useMemo } from "react";

export default function IsometricMockupPage() {
  const { scrollProgress } = useLenis();
  const activeSection = useMemo(() => {
    let active = ISOMETRIC_SECTIONS[0];
    for (const s of ISOMETRIC_SECTIONS) {
      if (scrollProgress >= s.range[0]) active = s;
    }
    return active;
  }, [scrollProgress]);

  return (
    <div className="relative bg-[#0a0908]">
      {/* Fixed canvas layer (does not affect page scroll height) */}
      <IsometricTopoGridCanvas scrollProgress={scrollProgress} />

      {/* Scroll runway (one viewport per section) */}
      <div className="relative z-10">
        {ISOMETRIC_SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="h-screen" />
        ))}
      </div>

      {/* Debug HUD (visible, but non-interactive) */}
      <div className="fixed top-6 right-6 z-20 pointer-events-none font-mono text-right">
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
          Flythrough // {activeSection.label}
        </div>
        <div className="text-[10px] text-white/40 tabular-nums mt-1">
          Scroll {(scrollProgress * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
