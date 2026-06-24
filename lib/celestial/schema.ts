// Celestial Connector — config schema & validation
// Controls the parametric diagrams rendered between landing page sections.

export const PRESETS = [
  "meridian",
  "squareCascade",
  "heroOrb",
  "reticle",
  "compassRose",
  "orbital",
  "registerMarks",
  "constellation",
  "ecliptic",
  "phase",
  "sigil",
  "astrolabe",
  "crystallize",
  "armature",
  "astralEmblem",
  "orrerySigil",
] as const;
export type Preset = (typeof PRESETS)[number];

export const LINE_PATTERNS = ["v-converge", "v-diverge", "parallel-3", "single", "none"] as const;
export type LinePattern = (typeof LINE_PATTERNS)[number];

export const ORIENTATIONS = ["horizontal", "vertical"] as const;
export type Orientation = (typeof ORIENTATIONS)[number];

export const SIZES = ["sm", "md", "lg"] as const;
export type Size = (typeof SIZES)[number];

export const CENTER_SHAPES = ["dot", "diamond", "ring"] as const;
export type CenterShape = (typeof CENTER_SHAPES)[number];

export const ROTATIONS = [0, 90, 180, 270] as const;
export type Rotation = (typeof ROTATIONS)[number];

export const TICK_DENSITIES = [0, 4, 8, 12, 16, 24, 48] as const;
export type TickDensity = (typeof TICK_DENSITIES)[number];

export const STROKE_WEIGHTS = [0.3, 0.5, 0.7, 1, 1.5, 2] as const;
export type StrokeWeight = (typeof STROKE_WEIGHTS)[number];

export interface RingsConfig {
  count: 1 | 2 | 3 | 4 | 5;
  tickDensity: TickDensity;
  showMeridian: boolean;
  strokeWeight?: StrokeWeight;
}

export interface SquareConfig {
  rotated: boolean;
  nested: boolean;
  registerMarks: boolean;
}

export interface ReticleConfig {
  crosshair: boolean;
  centerShape: CenterShape;
}

export interface OrbitalConfig {
  angle: number;
  size: Size;
}

export interface ConstellationConfig {
  seed: number;
  points: 5 | 7 | 9 | 11;
  density: "sparse" | "dense";
}

export interface EclipticConfig {
  seed: number;
  tilt: number;
  phaseCount: 1 | 2;
}

export interface PhaseConfig {
  seed: number;
  coverage: number;
}

export interface GlyphRingConfig {
  seed: number;
  radius: "sm" | "md" | "lg";
}

export interface CrystalConfig {
  seed: number;
  facets: 4 | 6 | 8;
  inset: number;
}

export interface ArmatureConfig {
  seed: number;
  crossbars: 2 | 3 | 4;
  diamondJoints: 3 | 4 | 5;
}

export interface LabelEntry {
  text: string;
  emphasis?: string;
}

export interface CelestialConfig {
  schemaVersion: 1;
  preset: Preset;
  orientation: Orientation;
  size: Size;
  diagram: {
    rotation: Rotation;
    rings?: RingsConfig;
    square?: SquareConfig;
    reticle?: ReticleConfig;
    orbital?: OrbitalConfig;
    constellation?: ConstellationConfig;
    ecliptic?: EclipticConfig;
    phase?: PhaseConfig;
    glyphRing?: GlyphRingConfig;
    crystal?: CrystalConfig;
    armature?: ArmatureConfig;
  };
  lines: {
    topPattern: LinePattern;
    bottomPattern: LinePattern;
  };
  labels: {
    tl: LabelEntry;
    tr: LabelEntry;
    bl: LabelEntry;
    br: LabelEntry;
  };
  /** @deprecated Kept for backwards-compat with stored configs; no longer rendered. */
  cornerBrackets: boolean;
}

export interface CelestialDesign {
  id: string;
  name: string;
  config: CelestialConfig;
  created_at: string;
  updated_at: string;
}

export interface CelestialSlot {
  slot_id: string;
  design_id: string | null;
  orientation: Orientation;
  enabled: boolean;
  updated_at: string;
}

export type SlotAssignment = {
  slot_id: string;
  config: CelestialConfig;
  orientation: Orientation;
  enabled: boolean;
};

export type SlotsMap = Record<string, SlotAssignment>;

// ── Defaults ────────────────────────────────────────────────────────

const DEFAULT_LABEL: LabelEntry = { text: "" };

export const DEFAULT_CONFIG: CelestialConfig = {
  schemaVersion: 1,
  preset: "meridian",
  orientation: "horizontal",
  size: "md",
  diagram: {
    rotation: 0,
    rings: { count: 3, tickDensity: 8, showMeridian: true },
  },
  lines: {
    topPattern: "v-converge",
    bottomPattern: "v-diverge",
  },
  labels: {
    tl: { ...DEFAULT_LABEL },
    tr: { ...DEFAULT_LABEL },
    bl: { ...DEFAULT_LABEL },
    br: { ...DEFAULT_LABEL },
  },
  cornerBrackets: true,
};

