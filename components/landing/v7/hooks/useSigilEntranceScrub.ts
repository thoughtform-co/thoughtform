"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * useSigilEntranceScrub — section-02 diagram entrance animation.
 *
 * Animates the sigil diagram's INTERNAL CHROME elements (orbits,
 * halo, cap, legend, tri-left) as the user enters section 02. The
 * diagram is a separate visual concern from the brandmark JOURNEY
 * (which is owned by `useBrandmarkJourney` per ADR-013):
 *
 *   - The diagram is the static visual context for section 02 — it
 *     paints WHEN the user is reading section 02. Its chrome
 *     elements (the orbital rings, the halo dots, the legend text)
 *     reveal cohesively as the section enters the viewport.
 *   - The brandmark journey is the artifact's TRAVEL through the
 *     page — it lives outside the diagram, painted by the vector
 *     actor + atmosphere, evolving through the five keyframes.
 *
 * `.sigil__mark` is NOT part of this scrub anymore (no-jiggle parked
 * rendering, post-ADR-015). The brandmark journey already owns the
 * mark's entrance fade via `transform.opacity` ramping on the
 * vector actor; at full park the portal'd dock glyph takes over and
 * sits statically inside the diagram. Including `.sigil__mark` in
 * the scrub would scale/fade the dock glyph on every scroll movement
 * within section 02 — the exact "jiggle" the parked-handoff fix
 * eliminates everywhere else.
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

    // Resolve the diagram's internal CHROME elements + the section
    // trigger. `.sigil__mark` is intentionally NOT resolved here —
    // the brandmark dock is owned by the journey hook, which paints
    // its entrance fade via the vector actor and hands off to the
    // portal'd glyph at full park. Including the mark in this scrub
    // would re-introduce the very jiggle the parked handoff fixes.
    const defEl = rootEl.querySelector<HTMLElement>("#definition");
    const sigilOrbits = rootEl.querySelector<HTMLElement>(".sigil__orbits");
    const sigilHalo = rootEl.querySelector<HTMLElement>(".sigil__halo");
    const sigilCap = rootEl.querySelector<HTMLElement>(".sigil__cap");
    const sigilLegend = rootEl.querySelector<HTMLElement>(".sigil__legend");
    const triLeft = rootEl.querySelector<HTMLElement>(".tri__left");

    if (!defEl) return;

    // Disable any baked-in IO reveal motion on the sigil chrome so
    // the entrance scrub is the only thing animating it. Without
    // this, the global `useRevealMotion` hook would also fire reveal
    // transforms on these elements (data-m attribute) and the two
    // animations would compete.
    const chromeEls = [sigilOrbits, sigilHalo, sigilCap, sigilLegend, triLeft].filter(
      (el): el is HTMLElement => el !== null
    );
    chromeEls.forEach((el) => {
      el.removeAttribute("data-m");
      el.classList.add("is-in");
    });

    // Defensive: also clear any prior scrub state on `.sigil__mark`
    // so it cannot inherit a stale GSAP transform from a previous
    // HMR cycle. The mark is now owned by the journey hook.
    const sigilMark = rootEl.querySelector<HTMLElement>(".sigil__mark");
    if (sigilMark) {
      sigilMark.removeAttribute("data-m");
      sigilMark.classList.add("is-in");
      gsap.set(sigilMark, { clearProps: "opacity,scale,transform" });
    }

    // === Entrance scrub timeline ===
    // Pinned to `#definition top 85% → top 35%` with a small lag
    // (`scrub: 0.6`) for organic feel. The diagram chrome reveals as
    // the user enters section 02. `.sigil__mark` is excluded — see
    // hook docs above.
    const ctx = gsap.context(() => {
      gsap.set([sigilOrbits, sigilHalo].filter(Boolean), {
        opacity: 0,
        scale: 0.6,
        rotation: -8,
      });
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
