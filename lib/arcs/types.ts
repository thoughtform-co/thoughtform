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
  /** A subsection under the group's own items, e.g. "What I need" under
   *  "From Thoughtform" (ADR-133 U6). Read by `stack` / `columns`. */
  sub?: { label: string; blurb?: string; items: readonly ArcListItem[] };
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
  /**
   * THE WORKED EXAMPLE THIS SECTION IS A PANEL OF (ADR-139). A switched beat
   * is authored ONCE PER EXAMPLE as sibling sections of the same kind; the
   * renderer gathers a contiguous run sharing a `group` into one switch and
   * draws the tab bar over it.
   *
   * ⚠ IT TOUCHES NO KIND. Every guard in `arcs-registry` walks each panel as
   * an ordinary section, which is the whole reason the switcher lives here
   * and not in six section records.
   *
   * ⚠ THE RESTING STATE IS THE MARKUP, the `configuration` picker's own law:
   * the FIRST panel of each group renders visible and the rest are hidden by
   * a rule keyed on nothing but its absence, so the page reads whole with no
   * JS, under reduced motion and in a static render. The pick is PAGE-WIDE —
   * every group carries the same ordered ids, so one choice is valid for all
   * of them and the room follows one piece of work down the whole chapter.
   */
  worked?: {
    /** The switched beat, e.g. "made-real". Its panels are contiguous. */
    group: string;
    /** The worked example, e.g. "voice". The same ids in the same order in
     *  every group on the page (registry-pinned). */
    id: string;
    /** The tab's label, e.g. "Words". ≤ 24. Equal across groups for one id. */
    label: string;
  };
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
         *
         * `readout` (ADR-130) is the workshop's two panels: two plates side
         * by side whose rows are READOUT rows — the key framed and filled,
         * the value framed beside it and set right (Starfield's travel data,
         * the /arcs dossier's own row). An item with an in-page `href`
         * becomes a link to that beat, so the right-hand plate is the day's
         * own index. Not a new kind: the same `ArcListGroup` records, drawn
         * as the instrument the owner asked for instead of a card grid.
         */
        layout: "stack" | "columns" | "plates" | "readout";
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
        /** Portrait + bio + meta rows (the About Vince read).
         *  `layout: "orbit"` is the homepage's own About (ADR-133 U5): the
         *  copy on the left (the name as the title, `head.sub` as the role
         *  line, the bio, the meta cells) and the portrait on the right inside
         *  the About drawing's rings. Absent, the keynote's bracketed frame. */
        kind: "portrait";
        head: ArcHead;
        image: ArcImage;
        bio: readonly string[];
        meta: readonly ArcMetaRow[];
        layout?: "orbit";
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
         * THE WORKSHOP'S OPENING SLIDE (ADR-137), ported by hand from the
         * Moira workshop template's session hero: the head on the left, the
         * board in miniature on the right — one piece of work in the middle,
         * wired to six plates, the plates a person writes lit and framed.
         * ADR-052's SIXTH enumerated exception.
         *
         * ⚠ THE DRAWING LETTERS NOTHING. It is a promise of the picture the
         * room meets later, not a second copy of it, so there is no label
         * ladder to guard and the head carries the whole meaning.
         */
        kind: "hero-board";
        head: ArcHead;
        /** Which plates are LIT — their bundles draw on and one frame holds
         *  them. Every lit plate must sit on one side, adjacent, or the frame
         *  encloses a plate that is not lit (registry-pinned). */
        lit: readonly (readonly ["left" | "right", 0 | 1 | 2])[];
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
        /**
         * The board's own words, for a page written in another language.
         * Absent (or any key absent) ⇒ the English the board was drawn in.
         */
        labels?: {
          layer?: string;
          adoption?: string;
          automation?: string;
          /** The suffix after the picked team's name, e.g. "the intelligence configuration". */
          configuration?: string;
          owner?: string;
          runs?: string;
          bar?: string;
          reach?: string;
          where?: string;
        };
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
        /**
         * The card's title ON THIS PAGE, in place of `track.arc.title`
         * (owner, 2026-09-28). The homepage's four arc lines are the
         * practice's OFFER, in the present tense ("We push the frontiers of
         * AI creative"); a proposal that shows the same cards is looking
         * BACK at Loop, so it says them in the past ("We pushed …"). The
         * record's line is untouched — it is the keynote's, word for word.
         * ⚠ It is the ARC's string, so the proposal copy law walks it
         * (`arcs-registry` pins the rest: ≤44, no digit, never the record's
         * own line).
         */
        title?: string;
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
    | {
        /**
         * THE THREE STAGES (ADR-130): a prompt, a tool, an agent, each
         * running longer without you. The Moira workshop's opening picture
         * (`from-prompt-to-agent`, ADR-050 there), redrawn in the house's
         * own grammar: three machined housings standing on a graticule, the
         * width how long each runs without you, the height how much of the
         * work it holds, beside the three rows that say what each is.
         *
         * ⚠ THE EIGHTH ENUMERATED EXCEPTION to ADR-052's "content-only", and
         * the first of four the workshop's framing chapter adds. One leaf, no
         * state, no listener, no script. The geometry is fixed in
         * `framing/stagesLayout.ts`; the content letters the words only.
         *
         * ⚠ AN ARGUMENT, NOT A RECORD, and ADR-130 says where that is lawful:
         * a workshop teaches the frame before it shows the work, and the
         * rows name Plopsa's own three steps (July, the tool, the loop).
         */
        kind: "stages";
        head: ArcHead;
        /** The two axes, as words: along the floor, and up the side. */
        axes: { time: string; work: string };
        /** The axes' ends: the floor's near and far end, the side's top. */
        ends: { near: string; far: string; top: string };
        stages: readonly [ArcStage, ArcStage, ArcStage];
        /** Whose examples the rows carry (ADR-136), e.g. "Loop's own" — the
         *  mono prefix on every row's `example` line. Present iff the stages
         *  carry examples. */
        own?: string;
      }
    | {
        /**
         * THE CURVE (ADR-130 U5, owner 2026-09-28): the Moira workshop's own
         * figure — "Each release finishes longer work, and each costs more per
         * token" — ported. Two vendors climbing one curve, the lanes and their
         * models as points on the front edge with a list price under every
         * name, a warm strip for the step change, and the second dial (effort)
         * as a surface behind the front edge. Two buttons bring the prices and
         * the surface in; the whole figure is what no-JS, reduced motion and
         * paper get.
         *
         * ⚠ THIS ONE BEAT NAMES MODELS AND PRICES, dated in its `note`. U1's
         * "no vendors, no prices, no lanes" is reversed by the owner: "it
         * doesn't show the models".
         */
        kind: "curve";
        head: ArcHead;
        /** The vertical axis and the intelligence edge. */
        axes: { y: string; x: string };
        /** The step change's name in the key. */
        step: string;
        /** The key's name for the curve the lanes sit on. */
        key: { own: string };
        prices: {
          /** The first button. */
          show: string;
          /** The key's unit line, e.g. "per million tokens". */
          unit: string;
          /** The flag on a promotional price. */
          promo: string;
          /** The two words in a price line, e.g. "in" and "uit". */
          words: readonly [string, string];
        };
        effort: {
          /** The effort edge's word. */
          axis: string;
          levels: readonly [string, string, string];
          /** The second button. */
          show: string;
          /** The sentence that arrives with the surface. */
          note: string;
        };
        /** The three lanes on the front edge, cheapest first. */
        lanes: readonly [ArcCurveLane, ArcCurveLane, ArcCurveLane];
        /** The other vendor's dated points, on its own curve. */
        others: readonly {
          label: string;
          points: readonly { t: number; model: ArcCurveModel }[];
        }[];
        /** The source and the date of every price. Required. */
        note: string;
      }
    | {
        /**
         * THE HORIZON (ADR-130): the same stretch of time, twice — a tool
         * you operate, checked by a person after every step, above an agent
         * on one long task that passes three gates of its own. Moira's
         * figure (ADR-041 there), with the dial's own law for the marks
         * (ADR-106): a filled node is a person's hand, an open one the model.
         *
         * ⚠ THE TENTH ENUMERATED EXCEPTION. One leaf, no state.
         *
         * ⚠ TWO READINGS OF ONE FIGURE, AND A SECTION CARRIES EXACTLY ONE TOP
         * TRACK (ADR-133 U2). `operated` is Moira's: a tool a person runs,
         * checked after every step. `upstream` is the proposal's: the owner's
         * own time, spent on the upstream work, while the agent runs the rest
         * below and reaches up only three times — the goal, a question, the
         * result. With `upstream` an `owner` plate stands to the left.
         */
        kind: "horizon";
        head: ArcHead;
        /** The time axis under the tracks. The owned reading carries none
         *  (ADR-133 U4, owner: "we don't need that"). */
        axis?: { from: string; to: string };
        operated?: {
          label: string;
          /** The word under each check. */
          check: string;
          /** How many checks the operated track draws. */
          steps: number;
          /** The same track as one sentence, for the phone. */
          line: string;
        };
        upstream?: ArcHorizonUpstream;
        owner?: ArcHorizonOwner;
        agent: {
          label: string;
          start: string;
          gates: readonly [ArcHorizonGate, ArcHorizonGate, ArcHorizonGate];
          end: string;
        };
        note?: string;
      }
    | {
        /**
         * ONE PIECE OF WORK, SIX QUESTIONS AROUND IT (ADR-130): the
         * configuration as the Moira workshop's board draws it — the work at
         * the centre, six plates wired to it by eight-wire ribbons (the R4
         * grammar), the two the team writes lit. On a workshop it REPLACES
         * the `configuration` picker: two configuration instruments on one
         * page is the house's said-twice defect.
         *
         * ⚠ THE ELEVENTH ENUMERATED EXCEPTION, and NOT a third mode of the
         * `board` kind: `arc-board-fit` pins that kind's two-state tuple on
         * every registered board, and a third mode would branch every
         * assertion in it. One leaf, no state; the plates are DOM on the
         * house's `.arc-plate` material, the SVG carries only the ribbons.
         */
        kind: "questions";
        head: ArcHead;
        work: {
          label: string;
          name: string;
          line: string;
          /** The work itself, pictured — the card centre carries the work. */
          image?: ArcImage;
          bar: { label: string; line: string };
        };
        /** Top to bottom. The owner's layout: the model, the context, the
         *  evaluations on the left; the data, the interface, the owner on the
         *  right. */
        left: readonly [ArcQuestion, ArcQuestion, ArcQuestion];
        right: readonly [ArcQuestion, ArcQuestion, ArcQuestion];
        /** The mark on the two lit plates, e.g. "Van jullie". */
        tag: string;
        /** The drawing's accessible name. */
        alt: string;
      }
    | {
        /**
         * THE CIRCUIT (ADR-133 U2): one layer, every workflow — a MAP of
         * the client's marketing OS. Each of the studio's workflows is a small
         * configuration in the restored board's own cross, its card the
         * board's own card (the name and one line, the same size); the
         * plates around it letter nothing. All of them are wired to the
         * marketing OS at the centre, a twelve-sided plate, and that plugs,
         * dashed, into what does not exist yet.
         *
         * ⚠ THE TWELFTH ENUMERATED EXCEPTION. ADR-133's first two cuts posed
         * one drawing three ways in a pinned scene; U2 (owner, 2026-09-29)
         * returned "today" to the `board`, moved "your team owns it" into the
         * horizon, and asked for this beat to be "a high-level map of
         * different nodes" without "all the texts of the smaller panels". So
         * it is one leaf, static, no script.
         * ⚠ NO DIGIT anywhere in it (the proposal copy law); the mono chrome is
         * authored in sentence case and UPPERCASED by the drawing.
         */
        kind: "circuit";
        head: ArcHead;
        /** Every workflow, in the plan's order: the left column top to
         *  bottom, then the right. Exactly six. */
        configs: readonly [
          CircuitConfig,
          CircuitConfig,
          CircuitConfig,
          CircuitConfig,
          CircuitConfig,
          CircuitConfig,
        ];
        /** What every configuration is seated on: the marketing OS, a
         *  twelve-sided plate at the centre — a small key over its name and
         *  one line (owner, 2026-09-29: "the center card should have a
         *  different type of shape and really represent that marketing OS"). */
        os: { key: string; name: string; line: string };
        /** The one thing outside the studio it plugs into, drawn dashed
         *  because it does not exist yet. */
        socket: { key: string; name: string };
        /** The drawing's accessible name. */
        alt: string;
      }
    | {
        /**
         * THE CREW (ADR-133 U5, U6): what it returned at Loop, as ONE ROW PER
         * ROLE read left to right — the role, then the workstream it runs and
         * what is possible now, drawn as the quantity it is and said in one
         * line, the role and the workstream at ONE size (owner, 2026-09-29: "I
         * really like the flow from left to right … just a super clear
         * visualization of what's now been possible because of this"). It
         * sits with the proof cards it comes from. Never a calculator.
         *
         * ⚠ THE THIRTEENTH ENUMERATED EXCEPTION. The circuit's own glyph
         * library, static, one leaf, no script. U4's two bands are retired
         * (the upstream / downstream split "doesn't really make sense" here),
         * and so is the client's half. The only digits are the record's.
         */
        kind: "crew";
        head: ArcHead;
        rows: readonly [CrewRow, CrewRow, CrewRow, CrewRow];
        /** The drawing's accessible name. */
        alt: string;
      }
    | {
        /**
         * THE COURSE ON ONE TRACK (ADR-134): every class of a course on one
         * line, the two ways in drawn as the fork it starts from and what is
         * launched drawn as its end, under the phases of the house arc. A
         * station is its numeral, its name and the SHAPE of what the class
         * makes; the open station's practical sheet sits under the track —
         * the four rows once, never once per class.
         *
         * ⚠ THE FOURTEENTH ENUMERATED EXCEPTION to ADR-052's "content-only",
         * and it exists because the owner read nine identical `anatomy`
         * sections as "a glorified PowerPoint" (2026-09-29): a syllabus is ONE
         * instrument, and the week-by-week detail is what it shows when a
         * station is picked. The numerals and the row keys are the
         * renderer's; the record authors the words only.
         */
        kind: "syllabus";
        head: ArcHead;
        /** The assignment's choice, drawn as the fork the track starts from. */
        entry: { label: string; ways: readonly [string, string] };
        /** The phases, in order. Every class names one; each phase holds a
         *  consecutive run of classes. */
        phases: readonly ArcSyllabusPhase[];
        classes: readonly ArcSyllabusClass[];
        /** What is launched at the end, drawn as the track's end. */
        launch: { label: string; items: readonly string[] };
        /** One line under the track: what a gate is. */
        note?: string;
      }
    | {
        /**
         * HOW A WORLD WAS FOUND (ADR-134): an exploration as a row of dated
         * stages, left to right, each a set of the real frames that stage
         * produced: wide, then narrowing to what was kept. A record, not a
         * metaphor: every stage is dated and every frame is on file.
         *
         * ⚠ THE FIFTEENTH ENUMERATED EXCEPTION to ADR-052's "content-only".
         * One leaf, no state, no listener, no script. The frames carry no
         * caption: the stage's head says what they are, and a caption on every
         * frame is the card grid again.
         */
        kind: "path";
        head: ArcHead;
        stages: readonly ArcPathStage[];
        /** One line under the row. */
        note?: string;
      }
    | {
        /**
         * BETWEEN TWO THINGS (ADR-136): the Moira workshop's spectrum,
         * ported by hand. One rail from tool to collaborator, a handle that
         * rests in the overlap, two bands under it (software reaches from
         * the tool's end, intelligence from the collaborator's), and three
         * columns under those. The word frames a BAND, never the middle: a
         * collaborator is an intelligence too, so "intelligence" cannot name
         * the point between the ends.
         *
         * ⚠ THE SIXTEENTH ENUMERATED EXCEPTION to ADR-052's "content-only".
         * One leaf, no state, DOM only; the handle moves once on arrival and
         * never idles (the house's arrival-only law, ADR-080).
         */
        kind: "spectrum";
        head: ArcHead;
        /** The two ends: the tool, then the collaborator. */
        poles: readonly [ArcSpectrumPole, ArcSpectrumPole];
        /** The overlap, marked by type alone: "AI sits here". */
        middle: { label: string; head: string; line: string };
        /** The two bands, from the tool's end and from the collaborator's. */
        bands: { start: string; end: string };
        /** Where the reading comes from, lettered under the figure (ADR-139
         *  U1: the middle is Matthew Schwartz's turn, and it is credited). */
        source?: string;
      }
    | {
        /**
         * A STRANGE RESOURCE (ADR-136): the Moira workshop's ledger, ported
         * by hand. Four resources and what each is counted in; three rows
         * ordinary on purpose so the fourth reads as the odd one out. It has
         * a unit like the rest, and what the unit leaves out is the beat's
         * one bright object.
         *
         * ⚠ THE SEVENTEENTH ENUMERATED EXCEPTION. One leaf, no state. The
         * kind is `resource`, never `ledger`: `.arc-ledger*` is the fee table
         * (ADR-098 U2) and a second object under that name is a fork.
         */
        kind: "resource";
        head: ArcHead;
        /** The three column heads: the resource, its unit, what the count tells you. */
        columns: readonly [string, string, string];
        /** Exactly four rows; the OPEN one is last. */
        rows: readonly [ArcResourceRow, ArcResourceRow, ArcResourceRow, ArcResourceRow];
      }
    | {
        /**
         * THE SIGNAL (ADR-136): what the market is paying for, on the board's
         * two written plates — the Moira workshop's clippings, ported by
         * hand. Two columns in the board's order (the context, then the
         * evaluations), two dated clippings under each: a panel with the name
         * set as a wordmark and the figure in its corner, the headline, a dek
         * with its figures in weight, and where and when it ran. The whole
         * card links to its source.
         *
         * ⚠ THE EIGHTEENTH ENUMERATED EXCEPTION. One leaf, no state. It may
         * only follow a `questions` board on the same page (Moira's own rule:
         * the signal reads the two plates the board lit). ⚠ A clipping is a
         * dated RECORD, so its corner, kicker, title, dek and date may carry
         * figures; the column heads and the card's mark and tag may not.
         */
        kind: "signal";
        head: ArcHead;
        columns: readonly [ArcSignalColumn, ArcSignalColumn];
        /** One line under the columns: what the figures are, and are not. */
        caption: string;
      }
    | {
        /**
         * THE GROUND (ADR-139): why the work is built here rather than on a
         * shelf of point tools. The curve says each release finishes longer
         * work; this says what follows from it — a general model got good
         * enough at enough things that the shelf stopped earning its keep.
         *
         * Two halves on one floor. The SHELF is dim: separate platforms, each
         * with its own sign-in, its own agent and its own idea of the brand.
         * The GROUND is lit and reads bottom up: the intelligence you cannot
         * build, the reach you connect to it, and the two things you write.
         *
         * ⚠ THE NINETEENTH ENUMERATED EXCEPTION to ADR-052's "content-only".
         * One leaf, no state, no listener, no script.
         *
         * ⚠ NO VENDOR IS NAMED ON THE SHELF and no digit is lettered. The
         * argument is about a shape of purchase, not about four companies,
         * and a named competitor dates the page the week it ships.
         */
        kind: "ground";
        head: ArcHead;
        /** The shelf: what a point tool sells, one plate each. */
        shelf: { label: string; line: string; items: readonly ArcGroundTool[] };
        /** What the work actually stands on, floor upwards. */
        floor: {
          label: string;
          /** The plinth: the one thing you cannot write. */
          base: { tag: string; name: string; line: string };
          /** What you connect to it. */
          reach: { tag: string; line: string; items: readonly string[] };
          /** What you write — the same two the board lights. */
          steer: { tag: string; line: string; items: readonly string[] };
        };
        /** One line under the drawing. */
        note: string;
        /** The drawing's accessible name. */
        alt: string;
      }
    | {
        /**
         * THE CONFIGURATION, MADE REAL (ADR-139): where each of the six
         * answers goes to live. The marketplace and the account above; the
         * PLUGIN as a frame around the skill, its evals, the connectors and
         * the owner; the skill that checks the others at its centre; the
         * interfaces on a bar beneath.
         *
         * ⚠ EVERY PLATE CARRIES ITS `answers` LINE. The tie back to the six
         * questions is the beat's entire argument — without it this is a
         * diagram of a folder.
         *
         * ⚠ THE TWENTIETH ENUMERATED EXCEPTION. One leaf, no state; the
         * plates are DOM on `.arc-plate`, the SVG carries only the ribbons,
         * exactly as `questions` does.
         */
        kind: "plugin-board";
        head: ArcHead;
        /** Above the frame: where the plugin is kept, and the account that
         *  sets the model. Left, then right. */
        above: readonly [ArcPluginNode, ArcPluginNode];
        /** The frame itself. */
        plugin: { label: string; name: string };
        /** Inside it, in the drawing's order. The first TWO are lit — the two
         *  the team writes — and the guard pins that. */
        parts: readonly [ArcPluginPart, ArcPluginPart, ArcPluginPart, ArcPluginPart];
        /** The chip at the frame's centre: the skill that reads the others. */
        centre: { kicker: string; name: string; line: string };
        /** The bar under the frame: where you meet it. */
        bar: { line: string; answers: string };
        /** The drawing's accessible name. */
        alt: string;
      }
    | {
        /**
         * A SKILL, AS THE FILE IT IS (ADR-139): the folder's one main file
         * with three lines marked, and the three notes those marks carry —
         * when Claude reaches for it, how the work is done, and where it
         * stops and asks. The sibling files run underneath.
         *
         * ⚠ THE TWENTY-FIRST ENUMERATED EXCEPTION, and the load-bearing one:
         * a room that has never seen a skill needs to see that it is a text
         * file in plain language, not a product. Describing it does not work;
         * `bench` shows the folder, and a folder is not the point.
         *
         * ⚠ THE FILE IS REAL, SHORTENED — never invented. What is drawn is an
         * excerpt of a Skill that exists, with its own words.
         */
        kind: "skill-file";
        head: ArcHead;
        /** Gold chip above the head, e.g. "Claude · Skill". */
        badge?: string;
        /** The file, e.g. "thoughtform-tov / SKILL.md". */
        path: string;
        /** Where it lives, e.g. "in the Thoughtform words plugin". */
        where: string;
        /** The file as it is set, line by line. */
        lines: readonly ArcSkillLine[];
        /** The notes beside it. Exactly three, in the marks' order. */
        notes: readonly [ArcSkillNote, ArcSkillNote, ArcSkillNote];
        /** The rest of the folder. */
        folder: { label: string; items: readonly string[] };
      }
    | {
        /**
         * A CONVERSATION (ADR-139): what using it actually looks like, drawn
         * in the page's own ink rather than screenshotted. Two readings of one
         * panel — `ask` (say it in your own words, or type a slash and pick)
         * and `feedback` (say what went wrong, and what happens next).
         *
         * ⚠ THE TWENTY-SECOND ENUMERATED EXCEPTION. One leaf, no state, no
         * script; the composer's caret is CSS and never idles (ADR-080).
         *
         * ⚠ A SCREENSHOT WOULD BE STALE IN A MONTH and carries another
         * product's type and colour onto the page. This is the house's ink.
         */
        kind: "chat";
        head: ArcHead;
        variant: "ask" | "feedback";
        /** The panel: its title bar, its turns, and the composer's ghost. */
        thread: { title: string; turns: readonly ArcChatTurn[]; composer?: string };
        /** The column beside it. `menu` under `ask`, `steps` under
         *  `feedback` — the guard pins the pairing. */
        aside: ArcChatAside;
      }
    | {
        /**
         * AGENT-SHAPED WORK (ADR-139 U1): Matthew Schwartz's convex hull,
         * drawn as the answer to the turn's question (a person or an agent?).
         * The team's knowledge is a jagged star, one spike per discipline,
         * deep in one direction each; a dashed line runs round the tips; the
         * bays between the spikes, inside that line, fill with gold
         * particles. The spikes are where the judgement comes from, the
         * particles are what an agent can fill.
         *
         * ⚠ THE TWENTY-THIRD ENUMERATED EXCEPTION. One leaf, no state; the
         * geometry is pure in `components/arcs/hull/hullLayout.ts`, the SVG
         * letters nothing and every word is DOM placed over it.
         *
         * ⚠ IT DRAWS AN ARGUMENT, SO IT NAMES ITS SOURCE (ADR-130's workshop
         * clause). `source` is required here, where the spectrum's is
         * optional: this figure is the article's own picture.
         *
         * ⚠ PEOPLE ARE SHAPES, THE AGENT IS PARTICLES — the spectrum's own
         * reading (intelligence is the cloud), held across the two beats.
         */
        kind: "hull";
        head: ArcHead;
        /** The people: one spike per role, five to seven. */
        team: { label: string; line: string; roles: readonly string[] };
        /** The bays inside the hull: what an agent can fill. */
        field: { label: string; line: string };
        /** Where the picture comes from, under the key. */
        source: string;
        /** The drawing's accessible name. */
        alt: string;
      }
  );

