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
  /** Stable machine identity. Display-name edits must not break joins. */
  id: string;
  /** Display name, ≤30 chars (the dossier heading and the cell's label). */
  name: string;
  /**
   * The card label — the client's own shorthand, ≤14 characters.
   *
   * ⚠ **AUTHORED, NEVER TRUNCATED.** The PDA's reading 03 letters one
   * Skill per plate in a 132-unit window, which is 14 characters at the
   * surface's fs floor; `name` runs to 30. Machine-clipping "Legal Risk
   * Methodology" gives "Legal Risk Met", so the short form is written by
   * hand from what people already say in Slack and on Monday — "Legal
   * Risk", "VSME Reporting", "NDA Pre-Check". `name` stays the record's
   * canonical form for surfaces with room to letter it.
   *
   * Required on every Skill, so the drawing has one field to walk and
   * the fit guard has one field to measure. The ≤14 cap is pinned by
   * `cases-registry.test.ts` and re-measured by `pda-substrate-fit`.
   */
  short: string;
  /**
   * The pattern's FIRST encode — the Skill that cut the substrate its
   * siblings then reused. Exactly one per engine, five in total, and
   * `cases-registry.test.ts` fails on a sixth or a missing one.
   *
   * This is the pin grid's `CUT BY` grammar carried down one level: that
   * reading attributed a pattern to the DEPARTMENT that paid to open it,
   * and reading 03 now names the Skill itself, so the green mark points
   * at the same fact with a finer finger.
   */
  flagship?: true;
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

/** The five public work shapes that organise both Skills and configurations. */
export type CaseWorkShape = "Judgment" | "Voice" | "Validation" | "Stakeholder" | "Pattern";

/** Generic capability tiers. Public case content never names a model family. */
export type CaseCapabilityTier = "Fast" | "Everyday" | "Deep" | "Frontier";

/* ── The work-to-intelligence map's record (ADR-062) ─────────────────────
   The map is drawn as a city in three sheets — the board (every work stream
   as a module on its team's district plate), the unit (one module exploded
   into its configuration), and below grade (the shared substrate as mains,
   each district dropping a riser to tap what it uses). Everything renders
   from the three arrays below; nothing is hard-coded in geometry except the
   district grid, and every published total is DERIVED from them.

   ⚠ ADR-061's work-configuration field — `CaseWorkConfiguration`, its six
   categorical facets and the allocation basis — was deleted, not amended.
   The atom is a work stream with a drawn configuration, not a tile with a
   facet signature. Do not restore the facet shape from memory.

   Confidentiality is unchanged and enforced by `cases-registry.test.ts`:
   generic capability lanes only, role titles rather than people, no vendor
   or model family, no currency in any form. */

/** Lowercase routing key for a shape of judgment; `label` carries the public
 *  spelling, so the five shapes stay ONE taxonomy shared with the Skills. */
export type CaseMapShapeKey = "voice" | "judgment" | "validation" | "stakeholder" | "pattern";

/**
 * One shape of judgment, drawn below grade as a main. `first` names the work
 * stream that PAID to encode it — every stream after that taps a main which
 * already existed, which is the whole economic argument of the third sheet.
 */
export interface CaseMapShape {
  key: CaseMapShapeKey;
  label: CaseWorkShape;
  /** Skills tagged to this shape. The five sum to the case's Skills total. */
  skills: number;
  /** `CaseMapWork["id"]` of the stream that trenched this main. */
  first: string;
  /** What the shape means, ≤44 chars — read in the hover card. */
  gloss: string;
  /**
   * How work on this shape is CHECKED — the eval method the Skills in it
   * share, ≤24 chars. The gloss says what the shape means; this says what
   * "good" is tested against, which is the thing that makes a substrate
   * inheritable: a second team takes the method without taking anyone's
   * judgment. Generic by law — a method, never a tool, a vendor or a score.
   */
  evalMethod: string;
}

/** A team, drawn as a district plate on the board. */
export interface CaseMapDistrict {
  /** Three-letter routing id, e.g. "CRE". */
  id: string;
  /** Plaque name on the board, e.g. "CREATIVE + STUDIO". */
  name: string;
  /** Abbreviation for the below-grade footprint, where there is no room. */
  ab: string;
}

/**
 * A work stream's intelligence configuration — the four questions the seat is
 * chartered on, plus why this lane. Each pair is `[name, note]`; the drawing
 * renders the name and the hover card the note, so provenance is carried by
 * the material language and never also written down (ADR-062, the v11 → v13
 * lesson).
 */
