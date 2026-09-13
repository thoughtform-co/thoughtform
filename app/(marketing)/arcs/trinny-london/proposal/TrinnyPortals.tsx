"use client";

import { lazy, Suspense, useLayoutEffect } from "react";
import { useNestedRoot } from "./useNestedRoot";
import { brandmarkMorphRef, clearBrandmarkMorph } from "@/lib/brandmark/morphTargetRef";
import { TURN_CAPABLE_QUERY, trinnyMorphSpec, useTurnScroll } from "./turn/useTurnScroll";

/**
 * TrinnyPortals — the route's own nested root, and the one attribute the
 * corridor reads from this page (ADR-094).
 *
 * A SIBLING of `LandingPage`, never a child: that component owns a
 * `dangerouslySetInnerHTML` body with nested `createRoot`s inside it, and a
 * re-render there orphans them (BEST-PRACTICES "Nested-root portals"). React
 * runs passive effects post-order, so by the time this leaf's effect runs the
 * parsed body — and the `[data-tl-proof-root]` slot the fork declares inside
 * `#services` — exists on both a full load and a client-side entry.
 *
 * WHAT IT MOUNTS. The proof stack (`./proof/ProofStack`), lazily: the
 * landing's import doctrine walks this route's STATIC graph, and the stack
 * pulls the casefile's plates in; a dynamic edge keeps them off the first
 * paint the way the corridor's own seam does. The stack imports no `three`.
 *
 * WHAT IT STAMPS. `data-services-ring="off"` on `<html>`, in a LAYOUT effect
 * so it lands before any nested render: `CorridorArmillary` reads it once at
 * mount and skips the WebGL card ring, whose entrance clock would otherwise
 * replay the four cards' fly-in behind the transparent `#services` (its
 * `proofRelease` input rests at 1 with no stage to write it). Removed on
 * unmount so a client-side exit hands `/` its ring back.
 *
 * AND WHAT IT REGISTERS (ADR-095). In the same layout effect, on the capable
 * rung only, the client-mark morph spec on `brandmarkMorphRef`: the corridor's
 * parked mark reads it once at mount and builds Trinny London's wireframe as
 * its second home; `useTurnScroll` then drives the clock from `#turn`'s rect.
 * Same timing argument as the attribute — the ref must be set before the
 * lazy corridor chunk mounts, and a layout effect here lands in the commit
 * that starts that mount. Cleared on unmount for the same reason the
 * attribute is removed. Registered only where the writer will run: mobile
 * and reduced motion would otherwise build a target nothing drives.
 *
 * The root lifecycle mirrors `ServicesPortal` verbatim — cancel a pending
 * teardown, reuse the root, defer the unmount one macrotask — for the same
 * Strict Mode / Fast Refresh reasons it documents.
 */

const ProofStack = lazy(() => import("./proof/ProofStack"));
/* The configuration (ADR-099): the beat `#proposition` mounts, where that
   station used to carry hand-written markup on a pinned stage. Lazy for the
   same reason the others are — the arcs' section components and their sheet
   are off this route's first paint. */
const TrinnyConfiguration = lazy(() => import("./offer/TrinnyConfiguration"));
/* The offer (ADR-094 U9): the proposal's beats after the configuration,
   rendered by the arcs' own components into `[data-tl-offer-root]` inside
   `#offer`. Lazy for the same reason the stack is — the arcs' section
   components and their sheet are off this route's first paint. */
const TrinnyOffer = lazy(() => import("./offer/TrinnyOffer"));

const RING_ATTR = "data-services-ring";

export function TrinnyPortals() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    html.setAttribute(RING_ATTR, "off");
    if (window.matchMedia(TURN_CAPABLE_QUERY).matches) {
      brandmarkMorphRef.current = { spec: trinnyMorphSpec(), progress: 0, veil: 0 };
    }
    return () => {
      html.removeAttribute(RING_ATTR);
      clearBrandmarkMorph();
    };
  }, []);

  useTurnScroll();

  /* Three slots, three roots, one lifecycle (`useNestedRoot`). They are
     stations apart in a `dangerouslySetInnerHTML` body, so each needs its
     own root — a portal cannot span from one into another.

     ⚠ THE CONFIGURATION'S PICKER CAME WITH IT (ADR-099). `usePropPick` was a
     delegated listener this component held, because the instrument was
     hand-written markup in the prototype; `ArcConfiguration` owns its own
     picker on `data-cfg-*`, so the hook and its file are deleted rather than
     left pointing at markup that no longer exists. */
  useNestedRoot(
    ".tl-root [data-tl-proof-root]",
    <Suspense fallback={null}>
      <ProofStack />
    </Suspense>
  );
  useNestedRoot(
    ".tl-root [data-tl-config-root]",
    <Suspense fallback={null}>
      <TrinnyConfiguration />
    </Suspense>
  );
  useNestedRoot(
    ".tl-root [data-tl-offer-root]",
    <Suspense fallback={null}>
      <TrinnyOffer />
    </Suspense>
  );

  return null;
}
