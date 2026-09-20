"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

import { ArcHudNav } from "@/components/arcs/ArcHudNav";
import { ArcRailInstruments } from "@/components/arcs/ArcRailInstruments";
import { useArcReveal } from "@/components/arcs/useArcReveal";
import { useArcScroll } from "@/components/arcs/useArcScroll";
import { LightModeToggle } from "@/components/landing/v7/LightModeToggle";
import { RAIL_INSTRUMENTS } from "@/components/landing/v7/rail-instruments/flags";
import { THEME_TOGGLE } from "@/components/landing/v7/themeToggle";
import type { SheetChapter } from "@/lib/sheet/composition";
import { knobAttrs, SH_DEFAULTS } from "@/lib/sheet/directions";
import type { ShKnobs } from "@/lib/sheet/directions";

import { SheetQueryKnobs } from "./SheetQueryKnobs";

interface SheetShellProps {
  /** `sliceV7Sections([]).hudHtml` — the parsed HUD chrome (server-only read). */
  hudHtml: string;
  /** `sliceV7Sections([]).bodyClass`. */
  bodyClass: string;
  /** The page's slug, published as `data-sh-page`. */
  page: string;
  /** `chaptersOf(sections)` — the drawer's rows, the chapters among them. */
  chapters: readonly SheetChapter[];
  /** The knobs the server renders; the house unless a lab says otherwise. */
  knobs?: ShKnobs;
  children: ReactNode;
}

/**
 * SheetShell — the one client component wrapping a sheet page (ADR-114).
 *
 * It COPIES `ArcShell`'s mechanism and imports none of the arcs' grammar:
 * the parsed HUD chrome injected once, the site's header (`ArcHudNav`) over
 * this page's chapters, the four corners (`ArcRailInstruments`), the one
 * scroll writer (`useArcScroll`, index variant — there is no hero, so
 * `--hero-lift` is pinned to 1 and the rails are uncovered from the first
 * paint) and the one-shot reveal (`useArcReveal` on `.sh-reveal`).
 *
 * ⚠ THE KNOBS ARE ATTRIBUTES ON THIS ROOT. The server renders the house
 * values; `SheetQueryKnobs` overrides them from `?k=<ID>` after mount, so a
 * reader without JS gets the house and a capture gets its direction.
 *
 * ⚠ `data-sh-ready` IS THE CAPTURE'S OBSERVABLE. It is written only after
 * the three faces the sheet letters in have loaded (PP Neue Montreal Medium
 * is not preloaded by the layout) and two frames have painted, and it
 * carries values the page computed — the loaded-face count, the section
 * count and the live rail height — so a script cannot satisfy it by itself.
 */
export function SheetShell({
  hudHtml,
  bodyClass,
  page,
  chapters,
  knobs = SH_DEFAULTS,
  children,
}: SheetShellProps) {
  const rootRef = useRef<HTMLElement>(null);

  useArcScroll({ variant: "index", rootRef });
  useArcReveal({ rootRef, selector: ".sh-reveal", jsClass: "is-sh-js" });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Wordmark → home; the authored hudHtml links `#hero`, which is dead here.
    root.querySelector(".hud__brand")?.setAttribute("href", "/");

    let cancelled = false;
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    const loads = fonts
      ? [
          fonts.load('500 1em "PP Neue Montreal"'),
          fonts.load('400 1em "PP Neue Montreal"'),
          fonts.load('400 1em "PT Mono"'),
        ]
      : [];
    Promise.allSettled(loads)
      .then(() => fonts?.ready)
      .then(() => {
        if (cancelled) return;
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (cancelled) return;
            const loaded = fonts
              ? [
                  '500 1em "PP Neue Montreal"',
                  '400 1em "PP Neue Montreal"',
                  '400 1em "PT Mono"',
                ].filter((f) => fonts.check(f)).length
              : 0;
            const sections = root.querySelectorAll("[data-sh-arrangement]").length;
            const rail = root.querySelector(".hud__rail")?.getBoundingClientRect().height ?? 0;
            root.setAttribute("data-sh-ready", `${loaded}|${sections}|${Math.round(rail)}`);
          })
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasChapters = chapters.length > 0;

  return (
    <main
      ref={rootRef}
      className={`sh-root ${bodyClass}`}
      data-sh-page={page}
      {...knobAttrs(knobs)}
      /* No selector reads `[data-theme="dark"]` (ADR-058 forbids authoring
         one); this answers "what theme is this subtree" to anything that
         asks, and no sheet page is light-locked. */
      data-theme="dark"
      style={{ "--hero-lift": "1" } as CSSProperties}
    >
      <div
        className="sh-hud-root"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />
      {hasChapters ? <ArcHudNav items={chapters} /> : null}
      {THEME_TOGGLE &&
        (RAIL_INSTRUMENTS && hasChapters ? (
          <ArcRailInstruments containerRef={rootRef} menu={chapters} />
        ) : (
          <LightModeToggle />
        ))}
      <SheetQueryKnobs />
      {children}
    </main>
  );
}
