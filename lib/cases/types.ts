/**
 * lib/cases — client case studies (ADR-054, placement superseded by ADR-056).
 *
 * A "case" is one client engagement told as a MISSION REPORT plus three
 * beats that map the engagement onto the Arc (Navigate → Encode → Build),
 * plus a CASEFILE — the same evidence recomposed as one interactive
 * viewport: a client tab strip, a terminal directory, and a panel that swaps
 * per row.
 *
 * Live consumer: `components/landing/home-v2/services/casefile/`, mounted at
 * the top of `#services` over the parked brandmark (ADR-056). The ADR-054
 * `#proof` station and its parse-time generator (`lib/v7-parse/proofStation.ts`)
 * are retired; `report` and `beats` survive because the casefile's tracks are
 * built from them — the beats are still the single source of the evidence
 * plates. Future consumer: `/cases/[slug]` subpages — `slug` + `meta` exist
 * for that and nothing else here is speculative.
 *
 * DISTINCT from two neighbours that share vocabulary (LANGUAGE.md):
 *   · `components/landing/home-v2/arc-cases/` — the corridor's in-canvas
 *     card showing the four production TOOLS. It belongs to the Arc.
 *   · `lib/arcs/` — client deck pages under `/arcs/[slug]` ("arc pages").
 *
 * Content is data. This module must stay free of ALL imports — types
 * only — so a renderer can consume it from a server module without
 * dragging anything into the landing's First Load JS.
 */

/**
 * Split title with the upright-gold emphasis pivot. The site rule is no
 * italics anywhere — `em` renders `font-style: normal; color: var(--gold)`.
 */
export interface CaseTitle {
  pre?: string;
  em?: string;
  post?: string;
}

/**
 * Inline copy carrying at most one gold-wash emphasis span per line — the
 * corridor caption marker (gold ink on a 16% gold wash), never italics.
 */
export type CaseSegment = string | { em: string };

export interface CaseImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface CaseMetaRow {
  label: string;
  value: string;
}

/** One mission-report stat tile. */
export interface CaseStat {
  /** The number as it reads, e.g. "22" or "5 → 130+". */
  value: string;
  /** What it counts, e.g. "workshops run". */
  label: string;
  /** Mono subline qualifying the count, e.g. "one per team". */
  detail?: string;
  /**
   * Provenance for maintainers — source system and snapshot date.
   * RENDERED NOWHERE; it lives in the data so a later editor can tell a
   * board count from an estimate without re-running the harvest.
   */
  source?: string;
}

/** The Arc phases a case's beats map onto, in order. */
export type CasePhase = "navigate" | "encode" | "build";

/** A beat's evidence plate. Discriminated like `ArcSection` (ADR-052). */
export type CaseVisual =
  | { kind: "image"; image: CaseImage; caption?: string }
  | { kind: "video"; src: string; poster: string; alt?: string; caption?: string }
  /** Chronological terminal register — mono stamp + event per row. */
  | {
      kind: "log";
      title: string;
      rows: readonly { t: string; event: string }[];
      tail?: string;
    }
  /** Grouped registry plate — category glosses above sampled rows. */
  | {
      kind: "registry";
      title: string;
      groups: readonly { name: string; gloss: string }[];
      rows: readonly { team: string; name: string; tag?: string }[];
      footer?: string;
    }
  /**
   * Compact strip referencing production tools BY ID. `PROJECT_CASES`
   * (`components/landing/v7/tools-cards/toolCardData.ts`) stays the single
   * canonical source for their codename / tagline / metric / image — the
   * renderer resolves them, this module stores only ids. Referential
   * integrity is pinned by `tests/lib/cases-registry.test.ts`.
   */
  | { kind: "tool-strip"; toolIds: readonly string[] };

export interface CaseBeat {
  /** DOM id — the anchor target the corridor section menu scrolls to. */
  id: string;
  phase: CasePhase;
  title: CaseTitle;
  /** One or two short paragraphs. Emphasis belongs in `closer`. */
  body: readonly string[];
  /** Mono receipt lines (gold diamond prefix), at most two. */
  receipts?: readonly string[];
  /** At most one pull-quote per beat; attribution is FIRST NAME · TEAM. */
  quote?: { text: string; attribution: string };
  /** One emphasized editorial line closing the beat. */
  closer?: readonly CaseSegment[];
  visual: CaseVisual;
}

export interface CaseReport {
  title: CaseTitle;
  lede: string;
  /** Three to five tiles. More than five stops reading as a summary. */
  stats: readonly CaseStat[];
  /** CLIENT / ROLE / PERIOD / STATUS. */
  meta: readonly CaseMetaRow[];
}

/* ── The casefile (ADR-056) ──────────────────────────────────────────────
   The same evidence as `report` + `beats`, recomposed as ONE interactive
   viewport at the top of `#services`. The report becomes the opening row of
   a directory; the beats become tracks alongside the bodies of work they do
   not cover. Nothing here duplicates a beat's plate — the tracks reference
   the same `CaseVisual` objects. ──────────────────────────────────────── */

