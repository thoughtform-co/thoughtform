import { sliceV7Sections } from "@/lib/v7-parse";

import { LatentFlightShell } from "./LatentFlightShell";

/* ⚠ STYLESHEET ORDER IS LOAD-BEARING.
     landing.css       the @font-face block, the :root token chain and every
                       `.hud*` rule the frame paints with
     hud.css           the glass HUD layer
     latent-flight.css the page — last, so its scoped overrides win

   ⚠ NO theme.css, DELIBERATELY. Scene 1 is a kept-dark artifact (emitters
   over void); with theme.css loaded a visitor whose stored theme is light
   would get ink hairlines over a black cosmos — invisible rails. A light
   cosmos is its own drawing, not a token swap, and is deferred. */
import "@/components/landing/v7/landing.css";
import "@/components/latent-flight/hud/hud.css";
import "@/components/latent-flight/latent-flight.css";

export const metadata = {
  title: "Latent Flight",
  robots: { index: false, follow: false },
};

/**
 * The route is a SERVER component because `sliceV7Sections` reads the v7
 * prototype off disk. `[]` means "HUD chrome only, no stations": the rails,
 * the corner brackets and the wordmark, exactly as the landing paints them.
 */
export default function LatentFlightRoute() {
  const slice = sliceV7Sections([]);
  return <LatentFlightShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} />;
}
