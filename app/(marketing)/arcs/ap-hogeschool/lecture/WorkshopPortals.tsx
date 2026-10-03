"use client";

import { lazy, Suspense, useLayoutEffect } from "react";

import { useNestedRoot } from "../../trinny-london/proposal/useNestedRoot";
import { usePortraitDeck } from "../../thoughtform/workshop-v1/about-deck/usePortraitDeck";
import { useWorkshopFlow } from "../../thoughtform/workshop-v1/flow/useWorkshopFlow";

/**
 * ApHogeschoolPortals — the lecture's nested roots (ADR-141), v2's portals
 * with one import changed.
 *
 * ⚠ THE TWO HOOKS AND THE PROOF ARE v1's, BY IMPORT, and that is the point.
 * The corridor half of this page — the About flow, the portrait deck, the
 * four proof cards — is the same page, so a copy of any of them would be two
 * things to keep in step for no gain. What this cut owns is the arc after
 * them, and that is the one module this file names differently.
 *
 * ⚠ BOTH HOOKS REACH `.tw-root` GLOBALLY, and this route renders that same
 * class deliberately: it shares v1's prototype and v1's stylesheet, so the
 * selectors resolve unchanged. The day a cut wants its own corridor it forks
 * the prototype, the sheet and the root class together — never one of the
 * three (ADR-139).
 *
 * A SIBLING of `LandingPage`, never a child, for v1's reason: that component
 * owns a `dangerouslySetInnerHTML` body with nested `createRoot`s inside it,
 * and a re-render there orphans them.
 */
const WorkshopProof = lazy(() => import("../../thoughtform/workshop-v1/WorkshopProof"));
const ApHogeschoolTail = lazy(() => import("./WorkshopTail"));

const RING_ATTR = "data-services-ring";

export function ApHogeschoolPortals() {
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
      <ApHogeschoolTail />
    </Suspense>
  );
  usePortraitDeck();
  useWorkshopFlow();

  return null;
}
