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

/**
 * One shape of work on a registry plate. The gloss says what the shape IS;
 * the optional trio below says how much of the portfolio sits on it, and is
 * what turns the plate from a taxonomy into a WEIGHTED map (ADR-056 U12).
 *
 * Shared by both surfaces: the beat and the casefile track hold the same
 * array by reference, and `cases-registry.test.ts` pins that identity. The
 * fields are optional so a second case can carry an unweighted registry —
 * the renderer branches on `count` and falls back to name + gloss.
 */
export interface CaseRegistryGroup {
  name: string;
  gloss: string;
  /**
   * Skills tagged to this shape, e.g. "12". DIGITS ONLY: the renderer sizes
   * the bar from `Number(count)`, so the printed figure and the drawn bar
   * cannot disagree. All-or-none within a plate (pinned).
   */
  count?: string;
  /** How far the shape spreads, e.g. "9 teams". */
  teams?: string;
  /* NO `samples` FIELD, and this is a measurement not an omission. A second
     line per group naming two Skills cost 71px, which the plate box only has
     above ~970h: it clipped 59px at 1440×820 and 39px at 1600×900. Shipping
     it behind a min-height rung would have made it copy that renders on one
     desktop in ten — the same "dead copy someone will later edit believing
     it ships" the MAP_ROWS footer note bans. The exemplar rows underneath
     already name real Skills, which was most of what it bought. */
}

/** One exemplar row under a registry plate's groups. */
export interface CaseRegistryRow {
  team: string;
  name: string;
  /** What runs it — "Skill", "Tool" or "Human". */
  tag?: string;
}

/**
 * One Skill in the casefile's browsable portfolio (ADR-056 U13) — the
 * minimal public record: what it is called, whose work it encodes, which
 * of the five shapes it belongs to, and how far along it is.
 *
 * `engine` is the EXACT `CaseRegistryGroup.name` it files under — the
 * browser groups by matching the strings, and the registry test pins
 * that every skill's engine names a real group AND that each group's
 * printed `count` equals its skill-list length. That closes the loop the
 * weighted plate opened: the count, the bar-…-turned-tab and the chips a
 * reader can count are one dataset or the test is red.
 *
 * Confidentiality: NO owner field, deliberately — the source data carries
 * per-skill owners ("Toby + Maud") and those are client staff. Team and
 * status only.
 */
export interface CaseSkillEntry {
  /** Display name, ≤30 chars (the dossier heading and the cell's label). */
  name: string;
  /** The client team whose judgment it encodes. */
  team: string;
  /** Which shape of work runs it — must equal a group's `name`. */
  engine: string;
  /** Exec-honest lifecycle: "In use" | "Shipped" | "In build" | "Scoped". */
  status: string;
  /**
   * What the Skill does, in one or two sentences — the dossier's body
   * (ADR-056 U14). U13 held this back deliberately ("per-skill body copy,
   * internal workflow detail"); the owner reversed that when the plate
   * split into map + dossier, because a map you can click that answers
   * with four words is a worse plate than the tab strip it replaced.
   *
   * ⚠ REWRITTEN FROM the client's own copy, never pasted: the source
   * carries owner names, version markers, workshop dates and the internal
   * vendor stack, none of which travel. What travels is what the Skill
   * does. All-or-none within a plate, so no cell answers with a blank.
   *
   * ≤150 chars — four clamped lines at `--fl-copy * 0.92` against the
   * dossier's ~40-character measure, THREE at ≤800h. The box clips
   * silently, so the ceiling is pinned by `cases-registry.test.ts`.
   */
  summary?: string;
}

/* ── The intelligence map's projections (ADR-056 U16 → U17) ──────────────
   The map is not just Skills: it is the CONFIGURATION — which intelligence
   runs which work — and the allocation of work across it. ONE dataset,
   THREE PROJECTIONS of a single persistent tile field (substrate · team ·
   allocation); presence of `intelligence` on the track's registry visual
   is what turns the third projection on, so a second client without the
   data keeps the two-way lattice. TRACK-SIDE ONLY, like `skills`.

   ⚠ U16's STACK view (four layers: tools/Skills/connectors/models) was
   DELETED in U17 by owner ruling: it restated the row's own brief and the
   four blocks in the panel foot. Its content lives on in the brief, the
   blocks and the tools directory row — do not restore it from memory.

   Numbers policy, pinned by the registry test and rules/proof.md: SHARES,
   RATIOS AND REACH FRACTIONS ONLY — never currency, never a per-seat cost
   (the €/month band is a deck-page claim), never client staff names. All
   figures are rounded/illustrative by owner ruling (2026-08-03); the
   derivation from the client's usage snapshots lives in the content
   module's comments, not on the surface. */

