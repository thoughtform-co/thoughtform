"use client";

import { lazy, Suspense, useLayoutEffect } from "react";

import { UX_MEETUP_PROOF_LEDES } from "@/lib/arcs/content/ux-meetup";

import { useNestedRoot } from "../../trinny-london/proposal/useNestedRoot";
import { usePortraitDeck } from "../workshop-v1/about-deck/usePortraitDeck";
import { useWorkshopFlow } from "../workshop-v1/flow/useWorkshopFlow";

/**
 * UxMeetupPortals — the talk's nested roots (ADR-156), v3's portals with one
 * import changed and one prop passed.
 *
 * ⚠ EVERYTHING BEFORE THE TAIL IS v3's, BY IMPORT: the About flow and the
 * portrait deck are v1's hooks, the opener's hologram is v3's mount, and the
 * proof is v3's own leaf with this cut's ledes (the record's, less the one
 * clause that promises a workshop). What this page owns is the arc after
 * them, and that is the one module this file names differently.
 *
 * ⚠ BOTH HOOKS REACH `.tw-root` GLOBALLY, and this route renders that same
 * class deliberately: it shares v1's prototype and v1's stylesheet, so the
 * selectors resolve unchanged.
 *
 * A SIBLING of `LandingPage`, never a child, for v1's reason: that component
 * owns a `dangerouslySetInnerHTML` body with nested `createRoot`s inside it,
 * and a re-render there orphans them.
 */
const WorkshopProof = lazy(() => import("../workshop-v3/WorkshopProof"));
const UxMeetupTail = lazy(() => import("./WorkshopTail"));
const SwarmChapter = lazy(() => import("./SwarmChapter"));

const RING_ATTR = "data-services-ring";

export function UxMeetupPortals() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    html.setAttribute(RING_ATTR, "off");
    return () => html.removeAttribute(RING_ATTR);
  }, []);

  useNestedRoot(
    ".tw-root [data-tw-proof-root]",
    <Suspense fallback={null}>
      <WorkshopProof ledes={UX_MEETUP_PROOF_LEDES} split />
    </Suspense>
  );
  useNestedRoot(
    ".tw-root [data-tw-arc-root]",
    <Suspense fallback={null}>
      <UxMeetupTail />
    </Suspense>
  );
  useNestedRoot(
    ".tw-root [data-uxm-swarm-root]",
    <Suspense fallback={null}>
      <SwarmChapter />
    </Suspense>
  );
  usePortraitDeck();
  // The About's flow, but no seam: the talk sits between the eras and the
  // corridor, so the eras must not open it (ADR-156 U2).
  useWorkshopFlow({ seam: false });

  return null;
}
