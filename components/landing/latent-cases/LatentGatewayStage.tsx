"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { GatewayTravelOptions } from "@/components/gateway/ThreeGateway";
import { DEFAULT_GATEWAY, type GatewayConfig } from "@/lib/particle-config";

const ThreeGateway = dynamic(
  () => import("@/components/gateway/ThreeGateway").then((m) => m.ThreeGateway),
  { ssr: false }
);

// Frontal latent wormhole: straight tunnel, no hero tilt, short camera travel.
const LATENT_GATEWAY_CONFIG: GatewayConfig = {
  ...DEFAULT_GATEWAY,
  positionX: 0,
  positionY: 0,
  rotationY: 0,
  tunnelCurve: 0,
  tunnelDepth: 0.72,
  scale: 1.52,
  density: 1.78,
  shape: "circle",
};

const LATENT_TRAVEL: GatewayTravelOptions = {
  cameraZMax: 52,
  fadeStart: 0.76,
  fadeEnd: 0.995,
  rotationX: 0,
  rotationY: 0,
  verticalInset: 0,
  lookAhead: 11,
};

interface LatentGatewayStageProps {
  /** 0..1 — full scroll range through the wormhole (maps to ThreeGateway scrollProgress) */
  tunnelScroll: number;
  /** Subtle CSS scale only; primary motion is WebGL camera */
  scale: number;
  /** 0..1 — wrapper opacity for handoff to cards / topology */
  opacity: number;
}

/**
 * Wraps ThreeGateway in a transformed container. CSS `scale` is kept subtle;
 * `tunnelScroll` drives the flying camera through a frontal, centered portal.
 */
export function LatentGatewayStage({ tunnelScroll, scale, opacity }: LatentGatewayStageProps) {
  const config = useMemo(() => LATENT_GATEWAY_CONFIG, []);
  const travel = useMemo(() => LATENT_TRAVEL, []);
  const scroll = Math.max(0, Math.min(1, tunnelScroll));

  return (
    <div
      className="latent-gateway-stage"
      style={{
        transform: `scale(${scale.toFixed(3)})`,
        opacity: opacity.toFixed(3),
      }}
      aria-hidden="true"
    >
      <ThreeGateway
        scrollProgress={scroll}
        config={config}
        travel={travel}
        hideAfter={10}
        layerZIndex={1}
      />
    </div>
  );
}
