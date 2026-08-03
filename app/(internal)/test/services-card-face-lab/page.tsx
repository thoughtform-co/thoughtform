import { sliceV7Sections } from "@/lib/v7-parse";

import { CardFaceLabShell } from "./CardFaceLabShell";

import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "./services-card-face-lab.css";

/**
 * /test/services-card-face-lab â€” server route.
 *
 * Parses the v7 prototype for the REAL HUD chrome (rails + 13-tick ladders +
 * corner brackets + wordmark) exactly as the anchor lab does, then hands it to
 * the client shell. The parse touches the filesystem, so it must stay
 * server-side.
 *
 * Stylesheet order is load-bearing: the three production sheets first (the
 * masthead geometry and the plate vocabulary must resolve against the real
 * `:root` token chain), then the lab sheet LAST so its scoped overrides win.
 *
 * Internal-only: `proxy.ts` blocks `/test/*` in production.
 */
export default function ServicesCardFaceLabRoute() {
  const slice = sliceV7Sections([]);
  return <CardFaceLabShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} />;
}
