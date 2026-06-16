"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { createRoot, type Root } from "react-dom/client";

import { HomeCorridor } from "@/components/landing/home-v2/HomeCorridor";
import type { V7CorridorText } from "@/lib/v7-parse";

/**
 * useCorridorMount — owns the nested React root that mounts
 * `HomeCorridor` into the placeholder div injected by
 * `getV7Content({ removeStations })` (ADR-018).
 *
 * Why a nested `createRoot` instead of `createPortal`:
 *
 *   The marketing landing page renders the parsed v7 prototype HTML
 *   via `dangerouslySetInnerHTML`. That can replace the placeholder
 *   DOM node during Fast Refresh, dev remounts, or bfcache restores
 *   — leaving a portal attached to a detached node. A tiny nested
 *   root lets us tear down and re-create the corridor whenever the
 *   live placeholder changes, without coupling to the outer React
 *   tree's reconciliation.
 *
 * Why this hook is its own module (Phase 4 of the Homepage Refactor
 * And Hardening Plan):
 *
 *   - The mount lifecycle has accumulated several non-obvious safety
 *     valves (MutationObserver to catch `dangerouslySetInnerHTML`
 *     replacements, `pageshow` listener for bfcache restores, `0ms`
 *     unmount timer to survive Strict Mode's mount→unmount→mount
 *     dance, `hasContent` check to recover from "root died but DOM
 *     node survived"). Pulling them out of `LandingPage.tsx` makes
 *     the orchestrator easier to read AND lets the regression
 *     coverage in `tests/visual/landing-corridor-smoke.spec.ts`
 *     speak directly to this hook's contract.
 *
 *   - The behavior is BYTE-IDENTICAL to the previous inline
 *     useLayoutEffect — same effect ordering, same guards, same
 *     teardown timer, same dependency list. Migration is a pure
 *     extraction; do not "improve" the safety logic during this
 *     pass without an ADR.
 */
export interface UseCorridorMountOptions {
  /** Element id of the corridor mount placeholder injected by
   *  `getV7Content({ removeStations })`. Defaults to
   *  `"home-corridor-mount"` (matches the production caller in
   *  `app/(marketing)/page.tsx`). */
  corridorMountId?: string;
  /** Forwarded to the nested `<HomeCorridor>` so the production
   *  homepage doesn't paint the development progress HUD. */
  debug?: boolean;
}

export function useCorridorMount(
  rootRef: RefObject<HTMLDivElement | null>,
  corridorText: V7CorridorText | undefined,
  options?: UseCorridorMountOptions
): void {
  const corridorMountId = options?.corridorMountId ?? "home-corridor-mount";
  const debug = options?.debug ?? false;

  const corridorRootRef = useRef<Root | null>(null);
  const corridorMountNodeRef = useRef<HTMLElement | null>(null);
  const corridorUnmountTimerRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !corridorText) return;

    if (corridorUnmountTimerRef.current != null) {
      window.clearTimeout(corridorUnmountTimerRef.current);
      corridorUnmountTimerRef.current = null;
    }

    const mountCorridor = () => {
      const mount = root.querySelector<HTMLElement>(`#${corridorMountId}`);
      if (!mount) return;

      const sameNode = mount === corridorMountNodeRef.current;
      const rootAlive = corridorRootRef.current != null;
      // Healthy renders leave at least the `.home-corridor-host`
      // wrapper as a child. An empty placeholder with cached ref
      // identity is the smoking gun for "root died but DOM node
      // survived" — recover by tearing down (no-op if the root is
      // already gone) and recreating.
      const hasContent = mount.childNodes.length > 0;
      if (sameNode && rootAlive && hasContent) return;

      corridorRootRef.current?.unmount();
      corridorMountNodeRef.current = mount;
      corridorRootRef.current = createRoot(mount);
      corridorRootRef.current.render(
        <div className="home-corridor-host">
          <HomeCorridor text={corridorText} debug={debug} />
        </div>
      );
    };

    mountCorridor();
    const observer = new MutationObserver(mountCorridor);
    observer.observe(root, { childList: true, subtree: true });

    // bfcache back-navigation: the page is restored as a snapshot,
    // effects don't re-run, but the React tree may have been detached.
    // Re-running mountCorridor here is a cheap belt-and-braces — if
    // the existing render is healthy the new guard short-circuits.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) mountCorridor();
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      observer.disconnect();
      window.removeEventListener("pageshow", onPageShow);
      const rootToUnmount = corridorRootRef.current;
      if (!rootToUnmount) return;
      // Defer unmount one tick so React's Strict-Mode mount → unmount
      // → mount dance (and Fast Refresh) doesn't tear down a root
      // that the next mount is about to reuse. The timer is cancelled
      // at the top of the effect on remount.
      corridorUnmountTimerRef.current = window.setTimeout(() => {
        if (corridorRootRef.current === rootToUnmount) {
          rootToUnmount.unmount();
          corridorRootRef.current = null;
          corridorMountNodeRef.current = null;
        }
        corridorUnmountTimerRef.current = null;
      }, 0);
    };
  }, [corridorMountId, corridorText, debug, rootRef]);
}
