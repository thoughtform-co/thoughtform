export const V4_TRANSITIONS = {
  HERO_END_DESKTOP: 0,
  DEF_START_DESKTOP: 0.12,
  HERO_END_MOBILE: 0.06,
  DEF_START_MOBILE: 0.14,
  DEFINITION_TO_MANIFESTO_START: 0.15,
  DEFINITION_TO_MANIFESTO_END: 0.4,
  MANIFESTO_REVEAL_START: 0.35,
  MANIFESTO_REVEAL_END: 0.5,
  SCENE_TRANSITION_THRESHOLD: 0.575,
  SCENE_TRANSITION_BAND: 0.05,
} as const;

export const V4_SCENE_THRESHOLDS = {
  HERO_END: 0.12,
  DEFINITION_END: 0.15,
  MANIFESTO_END: 0.55,
  SERVICES_END: 0.82,
  ABOUT_END: 0.94,
} as const;

export type V4SceneSection = "hero" | "definition" | "manifesto" | "services" | "contact";
export type V4ActiveSection = V4SceneSection | "about";

export interface V4ScenePhase {
  section: V4SceneSection;
  progress: number;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function getV4ScenePhase(progress: number): V4ScenePhase {
  if (progress < V4_SCENE_THRESHOLDS.HERO_END) {
    return {
      section: "hero",
      progress: clamp01(progress / V4_SCENE_THRESHOLDS.HERO_END),
    };
  }

  if (progress < V4_SCENE_THRESHOLDS.DEFINITION_END) {
    const span = V4_SCENE_THRESHOLDS.DEFINITION_END - V4_SCENE_THRESHOLDS.HERO_END;
    return {
      section: "definition",
      progress: clamp01((progress - V4_SCENE_THRESHOLDS.HERO_END) / span),
    };
  }

  if (progress < V4_SCENE_THRESHOLDS.MANIFESTO_END) {
    const span = V4_SCENE_THRESHOLDS.MANIFESTO_END - V4_SCENE_THRESHOLDS.DEFINITION_END;
    return {
      section: "manifesto",
      progress: clamp01((progress - V4_SCENE_THRESHOLDS.DEFINITION_END) / span),
    };
  }

  if (progress < V4_SCENE_THRESHOLDS.SERVICES_END) {
    const span = V4_SCENE_THRESHOLDS.SERVICES_END - V4_SCENE_THRESHOLDS.MANIFESTO_END;
    return {
      section: "services",
      progress: clamp01((progress - V4_SCENE_THRESHOLDS.MANIFESTO_END) / span),
    };
  }

  return {
    section: "contact",
    progress: clamp01(
      (progress - V4_SCENE_THRESHOLDS.SERVICES_END) / (1 - V4_SCENE_THRESHOLDS.SERVICES_END)
    ),
  };
}

export function getV4ActiveSection(
  progress: number,
  servicesTransitionProgress = 0
): V4ActiveSection {
  if (progress < 0.08) return "hero";
  if (progress < V4_SCENE_THRESHOLDS.DEFINITION_END) return "definition";
  if (progress < V4_SCENE_THRESHOLDS.MANIFESTO_END) return "manifesto";
  if (progress < V4_SCENE_THRESHOLDS.SERVICES_END) {
    return servicesTransitionProgress > 0.02 ? "services" : "manifesto";
  }
  if (progress < V4_SCENE_THRESHOLDS.ABOUT_END) return "about";
  return "contact";
}

export interface V4TransitionBandState {
  active: boolean;
  progress: number;
  leading: number;
  trailing: number;
}

export function getV4TransitionBand(
  progress: number,
  threshold = V4_TRANSITIONS.SCENE_TRANSITION_THRESHOLD,
  band = V4_TRANSITIONS.SCENE_TRANSITION_BAND
): V4TransitionBandState {
  const start = threshold - band;
  const end = threshold + band;
  const normalized = clamp01((progress - start) / (end - start));

  return {
    active: progress >= start && progress <= end,
    progress: normalized,
    leading: clamp01(normalized * 1.6),
    trailing: clamp01((1 - normalized) * 1.6),
  };
}
