"use client";

import { useState } from "react";

interface ModuleCardData {
  id: string;
  title: string;
  description: string;
}

const MODULE_CARDS_DATA: ModuleCardData[] = [
  {
    id: "VECTOR_01",
    title: "NAVIGATE",
    description: "Meaning is geometry. Navigate it.",
  },
  {
    id: "VECTOR_02",
    title: "COLLABORATE",
    description: "Tool and partner blur. Develop intuition for both.",
  },
  {
    id: "VECTOR_03",
    title: "BUILD",
    description: "Thought becomes form. Build anything.",
  },
];

interface MobileModuleTabsProps {
  scrollProgress: number;
  transitionProgress: number;
}

export function MobileModuleTabs({ scrollProgress, transitionProgress }: MobileModuleTabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  // Only show during definition section visibility window
  // Show when tHeroToDef > 0.7 (as sigil settles) until scrollProgress > 0.25
  const isVisible = transitionProgress > 0.7 && scrollProgress < 0.25;

  // Calculate opacity for smooth fade in/out
  let opacity = 0;
  if (transitionProgress > 0.7 && transitionProgress < 0.85) {
    opacity = (transitionProgress - 0.7) / 0.15;
  } else if (transitionProgress >= 0.85 && scrollProgress < 0.2) {
    opacity = 1;
  } else if (scrollProgress >= 0.2 && scrollProgress < 0.25) {
    opacity = 1 - (scrollProgress - 0.2) / 0.05;
  }

  if (!isVisible && opacity <= 0) return null;

  return (
    <div
      className="mobile-module-tabs"
      style={{
        opacity,
        visibility: isVisible ? "visible" : "hidden",
        transition: "opacity 0.3s ease, visibility 0.3s ease",
      }}
    >
      {/* Tab headers */}
      <div className="mobile-tabs-header">
        {MODULE_CARDS_DATA.map((card, index) => (
          <button
            key={card.id}
            className={`mobile-tab-button ${activeTab === index ? "active" : ""}`}
            onClick={() => setActiveTab(index)}
          >
            {card.title}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mobile-tabs-content">
        {MODULE_CARDS_DATA.map((card, index) => (
          <div key={card.id} className={`mobile-tab-panel ${activeTab === index ? "active" : ""}`}>
            <h3 className="mobile-tab-title">{card.title}</h3>
            <p className="mobile-tab-desc">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
