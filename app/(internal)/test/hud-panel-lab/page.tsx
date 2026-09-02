import { sliceV7Sections } from "@/lib/v7-parse";

import { HudPanelLabShell } from "./HudPanelLabShell";

/* ⚠ STYLESHEET ORDER IS LOAD-BEARING, and this is `app/(marketing)/page.tsx`'s
   order verbatim for the sheets both surfaces need:

     landing.css            the @font-face block, the :root token chain every
                            hud / gold / dawn token below resolves against,
                            and every `.hud*` rule the frame paints with
     home-v2.css            `.home-v2-hud-root { display: contents }`
     services.css           `.services-stage` and the plate/designation grammar
     casefile.css           the `.fl-case` token block + the zone rules
     console.css            the frame every evidence plate renders inside
     pda.css                the map console's palette and svg rules
     voidwalker.css         the station's own gates (the datum lab imports it
                            for the same reason: `.vw*` tokens)
     voidwalker-hologram.css  the FIGURE's sheet — the slot's isolation, the
                            masked floor, the alpha branch, the projector base
     voidwalker-datum.css   the composition, AFTER the hologram sheet because
                            `.vwd__vwh` re-houses the same figure
     theme.css              LAST of the production set (ADR-058's own order),
                            or `?theme=light` is unreachable and every light
                            still in the matrix is a fiction
     rail-instruments.css   after theme.css, exactly as the marketing route
     hud-panel-lab.css      the lab's own, so its scoped overrides win

   Getting `theme.css` out of order costs the light theme, not a compile error
   — which is precisely the class of thing a lab hides. */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/home-v2/services/casefile/console/console.css";
import "@/components/landing/home-v2/services/casefile/map/pda/pda.css";
import "@/components/landing/home-v2/voidwalker/voidwalker.css";
import "@/components/landing/home-v2/voidwalker/hologram/voidwalker-hologram.css";
import "@/components/landing/home-v2/voidwalker/hologram/voidwalker-datum.css";
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
import "./hud-panel-lab.css";

/**
 * The route is a SERVER component because `sliceV7Sections` reads the v7
 * prototype off disk. `[]` means "HUD chrome only, no stations": the frame is
 * what both surfaces are being judged against, and the casefile additionally
 * MEASURES ITSELF off `.hud__rail`'s live box, so without the real markup
 * every `--fl-t*` in its left column resolves against nothing.
 */
export default function HudPanelLabRoute() {
  const slice = sliceV7Sections([]);
  return <HudPanelLabShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} />;
}
