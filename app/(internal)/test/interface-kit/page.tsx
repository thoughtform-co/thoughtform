import { sliceV7Sections } from "@/lib/v7-parse";

import { InterfaceKitShell } from "./InterfaceKitShell";

/* ⚠ STYLESHEET ORDER IS LOAD-BEARING, and this is `app/(marketing)/page.tsx`'s
   order verbatim for the sheets this surface needs:

     landing.css            the @font-face block, the :root token chain every
                            hud / gold / dawn token resolves against, and every
                            `.hud*` rule the frame paints with
     home-v2.css            `.home-v2-hud-root { display: contents }`
     services.css           `.services-stage` and the plate grammar
     casefile.css           the `.fl-case` token block + the zone rules
     console.css            the frame every evidence plate renders inside
     pda.css                the map console's palette and svg rules (row one)
     voidwalker.css         `.fl-wire__in`'s `--w-*` token block is declared
                            there, and the tools row's authored wireframes read
                            it — without this sheet row two paints untokened
     theme.css              LAST of the production set (ADR-058's own order),
                            or `?theme=light` is unreachable and every light
                            still in the matrix is a fiction
     rail-instruments.css   after theme.css, exactly as the marketing route
     interface-kit.css      the lab's own, so its scoped overrides win

   Getting `theme.css` out of order costs the light theme, not a compile error
   — precisely the class of thing a lab hides. */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/home-v2/services/casefile/console/console.css";
import "@/components/landing/home-v2/services/casefile/map/pda/pda.css";
import "@/components/landing/home-v2/voidwalker/voidwalker.css";
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
import "./interface-kit.css";

/**
 * The route is a SERVER component because `sliceV7Sections` reads the v7
 * prototype off disk. `[]` means "HUD chrome only, no stations": the frame is
 * what the panel is being judged against, and the casefile additionally
 * MEASURES ITSELF off `.hud__rail`'s live box, so without the real markup every
 * `--fl-t*` in its record column resolves against nothing and the three zones
 * collapse to `top: 0` with no error.
 */
export default function InterfaceKitRoute() {
  const slice = sliceV7Sections([]);
  return <InterfaceKitShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} />;
}
