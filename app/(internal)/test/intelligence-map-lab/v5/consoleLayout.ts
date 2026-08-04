/**
 * consoleLayout — variant v5's layout kernel.
 *
 * ══ ONE INFORMATION ARCHITECTURE, THREE ZOOM LEVELS ══════════════════════
 * His round-5 diagnosis of console v3 was that each range was a DIFFERENT
 * layout, so scrolling read as "discombobulated" rather than as zooming. The fix
 * is structural and it lives here: there is ONE set of objects, and a level only
 * changes where they sit and how much of themselves they show.
 *
 *   L1  the eight workstream CHIPS on a bounded board
 *   L2  the clicked chip IS the master plate; the other seven park on the
 *       bottom edge; the chip's six pins extend into six wires and six modules
 *   L3  the same switchboard, unmoved, with flow on the wires
 *
 * The CHIP IS THE MASTER PLATE. Not a lookalike — the same element, the same
 * React key, animated from its board seat to the master seat. That is what makes
 * the zoom read as a zoom, and it is why every box below is returned in FIELD
 * PIXELS: the component sets `transform` + `width` + `height` from these numbers
 * and lets the browser interpolate.
 *
 * ══ REAL-PIXEL GEOMETRY, MEASURED BOX ════════════════════════════════════
 * Round 3's defect was a fixed `viewBox` at `preserveAspectRatio="none"`, which
 * printed every shape ~30 % narrow at the owner's ~1:1 panel aspect. Nothing
 * here is authored in a synthetic coordinate space: the only inputs are the
 * measured field width and height, the SVG viewBox is `0 0 w h`, and every
 * constant is a CSS pixel derived from a TYPE MEASUREMENT.
 *
 * THE BINDING BOX IS 611 × 403 — the casefile's panel viz at 1280 × 720. It is
 * the tightest of the four reference viewports (688×457 at 1440×800, 862×425 at
 * 1920×780, 611×721 at 1280×1100), so every measurement note below is against
 * it. PT Mono advances 0.6 em; at 9 px with 0.08 em tracking a character is
 * 6.12 px, at 10 px it is 6.8 px, at 11 px it is 7.48 px.
 *
 * ══ NO CIRCLES, STILL ════════════════════════════════════════════════════
 * DESIGN.md's shape law has no orbit exception and no circuit exception either.
 * Pins, junctions and detents are DIAMONDS; plates are chamfered rectangles;
 * selection is four corner brackets; rails are straight lines and runs are
 * right-angled. There is no `<circle>`, `<ellipse>`, arc or border-radius in
 * this variant.
 */

import {
  SUBSTRATES,
  TEAMS,
  TEAM_LABEL_LINES,
  TIERS,
  WORKS,
  type TeamName,
  type TierName,
} from "../imapData";
import { MODULES, type View } from "./consoleFixture";

/* ══ Primitives ═══════════════════════════════════════════════════════════ */

export interface Vec {
  x: number;
  y: number;
}
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const r2 = (v: number) => Math.round(v * 100) / 100;
export const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** A chamfered rectangle — the console's plate silhouette, in his console v3's
 *  proportion (top-right and bottom-left cut). */
export function chamfer(b: Box, c: number): string {
  const { x, y, w, h } = b;
  const k = Math.min(c, w / 2, h / 2);
  return [
    `M ${r2(x)} ${r2(y)}`,
    `H ${r2(x + w - k)}`,
    `L ${r2(x + w)} ${r2(y + k)}`,
    `V ${r2(y + h)}`,
    `H ${r2(x + k)}`,
    `L ${r2(x)} ${r2(y + h - k)}`,
    "Z",
  ].join(" ");
}

/** A diamond — a 45°-rotated square, expressed as a path so it is one mark. */
export function diamond(x: number, y: number, r: number): string {
  return `M ${r2(x)} ${r2(y - r)} L ${r2(x + r)} ${r2(y)} L ${r2(x)} ${r2(y + r)} L ${r2(x - r)} ${r2(y)} Z`;
}

/** Four corner brackets — the target LOCK. */
export function brackets(b: Box, len: number): string[] {
  const { x, y, w, h } = b;
  const l = Math.min(len, w / 3, h / 3);
  return [
    `M ${r2(x)} ${r2(y + l)} V ${r2(y)} H ${r2(x + l)}`,
    `M ${r2(x + w - l)} ${r2(y)} H ${r2(x + w)} V ${r2(y + l)}`,
    `M ${r2(x + w)} ${r2(y + h - l)} V ${r2(y + h)} H ${r2(x + w - l)}`,
    `M ${r2(x + l)} ${r2(y + h)} H ${r2(x)} V ${r2(y + h - l)}`,
  ];
}

