import { getCase } from "@/lib/cases/registry";

import { ConfigLabShell } from "./ConfigLabShell";

/* Stylesheet order is LOAD-BEARING and it is the production order.
   `landing.css` owns the `@font-face` block and the `:root` token chain;
   `home-v2.css` follows it; `casefile.css` carries the `.fl-case` family the
   console's tokens sit under; `console.css` is the frame this lab mounts
   UNCHANGED and `pda.css` the palette + svg rules every variant renders in
   (`.fl-pda__svg`). `theme.css` LAST of the production sheets (ADR-058's own
   order) so the light-theme `--pda-*` steps win, then the lab's, so lab
   positioning wins over production's scroll-driven seating. */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/home-v2/services/casefile/console/console.css";
import "@/components/landing/home-v2/services/casefile/map/pda/pda.css";
import "@/components/landing/v7/theme.css";
import "./intelligence-config-lab.css";

/**
 * The lab draws from the LIVE record, never a fixture (the imlab law). A
 * look-dev harness on a copy of the data is how a drawing ends up fitting
 * numbers the case no longer publishes — and this surface's counts (27
 * streams, 24 configured, 5 shapes, 47 Skills) are asserted against each
 * other by the registry test.
 */
export default function IntelligenceConfigLabRoute() {
  const loop = getCase("loop-earplugs");
  const visual = loop?.casefile.tracks.find((t) => t.id === "ai-transformation")?.visual;

  if (!visual || visual.kind !== "intelligence-map") {
    return (
      <p style={{ padding: 40, fontFamily: "monospace" }}>No intelligence-map track on record.</p>
    );
  }

  return (
    <ConfigLabShell
      shapes={visual.shapes}
      districts={visual.districts}
      works={visual.works}
      chains={visual.chains ?? []}
      skills={visual.skills}
      envelope={visual.envelope}
    />
  );
}
