import { HomeV2Page } from "@/components/landing/home-v2/HomeV2Page";
import { extractV7Text, sliceV7Sections } from "@/lib/v7-parse";
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";

/**
 * /test/home-v2 — depth-corridor homepage v2 (ADR-018, world-owned
 * rebuild).
 *
 * Server component: extracts the v7 HUD chrome (for the production
 * gateway gradient + hud rails + nav) and the structured corridor
 * text (titles, ledes, label tags) from the v7 prototype HTML, then
 * passes both to the client `HomeV2Page`. The corridor's DIAGRAM
 * geometry no longer comes from the v7 SVG markup — it's rendered
 * by the R3F gate groups inside `DepthGatewayScene`. The v7 HTML is
 * the source of truth for COPY only.
 *
 * Production homepage (`/`) is untouched.
 */
export default function HomeV2Route() {
  const slice = sliceV7Sections([]);
  const text = extractV7Text();
  return <HomeV2Page hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} text={text} />;
}
