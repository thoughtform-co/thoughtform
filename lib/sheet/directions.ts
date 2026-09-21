import registry from "./directions.json";

/**
 * lib/sheet/directions — the typed reader over `directions.json` (ADR-114).
 *
 * The knobs are the sheet's DIMENSIONS in the Mosaic sense: interpretable
 * axes a still can be steered along. They travel as `data-sh-<knob>`
 * attributes on `.sh-root`; every rule in `sheet.css` that answers a knob
 * keys on that attribute, so a still is always traceable to the exact set
 * that drew it. The pages render the house values on the server and
 * `SheetQueryKnobs` overrides them from `?k=<ID>` (or explicit knob params)
 * after mount — a reader without JS gets the house.
 */

/** The sheet's four, then the arcs instrument's two (ADR-118; `rows` was
 *  deleted with direction SH by U1, `dossier` with SJ by U2). */
export const SH_KNOB_KEYS = ["head", "ordinal", "card", "timeline", "span", "frame"] as const;
export type ShKnobKey = (typeof SH_KNOB_KEYS)[number];
export type ShKnobs = Record<ShKnobKey, string>;

interface KnobDef {
  values: string[];
  label: string;
  note: string;
}

const KNOBS = registry.knobs as Record<ShKnobKey, KnobDef>;

export const SH_KNOB_LIST: { key: ShKnobKey; def: KnobDef }[] = SH_KNOB_KEYS.map((key) => ({
  key,
  def: KNOBS[key],
}));

/** ⚠ THE FIRST VALUE OF EVERY KNOB IS THE HOUSE. */
export const SH_DEFAULTS: ShKnobs = Object.fromEntries(
  SH_KNOB_KEYS.map((k) => [k, KNOBS[k].values[0]])
) as ShKnobs;

export interface ShDirection {
  id: string;
  name: string;
  question: string;
  shape: string;
  /** `null` on a negative pole — it is not a knob set. */
  knobs: Partial<ShKnobs> | null;
  pole?: "negative";
  lane?: string;
  routes?: Record<string, string>;
  /** The page types this direction is shot on; absent = every page. A
   *  direction may only move the knobs of the pages it is scoped to. */
  types?: string[];
  /** A pole PROMOTED byte-identical from an earlier wave rather than shot. */
  from?: { wave: string; lane: string; stills: number[]; commit: string };
}

export const SH_DIRECTIONS = registry.directions as ShDirection[];
export const SH_DIRECTION_IDS = SH_DIRECTIONS.map((d) => d.id);

/** The directions a page can draw — the negative pole excluded. */
export const SH_DRAWABLE = SH_DIRECTIONS.filter((d) => d.knobs !== null);

export function shDirection(id: string): ShDirection {
  return SH_DIRECTIONS.find((d) => d.id === id) ?? SH_DRAWABLE[0];
}

/** A direction's knobs over the house values. */
export function knobsFor(id: string): ShKnobs {
  const d = shDirection(id);
  return { ...SH_DEFAULTS, ...(d.knobs ?? {}) };
}

/** Which direction a knob set IS, or `""` for a hand-mixed one. */
export function directionOf(knobs: ShKnobs): string {
  const hit = SH_DRAWABLE.find((d) =>
    SH_KNOB_KEYS.every((k) => knobs[k] === (d.knobs?.[k] ?? SH_DEFAULTS[k]))
  );
  return hit ? hit.id : "";
}

/** The attributes a knob set writes on `.sh-root`, in registry order, always every knob. */
export function knobAttrs(knobs: ShKnobs): Record<`data-sh-${ShKnobKey}`, string> {
  return Object.fromEntries(SH_KNOB_KEYS.map((k) => [`data-sh-${k}`, knobs[k]])) as Record<
    `data-sh-${ShKnobKey}`,
    string
  >;
}

/**
 * The URL, read once per mount. `?k=<ID>` seeds the set; an explicit knob
 * parameter overrides the seed; an unknown value falls back to the house
 * rather than throwing, because a page that white-screens on a typo in a
 * capture matrix costs a whole wave.
 */
export function parseSheetQuery(sp: URLSearchParams): { knobs: ShKnobs; k: string } {
  const k = sp.get("k") ?? "";
  const seeded = SH_DRAWABLE.some((d) => d.id === k) ? knobsFor(k) : { ...SH_DEFAULTS };
  const knobs = { ...seeded };
  for (const key of SH_KNOB_KEYS) {
    const raw = sp.get(key);
    if (raw && KNOBS[key].values.includes(raw)) knobs[key] = raw;
  }
  return { knobs, k: directionOf(knobs) };
}

export const SH_WAVE = registry.wave as {
  themes: string[];
  settings: Record<string, string>;
  note: string;
};
