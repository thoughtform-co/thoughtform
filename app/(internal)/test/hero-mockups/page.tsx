import { HeroMockupLab } from "@/components/landing/v7/lab/HeroMockupLab";
import { sliceV7Sections } from "@/lib/v7-parse";
import "@/components/landing/v7/landing.css";
import "@/components/landing/v7/lab/hero-mockups.css";

/**
 * /test/hero-mockups — switchable hero composition lab.
 *
 * Loads the parsed v7 HUD chrome (gateway placeholder + corner brackets +
 * left/right rails + bottom-left brandmark slot) via `sliceV7Sections([])`
 * — same pattern as `/test/navigate-copy-lab` — so every mockup renders
 * inside the production HUD, not a custom mini-frame.
 *
 * Internal-only: production blocks `/test/*` via `middleware.ts`.
 */
export default function HeroMockupsRoute() {
  const slice = sliceV7Sections([]);
  return <HeroMockupLab hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} />;
}
