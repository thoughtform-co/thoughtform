import { getCase } from "@/lib/cases/registry";

import { MapPhoneLabShell } from "./MapPhoneLabShell";

/* The production sheet chain, in production order (the proof-card head lab's
   own list): `landing.css` first for the @font-face rules and the phone's
   chrome tokens, the stack's sheets, `theme.css` last. The lab's sheet after
   them scopes to `.mpl-*` and to the pile's slot positioning alone. */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/home-v2/services/casefile/console/console.css";
import "@/components/landing/home-v2/services/casefile/map/pda/pda.css";
import "@/components/landing/home-v2/services/proof-stack/proof-stack.css";
import "@/components/landing/v7/theme.css";

import "./map-phone-lab.css";

/**
 * The lab draws from the LIVE record, never a fixture (the imlab law): the
 * map card's own visual on the Loop casefile.
 */
export default async function MapPhoneLabRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (k: string) => {
    const x = sp[k];
    return Array.isArray(x) ? x[0] : x;
  };
  const loop = getCase("loop-earplugs");
  const visual = loop?.casefile.tracks.find((t) => t.id === "ai-transformation")?.visual;
  if (!visual || visual.kind !== "intelligence-map") {
    return (
      <p style={{ padding: 40, fontFamily: "monospace" }}>No intelligence-map track on record.</p>
    );
  }
  return (
    <MapPhoneLabShell
      record={{
        shapes: visual.shapes,
        districts: visual.districts,
        works: visual.works,
        skills: visual.skills ?? [],
      }}
      query={{
        solo: one("solo"),
        v: one("v"),
        r: one("r"),
        preset: one("preset"),
        theme: one("theme"),
        sel: one("sel"),
      }}
    />
  );
}
