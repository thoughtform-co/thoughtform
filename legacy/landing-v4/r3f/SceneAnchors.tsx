"use client";

import { useFrame } from "@react-three/fiber";
import { DEFAULT_SCENE_ANCHORS, useParticleScene } from "@/lib/contexts/ParticleSceneContext";
import { getV4TransitionBand, V4_SCENE_THRESHOLDS } from "@/lib/v4/timeline";
import {
  CONTINUUM_WORLD_Y,
  CONTINUUM_WORLD_Z,
  CONTINUUM_DIAMOND_WORLD_X,
} from "./ContinuumSpectrumField";

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(value: number) {
  const clamped = clamp01(value);
  return clamped * clamped * (3 - 2 * clamped);
}

function windowStrength(
  progress: number,
  start: number,
  peakStart: number,
  peakEnd: number,
  end: number
) {
  const fadeIn = clamp01((progress - start) / Math.max(0.0001, peakStart - start));
  const fadeOut = clamp01((end - progress) / Math.max(0.0001, end - peakEnd));
  return smoothstep(Math.min(fadeIn, fadeOut));
}

export function SceneAnchors() {
  const { anchorsRef, scrollRef, transitionRef } = useParticleScene();

  useFrame((state) => {
    const progress = scrollRef.current?.progress ?? 0;
    const time = state.clock.elapsedTime;
    const anchors = anchorsRef.current;
    const transition = transitionRef.current;

    if (!anchors || !transition) return;

    const definitionStrength = windowStrength(progress, 0.05, 0.11, 0.24, 0.42);
    const continuumStrength = windowStrength(progress, 0.14, 0.22, 0.56, 0.78);
    const servicesStrength = windowStrength(progress, 0.48, 0.58, 0.84, 0.96);
    const ctaStrength = windowStrength(progress, 0.08, 0.12, 0.22, 0.34);
    const contactStrength = smoothstep(clamp01((progress - 0.84) / 0.14));

    anchors.definitionSurface = {
      ...DEFAULT_SCENE_ANCHORS.definitionSurface,
      x: -240 + Math.sin(time * 0.24) * 18,
      y: 46 + Math.sin(time * 0.42) * 10,
      z: -160 + Math.cos(time * 0.18) * 22,
      visible: definitionStrength > 0.02,
      strength: definitionStrength,
      scale: 0.92 + definitionStrength * 0.16,
    };
    anchors.continuumRail = {
      ...DEFAULT_SCENE_ANCHORS.continuumRail,
      x: Math.sin(time * 0.2) * 24,
      y: CONTINUUM_WORLD_Y - 12 + Math.sin(time * 0.36) * 6,
      z: CONTINUUM_WORLD_Z + Math.cos(time * 0.18) * 18,
      visible: continuumStrength > 0.02,
      strength: continuumStrength,
      scale: 0.96 + continuumStrength * 0.12,
    };

    const cBaseZ = CONTINUUM_WORLD_Z + Math.cos(time * 0.18) * 12;
    const cDrift = Math.sin(time * 0.36) * 2;
    const cRailY = CONTINUUM_WORLD_Y + cDrift;

    anchors.continuumHeadline = {
      ...DEFAULT_SCENE_ANCHORS.continuumHeadline,
      x: CONTINUUM_DIAMOND_WORLD_X[1] + Math.sin(time * 0.16) * 6,
      y: cRailY,
      z: cBaseZ,
      visible: continuumStrength > 0.02,
      strength: continuumStrength,
      scale: 0.96 + continuumStrength * 0.1,
    };
    anchors.continuumToolNode = {
      ...DEFAULT_SCENE_ANCHORS.continuumToolNode,
      x: CONTINUUM_DIAMOND_WORLD_X[0] + Math.sin(time * 0.22 + 0.3) * 4,
      y: cRailY,
      z: cBaseZ,
      visible: continuumStrength > 0.02,
      strength: continuumStrength,
      scale: 0.96 + continuumStrength * 0.08,
    };
    anchors.continuumMiddleNode = {
      ...DEFAULT_SCENE_ANCHORS.continuumMiddleNode,
      x: CONTINUUM_DIAMOND_WORLD_X[1] + Math.sin(time * 0.18) * 4,
      y: cRailY,
      z: cBaseZ,
      visible: continuumStrength > 0.02,
      strength: continuumStrength,
      scale: 0.96 + continuumStrength * 0.08,
    };
    anchors.continuumCollaboratorNode = {
      ...DEFAULT_SCENE_ANCHORS.continuumCollaboratorNode,
      x: CONTINUUM_DIAMOND_WORLD_X[2] + Math.sin(time * 0.22 - 0.3) * 4,
      y: cRailY,
      z: cBaseZ,
      visible: continuumStrength > 0.02,
      strength: continuumStrength,
      scale: 0.96 + continuumStrength * 0.08,
    };
    anchors.continuumReadoutStrip = {
      ...DEFAULT_SCENE_ANCHORS.continuumReadoutStrip,
      x: CONTINUUM_DIAMOND_WORLD_X[1] + Math.sin(time * 0.14) * 4,
      y: cRailY,
      z: cBaseZ,
      visible: continuumStrength > 0.02,
      strength: continuumStrength,
      scale: 0.94 + continuumStrength * 0.06,
    };

    const promptT = Math.sin(time * 0.35) * 0.5 + 0.5;
    const promptX =
      CONTINUUM_DIAMOND_WORLD_X[0] +
      promptT * (CONTINUUM_DIAMOND_WORLD_X[2] - CONTINUUM_DIAMOND_WORLD_X[0]);
    anchors.continuumPromptMarker = {
      ...DEFAULT_SCENE_ANCHORS.continuumPromptMarker,
      x: promptX,
      y: cRailY + 4 + Math.sin(time * 0.9) * 2,
      z: cBaseZ,
      visible: continuumStrength > 0.15,
      strength: continuumStrength,
      scale: 0.92 + continuumStrength * 0.12,
    };

    anchors.servicesDeck = {
      ...DEFAULT_SCENE_ANCHORS.servicesDeck,
      x: 250 + Math.sin(time * 0.2 + 1.2) * 18,
      y: -8 + Math.sin(time * 0.34 + 0.7) * 10,
      z: -1620 + Math.cos(time * 0.16 + 0.4) * 24,
      visible: servicesStrength > 0.02,
      strength: servicesStrength,
      scale: 0.96 + servicesStrength * 0.1,
    };
    anchors.ctaCluster = {
      ...DEFAULT_SCENE_ANCHORS.ctaCluster,
      x: -320 + Math.sin(time * 0.28 + 0.5) * 12,
      y: -88 + Math.sin(time * 0.44 + 0.5) * 6,
      z: -120 + Math.cos(time * 0.2) * 18,
      visible: ctaStrength > 0.02,
      strength: ctaStrength,
      scale: 0.92 + ctaStrength * 0.16,
    };
    anchors.contactBeacon = {
      ...DEFAULT_SCENE_ANCHORS.contactBeacon,
      x: Math.sin(time * 0.14) * 30,
      y: 124 + Math.sin(time * 0.3) * 14,
      z: -2520 + Math.cos(time * 0.16) * 30,
      visible: contactStrength > 0.02,
      strength: contactStrength,
      scale: 0.9 + contactStrength * 0.2,
    };

    const band = getV4TransitionBand(progress);
    const serviceDepth = smoothstep(
      clamp01(
        (progress - V4_SCENE_THRESHOLDS.MANIFESTO_END) /
          (V4_SCENE_THRESHOLDS.SERVICES_END - V4_SCENE_THRESHOLDS.MANIFESTO_END)
      )
    );

    transition.active = band.active;
    transition.progress = band.progress;
    transition.haze = band.progress * 0.34 + serviceDepth * 0.08;
    transition.blur = band.progress * 10;
  });

  return null;
}
