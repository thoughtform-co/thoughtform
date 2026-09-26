/**
 * lib/arcs — client arc pages (ADR-052).
 *
 * An "arc page" is a client-specific landing page under `/arcs/[slug]` —
 * a ported presentation deck rendered in the landing's HUD grammar. This
 * is DISTINCT from "the Arc" (the Navigate → Encode → Build loop on the
 * corridor, LANGUAGE.md) — never shorten "arc page" to "the Arc".
 *
 * Content is data: each arc is one `ArcDef` whose sections are a small
 * discriminated union of static primitives. Rendering lives in
 * `components/arcs/*` server components. This module must stay free of
 * runtime imports (no react, no three, no supabase) — types only.
 */

/**
 * Split title with the upright-gold emphasis pivot. The site rule is no
 * italics anywhere — `em` renders `font-style: normal; color: var(--gold)`
 * (the corridor station-header recipe, home-v2.css).
 */
export interface ArcTitle {
  pre?: string;
  em?: string;
  post?: string;
}

export interface ArcImage {
  src: string;
  alt: string;
}

export interface ArcMetaRow {
  label: string;
  value: string;
}

/**
 * Shared section head — the services-masthead grammar rebuilt in flow:
 * designation label + station-voice title on the left, state chip + intro
 * copy on the right, survey crosses claiming the diagonal.
 */
export interface ArcHead {
  /** PT Mono designation label above the title, e.g. "ARC / SETTINGS · 05". */
  eyebrow?: string;
  title: ArcTitle;
  /** Right-column intro copy (editorial body register, `--band-copy`). */
  sub?: string;
  /** Right-column state chip (gold), e.g. "Open". */
  state?: string;
}

export interface ArcCardItem {
  id: string;
  /** Mono counter, e.g. "01". */
  n?: string;
  /** Mono gold kicker above the title, e.g. "Stripe · January 2026". */
  kicker?: string;
  title: string;
  body: string;
  image?: ArcImage;
  /** Mono label/value rows (e.g. SKU / Spend / ROAS on proof cards). */
  metaRows?: readonly ArcMetaRow[];
  /** Per-card mono receipt line (gold diamond prefix). */
  receipt?: string;
  /** Mono byline under the body, e.g. "Bloomberg · Enterprise track". */
  byline?: string;
  /** Optional outbound link — renders the title as an anchor. */
  href?: string;
}

export interface ArcTip {
  id: string;
  /** Mono chip, e.g. "TIP · MEMORY". */
  tag: string;
  body: string;
}

export interface ArcListItem {
  id: string;
  /** Small mono status chip before the name, e.g. "LIVE". */
  tag?: string;
  name: string;
  body?: string;
  href?: string;
  /** Trailing mono meta, e.g. a count or status label. */
  meta?: string;
}

export interface ArcListGroup {
  id: string;
  label: string;
  /** Under `stack` / `columns`, a note beside the label. Under `plates` it
   *  is the plate's NAME line — the deck's `h4` under the mono
   *  `M1 · ~3 weeks` kicker — so one slot serves both layouts. */
  blurb?: string;
  items: readonly ArcListItem[];
  /**
   * The plate's FOOT (ADR-098 U2): the deck's outcome band — a mono label
   * ("Deliverable") over one or two lines, drawn as an INVERSE band at the
   * plate's floor. Read by `layout: "plates"` only; the other layouts
   * ignore it, so a group can carry one before its section switches.
   */
  foot?: { label: string; lines: readonly string[] };
}

export interface ArcAnatomyRow {
  id: string;
  label: string;
  body: string;
}

export interface ArcAction {
  id: string;
  label: string;
  href: string;
  primary?: boolean;
}

/**
 * THE BOARD's two states (ADR-100, U2; a fifth fact in U4). One RECORD, five
 * facts — who owns it, the context, the work, the tools, where it scales —
 * drawn twice: on `today` as a ruled LEDGER (an inventory: the facts written
 * down and unconnected) and on `configured` as the BOARD (the same five
 * assembled and wired).
 *
 * ⚠ THE TWO DRAWINGS MAY NOT MIRROR EACH OTHER (owner, 2026-09-14: the left
 * "should look less connected … a contrast like before and after, but
 * without implying they're unorganized"). A ledger is ordered and says
 * nothing about a machine; four dashed modules in the board's own slots
 * said "the same picture, greyed out", which is the defect this answers.
 *
 * ⚠ DORMANT OR LIT FOLLOWS `mode` ALONE — no per-element flags — so the
 * guard is one predicate and a board cannot half-light. `today` letters
 * what the record found; `configured` letters what the setup seats.
 * ⚠ NO DIGIT ON EITHER, no bracket, no em dash (the proposal copy law).
 * ⚠ The mono chrome strings (`label`, `seat.q`, `card.name`, `layer.label`,
 * the tags, `tools.label`, the item names) are authored in sentence case and
 * UPPERCASED BY THE DRAWING, so the fit guard walks the rendered string.
 */
