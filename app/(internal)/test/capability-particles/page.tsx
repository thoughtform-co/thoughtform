import { ArcShell } from "@/components/arcs/ArcShell";
import { StackFlow } from "@/components/xb-proposal/stack/StackFlow";
import { getClient } from "@/lib/arcs/clients";
import { X_BIONIC_PROPOSAL_ARC as PROD } from "@/lib/arcs/content/x-bionic-proposal";
import { sliceV7Sections } from "@/lib/v7-parse";

import { ParticleLab } from "./ParticleLab";
import { SKETCHES, type SketchId } from "./sketch";

/* ⚠ STYLESHEET ORDER IS LOAD-BEARING: the proposal's chain verbatim, as the
   capability lab mounts it (`../capability-own/page.tsx`), then the swarm
   lab's sheet for its bar, then this lab's, last. */
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
import "./capability-particles.css";

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * /test/capability-particles: "AI capability your teams own." as a new
 * figure in the swarm's dots, three ways, one section, no scroll. The title
 * and the four workstream chips are the opening's own; the figure beside
 * them is the sketch.
 *
 *   ?v=a|b|c    Lanes, Altitude, Pattern (a)
 *   ?t=<s>      the sketch held at that many seconds in
 *   ?still=1    the sketch at rest and the bar off: a still
 */
export default async function CapabilityParticlesRoute({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const q = await searchParams;
  const v = (SKETCHES.map((s) => s.id) as string[]).includes(one(q.v) ?? "")
    ? (one(q.v) as SketchId)
    : "a";
  const raw = one(q.t);
  const at =
    raw !== undefined && raw !== "" && Number.isFinite(Number(raw))
      ? Math.max(0, Number(raw))
      : null;
  const still = one(q.still) === "1";

  const slice = sliceV7Sections([]);
  return (
    <ArcShell
      hudHtml={slice.hudHtml}
      bodyClass={slice.bodyClass}
      variant="detail"
      menu={[]}
      motion="reveal"
      gatewayPlate={false}
      curtain={false}
      format={PROD.format}
      lock={PROD.theme}
      rhythm={PROD.rhythm}
      clientMark={PROD.client ? getClient(PROD.client)?.mark : undefined}
    >
      <section className="arc-section arc-xb-port cp-sec" aria-label="AI capability your teams own">
        <div className="xb xb-in-frame xb-sec cp">
          <StackFlow />
          <ParticleLab v={v} at={at} still={still} />
        </div>
      </section>
    </ArcShell>
  );
}
