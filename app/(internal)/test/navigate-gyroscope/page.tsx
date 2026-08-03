import { NavigateGyroscopePage } from "@/components/landing/home-v2/lab/NavigateGyroscopePage";
import { extractV7Text, sliceV7Sections } from "@/lib/v7-parse";
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";

/**
 * /test/navigate-gyroscope â€” gyroscope exploration lab (ADR-018 spin-off).
 *
 * Reuses the EXACT home depth corridor (`HomeV2Page` -> `HomeCorridor`)
 * and flips `gyroLabStore.enabled` so the Navigate compass renders as the
 * particle-suggested gyroscope (`ShellSubstrateGyro`) instead of the flat
 * `ShellSubstrate`. Exploration-only: production home and `/test/home-v2`
 * are unaffected (the store defaults to disabled).
 *
 * Server component mirrors `/test/home-v2`: extracts the v7 HUD chrome +
 * structured corridor copy and hands them to the client lab page.
 *
 * Internal-only: production blocks `/test/*` via `proxy.ts`.
 */
export default function NavigateGyroscopeRoute() {
  const slice = sliceV7Sections([]);
  const text = extractV7Text();
  return <NavigateGyroscopePage hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} text={text} />;
}
