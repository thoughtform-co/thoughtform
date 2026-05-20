import { HomeV2Page } from "@/components/landing/home-v2/HomeV2Page";
import { sliceV7Sections } from "@/lib/v7-parse";
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";

/**
 * /test/home-v2 — depth-gateway homepage v2.
 *
 * Server component: slices the v7 prototype HTML for the HUD chrome
 * + the three station sections we care about (definition / missing-
 * layer / intelligence-layer) and passes them to the client
 * `HomeV2Page`. The hero is hard-coded inside the client component
 * because we want it pristine (just video + wordmark + tagline,
 * none of the v7 scroll plumbing).
 *
 * Production homepage (`/`) is untouched.
 */
export default function HomeV2Route() {
  const slice = sliceV7Sections(["definition", "missing-layer", "intelligence-layer"]);
  return (
    <HomeV2Page hudHtml={slice.hudHtml} sections={slice.sections} bodyClass={slice.bodyClass} />
  );
}
