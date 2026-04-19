import { getV4ScenePhase, V4_SCENE_THRESHOLDS } from "@/lib/v4/timeline";

export const PHASE_THRESHOLDS = {
  HERO_END: V4_SCENE_THRESHOLDS.HERO_END,
  DEFINITION_END: V4_SCENE_THRESHOLDS.DEFINITION_END,
  MANIFESTO_END: V4_SCENE_THRESHOLDS.MANIFESTO_END,
  SERVICES_END: V4_SCENE_THRESHOLDS.SERVICES_END,
} as const;

export const SCENE_DEPTH = 3000;

export interface Phase {
  section: "hero" | "definition" | "manifesto" | "services" | "contact";
  progress: number;
}

export function getPhaseAtProgress(progress: number): Phase {
  return getV4ScenePhase(progress);
}
