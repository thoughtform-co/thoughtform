"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

import { ArcMenu } from "./ArcMenu";
import { useArcScroll } from "./useArcScroll";

export interface ArcMenuItem {
  id: string;
  label: string;
}

interface ArcShellProps {
  /** `sliceV7Sections([]).hudHtml` — the parsed HUD chrome (server-only read). */
  hudHtml: string;
  /** `sliceV7Sections([]).bodyClass` — "theme-instrument density-comfortable". */
  bodyClass: string;
  variant: "index" | "detail";
  /** Detail only — sections with a menuLabel, in page order. */
  menu?: readonly ArcMenuItem[];
  children: ReactNode;
}

/**
 * ArcShell — the one client component wrapping an arc page (ADR-052).
 * Injects the parsed HUD chrome, runs the single scroll writer, opts
 * the page into IO reveals, and retargets the wordmark link. Children
 * are server-rendered sections passing through untouched.
 *
 * The overview pins `--hero-lift: 1` inline (no hero curtain), so the
 * HUD rails are un-clipped from the first paint; detail pages write it
 * from scroll (useArcScroll) for the landing's curtain reveal.
 */
export function ArcShell({ hudHtml, bodyClass, variant, menu, children }: ArcShellProps) {
  const rootRef = useRef<HTMLElement>(null);

  useArcScroll({ variant, rootRef });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Wordmark → home. The authored hudHtml links `#hero`, which is
    // right on detail pages but dead on the overview; on an arc the
    // brand should exit to the landing either way.
    root.querySelector(".hud__brand")?.setAttribute("href", "/");

    // Reveal opt-in — content is visible by default (no-JS contract,
    // the Shards reveal pattern); JS opts INTO the animated state.
    root.classList.add("is-arc-js");
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(".arc-reveal"));
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
  }, []);

  return (
    <main
      ref={rootRef}
      className={`arc-root arc-root--${variant} ${bodyClass}`}
      data-theme="dark"
      style={variant === "index" ? ({ "--hero-lift": "1" } as CSSProperties) : undefined}
    >
      <div
        className="arc-hud-root"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />
      {variant === "detail" && menu && menu.length > 0 ? <ArcMenu items={menu} /> : null}
      {children}
    </main>
  );
}
