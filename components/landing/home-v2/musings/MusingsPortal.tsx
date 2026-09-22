"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";

import type { MusingCardData } from "@/lib/musings/types";

import { MusingsStation } from "./MusingsStation";

interface MusingsPortalProps {
  containerRef: React.RefObject<HTMLElement | null>;
  posts: readonly MusingCardData[];
}

/**
 * Mounts {@link MusingsStation} into the `[data-musings-root]` placeholder
 * declared inside the `#musings` station in the v7 prototype HTML (ADR-119) —
 * the FIFTH nested root on this page, after services, about, voidwalker and
 * the site footer, and the `VoidwalkerPortal` recipe verbatim.
 *
 * Deferred-macrotask unmount + root reuse: StrictMode / Fast Refresh safe,
 * for the reasons those files' own comments record.
 *
 * ⚠ **THE POSTS ARE A PROP, READ ON THE SERVER.** `lib/musings/registry` is
 * `server-only` (it opens `content/musings/` with `fs`), so the record is
 * projected in `app/(marketing)/page.tsx` through `cardsFor()` and threaded
 * down. ⚠ That projection is what leaves `body` — every post's whole MDX
 * source — out of the landing's payload; see `MusingCardData`.
 */
export function MusingsPortal({ containerRef, posts }: MusingsPortalProps) {
  const rootRef = useRef<Root | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const container = containerRef.current;
    if (!container) return;

    const slot = container.querySelector<HTMLElement>("[data-musings-root]");
    if (!slot) return;

    let root = rootRef.current;
    if (!root) {
      root = createRoot(slot);
      rootRef.current = root;
    }
    root.render(<MusingsStation posts={posts} />);

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
  }, [containerRef, posts]);

  return null;
}
