"use client";

import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";

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
    return () => {
      html.removeAttribute(RING_ATTR);
    };
  }, []);

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
