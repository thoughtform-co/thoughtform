import { getCase } from "@/lib/cases/registry";

import { LabShell } from "./LabShell";

/* Stylesheet order is LOAD-BEARING and it is the production order.
   `landing.css` owns the `@font-face` block and the `:root` token chain that
   every `--imap-*` local resolves against; `home-v2.css` follows it;
   `casefile.css` carries the whole `.fl-imap` block, which this lab mounts
   UNCHANGED rather than forking — that is what makes the frame real chrome.
   `theme.css` LAST of the production sheets (ADR-058's own order), then the
   board archetype's own sheet, then the lab's, so lab overrides win. */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/v7/theme.css";
import "@/components/landing/home-v2/services/casefile/map/board/board.css";
import "./intelligence-map-lab.css";

/**
 * The lab draws from the LIVE record, never a fixture. A look-dev harness on
 * a copy of the data is how a drawing ends up fitting numbers the case no
 * longer publishes — and this surface has 27 modules, 8 departments and five
 * shapes whose counts are asserted against each other by the registry test.
 */
export default function IntelligenceMapLabRoute() {
  const loop = getCase("loop-earplugs");
  const visual = loop?.casefile.tracks.find((t) => t.id === "ai-transformation")?.visual;

  if (!visual || visual.kind !== "intelligence-map") {
    return (
      <p style={{ padding: 40, fontFamily: "monospace" }}>No intelligence-map track on record.</p>
    );
  }

  return (
    <LabShell
      shapes={visual.shapes}
      districts={visual.districts}
      works={visual.works}
      chains={visual.chains ?? []}
      envelope={visual.envelope}
    />
  );
}