export interface CaseMapConfiguration {
  /** Owner role + what that seat actually owns. */
  p: readonly [string, string];
  /** Skill name + what it is composed of. */
  s: readonly [string, string];
  /** Capability lane + the verbs it runs. */
  m: readonly [string, string];
  /**
   * THE AGENT THAT RUNS IT — reading 02's WHERE IT RUNS, paired with `u`.
   * What the runtime IS: `Briefing agent`, `Image + video suite`,
   * `Chat assistant`, `Scheduled agent`, `Editor plugin`, `Coding agent`.
   *
   * ⚠ **NOT A CODENAME (owner, 2026-08-11).** This field briefly carried
   * `Mímir` and `Vesper`, which are published on the tools row of this same
   * casefile — but the verdict on seeing them here was that _"no
   * external-facing party knows what Mímir is"_, and he is right: on the
   * tools row a codename sits beside a screenshot and a walkthrough that
   * explain it, while on the map it sits alone in a cell. A codename is
   * PROVENANCE; this field has to be an ANSWER. The shipped tools' own
   * public tab labels are what they are called here.
   *
   * ⚠ A SINGLE STRING, DELIBERATELY, while every neighbour is a
   * `[name, note]` pair. ADR-070 U7 is what a spare half costs: `p[1]` went
   * unlettered on four consecutive drawings because nothing asked where it
   * had gone. This one letters its name and has no readout behind it, so
   * there is no second half to strand.
   *
   * ⚠ NEVER A MODEL OR VENDOR NAME. The map's envelope is stricter than the
   * casefile's — `cases-registry` fails on any model family, and the LANE
   * (`m`) is where model class is answered, generically. Tool CODENAMES are
   * in scope (published precedent: PROJECT_CASES, row 02 of this casefile).
   */
  a: string;
  /** Context name + what it carries. */
  c: readonly [string, string];
  /** Graph node + what it holds. Drawn in the adjacent-domain hand. */
  g: readonly [string, string];
  /** Systems it acts on. */
  k: readonly [string, ...string[]];
  /** Where it is met. */
  u: readonly [string, ...string[]];
  /** Who answers for the gate once it runs. */
  o: string;
  /** Why this lane and not a lighter one. One sentence. */
  why: string;
}

/**
 * One work stream — a module on the board, and the subject of sheet 02.
 *
 * `lane === null` is PERSON-LED work, and it stays on every sheet by design:
 * a map that only shows what was configured shows what was built and hides
 * what was not. The negative space is what leadership reads.
 */
export interface CaseMapWork {
  /** Stable, non-display id, e.g. "W-017". */
  id: string;
  title: string;
  /** `CaseMapDistrict["id"]`. */
  dist: string;
  /** Generic capability lane; `null` ⇔ person-led ⇔ `cfg === null`. */
  lane: CaseCapabilityTier | null;
  /** Shapes of judgment this stream draws on. */
  shapes: readonly CaseMapShapeKey[];
  /** How much it decides alone — drawn as a dimension, because it is a
   *  distance between the owner and the machine, not another component. */
  seat: "ABOVE" | "EDGE" | "INSIDE" | "PERSON";
  vol: "LOW" | "MID" | "HIGH";
  /** Draw meter cells, 0–5. Read against the workload, NEVER a price. */
  mass: 0 | 1 | 2 | 3 | 4 | 5;
  /** What good looks like for this stream. */
  bar: string;
  /** The gate it leaves through. */
  evals: string;
  cfg: CaseMapConfiguration | null;
}

/**
 * A CHAIN — one run of work as it crosses departments.
 *
 * The reason the map is cross-functional rather than six good team-level
 * views. A campaign runs brief to on-visual copy to declination to listing;
 * several of those steps already have encoded Skills, owned by different
 * departments, built at different times, with a person carrying the context
 * across every handoff. That they form a chain is only visible from the
 * accumulated record — no team sees the crossing from inside.
 *
 * Ordered, and named, rather than a `next` pointer on each work stream: a
 * pointer records that two things touch, and what this has to publish is the
 * RUN, with a name a reader can hold and a note saying what it is.
 *
 * ⚠ A chain may pass THROUGH person-led work. That is not a gap in the
 * record — it is the handoff the person is carrying, drawn.
 */
export interface CaseMapChain {
  /** Stable, non-display id. */
  id: string;
  /** What the run is called, e.g. "Campaign chain". */
  label: string;
  /** One sentence on what crosses, ≤120 chars. */
  note: string;
  /** `CaseMapWork["id"]`s in the order the work moves through them. */
  steps: readonly [string, string, ...string[]];
}

