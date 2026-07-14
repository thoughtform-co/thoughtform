"use client";

import type { CSSProperties } from "react";
import { LOOP_CASE_STUDIES } from "./caseData";
import { LatentCaseCard } from "./LatentCaseCard";
import { clamp01, lerp, smoothstep } from "@/lib/math";

interface CaseOrbitStageProps {
  activeCaseIndex: number;
  orbitCycle: number;
  /** 0..1 — cards travel from exit plane toward camera / slots */
  caseEntry: number;
  /** 0..1 — side cards fan from stacked plane pose into orbit */
  orbitFanOut: number;
  reduceMotion: boolean;
  narrowViewport: boolean;
}

interface SlotGeometry {
  /** translateX as percent of card width (negative = left) */
  xPercent: number;
  translateZ: number;
  rotateY: number;
  scale: number;
  opacity: number;
  filter: string;
  zIndex: number;
}

// Exit plane: shallow depth so cards read as sitting on the latent dock before
// the centre card advances and sides fan out (orbitFanOut).
const EXIT_ORIGIN: { xPercent: number; translateZ: number; rotateY: number; scale: number } = {
  xPercent: 0,
  translateZ: -240,
  rotateY: 0,
  scale: 0.32,
};

// `clamp01`, `smoothstep`, and `lerp` now come from `@/lib/math`
// (Phase-5 consolidation, 2026-07-14).

function wrapDistance(i: number, active: number, n: number): number {
  let d = i - active;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
}

function geometryForSlot(d: number, reduceMotion: boolean): SlotGeometry {
  if (reduceMotion) {
    return {
      xPercent: 0,
      translateZ: 0,
      rotateY: 0,
      scale: 1,
      opacity: d === 0 ? 1 : 0,
      filter: "none",
      zIndex: d === 0 ? 10 : 1,
    };
  }

  if (d === 0) {
    return {
      xPercent: 0,
      translateZ: 60,
      rotateY: 0,
      scale: 1,
      opacity: 1,
      filter: "none",
      zIndex: 10,
    };
  }
  if (d === -1) {
    return {
      xPercent: -110,
      translateZ: -180,
      rotateY: 42,
      scale: 0.82,
      opacity: 0.7,
      filter: "brightness(0.78)",
      zIndex: 6,
    };
  }
  if (d === 1) {
    return {
      xPercent: 110,
      translateZ: -180,
      rotateY: -42,
      scale: 0.82,
      opacity: 0.7,
      filter: "brightness(0.78)",
      zIndex: 6,
    };
  }
  return {
    xPercent: 0,
    translateZ: -800,
    rotateY: 0,
    scale: 0.5,
    opacity: 0,
    filter: "none",
    zIndex: 1,
  };
}

/** Interpolate plane pose toward final orbit slot as fan-out progresses */
function blendSlotTowardOrbit(
  slot: SlotGeometry,
  fan: number
): { xPercent: number; translateZ: number; rotateY: number; scale: number } {
  const t = smoothstep(0.08, 1, fan);
  return {
    xPercent: lerp(EXIT_ORIGIN.xPercent, slot.xPercent, t),
    translateZ: lerp(EXIT_ORIGIN.translateZ, slot.translateZ, t),
    rotateY: lerp(EXIT_ORIGIN.rotateY, slot.rotateY, t),
    scale: lerp(EXIT_ORIGIN.scale, slot.scale, t),
  };
}

function buildEntryTransform(
  slot: Pick<SlotGeometry, "xPercent" | "translateZ" | "rotateY" | "scale">,
  t: number
): string {
  const x = lerp(EXIT_ORIGIN.xPercent, slot.xPercent, t);
  const z = lerp(EXIT_ORIGIN.translateZ, slot.translateZ, t);
  const rotY = lerp(EXIT_ORIGIN.rotateY, slot.rotateY, t);
  const scale = lerp(EXIT_ORIGIN.scale, slot.scale, t);

  return [
    "translate(-50%, -50%)",
    `translateX(${x.toFixed(2)}%)`,
    `translateZ(${z.toFixed(1)}px)`,
    `rotateY(${rotY.toFixed(2)}deg)`,
    `scale(${scale.toFixed(3)})`,
  ].join(" ");
}

export function CaseOrbitStage({
  activeCaseIndex,
  orbitCycle,
  caseEntry,
  orbitFanOut,
  reduceMotion,
  narrowViewport,
}: CaseOrbitStageProps) {
  const n = LOOP_CASE_STUDIES.length;

  if (caseEntry < 0.001) {
    return null;
  }

  const driftFactor = smoothstep(0.85, 1, caseEntry) * smoothstep(0.2, 1, orbitFanOut);
  const driftDeg = reduceMotion ? 0 : (orbitCycle - 0.5) * 6 * driftFactor;

  return (
    <div
      className="latent-case-showcase__orbit-wrap"
      style={{
        opacity: clamp01(caseEntry * 1.15),
        transform: narrowViewport ? undefined : `rotateY(${driftDeg.toFixed(2)}deg)`,
      }}
    >
      <div className="latent-case-showcase__orbit">
        {LOOP_CASE_STUDIES.map((study, i) => {
          const d = wrapDistance(i, activeCaseIndex, n);
          const isActive = narrowViewport ? i === activeCaseIndex : d === 0;
          const slot = geometryForSlot(d, reduceMotion);
          const inactiveMobile = narrowViewport && i !== activeCaseIndex;

          const stagger = Math.abs(d) * 0.07;
          const cardEntry = clamp01((caseEntry - stagger) / Math.max(0.001, 1 - stagger));

          const sideFan = d === 0 ? 1 : orbitFanOut;
          const slotPose =
            reduceMotion || narrowViewport || d === 0
              ? slot
              : { ...slot, ...blendSlotTowardOrbit(slot, sideFan) };

          const slotOpacity =
            d === 0
              ? lerp(0, slot.opacity, smoothstep(0.04, 0.42, cardEntry))
              : lerp(0, slot.opacity, smoothstep(0.04, 0.42, cardEntry)) *
                smoothstep(0.05, 0.38, orbitFanOut);

          const arrivalBlur = (1 - cardEntry) * 2.8;
          const filter =
            cardEntry < 0.9
              ? `blur(${arrivalBlur.toFixed(2)}px) brightness(${(0.72 + cardEntry * 0.28).toFixed(2)})`
              : slot.filter;

          const cardStyle: CSSProperties = narrowViewport
            ? {}
            : {
                transform: buildEntryTransform(slotPose, cardEntry),
                opacity: slotOpacity,
                filter,
                zIndex: slot.zIndex,
                pointerEvents: isActive && cardEntry > 0.85 ? "auto" : "none",
              };

          return (
            <LatentCaseCard
              key={study.id}
              study={study}
              isActive={isActive && cardEntry > 0.62}
              tabIndex={isActive && cardEntry > 0.85 ? 0 : -1}
              className={inactiveMobile ? "latent-case-card--inactive" : ""}
              style={cardStyle}
            />
          );
        })}
      </div>
    </div>
  );
}
