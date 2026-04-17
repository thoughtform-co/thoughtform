import type { Metadata } from "next";
import { NavigationCockpitV2 } from "./cockpit";
import { getParticleConfig } from "@/lib/particle-config-server";

export const metadata: Metadata = {
  title: "Thoughtform — Navigate Intelligence · v3",
  description:
    "Forked homepage for iteration — same design as /, evolving toward the v2 information architecture.",
};

export default async function V3Page() {
  const initialParticleConfig = await getParticleConfig();
  return <NavigationCockpitV2 initialParticleConfig={initialParticleConfig} />;
}
