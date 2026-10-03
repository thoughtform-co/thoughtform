import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/v7";
import { THOUGHTFORM_WORKSHOP_V2_ARC } from "@/lib/arcs/content/thoughtform-workshop-v2";
import { getCelestialSlotsCached } from "@/lib/celestial/queries";
import { extractV7Text, getThoughtformWorkshopContent } from "@/lib/v7-parse";

import { WORKSHOP_V2_JOURNEY, WORKSHOP_V2_NAV_ITEMS } from "./journey";
import { WorkshopV2Portals } from "./WorkshopPortals";

import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/home-v2/services/casefile/console/console.css";
import "@/components/landing/home-v2/services/casefile/map/pda/pda.css";
import "@/components/landing/home-v2/services/proof-stack/proof-stack.css";
// The era stage (ADR-138): the homepage's five sheets, in `/`'s order, so the
// eras render exactly as they do there. Before the route sheet, which seats
// the station above the corridor rather than after it (rule 1d).
import "@/components/landing/home-v2/voidwalker/voidwalker.css";
import "@/components/landing/home-v2/voidwalker/voidwalker-wire.css";
import "@/components/landing/home-v2/voidwalker/voidwalker-travel.css";
import "@/components/landing/home-v2/voidwalker/hologram/voidwalker-hologram.css";
import "@/components/landing/home-v2/voidwalker/hologram/voidwalker-datum.css";
// The arcs' sheet: the workshop after the proof is the arcs' own section
// components inside an `.arc-root`, and this is their grammar and their light
// re-derivation. Before the route sheet, so the route can overrule it.
import "@/components/arcs/arcs.css";
// about-stage.css / continuum-stage.css are deliberately NOT imported: this
// page mounts no about deck stage (ADR-053).
// ⚠ v1's ROUTE SHEET, BY PATH. This page renders `.tw-root` and shares v1's
// prototype, so it shares v1's overrides too; a copy would be a second thing
// to keep in step with `flowClock.ts`, which the flow test pins by literal
// path against that file and that file alone (ADR-139).
import "../workshop-v1/thoughtform-workshop.css";
// Theme sheet LAST of the composition sheets (ADR-058).
import "@/components/landing/v7/theme.css";
// The instruments after it, exactly as `/` and the arcs route do; without it
// the settings cluster falls into flow at the foot of the document (ADR-093).
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
// The footer's own sheet (ADR-127): every route that mounts the close.
import "@/components/landing/v7/site-footer/site-footer.css";

export const metadata: Metadata = {
  title: `${THOUGHTFORM_WORKSHOP_V2_ARC.meta.title} — Thoughtform`,
  description: THOUGHTFORM_WORKSHOP_V2_ARC.meta.description,
  // A link handed to a room, like every page under /arcs.
  robots: { index: false, follow: false },
};

/**
 * /arcs/thoughtform/workshop-v2 — the workshop's SECOND CUT (ADR-139).
 *
 * The same page as v1 down to the proof stack, and a different chapter after
 * it: the framing runs as before, gains the ground beat, and then the
 * practical half shows the configuration actually built — the plugin board,
 * the skill as a file, its evals, the marketplace, the two conversations —
 * switched between three worked examples.
 *
 *   hero → about → CORRIDOR (thesis · Navigate/Encode/Build · epilogue)
 *        → the proof stack (#services, no card ring)
 *        → the second cut's arc (#workshop) → contact
 *
 * ⚠ A STATIC FOLDER UNDER `[slug]`'s NAMESPACE, like v1's. Next matches this
 * folder before the dynamic segment, and `[slug]`'s `generateStaticParams`
 * filters this slug out through `OWN_ROUTE_SLUGS` so the two never both emit
 * it. ⚠ NOTHING TESTS THAT FILTER: miss the entry there and the build quietly
 * emits a `[slug]` page this folder shadows.
 *
 * ⚠ IT SHARES v1's PROTOTYPE AND v1's SHEET. The corridor half is the same
 * page, so `getThoughtformWorkshopContent` is called with the same removed
 * stations and `.tw-root` is rendered unchanged. The Trinny fork's warning —
 * that a shared read makes every copy edit a change to the other route — is
 * about the prototype's COPY, and this cut changes none of it. The day it
 * does, the prototype, the sheet and the root class fork together.
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

export default async function ThoughtformWorkshopV2Page() {
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
          navItems={WORKSHOP_V2_NAV_ITEMS}
          journey={WORKSHOP_V2_JOURNEY}
        />
      </div>
      {/* After the wrapper, so its effects run once the parsed body is
          committed; a sibling of LandingPage for the reason it documents. */}
      <WorkshopV2Portals />
    </>
  );
}
