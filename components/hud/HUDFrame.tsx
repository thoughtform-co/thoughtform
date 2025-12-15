"use client";

import { useMemo } from "react";
import { NavigationBar } from "./NavigationBar";

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
  manifesto: {
    sector: "Manifesto",
    depth: 2.4,
    vector: "Creative",
    signal: 74,
    landmark: 2,
  },
  services: {
    sector: "Services",
    depth: 5.8,
    vector: "Strategic",
    signal: 88,
    landmark: 3,
  },
  contact: {
    sector: "Contact",
    depth: 9.2,
    vector: "Destination",
    signal: 95,
    landmark: 4,
  },
};

interface HUDFrameProps {
  activeSection: string;
  scrollProgress: number;
  onNavigate: (sectionId: string) => void;
}

export function HUDFrame({
  activeSection,
  scrollProgress,
  onNavigate,
}: HUDFrameProps) {
  // Compute HUD state directly from props (no useState to avoid loops)
  const hudState = useMemo(() => {
    const p = scrollProgress;
    const section = sectionData[activeSection] || sectionData.hero;

    let instruction = "Scroll to descend. The window stays. The world changes.";
    if (p < 0.1) {
      instruction = "Scroll to descend. The window stays. The world changes.";
    } else if (p < 0.3) {
      instruction = "Entering the manifesto. Recalibrating perspective.";
    } else if (p < 0.6) {
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

  // HUD visibility based on scroll - hidden in hero section
  // Start fading in after 5% scroll, fully visible at 15%
  const hudOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.05) / 0.1));
  const showHUD = scrollProgress > 0.02;

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
    { section: "manifesto", label: "02" },
    { section: "services", label: "03" },
    { section: "contact", label: "04" },
  ];

  return (
    <div className="hud-frame">
      {/* Top Navigation Bar - Brandworld Specification */}
      <NavigationBar activeSection={activeSection} onNavigate={onNavigate} />

      {/* Corner Brackets - Gold L-shapes (hidden in hero) */}
      {showHUD && (
        <>
          <div className="hud-corner hud-corner-tl" style={{ opacity: hudOpacity }} />
          <div className="hud-corner hud-corner-tr" style={{ opacity: hudOpacity }} />
          <div className="hud-corner hud-corner-bl" style={{ opacity: hudOpacity }} />
          <div className="hud-corner hud-corner-br" style={{ opacity: hudOpacity }} />
        </>
      )}

      {/* Left Rail: Depth Scale (hidden in hero) */}
      {showHUD && (
        <aside className="hud-rail hud-rail-left" style={{ opacity: hudOpacity }}>
          <div className="rail-scale">
            <div className="scale-ticks">
              {Array.from({ length: tickCount + 1 }).map((_, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <div
                    className={`tick ${i % 5 === 0 ? "tick-major" : "tick-minor"}`}
                  />
                  {tickLabels[i] && (
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
            <div
              className="scale-indicator"
              style={{ top: `${scrollProgress * 100}%` }}
            />
          </div>
          <div className="rail-readouts">
            <div className="readout">
              <span className="readout-value">
                {hudState.depth}
                <span className="readout-unit">km</span>
              </span>
            </div>
            <div className="readout">
              <span className="readout-label">Vector</span>
              <span className="readout-value">{hudState.vector}</span>
            </div>
          </div>
        </aside>
      )}

      {/* Right Rail: Section Markers (hidden in hero) */}
      {showHUD && (
        <aside className="hud-rail hud-rail-right" style={{ opacity: hudOpacity }}>
          <div className="rail-scale">
            <div className="scale-ticks">
              {Array.from({ length: tickCount + 1 }).map((_, i) => (
                <div
                  key={i}
                  className={`tick ${i % 5 === 0 ? "tick-major" : "tick-minor"}`}
                />
              ))}
            </div>
          </div>
          <div className="rail-markers">
            {sectionMarkers.map((marker) => {
              const sectionOrder = Object.keys(sectionData);
              const isActive = marker.section === activeSection;
              const isPast =
                sectionOrder.indexOf(marker.section) <=
                sectionOrder.indexOf(activeSection);
              return (
                <div
                  key={marker.section}
                  className={`section-marker ${isActive || isPast ? "active" : ""}`}
                  data-section={marker.section}
                  onClick={() => onNavigate(marker.section)}
                >
                  <span className="marker-dot" />
                  <span className="marker-label">{marker.label}</span>
                </div>
              );
            })}
          </div>
        </aside>
      )}

      {/* Bottom Bar: Coordinates + Progress (hidden in hero) */}
      {showHUD && (
        <footer className="hud-bottom" style={{ opacity: hudOpacity }}>
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
          <div className="hud-instruction">
            <span>{hudState.instruction}</span>
          </div>
        </footer>
      )}
    </div>
  );
}
