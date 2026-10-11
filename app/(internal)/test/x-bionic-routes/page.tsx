import { ArcHero } from "@/components/arcs/ArcHero";
import { ArcSectionRenderer } from "@/components/arcs/ArcSectionRenderer";
import { ArcShell } from "@/components/arcs/ArcShell";
import { getClient } from "@/lib/arcs/clients";
import { X_BIONIC_PROPOSAL_ARC } from "@/lib/arcs/content/x-bionic-proposal";
import type { ArcSection } from "@/lib/arcs/types";
import { PS_DEFAULTS, type PsKnobs } from "@/lib/proposal-system/variants";
import { xBionicV2 } from "@/lib/proposal-system/xBionicV2";
import { sliceV7Sections } from "@/lib/v7-parse";

/* ⚠ STYLESHEET ORDER IS LOAD-BEARING: the arc route's chain verbatim, as
   the proposal-system lab copies it, so every section paints as it would on
   `/arcs/x-bionic/proposal`. No lab chrome: this page is read as the site. */
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
import "@/components/arcs/config-run.css";
import "@/components/arcs/approach-figure.css";
import "@/components/arcs/vision-figure.css";
import "@/components/arcs/prompt-to-loop/prompt-to-loop.css";
import "@/components/sheet/sheet.css";
import "@/components/landing/v7/site-footer/site-footer.css";
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";

const PROD = X_BIONIC_PROPOSAL_ARC;

/** One route: the composer's section `from`, re-keyed for this page. */
type Route = {
  id: string;
  label: string;
  from: string;
  knobs?: Partial<PsKnobs>;
  chapter?: boolean;
};

const ROUTES: readonly Route[] = [
  { id: "vision-current", label: "Vision · on the page", from: "vision", chapter: true },
  {
    id: "vision-va",
    label: "Vision · VA team on stack",
    from: "vision",
    knobs: { vision: "team" },
  },
  {
    id: "vision-vb",
    label: "Vision · VB three phases",
    from: "vision",
    knobs: { vision: "phases" },
  },
  { id: "approach-current", label: "Approach · on the page", from: "adoption", chapter: true },
  {
    id: "approach-aa",
    label: "Approach · AA written",
    from: "adoption",
    knobs: { approach: "written" },
  },
  {
    id: "approach-ab",
    label: "Approach · AB lane opened",
    from: "adoption",
    knobs: { approach: "opened" },
  },
  {
    id: "approach-stack",
    label: "Approach · stack",
    from: "adoption",
    knobs: { approach: "stack" },
  },
  {
    id: "approach-plates",
    label: "Approach · plates",
    from: "adoption",
    knobs: { approach: "plates" },
  },
];

function prodSection(id: string): ArcSection {
  const hit = PROD.sections.find((s) => s.id === id);
  if (!hit) throw new Error(`x-bionic-routes: production has no section "${id}"`);
  return hit;
}

function routeSection(route: Route): ArcSection {
  const arc = route.knobs ? xBionicV2({ ...PS_DEFAULTS, ...route.knobs }) : PROD;
  const hit = arc.sections.find((s) => s.id === route.from);
  if (!hit) throw new Error(`x-bionic-routes: "${route.id}" has no section "${route.from}"`);
  return {
    ...hit,
    id: route.id,
    menuLabel: route.label,
    menuPrimary: route.chapter ? true : undefined,
  } as ArcSection;
}

export default function XBionicRoutesPage() {
  const sections: ArcSection[] = [
    { ...prodSection("about"), menuPrimary: undefined } as ArcSection,
    ...ROUTES.map(routeSection),
    prodSection("proof-loop"),
  ];
  const hero = {
    ...PROD.hero,
    actions: [
      { id: "vision", label: "The vision routes", href: "#vision-current", primary: true },
      { id: "approach", label: "The approach routes", href: "#approach-current" },
    ],
  };
  const slice = sliceV7Sections([]);
  const menu = sections
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
      gatewayPlate={hero.plate === "gateway"}
      curtain={hero.curtain ?? false}
      format={PROD.format}
      lock={PROD.theme}
      rhythm={PROD.rhythm}
      clientMark={PROD.client ? getClient(PROD.client)?.mark : undefined}
    >
      <ArcHero hero={hero} />
      <ArcSectionRenderer sections={sections} motion={motion} />
    </ArcShell>
  );
}
