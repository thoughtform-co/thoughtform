"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  type RefObject,
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

export interface ParticleSceneState {
  cameraRef: RefObject<Camera | null>;
  particlesPositionsRef: RefObject<Float32Array | null>;
  scrollRef: RefObject<SceneScrollState>;
  dimensionsRef: RefObject<SceneDimensions>;
  phaseRef: RefObject<ScenePhaseState>;
}

const ParticleSceneContext = createContext<ParticleSceneState | null>(null);

export function ParticleSceneProvider({ children }: { children: ReactNode }) {
  const cameraRef = useRef<Camera | null>(null);
  const particlesPositionsRef = useRef<Float32Array | null>(null);
  const scrollRef = useRef<SceneScrollState>({ progress: 0, z: 0 });
  const dimensionsRef = useRef<SceneDimensions>({ width: 0, height: 0 });
  const phaseRef = useRef<ScenePhaseState>({ section: "hero", progress: 0 });

  const value = useMemo<ParticleSceneState>(
    () => ({
      cameraRef,
      particlesPositionsRef,
      scrollRef,
      dimensionsRef,
      phaseRef,
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
