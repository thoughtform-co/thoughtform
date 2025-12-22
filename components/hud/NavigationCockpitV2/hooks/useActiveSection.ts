"use client";

import { useEffect, useState } from "react";

/**
 * Valid section IDs for the NavigationCockpit
 */
export type SectionId = "hero" | "definition" | "manifesto" | "services" | "contact";

/**
 * Hook that tracks which section is currently active using IntersectionObserver.
 *
 * Observes all elements with class ".section[data-section]" and updates
 * the active section when one becomes sufficiently visible.
 *
 * @param threshold - Intersection ratio required to trigger (default 0.3)
 * @returns Current active section ID
 */
export function useActiveSection(threshold: number = 0.3): SectionId {
  const [activeSection, setActiveSection] = useState<SectionId>("hero");

  useEffect(() => {
    const sections = document.querySelectorAll(".section[data-section]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > threshold) {
            const sectionId = entry.target.getAttribute("data-section") as SectionId | null;
            if (sectionId) {
              setActiveSection(sectionId);
            }
          }
        });
      },
      { threshold: [threshold, 0.5] }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [threshold]);

  return activeSection;
}
