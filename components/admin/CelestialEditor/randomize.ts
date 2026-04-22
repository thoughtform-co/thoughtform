import type {
  CelestialConfig,
  Preset,
  LinePattern,
  Rotation,
  Size,
  CenterShape,
} from "@/lib/celestial/schema";
import { PRESETS, LINE_PATTERNS, ROTATIONS, SIZES, CENTER_SHAPES } from "@/lib/celestial/schema";

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const EMPHASES = [
  "ASC",
  "DESC",
  "NODE",
  "APOGEE",
  "PERIGEE",
  "VERNAL",
  "TRANSIT",
  "ECLIPTIC",
  "AZIMUTH",
  "LOCK",
  "PHASE",
  "N · 000",
  "N · 180",
  "Ch · 01",
  "Ch · 02",
  "Ch · 03",
  "FIG · 01",
  "FIG · 02",
  "∂ · 001",
  "θ · 058",
];

const LABEL_TEXTS = [
  "meridian",
  "descent",
  "bearing",
  "waypoint",
  "signal",
  "orbital",
  "threshold",
  "terminus",
  "origin",
  "field",
  "void",
  "sector",
  "passage",
  "mark",
  "gate",
  "",
  "",
  "",
  "",
];

function randomLabel(): { text: string; emphasis?: string } {
  if (Math.random() < 0.4) return { text: "" };
  return {
    text: pick(LABEL_TEXTS),
    emphasis: Math.random() < 0.7 ? pick(EMPHASES) : undefined,
  };
}

export function randomizeConfig(): CelestialConfig {
  const seed = randInt(1, 99999);
  const preset: Preset = pick(PRESETS);
  const ringCount = pick([1, 2, 3, 4, 5] as const);
  const tickDensity = pick([0, 4, 8, 12, 16, 24] as const);

  return {
    schemaVersion: 1,
    preset,
    orientation: pick(["horizontal", "vertical"] as const),
    size: pick(SIZES) as Size,
    diagram: {
      rotation: pick(ROTATIONS) as Rotation,
      rings: {
        count: ringCount,
        tickDensity,
        showMeridian: Math.random() > 0.4,
      },
      square: {
        rotated: Math.random() > 0.3,
        nested: Math.random() > 0.4,
        registerMarks: Math.random() > 0.5,
      },
      reticle: {
        crosshair: Math.random() > 0.4,
        centerShape: pick(CENTER_SHAPES) as CenterShape,
      },
      orbital: {
        angle: randInt(0, 360),
        size: pick(SIZES) as Size,
      },
      constellation: {
        seed,
        points: pick([5, 7, 9, 11] as const),
        density: pick(["sparse", "dense"] as const),
      },
      ecliptic: {
        seed,
        tilt: randInt(-35, 35),
        phaseCount: pick([1, 2] as const),
      },
      phase: {
        seed,
        coverage: Math.round(Math.random() * 90 + 5) / 100,
      },
      glyphRing: {
        seed,
        radius: pick(["sm", "md", "lg"] as const),
      },
    },
    lines: {
      topPattern: pick(LINE_PATTERNS) as LinePattern,
      bottomPattern: pick(LINE_PATTERNS) as LinePattern,
    },
    labels: {
      tl: randomLabel(),
      tr: randomLabel(),
      bl: randomLabel(),
      br: randomLabel(),
    },
    cornerBrackets: false,
  };
}
