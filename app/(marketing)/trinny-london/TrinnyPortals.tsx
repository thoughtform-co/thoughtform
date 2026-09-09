"use client";

import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
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

const RING_ATTR = "data-services-ring";

export function TrinnyPortals() {
  const rootRef = useRef<Root | null>(null);
  const timerRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const slot = document.querySelector<HTMLElement>(".tl-root [data-tl-proof-root]");
    if (!slot) return;

    let root = rootRef.current;
    if (!root) {
      root = createRoot(slot);
      rootRef.current = root;
    }
    root.render(
      <Suspense fallback={null}>
        <ProofStack />
      </Suspense>
    );

    return () => {
      const r = rootRef.current;
      timerRef.current = window.setTimeout(() => {
        if (rootRef.current === r) {
          r?.unmount();
          rootRef.current = null;
        }
        timerRef.current = null;
      }, 0);
    };
  }, []);

  return null;
}
