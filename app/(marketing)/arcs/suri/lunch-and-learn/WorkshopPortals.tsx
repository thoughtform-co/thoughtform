"use client";

import { lazy, Suspense, useLayoutEffect } from "react";

import { useNestedRoot } from "../../trinny-london/proposal/useNestedRoot";
import { usePortraitDeck } from "../../thoughtform/workshop-v1/about-deck/usePortraitDeck";
import { useWorkshopFlow } from "../../thoughtform/workshop-v1/flow/useWorkshopFlow";

/**
 * SuriLunchAndLearnPortals — the Suri cut's nested roots (ADR-147), v3's
 * portals with one import changed.
 *
 * ⚠ EVERYTHING BEFORE THE TAIL IS v3's, BY IMPORT: the About flow and the
 * portrait deck are v1's hooks, and the proof is v3's own leaf (the Loop pile
 * mapped through `WORKSHOP_INTRO`'s ledes), so an edit to v3's intro lands
 * here without a second copy to keep in step. What this page owns is the arc
 * after them, and that is the one module this file names differently.
 *
 * ⚠ BOTH HOOKS REACH `.tw-root` GLOBALLY, and this route renders that same
 * class deliberately: it shares v1's prototype and v1's stylesheet, so the
 * selectors resolve unchanged.
 *
 * A SIBLING of `LandingPage`, never a child, for v1's reason: that component
 * owns a `dangerouslySetInnerHTML` body with nested `createRoot`s inside it,
 * and a re-render there orphans them.
 */
const WorkshopProof = lazy(() => import("../../thoughtform/workshop-v3/WorkshopProof"));
const SuriLunchAndLearnTail = lazy(() => import("./WorkshopTail"));

const RING_ATTR = "data-services-ring";

export function SuriLunchAndLearnPortals() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    html.setAttribute(RING_ATTR, "off");
    return () => html.removeAttribute(RING_ATTR);
  }, []);

  useNestedRoot(
    ".tw-root [data-tw-proof-root]",
    <Suspense fallback={null}>
      <WorkshopProof />
    </Suspense>
  );
  useNestedRoot(
    ".tw-root [data-tw-arc-root]",
    <Suspense fallback={null}>
      <SuriLunchAndLearnTail />
    </Suspense>
  );
  usePortraitDeck();
  // As v3: the era title glides and decodes into the thesis title (ADR-143 U5).
  useWorkshopFlow({ titleMorph: true });

  return null;
}
