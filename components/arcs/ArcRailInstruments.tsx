"use client";

/**
 * ArcRailInstruments — the arcs' two working corners (ADR-059 U6).
 *
 * The landing has carried the four-corner scheme since ADR-059; the arcs
 * never got it, and their top-left and bottom-right were still the
 * pre-ADR-059 empty brackets with the theme switch floating inboard of one.
 * The owner asked for both, this pass gives them both, and it reverses U2's
 * explicit "that page has no row to put beside the control" — the arc has a
 * row now, so the control can reach out to the rail as it does on the landing.
 *
 * ⚠ ONE COMPONENT FOR BOTH CORNERS, which is the whole reason it is
 * arc-specific rather than a prop on `RailInstruments`. Three things follow
 * from it:
 *
 *   1. ONE `useArcActiveSection`, not two. The landing's corners must read
 *      the bus separately because they are siblings under a root that owns a
 *      `dangerouslySetInnerHTML` body; `ArcShell` owns one too, so the state
 *      lives HERE, in the leaf, and the shell never re-renders.
 *   2. No right-rail telemetry. `RailInstruments` also portals Bearing /
 *      Sector / Local into the right rail, read off corridor channels that do
 *      not exist on an arc.
 *   3. No `clusters.ts`. That module resolves the landing's roster against
 *      `MANIFEST_ENTRIES` at module evaluation and THROWS on a miss — so an
 *      arc that imported it would white-screen the day a landing station is
 *      renamed. `arcMarks` builds the roster from the arc's own menu.
 *
 * ⚠ `createPortal`, NEVER `createRoot` — same ban and same reason as
 * `RailInstruments`: a nested root inside the injected HUD markup is orphaned
 * the moment that markup is re-applied.
 */

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { MarkRow } from "@/components/landing/v7/rail-instruments/MarkRow";
import { SettingsCluster } from "@/components/landing/v7/rail-instruments/SettingsCluster";

import type { ArcMenuItem } from "./ArcShell";
import { buildArcMarks } from "./arcMarks";
import { useArcActiveSection } from "./useArcActiveSection";

export function ArcRailInstruments({
  containerRef,
  menu,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  menu: readonly ArcMenuItem[];
}) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const activeIdx = useArcActiveSection(menu);
  /* ⚠ `menu` is the STABLE prop, not a filtered copy — a fresh array identity
     would rebuild the observer on every render. */
  const roster = useMemo(() => buildArcMarks(menu), [menu]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const corner = root.querySelector<HTMLElement>(".hud__corner--tl");
    if (!corner) return;
    const div = document.createElement("div");
    div.className = "rin-host";
    corner.appendChild(div);
    /* The attribute the whole `rail-instruments.css` sheet keys off — it is
       what suppresses both brackets and moves the controls outboard onto the
       rail track above 961px. Two routes write it now; neither can be mounted
       at once, and both clean up after themselves. */
    document.documentElement.dataset.railInstruments = "on";
    setHost(div);
    return () => {
      div.remove();
      setHost(null);
      delete document.documentElement.dataset.railInstruments;
    };
  }, [containerRef]);

  return (
    <>
      {host
        ? createPortal(
            <div className="rin-cl rin-cl--journey" aria-hidden="true">
              <MarkRow marks={roster.chapters} activeIdx={activeIdx} seat={activeIdx} />
            </div>,
            host
          )
        : null}
      {/* ⚠ THE CONTROLS RENDER ON THE FIRST COMMIT, never behind the portal
          host's state. `HeroThemeGlitch` arms its plate-warm listener by
          finding `.theme-toggle` one rAF after mount (ADR-060); a switch that
          appears two frames late loses the warm and the first theme toggle
          degrades to a hard cut, with nothing to say so. */}
      <SettingsCluster
        marks={roster.exit ? [roster.exit] : []}
        activeIdx={activeIdx}
        seat={activeIdx}
      />
    </>
  );
}
