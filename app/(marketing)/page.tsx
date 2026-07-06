import type { Metadata } from "next";
import { extractV7Text, getV7Content } from "@/lib/v7-parse";
import { LandingPage } from "@/components/landing/v7";
import { getCelestialSlotsCached } from "@/lib/celestial/queries";
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "@/components/landing/home-v2/handoff-lab/handoff-lab.css";

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
] as const;
const CORRIDOR_MOUNT_ID = "home-corridor-mount";

// Sections that move out of their authored source position and into
// the slot immediately after the corridor mount placeholder (ADR-021,
// production corridor-exit reorder). The Services connector slot
// (`practice-to-about`) trailed #services in the prototype; it would
// be left orphaned at the seam if it stayed put, so it travels with
// the move and is dropped at the same time (the new corridor-exit
// seam owns the visual bridge, no celestial connector required).
const CORRIDOR_RELOCATED_STATIONS = [
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

  return (
    <LandingPage
      bodyHtml={bodyHtml}
      bodyClass={bodyClass}
      celestialSlots={celestialSlots}
      corridorText={corridorText}
      corridorMountId={CORRIDOR_MOUNT_ID}
    />
  );
}