export type BoardMode = "today" | "configured";

export interface BoardState<M extends BoardMode = BoardMode> {
  mode: M;
  /** The state's NAME — half the row's accessible name, and nothing else.
   *  ⚠ IT IS NOT LETTERED SINCE U4: the head strips and the datum rule under
   *  them are deleted (owner: "I don't think we need the lines as it runs
   *  today with the configuration or the dividers"), and the head's own dek
   *  names the two sides ("Left, the studio as it runs today. Right, …"). */
  label: string;
  /** The svg's accessible name — the whole drawing in one sentence. */
  alt: string;
  /** WHO OWNS IT — the seat, top centre on the board; the first ledger row.
   *  Green is this and nothing else. One sentence, never a sentence plus a
   *  note (owner: the two-line seat was "cringe"). */
  seat: { q: string; a: string };
  /** The work — the one card on the board, the third ledger row: its name
   *  and ONE line under it. */
  card: { name: string; work: string };
  /** The context they own: its label, an optional one-line sub (the ledger's
   *  value on `today`), and its tags — four on the lit board, NONE on the
   *  dormant one, where the sub IS the row. */
  layer: { label: string; sub?: string; rows: readonly { id: string; tag: string }[] };
  /** WHERE IT RUNS: the tools as PEERS — no lit item, no note (owner: Figma
   *  belongs at the same level as the others). The ledger row joins their
   *  names into one line, so both states letter ONE list. */
  tools: { label: string; items: readonly { id: string; name: string }[] };
  /** WHERE IT SCALES — the fifth fact (U4, owner: the capability "can be
   *  scaled and plugged into other parts of the business, because that's the
   *  entire thing"). The ledger's last row; on the board the node UNDER the
   *  chip, on a gold run out of its floor — the mirror of the seat's green
   *  drop above it, which is what makes that board a cross. One key, one
   *  line, BOTH sides: a fact answered on one side only is the hole the
   *  before/after cannot justify. */
  reach: { label: string; value: string };
}

interface ArcSectionBase {
  /** DOM id — anchor target + ArcMenu key. Unique within the arc. */
  id: string;
  ariaLabel?: string;
  /** Present ⇒ the section appears in the header's drawer under this label,
   *  and its name is what the corner readout decodes to while it is on
   *  screen (ADR-073). */
  menuLabel?: string;
  /**
   * A CHAPTER: the section also takes a link in the header's inline row,
   * the state the hero shows before the readout collapses in (ADR-073).
   *
   * The drawer takes every `menuLabel`; a deck runs to ten of them and ten
   * inline links do not fit a hero, so the row is the spine of the argument
   * and the drawer is the index. Registry-capped at five — past that the
   * row wraps into the hero copy at the binding viewport.
   */
  menuPrimary?: true;
}