/** One vertex on the adoption-signal curve. `x` runs 0 → 1 across the
 *  timeline, `y` 0 (floor) → 1 (present). Data, not a drawn path: a second
 *  client's curve is four numbers, not a new bezier. */
export interface CaseSignalPoint {
  x: number;
  y: number;
  /** Mono stamp above the label, e.g. "26.Q2". */
  stamp: string;
  label: string;
}

/** One readout tile under a track's plate. */
export interface CaseReadout {
  value: string;
  label: string;
}

/** One film on a `films` plate. Poster-first by contract: the plate renders
 *  a still and the `<video>` element does not exist until the viewer asks
 *  for it, so a row nobody opens costs zero bytes and zero layers. */
export interface CaseFilm {
  src: string;
  poster: string;
  /** Mono label under the tile, e.g. "Smug Owl · Loop ATL". */
  label: string;
  /** Mono meta under the label, e.g. "16:9 master · 30 sec". */
  meta: string;
}

/**
 * A track's evidence plate. The three shared kinds are the `CaseVisual`
 * objects the beats already carry; `signal`, `register` and `readouts` exist
 * only in the casefile format.
 */
export type CaseTrackVisual =
  | { kind: "signal"; points: readonly CaseSignalPoint[]; t0: string; now: string }
  | { kind: "log"; rows: readonly { t: string; event: string }[]; tail?: string }
  | {
      kind: "registry";
      groups: readonly { name: string; gloss: string }[];
      rows: readonly { team: string; name: string; tag?: string }[];
      footer?: string;
    }
  /** References production tools BY ID — `PROJECT_CASES` stays canonical. */
  | { kind: "tools"; toolIds: readonly string[] }
  | { kind: "register"; rows: readonly { k: string; v: string }[]; footer?: string }
  /** Shipped work, shown WHOLE — tiles fit by height so nothing is cropped,
   *  and in natural colour. The gold is the frame, never the picture (the
   *  duotone on `tools` is a UI-capture treatment, not a content one). */
  | { kind: "stills"; shots: readonly CaseImage[] }
  | { kind: "films"; films: readonly CaseFilm[] }
  /** The readout block IS the plate. Used by the metrics row. */
  | { kind: "readouts" };

/** One directory row and the panel it swaps in. */
export interface CaseTrack {
  /** DOM id fragment, kebab-case and unique within the case. */
  id: string;
  /** The row's filename, rendered verbatim in mono caps. */
  file: string;
  /** The row's right-hand meta, e.g. "22 WORKSHOPS". */
  meta: string;
  /** Human name for this row, shown under the client name in the brief —
   *  the filename says `01_STUDIO/`, this says what that IS. Keep it ≤24
   *  chars: the brief column is height-boxed, so a second line pushes the
   *  class line and reflows everything under it. */
  project: string;
  icon: "doc" | "dir";
  /** Panel head, left slot. */
  preview: string;
  /** Panel head, right slot. */
  vizLabel: string;
  visual: CaseTrackVisual;
  /** Two to four tiles under the plate. */
  readouts: readonly CaseReadout[];
  /** Dotted-leader rows. Values stay ≤20 chars — the leader needs a
   *  non-wrapping value, so a long one runs into the next column. */
  context: readonly { k: string; v: string }[];
  /** Mono provenance line at the foot of the panel. */
  source: string;
  /** Foot telemetry for this row — `◆ {ord} · {phase} · {ref} · {state}`,
   *  where `state` stays the casefile's. Absent falls back to the standing
   *  `00 · Field log · {logCode}` line, so this is additive. */
  stamp?: { ord: string; phase: string; ref: string };
}

export interface CaseCasefile {
  /** Tab ordinal, e.g. "01". */
  ix: string;
  /** Tab label, mono caps. */
  tab: string;
  /** TF-<year of first contact>. */
  logCode: string;
  state: string;
  title: CaseTitle;
  classLine: string;
  brief: readonly CaseSegment[];
  /* `logEntry` (the operator's first-person `Log.001 >` line) was removed
     2026-07-29 (owner) along with the header chrome — the brief ends on its
     own paragraph. The quote grammar survives on the BEATS (`CaseBeat.quote`),
     which is a different field and still renders. */
  tracks: readonly CaseTrack[];
}

export interface CaseDef {
  /** Route segment for a future `/cases/[slug]`. Kebab-case, unique. */
  slug: string;
  client: string;
  report: CaseReport;
  /** Exactly the Arc — the tuple pins the count, a test pins the order. */
  beats: readonly [CaseBeat, CaseBeat, CaseBeat];
  /** The interactive surface at the top of `#services` (ADR-056). */
  casefile: CaseCasefile;
  /** Subpage metadata — the only forward-looking fields in the model. */
  meta: { title: string; description: string };
}