/* ── The syllabus (ADR-134) ────────────────────────────────────────── */

export interface ArcSyllabusPhase {
  id: string;
  /** Mono, on the bracket over its classes. */
  label: string;
}

/** The shape of what a class makes, drawn as a hairline frame on its
 *  station. A shape, never a picture: the track is the course, not the work. */
export type ArcSyllabusGlyph =
  | "setup"
  | "board"
  | "wall"
  | "offer"
  | "poster"
  | "site"
  | "film"
  | "launch";

export interface ArcSyllabusClass {
  id: string;
  /** The phase this class belongs to. */
  phase: string;
  /** The station's name, ≤ 16 characters. */
  name: string;
  glyph: ArcSyllabusGlyph;
  /** The sheet's four rows. */
  objective: string;
  make: string;
  gate: string;
  tool: string;
  /** Where the worked example shows this class's work, on this page. */
  example?: { label: string; href: string };
  /** The class's own page, another registered arc (ADR-136): a root-relative
   *  `/arcs/<slug>` href, never a fragment — a gated arc loads through
   *  `/unlock` and drops one. */
  page?: { label: string; href: string };
}

/* ── The path (ADR-134) ────────────────────────────────────────────── */

export interface ArcPathStage {
  id: string;
  /** When, in words, e.g. "31 August". */
  date: string;
  /** Mono, e.g. "Directions". */
  label: string;
  /** What this stage was, one line. */
  name: string;
  /** The frames. A stage of one keeps its frame's own aspect; a set is cut to
   *  one cell shape so it reads as a set. */
  images: readonly (ArcImage & { width: number; height: number })[];
  /** Its share of the row; absent, its column count. */
  weight?: number;
  /** Optional line under the frames. */
  line?: string;
}

