import type { Metadata } from "next";
import { extractV7Text, getV7Content } from "@/lib/v7-parse";
import { LandingPage } from "@/components/landing/v7";
import { getCelestialSlotsCached } from "@/lib/celestial/queries";
import { cardsFor } from "@/lib/musings/cards";
import { listedPosts } from "@/lib/musings/registry";
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/home-v2/services/casefile/console/console.css";
import "@/components/landing/home-v2/services/casefile/map/pda/pda.css";
import "@/components/landing/home-v2/services/proof-stack/proof-stack.css";
import "@/components/landing/home-v2/about/about-stage.css";
// The phone's about BAND (ADR-115) — AFTER about-stage.css and landing.css,
// because it re-seats the authored `.voidwalker` block on the ring rung and
// overrides the ≤960 padding floor and the ADR-113 snap block for `#about`
// (both at the foot of landing.css); BEFORE theme.css like every route sheet.
import "@/components/landing/home-v2/about/about-band.css";
// The site footer (ADR-105) — `#contact` is the page's ending, and since
// ADR-105 U3 a HELD BED the rack scrolls over rather than the corridor's
// cover. BEFORE theme.css like every route sheet, so the light rows
// cascade last.
import "@/components/landing/v7/site-footer/site-footer.css";
// The musings rack (ADR-119) — `#musings`, the writing as a folder you flip,
// and the station that took the corridor's opaque COVER role off `#contact`.
// AFTER landing.css, because it overrides the ≤960 padding floor's input and
// the ADR-113 snap block for its own station; BEFORE theme.css like every
// route sheet.
import "@/components/landing/home-v2/musings/musings.css";
// The through-line (ADR-074) — the section sheet and its drawings' sheet,
// both BEFORE theme.css so the light rows cascade last.
import "@/components/landing/home-v2/voidwalker/voidwalker.css";
import "@/components/landing/home-v2/voidwalker/voidwalker-wire.css";
// The time tunnel's presentation mode (ADR-081) — AFTER voidwalker.css,
// because every rule in it overrides the vertical composition and is
// gated on `data-vw-mode="travel"`.
import "@/components/landing/home-v2/voidwalker/voidwalker-travel.css";
// The hologram composition (ADR-082 U2), which replaced the deleted
// character stage. `.vwh*` — imported in the voidwalker block so it
// composes with the same tokens the timeline uses, and BEFORE theme.css
// like every other route sheet.
import "@/components/landing/home-v2/voidwalker/hologram/voidwalker-hologram.css";
// The D2 "datum" composition (ungated — its comparison flag is deleted,
// ADR-082 U19/U21) — AFTER
// the hologram sheet, because it re-houses the same figure (`.vwh__slot`
// and its masked floor stay that sheet's) inside a different grid and its
// `.vwd__vwh` overrides have to win.
import "@/components/landing/home-v2/voidwalker/hologram/voidwalker-datum.css";
// Theme sheet LAST (ADR-058): its `html[data-theme="light"]` cascade has
// to win over every route sheet above. Imported per-route, never from
// globals.css, so admin / astrogation / /test/* stay dark unconditionally.
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
// handoff-lab.css intentionally NOT imported here: the cover-plane
// sweep was retired from production (ADR-021 — the live corridor-exit
// seam is the zoom-dissipate), and the /test/handoff-* lab routes
// import that stylesheet themselves.

export const metadata: Metadata = {
  title: "Thoughtform — Navigate Intelligence",
  description:
    "Thoughtform pioneers intuitive human-AI collaboration. We teach teams how to navigate AI for creative and strategic work.",
};

