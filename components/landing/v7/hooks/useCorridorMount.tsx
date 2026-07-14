"use client";

import { lazy, Suspense, useLayoutEffect, useRef, type RefObject } from "react";
import { createRoot, type Root } from "react-dom/client";

import type { V7CorridorText } from "@/lib/v7-parse";

// Lazy seam (2026-07-14 perf pass): HomeCorridor drags the whole WebGL
// stack (three core + @react-three/fiber + drei + DepthGatewayScene,
// ~270 kB gzip) — importing it statically here put all of it in the
// landing route's First Load JS and was the main mobile-LCP cost. The
// corridor only ever exists client-side inside this nested root, so a
// React.lazy chunk changes nothing about the mount contract; the chunk
// fetch starts on the first mountCorridor() render right after
// hydration. The synchronous `.home-corridor-host` wrapper below keeps
// the `hasContent` guard satisfied while the chunk is in flight.
const HomeCorridor = lazy(() =>
  import("@/components/landing/home-v2/HomeCorridor").then((m) => ({
    default: m.HomeCorridor,
  }))
);

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
 *   - The behavior was a pure extraction (BYTE-IDENTICAL to the
 *     previous inline useLayoutEffect) EXCEPT for one sanctioned
 *     2026-06-20 change (ADR-018): the recovery-path root teardown is
 *     now deferred by a microtask in the node-REPLACED case to avoid
 *     React's "synchronously unmount a root while rendering" warning +
 *     the WebGL root-thrash it caused under Fast Refresh. The rare
 *     same-node recovery stays synchronous. Do not otherwise "improve"
 *     the safety logic (MutationObserver, pageshow, 0ms teardown timer,
 *     hasContent guard) without an ADR.
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

      // Recovery / re-mount. The previous root must be torn down, but
      // unmounting it SYNCHRONOUSLY here triggers React's "Attempted to
      // synchronously unmount a root while React was already rendering"
      // warning (and the real root-thrash it signals), because this runs
      // from the MutationObserver firing during the parent's
      // `dangerouslySetInnerHTML` commit — the common Fast-Refresh case,
      // where the placeholder node is REPLACED (i.e. `!sameNode`).
      //
      // Split by container identity (2026-06-20, see ADR-018):
      //   - Different node (the HMR placeholder-replacement trigger): wire
      //     up the new root first, then DEFER the old root's unmount by a
      //     microtask. The roots are on different containers, so this is
      //     safe and never unmounts during render.
      //   - Same node but content wiped ("root died, node survived"): must
      //     unmount BEFORE recreating on the same container (else React
      //     warns about two roots on one node). This rare recovery stays
      //     synchronous — byte-identical to the original.
      const prevRoot = corridorRootRef.current;
      const sameNodeRecover = rootAlive && sameNode;
      if (sameNodeRecover) prevRoot?.unmount();

      corridorMountNodeRef.current = mount;
      corridorRootRef.current = createRoot(mount);
      corridorRootRef.current.render(
        <div className="home-corridor-host">
          <Suspense fallback={null}>
            <HomeCorridor text={corridorText} debug={debug} />
          </Suspense>
        </div>
      );

      if (!sameNodeRecover && prevRoot) {
        // Defer one MACROTASK (not a microtask): the orphaned root renders
        // its own React tree asynchronously, so a microtask-deferred
        // unmount can still land mid-render. setTimeout(0) lets both the
        // parent commit AND the orphaned root's render settle first.
        // `prevRoot` is a captured orphan on the OLD node (never reused),
        // so no guard is needed. Matches this hook's cleanup teardown.
        window.setTimeout(() => prevRoot.unmount(), 0);
      }
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
