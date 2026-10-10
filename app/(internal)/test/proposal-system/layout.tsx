import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/proposal-system — the X-Bionic proposal recomposed as a SYSTEM, read
 * inside the real arc shell with knobs (2026-10-10).
 *
 * THE BRIEF (owner, 2026-10-10): the proposal "should really form a cohesive
 * narrative" (about, the vision, the approach, where it plugs in, Loop, two
 * brands, X-Bionic); never the first person; the flywheel is "not a wheel"
 * and not "three blocks"; "leverage our diagrams, our particle system";
 * Loop's return and the client jobs "part of the same visual language";
 * "In 2024, Loop decided to go AI-first." as a quote-only band; the engine
 * redrawn on the references' exploded stack; and all of it a template the
 * next proposal is cut from.
 *
 * WHAT THIS ROUTE IS. The production record composed per knob
 * (`lib/proposal-system/xBionicV2.ts`) and rendered through the REAL
 * `ArcShell` + `ArcSectionRenderer`, so what the owner reads is what ships.
 * Seven knobs, nine directions, `PA` the control (byte-identical to
 * `/arcs/x-bionic/proposal`), `PZ` the whole brief. A knob is a link: the
 * page is a server route and reads `searchParams`.
 *
 * ⚠ NOTHING ON THE PRODUCTION PAGE MOVES until the owner picks; the winner
 * is promoted with its own ADR and the losers deleted with their guards
 * (ADR-070 U35). Internal-only: `proxy.ts` blocks `/test/*` in production.
 */
export const metadata: Metadata = {
  title: "Proposal system · Thoughtform",
  robots: { index: false, follow: false },
};

export default function ProposalSystemLayout({ children }: { children: ReactNode }) {
  return children;
}
