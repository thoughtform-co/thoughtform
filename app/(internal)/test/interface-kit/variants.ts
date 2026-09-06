import registry from "@/lib/interface-kit/directions.json";

/**
 * /test/interface-kit — the knob record and the URL parser.
 *
 * THE QUESTION THIS LAB ASKS. The owner reads Tensorlake and Prime Intellect as
 * "retrofuturistic terminal, but modern" and the proof casefile as almost
 * there. Measured against those two, the difference is not vocabulary — one of
 * them sets its display type in PP Neue Montreal, the same face this house uses
 * — it is DISCIPLINE, and every part of it is countable:
 *
 *   structure lines   they draw one weight in one neutral hue; the casefile
 *                     draws three dawn alphas AND gold hairlines
 *   tracking          four letter-spacing tokens in a whole design system,
 *                     against FIFTEEN on this one panel
 *   weight            500 at the top of their ladder, against six 700 sites
 *   case              uppercase reserved for mono chrome, so case ranks;
 *                     here nearly everything is uppercase, so it ranks nothing
 *   accent            six to eight small accent marks per screen, against
 *                     roughly forty gold objects in one panel
 *   material          flat fills, against a bloom, a scanline and two blurs
 *
 * So the knobs below are not styles. Each one is ONE of those counts, moved to
 * the house's own stated law — and the first value of every knob is PRODUCTION
 * UNTOUCHED, which is what makes `KA` a control rather than a preference.
 *
 * ⚠ THE REGISTRY IS JSON AND SHARED, NOT DUPLICATED. `directions.json` is read
 * here by import and by `scripts/capture-interface-kit.mjs` with `readFileSync`,
 * and mirrored into the ship's `armada.toml` `[types]` with the capture
 * asserting the mirror. Two readers of one record: a direction cannot be shot
 * that the page cannot draw, and a type cannot be graded that the registry does
 * not name.
 *
 * ⚠ NO FLAG, EVER (ADR-070 U35). A winner is promoted into `casefile.css` with
 * its own ADR and the losers are deleted with their guards.
 */

/* ── The knobs ────────────────────────────────────────────────────────────── */

/* ⚠ SEVEN OF NINE ABSORBED (ADR-092 stage 1, 2026-09-06): grid, line, track,
 * weight, case, accent and material are production now, so a knob for each
 * would be a no-op knob. The two that remain are the two open questions. */
export const IK_KNOB_KEYS = ["lip", "tab"] as const;
export type IkKnobKey = (typeof IK_KNOB_KEYS)[number];

export type IkKnobs = Record<IkKnobKey, string>;

interface KnobDef {
  values: string[];
  label: string;
  note: string;
}

const KNOBS = registry.knobs as Record<IkKnobKey, KnobDef>;

/** Knob metadata for the console, in the registry's own order. */
export const IK_KNOB_LIST: { key: IkKnobKey; def: KnobDef }[] = IK_KNOB_KEYS.map((key) => ({
  key,
  def: KNOBS[key],
}));

/**
 * ⚠ THE FIRST VALUE OF EVERY KNOB IS WHAT SHIPS. `KA` is the recomposition at
 * these values, so a still of it that differs from the control is a defect in
 * the recomposition — not a direction. Every override below is therefore an
 * argument someone has to make.
 */
export const IK_DEFAULTS: IkKnobs = Object.fromEntries(
  IK_KNOB_KEYS.map((k) => [k, KNOBS[k].values[0]])
) as IkKnobs;

/* ── The directions ───────────────────────────────────────────────────────── */

export interface IkDirection {
  id: string;
  name: string;
  question: string;
  shape: string;
  knobs: Partial<IkKnobs>;
}

export const IK_DIRECTIONS = registry.directions as IkDirection[];
export const IK_DIRECTION_IDS = IK_DIRECTIONS.map((d) => d.id);

export function ikDirection(id: string): IkDirection {
  return IK_DIRECTIONS.find((d) => d.id === id) ?? IK_DIRECTIONS[0];
}

/** A direction's knobs, over the defaults. The one place they compose. */
export function knobsFor(id: string): IkKnobs {
  return { ...IK_DEFAULTS, ...ikDirection(id).knobs };
}

/**
 * Which direction a knob set IS, or `""` for a hand-mixed one. The console
 * prints it and the stamp carries it, so a still is always traceable to a
 * direction id or honestly marked as not being one.
 */
export function directionOf(knobs: IkKnobs): string {
  const hit = IK_DIRECTIONS.find((d) =>
    IK_KNOB_KEYS.every((k) => knobs[k] === (d.knobs[k] ?? IK_DEFAULTS[k]))
  );
  return hit ? hit.id : "";
}

/** The stamp's knob half: every knob, in registry order, always. */
export function knobString(knobs: IkKnobs): string {
  return IK_KNOB_KEYS.map((k) => `${k}=${knobs[k]}`).join(",");
}

/* ── The rest of the state ────────────────────────────────────────────────── */

export const IK_VIEWS = ["panel", "sheet"] as const;
export type IkView = (typeof IK_VIEWS)[number];

export const IK_MOUNTS = ["kit", "shipped"] as const;
export type IkMount = (typeof IK_MOUNTS)[number];

export type IkTheme = "dark" | "light";

export const IK_WAVE = registry.wave as {
  lane: string;
  viewports: string[];
  themes: string[];
  note: string;
};

export interface IkQuery {
  knobs: IkKnobs;
  k: string;
  view: IkView;
  mount: IkMount;
  theme: IkTheme;
  row: string;
  consoleOn: boolean;
}

/**
 * The URL, read once per mount.
 *
 * ⚠ A MISSING PARAMETER IS NOT A ZERO VALUE. `?k=` names a direction and its
 * knobs seed the set; an explicit knob parameter then overrides that seed, so
 * `?k=KJ&tab=fill` is a legal one-axis question about the composite. An unknown
 * value falls back to the default rather than throwing, because a lab that
 * white-screens on a typo in a capture matrix costs a whole run.
 */
export function parseIkQuery(sp: URLSearchParams): IkQuery {
  const k = sp.get("k") ?? "";
  const seeded = IK_DIRECTION_IDS.includes(k) ? knobsFor(k) : { ...IK_DEFAULTS };

  const knobs = { ...seeded };
  for (const key of IK_KNOB_KEYS) {
    const raw = sp.get(key);
    if (raw && KNOBS[key].values.includes(raw)) knobs[key] = raw;
  }

  const view = sp.get("view");
  const mount = sp.get("mount");
  const theme = sp.get("theme");

  return {
    knobs,
    k: directionOf(knobs),
    view: (IK_VIEWS as readonly string[]).includes(view ?? "") ? (view as IkView) : "panel",
    mount: (IK_MOUNTS as readonly string[]).includes(mount ?? "") ? (mount as IkMount) : "kit",
    theme: theme === "light" ? "light" : "dark",
    row: sp.get("row") ?? "",
    consoleOn: sp.get("console") !== "0",
  };
}
