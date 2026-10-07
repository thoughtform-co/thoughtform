import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/lattice — the brand system grid, as a specimen lab inside the real
 * HUD frame (ADR-149, Phase 1).
 *
 * THE BRIEF (owner, 2026-10-06): "our brand system has gone through a lot of
 * iterations … our main aesthetic is retrofuturistic inspired by navigational
 * interface and terminal UIs. And while I'm overall happy with the design of
 * our website, I think the biggest area of improvement are our frames and
 * really building a grid system; Hex and Brasshands are good references, but
 * I feel we are not really reaching the level I want; Evangelion has also
 * been a big inspiration. In terms of aesthetic and vibe our branding is good;
 * it's just that I don't feel I have a scaleable brand system … I like the
 * notches, what we're missing is a system following front end best practices,
 * but also understands GUI / FUI game interfaces." Then: "it's not just
 * frames, it's also how design sections and subpages." And the bar: "score
 * yourself on the Awwwards scoring sheet. Design 40%, usability 30%,
 * creativity 20%, content 10%, each out of 10, as strictly as a real jury
 * would … keep going until every category is at 7.5 or higher."
 *
 * WHAT THIS ROUTE IS. Five boards on one root, inside the REAL frame (the
 * rungs resolve only against the real rail): `grid` (the overlay and a legend
 * of measured against expected), `frames` (the recipe's matrix — every cut ×
 * line × ground, the chamfer ladder, the overflow case), `sections` (the six
 * arrangements, one each), `page` (a whole synthetic subpage ending on the
 * site footer — the board the jury scores), `type` (the ladder, the spacing
 * roles, the chamfer rungs and the breakpoints, each with its computed px).
 * Three knobs (`cut`, `line`, `head`), four directions, `LA` the control;
 * the first value of every knob is the house.
 *
 * ⚠ NOTHING ON THE LANDING CHANGES IN THIS PASS, and there is no flag. The
 * sheet adopts first (Phase 2 aliases, Phase 3 the `lattice` knob); a winner
 * is promoted with its own ADR line and the losers are deleted with their
 * guards (ADR-070 U35).
 *
 * Internal-only: `proxy.ts` blocks `/test/*` in production.
 */
export const metadata: Metadata = {
  title: "Lattice · Thoughtform",
  robots: { index: false, follow: false },
};

export default function LatticeLayout({ children }: { children: ReactNode }) {
  return children;
}
