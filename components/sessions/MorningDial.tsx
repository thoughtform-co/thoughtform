"use client";

import { useEffect } from "react";

/**
 * MorningDial — the dial's one listener (ADR-150). A LEAF: it renders
 * nothing and owns no state. One IntersectionObserver whose root margin is
 * the viewport's midline; as a step crosses it, the section's `data-step`
 * becomes that step's index, and CSS turns the dial (the lit sector, its
 * hand, the hub's ordinal, the step itself).
 *
 * ⚠ THE SERVER RENDERS THE LAST STEP. Without script, under a failed
 * hydration and in a still the dial reads its final movement; this only
 * ever moves it. No scroll listener and no rAF — the page's one scroll
 * writer is the shell's.
 */
export function MorningDial({
  sectionId,
  stepIds,
}: {
  sectionId: string;
  stepIds: readonly string[];
}) {
  useEffect(() => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const steps = stepIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (steps.length === 0) return;

    const write = (i: number) => section.setAttribute("data-step", String(i));

    // The step straddling the midline at mount, else the last one above it.
    const mid = window.innerHeight / 2;
    let at = 0;
    steps.forEach((el, i) => {
      if (el.getBoundingClientRect().top <= mid) at = i;
    });
    write(at);

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = steps.indexOf(entry.target as HTMLElement);
          if (i >= 0) write(i);
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );
    steps.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sectionId, stepIds]);

  return null;
}
