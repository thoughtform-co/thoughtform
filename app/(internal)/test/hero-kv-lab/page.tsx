import { sliceV7Sections } from "@/lib/v7-parse";

import { HeroKvLab } from "./HeroKvLab";

/* Stylesheet order is the marketing route's for the sheets this page needs:
   landing.css (the @font-face block, the :root tokens, `.hud*` and `.hero*`),
   home-v2.css (`.home-v2-hud-root { display: contents }`), theme.css last of
   the production set, then the lab's own so its scoped overrides win. */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/v7/theme.css";
import "./hero-kv-lab.css";

/**
 * A SERVER component because `sliceV7Sections` reads the v7 prototype off
 * disk: `["hero"]` returns the HUD chrome and the production hero section,
 * so the copy, the overlay and the frame are the shipped ones.
 */
export default function HeroKvLabRoute() {
  const slice = sliceV7Sections(["hero"]);
  const heroHtml = slice.sections.find((s) => s.id === "hero")?.html ?? "";
  return <HeroKvLab hudHtml={slice.hudHtml} heroHtml={heroHtml} bodyClass={slice.bodyClass} />;
}
