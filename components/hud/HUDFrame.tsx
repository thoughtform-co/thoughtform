"use client";

import { useMemo, forwardRef } from "react";
import { NavigationBar, NavigationBarHandle } from "./NavigationBar";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";

interface SectionData {
  sector: string;
  depth: number;
  vector: string;
  signal: number;
  landmark: number;
}

const sectionData: Record<string, SectionData> = {
  hero: {
    sector: "Origin",
    depth: 0.0,
    vector: "Entry",
    signal: 61,
    landmark: 1,
  },
  definition: {
    sector: "Definition",
    depth: 1.8,
    vector: "Discovery",
    signal: 68,
    landmark: 2,
  },
  manifesto: {
    sector: "Manifesto",
    depth: 3.8,
    vector: "Creative",
    signal: 74,
    landmark: 3,
  },
  services: {
    sector: "Services",
    depth: 5.8,
    vector: "Strategic",
    signal: 88,
    landmark: 4,
  },
  contact: {
    sector: "Contact",
    depth: 9.2,
    vector: "Destination",
    signal: 95,
    landmark: 5,
  },
};

interface HUDFrameProps {
  activeSection: string;
  scrollProgress: number;
  onNavigate: (sectionId: string) => void;
}

// Re-export NavigationBarHandle for convenience
export type { NavigationBarHandle };

export const HUDFrame = forwardRef<NavigationBarHandle, HUDFrameProps>(function HUDFrame(
  { activeSection, scrollProgress, onNavigate },
  ref
) {
  const isMobile = useIsMobile();

  // Compute HUD state directly from props (no useState to avoid loops)
  const hudState = useMemo(() => {
    const p = scrollProgress;
    const section = sectionData[activeSection] || sectionData.hero;

    let instruction = "Scroll to descend. The window stays. The world changes.";
    if (p < 0.1) {
      instruction = "Scroll to descend. The window stays. The world changes.";
    } else if (p < 0.25) {
      instruction = "Defining thoughtform. Calibrating understanding.";
    } else if (p < 0.45) {
      instruction = "Entering the manifesto. Recalibrating perspective.";
    } else if (p < 0.7) {
      instruction = "Navigation services detected. Plotting course.";
    } else if (p < 0.9) {
      instruction = "Approaching destination. Signal strengthening.";
    } else {
      instruction = "Arrival imminent. Initiating contact protocols.";
    }

    return {
      sector: section.sector,
      depth: (p * 7.5).toFixed(1),
      vector: section.vector,
      signal: `${section.signal}%`,
      delta: (0.27 + p * 0.5).toFixed(2),
      theta: (58.1 + p * 30).toFixed(1) + "°",
      rho: (0.63 + p * 0.3).toFixed(2),
      zeta: (2.4 + p * 7).toFixed(1),
      instruction,
    };
  }, [scrollProgress, activeSection]);

  // HUD visibility - always visible, with subtle fade for emphasis on scroll
  const hudOpacity = scrollProgress < 0.05 ? 0.6 : Math.min(1, 0.6 + (scrollProgress - 0.05) * 4);
  const showHUD = true;

  // Generate tick marks
  const tickCount = 20;
  const tickLabels: Record<number, string> = {
    0: "0",
    5: "2",
    10: "5",
    15: "7",
    20: "10",
  };

  const sectionMarkers = [
    { section: "hero", label: "01" },
    { section: "definition", label: "02" },
    { section: "services", label: "03" },
    { section: "manifesto", label: "04" },
    { section: "contact", label: "05" },
  ];

  return (
    <div className="hud-frame">
      {/* Top Navigation Bar - Brandworld Specification */}
      <NavigationBar ref={ref} activeSection={activeSection} onNavigate={onNavigate} />

      {/* Corner Brackets - Gold L-shapes */}
      {showHUD && (
        <>
          <div className="hud-corner hud-corner-tl" style={{ opacity: hudOpacity }} />
          <div className="hud-corner hud-corner-tr" style={{ opacity: hudOpacity }} />
          <div className="hud-corner hud-corner-bl" style={{ opacity: hudOpacity }} />
          <div className="hud-corner hud-corner-br" style={{ opacity: hudOpacity }} />
        </>
      )}

      {/* Left Rail: Depth Scale */}
      {showHUD && (
        <aside className="hud-rail hud-rail-left" style={{ opacity: hudOpacity }}>
          <div className="rail-scale">
            <div className="scale-ticks">
              {Array.from({ length: tickCount + 1 }).map((_, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <div className={`tick ${i % 5 === 0 ? "tick-major" : "tick-minor"}`} />
                  {tickLabels[i] && !isMobile && (
                    <span
                      className="tick-label"
                      style={{
                        position: "absolute",
                        top: "-4px",
                        left: "28px",
                      }}
                    >
                      {tickLabels[i]}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="scale-indicator" style={{ top: `${scrollProgress * 100}%` }} />
          </div>
        </aside>
      )}

      {/* Right Rail: Section Markers */}
      {showHUD && (
        <aside className="hud-rail hud-rail-right" style={{ opacity: hudOpacity }}>
          <div className="rail-scale">
            <div className="scale-ticks">
              {Array.from({ length: tickCount + 1 }).map((_, i) => (
                <div key={i} className={`tick ${i % 5 === 0 ? "tick-major" : "tick-minor"}`} />
              ))}
            </div>
          </div>
          <div className="rail-markers">
            {sectionMarkers.map((marker) => {
              const sectionOrder = Object.keys(sectionData);
              const isActive = marker.section === activeSection;
              const isPast =
                sectionOrder.indexOf(marker.section) <= sectionOrder.indexOf(activeSection);
              return (
                <div
                  key={marker.section}
                  className={`section-marker ${isActive || isPast ? "active" : ""}`}
                  data-section={marker.section}
                  onClick={() => onNavigate(marker.section)}
                >
                  <span className="marker-dot" />
                  {!isMobile && <span className="marker-label">{marker.label}</span>}
                </div>
              );
            })}
          </div>
        </aside>
      )}

      {/* Bottom Bar: Full coords on desktop, instruction only on mobile */}
      {showHUD && (
        <footer className="hud-bottom" style={{ opacity: hudOpacity }}>
          {!isMobile && (
            <div className="hud-coords">
              <span className="coord">
                δ: <span>{hudState.delta}</span>
              </span>
              <span className="coord">
                θ: <span>{hudState.theta}</span>
              </span>
              <span className="coord">
                ρ: <span>{hudState.rho}</span>
              </span>
              <span className="coord">
                ζ: <span>{hudState.zeta}</span>
              </span>
            </div>
          )}
          <div className="hud-instruction">
            <span>{hudState.instruction}</span>
          </div>
        </footer>
      )}
    </div>
  );
});
