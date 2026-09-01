import { sliceV7Sections } from "@/lib/v7-parse";

import { ClientStackLabShell } from "./ClientStackLabShell";

import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/home-v2/services/casefile/console/console.css";
import "@/components/landing/home-v2/services/casefile/map/pda/pda.css";
import "@/components/landing/v7/theme.css";
import "./client-stack-lab.css";

/**
 * /test/client-stack-lab — server route.
 *
 * Parses the v7 prototype for the REAL HUD chrome, exactly as the
 * casefile-type-lab does. The parse touches the filesystem, so it stays
 * server-side; `[]` means "HUD only, no stations" — the casefile is the only
 * content on the page, and it is judged against the real rails because its
 * whole geometry snaps to their tick ladder.
 *
 * ⚠ STYLESHEET ORDER IS LOAD-BEARING and mirrors `app/(marketing)/page.tsx`:
 * the production sheets in their production sequence (casefile → console →
 * pda, then `theme.css` LAST of the production set, since it is the light-mode
 * cascade), and the lab sheet after all of them so its scoped overrides win.
 * Getting `theme.css` out of order costs the light theme, not a compile error
 * — which is exactly the kind of thing a lab hides.
 *
 * Internal-only: `proxy.ts` blocks `/test/*` in production.
 */
export default function ClientStackLabRoute() {
  const slice = sliceV7Sections([]);
  return <ClientStackLabShell hudHtml={slice.hudHtml} />;
}
