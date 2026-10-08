import registry from "@/lib/instrument/directions.json";

/**
 * /test/instrument-lab — the knob record and the URL parser (ADR-154).
 *
 * The lattice lab's `variants.ts` shape, copied: ONE registry
 * (`lib/instrument/directions.json`) read here by import and by
 * `scripts/capture-instrument.mjs` with `readFileSync`. Two readers of one
 * record: a direction cannot be shot that the page cannot draw.
 *
 * ⚠ THE FIRST VALUE OF EVERY KNOB IS THE HOUSE. `IA` is the control.
 * ⚠ TYPE IDS ARE LETTERS ONLY. ⚠ NO FLAG, EVER (ADR-070 U35).
 */

export const INS_KNOB_KEYS = ["housing", "panel", "ribbon", "ground", "zoom"] as const;
export type InsKnobKey = (typeof INS_KNOB_KEYS)[number];
export type InsKnobs = Record<InsKnobKey, string>;

interface KnobDef {
  values: string[];
  label: string;
  note: string;
}

const KNOBS = registry.knobs as Record<InsKnobKey, KnobDef>;

export const INS_KNOB_LIST: { key: InsKnobKey; def: KnobDef }[] = INS_KNOB_KEYS.map((key) => ({
  key,
  def: KNOBS[key],
}));

export const INS_DEFAULTS: InsKnobs = Object.fromEntries(
  INS_KNOB_KEYS.map((k) => [k, KNOBS[k].values[0]])
) as InsKnobs;

export interface InsDirection {
  id: string;
  name: string;
  question: string;
  shape: string;
  knobs: Partial<InsKnobs>;
}

export const INS_DIRECTIONS = registry.directions as InsDirection[];
export const INS_DIRECTION_IDS = INS_DIRECTIONS.map((d) => d.id);

export function insDirection(id: string): InsDirection {
  return INS_DIRECTIONS.find((d) => d.id === id) ?? INS_DIRECTIONS[0];
}

export function knobsFor(id: string): InsKnobs {
  return { ...INS_DEFAULTS, ...insDirection(id).knobs };
}

export function directionOf(knobs: InsKnobs): string {
  const hit = INS_DIRECTIONS.find((d) =>
    INS_KNOB_KEYS.every((k) => knobs[k] === (d.knobs[k] ?? INS_DEFAULTS[k]))
  );
  return hit ? hit.id : "";
}

export function knobString(knobs: InsKnobs): string {
  return INS_KNOB_KEYS.map((k) => `${k}=${knobs[k]}`).join(",");
}

/** The four boards. `surfaces` is what the jury scores. */
export const INS_BOARDS = ["altitudes", "zoom", "surfaces", "phone"] as const;
export type InsBoard = (typeof INS_BOARDS)[number];

export type InsTheme = "dark" | "light";

export const INS_WAVE = registry.wave as {
  lane: string;
  viewports: string[];
  binding: string;
  themes: string[];
  note: string;
};

export interface InsQuery {
  knobs: InsKnobs;
  k: string;
  board: InsBoard;
  theme: InsTheme;
  consoleOn: boolean;
}

/** The URL, read once per mount. A missing parameter is the default, an
 *  unknown value falls back rather than throwing. */
export function parseInsQuery(sp: URLSearchParams): InsQuery {
  const k = sp.get("k") ?? "";
  const seeded = INS_DIRECTION_IDS.includes(k) ? knobsFor(k) : { ...INS_DEFAULTS };
  const knobs = { ...seeded };
  for (const key of INS_KNOB_KEYS) {
    const raw = sp.get(key);
    if (raw && KNOBS[key].values.includes(raw)) knobs[key] = raw;
  }
  const board = sp.get("board");
  const theme = sp.get("theme");
  return {
    knobs,
    k: directionOf(knobs),
    board: (INS_BOARDS as readonly string[]).includes(board ?? "")
      ? (board as InsBoard)
      : "altitudes",
    theme: theme === "light" ? "light" : "dark",
    consoleOn: sp.get("console") !== "0",
  };
}
