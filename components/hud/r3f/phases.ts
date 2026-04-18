export const PHASE_THRESHOLDS = {
  HERO_END: 0.12,
  DEFINITION_END: 0.15,
  MANIFESTO_END: 0.55,
  SERVICES_END: 0.8,
} as const;

export const SCENE_DEPTH = 3000;

export interface Phase {
  section: "hero" | "definition" | "manifesto" | "services" | "contact";
  progress: number;
}

export function getPhaseAtProgress(progress: number): Phase {
  if (progress < PHASE_THRESHOLDS.HERO_END) {
    return {
      section: "hero",
      progress: progress / PHASE_THRESHOLDS.HERO_END,
    };
  }
  if (progress < PHASE_THRESHOLDS.DEFINITION_END) {
    const span = PHASE_THRESHOLDS.DEFINITION_END - PHASE_THRESHOLDS.HERO_END;
    return {
      section: "definition",
      progress: (progress - PHASE_THRESHOLDS.HERO_END) / span,
    };
  }
  if (progress < PHASE_THRESHOLDS.MANIFESTO_END) {
    const span = PHASE_THRESHOLDS.MANIFESTO_END - PHASE_THRESHOLDS.DEFINITION_END;
    return {
      section: "manifesto",
      progress: (progress - PHASE_THRESHOLDS.DEFINITION_END) / span,
    };
  }
  if (progress < PHASE_THRESHOLDS.SERVICES_END) {
    const span = PHASE_THRESHOLDS.SERVICES_END - PHASE_THRESHOLDS.MANIFESTO_END;
    return {
      section: "services",
      progress: (progress - PHASE_THRESHOLDS.MANIFESTO_END) / span,
    };
  }
  return {
    section: "contact",
    progress: (progress - PHASE_THRESHOLDS.SERVICES_END) / (1 - PHASE_THRESHOLDS.SERVICES_END),
  };
}
