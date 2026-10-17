/**
 * The case dossier's record: one case, told the way the motion skill's
 * show-and-tell tells a piece (the piece, then one chapter per step that
 * happened, each a kick, a two-line title, one sentence and one picture),
 * with two things the page adds for a reader who was not there:
 *
 *   thought  what the model reasoned at that step, as a short trace
 *   call     where a person decided, by role, in their words
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

/** A person's decision, named by role, never by name. */
export interface Call {
  who: string;
  said: string;
}

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
      layout: "search" | "review";
      app: string;
      /** search: the sidebar's lettered views, the first in view */
      nav?: readonly string[];
      foot?: string;
      query?: string;
      action?: string;
      facets?: readonly string[];
      status?: string;
      tiles?: readonly {
        ratio: string;
        badge?: string;
        verdict?: string;
        hit?: string;
        lit?: boolean;
      }[];
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

/** The frame around a figure: its head (heading inside the frame, never
 *  over it), its datum, and the caption it closes on. */
export interface Framed {
  /** The figure's head, inside the frame: a few words in mono. */
  head: string;
  /** What the drawing is measured against (an axis, a scale, a level). */
  datum?: string;
  /** The `FIG.` caption, bottom left. */
  caption: string;
  figure: Figure;
}

export interface Chapter {
  /** The position in the full cut; stable across cuts, and the FIG number. */
  n: number;
  id: string;
  kick: string;
  /** The chapter's name in the index, one word ("Ask"); else the kick. */
  nav?: string;
  title: readonly [string, string];
  sub: string;
  thought: readonly string[];
  call?: Call;
  short?: boolean;
  /** Where each thought or call can be checked (a session date, a commit). */
  source?: string;
  frame: Framed;
}

export interface Case {
  id: string;
  /** The client, as the page names it. */
  client: string;
  /** The menu's words for it ("Motion ad · Loop"). */
  nav: string;
  /** The project, as a label ("Motion ad"), and its particle icon. */
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
  /** The header's numbers, the first the result: a value, a short label. */
  stats: readonly { value: string; label: string }[];
  /** The piece, in one line. */
  piece: string;
  date: string;
  /** One number for the head, and what it counts. */
  number: { value: string; label: string };
  /** The words beside the piece, before the first chapter. */
  title: readonly [string, string];
  sub: string;
  /** The piece itself, before the chapters. */
  opening: Framed;
  chapters: readonly Chapter[];
}
