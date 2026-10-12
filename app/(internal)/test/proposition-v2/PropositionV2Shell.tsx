"use client";

import { useEffect, useRef } from "react";

import { RailInstruments } from "@/components/landing/v7/rail-instruments/RailInstruments";
import { SettingsCluster } from "@/components/landing/v7/rail-instruments/SettingsCluster";
import { RAIL_INSTRUMENTS } from "@/components/landing/v7/rail-instruments/flags";
import { THEME_TOGGLE } from "@/components/landing/v7/themeToggle";
import { MotionPanels } from "@/components/xb-proposal/motion/MotionPanels";
import { PlugFlow } from "@/components/xb-proposal/plug/PlugFlow";
import { Ready } from "@/components/xb-proposal/Ready";

import { HudFrame } from "../hud-panel-lab/HudFrame";

/**
 * /test/proposition-v2: the two sections the owner is honing in on
 * (2026-10-12), one after the other in the real HUD frame.
 *
 *   1  Where Thoughtform plugs in, as one flow (getcluster.ai's grammar):
 *      your workstreams → the layer → Claude Enterprise → your interfaces.
 *   2  Adoption to automation, as three ruled panels (unsiloed.ai's
 *      grammar), one gold thread through all three.
 *
 * Both are kit components (`components/xb-proposal/plug`, `/motion`), so
 * the proposal page can mount them as they are.
 */
export function PropositionV2Shell({ hudHtml, bodyClass }: { hudHtml: string; bodyClass: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  /* No hero here, so the rails' clip is opened by hand (halyard's shell). */
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
    <div ref={rootRef} className={`hy-root pv-root ${bodyClass}`}>
      <HudFrame hudHtml={hudHtml} />
      {RAIL_INSTRUMENTS && <RailInstruments containerRef={rootRef} />}
      {THEME_TOGGLE && <SettingsCluster />}
      <Ready />

      <section className="xb pv-sec" id="plug">
        <PlugFlow />
      </section>
      <section className="xb pv-sec" id="motion">
        <MotionPanels />
      </section>
    </div>
  );
}
