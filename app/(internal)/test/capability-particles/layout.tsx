import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/capability-particles: a new figure for "AI capability your teams
 * own.", in the particle language, one section and no scroll. Three sketches
 * of three different logics, for the owner to pick one (2026-10-15: "a
 * completely new logical artifact with the particle system … something
 * completely different"). Internal only.
 */
export const metadata: Metadata = {
  title: "Capability, in particles",
  robots: { index: false, follow: false },
};

export default function CapabilityParticlesLayout({ children }: { children: ReactNode }) {
  return children;
}