/** One rung of the allocation ladder, lightest tier first — and, since
 *  U17, one COLUMN of the allocation projection: the Skills whose team
 *  leans on this tier regroup underneath it, and the reach/draw pair
 *  renders in the column head. GENERIC capability names by owner ruling
 *  (2026-08-03) — never model families: the landing stays model-silent
 *  and survives model churn. */
export interface CaseModelTier {
  /** "Fast" | "Everyday" | "Deep" | "Frontier", ≤10 chars. */
  name: string;
  /** ≤20 chars — the column head clamps it to two lines at ~87px. */
  note?: string;
  /** Share of active seats that touched the tier, 0–100 (rounded). */
  reach: number;
  /** Share of consumption, 0–100 (rounded; the four sum to ~100). */
  draw: number;
}

/** One litmus exemplar — the "token cost = justified by the work" read. */
export interface CaseAllocationRead {
  /** One of the published team names (must exist in `skills`). */
  team: string;
  /** ≤16 chars — "Chat-led" | "Code-led" | "Widest spread". */
  lens: string;
  /** ≤80 chars — the justification, two clamped lines at the reads
   *  column's ~40-char measure. */
  why: string;
}

/** The map's higher-level dataset — see the block comment above. */
export interface CaseIntelligence {
  /** Exactly four tiers, lightest first. Also the allocation projection's
   *  four columns. */
  tiers: readonly CaseModelTier[];
  /** Two or three exemplars. */
  reads: readonly CaseAllocationRead[];
  /** Optional trend, oldest point first, e.g. frontier share of draw
   *  across three months. Dropped ≤800h, so never load-bearing. */
  trend?: {
    /** ≤32 chars. */
    label: string;
    points: readonly { stamp: string; value: string }[];
  };
}

/** One team's place in the consumption picture (the gradient — owner:
 *  "cluster the type of teams or skills based on the work and token
 *  consumption"). Two independent joins off one row:
 *
 *   · `band` paints the team-axis mark AND, in the allocation projection,
 *     each of the team's tiles — four steps on the same gold scale as the
 *     lifecycle fills, so one legend serves both.
 *   · `tier` decides WHICH COLUMN the team's tiles fly to in allocation.
 */
export interface CaseTeamDraw {
  /** Must match a team that appears in `skills`. */
  team: string;
  band: "light" | "steady" | "deep" | "intensive";
  /**
   * The tier this team LEANS ON — the one carrying its dominant draw in
   * the usage snapshots. Must name one of the case's `CaseModelTier`s;
   * membership is pinned by `cases-registry.test.ts` rather than by the
   * type, because tier names are per-case data (the same pattern as a
   * skill's `engine` naming a registry group).
   */
  tier: string;
}

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
      groups: readonly CaseRegistryGroup[];
      rows: readonly CaseRegistryRow[];
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

/**
 * One achievement tile in a track's 2×2 foot (ADR-056 U12) — the same
 * grammar the tool gallery's capability tiles use, with an OPTIONAL figure.
 * That option is the whole point: a readout row can only say things that
 * reduce to a number, and the claims worth making about an engagement do
 * not all reduce to one. A block with no `stat` is not a lesser block.
 *
 * BUDGETS, pinned by `cases-registry.test.ts` and measured against the
 * t7→t11 foot band, which is ~160px at 1280×720 and ~180px at 1440×800:
 *   · `stat` ≤4 chars — it prints at display size on one line.
 *   · `title` ≤26 chars — mono caps, `white-space: nowrap` with an ellipsis,
 *     against a half-rail of ~330px. It does not wrap; it truncates.
 *   · `desc` ≤95 chars — two clamped lines, ONE on short viewports, so the
 *     first ~40 characters must carry the sentence.
 * Exactly four blocks: the grid is 2×2 and a fifth silently falls out of
 * the box.
 *
 * A track carries `blocks` OR `readouts`, never both — the foot has one
 * slot. The either/or is pinned, not conventional.
 */
