"use client";

import { useEffect, useRef } from "react";

import { RailInstruments } from "@/components/landing/v7/rail-instruments/RailInstruments";
import { SettingsCluster } from "@/components/landing/v7/rail-instruments/SettingsCluster";
import { RAIL_INSTRUMENTS } from "@/components/landing/v7/rail-instruments/flags";
import { THEME_TOGGLE } from "@/components/landing/v7/themeToggle";
import { EmbedStack } from "@/components/xb-proposal/embed/EmbedStack";
import { PlugFlow } from "@/components/xb-proposal/plug/PlugFlow";
import { Ready } from "@/components/xb-proposal/Ready";

import { HudFrame } from "../hud-panel-lab/HudFrame";

/**
 * /test/proposition-v2: the two sections the owner is honing in on
 * (2026-10-12), one after the other in the real HUD frame.
 *
 *   1  Where Thoughtform plugs in, as one flow (getcluster.ai's grammar):
 *      your workstreams → the layer → Claude Enterprise → your interfaces.
 *   2  Embed · encode · run, read the way unsiloed.ai's "how it works"
 *      reads: the three steps sticky on the left, one drawing scrolling past
 *      on the right (2026-10-12; the Griffin pin before it is gone). The
 *      flow's three labels link to the steps (`plugSteps.ts`, one record).
 *
 * Both heads are the homepage services masthead's grammar (`Masthead`).
 * "Adoption becomes automation" (`motion/`) came off the page on the
 * owner's word (2026-10-12); the component stays in the kit.
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
      <section className="xb pv-flow" id="embed">
        <EmbedStack />
      </section>
    </div>
  );
}
