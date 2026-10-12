import { X_BIONIC_JOBS } from "@/lib/arcs/content/shared/jobs";
import { sliceV7Sections } from "@/lib/v7-parse";

import { BOARDS, isBoard } from "./boards";
import { ProposalKitShell } from "./ProposalKitShell";

/* ⚠ STYLESHEET ORDER IS LOAD-BEARING: the arc leaf route's chain VERBATIM
   (`app/(marketing)/arcs/[slug]/[leaf]/page.tsx`), so the lab's cascade is
   the proposal's; then this round's variant sheets, then the lab chrome,
   last. */
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
import "@/components/xb-proposal/plug/plug-variants.css";
import "@/components/xb-proposal/closing/fee.css";
import "./job/job-variants.css";
import "./proposal-kit.css";

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * A SERVER route, like the arc it mirrors: every section is rendered here
 * and handed to the shell as children, so a server component (the job card,
 * the fee) mounts exactly as the proposal mounts it.
 *
 *   ?b=system|flow|job|close   one board
 *   ?d=<section id>            one section
 *   ?job=1..4                  the job on the job board
 *   ?still=1                   no lab chrome (the capture's)
 */
export default async function ProposalKitRoute({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const board = one(q.b);
  const only = one(q.d);
  const still = one(q.still) === "1";
  const n = Number(one(q.job));
  const job = Number.isInteger(n) && n >= 1 && n <= X_BIONIC_JOBS.length ? n - 1 : 0;

  const sections = BOARDS.filter((b) => !isBoard(board) || b.key === board)
    .flatMap((b) => b.sections)
    .filter((s) => !only || s.id === only);

  const slice = sliceV7Sections([]);
  return (
    <ProposalKitShell
      hudHtml={slice.hudHtml}
      bodyClass={slice.bodyClass}
      still={still}
      index={sections.map((s) => ({ id: s.id, code: s.code, name: s.name }))}
    >
      {sections.map((s) => (
        <div
          key={s.id}
          id={s.id}
          className="pkit-slot"
          data-board={s.board}
          data-control={s.control ? "" : undefined}
        >
          <p className="pkit-tag">
            <b>{s.code}</b>
            {s.name}
            <span>{s.note}</span>
          </p>
          <s.C job={job} />
        </div>
      ))}
    </ProposalKitShell>
  );
}