/* ── The class-one frame (ADR-136) ───────────────────────────────── */

/** One end of the spectrum: what you say, what it does, what you check. */
export interface ArcSpectrumPole {
  /** Mono, e.g. "Tool". ≤16. */
  label: string;
  /** e.g. "Executes commands". ≤28. */
  head: string;
  /** Three lines, ≤48 each. */
  lines: readonly [string, string, string];
}

/** One row of the resource ledger. */
export interface ArcResourceRow {
  id: string;
  /** e.g. "People". ≤16. */
  resource: string;
  /** e.g. "Hours". ≤12. */
  unit: string;
  /** What the count tells you. ≤56. */
  tells: string;
  /** What the count leaves out — the open row's second line, in the accent.
   *  Present iff `open`. ≤56. */
  misses?: string;
  /** The odd one out. Exactly one, and it is the last row. */
  open?: true;
}

/** One column of the signal: a plate the board lit, and two clippings. */
export interface ArcSignalColumn {
  id: string;
  /** Which of the board's written plates this column reads. */
  plate: "context" | "evals";
  /** e.g. "The context". */
  label: string;
  /** One line under the label: what the market is doing on this plate. */
  line: string;
  cards: readonly [ArcSignalCard, ArcSignalCard];
}

/** A clipping. */
export interface ArcSignalCard {
  id: string;
  /** The name, set as a wordmark, e.g. "OpenAI". */
  mark: string;
  /** The figure in the corner, e.g. "$10B". */
  corner: string;
  /** Mono, what kind of news, e.g. "Joint venture". */
  tag: string;
  /** Mono, e.g. "Launch · May 2026". */
  kicker: string;
  title: string;
  /** The dek in parts; a `strong` part carries a figure in weight. */
  dek: readonly { text: string; strong?: true }[];
  /** Where it ran, e.g. "CNBC". */
  source: string;
  /** When, in words, e.g. "4 May 2026". */
  date: string;
  /** The source, `https`. */
  href: string;
}

