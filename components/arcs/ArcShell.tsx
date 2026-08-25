"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

import type { ArcMotion } from "@/lib/arcs/types";

import { HeroThemeGlitch } from "@/components/landing/v7/HeroThemeGlitch";
import { LightModeToggle } from "@/components/landing/v7/LightModeToggle";
import { useHeroBoot } from "@/components/landing/v7/hooks/useHeroBoot";
import { RAIL_INSTRUMENTS } from "@/components/landing/v7/rail-instruments/flags";
import { THEME_TOGGLE } from "@/components/landing/v7/themeToggle";

import { ArcHudNav } from "./ArcHudNav";
import { ArcRailInstruments } from "./ArcRailInstruments";
import { ARC_TERMINAL_MEDIA } from "./arcMotion";
import { useArcScroll } from "./useArcScroll";
import { useArcTerminalMotion } from "./useArcTerminalMotion";

export interface ArcMenuItem {
  id: string;
  label: string;
  /** A chapter — it takes a link in the header's inline row too (ADR-073). */
  primary?: boolean;
}

interface ArcShellProps {
  /** `sliceV7Sections([]).hudHtml` — the parsed HUD chrome (server-only read). */
  hudHtml: string;
  /** `sliceV7Sections([]).bodyClass` — "theme-instrument density-comfortable". */
  bodyClass: string;
  variant: "index" | "detail";
  /** `hero.plate === "gateway"` — the hero is the landing's own plate, so
   *  it gets the landing's theme-swap glitch too (ADR-075). */
  gatewayPlate?: boolean;
  /** `hero.curtain` — run the ADR-076 seam on an own-plate hero
   *  (ADR-078 U1). The gateway plate implies it; this is how a hero that
   *  paints its own image asks for the same choreography. */
  curtain?: boolean;
  /** Detail only — sections with a menuLabel, in page order. */
  menu?: readonly ArcMenuItem[];
  /** Choreography system (ADR-057). Default: the ADR-052 IO reveal. */
  motion?: ArcMotion;
  /**
   * `ArcDef.format`, published as `data-arc-format` (ADR-079).
   *
   * ⚠ It exists so a LAYOUT law can be scoped to one format. The
   * portfolio gives every section its own viewport; the decks must not
   * inherit that — a workshop runs to twenty-plus sections and a
   * one-beat-per-screen rule there would triple the page. `motion` cannot
   * carry this: the workshop v1 and the portfolio are both reveal pages.
   */
  format?: string;
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
  gatewayPlate = false,
  curtain = false,
  format,
  children,
}: ArcShellProps) {
  const rootRef = useRef<HTMLElement>(null);

  // The beat clocks ride the one scroll writer rather than adding a
  // second listener (ADR-002) — hence the callback handoff.
  const onBeatFrame = useArcTerminalMotion({ rootRef, motion });
  useArcScroll({ variant, rootRef, onFrame: onBeatFrame });
  // The hero's terminal boot — the landing's, shared (ADR-075). A no-op
  // on the overview, which renders no hero.
  useHeroBoot(rootRef);

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
      data-arc-format={format}
      data-theme="dark"
      data-motion={motion === "terminal" ? "terminal" : undefined}
      /* THE CURTAIN, ON THE FLOWING PATH (ADR-076). ADR-075's seam is
         CSS-gated on `[data-motion="terminal"]`, because that was the only
         grammar carrying the landing's plate when it shipped. The portfolio
         flows now and still wants the seam, so a reveal page declares it
         here. Terminal pages keep their own selector — the two never both
         apply, and the held element differs (the plane there, the first
         section's band here).

         ⚠ IT NO LONGER ASKS ABOUT THE PLATE (ADR-078 U1). This gate read
         `gatewayPlate`, which coupled a CHOREOGRAPHY to an IMAGE: the
         portfolio taking a Loop key visual would have lost the hold
         silently, with one smoke assertion the only thing to say so. A
         hero declares `curtain: true` when it wants the seam; the plate
         answers only for what is painted. */
      data-arc-curtain={
        variant === "detail" && (gatewayPlate || curtain) && motion !== "terminal" ? "" : undefined
      }
      style={variant === "index" ? ({ "--hero-lift": "1" } as CSSProperties) : undefined}
    >
      <div
        className="arc-hud-root"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />
      {/* The site's header (ADR-073): chapter links in the hero, the
          section readout + drawer once scrolled — the landing's own
          control and its own chrome. It REPLACED the left reel, which
          only existed above 1101×760 and left 1280×720 with no
          navigation at all (ADR-055's ruling, one surface later). */}
      {variant === "detail" && menu && menu.length > 0 ? <ArcHudNav items={menu} /> : null}
      {/* THE TWO WORKING CORNERS (ADR-059 U6) — the chapters top-left, the
          exit mark + session + theme switch bottom-right, the switch centred
          on the right rail's track. It replaces the standalone toggle on any
          arc that HAS chapters to put in the corner; the `/arcs` overview
          keeps `LightModeToggle` and both brackets, which is the sliver of
          ADR-059 U2's "the arcs have no row" ruling that survives, and it is
          visible on screen.
          ⚠ The toggle itself is the same leaf either way — three-free and
          Supabase-free, so both paths stay inside the arcs import doctrine,
          and `HeroThemeGlitch` below finds `.theme-toggle` in both. */}
      {THEME_TOGGLE &&
        (RAIL_INSTRUMENTS && variant === "detail" && menu && menu.length > 0 ? (
          <ArcRailInstruments containerRef={rootRef} menu={menu} />
        ) : (
          <LightModeToggle />
        ))}
      {/* The hero's theme-swap glitch (ADR-060), for the heroes that carry
          the landing's plate — the canvas masks an already-committed CSS
          flip, so every failure path degrades to that hard cut. A leaf by
          the same law as the toggle: it subscribes to the theme store
          imperatively and owns no state here. */}
      {THEME_TOGGLE && gatewayPlate && variant === "detail" ? (
        <HeroThemeGlitch containerRef={rootRef} />
      ) : null}
      {children}
    </main>
  );
}
