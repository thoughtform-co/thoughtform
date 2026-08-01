"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

import type { ArcMotion } from "@/lib/arcs/types";

import { LightModeToggle } from "@/components/landing/v7/LightModeToggle";
import { THEME_TOGGLE } from "@/components/landing/v7/themeToggle";

import { ArcMenu } from "./ArcMenu";
import { ARC_TERMINAL_MEDIA } from "./arcMotion";
import { useArcScroll } from "./useArcScroll";
import { useArcTerminalMotion } from "./useArcTerminalMotion";

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
  /** Choreography system (ADR-057). Default: the ADR-052 IO reveal. */
  motion?: ArcMotion;
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
 *
 * TWO MOTION SYSTEMS, DISJOINT BY GATE (ADR-057). A terminal page above
 * the enhanced tier never gets `is-arc-js`, so the v1 reveal CSS is
 * inert and the beat grammar owns everything; a reveal page never gets
 * `data-motion`, so the terminal CSS is inert. Below the tier a terminal
 * page falls back to the reveal path rather than to a dead static page.
 * Because the class and the observer are added (or skipped) together,
 * the "hidden but never revealed" failure mode is unreachable.
 */
export function ArcShell({
  hudHtml,
  bodyClass,
  variant,
  menu,
  motion = "reveal",
  children,
}: ArcShellProps) {
  const rootRef = useRef<HTMLElement>(null);

  // The beat clocks ride the one scroll writer rather than adding a
  // second listener (ADR-002) — hence the callback handoff.
  const onBeatFrame = useArcTerminalMotion({ rootRef, motion });
  useArcScroll({ variant, rootRef, onFrame: onBeatFrame });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Wordmark → home. The authored hudHtml links `#hero`, which is
    // right on detail pages but dead on the overview; on an arc the
    // brand should exit to the landing either way.
    root.querySelector(".hud__brand")?.setAttribute("href", "/");

    // Same gate the terminal controller and the terminal CSS use — one
    // constant, or a viewport band gets both systems (or neither).
    if (motion === "terminal" && window.matchMedia(ARC_TERMINAL_MEDIA).matches) return;

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
  }, [motion]);

  return (
    <main
      ref={rootRef}
      className={`arc-root arc-root--${variant} ${bodyClass}`}
      data-theme="dark"
      data-motion={motion === "terminal" ? "terminal" : undefined}
      style={variant === "index" ? ({ "--hero-lift": "1" } as CSSProperties) : undefined}
    >
      <div
        className="arc-hud-root"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />
      {variant === "detail" && menu && menu.length > 0 ? <ArcMenu items={menu} /> : null}
      {/* Light/dark toggle (ADR-058). The same leaf the landing mounts —
          three-free and Supabase-free, so it stays inside the arcs import
          doctrine. `data-theme="dark"` on `.arc-root` above is an inert
          marker; the live channel is the <html> attribute. */}
      {THEME_TOGGLE && <LightModeToggle />}
      {children}
    </main>
  );
}
