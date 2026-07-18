"use client";

import { useCallback, useEffect, useState } from "react";

import { NavigateFrame } from "./NavigateFrame";
import { SectionMenuGauge } from "./menus/SectionMenuGauge";
import { SectionMenuGlyph } from "./menus/SectionMenuGlyph";
import { SectionMenuSpine } from "./menus/SectionMenuSpine";
import { SectionMenuTape } from "./menus/SectionMenuTape";
import { SectionMenuTerminal } from "./menus/SectionMenuTerminal";
import { MENU_VARIANTS, STATIONS, SUB_ID_SET } from "./stations";

/** Route components aligned 1:1 with MENU_VARIANTS order. */
const MENUS = [
  SectionMenuGlyph,
  SectionMenuGauge,
  SectionMenuTape,
  SectionMenuTerminal,
  SectionMenuSpine,
];

interface ShellProps {
  hudHtml: string;
  bodyClass: string;
}

/**
 * SectionMenuLabShell — owns lab state, deep-linking, and the lab
 * chrome. Composes the static Navigate frame with the active menu
 * route. State: `?v=1..5` (route), `?arc=0|1` (Arc drawer), `?active=`
 * (selected id). All reads happen in a mount effect (never
 * `useSearchParams` — that forces a CSR bailout of the route); writes
 * go through `history.replaceState`.
 */
export function SectionMenuLabShell({ hudHtml, bodyClass }: ShellProps) {
  const [variantIdx, setVariantIdx] = useState(0);
  const [insideArc, setInsideArc] = useState(true);
  const [activeId, setActiveId] = useState("navigate");
  const [showDiamond, setShowDiamond] = useState(false);

  // Adopt deep-linked state AFTER mount (SSR renders the defaults;
  // reading location in the initializer would mismatch hydration).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("v");
    if (v) {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 1 && n <= MENUS.length) setVariantIdx(n - 1);
      else {
        const byId = MENU_VARIANTS.findIndex((m) => m.id === v);
        if (byId >= 0) setVariantIdx(byId);
      }
    }
    const arc = q.get("arc");
    if (arc === "0") setInsideArc(false);
    else if (arc === "1") setInsideArc(true);
    const active = q.get("active");
    if (active && STATIONS.some((s) => s.id === active || s.subs?.some((x) => x.id === active))) {
      setActiveId(active);
    }
    if (q.get("rail") === "1") setShowDiamond(true);
  }, []);

  const commit = useCallback(
    (next: { variantIdx?: number; insideArc?: boolean; activeId?: string; rail?: boolean }) => {
      const v = next.variantIdx ?? variantIdx;
      const arc = next.insideArc ?? insideArc;
      const active = next.activeId ?? activeId;
      const rail = next.rail ?? showDiamond;
      if (next.variantIdx !== undefined) setVariantIdx(next.variantIdx);
      if (next.insideArc !== undefined) setInsideArc(next.insideArc);
      if (next.activeId !== undefined) setActiveId(next.activeId);
      if (next.rail !== undefined) setShowDiamond(next.rail);
      const url = new URL(window.location.href);
      url.searchParams.set("v", String(v + 1));
      url.searchParams.set("arc", arc ? "1" : "0");
      url.searchParams.set("active", active);
      if (rail) url.searchParams.set("rail", "1");
      else url.searchParams.delete("rail");
      window.history.replaceState(null, "", url.toString());
    },
    [variantIdx, insideArc, activeId, showDiamond]
  );

  // Selecting a beat or the Arc itself opens the drawer.
  const handleSelect = useCallback(
    (id: string) => {
      const opensArc = id === "arc" || SUB_ID_SET.has(id);
      commit({ activeId: id, ...(opensArc ? { insideArc: true } : {}) });
    },
    [commit]
  );

  const activeIsSub = SUB_ID_SET.has(activeId);
  const activeTopId = activeIsSub ? "arc" : activeId;
  const activeSubId = activeIsSub ? activeId : null;

  const ActiveMenu = MENUS[variantIdx];
  const variant = MENU_VARIANTS[variantIdx];

  return (
    <main
      className={`sml home-v2-root ${bodyClass}`}
      data-theme="dark"
      data-variant={variant.id}
      data-inside-arc={insideArc || undefined}
    >
      <NavigateFrame hudHtml={hudHtml} showDiamond={showDiamond} />

      <ActiveMenu
        stations={STATIONS}
        activeTopId={activeTopId}
        activeSubId={activeSubId}
        expanded={insideArc}
        onSelect={handleSelect}
      />

      {/* ── Lab chrome ─────────────────────────────────────────────── */}
      <div className="sml-console" aria-label="Section menu lab controls">
        <div className="sml-chips" role="tablist" aria-label="Design routes">
          {MENU_VARIANTS.map((m, i) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              className="sml-chip"
              data-on={i === variantIdx || undefined}
              aria-selected={i === variantIdx}
              onClick={() => commit({ variantIdx: i })}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="sml-toggles">
          <button
            type="button"
            className="sml-toggle"
            data-on={insideArc || undefined}
            aria-pressed={insideArc}
            onClick={() => commit({ insideArc: !insideArc })}
          >
            <i className="sml-toggle__led" aria-hidden="true" />
            INSIDE ARC
          </button>
          <button
            type="button"
            className="sml-toggle"
            data-on={showDiamond || undefined}
            aria-pressed={showDiamond}
            onClick={() => commit({ rail: !showDiamond })}
          >
            <i className="sml-toggle__led" aria-hidden="true" />
            RAIL DETENT
          </button>
        </div>

        <p className="sml-thesis">{variant.thesis}</p>
        <p className="sml-prov">
          <span className="sml-prov__diamond" aria-hidden="true" />
          {variant.provenance}
        </p>
      </div>
    </main>
  );
}
