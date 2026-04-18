"use client";

import type { CSSProperties } from "react";
import {
  type AnchorScreenState,
  useParticleAnchorById,
} from "@/components/hud/r3f/hooks/useParticleAnchor";
import type { ParticleSceneAnchorId } from "@/lib/contexts/ParticleSceneContext";

interface SceneFieldLabelProps {
  anchorId: ParticleSceneAnchorId;
  label: string;
  index: string;
  active: boolean;
  offsetX?: number;
  offsetY?: number;
  tone?: "gold" | "dawn";
}

function getLabelStyle(
  anchor: AnchorScreenState,
  active: boolean,
  offsetX: number,
  offsetY: number
): CSSProperties {
  const opacity = active && anchor.visible ? 1 : 0;

  return {
    left: `${anchor.screenX}px`,
    top: `${anchor.screenY}px`,
    opacity,
    transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${Math.min(
      1.08,
      Math.max(0.86, anchor.scale * 0.92)
    )})`,
    pointerEvents: "none",
  };
}

export function SceneFieldLabel({
  anchorId,
  label,
  index,
  active,
  offsetX = 0,
  offsetY = 0,
  tone = "gold",
}: SceneFieldLabelProps) {
  const anchor = useParticleAnchorById(anchorId);

  return (
    <div
      className={`v4-field-label v4-field-label--${tone}`}
      style={getLabelStyle(anchor, active, offsetX, offsetY)}
    >
      <span className="v4-field-label__line" aria-hidden="true" />
      <span className="v4-field-label__diamond" aria-hidden="true" />
      <span className="v4-field-label__index">{index}</span>
      <span className="v4-field-label__text">{label}</span>
    </div>
  );
}
