"use client";

import { IsometricTopoGridCanvas } from "@/design/isometric/IsometricTopoGridCanvas";
import { ISOMETRIC_SECTIONS } from "@/design/isometric/sections";
import { useLenis } from "@/lib/hooks/useLenis";
import { useMemo } from "react";

export default function IsometricMockupPage() {
  const { scrollProgress } = useLenis();

  const { activeSection, sectionProgress } = useMemo(() => {
    let active = ISOMETRIC_SECTIONS[0];
    let progress = 0;

    for (const s of ISOMETRIC_SECTIONS) {
      if (scrollProgress >= s.range[0]) {
        active = s;
        const [start, end] = s.range;
        const span = Math.max(0.001, end - start);
        progress = Math.min(1, (scrollProgress - start) / span);
      }
    }
    return { activeSection: active, sectionProgress: progress };
  }, [scrollProgress]);

  // Calculate opacity for section marker by index (fade in/out based on scroll)
  const getMarkerOpacityByIndex = (sectionIndex: number) => {
    const section = ISOMETRIC_SECTIONS[sectionIndex];
    if (!section) return 0;

    const [start, end] = section.range;
    const fadeInDuration = 0.08;
    const fadeOutDuration = 0.08;

    // Before section
    if (scrollProgress < start) {
      const fadeStart = start - fadeInDuration;
      if (scrollProgress < fadeStart) return 0;
      return (scrollProgress - fadeStart) / fadeInDuration;
    }

    // During section
    if (scrollProgress <= end) {
      const fadeOutStart = end - fadeOutDuration;
      if (scrollProgress < fadeOutStart) return 1;
      return 1 - (scrollProgress - fadeOutStart) / fadeOutDuration;
    }

    // After section
    return 0;
  };

  return (
    <div className="relative bg-[#050505]">
      {/* Fixed canvas layer */}
      <IsometricTopoGridCanvas scrollProgress={scrollProgress} />

      {/* Scanlines overlay */}
      <div
        className="fixed inset-0 z-30 pointer-events-none opacity-[0.03]"
        style={{
          background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)",
          backgroundSize: "100% 4px",
        }}
      />

      {/* Scroll runway */}
      <div className="relative z-10">
        {ISOMETRIC_SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="h-screen" />
        ))}
        {/* Extra scroll space for final section */}
        <section className="h-[50vh]" />
      </div>

      {/* HUD Section Markers (Gemini-style fade in/out) */}
      <div className="fixed inset-0 z-20 pointer-events-none font-mono">
        {/* Section 0 - Top Left */}
        <div
          className="absolute top-[20%] left-[10%] transition-transform duration-500"
          style={{
            opacity: getMarkerOpacityByIndex(0),
            transform: `translateY(${(1 - getMarkerOpacityByIndex(0)) * 20}px)`,
          }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white m-0 drop-shadow-[0_0_20px_rgba(255,170,0,0.5)]">
            {ISOMETRIC_SECTIONS[0]?.label || "SYSTEM ONLINE"}
          </h1>
          <div className="text-sm md:text-base text-[#ffaa00] mt-2 tracking-wider">
            {ISOMETRIC_SECTIONS[0]?.sublabel || "SECTOR 7G // WIDE VIEW"}
          </div>
        </div>

        {/* Section 1 - Top Right */}
        <div
          className="absolute top-[50%] right-[10%] text-right transition-transform duration-500"
          style={{
            opacity: getMarkerOpacityByIndex(1),
            transform: `translateY(${(1 - getMarkerOpacityByIndex(1)) * 20}px)`,
          }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white m-0 drop-shadow-[0_0_20px_rgba(255,170,0,0.5)]">
            {ISOMETRIC_SECTIONS[1]?.label || "ORBITAL SCAN"}
          </h1>
          <div className="text-sm md:text-base text-[#ffaa00] mt-2 tracking-wider">
            {ISOMETRIC_SECTIONS[1]?.sublabel || "ROTATING 90°"}
          </div>
        </div>

        {/* Section 2 - Bottom Left */}
        <div
          className="absolute top-[70%] left-[10%] transition-transform duration-500"
          style={{
            opacity: getMarkerOpacityByIndex(2),
            transform: `translateY(${(1 - getMarkerOpacityByIndex(2)) * 20}px)`,
          }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white m-0 drop-shadow-[0_0_20px_rgba(255,170,0,0.5)]">
            {ISOMETRIC_SECTIONS[2]?.label || "TARGET ACQUIRED"}
          </h1>
          <div className="text-sm md:text-base text-[#ffaa00] mt-2 tracking-wider">
            {ISOMETRIC_SECTIONS[2]?.sublabel || "CITY CORE F01 // ZOOM 4X"}
          </div>
        </div>

        {/* Section 3 - Center */}
        {ISOMETRIC_SECTIONS.length > 3 && (
          <div
            className="absolute top-[45%] left-1/2 -translate-x-1/2 text-center transition-transform duration-500"
            style={{
              opacity: getMarkerOpacityByIndex(3),
              transform: `translateY(${(1 - getMarkerOpacityByIndex(3)) * 20}px)`,
            }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white m-0 drop-shadow-[0_0_20px_rgba(255,170,0,0.5)]">
              {ISOMETRIC_SECTIONS[3]?.label || "DEEP CORE"}
            </h1>
            <div className="text-sm md:text-base text-[#ffaa00] mt-2 tracking-wider">
              {ISOMETRIC_SECTIONS[3]?.sublabel || "ARTIFACT LOCK // MAXIMUM DETAIL"}
            </div>
          </div>
        )}
      </div>

      {/* Scroll Prompt */}
      <div
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20 text-[#ffaa00] text-xs tracking-[0.2em] font-mono animate-pulse pointer-events-none"
        style={{
          opacity: scrollProgress < 0.1 ? 1 : 0,
          transition: "opacity 0.5s",
        }}
      >
        {"/// INITIALIZING SCROLL SYSTEM ///"}
      </div>

      {/* Debug HUD (top right) */}
      <div className="fixed top-6 right-6 z-20 pointer-events-none font-mono text-right">
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
          Flythrough // {activeSection.label}
        </div>
        <div className="text-[10px] text-white/40 tabular-nums mt-1">
          Scroll {(scrollProgress * 100).toFixed(1)}%
        </div>
        <div className="text-[9px] text-[#ffaa00]/50 tabular-nums mt-1">
          Zoom {(1 + scrollProgress * 3).toFixed(1)}x
        </div>
      </div>

      {/* Bottom label */}
      <div className="fixed bottom-6 left-6 z-20 pointer-events-none font-mono">
        <div className="text-[9px] uppercase tracking-[0.3em] text-white/30">
          Thoughtform.co // Isometric_Manifold_v2
        </div>
      </div>
    </div>
  );
}
