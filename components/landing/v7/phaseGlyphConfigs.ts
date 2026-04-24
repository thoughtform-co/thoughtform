import type { CelestialConfig } from "@/lib/celestial/schema";

const EMPTY_LABEL = { text: "" } as const;
const EMPTY_LABELS = { tl: EMPTY_LABEL, tr: EMPTY_LABEL, bl: EMPTY_LABEL, br: EMPTY_LABEL };

/**
 * Tuned CelestialConfig objects for the three approach phases.
 * Full-card halos — larger rings / denser ticks so each reads as its own field.
 */
export const PHASE_GLYPH_CONFIGS: Record<"navigate" | "encode" | "build", CelestialConfig> = {
  navigate: {
    schemaVersion: 1,
    preset: "compassRose",
    orientation: "horizontal",
    size: "lg",
    diagram: {
      rotation: 0,
      rings: { count: 4, tickDensity: 48, showMeridian: true, strokeWeight: 0.5 },
      reticle: { crosshair: true, centerShape: "diamond" },
      orbital: { angle: 42, size: "lg" },
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
      rings: { count: 2, tickDensity: 0, showMeridian: false, strokeWeight: 0.35 },
      glyphRing: { seed: 7, radius: "lg" },
      crystal: { seed: 7, facets: 8, inset: 0.52 },
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
      rings: { count: 2, tickDensity: 8, showMeridian: false, strokeWeight: 0.35 },
      square: { rotated: true, nested: true, registerMarks: true },
      armature: { seed: 3, crossbars: 4, diamondJoints: 4 },
      reticle: { crosshair: false, centerShape: "diamond" },
    },
    lines: { topPattern: "none", bottomPattern: "none" },
    labels: EMPTY_LABELS,
    cornerBrackets: false,
  },
};
