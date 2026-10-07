import { sliceV7Sections } from "@/lib/v7-parse";

import { LatticeShell } from "./LatticeShell";

/* ⚠ STYLESHEET ORDER IS LOAD-BEARING — the interface kit's order verbatim
   (`app/(marketing)/page.tsx`'s own), plus the two sheets this lab adds:

     landing.css            the @font-face block, the :root token chain every
                            hud / gold / dawn / band token resolves against
                            (`--hud-rail-y-start`, which every `--lat-rung-N`
                            reads), and every `.hud*` rule the frame paints with
     home-v2.css            `.home-v2-hud-root { display: contents }`
     services.css           `.services-stage` and the plate grammar
     casefile.css           the `.fl-case` token block
     console.css            the frame every evidence plate renders inside
     pda.css                the map console's palette
     voidwalker.css         `.fl-wire__in`'s `--w-*` token block
     site-footer.css        the page board mounts the site footer (ADR-127:
                            a route that mounts the close without its sheet
                            renders the footer's bare markup — every sheet
                            route did, for two weeks)
     theme.css              LAST of the production set (ADR-058's own order),
                            or `?theme=light` is unreachable
     rail-instruments.css   after theme.css, exactly as the marketing route
     lattice.css            the frame recipe and the section grammar
                            (`components/lattice`, Phase 1)
     lattice-lab.css        the lab's own chrome, so its scoped rules win

   Getting `theme.css` out of order costs the light theme, not a compile
   error — precisely the class of thing a lab hides. The lattice TOKENS
   (`app/styles/lattice.css`) arrive through globals.css on every route and
   are not imported here. */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/home-v2/services/casefile/console/console.css";
import "@/components/landing/home-v2/services/casefile/map/pda/pda.css";
import "@/components/landing/home-v2/voidwalker/voidwalker.css";
import "@/components/landing/v7/site-footer/site-footer.css";
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
import "@/components/lattice/lattice.css";
import "./lattice-lab.css";

/**
 * The route is a SERVER component because `sliceV7Sections` reads the v7
 * prototype off disk. `[]` means "HUD chrome only, no stations": the rungs
 * resolve ONLY against the real rail (`#leftTicks`' thirteen ticks are what
 * `measureLattice` reads the token ladder against), so without the real
 * markup every `--lat-rung-N` is a number nothing can check.
 */
export default function LatticeRoute() {
  const slice = sliceV7Sections([]);
  return <LatticeShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} />;
}
