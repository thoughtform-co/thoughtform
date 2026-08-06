import { sliceV7Sections } from "@/lib/v7-parse";

import { CasefileTypeLabShell } from "./CasefileTypeLabShell";

import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/home-v2/services/casefile/console/console.css";
import "@/components/landing/home-v2/services/casefile/map/pda/pda.css";
import "@/components/landing/v7/theme.css";
import "./casefile-type-lab.css";

/**
 * /test/casefile-type-lab — server route.
 *
 * Parses the v7 prototype for the REAL HUD chrome, exactly as the anchor lab
 * does. The parse touches the filesystem, so it stays server-side.
 *
 * ⚠ STYLESHEET ORDER IS LOAD-BEARING and mirrors `app/(marketing)/page.tsx`:
 * the production sheets in their production sequence (casefile → console →
 * pda, then theme.css LAST of the production set, since it is the light-mode
 * cascade), and the lab sheet after all of them so its scoped overrides win.
 * Getting `theme.css` out of order costs the light theme, not a compile
 * error — which is exactly the kind of thing a lab hides.
 */
export default function CasefileTypeLabRoute() {
  const slice = sliceV7Sections([]);
  return <CasefileTypeLabShell hudHtml={slice.hudHtml} />;
}
