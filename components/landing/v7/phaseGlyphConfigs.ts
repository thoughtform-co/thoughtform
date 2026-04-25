import type { CelestialConfig } from "@/lib/celestial/schema";

const EMPTY_LABEL = { text: "" } as const;
const EMPTY_LABELS = { tl: EMPTY_LABEL, tr: EMPTY_LABEL, bl: EMPTY_LABEL, br: EMPTY_LABEL };

/**
 * Tuned CelestialConfig objects for the three approach phases.
 *
 * These now sit inside the orbit stage on the right of #practice, layered
 * behind the brandmark and inside the orbit rings. The orbit lanes already
 * provide ring grammar, so each glyph pares back to its signature shape and
 * lighter ring/tick density. Diagrams crossfade by opacity as the active
 * phase changes; the same SVG viewBox keeps them visually anchored at center.
 */
export const PHASE_GLYPH_CONFIGS: Record<"navigate" | "encode" | "build", CelestialConfig> = {
  navigate: {
    schemaVersion: 1,
    preset: "compassRose",
    orientation: "horizontal",
    size: "lg",
    diagram: {
      rotation: 0,
      rings: { count: 2, tickDensity: 24, showMeridian: true, strokeWeight: 0.5 },
      reticle: { crosshair: true, centerShape: "diamond" },
      orbital: { angle: 42, size: "md" },
    },
    lines: { topPattern: "none", bottomPattern: "none" },
    labels: EMPTY_LABELS,
    cornerBrackets: false,
  },

  encode: {
    schemaVersion: 1,
    preset: "crystallize",
    orientation: "horizontal",
    size: "lg",
    diagram: {
      rotation: 0,
      rings: { count: 1, tickDensity: 0, showMeridian: false, strokeWeight: 0.3 },
      glyphRing: { seed: 7, radius: "md" },
      crystal: { seed: 7, facets: 8, inset: 0.5 },
      reticle: { crosshair: false, centerShape: "diamond" },
    },
    lines: { topPattern: "none", bottomPattern: "none" },
    labels: EMPTY_LABELS,
    cornerBrackets: false,
  },

  build: {
    schemaVersion: 1,
    preset: "armature",
    orientation: "horizontal",
    size: "lg",
    diagram: {
      rotation: 0,
      rings: { count: 1, tickDensity: 4, showMeridian: false, strokeWeight: 0.3 },
      square: { rotated: true, nested: true, registerMarks: false },
      armature: { seed: 3, crossbars: 4, diamondJoints: 4 },
      reticle: { crosshair: false, centerShape: "diamond" },
    },
    lines: { topPattern: "none", bottomPattern: "none" },
    labels: EMPTY_LABELS,
    cornerBrackets: false,
  },
};