export interface CaseBlock {
  /** The figure, when the claim has one, e.g. "47+". Absent = a text tile. */
  stat?: string;
  title: string;
  desc: string;
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
      groups: readonly CaseRegistryGroup[];
      rows: readonly CaseRegistryRow[];
      /**
       * The browsable portfolio (ADR-056 U13). TRACK-SIDE ONLY — the beat's
       * registry stays name + gloss + exemplar rows, so this field does not
       * exist on `CaseVisual`. When present the casefile plate renders the
       * skills lattice INSTEAD of the exemplar rows; `rows` stays in the
       * data because the beat still renders it and the plate-sharing guard
       * still asserts it shared.
       */
      skills?: readonly CaseSkillEntry[];
      /**
       * The map's higher-level views (ADR-056 U16). Presence turns the
       * plate's view tabs on: SKILLS (the lattice) · STACK (the four
       * layers of the configuration) · ALLOCATION (reach vs draw, and why
       * the deep work earns the deep tier). Also track-side only.
       */
      intelligence?: CaseIntelligence;
      /** Per-team consumption bands for the lattice's TEAM axis. */
      teamDraw?: readonly CaseTeamDraw[];
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
  /** Human name for this row, and the brief's DISPLAY HEADING since
   *  2026-07-30 (the client moved to the tab).
   *
   *  IT MUST CORRESPOND TO `file` (owner rule, 2026-07-31): the directory
   *  row and the heading name the same thing, so `01_AI-FLUENCY-STUDIO/`
   *  reads "AI Fluency Studio" and nothing else. Pinned by
   *  `cases-registry.test.ts` — rename BOTH, or the guard fails.
   *
   *  ≤20 chars: at the 24px cap that is ~290px against a ~340px column, and
   *  the slot must never wrap — the brief is height-boxed, so a second line
   *  reflows everything under it. */
  project: string;
  icon: "doc" | "dir";
  /** Panel head, left slot. */
  preview: string;
  /** Panel head, right slot. */
  vizLabel: string;
  visual: CaseTrackVisual;
  /**
   * Two to four readout tiles under the plate. OPTIONAL since ADR-056 U12,
   * and exactly one of `readouts` / `blocks` is present — a track whose foot
   * is blocks has no readouts at all, rather than an empty array the next
   * author would read as an invitation to fill it.
   */
  readouts?: readonly CaseReadout[];
  /**
   * The 2×2 achievement foot, replacing `readouts` on this track. Four
   * tiles; see `CaseBlock` for the budgets and the either/or law.
   *
   * ⚠ A blocks foot DROPS the context register and the provenance line —
   * three-line tiles plus both would overrun the band at 1440×800. That is
   * the tool gallery's precedent ("while a tool is in view the foot is the
   * capabilities and NOTHING else"), and it means `context` / `source`
   * below are carried but unrendered on such a track. They stay in the data
   * because they are the row's provenance whether or not the foot has room.
   */
  blocks?: readonly CaseBlock[];
  /** Dotted-leader rows. Values stay ≤20 chars — the leader needs a
   *  non-wrapping value, so a long one runs into the next column. */
  context: readonly { k: string; v: string }[];
  /** Mono provenance line at the foot of the panel. */
  source: string;
  /**
   * This row's own brief paragraph, replacing the casefile's standing one
   * while the row is selected (2026-08-01, ADR-056 U11). Optional: the seven
   * rows without one keep `CaseCasefile.brief`, which has to serve all of
   * them and therefore cannot be specific to any.
   *
   * ⚠ SAME SILENT HEIGHT BOX as the casefile brief — `.fl-brief` is boxed
   * against the `--fl-t6` seam with `overflow: hidden` and no scrollbar, so
   * an overlong brief just loses its tail, and only on short viewports.
   * The U11 tick move raised the budget to roughly 330 characters at
   * 1280x720 (from ~195); `cases-registry.test.ts` pins that ceiling.
   * Measure at 1280x720 after any edit — the taller viewports will not tell
   * you.
   *
   * NOT a decode target, which is why this is safe where a per-track
   * `classLine` is not: the reveal caches its `data-fl-text` nodes once per
   * CLIENT, so a track-reactive decode target goes stale on the first row
   * switch.
   */
  brief?: readonly CaseSegment[];
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
  /* `title` (the client wordmark as a display heading) was removed
     2026-07-30 (owner). The client is named ONCE, by the tab strip, which
     now carries it at display size — so the brief's heading slot belongs to
     the SELECTED TRACK's `project` instead. `tab` is the only client label
     left, and it is the decode target. */
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