export type ArcSection = ArcSectionBase &
  (
    | {
        /** Standalone masthead band (a chapter head with no body). */
        kind: "head";
        head: ArcHead;
      }
    | {
        /** Numbered card grid + optional tips strip and receipt lines. */
        kind: "cards";
        head: ArcHead;
        cards: readonly ArcCardItem[];
        tips?: readonly ArcTip[];
        receipt?: string;
        footnote?: string;
        columns?: 2 | 3 | 4;
        /**
         * Present ⇒ the cards render as the deck's FEE TABLE (ADR-098 U2):
         * one row per card — `kicker` | `body` | `title` — under these three
         * head cells, the LAST card the total row, the `tips` beside the
         * table as bordered cards rather than the strip beneath. ADR-098
         * rejected a `pricing` KIND and still does: this is the same four
         * records, drawn as the table they were on the deck.
         */
        ledger?: { columns: readonly [string, string, string] };
      }
    | {
        /** Grouped lists — status stacks (LIVE / IN PROGRESS / …) or column maps. */
        kind: "list-groups";
        head: ArcHead;
        /**
         * `plates` (ADR-098 U2) is the deck's plan table: each group a
         * bordered PLATE — head band, ruled rows, an inverse `foot` — where
         * `columns` is three naked columns of dashed rows. The owner read the
         * latter as chaotic on the proposal's three modules (2026-09-13); the
         * difference is exactly the borders and dividers.
         */
        layout: "stack" | "columns" | "plates";
        groups: readonly ArcListGroup[];
        closing?: string;
      }
    | {
        /** Labelled rows — skill anatomy, invariants, freedom bands. */
        kind: "anatomy";
        head: ArcHead;
        /** Gold chip badge above the head, e.g. "Claude · Skill". */
        badge?: string;
        rows: readonly ArcAnatomyRow[];
      }
    | {
        /** Full-bleed display line — chapter question, callout, or quote. */
        kind: "interstitial";
        variant: "question" | "callout" | "quote";
        eyebrow?: string;
        line: ArcTitle;
        subline?: string;
        /** Quote variant only — the mono attribution line. */
        attribution?: string;
      }
    | {
        /** Framed video or image figure with a two-column head. */
        kind: "media";
        head: ArcHead;
        media: {
          type: "video" | "image";
          src: string;
          /** Required for video (preload="none" shows only the poster). */
          poster?: string;
          alt?: string;
        };
        caption: {
          label: string;
          role?: string;
          meta?: string;
          sourceLabel: string;
          sourceHref?: string;
        };
      }
    | {
        /** Portrait + bio + meta rows (the About Vince read). */
        kind: "portrait";
        head: ArcHead;
        image: ArcImage;
        bio: readonly string[];
        meta: readonly ArcMetaRow[];
      }
    | {
        /** Closing CTA band — doubles as the page footer. */
        kind: "close";
        head: ArcHead;
        actions: readonly ArcAction[];
        footerLine?: string;
        signature?: string;
      }
    | {
        /**
         * One production tool, drawn from its canonical record (ADR-072):
         * the record column beside the casefile's own console — the
         * authored wireframe, the fused "Watch walkthrough" bar that opens
         * the lightbox, the four capability blocks — at page scale. ONE
         * tool per section, one beat each.
         */
        kind: "dossier";
        /**
         * A `PROJECT_CASES` id. A plain string here — this module stays
         * free of runtime imports — resolved by the renderer and pinned by
         * `tests/lib/arcs-registry.test.ts`.
         */
        toolId: string;
        /**
         * The mode's definition, lettered after the mode chip. It is the
         * shared sentence for the tool's mode (`MODE_LEGEND`,
         * `content/shared/loop-tools.ts`), pinned equal by the registry
         * test — the template says the same thing everywhere.
         */
        legend: string;
        /**
         * Masthead override. Absent ⇒ derived from the record (codename ·
         * tagline eyebrow, the em-segmented title), which is the one
         * source the page shares with the landing. Never authors `sub` —
         * the record column is the intro, and a split head would wedge it
         * into the narrow column (pinned).
         */
        head?: ArcHead;
      }
    | {
        /**
         * The intelligence architecture, at page scale (ADR-076): the
         * landing casefile's own three-reading console — THE WORK · THE
         * CONFIGURATION · THE SUBSTRATE — mounted in a section of its own.
         *
         * It carries NO data. The record is `LOOP_INTELLIGENCE_MAP`
         * (`lib/cases/content/loop-earplugs.ts`), resolved by the renderer
         * and shared BY REFERENCE with the casefile row, exactly as the
         * `dossier` kind resolves `PROJECT_CASES`. A content module that
         * re-typed the 47 Skills would be publishing a second portfolio.
         */
        kind: "intelligence";
        head: ArcHead;
      }
    | {
        /**
         * The studio's three sheets, at page scale (ADR-078): the output,
         * the rule and the limit — THE ADS · THE LINE · THE RED LINE — on
         * the casefile's own `SheetsPlate`.
         *
         * Same contract as `intelligence`, one directory row across: it
         * carries NO data. The record is `LOOP_STUDIO_SHEETS`, shared by
         * reference with the casefile row, so the studio's imagery policy
         * cannot say one thing on the landing and another on a page a
         * reader forwards. It REPLACED three ad cards, which showed only
         * what the studio shipped; half the engagement was deciding what
         * AI may make, and that half is what a stranger has to trust.
         */
        kind: "sheets";
        head: ArcHead;
      }
    | {
        /**
         * The above-the-line reel, at page scale (ADR-078): both films on
         * the casefile's own `FilmsPlate` — poster-first, the `<video>`
         * mounted only on a click, playing in the shared lightbox.
         *
         * The record is `LOOP_ATL_FILMS`, by reference. It replaced a
         * single-film `media` beat that was invisible to the navigation,
         * and the page gains the second film for free: a reel is the one
         * shape where "there is another one" is itself the claim.
         */
        kind: "films";
        head: ArcHead;
      }
    | {
        /**
         * THE PROGRAM BOARD (ADR-078 U1): the engagement plotted as a
         * course across a dated time field, 2024 → now. It replaced a
         * ratchet DIAGRAM — an abstract mechanism that had to be explained
         * before it said anything (owner: "doesn't work at all") — with a
         * chart of what actually happened and when.
         *
         * ⚠ IT CARRIES NO FIGURES. The registers are `LOOP_FIGURES`, read
         * by the renderer, for the same reason a `dossier` carries only a
         * `toolId`: a hand-typed count is the one that goes stale, and the
         * canon is parity-pinned to the casefile in one place. The only
         * digits the content module may letter are YEARS.
         */
        kind: "program";
        head: ArcHead;
        /**
         * The plotted course. Each waypoint is a real thing that shipped,
         * at its real date, and (bar the terminus) a section `id` on THIS
         * arc — so the chart doubles as the page's table of contents.
         * Exactly one carries `seat`: the terminus both the adoption curve
         * and the course arrive at.
         */
        waypoints: readonly {
          id: string;
          label: string;
          /** Mono sub-caption, e.g. a date or a set of names. */
          sub?: string;
          /**
           * One short sentence on what the station WAS — the trajectory's
           * connective tissue (ADR-079). Without it the board named seven
           * dated things and left the arc between them to be inferred; the
           * owner's own telling is a sequence of moves, each with a reason,
           * and the reason is what a stranger is reading for.
           */
          note?: string;
          /** A section id on this arc. */
          target?: string;
          /**
           * Position along the time axis, 0 → 1 (2024 → now). Authored
           * from the record's own dates, not spaced evenly: the gaps ARE
           * the reading — four tools inside eight months is what the
           * cluster on the right says without a sentence.
           */
          at: number;
          /** The terminus — the drawing's ONE gold object. Exactly one. */
          seat?: true;
        }[];
        /**
         * The run-in before the axis starts: what the operator did one
         * system earlier, as chart grammar rather than prose. Labels only.
         */
        priors?: readonly string[];
        /**
         * The platform track that ran BESIDE the course (ADR-079): the
         * pilot's seats, the agreement, governance. It absorbed the
         * `rollout` section, which plotted the same 2024 → now span under
         * its own masthead — the page stated its chronology twice, in two
         * grammars, at opposite ends of itself.
         *
         * ⚠ Log-row phrasing is allowed here (a record is not a claim), but
         * it is NOT a display title and the copy law still walks the head.
         */
        parallel?: readonly string[];
        footnote?: string;
      }
    | {
        /**
         * THE CHAPTER INDEX (ADR-079): the tools head, given the four
         * records it introduces — number, codename, what it is, mode.
         *
         * It carries NO data, exactly as `dossier` / `sheets` / `films` do:
         * the renderer resolves `PROJECT_CASES` and letters each record's
         * own `codename`, `subline` and `mode`. Authoring the lines here
         * would be a second, driftable description of four tools this page
         * already draws in full further down.
         *
         * ⚠ It is an INDEX, not a summary — every row opens its own beat.
         * A head with nothing under it reads as a divider once each tool
         * owns a viewport, and a divider is not worth a screen.
         */
        kind: "tool-index";
        head: ArcHead;
      }
    | {
        /**
         * THE FLOW (ADR-099): a pipeline drawn left to right — what goes in,
         * what the setup makes of it, and where it ends up.
         *
         * Owner, 2026-09-13: "a section where we visualize the flow, sort of
         * like a diagram… this new section should be super clean so that they
         * can see what the flow is. Keep it minimalistic."
         *
         * ⚠ IT DRAWS A RECORD, NOT A METAPHOR (ADR-078 U1's standing law).
         * The brief plate letters the FIELDS a real briefing template
         * carries, the renders are the client's own products, and the scale
         * plate names real markets. Nothing here is an arrow-and-box picture
         * of an idea; every cell is a thing that exists.
         *
         * ⚠ THE THIRD ENUMERATED EXCEPTION to ADR-052's "new arcs are
         * content-only", after ADR-072's dossier and ADR-098's configuration.
         * The bar both cleared and this clears: it cannot be said with the
         * existing kinds (a three-column pipeline with connectors is not a
         * card grid), and it is ONE leaf with no state.
         */
        kind: "flow";
        head: ArcHead;
        /** The input: a plate of field labels, lettered as the template's
         *  own. Eight is the measured set; the renderer tolerates fewer. */
        brief: { label: string; fields: readonly string[] };
        /** What the setup makes — the client's own product renders. */
        renders: { label: string; images: readonly { src: string; alt: string }[] };
        /** Where it ends up: one render, many markets. */
        scale: { label: string; markets: readonly string[] };
        /** The two connectors' verbs, in order. */
        steps: readonly [string, string];
      }
    | {
        /**
         * THE CONFIGURATION (ADR-098): what the client's team ends up
         * owning, drawn as one instrument with a picker — the pitch
         * page's own drawing (ADR-094 U7), as data.
         *
         * Three bands on one plate. The LAYER they own, whose rows dim
         * unless the picked team reads them; the SEAM, where adoption
         * writes the layer and automation runs on it; the WORK, the teams
         * as tiles over the picked team's configuration in the five
         * questions the registry asks.
         *
         * ⚠ THE RESTING STATE IS THE FIRST TEAM, AUTHORED IN THE MARKUP.
         * The picker adds the pick and nothing else, so the drawing reads
         * whole with no JS, under reduced motion, and in a static render.
         *
         * ⚠ NO DIGIT BELONGS IN IT. Picking a team is what makes the
         * transfer visible — the same layer, lit differently — and a
         * count would be a claim the page cannot evidence.
         */
        kind: "configuration";
        head: ArcHead;
        /** The layer band's right-hand kicker, e.g. "Owned by Suri". */
        owner: string;
        /** The layer's rows, top to bottom. `id` is what a team's
         *  `layers` names; the registry test pins every reference. */
        layer: readonly {
          id: string;
          /** Mono tag, e.g. "Rules". */
          tag: string;
          /** What that row holds, lower case, no full stop. */
          name: string;
        }[];
        /** The two arrows' notes, one sentence each. */
        seam: { adoption: string; automation: string };
        /** The teams on the layer. The FIRST is the resting pick. */
        teams: readonly {
          id: string;
          /** Mono tile name, e.g. "Imagery". */
          name: string;
          /** What that team does, under the name. */
          work: string;
          /** Layer row ids this team reads. */
          layers: readonly string[];
          /** The five questions, in the order the readout letters them. */
          owner: string;
          runs: string;
          bar: string;
          reach: string;
          where: string;
        }[];
        /**
         * The ghost tile — the workflow after these, named as a bracket
         * because it is not scoped yet. It is the one place on the
         * drawing where a bracket is the honest register.
         */
        next?: { name: string; work: string };
        /** The foot: three short mono lines at most. */
        kickers?: readonly string[];
      }
    | {
        /**
         * THE BOARD (ADR-100): the client's configuration in TWO STATES side
         * by side — as it runs today (a ruled LEDGER) and with a
         * configuration (the assembled BOARD). The proof's R4 substrate
         * grammar (ADR-070 U11) at page scale: opaque chamfered modules,
         * eight-wire ribbons, one lit chip; gold is the built thing, green is
         * the human and nothing else.
         *
         * ⚠ THE FOURTH ENUMERATED EXCEPTION to "new arcs are content-only"
         * (dossier · configuration · flow · board). Stricter than the
         * configuration's: one leaf, NO picker, NO listener, NO script at all
         * — the arrival is CSS keyed on `.is-in` and the crop is fixed (U1
         * deleted the elastic chain and its `ResizeObserver` island).
         * ⚠ EXACTLY TWO STATES, today then configured — the tuple says so.
         */
        kind: "board";
        head: ArcHead;
        states: readonly [BoardState<"today">, BoardState<"configured">];
      }
    | {
        /**
         * THE STEPS (ADR-103): what the client's team GETS, as a stepped
         * list beside a stage — three rows in the plates' own head-band
         * material (the open one filled, the others ring-only, ADR-089 U4)
         * and, for each, one visual on the right. On the Trinny page the
         * three phase plates collapse to their bands and travel here to
         * become these rows, and the pinned stage steps through them.
         *
         * ⚠ THE FIFTH ENUMERATED EXCEPTION to "new arcs are content-only"
         * (dossier · configuration · flow · board · steps). Same bar as the
         * board's: one leaf, NO listener, NO script — every motion channel is
         * a custom property a route may write, and every default is the
         * finished state, so the static render, no-JS and reduced motion all
         * read whole.
         *
         * ⚠ THESE ARE DELIVERABLES, NOT THE PHASES RESTATED (owner,
         * 2026-09-15: "I don't want to copy or create a simulacrum of those
         * three modules because those are the offerings. This is more about
         * what you actually get").
         */
        kind: "steps";
        head: ArcHead;
        items: readonly ArcStepsItem[];
      }
    | {
        /**
         * ONE Loop project as the promoted FOLDER CARD (ADR-097), at REST, at
         * page width (ADR-128): the claim (`track.arc.title`), the four-claims
         * register and the closed evidence frame, in the one housing the
         * homepage's pile and the Trinny pitch already say it in. On a
         * flowing proposal the four beats read in `PROOF_STACK_ORDER` as the
         * practice a reader could see itself in, with Loop as the illustration.
         *
         * ⚠ THE SIXTH ENUMERATED EXCEPTION to ADR-052's "new arcs are
         * content-only" (dossier · configuration · flow · board · steps ·
         * proof-card). It carries NO data: the record is `CASES`' Loop
         * casefile, resolved by the renderer through the pile's own
         * `proofStackTracks` law — a missing id THROWS rather than falls out.
         *
         * ⚠ THE CARD IS THE HEAD. Its band letters the client and its title
         * letters the arc line, so `head` is optional and, when authored, a
         * masthead ABOVE the card that may never repeat the card's own title
         * (`arcs-registry` pins it).
         */
        kind: "proof-card";
        /** A `CaseTrack.id` on the Loop casefile — `PROOF_STACK_ORDER`'s vocabulary. */
        track: string;
        head?: ArcHead;
      }
    | {
        /**
         * THE BENCH (ADR-128 B2): one Skill and its evals, running — Moira's
         * workshop module ported BY HAND onto this surface's ramp (ADR-106's
         * law: grammar is copied, never imported across repos). Three tabs on
         * one rail: RUN shows what goes in and what comes out; SKILL shows the
         * folder at a glance; EVALS shows how strictly each rule holds and the
         * cases on file. The rail of named checks stays beside all three: a
         * check returns a STATE, never a score, and the verdict is the worst
         * of them.
         *
         * ⚠ THE SEVENTH ENUMERATED EXCEPTION to ADR-052's "content-only". ONE
         * example (a proposal illustrates one checker; the workshop builds up
         * three), and the chrome strings — the tab names, the pane flags, the
         * state and band labels — are constants in the renderer
         * (`bench/benchChrome.ts`), walked by their own test, never authored.
         * No run button and no idle state: a proposal shows the finished run.
         *
         * ⚠ IT LETTERS NO DIGIT outside an image's src/alt (the house habit on
         * every instrument); `arcs-registry` walks the record for it.
         */
        kind: "bench";
        head: ArcHead;
        example: ArcBenchExample;
      }
  );

