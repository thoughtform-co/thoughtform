import type { Metadata } from "next";

import { LETTERED } from "@/app/(internal)/test/proposal-swarm/engine/clocks";
import { SwarmAct } from "@/app/(internal)/test/proposal-swarm/SwarmAct";
import { ArcBeat } from "@/components/arcs/ArcBeat";
import { ArcHero } from "@/components/arcs/ArcHero";
import { ArcSectionRenderer } from "@/components/arcs/ArcSectionRenderer";
import { ArcShell } from "@/components/arcs/ArcShell";
import { CaseDossier } from "@/components/arcs/case-dossier/CaseDossier";
import { CASES } from "@/components/arcs/case-dossier/cases";
import { cutCase, HEAD_DEFAULT } from "@/components/arcs/case-dossier/story";
import { EmbedStack } from "@/components/xb-proposal/embed/EmbedStack";
import { NetworkOrg } from "@/components/xb-proposal/network/NetworkOrg";
import { StackFlow } from "@/components/xb-proposal/stack/StackFlow";
import { CASES_PAGE as ARC } from "@/lib/cases-page";
import { sliceV7Sections } from "@/lib/v7-parse";

/* The sheets in the swarm lab's order (`/test/proposal-swarm-v2`), which the
   canvas and the dossier are measured in; theme.css after the compositions. */
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
import "@/app/(internal)/test/proposal-swarm/proposal-swarm.css";
import "@/components/arcs/case-dossier/dossier.css";
import "@/components/arcs/case-dossier/suri-screen.css";

export const metadata: Metadata = {
  title: ARC.meta.title,
  description: ARC.meta.description,
  // A public page, meant to be found (unlike the arcs).
  alternates: { canonical: "https://thoughtform.co/cases" },
};

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const section = (id: string) => {
  const s = ARC.sections.find((x) => x.id === id);
  if (!s) throw new Error(`cases: no section "${id}"`);
  return s;
};

/**
 * /cases — the approach and the cases (owner, 2026-10-19:
 * "a generic approach-cases page … send the URL and say, this is an overview
 * of what we've been doing"). The swarm proposal's opening, lettered for no
 * client, then the case dossier:
 *
 *   hero → the layer → the steps → Marketing, then every team
 *        → "How we've made brands self-sufficient with AI."
 *        → the cases (Suri, Samako, Loop) → contact
 *
 * ⚠ IT FLOWS: the swarm's canvas is a sticky track over the three drawn
 * sections and a pinned beat would clip it (the swarm routes throw on
 * `terminal` for the same reason).
 *
 * ⚠ PUBLIC: at the root, no password, indexed and in the sitemap; the old
 * arc address (`/arcs/thoughtform/cases`) 308s here (`next.config.mjs`).
 *
 *   ?still=1   nothing rides a clock, posters stand: a still (the capture)
 *   ?case=…    open on that case
 */
export default async function CasesPage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const still = one(q.still) === "1";
  const cases = CASES.map((c) => cutCase(c, "short"));
  const slice = sliceV7Sections([]);
  const menu = [
    { id: "vision", label: "The approach", primary: true },
    { id: "adoption", label: "The steps" },
    { id: "the-line", label: "Three brands" },
    { id: "cases", label: "The cases", primary: true },
    { id: "close", label: "Contact" },
  ];
  return (
    <ArcShell
      hudHtml={slice.hudHtml}
      bodyClass={slice.bodyClass}
      variant="detail"
      menu={menu}
      motion="reveal"
      gatewayPlate={ARC.hero.plate === "gateway"}
      curtain={ARC.hero.curtain ?? false}
      format={ARC.format}
    >
      <ArcHero hero={ARC.hero} />

      {/* the layer, as the swarm draws it */}
      <ArcBeat
        id="vision"
        kind="leverage"
        className="arc-section arc-xb-port"
        ariaLabel="AI capability your teams own"
        motion="reveal"
      >
        <div className="psw-hold">
          <div className="xb xb-in-frame xb-sec psw">
            <StackFlow />
            <canvas className="psw-seat" aria-hidden />
          </div>
        </div>
      </ArcBeat>

      {/* the steps and the network, the swarm's canvas over both */}
      <ArcBeat
        id="adoption"
        kind="handoff"
        className="arc-section arc-xb-port"
        ariaLabel="Navigate, encode, build"
        motion="reveal"
      >
        <SwarmAct fly="fall" mark="engrave" still={still} />
        <div className="xb xb-in-frame psw">
          <EmbedStack arrive house />
        </div>
        <div className="xb xb-in-frame psw">
          <NetworkOrg lettered={LETTERED} org={null} />
        </div>
      </ArcBeat>

      <ArcSectionRenderer sections={[section("the-line")]} motion="reveal" indexOffset={2} />

      <ArcBeat id="cases" kind="proof-card" className="arc-section" ariaLabel="The cases" motion="reveal">
        <CaseDossier cases={cases} initial={one(q.case)} head={HEAD_DEFAULT} still={still} />
      </ArcBeat>

      <ArcSectionRenderer sections={[section("close")]} motion="reveal" indexOffset={4} />
    </ArcShell>
  );
}
