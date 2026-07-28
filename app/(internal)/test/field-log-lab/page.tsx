import { sliceV7Sections } from "@/lib/v7-parse";

import { FieldLogLabShell } from "./FieldLogLabShell";

import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "@/components/landing/v7/tools-cards/tools-cards.css";
import "./field-log-lab.css";

/**
 * /test/field-log-lab — server route.
 *
 * Parses the v7 prototype for the REAL HUD chrome (rails + 13-tick ladders +
 * corner brackets + wordmark) exactly as the dossier / highlight / anchor
 * labs do, then hands it to the client shell. The parse touches the
 * filesystem, so it stays server-side. `[]` means "HUD only, no stations" —
 * the casefile is the only content on the page, and it is judged against the
 * real rails because its whole geometry snaps to their tick ladder.
 *
 * Stylesheet order is load-bearing: the production sheets first (`landing.css`
 * owns the `@font-face` block and the `:root` token chain the tick math and
 * the band copy sizes resolve against), then the lab sheet LAST so its scoped
 * overrides win.
 *
 * Internal-only: `middleware.ts` blocks `/test/*` in production.
 */
export default function FieldLogLabRoute() {
  const slice = sliceV7Sections([]);
  return <FieldLogLabShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} />;
}
