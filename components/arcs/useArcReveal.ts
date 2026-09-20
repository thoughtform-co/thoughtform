"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * useArcReveal — the one-shot IntersectionObserver reveal (ADR-052), lifted
 * out of `ArcShell` so the sheet's shell (ADR-114) runs the same mechanism
 * without importing the arcs' grammar.
 *
 * Content is visible by default (the no-JS contract, the Shards reveal
 * pattern); JS opts INTO the animated state by adding `jsClass` to the root,
 * and each `selector` node gets `is-in` once, the first time it intersects.
 * Under reduced motion every node is revealed at once.
 *
 * `skip` is the terminal-motion gate the arcs carry: when it returns true
 * the root never gets the class and the reveal CSS stays inert, so a beat
 * page above the enhanced tier gets exactly one motion system.
 */
export function useArcReveal({
  rootRef,
  selector,
  jsClass,
  skip,
  deps = [],
}: {
  rootRef: RefObject<HTMLElement | null>;
  selector: string;
  jsClass: string;
  skip?: () => boolean;
  deps?: readonly unknown[];
}) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (skip?.()) return;

    root.classList.add(jsClass);
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (nodes.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((node) => node.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );
    nodes.forEach((node) => io.observe(node));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
