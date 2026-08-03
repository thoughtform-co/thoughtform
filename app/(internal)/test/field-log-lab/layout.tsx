import type { Metadata } from "next";

/**
 * /test/field-log-lab â€” the client casefile as ONE viewport.
 *
 * The problem: `#proof` (ADR-054) spends ~500svh â€” a 200svh sticky-head
 * runway plus three 100svh zig-zag beats â€” telling one client's story in the
 * same three verbs the corridor already spent four viewports on. There is no
 * room for a second client, and no way to show that Loop is SEVERAL bodies of
 * work rather than one narrative.
 *
 * This is the alternative from the `Thoughtform Prime` handoff
 * (`design_handoff_loop_fieldlog/`, cuts v13 Rail-Connected and v12 W2 Type
 * tabs): a single-viewport, interactive casefile. A type-only client tab
 * strip on top; a left column carrying the brief over a retro terminal
 * DIRECTORY whose rows are the real nav; a right column previewing whichever
 * row is selected. No enclosing card â€” two hairline rules, a column split,
 * crosshair registration marks, and gold junction diamonds docked on the
 * site's own rails.
 *
 * ALIGNMENT LAW â€” the load-bearing idea. The rules do not sit at arbitrary
 * heights; they snap to the HUD rail's 13-tick ladder (`lib/v7-parse/
 * hudTicks.ts`). The composition adopts the rail's rhythm, so the connection
 * between frame and content is structural rather than decorative. Everything
 * in the sheet hangs off the `--fl-t*` tick vars, never off the handoff's
 * 1440Ã—1000 pixel offsets.
 *
 * Under judgement (`?v=`) â€” one design, five connection grammars:
 *   a â€” DOCKED MARKS    Â· rules span the band, junction diamonds on the rails
 *   b â€” RAIL WAYPOINTS  Â· bearing marks alone, no junction pairing
 *   c â€” CROSSHAIRS ONLY Â· no horizontal rules at all
 *   d â€” NOTCHED SHELL   Â· the enclosed chamfered plate, as the control
 *   e â€” RETICLE MARKS   Â· the Arc's dotted corner crosses + dashed rules
 *
 * Other knobs: `?c=<client slug>`, `?f=<track id>`, `?type=mono|montreal`
 * (the head's typeface â€” see the sheet's TYPE note), `?console=0`.
 *
 * NOTHING production is touched. `#proof`, `lib/cases/`, `proofStation.ts`
 * and `ProofRevealController` stay exactly as they are until this lab settles
 * the design; the content here is lab-local and reads the canonical modules.
 *
 * Blocked from production by `proxy.ts` and `noindex`; auth handled by
 * the parent `(internal)/test` layout.
 */
export const metadata: Metadata = {
  title: "Field Log Lab â€” The Client Casefile (Internal)",
  robots: { index: false, follow: false },
};

export default function FieldLogLabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
