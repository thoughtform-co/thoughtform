"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getBrandmarkAccretionLayers, getBrandmarkWorldPosition } from "./sceneGeom";
import { ShellOrbits } from "./shell/ShellOrbits";
import { ShellStack } from "./shell/ShellStack";
import { ShellSubstrate } from "./shell/ShellSubstrate";

/**
 * BrandmarkAccretionShell — the inside-out intelligence layer that
 * accretes around the guiding-star brandmark as it travels the
 * depth corridor (ADR-018).
 *
 * Three layers, each owned by its own reveal envelope from
 * `CORRIDOR_TIMELINE.accretion`:
 *
 *   - {@link ShellSubstrate} (Navigate): migrated flat compass layer boundary.
 *   - {@link ShellOrbits} (Encode): judgment orbits circling the layer.
 *   - {@link ShellStack} (Build): sources + surfaces dock the layer
 *     into the full stack (funnel composition from the lab FUNNEL
 *     variant — no outer geodesic cage).
 *
 * All three persist after they emerge so the layer is fully assembled
 * at the Build landing around the persistent DOM brandmark.
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
      <ShellOrbits layerKey="orbits" reducedMotion={isMobile} />
      <ShellStack layerKey="stack" reducedMotion={isMobile} />
    </group>
  );
}
