import { NavigationCockpitV2 } from "@/components/hud";
import { getParticleConfig } from "@/lib/particle-config-server";

export default async function Home() {
  // Fetch particle config server-side for instant render (no flash of defaults)
  const initialParticleConfig = await getParticleConfig();

  return <NavigationCockpitV2 initialParticleConfig={initialParticleConfig} />;
}
