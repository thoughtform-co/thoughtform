import { IntelligenceArtifactScene } from "@/components/landing/intelligence-artifact";

/**
 * /test/intelligence-artifact â€” internal lab for the intelligence-layer
 * artifact.
 *
 * The artifact is a low-angle topographic deck with a central
 * substrate sphere, concentric polygonal tracks, raised satellite
 * pylons, and inbound source channels. Three semantic layers map onto
 * spatial roles:
 *
 *   - Trusted sources  -> outer perimeter pips + inbound channels.
 *   - Encoded judgment -> central substrate sphere + brandmark cloud.
 *   - Headless surfaces -> raised pylons + endpoint diamonds.
 *
 * Internal-only: production blocks `/test/*` via `proxy.ts`.
 * Iteration is intended to happen here before any landing-page
 * integration.
 */
export default function IntelligenceArtifactRoute() {
  return <IntelligenceArtifactScene />;
}
