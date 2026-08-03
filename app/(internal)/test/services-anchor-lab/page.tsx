import { sliceV7Sections } from "@/lib/v7-parse";

import { ServicesAnchorLabShell } from "./ServicesAnchorLabShell";

import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "./services-anchor-lab.css";

/**
 * /test/services-anchor-lab â€” server route.
 *
 * Parses the v7 prototype for the REAL HUD chrome (rails + 13-tick ladders
 * with the "2"/"5" majors + corner brackets + wordmark) exactly as the
 * navigate labs do, then hands it to the client shell. The parse touches the
 * filesystem, so it must stay server-side.
 *
 * Stylesheet order is load-bearing: the three production sheets first (the
 * masthead + menu geometry must resolve against the real `:root` token
 * chain), then the lab sheet LAST so its scoped overrides win the cascade.
 *
 * Internal-only: `proxy.ts` blocks `/test/*` in production.
 */
export default function ServicesAnchorLabRoute() {
  const slice = sliceV7Sections([]);
  return <ServicesAnchorLabShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} />;
}
