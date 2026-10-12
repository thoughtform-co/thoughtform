"use client";

import { useEffect, useRef } from "react";

import { RailInstruments } from "@/components/landing/v7/rail-instruments/RailInstruments";
import { SettingsCluster } from "@/components/landing/v7/rail-instruments/SettingsCluster";
import { RAIL_INSTRUMENTS } from "@/components/landing/v7/rail-instruments/flags";
import { THEME_TOGGLE } from "@/components/landing/v7/themeToggle";
import {
  ContactSplit,
  ContactStrip,
  WeeksAxis,
  WeeksColumns,
  WeeksRows,
  WhoGrid,
  WhoRoster,
} from "@/components/xb-proposal/closing/Closing";
import {
  ContactFrame,
  ContactPanel,
  WeeksFrame,
  WeeksIndex,
  WhoFrame,
} from "@/components/xb-proposal/closing/Frames";
import { Ready } from "@/components/xb-proposal/Ready";

import { HudFrame } from "../hud-panel-lab/HudFrame";

/**
 * /test/xb-closing: the X-Bionic proposal's closing run, a few directions
 * each, in the real HUD frame (owner, 2026-10-12). Every section is its own
 * id so a still is one `#id` away.
 */
const SECTIONS = [
  ["weeks-d", WeeksFrame],
  ["weeks-e", WeeksIndex],
  ["who-c", WhoFrame],
  ["contact-c", ContactFrame],
  ["contact-d", ContactPanel],
  ["weeks-a", WeeksColumns],
  ["weeks-b", WeeksAxis],
  ["weeks-c", WeeksRows],
  ["who-a", WhoRoster],
  ["who-b", WhoGrid],
  ["contact-a", ContactSplit],
  ["contact-b", ContactStrip],
] as const;

export function XbClosingShell({ hudHtml, bodyClass }: { hudHtml: string; bodyClass: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
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
    <div ref={rootRef} className={`hy-root xcl-root ${bodyClass}`}>
      <HudFrame hudHtml={hudHtml} />
      {RAIL_INSTRUMENTS && <RailInstruments containerRef={rootRef} />}
      {THEME_TOGGLE && <SettingsCluster />}
      <Ready />
      {SECTIONS.map(([id, C]) => (
        <section key={id} id={id} className="xb xb-in-frame xcl-sec">
          <C />
        </section>
      ))}
    </div>
  );
}
