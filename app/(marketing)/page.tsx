import type { Metadata } from "next";
import { extractV7Text, getV7Content } from "@/lib/v7-parse";
import { LandingPage } from "@/components/landing/v7";
import { getCelestialSlots } from "@/lib/celestial/queries";
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
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
const CORRIDOR_REPLACED_STATIONS = [
  "definition",
  "missing-layer",
  "intelligence-layer",
  // Legacy normal-flow Navigate / Encode / Build flywheel block.
  // The home-v2 corridor now owns this sequence.
  "approach",
] as const;
const CORRIDOR_MOUNT_ID = "home-corridor-mount";

export default async function Home() {
  const { bodyHtml, bodyClass } = getV7Content({
    removeStations: CORRIDOR_REPLACED_STATIONS,
    corridorMountId: CORRIDOR_MOUNT_ID,
  });
  const corridorText = extractV7Text();
  const celestialSlots = await getCelestialSlots();

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
