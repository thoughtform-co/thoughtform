import { ArcBeat } from "@/components/arcs/ArcBeat";
import { ArcHero } from "@/components/arcs/ArcHero";
import { ArcSectionRenderer } from "@/components/arcs/ArcSectionRenderer";
import { ArcShell } from "@/components/arcs/ArcShell";
import { EmbedStack } from "@/components/xb-proposal/embed/EmbedStack";
import { NetworkOrg } from "@/components/xb-proposal/network/NetworkOrg";
import { StackFlow } from "@/components/xb-proposal/stack/StackFlow";
import { getClient } from "@/lib/arcs/clients";
import { X_BIONIC_PROPOSAL_ARC as PROD } from "@/lib/arcs/content/x-bionic-proposal";
import { sliceV7Sections } from "@/lib/v7-parse";

import { LETTERED, type Stop, STOPS } from "../proposal-swarm/engine/clocks";
import { FLIES, type Fly } from "../proposal-swarm/engine/flight";
import { GRAINS } from "../proposal-swarm/engine/lattice";
import { type Mark, MARKS } from "../proposal-swarm/engine/mark";
import { SwarmAct } from "../proposal-swarm/SwarmAct";
import { CaseBar } from "./CaseBar";
import { CaseDossier } from "./dossier/CaseDossier";
import { CASES } from "./dossier/cases";
import { cutCase, HEAD_DEFAULT, HEADS } from "./dossier/story";
import type { Cut, Head } from "./dossier/types";
import { DOSSIER_ENTRY, spliceCases } from "./splice";

/* ⚠ STYLESHEET ORDER IS LOAD-BEARING: the swarm page's chain verbatim (itself
   the travelling copy's, itself the arc leaf route's), then the swarm's own
   sheet, then the dossier's LAST, so the arcs' rules never win inside it. */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/home-v2/services/casefile/console/console.css";
import "@/components/landing/home-v2/services/casefile/map/pda/pda.css";
import "@/components/landing/home-v2/services/proof-stack/proof-stack.css";
import "@/components/arcs/arcs.css";
import "@/components/arcs/course.css";
import "@/components/arcs/guide.css";
import "@/components/lattice/lattice.css";
import "@/components/instrument/instrument.css";
import "@/components/arcs/leverage.css";
import "@/components/arcs/job-stack.css";
import "@/components/arcs/proof-case.css";
import "@/components/arcs/proof-story.css";
import "@/components/arcs/stack/stack.css";
import "@/components/arcs/config-run.css";
import "@/components/arcs/approach-figure.css";
import "@/components/arcs/vision-figure.css";
import "@/components/arcs/prompt-to-loop/prompt-to-loop.css";
import "@/components/xb-proposal/xb.css";
import "@/components/xb-proposal/xb-in-frame.css";
import "@/components/xb-proposal/masthead.css";
import "@/components/xb-proposal/plug/plug.css";
import "@/components/xb-proposal/embed/embed.css";
import "@/components/xb-proposal/network/network.css";
import "@/components/xb-proposal/closing/closing.css";
import "@/app/(marketing)/arcs/thoughtform/workshop-v3/equilibrium.css";
import "@/components/arcs/equilibrium-beat.css";
import "@/components/sheet/sheet.css";
import "@/components/landing/v7/site-footer/site-footer.css";
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
import "@/components/xb-proposal/kit/kit.css";
import "@/components/xb-proposal/stack/stack-hero.css";
import "@/components/xb-proposal/network/network-org.css";
import "../proposal-swarm/proposal-swarm.css";
import "./dossier/dossier.css";