/* ── The bench (ADR-128 B2) ─────────────────────────────────────────────── */

/** A check returns a state, never a score. */
export type ArcBenchState = "pass" | "review" | "block";
/** How much room a rule leaves: none (checked word for word), some (judged),
 *  or all of it (checked by nobody). */
export type ArcBenchBand = "fixed" | "adapt" | "free";

export interface ArcBenchCheck {
  id: string;
  /** ≤ 20 chars, one line on the rail. */
  label: string;
  /** What the check looks for, ≤ 110. */
  line: string;
}

export type ArcBenchOutput =
  | {
      kind: "image";
      image: ArcImage & { width: number; height: number };
      /** Marked regions, as fractions of the picture's box (percent). ≤ 3. */
      regions: readonly {
        label: string;
        check: string;
        left: number;
        top: number;
        width: number;
        height: number;
      }[];
    }
  | {
      kind: "text";
      text: string;
      /** Marked spans of the text, each a span that occurs in it. ≤ 4. */
      marks: readonly { span: string; check: string; state: ArcBenchState; note: string }[];
    };

export interface ArcBenchInput {
  id: string;
  /** The switch's label, ≤ 24. */
  label: string;
  /** What went in, ≤ 140. */
  brief: string;
  output: ArcBenchOutput;
  /** One result per check, in the checks' order. */
  results: readonly { check: string; state: ArcBenchState; note: string }[];
  /** The worst of the results, and what it means. */
  verdict: { state: ArcBenchState; label: string; line: string };
  /** What happens next. One or two lines. */
  actions: readonly string[];
}

