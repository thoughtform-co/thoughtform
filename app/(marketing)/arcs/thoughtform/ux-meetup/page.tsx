import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/v7";
import { WORKSHOP_INTRO } from "@/lib/arcs/content/shared/workshopIntro";
import { UX_MEETUP_ARC, UX_MEETUP_HERO } from "@/lib/arcs/content/ux-meetup";
import { getCelestialSlotsCached } from "@/lib/celestial/queries";
import { extractV7Text, getThoughtformWorkshopContent } from "@/lib/v7-parse";

import { replaceAboutBio } from "../workshop-v3/about";
import { insertEquilibriumStation } from "../workshop-v3/equilibrium";
import { replaceHeroCopy } from "../workshop-v3/hero";
import { UX_MEETUP_JOURNEY, UX_MEETUP_NAV_ITEMS } from "./journey";
import { UxMeetupPortals } from "./WorkshopPortals";

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
// The arcs' sheet: the talk after the proof is the arcs' own section
// components inside an `.arc-root`, and this is their grammar and their light
// re-derivation. Before the route sheet, so the route can overrule it.
import "@/components/arcs/arcs.css";
// ⚠ THE COURSE'S SHEET (ADR-134), as the AP lecture loads it: the `path` kind
// is styled there and nowhere else, and so are the Tom wall's height caps.
// After arcs.css, whose tokens it reads.
import "@/components/arcs/course.css";
// about-stage.css / continuum-stage.css are deliberately NOT imported: this
// page mounts no about deck stage (ADR-053).
// ⚠ v1's ROUTE SHEET, BY PATH. This page renders `.tw-root` and shares v1's
// prototype, so it shares v1's overrides too; a copy would be a second thing
// to keep in step with `flowClock.ts`, which the flow test pins by literal
// path against that file and that file alone (ADR-139).
import "../workshop-v1/thoughtform-workshop.css";
// v3's opener, BY PATH, as Suri's cut loads it (ADR-147 U1). Every rule is
// scoped `.tw-root[data-tw-cut="v3"]`, which this page renders, and wins on
// specificity, never on order (ADR-141 U1).
import "../workshop-v3/equilibrium.css";
// Theme sheet LAST of the composition sheets (ADR-058).
import "@/components/landing/v7/theme.css";
// The instruments after it, exactly as `/` and the arcs route do; without it
// the settings cluster falls into flow at the foot of the document (ADR-093).
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
// The footer's own sheet (ADR-127): every route that mounts the close.
import "@/components/landing/v7/site-footer/site-footer.css";

export const metadata: Metadata = {
  title: `${UX_MEETUP_ARC.meta.title} — Thoughtform`,
  description: UX_MEETUP_ARC.meta.description,
  // A link handed to a room, like every page under /arcs.
  robots: { index: false, follow: false },
};

/**
 * /arcs/thoughtform/ux-meetup — the owner's talk for the UX Gent AI-design
 * meetup of 15 October 2026 (ADR-156), a cut of the workshop's third house cut.
 *
 * v3's page with the record swapped, as Suri's lunch and learn is (ADR-147):
 * the same corridor half, its intro from the SAME record (`WORKSHOP_INTRO`,
 * through the same seams, so the owner's edits to v3 land here), with the
 * talk's own hero, and the talk's own arc after the proof.
 *
 *   hero → the equilibrium → about → the eras
 *        → CORRIDOR (thesis · Navigate/Encode/Build · epilogue)
 *        → the proof stack (#services, no card ring)
 *        → the talk (#workshop) → contact
 *
 * ⚠ A STATIC FOLDER UNDER `[slug]`'s NAMESPACE, like v3's. Next matches this
 * folder before the dynamic segment, and `[slug]`'s `generateStaticParams`
 * filters this slug out through `OWN_ROUTE_SLUGS`;
 * `thoughtform-workshop-v2.test.ts` walks the folders and fails on a missing
 * row.
 *
 * ⚠ IT SHARES v1's PROTOTYPE AND v1's SHEET, AND v3's SEAMS BY IMPORT. The
 * hero and About rewrites are v3's own modules; `data-tw-cut="v3"` keeps v1's
 * route sheet rules for this cut. The day the corridor half diverges, the
 * prototype, the sheet and the root class fork together (ADR-139).
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

export default async function UxMeetupPage() {
  const { bodyHtml: protoHtml, bodyClass } = getThoughtformWorkshopContent({
    removeStations: WORKSHOP_REMOVED_STATIONS,
    corridorMountId: CORRIDOR_MOUNT_ID,
  });
  // v3's intro (ADR-143 U3, U6) with the talk's own hero written over the
  // prototype's; the equilibrium and the About are the record's.
  const bodyHtml = replaceAboutBio(
    insertEquilibriumStation(
      replaceHeroCopy(protoHtml, UX_MEETUP_HERO),
      WORKSHOP_INTRO.equilibrium
    ),
    WORKSHOP_INTRO.about
  );
  const shared = extractV7Text();
  const corridorText = {
    ...shared,
    copy: {
      stations: WORKSHOP_INTRO.stations,
      signal: WORKSHOP_INTRO.signal,
      phaseSubs: WORKSHOP_INTRO.phases,
      stack: WORKSHOP_INTRO.stack,
    },
  };
  const celestialSlots = await getCelestialSlotsCached();

  return (
    <>
      {/* `data-tw-cut="v3"` scopes v3's rules in v1's sheet (the concise
          claims, the lit card), which this cut shares (ADR-141 U1). */}
      <div className="tw-root" data-tw-cut="v3">
        <LandingPage
          bodyHtml={bodyHtml}
          bodyClass={bodyClass}
          celestialSlots={celestialSlots}
          corridorText={corridorText}
          corridorMountId={CORRIDOR_MOUNT_ID}
          navItems={UX_MEETUP_NAV_ITEMS}
          journey={UX_MEETUP_JOURNEY}
        />
      </div>
      {/* After the wrapper, so its effects run once the parsed body is
          committed; a sibling of LandingPage for the reason it documents. */}
      <UxMeetupPortals />
    </>
  );
}
