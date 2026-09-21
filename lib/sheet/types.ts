/**
 * lib/sheet/types — the sheet's content model (ADR-114).
 *
 * A SUBPAGE is a ruled sheet: a document of content-height sections, each
 * one ARRANGEMENT from the vocabulary below, on a twelve-column band whose
 * own rules the page draws. It is the third grammar on the site — the
 * corridor has one, the decks under `/arcs` another — and the first one for
 * overview pages: an index, an event page, a blog.
 *
 * ⚠ ZERO RUNTIME IMPORTS, like `lib/arcs`. A section is DATA; the renderer in
 * `components/sheet/` is what draws it, and `tests/lib/sheet-composition.test.ts`
 * walks every real page's ladder without mounting anything.
 *
 * ⚠ CHROME STRINGS ARE LETTERED BY RENDERERS, NEVER AUTHORED HERE. The
 * `// CLIENT` kicker, the `[ FIG. n ]` caption bar and the `01 /` ordinal are
 * drawn from a section's position and kind; a content record that carried
 * them would trip the copy law's bracket ban and put the same fact in two
 * places.
 */

/**
 * The arrangement vocabulary. Every section is exactly one of these.
 *
 * ⚠ THE LAST TWO ARE NOT DOCUMENT ARRANGEMENTS (ADR-118). `monitor` and `log`
 * are the two frames of the arcs overview's INSTRUMENT: a page that holds
 * either holds exactly those two, in that order, and is judged by
 * `instrumentViolations` rather than the variety law — it has no split, no
 * close and no ordinals, by decision.
 */
export const SHEET_ARRANGEMENTS = [
  "split",
  "row",
  "cells",
  "console",
  "timeline",
  "steps",
  "table",
  "figure",
  "prose",
  "close",
  "monitor",
  "log",
] as const;

/** The two arrangements that make an instrument page (ADR-118). */
export const INSTRUMENT_ARRANGEMENTS = ["monitor", "log"] as const;

export type SheetArrangement = (typeof SHEET_ARRANGEMENTS)[number];

/** A title with an optional emphasis run — upright gold, never italic. */
export interface SheetTitle {
  pre?: string;
  em?: string;
  post?: string;
}

/** One label/value pair of a readout column: the label dim, the value lit. */
export interface SheetReadoutRow {
  label: string;
  value: string;
}

/** One boxed station of a station row. */
export interface SheetStation {
  id: string;
  name: string;
}

/**
 * A row of boxed stations (ADR-089 U3/U4: outlined boxes with a margin,
 * the picked one filled). `attr` is the suffix of the `data-sh-<attr>`
 * attribute the row writes on `.sh-root`; the sheet's CSS narrows on it.
 */
export interface SheetStations {
  attr: string;
  label: string;
  stations: readonly SheetStation[];
}

/** A figure: a photograph taken into the duotone, a tool wireframe, or the
 *  house's own generative mark when a post has no picture. */
export type SheetFigureDef =
  | {
      kind: "image";
      src: string;
      alt: string;
      width: number;
      height: number;
      caption: string;
      /** `duotone` (the default) takes the photograph into the grammar. */
      treatment?: "duotone" | "plain";
    }
  | { kind: "mark"; caption: string; seed?: number };

/** A figure with the copy that sits beside or under it. */
export interface SheetFigureItem {
  id: string;
  figure: SheetFigureDef;
  kicker?: string;
  title?: string;
  lede?: string;
  href?: string;
}

/** A portrait flashcard — the services-card composition in DOM: kicker and
 *  title at the top, the figure in the middle, the paragraph at the bottom. */
export interface SheetFlashcard {
  id: string;
  kicker: string;
  title: string;
  body: string;
  figure: SheetFigureDef;
  href: string;
  /** Published as `data-*` on the card so a station row can narrow on it. */
  data?: Record<string, string>;
}

