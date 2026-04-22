import type { CelestialConfig } from "./schema";

/**
 * Hardcoded seed configs matching the three original inline connectors.
 * Used as DB fallback and as the seed script source of truth.
 */
export const SEED_CONFIGS: Record<string, CelestialConfig> = {
  Meridian: {
    schemaVersion: 1,
    preset: "meridian",
    orientation: "horizontal",
    size: "md",
    diagram: {
      rotation: 0,
      rings: { count: 4, tickDensity: 8, showMeridian: true },
      reticle: { crosshair: false, centerShape: "diamond" },
      orbital: { angle: 0, size: "md" },
    },
    lines: {
      topPattern: "v-converge",
      bottomPattern: "v-diverge",
    },
    labels: {
      tl: { emphasis: "Transit", text: "· 02 → 03" },
      tr: { emphasis: "δ", text: "0.34 · Meridian" },
      bl: { text: "N · 180 · LOCK" },
      br: { emphasis: "Fig", text: "· 02b / Descent" },
    },
    cornerBrackets: true,
  },

  "Square Cascade": {
    schemaVersion: 1,
    preset: "squareCascade",
    orientation: "horizontal",
    size: "md",
    diagram: {
      rotation: 0,
      rings: { count: 2, tickDensity: 4, showMeridian: false },
      square: { rotated: true, nested: true, registerMarks: true },
      reticle: { crosshair: false, centerShape: "diamond" },
      orbital: { angle: 0, size: "sm" },
    },
    lines: {
      topPattern: "v-converge",
      bottomPattern: "v-diverge",
    },
    labels: {
      tl: { emphasis: "Transit", text: "· 03 → 04" },
      tr: { emphasis: "ρ", text: "0.58 · Cascade" },
      bl: { emphasis: "Ch", text: "· 03 / Practice" },
      br: { emphasis: "Fig", text: "· 03c / Lock" },
    },
    cornerBrackets: true,
  },

  "Hero Orb": {
    schemaVersion: 1,
    preset: "heroOrb",
    orientation: "horizontal",
    size: "lg",
    diagram: {
      rotation: 0,
      rings: { count: 4, tickDensity: 12, showMeridian: false },
      reticle: { crosshair: false, centerShape: "diamond" },
      orbital: { angle: 0, size: "lg" },
    },
    lines: {
      topPattern: "v-diverge",
      bottomPattern: "v-diverge",
    },
    labels: {
      tl: { emphasis: "Transit", text: "· 04 → 07" },
      tr: { emphasis: "λ", text: "0.72 · About" },
      bl: { emphasis: "Ch", text: "· 07 / Voidwalker" },
      br: { emphasis: "Fig", text: "· 04e / Author" },
    },
    cornerBrackets: true,
  },
};

export const SEED_SLOT_ASSIGNMENTS: Record<string, string> = {
  "definition-to-continuum": "Meridian",
  "continuum-to-practice": "Square Cascade",
  "practice-to-about": "Hero Orb",
};