// The Thoughtform / Diagnostic / Intelligence-layer stations are
// replaced on the production home page by the world-owned 3D depth
// corridor (ADR-018, originally prototyped at /test/home-v2). The
// stations are stripped from the parsed v7 prototype HTML and
// replaced with a single mount placeholder div; LandingPage mounts
// the `HomeCorridor` shell into that node. The corridor's copy is
// extracted directly from the prototype HTML so the source of truth
// for that text remains the v7 prototype file.
//
// `buildQuote` is also stripped (ADR-021): the corridor-exit handoff
// no longer mounts an embedded "Make the layer useful" cover sweep
// over the docked sphere. The post-corridor seam is now a
// zoom-dissipate that resolves into the Services section, which is
// relocated to directly follow the corridor mount placeholder.
const CORRIDOR_REPLACED_STATIONS = [
  "definition",
  "missing-layer",
  "intelligence-layer",
  // Legacy normal-flow Navigate / Encode / Build flywheel block.
  // The home-v2 corridor now owns this sequence.
  "approach",
  // Retired "Make the layer useful" axiom cover (ADR-021). The
  // corridor's epilogue already paints the labs/billions beat, and
  // the practical answer ("Three ways to bring the practice in")
  // lives in #services — which moves up via the relocate spec below.
  "buildQuote",
  // ADR-033: the four production cases live in the Arc's Build-park
  // orbit now (click-armed via the corridor CTA). Their two standalone
  // surfaces retire: the #build editorial slides and the #tools V2
  // console stack were the same four cases twice, and the tools stack
  // broke the services → bio funnel.
  "build",
  "tools",
  // ADR-056: the client case moved to the TOP of #services as an
  // interactive casefile over the parked brandmark — the evidence now
  // answers the corridor epilogue's claim BEFORE the offer instead of
  // four stations after it. Listing it here also strips every
  // `href="#proof"` anchor, which is why the hero and intelligence-layer
  // CTAs were retargeted to #services first.
  "proof",
  // ⚠ ADR-105: `#practice` was an EMPTY breather — its only child (`approach`)
  // is stripped above, so what survived was a section shell whose one job was
  // to be the opaque cover that ends the corridor ambient. A blank panel
  // sliding over the era stage is what the owner read as wrong, and the
  // FOOTER (`#contact`) takes the cover role now: `home-v2.css` and
  // `useCorridorExitScroll` both name it, in the same commit (ADR-030 §6).
  // Stripping it here is also what rewrites any `href="#practice"` anchor —
  // except `HudNav`'s, which is hardcoded in React and had to be deleted by
  // hand (that file's own comment warns about exactly this).
  "practice",
] as const;
const CORRIDOR_MOUNT_ID = "home-corridor-mount";

// Sections that move out of their authored source position and into
// the slot immediately after the corridor mount placeholder (ADR-021,
// production corridor-exit reorder). The Services connector slot
// (`practice-to-about`) trailed #services in the prototype; it would
// be left orphaned at the seam if it stayed put, so it travels with
// the move and is dropped at the same time (the new corridor-exit
// seam owns the visual bridge, no celestial connector required).
//
// Specs run in ARRAY ORDER and each inserts immediately after the
// mount, so the LAST spec lands closest to the mount. voidwalker first,
// about second, services third ⇒ mount → #services → #about →
// #voidwalker → #practice → #contact — the ADR-033 funnel as amended
// by ADR-056 and ADR-074: the corridor exits into services, whose
// runway opens with the client casefile (the evidence) before the
// offer; the bio follows; then the through-line (#voidwalker, the
// career timeline), which is the OPAQUE COVER that ends the ambient
// hold (the role #practice held under ADR-056). #practice survives as
// an empty breather before #contact.
const CORRIDOR_RELOCATED_STATIONS = [
  { stationId: "voidwalker" },
  { stationId: "about" },
  { stationId: "services", dropTrailingConnectorSlot: "practice-to-about" },
] as const;

export default async function Home() {
  const { bodyHtml, bodyClass } = getV7Content({
    removeStations: CORRIDOR_REPLACED_STATIONS,
    relocateStationsToMount: CORRIDOR_RELOCATED_STATIONS,
    corridorMountId: CORRIDOR_MOUNT_ID,
  });
  const corridorText = extractV7Text();
  const celestialSlots = await getCelestialSlotsCached();
  /* ADR-119: the rack's record, read on the server and projected before it
     crosses into a client tree. ⚠ `cardsFor` is what leaves `body` — every
     post's whole MDX source — out of the landing's payload; `listedPosts`
     shows drafts in development and published posts in production, which is
     the same window `/musings` lists. ⚠ AND `content/musings/` IS OPAQUE TO
     NEXT'S TRACER: `next.config.mjs` must name THIS route under
     `outputFileTracingIncludes`, or the landing works in dev and 500s on
     Vercel (the trap `lib/musings/registry.ts`'s own header records). */
  const musings = cardsFor(listedPosts());

  return (
    <>
      {/* The hero key visual's preload moved to `app/layout.tsx` (ADR-058
          Update 2). There are two plates now — dark AVIF, light WebP — and
          a static link here would always fetch the dark one, because the
          preload scanner runs before the theme is known. See
          `lib/theme/heroPreload.ts`. */}
      <LandingPage
        bodyHtml={bodyHtml}
        bodyClass={bodyClass}
        celestialSlots={celestialSlots}
        corridorText={corridorText}
        corridorMountId={CORRIDOR_MOUNT_ID}
        musings={musings}
      />
    </>
  );
}
