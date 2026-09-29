import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/v7";
import { THOUGHTFORM_WORKSHOP_ARC } from "@/lib/arcs/content/thoughtform-workshop";
import { getCelestialSlotsCached } from "@/lib/celestial/queries";
import { extractV7Text, getThoughtformWorkshopContent } from "@/lib/v7-parse";

import { WORKSHOP_JOURNEY, WORKSHOP_NAV_ITEMS } from "./journey";
import { WorkshopPortals } from "./WorkshopPortals";

import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/home-v2/services/casefile/console/console.css";
import "@/components/landing/home-v2/services/casefile/map/pda/pda.css";
import "@/components/landing/home-v2/services/proof-stack/proof-stack.css";
// The arcs' sheet: the workshop after the proof is the arcs' own section
// components inside an `.arc-root`, and this is their grammar and their light
// re-derivation. Before the route sheet, so the route can overrule it.
import "@/components/arcs/arcs.css";
// about-stage.css / continuum-stage.css / voidwalker/*.css are deliberately
// NOT imported: this page mounts no pinned stage (ADR-053).
import "./thoughtform-workshop.css";
// Theme sheet LAST of the composition sheets (ADR-058).
import "@/components/landing/v7/theme.css";
// The instruments after it, exactly as `/` and the arcs route do; without it
// the settings cluster falls into flow at the foot of the document (ADR-093).
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
// The footer's own sheet (ADR-127): every route that mounts the close.
import "@/components/landing/v7/site-footer/site-footer.css";

export const metadata: Metadata = {
  title: `${THOUGHTFORM_WORKSHOP_ARC.meta.title} — Thoughtform`,
  description: THOUGHTFORM_WORKSHOP_ARC.meta.description,
  // A link handed to a room, like every page under /arcs.
  robots: { index: false, follow: false },
};

/**
 * /arcs/thoughtform-workshop — the house workshop as a HOMEPAGE VARIANT
 * (ADR-137), the third fork of ADR-053's recipe after `/claude-workshop` and
 * the Trinny proposal:
 *
 *   hero → about → CORRIDOR (thesis · Navigate/Encode/Build · epilogue)
 *        → the proof stack (#services, no card ring)
 *        → the workshop arc from its opening slide on (#workshop) → contact
 *
 * ⚠ A STATIC FOLDER UNDER `[slug]`'s NAMESPACE. Next matches this folder
 * before the dynamic segment, and `[slug]`'s `generateStaticParams` filters
 * this slug out so the two never both emit it; the `ArcDef` stays in `ARCS`,
 * so the overview card, the registry guards and `HERO_ROUTES` are unchanged.
 */

// ADR-053's list, for the same reasons (never "approach": it is nested inside
// #practice on this prototype and removing it too re-emits orphan markup).
const WORKSHOP_REMOVED_STATIONS = [
  "definition",
  "missing-layer",
  "intelligence-layer",
  "continuum",
  "practice",
  "buildQuote",
  "build",
] as const;
const CORRIDOR_MOUNT_ID = "home-corridor-mount";

export default async function ThoughtformWorkshopPage() {
  const { bodyHtml, bodyClass } = getThoughtformWorkshopContent({
    removeStations: WORKSHOP_REMOVED_STATIONS,
    corridorMountId: CORRIDOR_MOUNT_ID,
  });
  const corridorText = extractV7Text();
  const celestialSlots = await getCelestialSlotsCached();

  return (
    <>
      <div className="tw-root">
        <LandingPage
          bodyHtml={bodyHtml}
          bodyClass={bodyClass}
          celestialSlots={celestialSlots}
          corridorText={corridorText}
          corridorMountId={CORRIDOR_MOUNT_ID}
          navItems={WORKSHOP_NAV_ITEMS}
          journey={WORKSHOP_JOURNEY}
        />
      </div>
      {/* After the wrapper, so its effects run once the parsed body is
          committed; a sibling of LandingPage for the reason it documents. */}
      <WorkshopPortals />
    </>
  );
}
