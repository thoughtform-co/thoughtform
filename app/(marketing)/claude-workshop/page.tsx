import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/v7";
import { getCelestialSlotsCached } from "@/lib/celestial/queries";
import { extractV7Text, getClaudeWorkshopContent } from "@/lib/v7-parse";

import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/home-v2/services/casefile/map/pda/pda.css";
// about-stage.css / continuum-stage.css are deliberately NOT imported:
// this page mounts neither pinned stage (ADR-053 — #about is the static
// voidwalker here, #continuum is removed).
import "./claude-workshop.css";
// Theme sheet LAST (ADR-058) — see the note in (marketing)/page.tsx.
import "@/components/landing/v7/theme.css";

export const metadata: Metadata = {
  title: "Thoughtform — Claude Workshop",
  description:
    "Hands-on Claude workshop. Encode how your team works into a substrate every model, tool, and surface inherits.",
  // OWNER DECISION (ADR-053): this route is currently indexable, like the
  // rest of (marketing). To make it link-only, uncomment:
  // robots: { index: false, follow: false },
};

/**
 * /claude-workshop — the workshop surface as a HOMEPAGE VARIANT (ADR-053).
 *
 * Same LandingPage, same depth corridor, different narrative order:
 *
 *   hero → about → CORRIDOR (thesis · Navigate/Encode/Build · epilogue)
 *        → services (card ring) → contact
 *
 * #about moves up front because a workshop opens by introducing the
 * person running it. Everything else is the production choreography:
 * the corridor's copy comes from `extractV7Text()` — deliberately the
 * PRODUCTION prototype, so the thesis reads identically on both
 * surfaces — and the Navigate/Encode/Build beats, the epilogue signal
 * and the news ticker are intrinsic to the corridor mount.
 *
 * The three homepage behaviours that assume the production station
 * order are neutralized in `claude-workshop.css`, scoped to `.cw-root`.
 */

// Stations the corridor replaces on this route. The mount placeholder is
// injected where the FIRST removed station was — `#definition`, i.e.
// directly after #about — so the authored order already yields
// hero → about → mount → services → contact. No relocation needed
// (contrast the homepage, which moves #services/#about up to the mount).
//
// ⚠ NOT in this list, deliberately:
//   · "approach" — on THIS prototype it is a <div> nested inside
//     #practice. `removeStationsFromBody` walks section ranges then div
//     ranges; a div range nested inside an already-removed section moves
//     the cursor backwards and re-emits the outer section's tail as
//     orphan markup. Removing #practice already subsumes it. (The
//     homepage can list it safely because it keeps #practice.)
//   · "tools" — no such station in this prototype.
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

export default async function ClaudeWorkshopPage() {
  const { bodyHtml, bodyClass } = getClaudeWorkshopContent({
    removeStations: WORKSHOP_REMOVED_STATIONS,
    corridorMountId: CORRIDOR_MOUNT_ID,
  });
  const corridorText = extractV7Text();
  const celestialSlots = await getCelestialSlotsCached();

  return (
    <>
      {/* The hero key visual's preload moved to `app/layout.tsx`, which
          picks the plate by theme (ADR-058 Update 2). This route is in its
          `HERO_ROUTES` list — see `lib/theme/heroPreload.ts`. */}
      <div className="cw-root">
        <LandingPage
          bodyHtml={bodyHtml}
          bodyClass={bodyClass}
          celestialSlots={celestialSlots}
          corridorText={corridorText}
          corridorMountId={CORRIDOR_MOUNT_ID}
        />
      </div>
    </>
  );
}