/* ── The ground (ADR-139) ─────────────────────────────────────────── */

/** One plate on the shelf: what a point tool sells, and what it costs you
 *  that is not money. Never a vendor's name. */
export interface ArcGroundTool {
  id: string;
  /** What it does, e.g. "A tool that makes pictures". ≤ 32. */
  name: string;
  /** What comes with it, e.g. "Its own sign-in, its own bill". ≤ 40. */
  cost: string;
}

/* ── The plugin board (ADR-139) ───────────────────────────────────── */

/** A node above the frame: the marketplace, and the account. */
export interface ArcPluginNode {
  id: string;
  /** ≤ 24. */
  name: string;
  /** ≤ 72. */
  line: string;
  /** Which of the six questions it answers, if any. ≤ 24. */
  answers?: string;
}

/** A plate inside the frame. */
export interface ArcPluginPart {
  id: string;
  /** ≤ 20. */
  name: string;
  /** ≤ 64. */
  line: string;
  /** Which of the six questions this one answers. ≤ 24. */
  answers: string;
  /** One of the two the team writes. Exactly two, and they come first. */
  lit?: true;
}

/* ── The skill file (ADR-139) ─────────────────────────────────────── */

/** How a line of the file is set. `meta` is a front-matter key and value,
 *  `rule` the one form the skill pins, `quote` a line the skill quotes. */
