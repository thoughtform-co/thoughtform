/**
 * The ON RECORD cards' thumbnails (ADR-082 U43) — three line-drawn
 * pictograms, one per coverage KIND (`VW_OUTLET_KIND`), in the reticle's own
 * register: a 1px dawn hairline, straight lines only, one filled signal.
 *
 * Owner, 2026-09-24: the thumbnail "looks like a trash bin … can we do
 * something a bit more elegant?" It did — the magazine's pixel mark was a wide
 * masthead bar over a narrow box with a bright centre, which is the bin's
 * silhouette exactly, and it was that glyph's FOURTH cut on the 7×7 particle
 * lattice (a letter C, a person, a 17-pixel draft, the bin). Seven cells cannot
 * tell a magazine from a newspaper from a can; twenty-one units of hairline
 * can. FACTS keeps `ERA_MARKS`: a fact's mark is a wayfinding bullet beside a
 * label, a record's thumbnail is a PICTURE of a kind, and that the station now
 * carries two icon media is the named cost of this pass.
 *
 * The grammar, as this file holds it (ADR-059's section glyphs, one size up):
 *   · a 21-unit grid rendered at 21px, so one unit is one CSS pixel;
 *   · `lines` are `[x1, y1, x2, y2]`, a 1px stroke each. An AXIS line sits on
 *     the half pixel ACROSS its length (`n + 0.5`) and runs integer to integer
 *     ALONG it, so butt caps fill whole pixels — `[3, 1.5, 18, 1.5]` is row 1,
 *     columns 3 through 17, crisp with no `crispEdges`. A DIAGONAL is 45°
 *     exactly (|dx| = |dy|) and ends on pixel centres; it is anti-aliased on
 *     purpose (this is the hairline register, not the lattice: the mark's
 *     `shape-rendering` is `geometricPrecision`, never `crispEdges`);
 *   · at most twelve lines;
 *   · ONE `signal`, a filled rectangle on whole pixels — the one thing the
 *     picture is of (the paper's photograph, the cover's picture, the screen's
 *     lit centre).
 * `tests/lib/record-marks.test.ts` holds every clause. ⚠ A new drawing
 * re-runs `scripts/capture-record-marks.mjs`, the UNLABELLED contact sheet,
 * before it ships — the magazine's four cuts were each legal and each read as
 * something else.
 *
 * ⚠ DAWN ONLY — the line at .62, the signal at full dawn — and unchanged on
 * hover: gold on this station is the era band's "you are here" (ADR-082 U26).
 *
 * Zero-import, like the registry beside it.
 */

export type RecordMarkLine = readonly [x1: number, y1: number, x2: number, y2: number];

export interface RecordMarkSignal {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface RecordMark {
  /** The drawing: 1px hairlines on the 21-unit grid. */
  readonly lines: readonly RecordMarkLine[];
  /** The one filled thing — what the picture is of. */
  readonly signal: RecordMarkSignal;
}

/** The three kinds of coverage the record names (`VW_OUTLET_KIND`'s values;
 *  the test pins the two sets equal). */
export type RecordMarkKind = "newspaper" | "magazine" | "broadcast";

/** The grid's side, in units — and in CSS pixels at the card's 21px. */
export const RECORD_MARK_GRID = 21;

/** Restraint: a thumbnail is a pictogram, not an illustration. */
export const RECORD_MARK_MAX_LINES = 12;

export const RECORD_MARKS: Readonly<Record<RecordMarkKind, RecordMark>> = {
  /* NEWSPAPER — a broadsheet: the sheet, a masthead rule across it, two lines
     of a column beside the picture, two lines running the full measure under
     it. The signal is the photograph. */
  newspaper: {
    lines: [
      [3, 1.5, 18, 1.5],
      [3, 19.5, 18, 19.5],
      [3.5, 1, 3.5, 20],
      [17.5, 1, 17.5, 20],
      [3, 5.5, 18, 5.5],
      [6, 8.5, 10, 8.5],
      [6, 10.5, 10, 10.5],
      [6, 13.5, 16, 13.5],
      [6, 16.5, 16, 16.5],
    ],
    signal: { x: 12, y: 8, w: 4, h: 4 },
  },
  /* MAGAZINE — a bound cover: the sheet, a SPINE two units inside its left
     edge (what a newspaper does not have), the masthead rule, and ONE large
     framed picture — the cover is its picture. The signal sits at the frame's
     centre. */
  magazine: {
    lines: [
      [3, 1.5, 18, 1.5],
      [3, 19.5, 18, 19.5],
      [3.5, 1, 3.5, 20],
      [17.5, 1, 17.5, 20],
      [5.5, 1, 5.5, 20],
      [6, 5.5, 18, 5.5],
      [8, 8.5, 15, 8.5],
      [8, 16.5, 15, 16.5],
      [8.5, 8, 8.5, 17],
      [14.5, 8, 14.5, 17],
    ],
    signal: { x: 10, y: 11, w: 3, h: 3 },
  },
  /* BROADCAST — a set: a landscape screen on a stem and a base, two rabbit
     ears rising 45° off the top centre. The signal is the lit screen. */
  broadcast: {
    lines: [
      [2, 6.5, 19, 6.5],
      [2, 15.5, 19, 15.5],
      [2.5, 6, 2.5, 16],
      [18.5, 6, 18.5, 16],
      [10.5, 16, 10.5, 19],
      [6, 18.5, 15, 18.5],
      [10.5, 6.5, 6.5, 2.5],
      [10.5, 6.5, 14.5, 2.5],
    ],
    signal: { x: 9, y: 10, w: 3, h: 3 },
  },
};
