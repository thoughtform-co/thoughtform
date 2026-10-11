"use client";

import { useEffect, useRef } from "react";

import { RailInstruments } from "@/components/landing/v7/rail-instruments/RailInstruments";
import { SettingsCluster } from "@/components/landing/v7/rail-instruments/SettingsCluster";
import { RAIL_INSTRUMENTS } from "@/components/landing/v7/rail-instruments/flags";
import { THEME_TOGGLE } from "@/components/landing/v7/themeToggle";
import { LayerPinned } from "@/components/xb-proposal/layer/LayerPinned";
import { OfferPinned } from "@/components/xb-proposal/offer/OfferPinned";
import { Ready } from "@/components/xb-proposal/Ready";
import { SubstrateHero } from "@/components/xb-proposal/substrate/SubstrateHero";
import { SubstrateBoard } from "@/components/xb-proposal/substrate/SubstrateBoard";
import { SubstrateBoardB } from "@/components/xb-proposal/substrate/SubstrateBoardB";
import { SubstrateSheets } from "@/components/xb-proposal/substrate/SubstrateSheets";

import { DirectionA as HalyardA } from "../halyard/DirectionA";
import { HudFrame } from "../hud-panel-lab/HudFrame";

/**
 * /test/proposition-artifact: the owner's picks from the two rebuild labs on
 * one page, in the real HUD frame, as the place to iterate the proposition's
 * artifact (2026-10-11). Section 1 candidates first, then section 2.
 *
 *   1  xb-offer-rebuild · S1 A, the pinned build
 *   2  halyard · A, the assembly
 *   3  xb-offer-rebuild · P1, the exploded sheets
 *   4  xb-offer-rebuild · P3, the board
 *   5  xb-offer-rebuild · S2 A, the pinned build continued (section 2)
 *   6  xb-offer-rebuild · P4, Unsiloed's hero, the team's raw work
 *      written into one gold panel
 *   7  P3 B, the board's second cut: the mark etched, the chip wider,
 *      Claude Enterprise alone, the four interfaces as upright windows
 *
 * The two labs stay as they are; this page only mounts their components.
 */
export const BLOCKS = [
  { id: "s1-pinned", n: "1", short: "S1 A", label: "S1 · A · pinned build" },
  { id: "halyard-a", n: "2", short: "Halyard A", label: "Halyard · A · assembly" },
  { id: "p1-sheets", n: "3", short: "P1", label: "P1 · exploded sheets" },
  { id: "p3-board", n: "4", short: "P3", label: "P3 · the board" },
  { id: "s2-pinned", n: "5", short: "S2 A", label: "S2 · A · pinned build" },
  { id: "p4-hero", n: "6", short: "P4", label: "P4 · Unsiloed hero" },
  { id: "p3b-board", n: "7", short: "P3 B", label: "P3 B · the board, windows" },
] as const;

export function PropositionShell({ hudHtml, bodyClass }: { hudHtml: string; bodyClass: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  /* The frame's rails are clipped to the hero's bottom edge; with no hero,
     the properties are set by hand so the rails show (halyard's shell). */
  useEffect(() => {
    const html = document.documentElement;
    html.style.setProperty("--hero-lift", "1");
    html.style.setProperty("--hero-cover", "1");
    return () => {
      html.style.removeProperty("--hero-lift");
      html.style.removeProperty("--hero-cover");
    };
  }, []);

  return (
    <div ref={rootRef} className={`hy-root pa-root ${bodyClass}`}>
      <HudFrame hudHtml={hudHtml} />
      {RAIL_INSTRUMENTS && <RailInstruments containerRef={rootRef} />}
      {THEME_TOGGLE && <SettingsCluster />}
      <Ready />

      <div className="xb pa-xb" id="s1-pinned">
        <OfferPinned />
      </div>
      <div className="pa-block" id="halyard-a">
        <HalyardA step={null} />
      </div>
      <div className="xb pa-xb" id="p1-sheets">
        <SubstrateSheets />
      </div>
      <div className="xb pa-xb" id="p3-board">
        <SubstrateBoard />
      </div>
      <div className="xb pa-xb" id="s2-pinned">
        <LayerPinned />
      </div>
      <div className="xb pa-xb" id="p4-hero">
        <SubstrateHero />
      </div>
      <div className="xb pa-xb" id="p3b-board">
        <SubstrateBoardB />
      </div>

      <nav className="pa-index" aria-label="Blocks on this page">
        {BLOCKS.map((b) => (
          <a key={b.id} href={`#${b.id}`} title={b.label}>
            <span>{b.n}</span>
            {b.short}
          </a>
        ))}
      </nav>
    </div>
  );
}
