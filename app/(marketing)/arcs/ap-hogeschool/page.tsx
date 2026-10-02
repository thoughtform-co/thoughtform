import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/v7";
import { AP_HOGESCHOOL_ARC } from "@/lib/arcs/content/ap-hogeschool";
import { getCelestialSlotsCached } from "@/lib/celestial/queries";
import { extractV7Text, getThoughtformWorkshopContent } from "@/lib/v7-parse";

import { AP_HOGESCHOOL_JOURNEY, AP_HOGESCHOOL_NAV_ITEMS } from "./journey";
import { ApHogeschoolPortals } from "./WorkshopPortals";

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
// The arcs' sheet: the lecture after the proof is the arcs' own section
// components inside an `.arc-root`, and this is their grammar and their light
// re-derivation. Before the route sheet, so the route can overrule it.
import "@/components/arcs/arcs.css";
// ⚠ THE COURSE'S SHEET (ADR-134), which v2 does not load and this page must:
// the `path` kind is styled there and nowhere else, and so are the worked
// example's height caps (the Tom wall's, this page's two worlds'). Without it
// the path renders as an unstyled column ~10,700px tall at 1280×720 with every
// registry guard green. After arcs.css, whose tokens it reads, as `[slug]`
// orders it.
import "@/components/arcs/course.css";
// The Prompt to Loop breakdown (ADR-141 U3): its own rules, scoped under
// `.ptl`, on Thoughtform's tokens. After the arcs' sheets it reads from.
import "./prompt-to-loop.css";
// about-stage.css / continuum-stage.css are deliberately NOT imported: this
// page mounts no about deck stage (ADR-053).
// ⚠ v1's ROUTE SHEET, BY PATH. This page renders `.tw-root` and shares v1's
// prototype, so it shares v1's overrides too; a copy would be a second thing
// to keep in step with `flowClock.ts`, which the flow test pins by literal
// path against that file and that file alone (ADR-139).
import "../thoughtform-workshop/thoughtform-workshop.css";
// Theme sheet LAST of the composition sheets (ADR-058).
import "@/components/landing/v7/theme.css";
// The instruments after it, exactly as `/` and the arcs route do; without it
// the settings cluster falls into flow at the foot of the document (ADR-093).
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
// The footer's own sheet (ADR-127): every route that mounts the close.
import "@/components/landing/v7/site-footer/site-footer.css";

export const metadata: Metadata = {
  title: `${AP_HOGESCHOOL_ARC.meta.title} — Thoughtform`,
  description: AP_HOGESCHOOL_ARC.meta.description,
  // A link handed to a room, like every page under /arcs.
  robots: { index: false, follow: false },
};

/**
 * /arcs/ap-hogeschool — the AP Hogeschool guest lecture, the workshop's THIRD
 * CUT (ADR-141).
 *
 * The same page as v2 down to the proof stack, and a tail written for a room
 * of students: show and tell, not technical. The story is the spine's own
 * (the About, the eras, the Arc, the Loop pile with its films); the tail is
 * the situation in five beats, one world's six questions, three brand worlds
 * built with the method, and what a student can do this week.
 *
 *   hero → about → the eras → CORRIDOR (thesis · Navigate/Encode/Build · epilogue)
 *        → the proof stack (#services, no card ring)
 *        → the lecture's arc (#workshop) → contact
 *
 * ⚠ A STATIC FOLDER UNDER `[slug]`'s NAMESPACE, like v1's and v2's. Next
 * matches this folder before the dynamic segment, and `[slug]`'s
 * `generateStaticParams` filters this slug out through `OWN_ROUTE_SLUGS` so
 * the two never both emit it; `thoughtform-workshop-v2.test.ts` walks the
 * folders and fails on a missing row.
 *
 * ⚠ IT SHARES v1's PROTOTYPE AND v1's SHEET. The corridor half is the same
 * page, so `getThoughtformWorkshopContent` is called with the same removed
 * stations and `.tw-root` is rendered unchanged. The day the corridor copy
 * diverges, the prototype, the sheet and the root class fork together.
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

export default async function ApHogeschoolPage() {
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
          navItems={AP_HOGESCHOOL_NAV_ITEMS}
          journey={AP_HOGESCHOOL_JOURNEY}
        />
      </div>
      {/* After the wrapper, so its effects run once the parsed body is
          committed; a sibling of LandingPage for the reason it documents. */}
      <ApHogeschoolPortals />
    </>
  );
}
