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

/** The arrangement vocabulary. Every section is exactly one of these. */
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
] as const;

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
  );

export interface SheetPageDef {
  slug: string;
  name: string;
  sections: readonly SheetSection[];
}
