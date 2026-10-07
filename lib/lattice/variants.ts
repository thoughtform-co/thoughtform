import registry from "@/lib/lattice/directions.json";

/**
 * /test/lattice — the knob record and the URL parser (ADR-149 §4).
 *
 * The interface kit's `variants.ts` shape, copied: ONE registry
 * (`lib/lattice/directions.json`) read here by import and by
 * `scripts/capture-lattice.mjs` with `readFileSync`, mirrored into the
 * turnstone ship's `armada.toml` as `[types.LT]`. Two readers of one record:
 * a direction cannot be shot that the page cannot draw, and a type cannot be
 * graded that the registry does not name.
 *
 * ⚠ THE FIRST VALUE OF EVERY KNOB IS THE HOUSE. `LA` is every knob at its
 * first value and is the control; every other direction is one argument
 * against it. A knob whose default changes the render has broken the control.
 *
 * ⚠ TYPE IDS ARE LETTERS ONLY (the armada's filename grammar takes letters
 * before the first dash).
 *
 * ⚠ NO FLAG, EVER (ADR-070 U35). A winner is promoted with its own ADR line
 * and the losers are deleted with their guards.
 */

/* ── The knobs ────────────────────────────────────────────────────────────── */

export const LAT_KNOB_KEYS = ["cut", "line", "head"] as const;
export type LatKnobKey = (typeof LAT_KNOB_KEYS)[number];

export type LatKnobs = Record<LatKnobKey, string>;

interface KnobDef {
  values: string[];
  label: string;
  note: string;
}

const KNOBS = registry.knobs as Record<LatKnobKey, KnobDef>;

/** Knob metadata for the console, in the registry's own order. */
export const LAT_KNOB_LIST: { key: LatKnobKey; def: KnobDef }[] = LAT_KNOB_KEYS.map((key) => ({
  key,
  def: KNOBS[key],
}));

/** The house: the first value of every knob. `LA` is this set. */
export const LAT_DEFAULTS: LatKnobs = Object.fromEntries(
  LAT_KNOB_KEYS.map((k) => [k, KNOBS[k].values[0]])
) as LatKnobs;

/* ── The directions ───────────────────────────────────────────────────────── */

export interface LatDirection {
  id: string;
  name: string;
  question: string;
  shape: string;
  knobs: Partial<LatKnobs>;
}

export const LAT_DIRECTIONS = registry.directions as LatDirection[];
export const LAT_DIRECTION_IDS = LAT_DIRECTIONS.map((d) => d.id);

export function latDirection(id: string): LatDirection {
  return LAT_DIRECTIONS.find((d) => d.id === id) ?? LAT_DIRECTIONS[0];
}

/** A direction's knobs, over the defaults. The one place they compose. */
export function knobsFor(id: string): LatKnobs {
  return { ...LAT_DEFAULTS, ...latDirection(id).knobs };
}

/**
 * Which direction a knob set IS, or `""` for a hand-mixed one. The console
 * prints it and the stamp carries it, so a still is always traceable to a
 * direction id or honestly marked as not being one.
 */
export function directionOf(knobs: LatKnobs): string {
  const hit = LAT_DIRECTIONS.find((d) =>
    LAT_KNOB_KEYS.every((k) => knobs[k] === (d.knobs[k] ?? LAT_DEFAULTS[k]))
  );
  return hit ? hit.id : "";
}

/** The stamp's knob half: every knob, in registry order, always. */
export function knobString(knobs: LatKnobs): string {
  return LAT_KNOB_KEYS.map((k) => `${k}=${knobs[k]}`).join(",");
}

/* ── The rest of the state ────────────────────────────────────────────────── */

/** The five boards. `page` is what the jury scores; the rest are specimens. */
export const LAT_BOARDS = ["grid", "frames", "sections", "page", "type"] as const;
export type LatBoard = (typeof LAT_BOARDS)[number];

export type LatTheme = "dark" | "light";

export const LAT_WAVE = registry.wave as {
  lane: string;
  viewports: string[];
  binding: string;
  themes: string[];
  note: string;
};

export interface LatQuery {
  knobs: LatKnobs;
  k: string;
  board: LatBoard;
  theme: LatTheme;
  grid: boolean;
  consoleOn: boolean;
}

/**
 * The URL, read once per mount.
 *
 * ⚠ A MISSING PARAMETER IS NOT A ZERO VALUE. `?k=` names a direction and its
 * knobs seed the set; an explicit knob parameter then overrides that seed, so
 * `?k=LB&line=seam` is a legal one-axis question about the composite. An
 * unknown value falls back to the default rather than throwing, because a lab
 * that white-screens on a typo in a capture matrix costs a whole run.
 */
export function parseLatQuery(sp: URLSearchParams): LatQuery {
  const k = sp.get("k") ?? "";
  const seeded = LAT_DIRECTION_IDS.includes(k) ? knobsFor(k) : { ...LAT_DEFAULTS };

  const knobs = { ...seeded };
  for (const key of LAT_KNOB_KEYS) {
    const raw = sp.get(key);
    if (raw && KNOBS[key].values.includes(raw)) knobs[key] = raw;
  }

  const board = sp.get("board");
  const theme = sp.get("theme");

  return {
    knobs,
    k: directionOf(knobs),
    board: (LAT_BOARDS as readonly string[]).includes(board ?? "") ? (board as LatBoard) : "page",
    theme: theme === "light" ? "light" : "dark",
    grid: sp.get("grid") === "1",
    consoleOn: sp.get("console") !== "0",
  };
}