export interface ArcBenchExample {
  id: string;
  /** What the checker does, ≤ 110. */
  task: string;
  /** Exactly four named checks. */
  checks: readonly [ArcBenchCheck, ArcBenchCheck, ArcBenchCheck, ArcBenchCheck];
  /** Two or three inputs, each with its own finished run. */
  inputs: readonly ArcBenchInput[];
  /** The Skill as a folder, `SKILL.md` first and `evals/` always present. */
  skill: {
    folder: string;
    files: readonly {
      name: string;
      line: string;
      image?: ArcImage & { width: number; height: number };
      missing?: true;
    }[];
  };
  /** Each rule by the room it leaves; a fixed or adapted rule names its
   *  check, a free one names none. Three to six. */
  rules: readonly { band: ArcBenchBand; line: string; check?: string }[];
  /** The cases on file: the verdict each must get, or why a check exists. */
  cases: readonly {
    id: string;
    label: string;
    line: string;
    quote?: string;
    expect?: ArcBenchState;
    checks: readonly string[];
  }[];
  /** Where this example comes from, ≤ 170. */
  record: string;
}

/** One deliverable on a `steps` beat: a row on the left, a visual on the right. */
export interface ArcStepsItem {
  id: string;
  /** Mono kicker on the row's band, e.g. "01 · The setup". */
  kicker: string;
  /** The deliverable's name, on the band under the kicker. ≤ 40 chars: the
   *  scene's carrier letters it on ONE line while it travels. */
  name: string;
  /** One or two short sentences, revealed under the name while the row is open. */
  body: string;
  visual: ArcStepsVisual;
}