// ── Validation ──────────────────────────────────────────────────────

const MAX_LABEL_LEN = 32;

function includes<T>(arr: readonly T[], v: unknown): v is T {
  return (arr as readonly unknown[]).includes(v);
}

function isLabelEntry(v: unknown): v is LabelEntry {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.text !== "string") return false;
  if (o.text.length > MAX_LABEL_LEN) return false;
  if (o.emphasis !== undefined && typeof o.emphasis !== "string") return false;
  if (typeof o.emphasis === "string" && o.emphasis.length > MAX_LABEL_LEN) return false;
  return true;
}

export function validateConfig(v: unknown): {
  ok: boolean;
  errors: string[];
  config?: CelestialConfig;
} {
  const errors: string[] = [];
  if (!v || typeof v !== "object") return { ok: false, errors: ["Not an object"] };
  const c = v as Record<string, unknown>;

  if (c.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!includes(PRESETS, c.preset)) errors.push(`Invalid preset: ${c.preset}`);
  if (!includes(ORIENTATIONS, c.orientation)) errors.push(`Invalid orientation: ${c.orientation}`);
  if (!includes(SIZES, c.size)) errors.push(`Invalid size: ${c.size}`);

  // diagram
  if (!c.diagram || typeof c.diagram !== "object") {
    errors.push("diagram must be an object");
  } else {
    const d = c.diagram as Record<string, unknown>;
    if (!includes(ROTATIONS, d.rotation)) errors.push(`Invalid rotation: ${d.rotation}`);

    if (d.rings !== undefined) {
      const r = d.rings as Record<string, unknown>;
      if (typeof r.count !== "number" || r.count < 1 || r.count > 5)
        errors.push("rings.count must be 1-5");
      if (!includes(TICK_DENSITIES, r.tickDensity))
        errors.push(`Invalid tickDensity: ${r.tickDensity}`);
      if (typeof r.showMeridian !== "boolean") errors.push("rings.showMeridian must be boolean");
    }
    if (d.square !== undefined) {
      const s = d.square as Record<string, unknown>;
      if (typeof s.rotated !== "boolean") errors.push("square.rotated must be boolean");
      if (typeof s.nested !== "boolean") errors.push("square.nested must be boolean");
      if (typeof s.registerMarks !== "boolean") errors.push("square.registerMarks must be boolean");
    }
    if (d.reticle !== undefined) {
      const r = d.reticle as Record<string, unknown>;
      if (typeof r.crosshair !== "boolean") errors.push("reticle.crosshair must be boolean");
      if (!includes(CENTER_SHAPES, r.centerShape))
        errors.push(`Invalid centerShape: ${r.centerShape}`);
    }
    if (d.orbital !== undefined) {
      const o = d.orbital as Record<string, unknown>;
      if (typeof o.angle !== "number" || o.angle < 0 || o.angle > 360)
        errors.push("orbital.angle must be 0-360");
      if (!includes(SIZES, o.size)) errors.push(`Invalid orbital.size: ${o.size}`);
    }
    if (d.crystal !== undefined) {
      const cr = d.crystal as Record<string, unknown>;
      if (typeof cr.seed !== "number") errors.push("crystal.seed must be a number");
      if (![4, 6, 8].includes(cr.facets as number))
        errors.push("crystal.facets must be 4, 6, or 8");
      if (typeof cr.inset !== "number" || (cr.inset as number) < 0 || (cr.inset as number) > 1)
        errors.push("crystal.inset must be 0-1");
    }
    if (d.armature !== undefined) {
      const ar = d.armature as Record<string, unknown>;
      if (typeof ar.seed !== "number") errors.push("armature.seed must be a number");
      if (![2, 3, 4].includes(ar.crossbars as number))
        errors.push("armature.crossbars must be 2, 3, or 4");
      if (![3, 4, 5].includes(ar.diamondJoints as number))
        errors.push("armature.diamondJoints must be 3, 4, or 5");
    }
  }

  // lines
  if (!c.lines || typeof c.lines !== "object") {
    errors.push("lines must be an object");
  } else {
    const l = c.lines as Record<string, unknown>;
    if (!includes(LINE_PATTERNS, l.topPattern)) errors.push(`Invalid topPattern: ${l.topPattern}`);
    if (!includes(LINE_PATTERNS, l.bottomPattern))
      errors.push(`Invalid bottomPattern: ${l.bottomPattern}`);
  }

  // labels
  if (!c.labels || typeof c.labels !== "object") {
    errors.push("labels must be an object");
  } else {
    const l = c.labels as Record<string, unknown>;
    for (const pos of ["tl", "tr", "bl", "br"] as const) {
      if (!isLabelEntry(l[pos])) errors.push(`labels.${pos} is invalid`);
    }
  }

  if (typeof c.cornerBrackets !== "boolean") errors.push("cornerBrackets must be boolean");

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, errors: [], config: v as CelestialConfig };
}
