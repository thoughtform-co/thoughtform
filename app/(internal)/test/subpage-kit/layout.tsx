import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/subpage-kit — the sheet's specimen page (ADR-114).
 *
 * THE BRIEF (owner, 2026-09-20). He wants a design system for the subpages
 * the site never designed — the arcs overview ("our current arcs look
 * bad"), the Home sessions event page, a blog index — with Hermeus and
 * Lighthouse as the references for clean sections while the retrofuturistic
 * instruments stay the house's voice; "it's very important that there's
 * some variety in how we build blocks — not every section has just three
 * blocks"; and the deliverable is an EVAL PIPELINE that builds them: encode
 * the references, shoot directions, grade against a rubric distilled from
 * those references, put a gallery in front of him.
 *
 * WHAT THIS ROUTE IS. Every arrangement of the sheet — split, row, cells,
 * console, timeline, steps, table, figure, prose, close — and every state
 * that exists (a lit node, an open step, a filled station, a draft row) on
 * fixtures, under the five knobs (`?k=SB…SE`, `?theme=`). It is the eval's
 * type `SK`: the place a primitive is read before a page spends it.
 *
 * ⚠ THE FIRST VALUE OF EVERY KNOB IS THE HOUSE. Nothing here is a flag; a
 * direction the owner picks is promoted into `sheet.css` and the losers are
 * deleted with their guards (ADR-070 U35).
 *
 * Internal-only: `proxy.ts` blocks `/test/*` in production.
 */
export const metadata: Metadata = {
  title: "Subpage kit · Thoughtform",
  robots: { index: false, follow: false },
};

export default function SubpageKitLayout({ children }: { children: ReactNode }) {
  return children;
}