/**
 * The stage's drawing for one deliverable.
 *
 * ALL THREE ARE THE SAME INSTRUMENT (ADR-106): the house's ring register —
 * the About section's orbit drawing and the gateway's concentric armature,
 * the diagram language the owner named. What changes is what is seated in it,
 * and each figure plots a RECORD rather than a metaphor (ADR-078 U1).
 *
 * `scan` is the computer-vision read of a generated packshot: a gold edge
 * sweeps the dial and the checks the studio's grading actually gates are
 * called out as it passes their anchor. `loop` is the production run the team
 * does itself, four stations on one lit run. `handover` is the engagement's
 * arc, which terminates, against the setup's circle, which does not.
 *
 * ⚠ `fix` IS THE DIAL'S DIAGONAL PAIR — two mono designations in the
 * circle's empty top-left and bottom-right corners, `DiagramLabels`' own shape
 * in the celestial kit. Every figure carries it, so the chrome is one rule.
 */
export type ArcStepsVisual =
  | {
      kind: "scan";
      image: ArcImage & { width: number; height: number };
      /** The dial's diagonal pair: the subject, and the pass. ≤ 26 chars each. */
      fix: readonly [string, string];
      /** Sorted by `y`, the sweep's own order. `x`/`y` are fractions of the
       *  picture's own box, which is seated inside the dial. */
      checks: readonly ArcStepsCheck[];
      /** The foot line, e.g. "Pass · to the studio lead". */
      verdict: string;
    }
  | {
      kind: "loop";
      /** Four stations, clockwise from the top — the run's own order. */
      stations: readonly [ArcStepsStation, ArcStepsStation, ArcStepsStation, ArcStepsStation];
      /** The hub's designation, lettered inside the core ring. ≤ 16 chars. */
      hub: string;
      fix: readonly [string, string];
    }
  | {
      kind: "handover";
      /** The closed inner circle: what keeps running. ≤ 16 chars. */
      inner: string;
      /** The outer arc: the engagement. ≤ 18 chars. */
      outer: string;
      /** The node the arc terminates at. ≤ 14 chars: one mono line in the label. */
      node: string;
      fix: readonly [string, string];
    };

