import { ArcBeat } from "@/components/arcs/ArcBeat";
import { ArcHero } from "@/components/arcs/ArcHero";
import { ArcSectionRenderer } from "@/components/arcs/ArcSectionRenderer";
import { ArcShell } from "@/components/arcs/ArcShell";
import { EmbedStack } from "@/components/xb-proposal/embed/EmbedStack";
import { NetworkOrg } from "@/components/xb-proposal/network/NetworkOrg";
import { NetworkPlug } from "@/components/xb-proposal/network/NetworkPlug";
import { StackFlow } from "@/components/xb-proposal/stack/StackFlow";
import { StackHero } from "@/components/xb-proposal/stack/StackHero";
import { getClient } from "@/lib/arcs/clients";
import { X_BIONIC_PROPOSAL_ARC as PROD } from "@/lib/arcs/content/x-bionic-proposal";
import { sliceV7Sections } from "@/lib/v7-parse";

/* ⚠ STYLESHEET ORDER IS LOAD-BEARING: the arc leaf route's chain VERBATIM
   (`app/(marketing)/arcs/[slug]/[leaf]/page.tsx`), so this page's cascade is
   the proposal's; then the sheets this copy adds (the kit's marks, the
   opening's own and the drawn-back network's). */
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

/* The two sections this copy draws itself, by the ids the proposal gives
   them (the hero's actions and the menu anchor on both). Everything after
   them is the proposal's own record. */
const DRAWN = ["vision", "adoption"] as const;

type Query = Record<string, string | string[] | undefined>;

/**
 * A SERVER route, mounted exactly as the proposal's is: the shell, the hero,
 * then the sections. The first two are the kit's components inside the
 * wrappers `ArcFlowPorts` gives them on the proposal; the rest go through
 * `ArcSectionRenderer` untouched, offset so each keeps its own index.
 *
 * The opening, the same donor to the arrival either way:
 *   (default)     the proposal's flow, the stack where its ringed hub was
 *   ?hero=index   the other reading, kept for now: a number and a name a plate
 *
 * "Marketing first, then every team.":
 *   (default)     the view draws back to the organisation (`NetworkOrg`)
 *   ?net=sent     the section as the proposal has it (`NetworkPlug`)
 */
export default async function ProposalTravelRoute({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const q = await searchParams;
  const hero = q.hero === "index" ? "index" : "flow";
  const Network = q.net === "sent" ? NetworkPlug : NetworkOrg;
  if (PROD.sections[0].id !== DRAWN[0] || PROD.sections[1].id !== DRAWN[1]) {
    throw new Error("proposal-travel: the proposal no longer opens on the vision and the approach");
  }
  const slice = sliceV7Sections([]);
  const menu = PROD.sections
    .filter((section) => section.menuLabel)
    .map((section) => ({
      id: section.id,
      label: section.menuLabel as string,
      primary: section.menuPrimary,
    }));
  const motion = PROD.motion ?? "reveal";
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

      {/* 1 · the vision, opened on the closed stack and what is tied to it */}
      <ArcBeat
        id="vision"
        kind="leverage"
        className="arc-section arc-xb-port"
        ariaLabel="AI capability your teams own"
        motion={motion}
      >
        <div className="xb xb-in-frame xb-sec">
          {hero === "index" ? <StackHero /> : <StackFlow />}
        </div>
      </ArcBeat>

      {/* 2 and 3 · the stack arrives opened and closes, then turns frontal */}
      <ArcBeat
        id="adoption"
        kind="handoff"
        className="arc-section arc-xb-port"
        ariaLabel="Navigate, encode, build"
        motion={motion}
      >
        <div className="xb xb-in-frame">
          <EmbedStack arrive />
        </div>
        <div className="xb xb-in-frame">
          <Network />
        </div>
      </ArcBeat>

      <ArcSectionRenderer
        sections={PROD.sections.slice(DRAWN.length)}
        motion={motion}
        indexOffset={DRAWN.length}
      />
    </ArcShell>
  );
}
