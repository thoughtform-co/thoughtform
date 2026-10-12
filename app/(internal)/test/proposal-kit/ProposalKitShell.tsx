"use client";

import { useEffect, type ReactNode } from "react";

import { LightModeToggle } from "@/components/landing/v7/LightModeToggle";
import { THEME_TOGGLE } from "@/components/landing/v7/themeToggle";
import { Ready } from "@/components/xb-proposal/Ready";

/**
 * The lab's frame: the arc root as `ArcShell` stamps it for the X-Bionic
 * proposal (format `proposal`, rhythm `fill`), the real HUD markup mounted
 * the way the shell mounts it, and nothing else. No scroll writer runs here,
 * so the rails are lit by hand (`--hero-lift`), as `/test/xb-closing` does,
 * and the wordmark is docked by hand.
 * No reveal observer either: every section reads at rest.
 */
export function ProposalKitShell({
  hudHtml,
  bodyClass,
  still,
  index,
  children,
}: {
  hudHtml: string;
  bodyClass: string;
  still: boolean;
  index: readonly { id: string; code: string; name: string }[];
  children: ReactNode;
}) {
  useEffect(() => {
    const html = document.documentElement;
    html.style.setProperty("--hero-lift", "1");
    html.style.setProperty("--hero-cover", "1");
    // The wordmark sits docked, as it does on the proposal once the hero has
    // gone (`useArcScroll` collapses it past half a screen); undocked it
    // would lie over the bottom-left of every section here.
    document.querySelector(".pkit-root .hud__brand")?.classList.add("is-collapsed");
    return () => {
      html.style.removeProperty("--hero-lift");
      html.style.removeProperty("--hero-cover");
    };
  }, []);

  return (
    <main
      className={`arc-root arc-root--detail pkit-root ${bodyClass}`}
      data-arc-format="proposal"
      data-arc-rhythm="fill"
      data-pkit-still={still ? "" : undefined}
    >
      <div
        className="arc-hud-root"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />
      {THEME_TOGGLE ? <LightModeToggle /> : null}
      <Ready />
      {children}
      <nav className="pkit-index" aria-label="Sections on this page">
        {index.map((s) => (
          <a key={s.id} href={`#${s.id}`} title={s.name}>
            <b>{s.code}</b>
            {s.name}
          </a>
        ))}
      </nav>
    </main>
  );
}