/* ══ Chrome constants ═════════════════════════════════════════════════════ */

export const PAD = 10;
export const FRAME_CHAMFER = 12;

/** The board's own inner margin. Without it the leftmost chip's edge, the target
 *  strip's gold rule and the board line all land on the same pixel, and the
 *  bottom-left chamfer cuts through the first glyph of the board line. Applied
 *  HORIZONTALLY ONLY: the vertical measure is spent by the substrate view, which
 *  seats all eight chips in one column and has 2.4px of slack per row at the
 *  binding box. */
export const INSET = 14;

/** THE LEVEL RAIL IS 112 PX AND THAT IS A MEASUREMENT, not a taste.
 *  `CONFIGURATION` is 88.4 px at the 10 px chrome floor; the active connector
 *  rule is 22 px and must not reach the last glyph; the rotated 8 px detent
 *  needs 2 px of its own. His rail carried the same words at 7 px, which is the
 *  bug the type floors exist to stop. */
export const RAIL_W = 112;

export const TOP_BAND = 26;
export const BOT_BAND = 18;

/** The parked-chip rail at L2/L3. A stub is `W05` at 9 px (18.4) plus six micro
 *  pins, so 44 wide; seven of them plus gaps is 350 against a 463 stage. */
export const PARK_W = 44;
export const PARK_H = 22;
export const PARK_BAND = 26;

export const MARK = { pin: 2.6, joint: 2.3, junction: 3.4, jUsed: 4 } as const;
export const LOCK_LEN = 7;

/* ══ The layout ═══════════════════════════════════════════════════════════ */

export interface TeamRail {
  team: TeamName;
  lines: readonly string[];
  /** The rail line, drawn THROUGH the chips seated on it — the reference GIF's
   *  grammar: a chip is tapped onto a trace, it does not float above one. */
  y: number;
  x0: number;
  x1: number;
  labelX: number;
  labelY: number;
  count: number;
}

export interface SubRail {
  id: string;
  lines: readonly string[];
  y: number;
  x0: number;
  x1: number;
  labelX: number;
  labelY: number;
  /** How many of the eight workstreams draw on this substrate. A SHARED rail is
   *  the point of the view, so the count drives its weight. */
  count: number;
  band: 0 | 1 | 2;
}

export interface AllocLane {
  tier: TierName;
  headY: number;
  headX: number;
  /** The dot-matrix density strip's box. */
  strip: Box;
  y: number;
  count: number;
}

export interface Wire {
  key: string;
  /** The structural run — Manhattan, right angles only. */
  d: string;
  /** Analytic path length, so the draw-on is a dash offset and not a
   *  `getTotalLength()` read (no per-frame layout reads, ADR-061's perf seam). */
  len: number;
  joints: Vec[];
  /** E/EVALS is a RETURN path: the verdict comes back to the work, so its flow
   *  runs the other way. Everything else flows into the master. */
  reverse: boolean;
}

export interface ConsoleLayout {
  w: number;
  h: number;
  board: Box;
  boardPath: string;
  rail: Box;
  stage: Box;
  top: Box;
  bot: Box;
  /** L1's board area. */
  work: Box;
  chip: { w: number; h: number };
  /** L1 seats, per view, keyed by work id. */
  seats: Record<View, Record<string, Box>>;
  teamRails: TeamRail[];
  subRails: SubRail[];
  /** The vertical trace lane x per work, in the substrate view. */
  subLanes: Record<string, number>;
  allocLanes: AllocLane[];
  /** L2/L3. */
  master: Box;
  register: Box;
  contract: Box;
  cards: Record<string, Box>;
  /** Pin offsets INSIDE the chip element — a horizontal row at L1, a vertical
   *  column on the right edge at L2/L3. Same six pins, so they travel. */
  chipPins: Vec[];
  masterPins: Vec[];
  parkPins: Vec[];
  wires: Wire[];
  park: Record<string, Box>;
}

