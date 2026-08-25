import { HoloLabShell } from "./HoloLabShell";
import { getArc } from "@/lib/arcs/registry";

import "./holo-program-lab.css";

/**
 * The lab draws from the LIVE record, never a fixture. These `at` values are
 * authored from real dates and pinned SORTED and unequal by
 * `arcs-registry.test.ts` — a drawing tuned against a copy is a drawing that
 * fits numbers the page no longer publishes.
 */
export default function HoloProgramLabRoute() {
  const arc = getArc("portfolio");
  const program = arc?.sections.find((s) => s.kind === "program");

  if (!program || program.kind !== "program") {
    return (
      <p style={{ padding: 40, fontFamily: "monospace" }}>No program beat on the portfolio.</p>
    );
  }

  return (
    <HoloLabShell
      waypoints={program.waypoints}
      priors={program.priors ?? []}
      headTitle="Adoption · 2024 → now · organic pull, not mandate"
    />
  );
}
