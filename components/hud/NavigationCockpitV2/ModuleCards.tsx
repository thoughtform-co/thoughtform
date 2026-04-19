"use client";

import { forwardRef, useState, useEffect } from "react";

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

export const ModuleCards = forwardRef<HTMLDivElement, ModuleCardsProps>(function ModuleCards(
  { scrollProgress, transitionProgress, cardRefs },
  ref
) {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  // Container visibility + interactivity. Per-card opacity is computed below with stagger.
  let containerOpacity: number;
  let isVisible: boolean;
  let isInteractive: boolean;

  if (transitionProgress !== undefined) {
    const t = transitionProgress;
    const closeStart = 0.15;
    const closeEnd = 0.4;
    if (scrollProgress < closeStart) {
      // Container visible throughout the definition reveal window; per-card opacity handles the stagger
      containerOpacity = t >= 0.55 ? 1 : 0;
      isVisible = t >= 0.55;
    } else if (scrollProgress >= closeStart && scrollProgress < closeEnd) {
      const closeProgress = (scrollProgress - closeStart) / (closeEnd - closeStart);
      containerOpacity = 1 - closeProgress;
      isVisible = true;
    } else {
      containerOpacity = 0;
      isVisible = false;
    }
    isInteractive = t >= 0.95 && scrollProgress <= closeStart;
  } else {
    containerOpacity =
      scrollProgress < 0.08
        ? 0
        : scrollProgress < 0.18
          ? 1
          : Math.max(0, 1 - (scrollProgress - 0.18) * 8);
    isVisible = scrollProgress >= 0.08;
    isInteractive = scrollProgress <= 0.25 && scrollProgress >= 0.08;
  }

  // Calculate close progress for inward collapse effect (synced with sigil exit: 0.15 to 0.40)
  const closeStartCalc = 0.15;
  const closeEndCalc = 0.4;
  const closeProgress =
    scrollProgress >= closeStartCalc
      ? Math.min(1, (scrollProgress - closeStartCalc) / (closeEndCalc - closeStartCalc))
      : 0;

  return (
    <div
      ref={ref}
      className="definition-modules"
      style={{
        opacity: containerOpacity,
        visibility: isVisible ? "visible" : "hidden",
        pointerEvents: isInteractive ? "auto" : "none",
      }}
    >
      {MODULE_CARDS_DATA.map((card, index) => {
        // Close/exit animation (on scroll past definition)
        const cardCloseDelay = index * 0.15;
        const cardCloseProgress = Math.max(
          0,
          Math.min(1, (closeProgress - cardCloseDelay) / (1 - cardCloseDelay))
        );

        // Right-panel entrance: opacity 0->1 + translateX(+80->0), staggered per card
        // Top card (NAVIGATE) leads, bottom card (BUILD) arrives last
        const staggerDelay = index * 0.08;
        const entranceStart = 0.6 + staggerDelay;
        const entranceEnd = 0.9 + staggerDelay;
        const t = transitionProgress ?? 0;
        const entranceRaw =
          t < entranceStart
            ? 0
            : t > entranceEnd
              ? 1
              : (t - entranceStart) / (entranceEnd - entranceStart);
        const eased = 1 - Math.pow(1 - entranceRaw, 3);
        const slideX = reducedMotion ? 0 : (1 - eased) * 80;
        const cardOpacity = eased;

        return (
          <div
            key={card.id}
            ref={cardRefs[index]}
            className="module-card"
            style={{
              opacity: cardOpacity,
              transform:
                cardCloseProgress > 0
                  ? `scale(${1 - cardCloseProgress})`
                  : reducedMotion
                    ? undefined
                    : `translateX(${slideX}px)`,
              transformOrigin: "center center",
            }}
          >
            <div className="module-connect" />
            <h3 className="module-title">{card.title}</h3>
            <p className="module-desc">{card.description}</p>
          </div>
        );
      })}
    </div>
  );
});
