import { sliceV7Sections } from "@/lib/v7-parse";

import { HudInstrumentsLabShell } from "./HudInstrumentsLabShell";

/* Stylesheet order is LOAD-BEARING: the production sheets first
   (`landing.css` owns the `@font-face` block, the `:root` token chain the
   rail geometry resolves against, and every `.hud*` rule; `home-v2.css`
   owns `.home-v2-hud-root { display: contents }`), then the lab sheet LAST
   so its scoped overrides win the cascade.

   `services.css` is deliberately NOT imported: the only thing this lab
   wants from it is `[data-tools-rail-root]`, and the lab owns that slot's
   geometry itself. */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
/* `theme.css` LAST of the production sheets (ADR-058's own import order).
   The pre-paint bootstrap in `app/layout.tsx` already writes
   `data-theme="light"` on `<html>` for `?theme=light` on EVERY route — this
   lab just never imported the sheet that consumes it, so light mode was
   unreachable here. It is inert in dark, so `v0` stays the pixel-identical
   control it has to be. */
import "@/components/landing/v7/theme.css";
import "./hud-instruments-lab.css";

export default function HudInstrumentsLabRoute() {
  // `[]` = HUD chrome only, no stations. The runway supplies its own.
  const slice = sliceV7Sections([]);
  return <HudInstrumentsLabShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} />;
}