/**
 * One station on the `loop` figure.
 *
 * ⚠ `by` IS THE WHOLE READING. A filled node is the team's hand, an open one
 * the model — which is how the drawing says what the deliverable's own body
 * says, that they know what it is good at and where it gets things wrong. A
 * run where every station is the model, or every station the team, is not this
 * record; the registry pins at least one of each.
 */
export interface ArcStepsStation {
  id: string;
  /** Mono label in the dial's annulus at the station's bearing. ≤ 8 chars:
   *  it is set on the ring, with a tick either side of it. */
  name: string;
  by: "team" | "model";
}

export interface ArcStepsCheck {
  id: string;
  /** Mono key, e.g. "Wordmark". ≤ 10 chars. */
  key: string;
  /** The reading, e.g. "In place, legible". ≤ 20 chars: one mono line in the label. */
  reading: string;
  x: number;
  y: number;
}

export type ArcSectionKind = ArcSection["kind"];

/** The section narrowed to one kind — component prop types. */
export type ArcSectionOf<K extends ArcSectionKind> = Extract<ArcSection, { kind: K }>;

/**
 * Overview chip text, and the LAYOUT family a page belongs to.
 *
 * `portfolio` is ADR-072's one arc so far. `proposal` (ADR-098) joins it on
 * ADR-079's one-beat-per-screen budget: both are read one screen at a time
 * by a single reader, where a workshop runs past twenty sections and would
 * triple in height under the same rule.
 *
 * ⚠ NOT THE TAXONOMY — that is `ArcKind`. The portfolio and a proposal are
 * both PRODUCTIONS and are different layouts, which is exactly the split
 * `data-arc-format` exists for.
 */
export type ArcFormat = "workshop" | "keynote" | "portfolio" | "proposal";

/**
 * What kind of engagement this is (ADR-098) — the overview's taxonomy and
 * the one thing its filter reads.
 *
 * Usually DERIVED from the format (`kindOf`, `lib/arcs/clients.ts`), so an
 * arc authors it only when the two genuinely differ.
 */
export type ArcKind = "keynote" | "workshop" | "production";

/**
 * Section choreography system (ADR-057). Absent or "reveal" is the
 * ADR-052 one-shot IO reveal — those pages stay byte-identical, the flag
 * being unset is what guarantees it. "terminal" is the pinned-beat
 * grammar: sections pin, mastheads decode in place, panels power on, and
 * the plane folds LIFO behind an iris before the beat unpins.
 */
