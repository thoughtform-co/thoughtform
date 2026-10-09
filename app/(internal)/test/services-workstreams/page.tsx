import { sliceV7Sections } from "@/lib/v7-parse";

import { WorkstreamsShell } from "./WorkstreamsShell";

import "@/components/landing/v7/landing.css";
import "@/components/landing/v7/theme.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "./services-workstreams.css";

/**
 * /test/services-workstreams — server route.
 *
 * The real HUD chrome from the v7 parse (the card-face lab's own recipe), then
 * the client shell. The parse touches the filesystem, so it stays here.
 * Production sheets first, `theme.css` so `?theme=light` reaches the DOM, the
 * lab sheet last so its scoped rules win.
 *
 * Internal-only: `proxy.ts` blocks `/test/*` in production.
 */
export default function ServicesWorkstreamsRoute() {
  const slice = sliceV7Sections([]);
  return <WorkstreamsShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} />;
}
