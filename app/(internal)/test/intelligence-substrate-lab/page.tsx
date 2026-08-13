import { getCase } from "@/lib/cases/registry";

import { SubstrateLabShell } from "./SubstrateLabShell";

/* Stylesheet order is LOAD-BEARING and it is the production order, the same
   chain the configuration lab loads. ⚠ The lab's own sheet is the CONFIG
   lab's: one lab chrome, shared, because two copies of a harness is how one
   route quietly stops matching the other. Only the drawings are new here. */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/home-v2/services/casefile/console/console.css";
import "@/components/landing/home-v2/services/casefile/map/pda/pda.css";
import "@/components/landing/v7/theme.css";
import "../intelligence-config-lab/intelligence-config-lab.css";

/**
 * The lab draws from the LIVE record, never a fixture (the imlab law). A
 * harness on a copy of the data is how a drawing ends up fitting numbers the
 * case no longer publishes — and this reading's counts (5 shapes, 47 Skills,
 * 8 departments) are asserted against each other by the registry test.
 */
export default function IntelligenceSubstrateLabRoute() {
  const loop = getCase("loop-earplugs");
  const visual = loop?.casefile.tracks.find((t) => t.id === "ai-transformation")?.visual;

  if (!visual || visual.kind !== "intelligence-map") {
    return (
      <p style={{ padding: 40, fontFamily: "monospace" }}>No intelligence-map track on record.</p>
    );
  }

  return (
    <SubstrateLabShell
      shapes={visual.shapes}
      districts={visual.districts}
      works={visual.works}
      skills={visual.skills ?? []}
      envelope={visual.envelope}
    />
  );
}
