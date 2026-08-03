import { sliceV7Sections } from "@/lib/v7-parse";

import { ProofDossierLabShell } from "./ProofDossierLabShell";

import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "@/components/landing/v7/tools-cards/tools-cards.css";
import "@/components/landing/home-v2/services/dossier/dossier.css";
import "./proof-dossier-lab.css";

/**
 * /test/proof-dossier-lab â€” server route.
 *
 * Parses the v7 prototype for the REAL HUD chrome (rails + 13-tick ladders +
 * corner brackets + wordmark) exactly as the anchor / card-face / highlight
 * labs do, then hands it to the client shell. The parse touches the
 * filesystem, so it stays server-side. `[]` means "HUD only, no stations" â€”
 * the services stage is stood in for by `StageBed`.
 *
 * Stylesheet order is load-bearing: the production sheets first (the
 * `.services-stage` box and the `:root` token chain the dossier's band-
 * relative sizing resolves against), then the dossier's own sheet, then the
 * lab sheet LAST so its scoped overrides win.
 *
 * Internal-only: `proxy.ts` blocks `/test/*` in production.
 */
export default function ProofDossierLabRoute() {
  const slice = sliceV7Sections([]);
  return <ProofDossierLabShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} />;
}
