import { sliceV7Sections } from "@/lib/v7-parse";

import { ProofHighlightLabShell } from "./ProofHighlightLabShell";

import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "@/components/landing/v7/tools-cards/tools-cards.css";
import "./proof-highlight-lab.css";

/**
 * /test/proof-highlight-lab — server route.
 *
 * Parses the v7 prototype for the REAL HUD chrome (rails + 13-tick ladders +
 * corner brackets + wordmark) exactly as the anchor / card-face labs do, then
 * hands it to the client shell. The parse touches the filesystem, so it stays
 * server-side. `[]` means "HUD only, no stations" — the head is rendered by
 * `ProofHead` instead (see its docblock for why the generated markup is not
 * injected).
 *
 * Stylesheet order is load-bearing: the production sheets first (the `.proof__*`
 * head grammar, the `.svc-plate` shell vocabulary and the `.pcl-*` console
 * atoms must resolve against the real `:root` token chain), then the lab sheet
 * LAST so its scoped overrides win.
 *
 * Internal-only: `middleware.ts` blocks `/test/*` in production.
 */
export default function ProofHighlightLabRoute() {
  const slice = sliceV7Sections([]);
  return <ProofHighlightLabShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} />;
}
