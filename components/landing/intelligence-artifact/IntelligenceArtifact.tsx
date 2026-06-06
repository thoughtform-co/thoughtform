"use client";

/**
 * IntelligenceArtifact — thin dispatcher around the artifact variants.
 * Each variant is its own R3F scene graph; this component picks one
 * based on the `variant` prop so the lab page's
 * `IntelligenceArtifactScene` can switch between them without
 * remounting the surrounding chrome.
 *
 * Variant implementations:
 *
 *   - `armillary`     -> `ArmillaryDeck`        : deck + pylons + sphere.
 *   - `shell`         -> `NestedShellSphere`    : nested concentric shells.
 *   - `orbital`       -> `OrbitalSystem`        : 3 tilted orbital planes.
 *   - `strata`        -> `Strata`               : vertically stacked slabs.
 *   - `funnel`        -> `Funnel`               : horizontal flow pipeline.
 *   - `constellation` -> `Constellation`        : star-map navigation chart.
 *   - `aperture`      -> `Aperture`             : geodesic sphere with
 *                                                 highlighted interface
 *                                                 windows + orbiting sources.
 *
 * Corridor family (Home composition, pluggable outer shell):
 *
 *   - `corridor-geodesic` : current home shell (baseline).
 *   - `corridor-rings`    : armillary gimbal of great-circle rings.
 *   - `corridor-panels`   : tangent surface plates + faint equator.
 *   - `corridor-contour`  : latitude contour sphere.
 *   - `corridor-gem`      : crystalline bipyramid.
 *
 * All variants share `SubstrateBrandmark` for the central nucleus
 * so the brandmark colour + depth are identical across forms.
 */

import { Aperture } from "./Aperture";
import { ArmillaryDeck } from "./ArmillaryDeck";
import { Constellation } from "./Constellation";
import { Funnel } from "./Funnel";
import { NestedShellSphere } from "./NestedShellSphere";
import { OrbitalSystem } from "./OrbitalSystem";
import { Strata } from "./Strata";
import { CorridorArtifact } from "./corridor/CorridorArtifact";
import {
  OuterArmillary,
  OuterContour,
  OuterGem,
  OuterGeodesic,
  OuterPanels,
} from "./corridor/outerShells";
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
    case "strata":
      return <Strata progress={progress} reducedMotion={reducedMotion} />;
    case "funnel":
      return <Funnel progress={progress} reducedMotion={reducedMotion} />;
    case "constellation":
      return <Constellation progress={progress} reducedMotion={reducedMotion} />;
    case "aperture":
      return <Aperture progress={progress} reducedMotion={reducedMotion} />;
    case "corridor-geodesic":
      return (
        <CorridorArtifact
          progress={progress}
          reducedMotion={reducedMotion}
          OuterShell={OuterGeodesic}
        />
      );
    case "corridor-rings":
      return (
        <CorridorArtifact
          progress={progress}
          reducedMotion={reducedMotion}
          OuterShell={OuterArmillary}
        />
      );
    case "corridor-panels":
      return (
        <CorridorArtifact
          progress={progress}
          reducedMotion={reducedMotion}
          OuterShell={OuterPanels}
        />
      );
    case "corridor-contour":
      return (
        <CorridorArtifact
          progress={progress}
          reducedMotion={reducedMotion}
          OuterShell={OuterContour}
        />
      );
    case "corridor-gem":
      return (
        <CorridorArtifact progress={progress} reducedMotion={reducedMotion} OuterShell={OuterGem} />
      );
    case "armillary":
    default:
      return <ArmillaryDeck progress={progress} reducedMotion={reducedMotion} />;
  }
}
