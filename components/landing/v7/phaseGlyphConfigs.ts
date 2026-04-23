import type { CelestialConfig } from "@/lib/celestial/schema";

const EMPTY_LABEL = { text: "" } as const;
const EMPTY_LABELS = { tl: EMPTY_LABEL, tr: EMPTY_LABEL, bl: EMPTY_LABEL, br: EMPTY_LABEL };

/**
 * Tuned CelestialConfig objects for the three approach phases.
 * Labels empty — these are inline glyphs, not connectors.
 * Lines set to "none" — no connecting wires above/below.
 */
export const PHASE_GLYPH_CONFIGS: Record<"navigate" | "encode" | "build", CelestialConfig> = {
  navigate: {
    schemaVersion: 1,
    preset: "compassRose",
    orientation: "horizontal",
    size: "md",
    diagram: {
      rotation: 0,
      rings: { count: 3, tickDensity: 12, showMeridian: true, strokeWeight: 0.5 },
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
    size: "md",
    diagram: {
      rotation: 0,
      rings: { count: 1, tickDensity: 0, showMeridian: false, strokeWeight: 0.3 },
      glyphRing: { seed: 7, radius: "lg" },
      crystal: { seed: 7, facets: 6, inset: 0.55 },
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
    size: "md",
    diagram: {
      rotation: 0,
      rings: { count: 1, tickDensity: 4, showMeridian: false, strokeWeight: 0.3 },
      square: { rotated: true, nested: true, registerMarks: true },
      armature: { seed: 3, crossbars: 3, diamondJoints: 4 },
      reticle: { crosshair: false, centerShape: "diamond" },
    },
    lines: { topPattern: "none", bottomPattern: "none" },
    labels: EMPTY_LABELS,
    cornerBrackets: false,
  },
};
