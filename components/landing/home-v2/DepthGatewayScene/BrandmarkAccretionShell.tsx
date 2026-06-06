"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getBrandmarkAccretionLayers, getBrandmarkWorldPosition } from "./sceneGeom";
import { ShellSources } from "./shell/ShellSources";
import { ShellSubstrate } from "./shell/ShellSubstrate";
import { ShellSurfaces } from "./shell/ShellSurfaces";

/**
 * BrandmarkAccretionShell — the inside-out intelligence-layer shell
 * that accretes around the guiding-star brandmark as it travels the
 * depth corridor (ADR-018; ADR-013 north-star contract: the mark
 * itself never changes, but what surrounds it accretes).
 *
 * Three layers, each owned by its own reveal envelope from
 * `CORRIDOR_TIMELINE.accretion`, rendered by its own component, and
 * driven directly off the depth store in its own `useFrame`:
 *
 *   - {@link ShellSubstrate} (Navigate adds): abstract BRAIN
 *     artifact — two-hemisphere gold point cloud with sulci
 *     displacement + faint synapse links (2026-06-06 wrap-around
 *     revision, Phase 5). Replaces the prior gold geodesic cage so
 *     the substrate layer of "Navigate the intelligence" reads as
 *     the THING being navigated.
 *   - {@link ShellSources} (Encode adds): solar-system of six
 *     inclined elliptical orbits with revolving source pips.
 *   - {@link ShellSurfaces} (Build adds): outer geodesic skin + port
 *     pip ring (dawn) — headless surfaces wrapping the layer.
 *
 * All three persist after they emerge so the shell is fully
 * assembled at the Build landing and stays present as the brandmark
 * hands off to the `TravelingBrandmarkCloud` (substrate sphere
 * morph) at the centre.
 *
 * This component owns ONLY the world position: per frame the parent
 * group is moved to `getBrandmarkWorldPosition(paintProgress)` so the
 * whole shell follows the mark through Lead mode. Each sub-layer
 * reads the depth store + accretion helper inside its own useFrame
 * (mirrors the established pattern from `DiagnosticOrbitGate`,
 * `IntelligenceGate`, etc.) and applies geometric scale-emerge —
 * brandmark Principle 4 (`brandmark-choreography` skill): decorations
 * emerge geometrically via scale, NEVER via opacity.
 *
 * Mobile / reduced-motion: the shell renders so the inside-out
 * accretion story holds; sub-layers damp autonomous motion (spin /
 * pip revolution) when `reducedMotion` is true.
 */
export function BrandmarkAccretionShell() {
  const tier = useDeviceTier();
  const isMobile = tier === "mobile";

  const shellGroupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const shell = shellGroupRef.current;
    if (!shell) return;

    const transform = useDepthGatewayStore.getState().transform;
    const { paintProgress, active, armed } = transform;
    const painting = active || armed;

    if (!painting) {
      shell.visible = false;
      return;
    }

    shell.visible = true;
    const [bx, by, bz] = getBrandmarkWorldPosition(paintProgress);
    shell.position.set(bx, by, bz);
  });

  return (
    <group ref={shellGroupRef} visible={false}>
      <ShellSubstrate layerKey="substrate" reducedMotion={isMobile} />
      <ShellSources layerKey="sources" reducedMotion={isMobile} />
      <ShellSurfaces layerKey="surfaces" reducedMotion={isMobile} />
    </group>
  );
}
