/**
 * Shapes for the proof dossier — the terminal case-file window.
 *
 * ZERO IMPORTS, deliberately (the `lib/cases/types.ts` law, restated one
 * layer out): the dossier's content is plain data assembled by whoever
 * mounts it — the lab from `PROOF_CASE` + lab extras today, `lib/cases`
 * directly once a `CaseDossier` field lands there. Keeping the component
 * on a prop rather than a registry import is what lets the same file
 * serve both without a fork.
 *
 * Every string here is PRINTED. The `.claude/rules/proof.md`
 * confidentiality envelope applies to all of it: no money, no internal
 * links or repo names, first names only, no markup smuggled into copy
 * (emphasis is upright gold, never italics).
 */

/** One cell of the meta register — CLIENT / ROLE / PERIOD / STATUS. */
export interface DossierMetaCell {
  label: string;
  value: string;
}

/** One gauge cell of the stat strip. */
export interface DossierStat {
  value: string;
  label: string;
  /** Mono qualifier under the label. */
  detail?: string;
}

/** A chronological register row (Navigate's rollout log). */
export interface DossierLogRow {
  t: string;
  event: string;
}

/** A registry row (Encode's skills register). */
export interface DossierRegistryRow {
  team: string;
  name: string;
  tag?: string;
}

/** A tool row (Build's production strip). Codenames are in scope for a
 *  case study — published precedent is `PROJECT_CASES`.
 *
 *  No metric field on purpose: `PROJECT_CASES` metrics are label-bearing
 *  ("0%" means "margin vs. Krea"), and a bare value in a three-column row
 *  reads as noise at best and as a different claim at worst. The numbers
 *  live in the stat strip; this register's evidence is the four names. */
export interface DossierToolRow {
  codename: string;
  tagline: string;
}

/**
 * The mini instrument inside a phase panel — one excerpt of that beat's
 * full visual, never the whole thing. A `kind` is added here only when a
 * phase needs a genuinely different row grammar.
 */
export type DossierExcerpt =
  | { kind: "log"; title: string; rows: readonly DossierLogRow[] }
  | { kind: "registry"; title: string; rows: readonly DossierRegistryRow[] }
  | { kind: "tools"; title: string; rows: readonly DossierToolRow[] };

/** One Arc phase, as a sub-window of the dossier. */
export interface DossierPhase {
  /** Stable id — drives the tab/panel `aria` wiring. */
  id: string;
  /** Ordinal shown on the soft key, e.g. "01". */
  num: string;
  /** Soft-key name, e.g. "NAVIGATE". */
  name: string;
  /** Sub-window title bar, e.g. "PRF / NAVIGATE · 01". */
  desig: string;
  /** The one-line pattern this beat proves. */
  pattern: string;
  /** The single receipt row, gold-diamond prefixed. */
  receipt: string;
  excerpt: DossierExcerpt;
}

/** Everything the window renders. */
export interface DossierContent {
  /** Seeds the coord stamp + barcode — stable across renders. */
  slug: string;
  /** The three title-bar segments, left → right. `state` is the one gold chip. */
  bar: { mark: string; case: string; state: string };
  /** Plain-text form of the case segment — the stable heading label while
   *  the visible characters decode. */
  caseLabel: string;
  meta: readonly DossierMetaCell[];
  summary: string;
  stats: readonly DossierStat[];
  phases: readonly [DossierPhase, DossierPhase, DossierPhase];
}
