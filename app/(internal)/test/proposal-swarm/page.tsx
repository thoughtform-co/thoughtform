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

import { type Stop, STOPS } from "./engine/clocks";
import { FLIES, type Fly } from "./engine/flight";
import { GRAINS } from "./engine/lattice";
import { LabBar } from "./LabBar";
import { SwarmAct } from "./SwarmAct";

/* ⚠ STYLESHEET ORDER IS LOAD-BEARING: the travelling copy's chain VERBATIM
   (`app/(internal)/test/proposal-travel/page.tsx`, itself the arc leaf
   route's), so this page's cascade is that page's; then the lab's own sheet,
   last, which hides the three sections' drawings and seats the canvas. */
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
import "./proposal-swarm.css";

/* The two sections this copy draws itself, by the ids the proposal gives
   them. Everything after them is the proposal's own record. */
const DRAWN = ["vision", "adoption"] as const;

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * A SERVER route, mounted exactly as the travelling copy is: the shell, the
 * hero, the opening, the steps and the network, then the rest of the record.
 * The three sections are that copy's own components, unchanged; the lab adds
 * a class to their wrappers (`psw`, for its sheet) and the swarm's canvas as
 * the second beat's first child.
 *
 *   ?fly=march|drift|rigid   how the dots fly between sections (march)
 *   ?n=3|4                   sites a unit, held (absent: the lattice that fits)
 *   ?at=<stop>               open on a named stop (`engine/clocks.ts`)
 *   ?still=1                 nothing rides the clock and the bar is off: a still
 */
export default async function ProposalSwarmRoute({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const q = await searchParams;
  const fly = (FLIES as readonly string[]).includes(one(q.fly) ?? "")
    ? (one(q.fly) as Fly)
    : "march";
  const grain = Number(one(q.n));
  const n = (GRAINS as readonly number[]).includes(grain) ? grain : undefined;
  const at = (STOPS as readonly string[]).includes(one(q.at) ?? "")
    ? (one(q.at) as Stop)
    : undefined;
  const still = one(q.still) === "1";

  if (PROD.sections[0].id !== DRAWN[0] || PROD.sections[1].id !== DRAWN[1]) {
    throw new Error("proposal-swarm: the proposal no longer opens on the vision and the approach");
  }
  const motion = PROD.motion ?? "reveal";
  /* a pinned beat would clip the canvas's track (`.arc-plane`) */
  if (motion === "terminal") {
    throw new Error("proposal-swarm: the canvas needs the proposal's sections in flow");
  }
  const slice = sliceV7Sections([]);
  const menu = PROD.sections
    .filter((section) => section.menuLabel)
    .map((section) => ({
      id: section.id,
      label: section.menuLabel as string,
      primary: section.menuPrimary,
    }));
  return (
    <ArcShell
      hudHtml={slice.hudHtml}
      bodyClass={slice.bodyClass}
      variant="detail"
      menu={menu}
      motion={motion}
      gatewayPlate={PROD.hero.plate === "gateway"}
      curtain={PROD.hero.curtain ?? false}
      format={PROD.format}
      lock={PROD.theme}
      rhythm={PROD.rhythm}
      clientMark={PROD.client ? getClient(PROD.client)?.mark : undefined}
    >
      <ArcHero hero={PROD.hero} />

      {/* 1 · the vision: the flow, the stack where its hub was */}
      <ArcBeat
        id="vision"
        kind="leverage"
        className="arc-section arc-xb-port"
        ariaLabel="AI capability your teams own"
        motion={motion}
      >
        <div className="xb xb-in-frame xb-sec psw">
          <StackFlow />
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
        <SwarmAct fly={fly} n={n} still={still} at={at} />
        <div className="xb xb-in-frame psw">
          <EmbedStack arrive />
        </div>
        <div className="xb xb-in-frame psw">
          <NetworkOrg />
        </div>
      </ArcBeat>

      <ArcSectionRenderer
        sections={PROD.sections.slice(DRAWN.length)}
        motion={motion}
        indexOffset={DRAWN.length}
      />
      {still ? null : <LabBar fly={fly} n={n} />}
    </ArcShell>
  );
}