export type ArcSkillLineAs = "meta" | "h1" | "h2" | "body" | "quote" | "rule";

/** One line of the file, as drawn. */
export interface ArcSkillLine {
  id: string;
  as: ArcSkillLineAs;
  /** The line's own words, shortened but never invented. ≤ 240. */
  text: string;
  /** The front-matter key, under `as: "meta"` only, e.g. "description". */
  key?: string;
  /** The note this line carries. Each of 1, 2, 3 marks exactly one line, in
   *  ascending order down the file. */
  mark?: 1 | 2 | 3;
}

/** A note beside the file. */
export interface ArcSkillNote {
  id: string;
  n: 1 | 2 | 3;
  /** ≤ 32. */
  title: string;
  /** ≤ 200. */
  body: string;
}

/* ── The conversation (ADR-139) ───────────────────────────────────── */

/** What Claude's turn is built of. */
export type ArcChatBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: readonly string[] }
  | { kind: "rows"; rows: readonly { term: string; def: string }[] }
  /** The thing being filed, shown whole before anything is filed. */
  | { kind: "issue"; title: string; rows: readonly { term: string; def: string }[] };

/** One turn. `tool` is the quiet line naming what Claude reached for. */
export type ArcChatTurn =
  | { kind: "you"; id: string; text: string; slash?: string }
  | { kind: "tool"; id: string; text: string }
  | { kind: "claude"; id: string; blocks: readonly ArcChatBlock[] };

