"use client";

import { forwardRef } from "react";

interface ModuleCardProps {
  id: string;
  title: string;
  description: string;
}

interface ModuleCardsProps {
  scrollProgress: number;
  cardRefs: React.RefObject<HTMLDivElement>[];
}

const MODULE_CARDS_DATA: ModuleCardProps[] = [
  {
    id: "MOD_01",
    title: "Navigate Intelligence",
    description:
      "Chart a course through the latent space. Identify high-value coordinates amidst the noise.",
  },
  {
    id: "MOD_02",
    title: "Steer from Mediocrity",
    description:
      "Force the model away from the average. Displace the probable to find the exceptional.",
  },
  {
    id: "MOD_03",
    title: "Leverage Hallucinations",
    description:
      "Errors are not bugs; they are creative vectors. Use the glitch to break linear thinking.",
  },
];

export const ModuleCards = forwardRef<HTMLDivElement, ModuleCardsProps>(function ModuleCards(
  { scrollProgress, cardRefs },
  ref
) {
  const opacity =
    scrollProgress < 0.08
      ? 0
      : scrollProgress < 0.18
        ? 1
        : Math.max(0, 1 - (scrollProgress - 0.18) * 8);
  const isVisible = scrollProgress >= 0.08;
  const isInteractive = scrollProgress <= 0.25 && scrollProgress >= 0.08;

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
      {MODULE_CARDS_DATA.map((card, index) => (
        <div key={card.id} ref={cardRefs[index]} className="module-card">
          <div className="module-connect" />
          <div className="module-header">
            <span className="module-id">{card.id}</span>
          </div>
          <h3 className="module-title">{card.title}</h3>
          <p className="module-desc">{card.description}</p>
        </div>
      ))}
    </div>
  );
});