/** A Manhattan run: out of the pin, along the spine, then in to the card. */
function manhattan(from: Vec, spineX: number, to: Vec): { d: string; len: number; joints: Vec[] } {
  const d = `M ${r2(from.x)} ${r2(from.y)} H ${r2(spineX)} V ${r2(to.y)} H ${r2(to.x)}`;
  const len = Math.abs(spineX - from.x) + Math.abs(to.y - from.y) + Math.abs(to.x - spineX);
  return {
    d,
    len: r2(len),
    joints: [
      { x: spineX, y: from.y },
      { x: spineX, y: to.y },
    ],
  };
}

export function buildConsole(w: number, h: number): ConsoleLayout {
  const board: Box = { x: PAD, y: PAD, w: w - PAD * 2, h: h - PAD * 2 };
  const rail: Box = { x: board.x + board.w - RAIL_W, y: board.y, w: RAIL_W, h: board.h };
  const stage: Box = {
    x: board.x + INSET,
    y: board.y,
    w: board.w - RAIL_W - 6 - INSET,
    h: board.h,
  };
  const top: Box = { x: stage.x, y: stage.y, w: stage.w, h: TOP_BAND };
  const bot: Box = { x: stage.x, y: stage.y + stage.h - BOT_BAND, w: stage.w, h: BOT_BAND };
  const work: Box = {
    x: stage.x,
    y: top.y + top.h,
    w: stage.w,
    h: stage.h - TOP_BAND - BOT_BAND,
  };

  /* ── The chip ──────────────────────────────────────────────────────────
     WIDTH is set by the two longest strings it carries: `INVOICE MATCHING` is
     119.7 px at the 11 px identity floor and `PRODUCT + ENGINEERING` is 121 px
     at 9 px on 0.04 em tracking, so the inner measure is 122 and the plate is
     138. HEIGHT is set by the substrate view, which seats all eight in one
     column: at the binding box that is 339 / 8 − 1 = 41. */
  const chipW = clamp(138, Math.round(stage.w * 0.3), 190);
  const chipH = clamp(41, Math.floor(work.h / 8) - 1, 52);
  const chip = { w: chipW, h: chipH };

  /* ── L1 · BY TEAM ──────────────────────────────────────────────────────
     Seven rails. The rail runs THROUGH its chips (junction diamonds where it
     meets a plate edge), which is how the circuit reference tags a component
     onto a trace — and it is also what makes seven rails fit a 339 px board. */
  const teamLabelW = 76;
  const rowH = work.h / TEAMS.length;
  const teamRails: TeamRail[] = TEAMS.map((team, i) => {
    const count = WORKS.filter((wk) => wk.team === team).length;
    const rowTop = work.y + rowH * i;
    return {
      team,
      lines: TEAM_LABEL_LINES[team],
      y: r2(rowTop + chipH - 9),
      x0: work.x + teamLabelW + 4,
      x1: work.x + work.w,
      labelX: work.x + teamLabelW - 6,
      labelY: r2(rowTop + chipH / 2),
      count,
    };
  });

  const teamSeats: Record<string, Box> = {};
  TEAMS.forEach((team, i) => {
    const rowTop = work.y + rowH * i;
    WORKS.filter((wk) => wk.team === team).forEach((wk, k) => {
      teamSeats[wk.id] = {
        x: r2(work.x + teamLabelW + 16 + k * (chipW + 14)),
        y: r2(rowTop),
        w: chipW,
        h: chipH,
      };
    });
  });

  /* ── L1 · BY SUBSTRATE ─────────────────────────────────────────────────
     His console v3 range-03 grammar, transposed: the six substrates are
     horizontal rails, each workstream owns a vertical trace lane, and a JUNCTION
     DIAMOND on a crossing means "this workstream draws on that substrate". The
     transposition is the fit — eight chips will not go across 463 px at their
     type-driven 138, but they will go down it. */
  const subLabelW = 74;
  const subX0 = work.x + chipW + 8;
  const subX1 = work.x + work.w - subLabelW - 6;
  const counts = SUBSTRATES.map((s) => WORKS.filter((wk) => wk.substrates.includes(s.id)).length);
  const maxCount = Math.max(...counts);
  /* A rail and a chip's outgoing trace are both horizontal, so a rail that lands
     within 10px of a chip's centre line reads as the same line. Six rails against
     eight chip centres cannot avoid that by even spacing, so each rail is NUDGED
     to the nearest legal position. */
  const chipCentres = WORKS.map((_, i) => work.y + (work.h / WORKS.length) * (i + 0.5));
  const nudge = (y: number): number => {
    let out = y;
    for (let pass = 0; pass < 4; pass += 1) {
      const near = chipCentres.reduce(
        (best, c) => (Math.abs(c - out) < Math.abs(best - out) ? c : best),
        chipCentres[0]
      );
      const gap = out - near;
      if (Math.abs(gap) >= 10) break;
      out = near + (gap >= 0 ? 10 : -10);
    }
    return clamp(out, work.y + 10, work.y + work.h - 10);
  };
  const subRails: SubRail[] = SUBSTRATES.map((sub, i) => {
    const y = r2(nudge(work.y + 16 + (i * (work.h - 34)) / (SUBSTRATES.length - 1)));
    const count = counts[i];
    return {
      id: sub.id,
      lines: sub.lines,
      y,
      x0: subX0,
      x1: subX1,
      labelX: subX1 + 8,
      labelY: y,
      count,
      band: count >= maxCount - 1 ? 2 : count >= 4 ? 1 : 0,
    };
  });

  const subSeats: Record<string, Box> = {};
  const subLanes: Record<string, number> = {};
  const colH = work.h / WORKS.length;
  const laneSpan = subX1 - subX0 - 18;
  WORKS.forEach((wk, i) => {
    subSeats[wk.id] = {
      x: work.x,
      y: r2(work.y + colH * i + (colH - chipH) / 2),
      w: chipW,
      h: chipH,
    };
    subLanes[wk.id] = r2(subX0 + 12 + (i * laneSpan) / (WORKS.length - 1));
  });

  /* ── L1 · BY ALLOCATION ────────────────────────────────────────────────
     Four capability lanes. The lane HEAD sits above its chips rather than beside
     them: EVERYDAY holds three workstreams, and three 138 px chips need the
     whole 463 px measure. The head carries a dot-matrix density strip — the
     lane's aggregate relative draw, with no number and no currency anywhere
     near it. */
  const laneH = work.h / TIERS.length;
  const allocLanes: AllocLane[] = TIERS.map((tier, i) => {
    const laneTop = work.y + laneH * i;
    const count = WORKS.filter((wk) => wk.tier === tier).length;
    return {
      tier,
      headX: work.x,
      headY: r2(laneTop),
      strip: { x: r2(work.x + 92), y: r2(laneTop + 3), w: 84, h: 12 },
      y: r2(laneTop + 20),
      count,
    };
  });

  const allocSeats: Record<string, Box> = {};
  TIERS.forEach((tier, i) => {
    const laneTop = work.y + laneH * i;
    WORKS.filter((wk) => wk.tier === tier).forEach((wk, k) => {
      allocSeats[wk.id] = {
        x: r2(work.x + k * (chipW + 14)),
        y: r2(laneTop + 20),
        w: chipW,
        h: chipH,
      };
    });
  });

  /* ── L2 / L3 · the switchboard ─────────────────────────────────────────
     The work area gives up a 30 px band at the bottom for the parked chips, and
     the left column carries three stacked cut-panels whose heights are RESERVED
     AT L2 even though the register is idle there. That reservation is the whole
     reason L3 can add a workload read without moving a single L2 element. */
  const swH = work.h - PARK_BAND;
  const leftW = clamp(158, Math.round(work.w * 0.345), 200);
  /* THE THREE HEIGHTS ARE A MEASURED BUDGET, not three fractions that happen to
     sum. At the binding box the left column has 313px and the content needs:
     master 108 (code 15 + a two-line 17px title 36 + BAR label 9 + a two-line
     9px bar 22 + 13 padding + gaps), register 115 (label 9 + three wrapping
     9px rows + the WHY block + 13 padding), contract 66 (label 9 + three 14px
     steps + 13 padding). The register takes the REMAINDER because it is the one
     whose rows wrap, and it is the box L3 fills — under-reserving it is what
     would force an L2 element to move. */
  const masterH = clamp(108, Math.round(swH * 0.345), 152);
  const contractH = clamp(70, Math.round(swH * 0.225), 116);
  const registerH = swH - masterH - contractH - 16;

  const master: Box = { x: work.x, y: work.y, w: leftW, h: masterH };
  const register: Box = { x: work.x, y: r2(master.y + masterH + 8), w: leftW, h: registerH };
  const contract: Box = { x: work.x, y: r2(register.y + registerH + 8), w: leftW, h: contractH };

  /* THE CHANNEL CARRIES SIX SPINES, NOT ONE. With a single spine x every run's
     vertical segment lands on the same line and the six of them collapse into one
     busy column of junction diamonds — measured, and it read as noise rather than
     as a switchboard. Six lanes across a 53px channel is 8.8px of separation,
     which is the smallest gap that still reads as six distinct runs. */
  const channel = clamp(46, Math.round(work.w * 0.115), 78);
  const cardsX = work.x + leftW + channel;
  const cardsW = work.x + work.w - cardsX;
  const cols = 2;
  const colGap = 10;
  const cardW = Math.floor((cardsW - colGap * (cols - 1)) / cols);
  const rows = 3;
  const rowGap = clamp(12, Math.round(swH * 0.06), 26);
  const cardH = Math.floor((swH - rowGap * (rows - 1)) / rows);

  const cards: Record<string, Box> = {};
  MODULES.forEach((mod, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    cards[mod.key] = {
      x: r2(cardsX + col * (cardW + colGap)),
      y: r2(work.y + row * (cardH + rowGap)),
      w: cardW,
      h: cardH,
    };
  });

  /* The six pins. At L1 they are a horizontal stub row inside the chip; at L2/L3
     the SAME six sit on the master plate's right edge, and each one is where its
     wire starts. Offsets are chip-local, so the component just moves them. */
  const pinRowW = 40;
  const chipPins: Vec[] = MODULES.map((_, i) => ({
    x: r2(chipW - 8 - pinRowW + (i * pinRowW) / 5),
    y: r2(9),
  }));
  const masterPins: Vec[] = MODULES.map((_, i) => ({
    x: r2(leftW),
    y: r2(14 + (i * (masterH - 28)) / 5),
  }));
  /* A parked stub is 44 wide, so the pin row compresses rather than clipping —
     the configuration signature has to survive parking or the stack stops being
     the same eight objects. */
  const parkPins: Vec[] = MODULES.map((_, i) => ({
    x: r2(6 + (i * (PARK_W - 12)) / 5),
    y: r2(PARK_H - 5),
  }));

  /* The runs. Column-2 wires ride 5 px below their row's centre so the two wires
     of a row stay legible where they overlap; the column-1 card sits ON the
     column-2 run, which is exactly what a chip on a trace looks like. */
  const wires: Wire[] = MODULES.map((mod, i) => {
    const card = cards[mod.key];
    const col = i % cols;
    /* The last lane stops 9px short of the card column: at `cardsX` exactly it
       ran flush down the first card's left border and read as part of the plate. */
    const spineX = r2(cardsX - channel + 5 + (i * (channel - 14)) / 5);
    const from: Vec = { x: r2(master.x + leftW), y: r2(master.y + masterPins[i].y) };
    const to: Vec = { x: card.x, y: r2(card.y + card.h / 2 + (col === 1 ? 5 : -5)) };
    const run = manhattan(from, spineX, to);
    return { key: mod.key, ...run, reverse: mod.key === "eval" };
  });

  /* The parked seven. A stub keeps its code and its six pins — enough identity
     to be recognised and clicked, not enough to compete with the master. */
  const parkY = r2(work.y + work.h - PARK_H);
  const park: Record<string, Box> = {};
  WORKS.forEach((wk, i) => {
    park[wk.id] = { x: r2(work.x + i * (PARK_W + 8)), y: parkY, w: PARK_W, h: PARK_H };
  });

  return {
    w,
    h,
    board,
    boardPath: chamfer(board, FRAME_CHAMFER),
    rail,
    stage,
    top,
    bot,
    work,
    chip,
    seats: { team: teamSeats, substrate: subSeats, allocation: allocSeats },
    teamRails,
    subRails,
    subLanes,
    allocLanes,
    master,
    register,
    contract,
    cards,
    chipPins,
    masterPins,
    parkPins,
    wires,
    park,
  };
}

/** Park seats are indexed by ORDER AMONG THE UNSELECTED, so the stack closes up
 *  rather than leaving a hole where the master came from. */
export function parkSeat(L: ConsoleLayout, workId: string, selected: string): Box {
  const others = WORKS.filter((wk) => wk.id !== selected).map((wk) => wk.id);
  const i = Math.max(0, others.indexOf(workId));
  return {
    x: r2(L.work.x + i * (PARK_W + 8)),
    y: r2(L.work.y + L.work.h - PARK_H),
    w: PARK_W,
    h: PARK_H,
  };
}
