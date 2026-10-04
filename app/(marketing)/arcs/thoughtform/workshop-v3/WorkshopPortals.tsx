"use client";

import { lazy, Suspense, useLayoutEffect } from "react";

import { useNestedRoot } from "../../trinny-london/proposal/useNestedRoot";
import { usePortraitDeck } from "../workshop-v1/about-deck/usePortraitDeck";
import { useWorkshopFlow } from "../workshop-v1/flow/useWorkshopFlow";

/**
 * WorkshopV3Portals — the third house cut's nested roots (ADR-143), v2's portals
 * with one import changed.
 *
 * ⚠ THE TWO HOOKS ARE v1's, BY IMPORT, and that is the point. (The proof was
 * too, until ADR-143 U3 gave this cut its own one-line ledes; it is still
 * v1's pile, mapped.)
 * The corridor half of this page — the About flow, the portrait deck, the
 * four proof cards — is the same page, so a copy of any of them would be two
 * things to keep in step for no gain. What v3 owns is the arc after them, and
 * that is the one module this file names differently.
 *
 * ⚠ BOTH HOOKS REACH `.tw-root` GLOBALLY, and this route renders that same
 * class deliberately: it shares v1's prototype and v1's stylesheet, so the
 * selectors resolve unchanged. The day the third cut wants its own corridor
 * it forks the prototype, the sheet and the root class together — never one
 * of the three.
 *
 * A SIBLING of `LandingPage`, never a child, for v1's reason: that component
 * owns a `dangerouslySetInnerHTML` body with nested `createRoot`s inside it,
 * and a re-render there orphans them.
 */
// The pile is this cut's own since ADR-143 U3: v1's, with one-line ledes.
const WorkshopProof = lazy(() => import("./WorkshopProof"));
const WorkshopV3Tail = lazy(() => import("./WorkshopTail"));
/* The opener's hologram (ADR-143 U7), lazy like its neighbours; the canvas
   behind it is a second, dynamic chunk the mount loads at idle. */
const EquilibriumMount = lazy(() => import("./EquilibriumMount"));

const RING_ATTR = "data-services-ring";

export function WorkshopV3Portals() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    html.setAttribute(RING_ATTR, "off");
    return () => html.removeAttribute(RING_ATTR);
  }, []);

  useNestedRoot(
    ".tw-root [data-tw-eq-canvas]",
    <Suspense fallback={null}>
      <EquilibriumMount />
    </Suspense>
  );
  useNestedRoot(
    ".tw-root [data-tw-proof-root]",
    <Suspense fallback={null}>
      <WorkshopProof />
    </Suspense>
  );
  useNestedRoot(
    ".tw-root [data-tw-arc-root]",
    <Suspense fallback={null}>
      <WorkshopV3Tail />
    </Suspense>
  );
  usePortraitDeck();
  // v3 alone: the era title glides and decodes into the thesis title (ADR-143 U5).
  useWorkshopFlow({ titleMorph: true });

  return null;
}
