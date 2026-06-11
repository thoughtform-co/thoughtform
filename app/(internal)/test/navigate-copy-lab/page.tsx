import { NavigateCopyLabPage } from "@/components/landing/home-v2/lab/NavigateCopyLabPage";
import { sliceV7Sections } from "@/lib/v7-parse";
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/lab/navigate-copy-lab.css";

/**
 * /test/navigate-copy-lab — text-positioning lab for the Navigate park
 * (no scroll, single beat).
 *
 * Freezes the depth-corridor store at the Navigate park so the gimbal
 * sphere, brandmark, and HUD chrome render statically, then layers
 * five static copy variants on top (baseline split, rail dock,
 * corner console, unified cartouche, limb callout) for side-by-side
 * judgement. Mirrors `/test/navigate-gyroscope` server scaffolding so
 * the v7 HUD chrome (rails + brackets) and styling are present.
 *
 * Internal-only: production blocks `/test/*` via `middleware.ts`.
 */
export default function NavigateCopyLabRoute() {
  const slice = sliceV7Sections([]);
  return <NavigateCopyLabPage hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} />;
}
