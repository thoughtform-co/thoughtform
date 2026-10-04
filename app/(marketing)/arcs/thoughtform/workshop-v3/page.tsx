import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/v7";
import { THOUGHTFORM_WORKSHOP_V3_ARC } from "@/lib/arcs/content/thoughtform-workshop-v3";
import { WORKSHOP_INTRO } from "@/lib/arcs/content/shared/workshopIntro";
import { getCelestialSlotsCached } from "@/lib/celestial/queries";
import { extractV7Text, getThoughtformWorkshopContent } from "@/lib/v7-parse";

import { replaceAboutBio } from "./about";
import { replaceHeroCopy } from "./hero";
import { WORKSHOP_V3_JOURNEY, WORKSHOP_V3_NAV_ITEMS } from "./journey";
import { WorkshopV3Portals } from "./WorkshopPortals";

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
// The Prompt to Loop breakdown (ADR-141 U3, shared since ADR-143): its own
// rules, scoped under `.ptl`, on Thoughtform's tokens. After the arcs' sheet.
import "@/components/arcs/prompt-to-loop/prompt-to-loop.css";
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
  title: `${THOUGHTFORM_WORKSHOP_V3_ARC.meta.title} — Thoughtform`,
  description: THOUGHTFORM_WORKSHOP_V3_ARC.meta.description,
  // A link handed to a room, like every page under /arcs.
  robots: { index: false, follow: false },
};

/**
 * /arcs/thoughtform/workshop-v3 — the workshop's THIRD HOUSE CUT (ADR-143),
 * the template the owner's next presentations are cut from.
 *
 * The AP lecture's spine (ADR-141) without its worlds: the same page as v1 and
 * v2 down to the proof stack, then the situation by reference, then Prompt to
 * Loop as the worked example, split around the economics chapter that answers
 * its bill, then Laura's test and the close.
 *
 *   hero → about → the eras → CORRIDOR (thesis · Navigate/Encode/Build · epilogue)
 *        → the proof stack (#services, no card ring)
 *        → the third cut's arc (#workshop) → contact
 *
 * ⚠ A STATIC FOLDER UNDER `[slug]`'s NAMESPACE, like v1's and v2's. Next
 * matches this folder before the dynamic segment, and `[slug]`'s
 * `generateStaticParams` filters this slug out through `OWN_ROUTE_SLUGS`;
 * `thoughtform-workshop-v2.test.ts` walks the folders and fails on a missing
 * row.
 *
 * ⚠ IT SHARES v1's PROTOTYPE AND v1's SHEET. The corridor half is the same
 * page, so `getThoughtformWorkshopContent` is called with the same removed
 * stations and `.tw-root` is rendered unchanged. Its intro COPY diverges
 * through seams instead (ADR-143 U3, U6): `WORKSHOP_INTRO` rewrites the
 * hero's copy and the About's bio here, spreads the thesis's paragraphs over
 * the homepage's, and passes the corridor's captions, glyph words, Build
 * column and signal as `corridorText.copy`; `data-tw-cut="v3"` scopes its
 * rules in v1's sheet. The day its STRUCTURE diverges, the prototype, the sheet and
 * the root class still fork together (ADR-139).
 *
 * ⚠ NO `course.css`: this page draws no `path` and none of the Tom caps.
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

export default async function ThoughtformWorkshopV3Page() {
  const { bodyHtml: protoHtml, bodyClass } = getThoughtformWorkshopContent({
    removeStations: WORKSHOP_REMOVED_STATIONS,
    corridorMountId: CORRIDOR_MOUNT_ID,
  });
  // The intro leads into the workshop (ADR-143 U3, U6): the hero, the About,
  // the thesis's paragraphs, the glyphs' words, the captions, the Build
  // column and the signal line are this cut's own, from one record; the
  // thesis title is the homepage's. Each seam is the identity on every
  // other route.
  const bodyHtml = replaceAboutBio(
    replaceHeroCopy(protoHtml, WORKSHOP_INTRO.hero),
    WORKSHOP_INTRO.about
  );
  const shared = extractV7Text();
  const corridorText = {
    ...shared,
    thoughtform: { ...shared.thoughtform, ...WORKSHOP_INTRO.thesis },
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
      {/* `data-tw-cut` scopes this cut's rules in v1's sheet (the concise
          claims, the lit card), winning on specificity (ADR-141 U1). */}
      <div className="tw-root" data-tw-cut="v3">
        <LandingPage
          bodyHtml={bodyHtml}
          bodyClass={bodyClass}
          celestialSlots={celestialSlots}
          corridorText={corridorText}
          corridorMountId={CORRIDOR_MOUNT_ID}
          navItems={WORKSHOP_V3_NAV_ITEMS}
          journey={WORKSHOP_V3_JOURNEY}
        />
      </div>
      {/* After the wrapper, so its effects run once the parsed body is
          committed; a sibling of LandingPage for the reason it documents. */}
      <WorkshopV3Portals />
    </>
  );
}