/* The two sections the swarm draws itself, by the ids the proposal gives them. */
const DRAWN = ["vision", "adoption"] as const;
const CUTS: readonly Cut[] = ["short", "full"];

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * A SERVER route: the swarm page as it is (the shell, the hero, the opening,
 * the steps and the network on the swarm's own canvas), then the rest of the
 * record with the four job panels replaced by the case dossier.
 *
 *   ?cut=short|full          5–6 chapters a case, or every chapter (short)
 *   ?case=loop|samako|suri   one case only, for review (all three)
 *   ?head=a|b|c|d            the case head's type, while the owner picks (c)
 *   ?still=1                 nothing rides a clock, posters stand: a still
 *   ?fly ?n ?mark ?at        the swarm's own switches, passed through
 */
export default async function ProposalSwarmV2Route({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const q = await searchParams;
  const fly = (FLIES as readonly string[]).includes(one(q.fly) ?? "")
    ? (one(q.fly) as Fly)
    : "fall";
  const grain = Number(one(q.n));
  const n = (GRAINS as readonly number[]).includes(grain) ? grain : undefined;
  const mark = (MARKS as readonly string[]).includes(one(q.mark) ?? "")
    ? (one(q.mark) as Mark)
    : "engrave";
  const at = (STOPS as readonly string[]).includes(one(q.at) ?? "")
    ? (one(q.at) as Stop)
    : undefined;
  const still = one(q.still) === "1";
  const cut = (CUTS as readonly string[]).includes(one(q.cut) ?? "")
    ? (one(q.cut) as Cut)
    : "short";
  const head = (HEADS as readonly string[]).includes(one(q.head) ?? "")
    ? (one(q.head) as Head)
    : HEAD_DEFAULT;
  const only = one(q.case);
  const cases = CASES.map((c) => cutCase(c, cut));

  if (PROD.sections[0].id !== DRAWN[0] || PROD.sections[1].id !== DRAWN[1]) {
    throw new Error(
      "proposal-swarm-v2: the proposal no longer opens on the vision and the approach"
    );
  }
  const motion = PROD.motion ?? "reveal";
  /* a pinned beat would clip the canvas's track and kill the dossier's sticky */
  if (motion === "terminal") {
    throw new Error("proposal-swarm-v2: the canvas and the dossier need the sections in flow");
  }
  /* the cases are switched inside the dossier, one at a time, so the menu
     points at the dossier ("The cases") and not at each case */
  const spliced = spliceCases(PROD.sections, DRAWN.length, [DOSSIER_ENTRY]);
  const slice = sliceV7Sections([]);
  return (
    <ArcShell
      hudHtml={slice.hudHtml}
      bodyClass={slice.bodyClass}
      variant="detail"
      menu={spliced.menu}
      motion={motion}
      gatewayPlate={PROD.hero.plate === "gateway"}
      curtain={PROD.hero.curtain ?? false}
      format={PROD.format}
      lock={PROD.theme}
      rhythm={PROD.rhythm}
      clientMark={PROD.client ? getClient(PROD.client)?.mark : undefined}
    >
      <ArcHero hero={PROD.hero} />

      {/* 1 · the vision, exactly as the swarm draws it */}
      <ArcBeat
        id="vision"
        kind="leverage"
        className="arc-section arc-xb-port"
        ariaLabel="AI capability your teams own"
        motion={motion}
      >
        <div className="psw-hold">
          <div className="xb xb-in-frame xb-sec psw">
            <StackFlow />
            <canvas className="psw-seat" aria-hidden />
          </div>
        </div>
      </ArcBeat>

      {/* 2 and 3 · the steps and the network, the swarm's canvas over all three */}
      <ArcBeat
        id="adoption"
        kind="handoff"
        className="arc-section arc-xb-port"
        ariaLabel="Navigate, encode, build"
        motion={motion}
      >
        <SwarmAct fly={fly} n={n} mark={mark} still={still} at={at} />
        <div className="xb xb-in-frame psw">
          <EmbedStack arrive />
        </div>
        <div className="xb xb-in-frame psw">
          <NetworkOrg lettered={LETTERED} />
        </div>
      </ArcBeat>

      <ArcSectionRenderer
        sections={spliced.head}
        motion={motion}
        indexOffset={spliced.headOffset}
      />

      {/* the cases, where the four job panels were */}
      <ArcBeat
        id={DOSSIER_ENTRY.id}
        kind="proof-card"
        className="arc-section"
        ariaLabel={DOSSIER_ENTRY.label}
        motion={motion}
      >
        <CaseDossier cases={cases} initial={only} head={head} still={still} />
      </ArcBeat>

      <ArcSectionRenderer
        sections={spliced.tail}
        motion={motion}
        indexOffset={spliced.tailOffset}
      />
      {still ? null : <CaseBar cut={cut} head={head} fly={fly} n={n} mark={mark} />}
    </ArcShell>
  );
}
