import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/hud-panel-lab — do the evidence panels belong to the frame?
 *
 * THE COMPLAINT (owner, 2026-09-02, pre-launch): on both evidence surfaces the
 * elements "just seem to be floating. They don't really feel integrated as
 * part of a HUD or interface … If you look at all the references I shared, it
 * just feels more balanced and integrated." The surfaces are the proof
 * casefile at the top of `#services` and the Voidwalker era stage.
 *
 * ⚠ THE 30 IMAGES HE MEANS ARE THE ONE PART OF THE REFERENCE POOL THE DESIGN
 * SKILL NEVER SAW. The corpus's 53 notes all point at the FLAT ROOT of
 * `_01_GENERAL REFERENCES` plus `LP\` and `Marathon\`; not one points into
 * `Panels\` or `Character\`, which is where he put the Vilimovský tablet kit,
 * the amber terminal instruments and the character screens. So "the skill was
 * trained on these" is false for exactly the set this pass is about, and the
 * distillations live in `docs/design/hud-panel-lab/README.md` until the
 * surveyor is run over those folders.
 *
 * WHAT THIS ROUTE IS. The real parse-injected HUD frame, the real corner
 * instruments and telemetry, and the real production leaves of both surfaces,
 * re-composed under seven directions (`v0` = production, mounted; `v6` derived
 * from a random seed rather than a reference — the owner's own procedure,
 * `docs/design/hud-panel-lab/seed-listing.md`). Content is untouched — the
 * question is placement, enclosure and line weight.
 *
 * ⚠ NOTHING ON THE LANDING CHANGES IN THIS PASS, and there is no flag: a
 * winner is promoted with its own ADR and the losers are deleted with their
 * guards (ADR-070 U35).
 *
 * Internal-only: `proxy.ts` blocks `/test/*` in production.
 */
export const metadata: Metadata = {
  title: "HUD panel lab · Thoughtform",
  robots: { index: false, follow: false },
};

export default function HudPanelLabLayout({ children }: { children: ReactNode }) {
  return children;
}