/** The column beside the panel. */
export type ArcChatAside =
  | {
      kind: "menu";
      label: string;
      /** The menu's own head, e.g. "Skills, and the plugin each came from". */
      title: string;
      items: readonly { id: string; name: string; from: string; on?: true }[];
    }
  | {
      kind: "steps";
      label: string;
      /** Exactly four: sorted, decided, drafted with its test, delivered. */
      items: readonly { id: string; title: string; body: string }[];
    };

/* ── The circuit (ADR-133 U2) ─────────────────────────────────────── */

export interface CircuitConfig {
  id: string;
  /** The card's name, authored in sentence case and UPPERCASED by the
   *  drawing at the board card's name rung: ≤ 14 characters. */
  name: string;
  /** The card's one line under it, e.g. "owned by the PMs" — the board's
   *  own "owned by the studio", one workflow down. */
  line: string;
}

/** How a record row's output is DRAWN: the quantity, as marks. */
export type CrewOutput =
  | { kind: "field"; count: number }
  | { kind: "funnel"; lines: number }
  | { kind: "tenfold" }
  /** One bar divided into segments: a count allocated across partners and
   *  formats (Mímir's briefing division). */
  | { kind: "split"; parts: number };

/** One row of the record: the role, the workstream it runs, what came of
 *  it (ADR-133 U6: roles on the left, workstreams on the right, one size). */
