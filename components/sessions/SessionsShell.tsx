"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { ArcHudNav } from "@/components/arcs/ArcHudNav";
import { ArcRailInstruments } from "@/components/arcs/ArcRailInstruments";
import { useArcReveal } from "@/components/arcs/useArcReveal";
import { useArcScroll } from "@/components/arcs/useArcScroll";
import { HeroThemeGlitch } from "@/components/landing/v7/HeroThemeGlitch";
import { LightModeToggle } from "@/components/landing/v7/LightModeToggle";
import { useHeroBoot } from "@/components/landing/v7/hooks/useHeroBoot";
import { RAIL_INSTRUMENTS } from "@/components/landing/v7/rail-instruments/flags";
import { THEME_TOGGLE } from "@/components/landing/v7/themeToggle";

interface SessionsShellProps {
  /** `sliceV7Sections([]).hudHtml` — the parsed HUD chrome (server-only read). */
  hudHtml: string;
  /** `sliceV7Sections([]).bodyClass`. */
  bodyClass: string;
  /** The drawer's rows; every one a chapter. */
  chapters: readonly { id: string; label: string; primary?: boolean }[];
  children: ReactNode;
}

/** The faces the page letters in, waited on before the stamp is written. */
const FACES = ['500 1em "PP Neue Montreal"', '400 1em "PP Neue Montreal"', '400 1em "PT Mono"'];

/**
 * SessionsShell — the one client component wrapping `/home-sessions`
 * (ADR-150).
 *
 * It COPIES `ArcShell`'s mechanism, as `SheetShell` does, and takes only what
 * this page needs: the parsed HUD chrome injected once, the site's header
 * over the page's four chapters, the four corners, the ONE scroll writer in
 * its DETAIL variant (the page has a hero, so `--hero-lift` is written from
 * scroll and the rails uncover with the hero's bottom edge, the landing's
 * curtain), the hero's terminal boot, the theme glitch and the one-shot
 * reveal on `.hs-reveal`.
 *
 * ⚠ THE GLITCH MOUNTS AFTER THE CORNERS. It finds `.theme-toggle` on mount,
 * and the toggle is the corners' (ArcShell's own order).
 *
 * ⚠ `data-hs-ready` IS THE OBSERVABLE the smoke and the capture wait on. It
 * is written after the three faces load and two frames paint, and it carries
 * values only the page can produce: the loaded faces, the section count, the
 * live rail height.
 */
export function SessionsShell({ hudHtml, bodyClass, chapters, children }: SessionsShellProps) {
  const rootRef = useRef<HTMLElement>(null);

  useArcScroll({ variant: "detail", rootRef });
  useHeroBoot(rootRef);
  useArcReveal({ rootRef, selector: ".hs-reveal", jsClass: "is-hs-js" });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Wordmark → home; the authored hudHtml links `#hero`.
    root.querySelector(".hud__brand")?.setAttribute("href", "/");

    let cancelled = false;
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    const loads = fonts ? FACES.map((f) => fonts.load(f)) : [];
    Promise.allSettled(loads)
      .then(() => fonts?.ready)
      .then(() => {
        if (cancelled) return;
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (cancelled) return;
            const loaded = fonts ? FACES.filter((f) => fonts.check(f)).length : 0;
            const sections = root.querySelectorAll("[data-hs-section]").length;
            const rail = root.querySelector(".hud__rail")?.getBoundingClientRect().height ?? 0;
            root.setAttribute("data-hs-ready", `${loaded}|${sections}|${Math.round(rail)}`);
          })
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main
      ref={rootRef}
      className={`hs-root ${bodyClass}`}
      /* inert: no selector reads `[data-theme="dark"]` (ADR-058) */
      data-theme="dark"
    >
      <div
        className="hs-hud-root"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />
      <ArcHudNav items={chapters} />
      {THEME_TOGGLE &&
        (RAIL_INSTRUMENTS ? (
          <ArcRailInstruments containerRef={rootRef} menu={chapters} />
        ) : (
          <LightModeToggle />
        ))}
      {THEME_TOGGLE ? <HeroThemeGlitch containerRef={rootRef} /> : null}
      {children}
    </main>
  );
}
