import { sliceV7Sections } from "@/lib/v7-parse";

import { MusingsRowLabShell } from "./MusingsRowLabShell";
import { LAB_MUSINGS } from "./placeholders";

/* ⚠ STYLESHEET ORDER IS LOAD-BEARING, and this is `app/(marketing)/page.tsx`'s
   order verbatim for the sheets this surface needs:

     landing.css            the @font-face block, the :root token chain every
                            hud / gold / dawn / band token resolves against,
                            `.station:not(.hero)`'s ground, and every `.hud*`
                            rule the frame paints with
     home-v2.css            `.home-v2-hud-root { display: contents }` and the
                            corridor-exit promotion rule the station goes
                            transparent under
     musings.css            the station — AFTER landing.css (it overrides the
                            station's padding floor input)
     theme.css              LAST of the production set (ADR-058's own order),
                            or `?theme=light` is unreachable and every light
                            still is a fiction — and BLOCK 4g, which drops the
                            row's frost on parchment, would never cascade
     rail-instruments.css   after theme.css, exactly as the marketing route
     musings-row-lab.css    the lab's own, so its scoped overrides win

   Getting `theme.css` out of order costs the light theme, not a compile error
   — precisely the class of thing a lab hides. */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/musings/musings.css";
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
import "./musings-row-lab.css";

/**
 * The route is a SERVER component because `sliceV7Sections` reads the v7
 * prototype off disk. `[]` means "HUD chrome only, no stations": the frame is
 * what the row is being judged against, and the corner readout is the one
 * instrument that says which station the reader is in.
 */
export default function MusingsRowLabRoute() {
  const slice = sliceV7Sections([]);
  return (
    <MusingsRowLabShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} posts={LAB_MUSINGS} />
  );
}
