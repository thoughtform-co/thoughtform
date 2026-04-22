import type { Metadata } from "next";
import { NavigationCockpitV2 } from "@/components/hud";
import { getParticleConfig } from "@/lib/particle-config-server";

export const metadata: Metadata = {
  title: "Thoughtform — Archive (Current Home)",
  robots: { index: false, follow: false },
};

export default async function ArchivedHomePage() {
  const initialParticleConfig = await getParticleConfig();

  return <NavigationCockpitV2 initialParticleConfig={initialParticleConfig} />;
}