export interface CrewRow {
  id: string;
  /** The role, e.g. "Two designers and a copywriter". */
  who: string;
  /** The workstream, e.g. "Paid social". */
  work: string;
  /** What is possible now, one line, e.g. "About 700 assets a month". The
   *  record's own number, if any, lives here and nowhere else. */
  line: string;
  output: CrewOutput;
}

/* ── The curve's models (ADR-130 U5) ─────────────────────────────────── */

/** A model as the curve names it, with its list price per million tokens. */
export interface ArcCurveModel {
  name: string;
  input: number;
  output: number;
  /** The vendor lists the price as promotional. */
  promo?: true;
}

export interface ArcCurveLane {
  id: "fast" | "everyday" | "frontier";
  /** The lane's chip, e.g. "FAST". */
  label: string;
  models: readonly ArcCurveModel[];
}

/* ── The workshop's framing (ADR-130) ─────────────────────────────────── */

/** One of the three stages. The label rides the housing and heads the row. */
export interface ArcStage {
  id: string;
  /** Mono, on the housing's band and as the row's kicker. */
  label: string;
  /** The row's name: what you do with it. */
  name: string;
  body: string;
  /** One of the client's own pieces of work at this stage (ADR-136), drawn
   *  as a fourth line in the ROW under the section's `own` prefix — never on
   *  the plinth, whose labels are the walk's. ≤48, digit-free; all three
   *  stages carry one or none does. */
  example?: string;
  /** The last stage — the one bright object. Exactly one. */
  lit?: true;
}

