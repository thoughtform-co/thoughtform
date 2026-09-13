import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/v7";
import { ThemeLock } from "@/components/landing/v7/ThemeLock";
import { THEME_TOGGLE } from "@/components/landing/v7/themeToggle";
import { getCelestialSlotsCached } from "@/lib/celestial/queries";
import { extractV7Text, getTrinnyLondonContent } from "@/lib/v7-parse";

import { TRINNY_JOURNEY, TRINNY_NAV_ITEMS } from "./journey";
import { TrinnyPortals } from "./TrinnyPortals";

import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/home-v2/services/casefile/console/console.css";
import "@/components/landing/home-v2/services/casefile/map/pda/pda.css";
import "@/components/landing/home-v2/services/proof-stack/proof-stack.css";
// The arcs' sheet (ADR-094 U9): the offer after the configuration is the
// arcs' own section components inside an `.arc-root`, and this is their
// grammar and their light re-derivation. Every rule in it is `.arc-*`-scoped
// but three, none of which this page can match (`#rollout`,
// `html[data-arc-entry]`, and the theme-lock switch rule this route already
// carries). Before the route sheet, so the route can still overrule it.
import "@/components/arcs/arcs.css";
// about-stage.css / continuum-stage.css / voidwalker/*.css are deliberately
// NOT imported: this page mounts no pinned stage (ADR-053 — #about is the
// static voidwalker here, #continuum and #voidwalker are removed).
import "./trinny-london.css";
// Theme sheet LAST of the composition sheets (ADR-058) — see the note in
// (marketing)/page.tsx.
import "@/components/landing/v7/theme.css";
// ⚠ AND THE INSTRUMENTS AFTER IT, exactly as `/` and the arcs route do.
// The sheet declares no `[data-theme]` rules, so its position past theme.css
// is safe — and WITHOUT it the settings cluster loses its fixed overlay, the
// top-left journey row is unpositioned inline content in the corner box, and
// the right rail's telemetry is unstyled. (`/claude-workshop` omits it and
// carries exactly that defect — see ADR-093.)
import "@/components/landing/v7/rail-instruments/rail-instruments.css";

export const metadata: Metadata = {
  title: "Thoughtform — Trinny London",
  description:
    "AI capability built inside the work: adoption, governance, and the tools a team keeps running on its own.",
  // ADR-093: a link handed to one reader, not a page to be found. `noindex`
  // rather than a proxy block, because `(internal)` is for dev routes and a
  // crawler has to FETCH a page to see the directive (the reason
  // `app/robots.ts` does not disallow `/arcs/*` either). It is deliberately
  // ABSENT from `app/sitemap.ts` — a sitemap that lists a noindexed URL is
  // advertising a page it then tells crawlers to drop.
  robots: { index: false, follow: false },
};

/**
 * /trinny-london — a client pitch page as a HOMEPAGE VARIANT (ADR-093).
 *
 * The ADR-053 recipe, a second time: same `LandingPage`, same depth
 * corridor, the workshop's station order —
 *
 *   hero → about → CORRIDOR (thesis · Navigate/Encode/Build · epilogue)
 *        → services (the proof casefile, then the card ring) → contact
 *
 * — with three things that are this route's own:
 *
 *   · its OWN prototype (`landing-trinny-london.html`), so the client copy
 *     this page takes in a later phase cannot reach `/claude-workshop`;
 *   · a LIGHT LOCK (`lib/theme/themeLock.ts`): the pre-paint bootstrap
 *     stamps light before anything paints, the leaf below holds it across a
 *     client-side navigation, and the route sheet hides the switch. The
 *     visitor's stored preference is never written — it is theirs again the
 *     moment they leave;
 *   · its OWN journey clock (`./journey.ts`), because the marks' state is
 *     an index comparison and the production roster carries production
 *     positions with it.
 *
 * The corridor's copy still comes from `extractV7Text()` — deliberately the
 * PRODUCTION prototype, so the thesis reads identically on every surface.
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
const TRINNY_REMOVED_STATIONS = [
  "definition",
  "missing-layer",
  "intelligence-layer",
  "continuum",
  "practice",
  "buildQuote",
  "build",
] as const;
const CORRIDOR_MOUNT_ID = "home-corridor-mount";

export default async function TrinnyLondonPage() {
  const { bodyHtml, bodyClass } = getTrinnyLondonContent({
    removeStations: TRINNY_REMOVED_STATIONS,
    corridorMountId: CORRIDOR_MOUNT_ID,
  });
  const corridorText = extractV7Text();
  const celestialSlots = await getCelestialSlotsCached();

  return (
    <>
      {/* The hero key visual's preload is injected in `app/layout.tsx`,
          which picks the plate by theme (ADR-058 Update 2). This route is
          in its `HERO_ROUTES` list — and being light-locked it can only
          ever paint the light one. */}
      {/* ⚠ A SIBLING of LandingPage, never a child: that component owns a
          `dangerouslySetInnerHTML` body with nested `createRoot`s inside
          it, and a re-render there orphans them. This leaf renders null. */}
      {THEME_TOGGLE && <ThemeLock />}
      <div className="tl-root">
        <LandingPage
          bodyHtml={bodyHtml}
          bodyClass={bodyClass}
          celestialSlots={celestialSlots}
          corridorText={corridorText}
          corridorMountId={CORRIDOR_MOUNT_ID}
          navItems={TRINNY_NAV_ITEMS}
          journey={TRINNY_JOURNEY}
        />
      </div>
      {/* ADR-094: the proof stack's nested root + the ring opt-out. AFTER
          the wrapper, so its effects run once the parsed body is committed;
          a sibling of LandingPage for the same reason ThemeLock is. */}
      <TrinnyPortals />
    </>
  );
}
