import type { ArcMotion } from "@/lib/arcs/types";

import { ContactPanel, WeeksFrame, WhoFrame } from "@/components/xb-proposal/closing/Frames";

import { ArcBeat } from "./ArcBeat";

/**
 * The X-Bionic proposal's closing run, ported from /test/xb-closing (owner,
 * 2026-10-12: "promote this to the proposal page"), the way `ArcFlowPorts`
 * ports the plug flow: the kit's own component inside `.xb.xb-in-frame`.
 *
 *   `xb-weeks`   — the four weeks, three phases in one hairline frame;
 *   `xb-who`     — who takes part, the two sides in one frame;
 *   `xb-contact` — talk it through, the masthead's type beside the card.
 *
 * Each section grows with its content (never squeezed into one screen).
 */
const PORTS = {
  "xb-weeks": { C: WeeksFrame, kind: "list-groups", label: "The four weeks" },
  "xb-who": { C: WhoFrame, kind: "list-groups", label: "Who takes part" },
  "xb-contact": { C: ContactPanel, kind: "close", label: "Talk it through" },
} as const;

export function ArcClosingPort({
  id,
  port,
  motion = "reveal",
}: {
  id: string;
  port: keyof typeof PORTS;
  motion?: ArcMotion;
}) {
  const { C, kind, label } = PORTS[port];
  return (
    <ArcBeat id={id} kind={kind} className="arc-section arc-xb-port" ariaLabel={label} motion={motion}>
      <div className="xb xb-in-frame xc-sec">
        <C />
      </div>
    </ArcBeat>
  );
}
