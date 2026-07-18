import { sliceV7Sections } from "@/lib/v7-parse";

import { SectionMenuLabShell } from "./SectionMenuLabShell";

import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "./section-menu-lab.css";

/**
 * /test/section-menu-lab — server route.
 *
 * Parses the v7 prototype for the real HUD chrome (rails + ticks +
 * corner brackets + wordmark) exactly as the navigate labs do, then
 * hands it to the client shell. Internal-only: `middleware.ts` blocks
 * `/test/*` in production.
 */
export default function SectionMenuLabRoute() {
  const slice = sliceV7Sections([]);
  return <SectionMenuLabShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} />;
}
