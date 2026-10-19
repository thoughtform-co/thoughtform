/**
 * The case dossier's record: one case as a template (owner, 2026-10-19:
 * "treating this like a template that shows only the relevant
 * information"): the result first (what it saved and what it now allows),
 * then one chapter per step, each a kick, one sentence and one picture.
 *
 * A case is data only. `story.ts` checks it and cuts it; the renderers in
 * `blocks/` draw each figure kind in the house grammar. There is no `html`
 * kind: every picture is one of the kinds below, so every picture obeys the
 * frame, the line law and the one lit object.
 */

import type { GlyphName } from "./Glyph";

export type Cut = "short" | "full";

/** A client's field: dots on a square lattice, on a hex lattice, or a fine
 *  grid with a brighter point every fifth. */
export interface Tint {
  dots: string;
  glow: string;
  pattern: "dots" | "hex" | "grid";
}

/** The case head's type, while the owner picks: one mono line, one sans
 *  line, the project as the one title, or rows of keys and values. */
export type Head = "a" | "b" | "c" | "d";

/** An image or a still at a fixed aspect ratio, so nothing below the swarm
 *  changes height as it loads (`SwarmAct` rebuilds on any page resize). */
export interface Still {
  src: string;
  /** "9/16", "4/5", "16/9", "1/1" … */
  ratio: string;
  alt: string;
}

export type Cell =
  | { kind: "still"; still: Still; label: string; note?: string; lit?: boolean; span?: number }
  | {
      kind: "list";
      label: string;
      items: readonly { b: string; s?: string }[];
      numbered?: boolean;
      span?: number;
    }
  | { kind: "stat"; label: string; big: string; small?: string; note?: string; span?: number }
  | { kind: "safe"; label: string; note?: string; span?: number };

export interface Segment {
  from: number;
  to: number;
  label?: string;
  lit?: boolean;
}

export interface Lane {
  label: string;
  segments?: readonly Segment[];
  /** Points along the axis (kicks, effects, cuts). */
  ticks?: readonly number[];
  /** A level drawn as a stepped run: [t, 0..1] pairs. */
  level?: readonly (readonly [number, number])[];
  /** A named moment on this lane. */
  marks?: readonly { at: number; label: string; lit?: boolean }[];
}

export type Figure =
  | {
      kind: "film";
      src: string;
      poster: string;
      ratio: string;
      alt: string;
      facts: readonly string[];
      sound?: boolean;
    }
  | { kind: "plates"; rows: readonly (readonly Cell[])[]; tags?: readonly string[] }
  | {
      kind: "pairs";
      pairs: readonly {
        label: string;
        sent: { still: Still; why: string };
        kept: { still: Still; note: string };
      }[];
      reviewers?: readonly { who: string; does: string; ok: boolean }[];
    }
  | {
      kind: "track";
      /** The axis, from 0 to `length`, in `unit`. */
      length: number;
      unit: string;
      /** Where the axis is lettered. */
      scale: readonly number[];
      /** Light rulings: one beat, one bar … */
      grid?: { minor: number; major: number };
      lanes: readonly Lane[];
      frames?: readonly { still: Still; label: string }[];
      key?: string;
    }
  | {
      kind: "exchange";
      crumb?: readonly string[];
      who: string;
      message: string;
      thought?: string;
      question?: { title: string; options: readonly string[]; selected: number; of: string };
      answers?: { label: string; rows: readonly { k: string; v: string; tag?: string }[] };
      result?: { k: string; v: string };
      /** The options are illustrative, not the session's own. */
      illustrative?: boolean;
    }
  | {
      kind: "ledger";
      bar?: { label: string; parts: readonly { name: string; value: number; shown: string }[] };
      rows?: readonly { k: string; v: string }[];
      before?: { k: string; v: string };
      now?: { k: string; v: string };
      total?: { k: string; v: string };
      estimated?: boolean;
    }
  | {
      kind: "field";
      /** The map is read on the server from its record, by name. */
      map: "suri-drive";
      labels: readonly { group: number; text: string }[];
      lit?: number;
    }
  | {
      /** An interface the work shipped, drawn from its own layout and
       *  labels; pictures are grain, never footage. */
      kind: "screen";
      layout: "search" | "review" | "list" | "task";
      /** "suri" / "clickup": the app's own look (its palette, type and
       *  radii), redrawn; else the house grammar. */
      skin?: "suri" | "clickup";
      /** clickup: the path in the app's header */
      crumbs?: readonly string[];
      /** clickup list: the columns after the name, and the rows by status */
      columns?: readonly string[];
      groups?: readonly {
        status: string;
        tone: string;
        rows: readonly { name: string; cells: readonly string[]; lit?: boolean }[];
      }[];
      /** clickup task: its status (`status`), custom fields, the brief's
       *  sections, and the strategist's raw notes it was written from */
      fields?: readonly { k: string; v: string }[];
      sections?: readonly { h: string; lines: readonly { k?: string; v: string }[] }[];
      raw?: { who: string; text: string };
      app: string;
      /** search: the views' counts beside the sidebar's names, where known */
      counts?: readonly (string | null)[];
      /** search: a picture as the question instead of words */
      picture?: string;
      /** search: the results line ("57,517 assets · 312 matching moments") */
      results?: string;
      /** review: the breadcrumb over the player, and the scene line under it */
      crumb?: string;
      scene?: string;
      /** review: the file name the tags write */
      naming?: { label: string; value: string };
      /** review: tags, by group */
      tags?: readonly { label: string; chips: readonly string[] }[];
      /** search: the sidebar's lettered views, the first in view */
      nav?: readonly string[];
      foot?: string;
      query?: string;
      action?: string;
      facets?: readonly string[];
      status?: string;
      tiles?: readonly {
        ratio: string;
        /** a published picture (the client's own campaign still) */
        src?: string;
        badge?: string;
        verdict?: string;
        hit?: string;
        lit?: boolean;
        name?: string;
        meta?: string;
        versions?: string;
      }[];
      /** search: a second, unlettered row of pictures under the first */
      more?: readonly string[];
      /** search: the picture asked with */
      pictureSrc?: string;
      /** review: the clip in the player, and the scene strip */
      playerSrc?: string;
      strip?: readonly { src: string; at: string }[];
      sub?: string;
      summary?: string;
      /** review: the open clip */
      open?: string;
      scenes?: number;
      sceneLit?: number;
      /** a person's note, pinned on the lit scene */
      pin?: string;
      title?: string;
      states?: readonly string[];
      stateOn?: number;
      tabs?: readonly string[];
      tabOn?: number;
      lines?: readonly string[];
    }
  | {
      /** A collection as it was: its folders as a treemap, its files as
       *  grains, the duplicates lit. Read on the server by name. */
      kind: "sprawl";
      map: "suri-drive";
      key: readonly string[];
    }
  | {
      /** The library's own map in 3D: a point per item in its group's
       *  colour, turned slowly. Read in the browser by name. */
      kind: "cloud";
      map: "suri-library";
      title: string;
      note: string;
      /** the groups the list names: the group index and generic words */
      named: readonly { group: number; text: string }[];
    }
  | {
      /** A spreadsheet as it was: its columns, a few rows, the faults marked
       *  by number and named under it. */
      kind: "sheet";
      file: string;
      tab: string;
      /** the formula bar's contents, if any */
      fx?: string;
      columns: readonly { label: string; w?: number }[];
      rows: readonly (readonly string[])[];
      marks: readonly { row: number; col: number; n: number }[];
      notes: readonly { n: number; text: string }[];
    }
  | {
      /** A name taken apart: each part with the field it comes from. */
      kind: "anatomy";
      parts: readonly { v: string; k: string; src: "list" | "text" | "fixed" }[];
      rules: readonly { label: string; note: string }[];
      fail?: { v: string; note: string };
    }
  | {
      /** A chain read left to right, each link a step with its source. */
      kind: "chain";
      links: readonly { k: string; v: string; src?: string; lit?: boolean }[];
    }
  | {
      kind: "flow";
      stations: readonly {
        k: string;
        title: string;
        note?: string;
        items?: readonly { t: string; hit?: boolean }[];
        person?: boolean;
        lit?: boolean;
      }[];
    };

