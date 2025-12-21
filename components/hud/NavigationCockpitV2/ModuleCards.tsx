"use client";

import { forwardRef } from "react";

interface ModuleCardProps {
  id: string;
  title: string;
  description: string;
}

interface ModuleCardsProps {
  scrollProgress: number;
  /** Hero→Definition transition progress (0-1) for timing */
  transitionProgress?: number;
  cardRefs: React.RefObject<HTMLDivElement>[];
}

const MODULE_CARDS_DATA: ModuleCardProps[] = [
  {
    id: "VECTOR_01",
    title: "NAVIGATE",
    description:
      "Chart a course through the latent space. Identify high-value coordinates amidst the noise.",
  },
  {
    id: "VECTOR_02",
    title: "COLLABORATE",
    description:
      "Force the model away from the average. Displace the probable to find the exceptional.",
  },
  {
    id: "VECTOR_03",
    title: "BUILD",
    description:
      "Errors are not bugs; they are creative vectors. Use the glitch to break linear thinking.",
  },
];

export const ModuleCards = forwardRef<HTMLDivElement, ModuleCardsProps>(function ModuleCards(
  { scrollProgress, transitionProgress, cardRefs },
  ref
) {
  // Use transitionProgress if provided, otherwise fall back to legacy scrollProgress timing
  let opacity: number;
  let isVisible: boolean;
  let isInteractive: boolean;

  if (transitionProgress !== undefined) {
    // New timing: appear when tHeroToDef > 0.7 (as sigil settles)
    // Fade in from t=0.7 to t=0.85, then close inward (no fade) as we scroll to next section
    const t = transitionProgress;
    // Close starts at scrollProgress 0.15, completes by 0.30 (slower to match sigil)
    const closeStart = 0.15;
    const closeEnd = 0.3;
    if (scrollProgress < closeStart) {
      // Still in definition section - normal visibility (fade in only)
      opacity = t < 0.7 ? 0 : t < 0.85 ? (t - 0.7) / 0.15 : 1;
      isVisible = t >= 0.7;
    } else if (scrollProgress >= closeStart && scrollProgress < closeEnd) {
      // Closing inward - NO fade, keep opacity at 1, only clipPath will close
      opacity = t < 0.7 ? 0 : t < 0.85 ? (t - 0.7) / 0.15 : 1; // Keep full opacity
      isVisible = t >= 0.7;
    } else {
      // Fully closed - hide completely
      opacity = 0;
      isVisible = false;
    }
    isInteractive = t >= 0.85 && scrollProgress <= closeStart;
  } else {
    // Legacy timing
    opacity =
      scrollProgress < 0.08
        ? 0
        : scrollProgress < 0.18
          ? 1
          : Math.max(0, 1 - (scrollProgress - 0.18) * 8);
    isVisible = scrollProgress >= 0.08;
    isInteractive = scrollProgress <= 0.25 && scrollProgress >= 0.08;
  }

  // Calculate close progress for inward collapse effect (slower to match sigil)
  const closeStartCalc = 0.15;
  const closeEndCalc = 0.3;
  const closeProgress =
    scrollProgress >= closeStartCalc
      ? Math.min(1, (scrollProgress - closeStartCalc) / (closeEndCalc - closeStartCalc))
      : 0;

  return (
    <div
      ref={ref}
      className="definition-modules"
      style={{
        opacity,
        visibility: isVisible ? "visible" : "hidden",
        pointerEvents: isInteractive ? "auto" : "none",
      }}
    >
      {MODULE_CARDS_DATA.map((card, index) => {
        // Stagger each card's close animation slightly
        const cardCloseDelay = index * 0.15; // Each card starts closing 15% later
        const cardCloseProgress = Math.max(
          0,
          Math.min(1, (closeProgress - cardCloseDelay) / (1 - cardCloseDelay))
        );

        return (
          <div
            key={card.id}
            ref={cardRefs[index]}
            className="module-card"
            style={{
              // Close inward effect - scale down proportionately (borders scale too)
              transform: cardCloseProgress > 0 ? `scale(${1 - cardCloseProgress})` : "scale(1)",
              transformOrigin: "center center",
            }}
          >
            <div className="module-connect" />
            <div className="module-header">
              <span className="module-id">{card.id}</span>
            </div>
            <h3 className="module-title">{card.title}</h3>
            <p className="module-desc">{card.description}</p>
          </div>
        );
      })}
    </div>
  );
});
