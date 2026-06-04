"use client";

/**
 * IntelligenceArtifact — thin dispatcher around the three artifact
 * variants. Each variant is its own R3F scene graph; this component
 * picks one based on the `variant` prop so the lab page's
 * `IntelligenceArtifactScene` can switch between them without
 * remounting the surrounding chrome.
 *
 * Variant implementations:
 *
 *   - `armillary` -> `ArmillaryDeck`        : deck + pylons + sphere.
 *   - `shell`     -> `NestedShellSphere`    : nested concentric shells.
 *   - `orbital`   -> `OrbitalSystem`        : 3 tilted orbital planes.
 *
 * All three share `SubstrateBrandmark` for the central nucleus so the
 * brandmark colour + depth are identical across forms.
 */

import { ArmillaryDeck } from "./ArmillaryDeck";
import { NestedShellSphere } from "./NestedShellSphere";
import { OrbitalSystem } from "./OrbitalSystem";
import type { ArtifactVariant } from "./artifactGeom";

interface IntelligenceArtifactProps {
  /** Global progress in [0, 1]. Drives every reveal envelope. */
  progress: number;
  /** When true, autonomous motion is damped. */
  reducedMotion?: boolean;
  /** Which structural metaphor to render. */
  variant?: ArtifactVariant;
}

export function IntelligenceArtifact({
  progress,
  reducedMotion = false,
  variant = "armillary",
}: IntelligenceArtifactProps) {
  switch (variant) {
    case "shell":
      return <NestedShellSphere progress={progress} reducedMotion={reducedMotion} />;
    case "orbital":
      return <OrbitalSystem progress={progress} reducedMotion={reducedMotion} />;
    case "armillary":
    default:
      return <ArmillaryDeck progress={progress} reducedMotion={reducedMotion} />;
  }
}