export type FigureKind = Figure["kind"];

/** The window round a figure: its path in the head row, an optional state
 *  beside it, and its datum in the foot row. */
export interface Framed {
  /** What the figure is, after the client in the head row: a few words. */
  head: string;
  /** A short state on the head row's right ("Live", "3 of 3"). */
  state?: string;
  /** What the drawing is measured against, in the foot row. */
  datum?: string;
  figure: Figure;
}

export interface Chapter {
  /** The position in the full cut; stable across cuts, and the FIG number. */
  n: number;
  id: string;
  kick: string;
  /** The chapter's name in the index, one word ("Ask"); else the kick. */
  nav?: string;
  /** The step's title, in two tones: it changes with every step (owner,
   *  2026-10-19: "one title that explains the section, a bit of a
   *  paragraph, and then some bullet points", the Loop story's grammar). */
  title: readonly [string, string];
  /** A short paragraph under it. */
  sub?: string;
  /** At most three short points; a person's decision takes the diamond. */
  points?: readonly { text: string; person?: boolean }[];
  short?: boolean;
  /** Where the step can be checked (a session date, a commit). */
  source?: string;
  frame: Framed;
}

/** The panel before a case (owner, 2026-10-19: "between each section …
 *  an interstitial slide … that introduces the client and their specific
 *  challenges"): the challenge in one sentence, or in the client's own
 *  words, and at most three facts as filed. */
export interface Intro {
  /** One sentence in two tones; with `who`, the client's words, quoted. */
  line: readonly [string, string];
  who?: string;
  facts?: readonly { value: string; label: string }[];
}

/** The result, the same two parts in every case (owner, 2026-10-19: "we
 *  just need to have … before and then what it now allows"). The two must
 *  contrast, never restate each other in the positive. */
export interface Result {
  /** The solution, at the steps' title size, in gold (owner, 2026-10-19:
   *  "the first left panel clearly needs to state the solution"). */
  title: readonly [string, string];
  /** How the work went before. */
  before: string;
  /** What the team can do now that it could not. */
  allows: string;
}

export interface Case {
  id: string;
  /** The client, as the page names it. */
  client: string;
  /** The menu's words for it ("Motion ad · Loop"). */
  nav: string;
  /** The project: what was asked, in a line, and its particle icon. */
  project: string;
  glyph: GlyphName;
  /** The workstream it proves ("Creative production"); its icon follows. */
  workstream: string;
  /** The client's logo: a mark (shown with the client's name) or a wordmark,
   *  a white file tinted to the ink in CSS. */
  logo: { src: string; ratio: string; mark?: boolean };
  /** The client's field behind the case: the particles' colour, the glow
   *  under them (rgb triples), and the particles' pattern. */
  tint: Tint;
  /** The panel that introduces the case. */
  intro: Intro;
  /** The result: before, and what it now allows. */
  result: Result;
  /** The numbers under the result, where the case has them (time saved
   *  among them, marked estimated); a case without any shows none. */
  stats: readonly { value: string; label: string }[];
  /** The piece itself, before the chapters. */
  opening: Framed;
  chapters: readonly Chapter[];
}
