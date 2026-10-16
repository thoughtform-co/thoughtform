"use client";

import { LETTERED } from "@/app/(internal)/test/proposal-swarm/engine/clocks";
import { SwarmAct } from "@/app/(internal)/test/proposal-swarm/SwarmAct";
import { EmbedStack } from "@/components/xb-proposal/embed/EmbedStack";
import { NetworkOrg } from "@/components/xb-proposal/network/NetworkOrg";
import { StackFlow } from "@/components/xb-proposal/stack/StackFlow";

/**
 * The swarm chapter (ADR-159): the X-Bionic proposal's second, third and
 * fourth sections, "AI capability your teams own." to "Marketing first,
 * then every team.", drawn by the particle swarm of `/test/proposal-swarm`.
 * On this page it follows the talk's last beat, the picture under "a node
 * in latent space that agents flow through", and leads into the Arc.
 *
 * ⚠ THE SWARM PAGE'S MARKUP, VERBATIM BUT FOR THE WRAPPER: the engine reads
 * the page by class (`.psw-hold`, `.psw .es-runway`, `.psw .xn`…, see
 * `engine/measure.ts`), so the three sections keep exactly the structure that
 * route gives them. Its defaults: `fly="fall"`, the engraved mark, the
 * lattice that fits, live.
 *
 * In flow, `reveal` grammar: the swarm's canvas is a sticky track over the
 * three sections and a pinned beat would clip it (the swarm route throws on
 * `terminal` for the same reason).
 *
 * The chapter's own words are still the proposal's ("X-Bionic · Marketing",
 * "XB / STEPS"); a keynote variant of those labels is a later round.
 */
export default function SwarmChapter() {
  return (
    <div className="arc-root arc-root--detail kta-swarm__root">
      <section id="kta-vision" className="arc-section arc-xb-port" aria-label="AI capability your teams own">
        <div className="psw-hold">
          <div className="xb xb-in-frame xb-sec psw">
            <StackFlow />
            <canvas className="psw-seat" aria-hidden />
          </div>
        </div>
      </section>
      <section id="kta-adoption" className="arc-section arc-xb-port" aria-label="Navigate, encode, build">
        <SwarmAct fly="fall" mark="engrave" still={false} />
        <div className="xb xb-in-frame psw">
          <EmbedStack arrive />
        </div>
        <div className="xb xb-in-frame psw">
          <NetworkOrg lettered={LETTERED} />
        </div>
      </section>
    </div>
  );
}