/* ── The intelligence map's projections (ADR-056 U16 → U17) ──────────────
   The map is not just Skills: it is the CONFIGURATION — which intelligence
   runs which work — and the allocation of work across it. ONE dataset,
   THREE PROJECTIONS of a single persistent tile field (configuration · team ·
   allocation); presence of `intelligence` on the track's registry visual
   is what turns the third projection on, so a second client without the
   data keeps the two-way lattice. TRACK-SIDE ONLY, like `skills`.

   ⚠ U16's STACK view (four layers: tools/Skills/connectors/models) was
   DELETED in U17 by owner ruling: it restated the row's own brief and the
   four proof claims. Its content lives on in the brief, the left proof
   register and the tools directory row — do not restore it from memory.

   Numbers policy, pinned by the registry test and rules/proof.md: SHARES,
   RATIOS AND REACH FRACTIONS ONLY — never currency, never a per-seat cost
   (the €/month band is a deck-page claim), never client staff names. All
   figures are rounded/illustrative by owner ruling (2026-08-03); the
   derivation from the client's usage snapshots lives in the content
   module's comments, not on the surface. */

/** One rung of the allocation ladder, lightest tier first. The configurations
 *  assigned to it regroup around its attractor, and the reach/draw pair
 *  renders in that anchor. GENERIC capability names by owner ruling
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

/** Legacy compact proof claim, normalized into the left proof register. */
export interface CaseReadout {
  value: string;
  label: string;
}

/**
 * One proof tile in a track's left-column 2×2 register. TWO TIERS: the claim,
 * then one sentence of evidence for it.
 *
 * ⚠ THE DISPLAY FIGURE IS GONE (owner, 2026-08-06), and the reason is that it
 * could never be one thing. Across the four Loop rows the sixteen `value`
 * fields carried NINE grammars — bare counts (`27`), a percentage (`97%`),
 * ratios (`19/24`), a multiplier (`2–3×`), format specs (`2 × 30 SEC`),
 * channel pairs (`YOUTUBE + CTV`), arrow pipelines (`MONDAY → FIGMA`),
 * arithmetic (`2 + 2`) and status words (`WITHIN`) — because a figure slot
 * only works if every project has a figure, and they do not. Row one's `27`
 * and `47` also restated the directory row's own `27 → 47` two boxes away.
 *
 * The counts did not disappear with it: a row's headline number lives on its
 * DIRECTORY META, which is where a count belongs, and the rest read inside
 * the sentences.
 *
 * BUDGETS are pinned by `cases-registry.test.ts`:
 *   · `title` ≤30 chars — the claim, one line at reading size;
 *   · `desc` ≤95 chars — the evidence, two lines.
 * Exactly four blocks: the proof register is a 2×2 composition.
 *
 * `glyph` came back in the other direction (2026-08-07): what the deleted
 * figure slot actually wanted was a MARK, not a number — one per claim, so
 * the four tiles read as a register of instruments rather than a paragraph
 * grid. It is a KEY, never a drawing: the pixel sets live in the renderer's
 * registry (`components/landing/home-v2/services/casefile/proofGlyphData.ts`,
 * `PROOF_GLYPHS`), because this module's header contract is ZERO IMPORTS and
 * a drawing is component-layer data. The registry test pins that every key
 * present here resolves there, so a typo fails a test rather than rendering
 * an empty cell.
 */
