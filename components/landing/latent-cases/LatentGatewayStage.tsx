"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { GatewayShape } from "@/lib/particle-config";

const LatentInstrument = dynamic(
  () => import("./LatentInstrument").then((m) => m.LatentInstrument),
  { ssr: false }
);

/** Matches ThreeGateway latent travel: frontal dolly + late fade */
const FADE_START = 0.76;
const FADE_END = 0.995;
const CAMERA_Z_MAX = 52;
const LOOK_AHEAD = 11;

interface LatentGatewayStageProps {
  /** 0..1 — wormhole travel (eased upstream in useLatentCaseScroll) */
  tunnelScroll: number;
  /** Subtle CSS scale */
  scale: number;
  /** 0..1 — wrapper opacity for handoff to cards / topology */
  opacity: number;
  /** Freezes / softens time-based WebGL motion */
  reduceMotion: boolean;
  /** Portal silhouette for `LatentPortalContour` (default `diamond`) */
  shape?: GatewayShape;
}

/**
 * WebGL instrument layer: v1 portal stack + celestial overlay (see LatentInstrument).
 */
export function LatentGatewayStage({
  tunnelScroll,
  scale,
  opacity,
  reduceMotion,
  shape = "diamond",
}: LatentGatewayStageProps) {
  const fade = useMemo(
    () => ({
      fadeStart: FADE_START,
      fadeEnd: FADE_END,
      cameraZMax: CAMERA_Z_MAX,
      lookAhead: LOOK_AHEAD,
    }),
    []
  );
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
      <LatentInstrument
        scrollProgress={scroll}
        reduceMotion={reduceMotion}
        fadeStart={fade.fadeStart}
        fadeEnd={fade.fadeEnd}
        cameraZMax={fade.cameraZMax}
        lookAhead={fade.lookAhead}
        layerZIndex={1}
        shape={shape}
      />
    </div>
  );
}
