import type { ArcMotion } from "@/lib/arcs/types";

import { EmbedStack } from "@/components/xb-proposal/embed/EmbedStack";
import { PlugFlow } from "@/components/xb-proposal/plug/PlugFlow";

import { ArcBeat } from "./ArcBeat";

/**
 * The X-Bionic proposal's two opening sections, ported whole from
 * /test/proposition-v2 (owner, 2026-10-12: "bring them into our X-Bionic
 * proposal page … the Holo-inspired visual, the Thoughtform plugin, adoption
 * and connect should be removed. We'll replace those with those new
 * sections"), the way `ArcOfferPort` ports S1 A: the kit's own component,
 * inside `.xb`, framed by `xb-in-frame.css`.
 *
 *   `plug`  — the vision: "AI capability your teams own.", the team, the
 *             layer and Claude Enterprise as one flow, its three labels
 *             linking down to the steps;
 *   `steps` — the approach: embed, encode, run, the head and the steps
 *             held while the plates close into one stack.
 *
 * Both read one record for the three steps (`plugSteps.ts`); the step
 * anchors the flow links to live in the steps' runway.
 */
export function ArcPlugPort({ id, motion = "reveal" }: { id: string; motion?: ArcMotion }) {
  return (
    <ArcBeat
      id={id}
      kind="leverage"
      className="arc-section arc-xb-port"
      ariaLabel="AI capability your teams own"
      motion={motion}
    >
      <div className="xb xb-in-frame xb-sec">
        <PlugFlow />
      </div>
    </ArcBeat>
  );
}

export function ArcStepsPort({ id, motion = "reveal" }: { id: string; motion?: ArcMotion }) {
  return (
    <ArcBeat
      id={id}
      kind="handoff"
      className="arc-section arc-xb-port"
      ariaLabel="Embed, encode, run"
      motion={motion}
    >
      <div className="xb xb-in-frame">
        <EmbedStack />
      </div>
    </ArcBeat>
  );
}