/** One client console: the sticky terminal panel and its pile of cards. */
export interface SheetConsoleDef {
  /** The DOM id — a chapter target, so the header's nav can find it. */
  id: string;
  menuLabel?: string;
  menuPrimary?: true;
  panel: {
    name: string;
    kicker?: string;
    readout: readonly SheetReadoutRow[];
    lede: string;
    href?: string;
  };
  cards: readonly SheetFlashcard[];
  data?: Record<string, string>;
}

/* ------------------------------------------------ the instrument (ADR-118) */

/** Where an engagement stands — the registry's three words, never a fourth. */
export type SheetStanding = "proposed" | "running" | "shipped";

/**
 * A value the monitor carries for BOTH of its time windows.
 *
 * ⚠ THE WINDOW IS A KNOB, AND A KNOB IS AN ATTRIBUTE THE CLIENT MAY FLIP
 * (`span`, `?k=SG`), so the server renders both answers and CSS picks one.
 * A window chosen on the server would make the direction unshootable.
 */
export interface SheetSpan<T> {
  /** The engagements' own stretch, in whole divisions (the house). */
  active: T;
  /** The whole record, from the oldest relationship to today. */
  full: T;
}

/** One window of the monitor's time axis: whole divisions, day-linear. */
export interface SheetAxisWindow {
  /** `YYYY-MM-DD`, the first day of the first division. */
  from: string;
  /** `YYYY-MM-DD`, the last day of the last division, inclusive. */
  to: string;
  division: "week" | "month" | "quarter";
  /** The division size as the title row letters it — `1 week`. */
  divisionLabel: string;
  /** The window as the title row letters it — `20 Jul to 27 Sep 2026`. */
  rangeLabel: string;
  /** Every division boundary from the first (at 0), as a fraction of the
   *  window; `label` is empty where the boundary is drawn and not lettered. */
  ticks: readonly { at: number; label: string }[];
}

/** One lane of the monitor: a client, or one kind of house format. */
export interface SheetMonitorLane {
  id: string;
  /** Lettered at the lane's left end. */
  name: string;
  /** Lettered at the lane's right end — a reading, never a label. */
  reading: string;
  /** The year a relationship began, lettered at the lane's left edge only
   *  when it began before the window opens (the lane ENTERS the plot). */
  since?: string;
}

/** One engagement, seated on its lane at the date it was filed. */
export interface SheetMonitorMark {
  /** The engagement's id — the same id names its log row and its dossier. */
  id: string;
  lane: string;
  /** `YYYY-MM-DD`. */
  date: string;
  /** Where the date sits on each window, 0..1, at the middle of its day. */
  at: SheetSpan<number>;
  standing: SheetStanding;
  /** The accessible name: what it is, where it stands, when it was filed. */
  label: string;
  /** The arc's section count (one dot each), or null for a page the
   *  registry does not hold sections for — a bare mark, never a fake count. */
  sections: number | null;
  /** The engagement's page: a mark is a real link without script. */
  href: string;
  /** Present only when several engagements share this lane AND this day: the
   *  mark's step off the lane's rule, centred on it (-0.5, +0.5, …). */
  slot?: number;
}

/** One engagement row of the log. */
export interface SheetLogRow {
  id: string;
  /** The chip: what the page is — proposal, pitch, portfolio, workshop, keynote. */
  chip: string;
  /** Sentence case, the client's name taken off where the group head says it. */
  title: string;
  /** `YYYY-MM-DD`; the renderer letters it bracketed. */
  date: string;
  standing: SheetStanding;
  /** The filter's token. */
  kind: string;
  href: string;
}

/** One group of the log: a client, or the house formats. */
export interface SheetLogGroup {
  id: string;
  name: string;
  rows: readonly SheetLogRow[];
}

/** Everything the dossier says about one engagement. */
export interface SheetDossier {
  /** = the row's id and the mark's. */
  id: string;
  /** The designation in the head band — the client, linking to its page. */
  designation: { name: string; href?: string };
  /** The head band's right-hand word — the kind, singular. */
  kind: string;
  title: string;
  lede: string;
  image: { src: string; alt: string; width: number; height: number };
  /** Label/value pairs a reader could check against the registry. */
  readout: readonly SheetReadoutRow[];
  /** The arc's chapters, in page order; empty for a page with none. */
  chapters: readonly { id: string; label: string; href: string }[];
  cta: { label: string; href: string };
}

