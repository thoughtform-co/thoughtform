"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

/**
 * useNestedRoot — one nested `createRoot` into a slot inside the parsed body.
 *
 * This page mounts THREE of them (the proof stack, the configuration, the
 * offer) and every one wants the identical lifecycle, which
 * `BEST-PRACTICES` "Nested-root portals" and `ServicesPortal` each paid a
 * measurement for: cancel a pending teardown, REUSE the root rather than
 * making a second one on the same node, and defer the unmount by one
 * macrotask so Strict Mode's double-invoke and Fast Refresh do not tear down
 * a root that is about to be re-rendered into.
 *
 * ⚠ THREE COPIES OF THAT WAS THE ALTERNATIVE, and it is three places for one
 * subtle rule to rot — the same argument `browseMap.ts` and `copyLaw.ts` make
 * on this codebase. Extracted at the third (ADR-099).
 *
 * ⚠ A ROOT PER SLOT, NEVER A PORTAL. The three slots are stations apart in a
 * `dangerouslySetInnerHTML` body; a React portal cannot span from one into
 * another, and a re-render of the host would orphan the lot (the rule the
 * route sheet's own header states).
 *
 * ⚠ THE SELECTOR IS QUERIED ON EVERY RUN, never cached across renders: the
 * parsed body is replaced wholesale on a client-side entry, so a node held
 * from a previous mount is detached and renders into nothing visible.
 *
 * `node` is read once per effect run and is expected to be a stable element
 * (a lazy component in a `Suspense`), so the effect's dep list is the
 * selector alone — a new element identity every render would tear the root
 * down and rebuild it on each one.
 */
export function useNestedRoot(selector: string, node: ReactNode): void {
  const rootRef = useRef<Root | null>(null);
  const timerRef = useRef<number | null>(null);
  const nodeRef = useRef(node);

  /* ⚠ THE REF IS UPDATED IN AN EFFECT, NOT DURING RENDER. Writing it in the
     body is a render-phase side effect (`react-hooks/refs`), and under
     concurrent rendering a render that React throws away would still have
     mutated it. Effects run in declaration order, so this lands before the
     mount effect below on every pass, first render included. */
  useEffect(() => {
    nodeRef.current = node;
  });

  useEffect(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const slot = document.querySelector<HTMLElement>(selector);
    if (!slot) return;

    let root = rootRef.current;
    if (!root) {
      root = createRoot(slot);
      rootRef.current = root;
    }
    root.render(nodeRef.current);

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
  }, [selector]);
}
