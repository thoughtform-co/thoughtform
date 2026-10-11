import { ArcHero } from "@/components/arcs/ArcHero";
import { ArcSectionRenderer } from "@/components/arcs/ArcSectionRenderer";
import { ArcShell } from "@/components/arcs/ArcShell";
import { O1_BOX, OfferCircuit } from "@/components/xcore/OfferCircuit";
import { L3_BOX, LayerDetail } from "@/components/xcore/LayerDetail";
import { L1_BOX, LayerHorizon } from "@/components/xcore/LayerHorizon";
import { L2_BOX, LayerLadder } from "@/components/xcore/LayerLadder";
import { OfferSticky } from "@/components/xcore/OfferSticky";
import { LAYER_HEAD, OFFER_HEAD } from "@/components/xcore/data";
import { XcSection } from "@/components/xcore/Section";
import { getClient } from "@/lib/arcs/clients";
import { X_BIONIC_PROPOSAL_ARC } from "@/lib/arcs/content/x-bionic-proposal";
import type { ArcSection } from "@/lib/arcs/types";
import { sliceV7Sections } from "@/lib/v7-parse";

/* The arc route's stylesheet chain (as /test/x-bionic-routes copies it), so
   the hero, the About and Loop's line paint as on the page; the rebuilt
   sections carry their own sheet, last. */
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
import "@/components/xcore/xcore.css";

const PROD = X_BIONIC_PROPOSAL_ARC;

function prodSection(id: string): ArcSection {
  const hit = PROD.sections.find((s) => s.id === id);
  if (!hit) throw new Error(`x-bionic-core: production has no section "${id}"`);
  return hit;
}

const MENU = [
  { id: "about", label: "About" },
  { id: "o1", label: "Offering · O1 circuit", primary: true },
  { id: "o2", label: "Offering · O2 three phases" },
  { id: "l1", label: "Layer · L1 horizon", primary: true },
  { id: "l2", label: "Layer · L2 ladder" },
  { id: "l3", label: "Layer · L3 detail" },
  { id: "proof-loop", label: "Loop" },
];

export default function XBionicCorePage() {
  const slice = sliceV7Sections([]);
  const hero = {
    ...PROD.hero,
    actions: [{ id: "o", label: "The offering routes", href: "#o1", primary: true }],
  };
  return (
    <ArcShell
      hudHtml={slice.hudHtml}
      bodyClass={slice.bodyClass}
      variant="detail"
      menu={MENU}
      motion={PROD.motion ?? "reveal"}
      gatewayPlate={hero.plate === "gateway"}
      curtain={hero.curtain ?? false}
      format={PROD.format}
      lock={PROD.theme}
      rhythm={PROD.rhythm}
      clientMark={PROD.client ? getClient(PROD.client)?.mark : undefined}
    >
      <ArcHero hero={hero} />
      <ArcSectionRenderer sections={[prodSection("about")]} motion={PROD.motion ?? "reveal"} />

      <XcSection id="o1" route="O1 · circuit" fit={{ ...O1_BOX, reserve: "300px" }} {...OFFER_HEAD}>
        <OfferCircuit />
      </XcSection>
      <OfferSticky id="o2" />

      <XcSection id="l1" route="L1 · horizon" fit={{ ...L1_BOX, reserve: "300px" }} {...LAYER_HEAD}>
        <LayerHorizon />
      </XcSection>
      <XcSection id="l2" route="L2 · ladder" fit={{ ...L2_BOX, reserve: "300px" }} {...LAYER_HEAD}>
        <LayerLadder />
      </XcSection>
      <XcSection
        id="l3"
        route="L3 · detail A"
        fit={{ ...L3_BOX, reserve: "300px" }}
        {...LAYER_HEAD}
      >
        <LayerDetail />
      </XcSection>

      <ArcSectionRenderer sections={[prodSection("proof-loop")]} motion={PROD.motion ?? "reveal"} />
    </ArcShell>
  );
}
