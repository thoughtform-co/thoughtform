/**
 * lib/cases — client case studies (ADR-054).
 *
 * A "case" is one client engagement told as a MISSION REPORT plus three
 * beats that map the engagement onto the Arc (Navigate → Encode → Build).
 * First consumer: the landing `#proof` station, whose markup is generated
 * at parse time by `lib/v7-parse/proofStation.ts`. Future consumer:
 * `/cases/[slug]` subpages — `slug` + `meta` exist for that and nothing
 * else here is speculative.
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

export interface CaseDef {
  /** Route segment for a future `/cases/[slug]`. Kebab-case, unique. */
  slug: string;
  client: string;
  report: CaseReport;
  /** Exactly the Arc — the tuple pins the count, a test pins the order. */
  beats: readonly [CaseBeat, CaseBeat, CaseBeat];
  /** Subpage metadata — the only forward-looking fields in the model. */
  meta: { title: string; description: string };
}