/** A gate on the agent's run. `check` and `retry` are the model's own (an
 *  open node); `ask` stops for a person (a filled one). */
export interface ArcHorizonGate {
  kind: "check" | "retry" | "ask";
  /** Where on the run, 0 → 1. */
  at: number;
  label: string;
}

/** The owner's own track (ADR-133 U2): the upstream work, three spans in the
 *  order the work runs, that the agent's run below gives time back to. */
export interface ArcHorizonUpstream {
  label: string;
  /** Three spans, left to right, e.g. "The brief" · "Concepting" · "Campaign imagery". */
  spans: readonly [string, string, string];
  /** The same track as one sentence, for the phone. */
  line: string;
}

/** The owner's plate beside the horizon (ADR-133 U2): who answers for the
 *  work, and the three things that stay theirs — the house plate in the
 *  human's green. */
export interface ArcHorizonOwner {
  /** Mono kicker, e.g. "The owner". */
  key: string;
  /** Who, e.g. "The PMs and producers". */
  name: string;
  rows: readonly [ArcHorizonOwnerRow, ArcHorizonOwnerRow, ArcHorizonOwnerRow];
}

export interface ArcHorizonOwnerRow {
  /** Mono tag, a verb, e.g. "Writes". */
  tag: string;
  line: string;
}

/** One of the six questions around the work. */
export interface ArcQuestion {
  id: string;
  /** Mono kicker, e.g. "De context". */
  title: string;
  /** The question it answers, e.g. "Wat het weet". */
  question: string;
  /** This work's answer. */
  answer: string;
  /** One of the two the team writes: lit gold, and carries the tag. */
  lit?: true;
  /** The person who answers for it: green, the human and nothing else. */
  human?: true;
}

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
  /** The arc's id — kebab-case, unique across the registry, and never
   *  equal to a client slug (the overview and the client pages use both as
   *  element ids). Since ADR-142 it is NOT the address: that is `leaf`. */
  slug: string;
  /**
   * The arc's last address segment (ADR-142): the page lives at
   * `/arcs/<client>/<leaf>`, or `/arcs/thoughtform/<leaf>` for a house
   * format. Kebab-case and unique within its group (the registry test).
   * ⚠ A `-v2` cut that spreads its v1 inherits the v1's leaf and must
   * restate it, or the two pages claim one address.
   */
  leaf: string;
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
  /**
   * How a head-bearing beat sits on the page (ADR-128 U2). Absent ⇒ the
   * format's own law: a proposal seats its head on ADR-099's datum, solved
   * from the frame's centre, inside a viewport-tall beat. `"flow"` is
   * Linear's rule, measured on linear.app (2026-09-28, 1920×1247 and
   * 1440×900): every feature section's head sits a fixed 128px under the
   * section's top edge, and the section is as tall as its content (1220 to
   * 1232px at both heights). Nothing is placed against the viewport, so no
   * beat has leftover frame to pool above or below its head.
   *
   * ⚠ OPT-IN, NOT FORMAT-WIDE, AND THAT IS THE TRINNY PAGE. Its pinned scene
   * (ADR-102) is measured against the centre-solved datum; a format-wide
   * change moves it. Another proposal adopts the rule with this one line.
   */
  rhythm?: "flow";
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
    /** At most 40 characters as it reads: the homepage's measure (`HERO_MEASURE`, copyLaw.ts). */
    title: ArcTitle;
    /** ONE sentence of at most 120 characters. Who the page is from and for is the eyebrow's. */
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
