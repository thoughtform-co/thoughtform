"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import type { Camera } from "three";

export interface SceneScrollState {
  progress: number;
  z: number;
}

export interface ScenePhaseState {
  section: string;
  progress: number;
}

export interface SceneDimensions {
  width: number;
  height: number;
}

export type ParticleSceneAnchorId =
  | "definitionSurface"
  | "continuumRail"
  | "continuumHeadline"
  | "continuumToolNode"
  | "continuumMiddleNode"
  | "continuumCollaboratorNode"
  | "continuumReadoutStrip"
  | "continuumPromptMarker"
  | "servicesDeck"
  | "ctaCluster"
  | "contactBeacon";

export interface SceneAnchorState {
  x: number;
  y: number;
  z: number;
  visible: boolean;
  strength?: number;
  scale?: number;
}

export interface SceneTransitionState {
  active: boolean;
  progress: number;
  haze: number;
  blur: number;
}

export const DEFAULT_SCENE_TRANSITION: SceneTransitionState = {
  active: false,
  progress: 0,
  haze: 0,
  blur: 0,
};

export const DEFAULT_SCENE_ANCHORS: Record<ParticleSceneAnchorId, SceneAnchorState> = {
  definitionSurface: { x: -220, y: 36, z: -220, visible: false, strength: 0, scale: 1 },
  continuumRail: { x: 0, y: 60, z: -900, visible: false, strength: 0, scale: 1 },
  continuumHeadline: { x: 0, y: 95, z: -900, visible: false, strength: 0, scale: 1 },
  continuumToolNode: { x: -270, y: 60, z: -900, visible: false, strength: 0, scale: 1 },
  continuumMiddleNode: { x: 0, y: 60, z: -900, visible: false, strength: 0, scale: 1 },
  continuumCollaboratorNode: { x: 270, y: 60, z: -900, visible: false, strength: 0, scale: 1 },
  continuumReadoutStrip: { x: 0, y: 20, z: -900, visible: false, strength: 0, scale: 1 },
  continuumPromptMarker: { x: 0, y: 60, z: -900, visible: false, strength: 0, scale: 1 },
  servicesDeck: { x: 260, y: 10, z: -1600, visible: false, strength: 0, scale: 1 },
  ctaCluster: { x: -320, y: -82, z: -160, visible: false, strength: 0, scale: 1 },
  contactBeacon: { x: 0, y: 116, z: -2550, visible: false, strength: 0, scale: 1 },
};

export interface ParticleSceneState {
  cameraRef: MutableRefObject<Camera | null>;
  particlesPositionsRef: MutableRefObject<Float32Array | null>;
  scrollRef: MutableRefObject<SceneScrollState>;
  dimensionsRef: MutableRefObject<SceneDimensions>;
  phaseRef: MutableRefObject<ScenePhaseState>;
  anchorsRef: MutableRefObject<Record<ParticleSceneAnchorId, SceneAnchorState>>;
  transitionRef: MutableRefObject<SceneTransitionState>;
}

const ParticleSceneContext = createContext<ParticleSceneState | null>(null);

export function ParticleSceneProvider({ children }: { children: ReactNode }) {
  const cameraRef = useRef<Camera | null>(null);
  const particlesPositionsRef = useRef<Float32Array | null>(null);
  const scrollRef = useRef<SceneScrollState>({ progress: 0, z: 0 });
  const dimensionsRef = useRef<SceneDimensions>({ width: 0, height: 0 });
  const phaseRef = useRef<ScenePhaseState>({ section: "hero", progress: 0 });
  const anchorsRef = useRef<Record<ParticleSceneAnchorId, SceneAnchorState>>({
    ...DEFAULT_SCENE_ANCHORS,
  });
  const transitionRef = useRef<SceneTransitionState>({ ...DEFAULT_SCENE_TRANSITION });

  const value = useMemo<ParticleSceneState>(
    () => ({
      cameraRef,
      particlesPositionsRef,
      scrollRef,
      dimensionsRef,
      phaseRef,
      anchorsRef,
      transitionRef,
    }),
    []
  );

  return <ParticleSceneContext.Provider value={value}>{children}</ParticleSceneContext.Provider>;
}

export function useParticleScene(): ParticleSceneState {
  const ctx = useContext(ParticleSceneContext);
  if (!ctx) {
    throw new Error("useParticleScene must be used within <ParticleSceneProvider>");
  }
  return ctx;
}

export function useOptionalParticleScene(): ParticleSceneState | null {
  return useContext(ParticleSceneContext);
}
