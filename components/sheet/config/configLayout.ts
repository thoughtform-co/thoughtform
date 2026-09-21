import {
  adv,
  type LetterSpec,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaLetters";
import {
  polylineLength,
  ribbonOffsets,
  type Pt,
} from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";
import type { SheetConfigLink, SheetConfigRow, SheetConfiguration } from "@/lib/sheet/types";

/**
 * configLayout — the arithmetic of the dossier's configuration board (ADR-118
 * U2). Pure: no React, no DOM, no clock.
 *
 * The owner's first reference is a circuit board: ONE bright chip at the
 * centre, dark chips around it, multi-wire buses with 45° jogs between them,
 * a faint board behind. His brief put the client's record on it: the centre
 * is the TYPES OF WORK the configuration is for (the proposal's workstreams),
 * and around it are what it runs on and inside (`lib/arcs/stack.ts`). A bus
 * is as wide as the number of workstreams that name its chip.
 *
 * ⚠ FOUR CROPS OF ONE RECORD, AND A CONTAINER QUERY PICKS ONE. The dossier's
 * board box runs from ~1.45 wide on a laptop to ~1.0 at the owner's window,
 * and SVG `meet` fits by the SMALLER ratio: one crop letterboxes one end of
 * that range (ADR-070 U12 — 270px of dead panel on his own monitor while
 * every assertion stayed green). All four are rendered server-side and CSS
 * shows the one whose aspect the box has (`CROP_SWITCH`, mirrored by hand in
 * `instrument.css` and pinned there by `sheet-config-fit`).
 *   · `wide` / `mid` FLANK the centre: the chips in two columns, buses
 *     running sideways — a landscape box.
 *   · `tall` / `narrow` STACK it: a row of chips above and a row below —
 *     the owner's portrait window, and the phone.
 *
 * ⚠ FIT IS DECLARED, NOT REVIEWED (ADR-100's idiom). SVG `<text>` neither
 * wraps nor reports overflow: a label past its measure simply vanishes.
 * `configGeom` emits every lettered string WITH its measure, and
 * `tests/lib/sheet-config-fit.test.ts` walks the list for every real
 * proposal and the kit's ceiling, on all four crops — every string and its
 * longest word inside its measure, no wrapped tail sliced, every object
 * inside the crop, no two objects overlapping, every bus ending on its chip.
 *
 * ⚠ BALANCED BY COUNT, ORDERED BY KIND. The links arrive in the stack's order
 * (the language model, the model classes, the design tool, the work tools);
 * the first half takes the first side and the rest the second, so the
 * intelligence tends to sit on one side and the tools on the other without a
 * side ever holding more than half the ring.
 */

export type ConfigCropId = "wide" | "mid" | "tall" | "narrow";
export type Arrangement = "flank" | "stack";

export interface ConfigCrop {
  id: ConfigCropId;
  w: number;
  h: number;
  arrangement: Arrangement;
}

/* ⚠ SPACED SO NO SWITCH LETTERBOXES MORE THAN 10 %. Under `meet` a box of
   aspect r in a crop of aspect c fills min(r/c, c/r) of itself, so two
   neighbouring crops may differ by at most (1/0.9)² ≈ 1.23 in aspect. The
   first cut spaced 1.44 · 1.19 · 0.97 and left 13 % of the 1920 × 1080 box
   empty; these four hold ≥ 0.9 across the whole desktop range. */
export const CONFIG_CROPS: readonly ConfigCrop[] = [
  { id: "wide", w: 560, h: 362, arrangement: "flank" },
  { id: "mid", w: 560, h: 444, arrangement: "flank" },
  { id: "tall", w: 560, h: 549, arrangement: "stack" },
  { id: "narrow", w: 420, h: 520, arrangement: "stack" },
];

/**
 * Which crop a box of `w × h` CSS px shows — the container query's own logic,
 * restated so a test can hold the two together. Below `minWidthPx` the box is
 * the phone or the narrow desktop rung and takes `narrow` whatever its shape;
 * above it, the aspect picks, switching at the geometric mean of two crops'
 * aspects so the letterbox either side of a switch is equal.
 */
export const CROP_SWITCH = { minWidthPx: 480, midAspect: 1.134, wideAspect: 1.397 } as const;

export function cropFor(w: number, h: number): ConfigCropId {
  if (w < CROP_SWITCH.minWidthPx) return "narrow";
  const r = w / h;
  if (r >= CROP_SWITCH.wideAspect) return "wide";
  if (r >= CROP_SWITCH.midAspect) return "mid";
  return "tall";
}

/**
 * The board boxes MEASURED live at the reference shapes (the `.sh-cfg` box,
 * the container the crop is picked against), in CSS px. The fit test sets
 * the type floor and the fill against these; the smoke measures the same box
 * and fails when the page drifts from them by more than 2 %, so a CSS change
 * that shrinks the board cannot leave the floor asserted against a box that
 * no longer exists.
 */
export const BOARD_BOX_PX = {
  // Re-measured for ADR-118 U3: the readout's three framed rows and the one
  // big button took a little less height than U2's brief, its strip and the
  // key hints, so every box grew by 3.5–14px and every crop held.
  "1280x720": { w: 530.9, h: 348.5 },
  "1440x800": { w: 597.8, h: 406.9 },
  "1920x1080": { w: 746.7, h: 581.1 },
  "1920x1247": { w: 746.7, h: 721.4 },
} as const;

/** How much of a box a crop fills under `meet`, 0..1 (the rest is letterbox). */
export function fillOf(crop: ConfigCrop, w: number, h: number): number {
  const s = Math.min(w / crop.w, h / crop.h);
  return (crop.w * s * crop.h * s) / (w * h);
}

/** The inset every crop keeps on all four sides. */
export const INSET = 14;
/** PP Neue Montreal's measured average advance, as a conservative cell. */
export const SANS_ADV = 0.55;

/**
 * The type ladder, in units. At the smallest desktop board (1280 × 720, the
 * `wide` crop) one unit paints ~0.97px, so names land ≥ 11px and kickers
 * ≥ 10px; `sheet-config-fit` pins that against the measured boxes.
 */
export const CFG_FS = {
  kicker: 10.75,
  name: 14,
  note: 11.75,
  tag: 10.75,
  chipKicker: 10.75,
  chipName: 12.5,
} as const;
/** The die's kicker is its LABEL (the house's .08em rung); a chip's kind is an
 *  eyebrow code (.15em). */
export const CFG_TRACK = { kicker: 0.08, chipKicker: 0.15, tag: 0.08 } as const;
/** The type floors in CSS px, at the smallest desktop box. */
export const CFG_FLOOR_PX = { name: 11, kicker: 10 } as const;

/**
 * The die — the one bright object — and its rows.
 *
 * ⚠ THE LINE STEPS CLEAR THE FONT'S EM BOX, NOT ITS INK. A `<text>`'s box is
 * its ascent to its descent (~1.2 em for PP Neue Montreal), so a name and the
 * note under it at 14 units apart printed their boxes through each other by a
 * pixel at 1440 × 800 — invisible as ink, and exactly what the smoke's
 * overlap walk measures. 17.5 between wrapped names and 16 from a name to its
 * note leave the boxes apart at every crop's scale.
 */
export const DIE = {
  pad: 12,
  head: 26,
  rowTop: 6,
  nameStep: 17.5,
  noteStep: 16,
  rowBottom: 7,
  foot: 4,
  cut: 14,
} as const;

/** A chip around it. */
export const CHIP = {
  pad: 9,
  head: 19,
  top: 6,
  nameStep: 15.5,
  bottom: 6,
  cut: 8,
  gap: 14,
} as const;

/** The flank's two columns and the lane each bus crosses. */
const FLANK = { chipW: 96, lane: 46 } as const;
/** The stack's die width cap and its chips' width cap. */
const STACK = { dieW: 330, chipW: 150, lane: 40 } as const;

/** How far a free-edge trace runs past the crop before the board clips it. */
const GHOST_RUN = 120;

/** A bus: two wires, plus two per workstream that names its chip, to eight. */
export const WIRE_PITCH = 3.5;
export const wiresFor = (users: number) => 2 + 2 * Math.min(Math.max(users, 1), 3);

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A letter's ink, resolved by a class (`.sh-cfg__t--<ink>`). `knock*` sit on
 *  the Tensor-gold die, `ink*` on a chip, and `gold` is a chip's kind code —
 *  the homepage board's key in Tensor gold (ADR-118 U3). */
export type ConfigInk = "knock" | "knock-dim" | "ink" | "ink-dim" | "gold";

export interface ConfigLetter extends LetterSpec {
  face: "mono" | "sans";
  x: number;
  y: number;
  anchor: "start" | "end";
  ink: ConfigInk;
  /** Lit weight (`--weight-lit`) — the die's workstream names alone. */
  lit?: boolean;
  /** The object the letter belongs to, so the fit test can hold it inside. */
  owner: string;
}

export interface ConfigChip {
  id: string;
  rect: Rect;
  /** Where its bus leaves it, on the edge that faces the die. */
  port: Pt;
}

export interface ConfigRow {
  id: string;
  rect: Rect;
  ghost: boolean;
}

export interface ConfigBus {
  id: string;
  pts: readonly Pt[];
  wires: number;
  len: number;
}

/** A pin: one wire's pad, where a bus lands on the die. */
export interface ConfigPin {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ConfigGeom {
  crop: ConfigCrop;
  die: Rect;
  /** The die's head band floor, and each row below it. */
  headFloor: number;
  rows: ConfigRow[];
  chips: ConfigChip[];
  buses: ConfigBus[];
  pins: ConfigPin[];
  /** Faint traces running off the board from the die's free edges. */
  ghosts: ConfigBus[];
  letters: ConfigLetter[];
}

const monoW = (text: string, fs: number, track: number) => text.length * adv(fs, track);
export const sansW = (text: string, fs: number) => text.length * SANS_ADV * fs;

/** A letter's width under the surface's advance model. */
export const letterWidth = (l: ConfigLetter) =>
  l.face === "mono" ? monoW(l.text, l.fs, l.track) : sansW(l.text, l.fs);

/** Greedy wrap to a character measure, every line kept. */
export function wrapAll(text: string, per: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > per && line) {
      out.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) out.push(line);
  return out;
}

/** Sans lines at a measure: wrapped, with every line past `max` declared at
 *  measure 0 so a tail the drawing would slice fails the fit test instead. */
function sansLines(text: string, fs: number, measure: number, max: number) {
  const lines = wrapAll(text, Math.max(1, Math.floor(measure / (SANS_ADV * fs))));
  return lines.map((line, i) => ({ line, measure: i < max ? measure : 0 }));
}

const tagW = (tag: string) => monoW(tag.toUpperCase(), CFG_FS.tag, CFG_TRACK.tag);

/** The die's width for a crop. */
function dieWidth(crop: ConfigCrop): number {
  return crop.arrangement === "flank"
    ? crop.w - 2 * (INSET + FLANK.chipW + FLANK.lane)
    : Math.min(crop.w - 2 * INSET, STACK.dieW);
}

/** A row's name measure: the die's inner width, less the tag and its gap. */
const nameMeasure = (dw: number, row: SheetConfigRow) =>
  dw - 2 * DIE.pad - (row.tag ? tagW(row.tag) + 10 : 0);

/** How tall a row is, from its own wrap. */
function rowHeight(dw: number, row: SheetConfigRow): number {
  const lines = Math.min(2, sansLines(row.name, CFG_FS.name, nameMeasure(dw, row), 2).length);
  return (
    DIE.rowTop + 17 + (lines - 1) * DIE.nameStep + (row.note ? DIE.noteStep : 0) + DIE.rowBottom
  );
}

/** How tall the die is for a record, in a crop. */
export function dieHeight(dw: number, rows: readonly SheetConfigRow[]): number {
  return DIE.head + rows.reduce((h, r) => h + rowHeight(dw, r), 0) + DIE.foot;
}

/** A chip's width in a crop, for a row of `k` chips. */
function chipWidth(crop: ConfigCrop, k: number): number {
  if (crop.arrangement === "flank") return FLANK.chipW;
  const row = crop.w - 2 * INSET;
  return Math.min(STACK.chipW, (row - (k - 1) * CHIP.gap) / Math.max(k, 1));
}

const chipNameMeasure = (cw: number) => cw - 2 * CHIP.pad;

function chipHeight(cw: number, link: SheetConfigLink): number {
  const lines = Math.min(2, sansLines(link.name, CFG_FS.chipName, chipNameMeasure(cw), 2).length);
  return CHIP.head + CHIP.top + 12 + (lines - 1) * CHIP.nameStep + CHIP.bottom;
}

/** The two sides: the first half of the links, and the rest. */
export function sidesOf(links: readonly SheetConfigLink[]): [SheetConfigLink[], SheetConfigLink[]] {
  const n = Math.ceil(links.length / 2);
  return [links.slice(0, n), links.slice(n)];
}

/**
 * A bus from a chip's port to the die's: out along the primary axis, a jog
 * across with 45° corners, and in along the primary axis again — the PCB
 * bend twice. Straight when the two ports are level.
 */
export function busPath(from: Pt, to: Pt, axis: "x" | "y", corner = 8): Pt[] {
  const [x1, y1] = from;
  const [x2, y2] = to;
  if (axis === "x") {
    if (Math.abs(y2 - y1) < 0.01)
      return [
        [x1, y1],
        [x2, y1],
      ];
    const sx = Math.sign(x2 - x1);
    const sy = Math.sign(y2 - y1);
    const xm = (x1 + x2) / 2;
    const c = Math.min(corner, Math.abs(y2 - y1) / 2, Math.abs(xm - x1) / 2);
    return [
      [x1, y1],
      [xm - c * sx, y1],
      [xm, y1 + c * sy],
      [xm, y2 - c * sy],
      [xm + c * sx, y2],
      [x2, y2],
    ];
  }
  if (Math.abs(x2 - x1) < 0.01)
    return [
      [x1, y1],
      [x1, y2],
    ];
  const sx = Math.sign(x2 - x1);
  const sy = Math.sign(y2 - y1);
  const ym = (y1 + y2) / 2;
  const c = Math.min(corner, Math.abs(x2 - x1) / 2, Math.abs(ym - y1) / 2);
  return [
    [x1, y1],
    [x1, ym - c * sy],
    [x1 + c * sx, ym],
    [x2 - c * sx, ym],
    [x2, ym + c * sy],
    [x2, y2],
  ];
}

/** Where `k` evenly spaced things sit along a span, centred on it. */
const spread = (from: number, span: number, k: number) =>
  Array.from({ length: k }, (_, i) => from + (span * (i + 1)) / (k + 1));

/** Pins for one bus landing on the die: one pad per wire, sticking out. */
function pinsFor(port: Pt, wires: number, axis: "x" | "y", out: 1 | -1): ConfigPin[] {
  const [px, py] = port;
  return ribbonOffsets(wires, WIRE_PITCH).map((o) =>
    axis === "x"
      ? { x: out > 0 ? px : px - 3, y: py + o - 1, w: 3, h: 2 }
      : { x: px + o - 1, y: out > 0 ? py : py - 3, w: 2, h: 3 }
  );
}

/**
 * One crop's whole drawing, for one record.
 *
 * ⚠ THE RECORD'S ORDER IS THE DRAWING'S ORDER: rows top to bottom as the
 * proposal lists its workstreams, chips along each side in the links' order.
 * Nothing is sorted here, so a reader can check the board against the page.
 */
export function configGeom(config: SheetConfiguration, crop: ConfigCrop): ConfigGeom {
  const letters: ConfigLetter[] = [];
  const dw = dieWidth(crop);
  const dh = dieHeight(dw, config.rows);
  const die: Rect = { x: (crop.w - dw) / 2, y: (crop.h - dh) / 2, w: dw, h: dh };

  // The die's head band: the one kicker.
  const headText = "Intelligence configuration";
  letters.push({
    slot: "die.kicker",
    owner: "die",
    text: headText.toUpperCase(),
    fs: CFG_FS.kicker,
    track: CFG_TRACK.kicker,
    measure: dw - 2 * DIE.pad - DIE.cut,
    face: "mono",
    x: die.x + DIE.pad,
    y: die.y + 17,
    anchor: "start",
    ink: "knock-dim",
  });

  // The rows: a name (lit), its module tag at the right end, the note under.
  const rows: ConfigRow[] = [];
  let y = die.y + DIE.head;
  for (const row of config.rows) {
    const h = rowHeight(dw, row);
    rows.push({ id: row.id, rect: { x: die.x, y, w: dw, h }, ghost: Boolean(row.ghost) });
    const ink: ConfigInk = row.ghost ? "knock-dim" : "knock";
    const lines = sansLines(row.name, CFG_FS.name, nameMeasure(dw, row), 2);
    lines.forEach(({ line, measure }, i) =>
      letters.push({
        slot: `row.${row.id}.name.${i}`,
        owner: `row.${row.id}`,
        text: line,
        fs: CFG_FS.name,
        track: 0,
        measure,
        face: "sans",
        x: die.x + DIE.pad,
        y: y + DIE.rowTop + 12.5 + i * DIE.nameStep,
        anchor: "start",
        ink,
        lit: !row.ghost,
      })
    );
    if (row.tag)
      letters.push({
        slot: `row.${row.id}.tag`,
        owner: `row.${row.id}`,
        text: row.tag.toUpperCase(),
        fs: CFG_FS.tag,
        track: CFG_TRACK.tag,
        measure: tagW(row.tag) + 1,
        face: "mono",
        x: die.x + dw - DIE.pad,
        y: y + DIE.rowTop + 12.5,
        anchor: "end",
        ink: "knock-dim",
      });
    if (row.note)
      letters.push({
        slot: `row.${row.id}.note`,
        owner: `row.${row.id}`,
        text: row.note,
        fs: CFG_FS.note,
        track: 0,
        measure: dw - 2 * DIE.pad,
        face: "sans",
        x: die.x + DIE.pad,
        y: y + DIE.rowTop + 12.5 + (lines.length - 1) * DIE.nameStep + DIE.noteStep,
        anchor: "start",
        ink: "knock-dim",
      });
    y += h;
  }

  // The chips, side by side, and the buses from each to the die.
  const [sideA, sideB] = sidesOf(config.links);
  const chips: ConfigChip[] = [];
  const buses: ConfigBus[] = [];
  const pins: ConfigPin[] = [];
  const cx = die.x + dw / 2;
  const cy = die.y + dh / 2;

  const placeSide = (side: SheetConfigLink[], which: 0 | 1) => {
    const k = side.length;
    if (k === 0) return;
    const cw = chipWidth(crop, k);
    const heights = side.map((l) => chipHeight(cw, l));
    if (crop.arrangement === "flank") {
      // A column at the crop's left (A) or right (B); ports down the die's side.
      const x = which === 0 ? INSET : crop.w - INSET - cw;
      const ports = spread(die.y, dh, k);
      const tallest = Math.max(...heights);
      const room = crop.h - 2 * INSET - tallest;
      /* Spread the chips wider than the ports so every bus jogs, the way the
         reference's buses do, but never past the crop or into each other. */
      const pitch =
        k === 1 ? 0 : Math.min(room / (k - 1), Math.max((dh / (k + 1)) * 1.45, tallest + CHIP.gap));
      side.forEach((l, i) => {
        const chipCy = k === 1 ? cy : cy + (i - (k - 1) / 2) * pitch;
        const rect = { x, y: chipCy - heights[i] / 2, w: cw, h: heights[i] };
        const port: Pt = [which === 0 ? x + cw : x, chipCy];
        const land: Pt = [which === 0 ? die.x : die.x + dw, ports[i]];
        chips.push({ id: l.id, rect, port });
        const pts = busPath(port, land, "x");
        buses.push({ id: l.id, pts, wires: wiresFor(l.users), len: polylineLength(pts) });
        pins.push(...pinsFor(land, wiresFor(l.users), "x", which === 0 ? -1 : 1));
        letters.push(...chipLetters(l, rect));
      });
    } else {
      // A row along the crop's top (A) or bottom (B); ports along the die's edge.
      const tallest = Math.max(...heights);
      const y0 = which === 0 ? INSET : crop.h - INSET - tallest;
      const row = crop.w - 2 * INSET;
      const ports = spread(die.x, dw, k);
      side.forEach((l, i) => {
        const chipCx = k === 1 ? cx : INSET + cw / 2 + (i * (row - cw)) / (k - 1);
        const ry = which === 0 ? y0 + tallest - heights[i] : y0;
        const rect = { x: chipCx - cw / 2, y: ry, w: cw, h: heights[i] };
        const port: Pt = [chipCx, which === 0 ? ry + heights[i] : ry];
        const land: Pt = [ports[i], which === 0 ? die.y : die.y + dh];
        chips.push({ id: l.id, rect, port });
        const pts = busPath(port, land, "y");
        buses.push({ id: l.id, pts, wires: wiresFor(l.users), len: polylineLength(pts) });
        pins.push(...pinsFor(land, wiresFor(l.users), "y", which === 0 ? -1 : 1));
        letters.push(...chipLetters(l, rect));
      });
    }
  };
  placeSide(sideA, 0);
  placeSide(sideB, 1);

  /* The board behind: faint traces off the die's two FREE edges — the ones no
     bus lands on — running OFF the crop, so the die reads as a part wired on
     all four sides, as the reference's centre chip is. Four wires, no chip at
     their ends. ⚠ They run PAST the crop by `GHOST_RUN` and the board clips
     them (`.sh-dos__board`'s overflow): a crop letterboxed by `meet` would
     otherwise end them short of the box, which reads as a trace cut off. */
  const ghosts: ConfigBus[] = [];
  const ghostAt = (pts: Pt[], id: string) =>
    ghosts.push({ id, pts, wires: 4, len: polylineLength(pts) });
  if (crop.arrangement === "flank") {
    for (const [i, gx] of spread(die.x, dw, 3).entries()) {
      const up = busPath([gx, die.y], [gx + (i - 1) * 18, -GHOST_RUN], "y");
      const down = busPath([gx, die.y + dh], [gx - (i - 1) * 18, crop.h + GHOST_RUN], "y");
      ghostAt(up, `ghost-top-${i}`);
      ghostAt(down, `ghost-bottom-${i}`);
    }
  } else {
    for (const [i, gy] of spread(die.y, dh, 2).entries()) {
      ghostAt(busPath([die.x, gy], [-GHOST_RUN, gy + (i ? 16 : -16)], "x"), `ghost-left-${i}`);
      ghostAt(
        busPath([die.x + dw, gy], [crop.w + GHOST_RUN, gy + (i ? 16 : -16)], "x"),
        `ghost-right-${i}`
      );
    }
  }

  return { crop, die, headFloor: die.y + DIE.head, rows, chips, buses, pins, ghosts, letters };
}

/** A chip's two lines: its kind in the head band, its name under it. */
function chipLetters(l: SheetConfigLink, r: Rect): ConfigLetter[] {
  const out: ConfigLetter[] = [
    {
      slot: `chip.${l.id}.kicker`,
      owner: `chip.${l.id}`,
      text: l.kicker.toUpperCase(),
      fs: CFG_FS.chipKicker,
      track: CFG_TRACK.chipKicker,
      measure: r.w - 2 * CHIP.pad - CHIP.cut,
      face: "mono",
      x: r.x + CHIP.pad,
      y: r.y + 13,
      anchor: "start",
      ink: "gold",
    },
  ];
  sansLines(l.name, CFG_FS.chipName, chipNameMeasure(r.w), 2).forEach(({ line, measure }, i) =>
    out.push({
      slot: `chip.${l.id}.name.${i}`,
      owner: `chip.${l.id}`,
      text: line,
      fs: CFG_FS.chipName,
      track: 0,
      measure,
      face: "sans",
      x: r.x + CHIP.pad,
      y: r.y + CHIP.head + CHIP.top + 10 + i * CHIP.nameStep,
      anchor: "start",
      ink: "ink",
    })
  );
  return out;
}