export type ArcMotion = "reveal" | "terminal";

export interface ArcDef {
  /** Route segment — kebab-case, unique across the registry, and never
   *  equal to a client slug (they share `/arcs/[slug]`). */
  slug: string;
  /** Overview card chip text (WORKSHOP / KEYNOTE) and the layout family. */
  format: ArcFormat;
  /**
   * The client this engagement belongs to — a `ClientDef.slug`
   * (`lib/arcs/clients.ts`, ADR-098). ABSENT ⇒ a Thoughtform format, which
   * is what the keynote and the workshop are: a shape the practice sells,
   * not a piece of work done for one company.
   */
  client?: string;
  /**
   * The overview's taxonomy (ADR-098). Absent ⇒ derived from the format by
   * `kindOf`, which is right for every arc registered so far. Author it
   * only where the format and the kind genuinely disagree.
   */
  kind?: ArcKind;
  /**
   * Where the engagement stands (ADR-114) — the one fact the `/arcs`
   * overview's client console derives its readout from. `proposed` is a
   * proposal out with the client, `running` an engagement in progress,
   * `shipped` delivered. Required on every client-bound arc (the registry
   * test), because a uniform set of consoles may not drop a row on one.
   */
  status?: "proposed" | "running" | "shipped";
  /**
   * When the engagement was FILED on the site — `YYYY-MM-DD` (ADR-118). The
   * arcs overview plots every engagement at this date on its monitor and
   * sorts each client's log rows by it.
   *
   * ⚠ IT REVERSES ADR-098's "NO `date` FIELD" ON THAT RULING'S OWN TERMS: it
   * refused a date that "only ever feeds a sort", because a sort-only field
   * is a second place for the order to be wrong. This one feeds a PLOT, and
   * the order it implies is checked against the registry rather than being a
   * second fact (`arcs-registry`).
   *
   * ⚠ OWNER-TO-CONFIRM, like `ClientDef.since`: seeded from the page's first
   * commit, which is when the page was made, not when the engagement began.
   * A `-v2` cut authors its OWN — the spread from v1 would inherit v1's.
   */
  date: string;
  /**
   * Lock the page to one theme (ADR-093's mechanism, ADR-098's use). A
   * proposal is composed on paper and has no dark reading.
   *
   * ⚠ IT IS HALF A DECISION. The route also earns a row in
   * `LIGHT_LOCKED_ROUTES` BY HAND — nothing derives that list — and the
   * registry test fails a locked arc that has none.
   */
  theme?: "light";
  /** Choreography system — see ArcMotion. Default "reveal". */
  motion?: ArcMotion;
  /**
   * Overview chip override. Defaults to `format`; set it when two arcs
   * share a format and would otherwise show identical chips.
   */
  cardChip?: string;
  /** Overview card copy. */
  cardTitle: string;
  cardLede: string;
  cardImage: ArcImage;
  /** Detail-page hero (landing hero recipe, parallax photo background). */
  hero: {
    /** PT Mono designation above the headline, e.g. "THOUGHTFORM · CLAUDE WORKSHOP". */
    eyebrow?: string;
    title: ArcTitle;
    lede: string;
    actions?: readonly ArcAction[];
    image: ArcImage & { width: number; height: number };
    /**
     * `"gateway"` ⇒ this hero IS the landing's (ADR-075): the Gateway
     * plate, delivered the landing's way — an AVIF `<source>` over the
     * WebP `<img>` in dark, and `theme.css`'s own light rule painting
     * `Gateway_v2-light.webp` as a background with the `<img>` hidden.
     *
     * Absent ⇒ the arc's own `image` in BOTH themes. That needs saying
     * because the light rule is global on `.hero__bg`: until ADR-075 an
     * arc showed its own plate in dark and the GATEWAY in light, with
     * nothing declaring it. `ArcHero` marks those heroes `data-plate="own"`
     * and `arcs.css` hands the image back.
     */
    plate?: "gateway";
    /**
     * Run the ADR-076 curtain seam on an OWN-plate hero (ADR-078 U1).
     *
     * ⚠ THE SEAM WAS COUPLED TO THE PLATE, AND THE TWO ARE UNRELATED.
     * `ArcShell` gated `data-arc-curtain` on `plate === "gateway"`, so the
     * portfolio taking a Loop key visual would have silently lost the hold
     * — the hero would scroll over a beat that moved with it, and the only
     * thing failing would have been one smoke assertion. The gate asks
     * about the CHOREOGRAPHY now, and the plate answers only for the
     * image. Absent ⇒ the hero scrolls off in plain flow.
     */
    curtain?: true;
  };
  /** Route metadata (robots noindex is applied by the route, not here). */
  meta: { title: string; description: string };
  sections: readonly ArcSection[];
}
