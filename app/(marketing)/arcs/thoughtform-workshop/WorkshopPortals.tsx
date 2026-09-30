"use client";

import { lazy, Suspense, useLayoutEffect } from "react";

import { useNestedRoot } from "../trinny-london/proposal/useNestedRoot";

import TurnMark from "./about-turn/TurnMark";
import { useAboutTurn } from "./about-turn/useAboutTurn";

/**
 * WorkshopPortals — this route's two nested roots, and the one attribute the
 * corridor reads from it (ADR-137, on the Trinny recipe, ADR-094).
 *
 * A SIBLING of `LandingPage`, never a child: that component owns a
 * `dangerouslySetInnerHTML` body with nested `createRoot`s inside it, and a
 * re-render there orphans them. React runs passive effects post-order, so by
 * the time this leaf's effects run the parsed body — and both slots the fork
 * declares — exists on a full load and on a client-side entry.
 *
 * WHAT IT STAMPS. `data-services-ring="off"` on `<html>`, in a LAYOUT effect
 * so it lands before the lazy corridor mounts: `CorridorArmillary` reads it
 * once and skips the WebGL card ring, whose entrance clock would otherwise
 * replay the four cards' fly-in behind the transparent `#services`. Removed on
 * unmount so a client-side exit hands `/` its ring back.
 *
 * Both roots are lazy, so the proof's plates and the arcs' section components
 * stay off the route's first paint.
 *
 * AND THE ABOUT → ARC TURN (ADR-137 U2): a third root for the brandmark on
 * the back of the portrait (`TurnMark`, eager — it is one inline SVG the
 * landing already ships), and the turn's writer, `useAboutTurn`, which lives
 * here for the same reason the roots do.
 */
const TURN_MARK = <TurnMark />;

const WorkshopProof = lazy(() => import("./WorkshopProof"));
const WorkshopTail = lazy(() => import("./WorkshopTail"));

const RING_ATTR = "data-services-ring";

export function WorkshopPortals() {
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
      <WorkshopTail />
    </Suspense>
  );
  useNestedRoot(".tw-root [data-tw-turn-mark]", TURN_MARK);
  useAboutTurn();

  return null;
}
