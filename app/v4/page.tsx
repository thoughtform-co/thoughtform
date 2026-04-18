import type { Metadata } from "next";
import { NavigationCockpitV4 } from "./cockpit";
import { getParticleConfig } from "@/lib/particle-config-server";
import "./cockpit/hero-v2.css";
import "./cockpit/tf-brand.css";
import "./cockpit/continuum-spectrum.css";
import "./cockpit/canonical-rail.css";

export const metadata: Metadata = {
  title: "Thoughtform — Navigate Intelligence · v4",
  description:
    "v4 — panels as crystallizations of the latent field. R3F-based particle integration.",
};

export default async function V4Page() {
  const initialParticleConfig = await getParticleConfig();
  return (
    <div className="v4-landing">
      <NavigationCockpitV4 initialParticleConfig={initialParticleConfig} />
    </div>
  );
}
