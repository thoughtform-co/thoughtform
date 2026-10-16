import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/v7";
import { KEYNOTE_ARC, KEYNOTE_HERO } from "@/lib/arcs/content/keynote-template-alpha";
import { WORKSHOP_INTRO } from "@/lib/arcs/content/shared/workshopIntro";
import { getCelestialSlotsCached } from "@/lib/celestial/queries";
import { extractV7Text, getThoughtformWorkshopContent } from "@/lib/v7-parse";

import { replaceAboutBio } from "../workshop-v3/about";
import { replaceHeroCopy } from "../workshop-v3/hero";
import { KEYNOTE_JOURNEY, KEYNOTE_NAV_ITEMS } from "./journey";
import { insertSwarmBeforeCorridor, moveTalkBeforeCorridor } from "./order";
import { KeynotePortals } from "./WorkshopPortals";

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
// The arcs' sheet: the talk is the arcs' own section components inside an
// `.arc-root`, and this is their grammar and their light re-derivation.
// Before the route sheet, so the route can overrule it.
import "@/components/arcs/arcs.css";
// The isometric stack (ADR-156 U2): the `stack` kind draws `StackFigure`,
// whose sheet only the proposal routes loaded.
import "@/components/arcs/stack/stack.css";
// The talk's figures (ADR-156 U3) on the framing's floor classes from arcs.css.
import "@/components/arcs/figures/figures.css";
// about-stage.css / continuum-stage.css are deliberately NOT imported: this
// page mounts no about deck stage (ADR-053).
// ⚠ v1's ROUTE SHEET, BY PATH. This page renders `.tw-root` and shares v1's
// prototype, so it shares v1's overrides too; a copy would be a second thing
// to keep in step with `flowClock.ts`, which the flow test pins by literal
// path against that file and that file alone (ADR-139).
import "../workshop-v1/thoughtform-workshop.css";
// The swarm chapter: the X-Bionic proposal's three sections as
// /test/proposal-swarm draws them, that route's sheets for them.
import "@/components/xb-proposal/xb.css";
import "@/components/xb-proposal/xb-in-frame.css";
import "@/components/xb-proposal/masthead.css";
import "@/components/xb-proposal/plug/plug.css";
import "@/components/xb-proposal/embed/embed.css";
import "@/components/xb-proposal/network/network.css";
import "@/components/xb-proposal/kit/kit.css";
import "@/components/xb-proposal/stack/stack-hero.css";
import "@/components/xb-proposal/network/network-org.css";
import "@/app/(internal)/test/proposal-swarm/proposal-swarm.css";
// The keynote's own order: the talk welded to the eras, the swarm after it.
import "./keynote-template-alpha.css";
// No equilibrium sheet: the talk opens hero → About (ADR-156 U2).
// Theme sheet LAST of the composition sheets (ADR-058).
import "@/components/landing/v7/theme.css";
// The instruments after it, exactly as `/` and the arcs route do; without it
// the settings cluster falls into flow at the foot of the document (ADR-093).
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
// The footer's own sheet (ADR-127): every route that mounts the close.
import "@/components/landing/v7/site-footer/site-footer.css";

export const metadata: Metadata = {
  title: `${KEYNOTE_ARC.meta.title} — Thoughtform`,
  description: KEYNOTE_ARC.meta.description,
  // A link handed to a room, like every page under /arcs.
  robots: { index: false, follow: false },
};

/**
 * /arcs/thoughtform/keynote-template-alpha — the keynote template (ADR-159),
 * cut from the UX meetup talk of 15 October 2026 (ADR-156) the day after
 * it was given. The Ghent page stays as the room saw it; this is the one
 * the next talks are cut from.
 *
 * v3's page with the record swapped, as the talk and Suri's lunch and learn
 * are (ADR-147): the same corridor half, its intro from the SAME record
 * (`WORKSHOP_INTRO`, through the same seams), with the talk's own hero, and
 * the keynote's own arc after the eras.
 *
 *   hero → about → the eras → THE TALK (#workshop, fifteen beats)
 *        → THE SWARM (#kta-swarm: AI capability your teams own · Navigate,
 *          encode, build · Marketing first, then every team)
 *        → CORRIDOR (thesis · Navigate/Encode/Build · epilogue)
 *        → the proof stack (#services, no card ring) → contact
 *
 * ⚠ THE SWARM SITS AFTER THE TALK (owner, 2026-10-16). On the Ghent page it
 * stood between the eras and the wake-up call (ADR-156 U10) and read as
 * random there; here it is the picture under the talk's last line and the
 * bridge to the Arc, which stays at the end ("the arc that we have on our
 * homepage, I still want it. Let's keep it at the end").
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

export default async function KeynoteTemplateAlphaPage() {
  const { bodyHtml: protoHtml, bodyClass } = getThoughtformWorkshopContent({
    removeStations: WORKSHOP_REMOVED_STATIONS,
    corridorMountId: CORRIDOR_MOUNT_ID,
  });
  // v3's intro (ADR-143 U3, U6) with the talk's own hero written over the
  // prototype's and the About from the record; no equilibrium; the talk
  // moved before the corridor (ADR-156 U2) and the swarm slotted after it.
  const bodyHtml = insertSwarmBeforeCorridor(
    moveTalkBeforeCorridor(
      replaceAboutBio(replaceHeroCopy(protoHtml, KEYNOTE_HERO), WORKSHOP_INTRO.about),
      CORRIDOR_MOUNT_ID
    ),
    CORRIDOR_MOUNT_ID
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
          claims, the lit card), which this cut shares (ADR-141 U1);
          `data-tw-order="talk-first"` the talk's own order (ADR-156 U2). */}
      <div className="tw-root" data-tw-cut="v3" data-tw-order="talk-first">
        <LandingPage
          bodyHtml={bodyHtml}
          bodyClass={bodyClass}
          celestialSlots={celestialSlots}
          corridorText={corridorText}
          corridorMountId={CORRIDOR_MOUNT_ID}
          navItems={KEYNOTE_NAV_ITEMS}
          journey={KEYNOTE_JOURNEY}
        />
      </div>
      {/* After the wrapper, so its effects run once the parsed body is
          committed; a sibling of LandingPage for the reason it documents. */}
      <KeynotePortals />
    </>
  );
}
