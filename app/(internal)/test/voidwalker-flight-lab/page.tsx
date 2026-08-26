import type { Metadata } from "next";

import { extractV7Text, getV7Content } from "@/lib/v7-parse";
import { LandingPage } from "@/components/landing/v7";
import { getCelestialSlotsCached } from "@/lib/celestial/queries";
import { DeferredFlightLabPanel } from "./DeferredFlightLabPanel";

/* MIRROR of the marketing page's stylesheet chain — the lab renders the
   SAME LandingPage, so the same cascade must resolve. Order is
   load-bearing (theme.css last; travel.css after voidwalker.css). */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/home-v2/services/casefile/console/console.css";
import "@/components/landing/home-v2/services/casefile/map/pda/pda.css";
import "@/components/landing/home-v2/about/about-stage.css";
import "@/components/landing/home-v2/voidwalker/voidwalker.css";
import "@/components/landing/home-v2/voidwalker/voidwalker-wire.css";
import "@/components/landing/home-v2/voidwalker/voidwalker-travel.css";
import "@/components/landing/home-v2/voidwalker/character/voidwalker-character.css";
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
import "./flight-lab.css";

export const metadata: Metadata = {
  title: "Voidwalker flight lab · Thoughtform",
  robots: { index: false, follow: false },
};

/**
 * `/test/voidwalker-flight-lab`
 *
 * The ADR-081 flight-grammar lab (Phase 1 of the "flight grammar, feel,
 * and performance" plan). Renders the production landing page with a
 * FlightLabPanel overlay that mutates `voidwalkerFlightConfig`.
 *
 * ⚠ THE ROUTE GROUP IS `(internal)`, which `proxy.ts` blocks in
 * production — the lab is only reachable on `npm run dev`, so the
 * config-override plumbing cannot ship without an operator turning it on.
 *
 * The page pulls the same v7 content, the same corridor text, and the
 * same celestial slots the marketing page does. If it renders differently
 * from the marketing page at production defaults, that IS the bug — the
 * lab must be a window onto production, not a copy of it (the
 * `substrate-lab-fit` precedent).
 */

const CORRIDOR_REPLACED_STATIONS = [
  "definition",
  "missing-layer",
  "intelligence-layer",
  "approach",
  "buildQuote",
  "build",
  "tools",
  "proof",
] as const;
const CORRIDOR_MOUNT_ID = "home-corridor-mount";
const CORRIDOR_RELOCATED_STATIONS = [
  { stationId: "voidwalker" },
  { stationId: "about" },
  { stationId: "services", dropTrailingConnectorSlot: "practice-to-about" },
] as const;

export default async function VoidwalkerFlightLabRoute() {
  const { bodyHtml, bodyClass } = getV7Content({
    removeStations: CORRIDOR_REPLACED_STATIONS,
    relocateStationsToMount: CORRIDOR_RELOCATED_STATIONS,
    corridorMountId: CORRIDOR_MOUNT_ID,
  });
  const corridorText = extractV7Text();
  const celestialSlots = await getCelestialSlotsCached();

  return (
    <>
      <LandingPage
        bodyHtml={bodyHtml}
        bodyClass={bodyClass}
        celestialSlots={celestialSlots}
        corridorText={corridorText}
        corridorMountId={CORRIDOR_MOUNT_ID}
      />
      {/* ⚠ THE PANEL MOUNT IS DEFERRED. The `(internal)` route group's
          auth-gated layout renders `null` on first paint, then reveals
          its children — a Suspense-like "reappear" that re-runs
          `useCorridorMount`'s layout effect and prints a benign dev-only
          "sync unmount while rendering" warning. It affects nothing
          (corridor mounts, tunnel engages, hooks fire), but deferring
          the panel past the initial commit keeps it out of the same
          frame as any panel-driven config write. */}
      <DeferredFlightLabPanel />
    </>
  );
}
