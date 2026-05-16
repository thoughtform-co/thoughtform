"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * useSigilEntranceScrub — section-02 diagram entrance animation.
 *
 * Animates the sigil diagram's INTERNAL elements (orbits, halo, mark,
 * cap, legend, tri-left) as the user enters section 02. The diagram
 * is a separate visual concern from the brandmark JOURNEY (which is
 * owned by `useBrandmarkJourney` per ADR-013):
 *
 *   - The diagram is the static visual context for section 02 — it
 *     paints WHEN the user is reading section 02. Its elements (the
 *     orbital rings, the halo dots, the centre mark, the legend
 *     text) need to reveal cohesively as the section enters the
 *     viewport.
 *   - The brandmark journey is the artifact's TRAVEL through the
 *     page — it lives outside the diagram, painted by the global
 *     particle field, evolving through the five keyframes.
 *
 * The `.sigil__mark` element here is the SVG-mode brandmark dock. In
 * particle mode (the default when WebGL is available), the brandmark
 * journey's painter is the visual story at section 02; this scrub
 * still animates `.sigil__mark` because the entrance scrub is what
 * brings the diagram in for SVG-fallback users (and because in
 * particle mode the `.sigil__mark` is hidden by the CSS gate so
 * touching its opacity is harmless).
 *
 * Extracted from the original `useSigilChoreography` (ADR-013 Phase
 * 5c) to enforce separation of concerns: the brandmark journey is
 * now a single continuous transform with no per-station diagram
 * animations baked in.
 */
export function useSigilEntranceScrub(rootRef: React.RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const rootEl = rootRef.current;
    if (!rootEl) return;

    // Resolve the diagram's internal elements + the section trigger.
    const defEl = rootEl.querySelector<HTMLElement>("#definition");
    const sigilOrbits = rootEl.querySelector<HTMLElement>(".sigil__orbits");
    const sigilHalo = rootEl.querySelector<HTMLElement>(".sigil__halo");
    const sigilMark = rootEl.querySelector<HTMLElement>(".sigil__mark");
    const sigilCap = rootEl.querySelector<HTMLElement>(".sigil__cap");
    const sigilLegend = rootEl.querySelector<HTMLElement>(".sigil__legend");
    const triLeft = rootEl.querySelector<HTMLElement>(".tri__left");

    if (!defEl) return;

    // Disable any baked-in IO reveal motion on the sigil internals so
    // the entrance scrub is the only thing animating them. Without
    // this, the global `useRevealMotion` hook would also fire reveal
    // transforms on these elements (data-m attribute) and the two
    // animations would compete.
    const section2Els = [sigilOrbits, sigilHalo, sigilMark, sigilCap, sigilLegend, triLeft].filter(
      (el): el is HTMLElement => el !== null
    );
    section2Els.forEach((el) => {
      el.removeAttribute("data-m");
      el.classList.add("is-in");
    });

    // === Entrance scrub timeline ===
    // Pinned to `#definition top 85% → top 35%` with a small lag
    // (`scrub: 0.6`) for organic feel. The diagram reveals as the
    // user enters section 02.
    const ctx = gsap.context(() => {
      gsap.set([sigilOrbits, sigilHalo].filter(Boolean), {
        opacity: 0,
        scale: 0.6,
        rotation: -8,
      });
      if (sigilMark) gsap.set(sigilMark, { opacity: 0, scale: 0.7 });
      gsap.set([sigilCap, sigilLegend, triLeft].filter(Boolean), { opacity: 0, y: 16 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: defEl,
          start: "top 85%",
          end: "top 35%",
          scrub: 0.6,
        },
      });
      tl.to(
        [sigilOrbits, sigilHalo].filter(Boolean),
        { opacity: 1, scale: 1, rotation: 0, duration: 0.5, ease: "power3.out" },
        0
      );
      if (sigilMark) {
        tl.to(sigilMark, { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" }, 0.15);
      }
      tl.to(
        [sigilCap, sigilLegend].filter(Boolean),
        { opacity: 1, y: 0, duration: 0.35, ease: "power3.out", stagger: 0.06 },
        0.3
      );
      tl.to(
        [triLeft].filter(Boolean),
        { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" },
        0.25
      );
    }, rootEl);

    return () => {
      ctx.revert();
    };
  }, [rootRef]);
}
