import { ArcShell } from "@/components/arcs/ArcShell";
import { getClient } from "@/lib/arcs/clients";
import { X_BIONIC_PROPOSAL_ARC as PROD } from "@/lib/arcs/content/x-bionic-proposal";
import { sliceV7Sections } from "@/lib/v7-parse";

import { CapabilityLab, type VariantId } from "./CapabilityLab";

/* ⚠ STYLESHEET ORDER IS LOAD-BEARING: the proposal's chain verbatim, as the
   swarm lab mounts it (`../proposal-swarm/page.tsx`), so the variants sit in
   the proposal's own cascade and frame; then this lab's sheet, last. */
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
import "./capability-own.css";

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * /test/capability-own: "AI capability your teams own." four ways, each
 * drawing how the team becomes self-sufficient (owner, 2026-10-14). Mounted
 * in the proposal's own shell and frame, without its hero: the first variant
 * is the first screen.
 *
 *   ?v=a|b|c|d   one variant, followed by the proposal's steps and network
 *   ?p=0..1      every variant held at that moment of its runway (a still)
 *   ?still=1     nothing rides the clock and the bar is off: a shoot
 */
export default async function CapabilityOwnRoute({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const q = await searchParams;
  const v = one(q.v);
  const only = (["a", "b", "c", "d"] as string[]).includes(v ?? "") ? (v as VariantId) : undefined;
  const pRaw = one(q.p);
  const p = pRaw !== undefined && pRaw !== "" ? Math.min(1, Math.max(0, Number(pRaw))) : null;
  const fixed = p !== null && Number.isFinite(p) ? p : null;
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
      <CapabilityLab only={only} fixed={fixed} still={still} />
    </ArcShell>
  );
}