interface SheetSectionBase {
  /** The DOM id — an anchor and, with `menuLabel`, a drawer entry. */
  id: string;
  /** The mono kicker on the section's head band. */
  kicker?: string;
  menuLabel?: string;
  /** A chapter — it takes a link in the header's inline row (≤5 per page). */
  menuPrimary?: true;
  ariaLabel?: string;
}

export type SheetSection = SheetSectionBase &
  (
    | {
        kind: "split";
        name: string;
        title: SheetTitle;
        paragraphs: readonly string[];
        readout?: readonly SheetReadoutRow[];
        stations?: SheetStations;
      }
    | {
        kind: "row";
        items: readonly {
          id: string;
          ordinal?: string;
          title: string;
          tags: readonly string[];
          body: string;
          figure?: SheetFigureDef;
          href?: string;
        }[];
      }
    | {
        kind: "cells";
        n: 2 | 3 | 4;
        cells: readonly {
          id: string;
          kicker: string;
          body: readonly string[];
          caption?: string;
          href?: string;
          readout?: readonly SheetReadoutRow[];
          steps?: readonly { when: string; what: string }[];
          data?: Record<string, string>;
        }[];
      }
    | {
        kind: "console";
        /** A uniform SET of consoles is one section; each is its own chapter. */
        consoles: readonly SheetConsoleDef[];
      }
    | {
        kind: "timeline";
        /** `YYYY-MM` at both ends, inclusive. */
        axis: { from: string; to: string };
        items: readonly { id: string; date: string; title: string; sub?: string }[];
        /** The one lit item's id. */
        lit: string;
      }
    | {
        kind: "steps";
        items: readonly {
          id: string;
          when: string;
          title: string;
          lines?: readonly string[];
          cta?: { label: string; href: string };
        }[];
        /** The one open item's id. */
        open: string;
      }
    | {
        kind: "table";
        columns: readonly [string, string, string, string];
        rows: readonly {
          id: string;
          cells: readonly [string, string, string, string];
          href?: string;
          tags?: readonly string[];
          draft?: true;
        }[];
        stations?: SheetStations;
      }
    | {
        kind: "figure";
        items: readonly SheetFigureItem[];
      }
    | {
        kind: "prose";
        meta: readonly SheetReadoutRow[];
      }
    | { kind: "close" }
    | {
        /** The instrument's first frame: the record, plotted (ADR-118). */
        kind: "monitor";
        /** The strip it hangs from: a name and its readings. */
        datum: { name: string; readings: readonly SheetReadoutRow[] };
        /** The first readout cell: the page's own name and one line. */
        identity: { name: string; lede: string };
        /** The other readout cells, each a label over its rows. */
        cells: readonly { id: string; label: string; rows: readonly SheetReadoutRow[] }[];
        plot: {
          windows: SheetSpan<SheetAxisWindow>;
          lanes: readonly SheetMonitorLane[];
          /** Sorted by date, oldest first. */
          marks: readonly SheetMonitorMark[];
          now: { date: string; label: string; at: SheetSpan<number> };
        };
        /** The strip it sits on; its `Marks` reading is the diamonds' count. */
        terminus: readonly SheetReadoutRow[];
        /** The one lit mark — the log's selection, on the server. */
        lit: string;
      }
    | {
        /** The instrument's second frame: the record, opened (ADR-118). */
        kind: "log";
        filter: SheetStations;
        groups: readonly SheetLogGroup[];
        dossiers: readonly SheetDossier[];
        /** The one filled row, chosen on the server: the newest engagement. */
        selected: string;
      }
  );

export interface SheetPageDef {
  slug: string;
  name: string;
  sections: readonly SheetSection[];
}
