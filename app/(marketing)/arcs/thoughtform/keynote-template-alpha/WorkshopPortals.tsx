"use client";

import { lazy, Suspense, useLayoutEffect } from "react";

import { KEYNOTE_PROOF_LEDES } from "@/lib/arcs/content/keynote-template-alpha";

import { useNestedRoot } from "../../trinny-london/proposal/useNestedRoot";
import { usePortraitDeck } from "../workshop-v1/about-deck/usePortraitDeck";
import { useWorkshopFlow } from "../workshop-v1/flow/useWorkshopFlow";

/**
 * KeynotePortals — the keynote's nested roots (ADR-159), the UX meetup's
 * portals with the record swapped.
 *
 * ⚠ EVERYTHING BEFORE THE TAIL IS v3's, BY IMPORT: the About flow and the
 * portrait deck are v1's hooks, and the proof is v3's own leaf with this
 * cut's ledes (the talk's: the record's, less the one clause that promises
 * a workshop). What this page owns is the arc after them and the swarm
 * chapter after that, the two modules this file names for itself.
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
const KeynoteTail = lazy(() => import("./WorkshopTail"));
const SwarmChapter = lazy(() => import("./SwarmChapter"));

const RING_ATTR = "data-services-ring";

export function KeynotePortals() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    html.setAttribute(RING_ATTR, "off");
    return () => html.removeAttribute(RING_ATTR);
  }, []);

  useNestedRoot(
    ".tw-root [data-tw-proof-root]",
    <Suspense fallback={null}>
      <WorkshopProof ledes={KEYNOTE_PROOF_LEDES} />
    </Suspense>
  );
  useNestedRoot(
    ".tw-root [data-tw-arc-root]",
    <Suspense fallback={null}>
      <KeynoteTail />
    </Suspense>
  );
  useNestedRoot(
    ".tw-root [data-kta-swarm-root]",
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
