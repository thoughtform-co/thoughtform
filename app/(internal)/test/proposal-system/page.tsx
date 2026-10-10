import { ArcHero } from "@/components/arcs/ArcHero";
import { ArcSectionRenderer } from "@/components/arcs/ArcSectionRenderer";
import { ArcShell } from "@/components/arcs/ArcShell";
import { getClient } from "@/lib/arcs/clients";
import { parsePsQuery } from "@/lib/proposal-system/variants";
import { xBionicV2 } from "@/lib/proposal-system/xBionicV2";
import { sliceV7Sections } from "@/lib/v7-parse";

import { ProposalSystemConsole } from "./ProposalSystemConsole";
import { ProposalSystemStamp } from "./ProposalSystemStamp";

/* ⚠ STYLESHEET ORDER IS LOAD-BEARING: the arc route's chain VERBATIM
   (`app/(marketing)/arcs/[slug]/[leaf]/page.tsx`), so the lab's cascade is
   the page's; then the lattice lab's console chrome and this lab's own
   sheet, last. */
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
import "@/components/arcs/stack/stack.css";
import "@/components/arcs/prompt-to-loop/prompt-to-loop.css";
import "@/components/sheet/sheet.css";
import "@/components/landing/v7/site-footer/site-footer.css";
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
import "../lattice/lattice-lab.css";
import "./proposal-system.css";

/**
 * The lab is a SERVER route, like the arc it mirrors: every beat is a server
 * component, and the fill rhythm, the datum, the curtain and the corners are
 * `ArcShell`'s attributes. A knob change is a navigation
 * (`app/(internal)/test/arcs-instrument-kit/page.tsx` is the precedent).
 */
export default async function ProposalSystemRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = parsePsQuery(await searchParams);
  const arc = xBionicV2(q.knobs);
  const slice = sliceV7Sections([]);
  const menu = arc.sections
    .filter((section) => section.menuLabel)
    .map((section) => ({
      id: section.id,
      label: section.menuLabel as string,
      primary: section.menuPrimary,
    }));
  const motion = arc.motion ?? "reveal";
  return (
    <>
      <ArcShell
        hudHtml={slice.hudHtml}
        bodyClass={slice.bodyClass}
        variant="detail"
        menu={menu}
        motion={motion}
        gatewayPlate={arc.hero.plate === "gateway"}
        curtain={arc.hero.curtain ?? false}
        format={arc.format}
        lock={arc.theme}
        rhythm={arc.rhythm}
        clientMark={arc.client ? getClient(arc.client)?.mark : undefined}
      >
        <ArcHero hero={arc.hero} />
        <ArcSectionRenderer sections={arc.sections} motion={motion} />
      </ArcShell>
      {/* Lab chrome as SIBLINGS of the shell, never inside `.arc-root`. */}
      {q.consoleOn ? <ProposalSystemConsole knobs={q.knobs} theme={q.theme} /> : null}
      <ProposalSystemStamp knobs={q.knobs} theme={q.theme} />
    </>
  );
}
