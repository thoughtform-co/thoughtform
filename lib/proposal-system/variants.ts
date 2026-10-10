import registry from "@/lib/proposal-system/directions.json";

/**
 * /test/proposal-system — the knob record and the query parser (the X-Bionic
 * rework, 2026-10-10). The instrument lab's `variants.ts` shape, copied: ONE
 * registry (`directions.json`) read here by import and by
 * `scripts/capture-proposal-system.mjs` with `readFileSync`.
 *
 * ⚠ THE FIRST VALUE OF EVERY KNOB IS PRODUCTION. `PA` is the control.
 * ⚠ TYPE IDS ARE LETTERS ONLY. ⚠ NO FLAG, EVER (ADR-070 U35).
 * ⚠ SERVER-SAFE: the lab is a server page and reads `searchParams`, so the
 * parser takes a plain record, never `URLSearchParams`.
 */

export const PS_KNOB_KEYS = [
  "order",
  "interstitial",
  "jobHead",
  "return",
  "approach",
  "upstream",
  "engine",
] as const;
export type PsKnobKey = (typeof PS_KNOB_KEYS)[number];
export type PsKnobs = Record<PsKnobKey, string>;

interface KnobDef {
  values: string[];
  label: string;
  note: string;
}

const KNOBS = registry.knobs as Record<PsKnobKey, KnobDef>;

export const PS_KNOB_LIST: { key: PsKnobKey; def: KnobDef }[] = PS_KNOB_KEYS.map((key) => ({
  key,
  def: KNOBS[key],
}));

export const PS_DEFAULTS: PsKnobs = Object.fromEntries(
  PS_KNOB_KEYS.map((k) => [k, KNOBS[k].values[0]])
) as PsKnobs;

export interface PsDirection {
  id: string;
  name: string;
  question: string;
  shape: string;
  knobs: Partial<PsKnobs>;
}

export const PS_DIRECTIONS = registry.directions as PsDirection[];
export const PS_DIRECTION_IDS = PS_DIRECTIONS.map((d) => d.id);

export function psDirection(id: string): PsDirection {
  return PS_DIRECTIONS.find((d) => d.id === id) ?? PS_DIRECTIONS[0];
}

export function knobsFor(id: string): PsKnobs {
  return { ...PS_DEFAULTS, ...psDirection(id).knobs };
}

export function directionOf(knobs: PsKnobs): string {
  const hit = PS_DIRECTIONS.find((d) =>
    PS_KNOB_KEYS.every((k) => knobs[k] === (d.knobs[k] ?? PS_DEFAULTS[k]))
  );
  return hit ? hit.id : "";
}

export function knobString(knobs: PsKnobs): string {
  return PS_KNOB_KEYS.map((k) => `${k}=${knobs[k]}`).join(",");
}

export type PsTheme = "dark" | "light";

export const PS_WAVE = registry.wave as {
  lane: string;
  viewports: string[];
  binding: string;
  themes: string[];
  note: string;
};

export interface PsQuery {
  knobs: PsKnobs;
  k: string;
  theme: PsTheme;
  consoleOn: boolean;
}

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** The query, read once by the server page. A missing parameter is the
 *  default, an unknown value falls back rather than throwing; `?k=` seeds a
 *  direction and an explicit knob overrides the seed. */
export function parsePsQuery(sp: SearchParams): PsQuery {
  const k = one(sp.k) ?? "";
  const seeded = PS_DIRECTION_IDS.includes(k) ? knobsFor(k) : { ...PS_DEFAULTS };
  const knobs = { ...seeded };
  for (const key of PS_KNOB_KEYS) {
    const raw = one(sp[key]);
    if (raw && KNOBS[key].values.includes(raw)) knobs[key] = raw;
  }
  const theme = one(sp.theme);
  return {
    knobs,
    k: directionOf(knobs),
    theme: theme === "light" ? "light" : "dark",
    consoleOn: one(sp.console) !== "0",
  };
}

/** The lab's own address for a state, so every control is a link. */
export function psHref(knobs: PsKnobs, theme: PsTheme, consoleOn = true): string {
  const q = new URLSearchParams();
  const k = directionOf(knobs);
  if (k) q.set("k", k);
  for (const key of PS_KNOB_KEYS) q.set(key, knobs[key]);
  q.set("theme", theme);
  if (!consoleOn) q.set("console", "0");
  return `/test/proposal-system?${q.toString()}`;
}