export interface CaseBlock {
  /** The claim, e.g. "97% of briefings involve AI". */
  title: string;
  desc: string;
  /** A `PROOF_GLYPHS` key — the mark drawn beside the claim. Optional so a
   *  second client's track can carry claims before its glyphs are drawn. */
  glyph?: string;
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

/* ── Sheets: one row, several things to show (2026-08-06, owner) ─────────
   A row whose evidence is not all one kind. The Studio row is the case that
   forced it: it showed the ads and nothing else, when the work was equally
   the RULE the studio drew for when AI may make an image and the LIMIT it
   refuses to cross. Output, rule, limit — three sheets on the shared
   `ConsoleRail`, which is what makes this cheap: the rail already exists.
   (The per-sheet `foot` sentence was removed with the console feet — owner,
   2026-08-08; git holds the copy.)

   ⚠ A SHEET IS NOT A SECOND DIRECTORY. The rows are the engagement's bodies
   of work; sheets are facets of ONE body of work. If a sheet would read as a
   separate project, it wants a row. ────────────────────────────────────── */

/** One column of a two-column comparison sheet. */
export interface CaseCompareColumn {
  /** Small-caps verdict above the name, e.g. "AI SUITABLE". */
  kicker: string;
  /** The name of the category, e.g. "Illustrative". */
  name: string;
  /** The category in its own voice — one quoted sentence. */
  claim: string;
  /** What the category is, in one or two sentences. */
  desc: string;
  /** Three exemplars. Short noun phrases, never sentences. */
  examples: readonly string[];
}

/** One titled fact on a sheet. Same shape as `ProjectCase.capabilities`, and
 *  it renders through the same `.fl-caps` grammar. */
export interface CaseFact {
  title: string;
  desc: string;
}

export type CaseSheetBody =
  | { kind: "stills"; shots: readonly CaseImage[] }
  /** Exactly two columns — a comparison with three sides is a table. */
  | { kind: "compare"; columns: readonly CaseCompareColumn[] }
  /** Exactly four tiles — the 2×2 the register and the tools plate both use. */
  | { kind: "facts"; facts: readonly CaseFact[] };

export interface CaseSheet {
  /** Stable key and DOM id fragment. */
  id: string;
  /** The rail's label. The FUNCTION, in mono caps, no ordinal. */
  label: string;
  body: CaseSheetBody;
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
       * Legacy Skill-field allocation data (ADR-056 U17). Presence enables
       * its Substrate · Team · Allocation projections. New work-first maps
       * use the dedicated `intelligence-map` kind below.
       */
      intelligence?: CaseIntelligence;
      /** Per-team consumption bands for the lattice's TEAM axis. */
      teamDraw?: readonly CaseTeamDraw[];
      footer?: string;
    }
  /**
   * The work-to-intelligence map, drawn as a city in three sheets (ADR-062).
   * Kept separate from `registry` so skill-only cases retain their API.
   *
   * ⚠ `groups` and `rows` must be the SAME OBJECTS the ENCODE beat carries —
   * the registry test asserts reference identity, which is what stops the two
   * surfaces drifting. `groups[].count` also sums to the case's canonical
   * Skills total, so it stays the arithmetic a reader can check.
   */
  | {
      kind: "intelligence-map";
      groups: readonly CaseRegistryGroup[];
      rows: readonly CaseRegistryRow[];
      skills: readonly CaseSkillEntry[];
      /** The five mains, below grade. */
      shapes: readonly CaseMapShape[];
      /** The district plates, in board order. */
      districts: readonly CaseMapDistrict[];
      /** Every module on the board, configured and person-led alike. */
      works: readonly CaseMapWork[];
      /** Runs of work that cross departments. Optional — the city's three
       *  sheets do not draw them; the BOARD archetype's sheet 01 does. */
      chains?: readonly CaseMapChain[];
      /** Draw against the approved envelope — a STATUS, never an amount. */
      envelope: "WITHIN" | "AT" | "OVER";
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
  /** Several sheets on one row, switched on the shared console rail. */
  | { kind: "sheets"; sheets: readonly CaseSheet[] }
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
  /** Panel head — the ONLY designation. A right-slot label was removed
   *  2026-08-06 (owner): it restated the masthead, the directory row and the
   *  brief on every row. If a panel needs a second designation, the question
   *  is what the first one failed to say. */
  preview: string;
  visual: CaseTrackVisual;
  /**
   * Track-specific metadata under the selected project title. Rendered as
   * immediate text rather than a destructive decode target so it can change
   * safely with the directory selection. Falls back to the casefile-level
   * `classLine` when absent.
   */
  classification?: string;
  /**
   * Two to four legacy readout claims. Renderers normalize these into the
   * same left proof register used by `blocks`. Exactly one of `readouts` or
   * `blocks` is present; new authored tracks should prefer `blocks`.
   */
  readouts?: readonly CaseReadout[];
  /**
   * The preferred 2×2 left-column proof register. Four tiles; see
   * `CaseBlock` for the budgets and the either/or law.
   */
  blocks?: readonly CaseBlock[];
  /** Dotted-leader rows. Values stay ≤20 chars — the leader needs a
   *  non-wrapping value, so a long one runs into the next column. */
  context: readonly { k: string; v: string }[];
  /** Mono provenance retained with the track even when the shell omits it. */
  source: string;
  /**
   * This row's own brief paragraph, replacing the casefile's standing one
   * while the row is selected (2026-08-01, ADR-056 U11). Optional: the seven
   * rows without one keep `CaseCasefile.brief`, which has to serve all of
   * them and therefore cannot be specific to any.
   *
   * The harmonized left column budgets 420 characters before the proof
   * register. `cases-registry.test.ts` pins the content ceiling; compact
   * viewport tests pin the rendered box.
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
