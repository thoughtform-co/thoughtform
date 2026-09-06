"use client";

import type { CaseSkillEntry } from "@/lib/cases/types";

import { type FitSpec, cropAround, fitExt } from "./pdaFit";
import { PDA_FLIGHT_MS } from "./pdaFlight";
import type { FlightRect } from "./pdaFlight";
import {
  CARD_BOX,
  CHIP_FS,
  CHIP_NAME_TRACK,
  CORE_K,
  LaneMeter,
  SKILL_CHIP_H,
  SKILL_CHIP_W,
  SkillChip,
  StateMark,
  laneLabel,
  meterLabelDx,
  skillChipNameRect,
  wrapLines,
} from "./pdaGlyphs";
import type { ChipMorph, PdaEntry } from "./PdaEntry";
import type { PdaShape, PdaWork } from "./pdaRecord";
import { type Pt, polylineLength, ribbonPaths } from "./ribbon";
import { MODULE, band, housing } from "./substrateKit";

/**
 * 02 · THE CONFIGURATION — the R4 substrate field (ADR-070 U11).
 *
 * The composition is the owner's `design_handoff_intel_config_r4`
 * (2026-08-11) — a design handoff, not a sketch: a README with a module
 * table, a chrome grammar and a token list, plus `r4-substrate-field.html`
 * as a pixel-exact prototype of one state (W-017). **Every module position
 * below is that table's**, in that file's own 888 × 744 stage coordinates,
 * so the drawing can be diffed against the reference rather than argued
 * about.
 *
 * ⚠ **THE BOARD IS HEIGHT-ELASTIC (U12), AND THAT IS THE POINT.** See
 * `configLayout`. One static crop cannot serve this panel: the console's
 * field is capped at 850px wide but grows with viewport height, so it is
 * LANDSCAPE on a laptop (1.22) and PORTRAIT on a tall monitor (0.89 and
 * below). `meet` fits by the smaller ratio, so whichever way the crop is
 * drawn the other end letterboxes — U4 paid it horizontally, U10 and U11's
 * first cut paid it vertically, and at 845 × 950 that was **270px of dead
 * panel under the board**. The crop's HEIGHT is measured from the field now
 * and the vertical chain absorbs the difference.
 *
 * ⚠ **THE HANDOFF SAYS "RECREATE PIXEL-PERFECTLY" AND THE TYPE IS THE ONE
 * THING THAT CANNOT BE.** The prototype is authored at 1:1 in a 960-wide
 * frame; this console's field is 603 × 493 at 1280×720, so `meet` scales the
 * whole drawing to 0.65. The reference's 8.5px field label lands at
 * **5.5px** — the size the owner called "utterly illegible" one day earlier,
 * and under the 8.5px chrome floor ADR-063 records as this surface's
 * standing defect. So the reference's type RANKING is kept and its bottom
 * rungs are lifted to the floor: the ladder's range narrows, which is the
 * cost, and it is bought back in ALPHA, which does not shrink with `meet`.
 *
 * ⚠ **THE CROP'S WIDTH IS THE REFERENCE'S FRAME, NOT ITS STAGE.** The
 * handoff draws a 960 × 880 frame and insets its stage 36px inside it, so
 * its modules sit 40px off the frame wall. Cropping to the STAGE dropped
 * that: measured on the live landing, the side modules landed **2.7px** off
 * the console wall and read as clipped. ADR-064's "the frame is a bezel the
 * content bleeds into" is about a CAPTURE filling its bay; a technical
 * drawing whose outermost rule touches the wall has lost its margin.
 *
 * ⚠ **WHAT THE REFERENCE LETTERS THAT THIS DRAWING DOES NOT**, each for a
 * reason that is arithmetic or a standing law rather than taste:
 *
 *   side stamps (5)     invented designators (`S-03 · M-01 / REV C`) —
 *                       ordinals in costume, which this surface has
 *                       removed twice (ADR-066, ADR-068's `T-01` scan)
 *   passive labels (6)  same, and at 6px they render 4.0px — under the
 *                       smoke's own 4.3px floor. The MARKS stay: the bed's
 *                       texture never depended on the letters
 *   header metas (3)    `RUNS` beside `WHAT RUNS IT` is the question said
 *                       twice, and at a legible size the pair does not fit
 *                       a 204-unit module (163.5 + 44.4 against 180)
 *   ribbon tags (4)     `LANE 01–08` collides with the model LANE, which is
 *                       a live record field; and the bundles are named by
 *                       the modules they enter
 *   satellite meters(2) a 4-bar gauge beside a client's named Skill implies
 *                       a measurement this case does not publish and the
 *                       reference did not author. The CORE's meter stays,
 *                       because there it is real — see `LANES`
 *
 * Everything else — the module table, the opposed corner cuts, the 2px top
 * rules, the opaque-modules-on-a-faint-bed density rule, the 8-wire hatched
 * ribbons, the ghost die, the meanders, the passives, the vias and the role
 * law (gold = wayfinding, green = the human) — is the reference's.
 *
 * ⚠ **THE CARD IS DRAWN HERE, NOT BY `Cartridge`**, and its SILHOUETTE may
 * not move: it is ADR-069's flight destination. The reference's core is
 * 300 × 224 (1.339) and the cartridge is 176 × 136 (1.294), which are not
 * similar — a uniform `dk` cannot carry a shape that changes proportion — so
 * the box is `176 × 136 × CORE_K`, centred on the reference's own core
 * centre at rest.
 */

/* ── The width chain, which never moves ─────────────────────────────────
   Every x below is the handoff's own. The crop's width is the content's
   `4…884` plus one inset each side; only the HEIGHT is measured. */
const OWNER = { x: 232, y: 20, w: 424, h: 108 } as const;
const SAT_W = 204;
const LEFT_X = 4;
const RIGHT_X = 680;
const BASE_X = 244;
const BASE_W = 400;
const CONTENT_L = 4;
const CONTENT_R = 884;

/**
 * The frame inset — see the header. ⚠ HORIZONTAL ONLY since U14: the width
 * chain never moves, so the side margins are a fixed inset, while the
 * vertical margin is DERIVED from what the block leaves and split in two.
 */
export const CONFIG_INSET = 26;
const CROP_W = CONTENT_R - CONTENT_L + CONFIG_INSET * 2;

/**
 * The card. `CORE_K` × the 176×136 cartridge, so the two rects are EXACTLY
 * similar and one uniform scale carries the morph without the object changing
 * proportion on the way.
 *
 * ⚠ **`CORE_K` AND THE CARD'S INTERIOR LIVE IN `pdaGlyphs` NOW** (2026-08-13).
 * The seat card is the grid's cartridge at this scale, and until the
 * harmonisation the two were separate drawings that had drifted apart on
 * corners, mark, colour and the title's height — so the flight was swapping the
 * object it claimed to be carrying. `CARD` there is this card's geometry ÷
 * `CORE_K`, and the mark and the lane meter are one component each.
 */
export { CORE_K };
const CORE_W = CARD_BOX.w * CORE_K;
const CORE_H = CARD_BOX.h * CORE_K;
const CORE_X = 444 - CORE_W / 2;

/** The reference's 45° corner cut, 12 deep, on every satellite.
 *  ⚠ FROM THE SHARED KIT since 2026-08-12 — reading 03's cards are the same
 *  object, and two copies of a module's measures is how they stop being one. */
const CUT = MODULE.cut;

/**
 * THE SEAT CARD'S INTERIOR, in R4's own authored units.
 *
 * ⚠ **EVERY VALUE HERE IS `pdaGlyphs`' `CARD` × `CORE_K`, AND
 * `tests/lib/pda-card.test.ts` HOLDS THE PAIR.** Reading 01's grid card is this
 * same drawing at 1, so a rung moved on one side without the other fails there
 * rather than quietly making the flight swap its object again — which is the
 * defect the 2026-08-13 harmonisation fixed.
 *
 * Both sides keep their EXACT numbers rather than one deriving from the other:
 * R4's are authored integers and the grid's are 1/1.7 of them, so whichever way
 * a multiply runs it lands one side on 17 significant digits for no gain. The
 * test is the relationship; these are the drawing.
 */
export const SEAT = {
  /** ⚠ Proportional to the cartridge's `14`, so the object the flight carries
   *  keeps its silhouette all the way across. */
  cut: 14 * CORE_K,
  pad: 18,
  /** The state mark's side, and its top off the card's own top. */
  mark: 14,
  markY: 14,
  /** The header row's baseline, and the team code's offset past the mark. */
  headBase: 25,
  teamDx: 23,
  /** R4's bright top rule. */
  rule: 2,
  titleBase: 66,
  barLabel: 120,
  barLine: 140,
  /** The lane meter's top, up off the card's floor. */
  footUp: 22,
} as const;
const CORE_CUT = SEAT.cut;

/* ── The module interior ────────────────────────────────────────────────
   One padding, one header height, one cell height, so the two satellites and
   the base share a rhythm. `CELL_H` seats a key line plus two wrapped value
   lines; it is the one interior measure that grows with the board. */
const PAD = MODULE.pad;
const CORE_PAD = SEAT.pad;
const HEAD_H = MODULE.head;
const KEY_BASE = 24;
const VAL_BASE = 44;

/* The reference's own vertical chain, at rest. */
const CELL_H0 = 87;
const SAT_H0 = 218;
const BASE_H0 = 128;
const GAP1_0 = 56.4;
const GAP2_0 = 116.4;
/** The crop's height at rest — R4's stage plus its frame inset. */
const CROP_H0 = 751;
/** R4's stage, which is the space its bed is scattered across. */
const R4_STAGE_H = 744;

/**
 * ⚠ HOW THE EXTRA HEIGHT IS SPENT, and why it is spent HERE.
 *
 * The board is width-limited — the crop's width is the field's, so nothing
 * can be drawn BIGGER. The only currency a tall panel offers is vertical
 * distribution, and there are exactly two honest places for it: the cables,
 * which are the reference's own grammar (modules connected by ribbon lanes,
 * so a taller board is a longer run), and the cells, which is air around the
 * answers rather than a pool of it under the last module.
 *
 * The card is NOT in this list: its box is the flight's destination and its
 * proportion is fixed to the cartridge's. It re-centres in the band instead.
 *
 * ⚠ AND THERE IS NO TAIL SHARE ANY MORE (U14, owner: _"move the nodes
 * components a bit down so everything is nicely centered"_). U12 hung the
 * remainder off the BOTTOM as bed tail, which is invisible — so the module
 * block sat high with a bare band under it, 26 units of air above against
 * 135 below at the owner's shape. **The margin is DERIVED and SPLIT now**:
 * whatever the gaps and cells do not take is halved above and below the
 * block, so the drawing is centred by construction rather than by a share
 * that has to be tuned.
 */
const CELL_GROW = 0.09;
const CELL_H_MAX = 130;
const SHARE = { gap1: 0.26, gap2: 0.4 } as const;
/**
 * Past this the runs stop reading as cable and start reading as a gap.
 *
 * 620 is set from the tallest field this console actually takes on a
 * DESKTOP: 2560×1440 gives 850 × 1120 and wants 477, so it fills exactly.
 * The only measured shape that reaches the clamp is a PORTRAIT desktop
 * window (1280×1440 wants 1068), and there the board letterboxes on purpose
 * — a 590-unit bus run is not a cable, it is a gap with wires in it. That is
 * the honest failure, and `pda-viewbox` names it rather than hiding it.
 */
export const CONFIG_EXT_MAX = 620;

export interface ConfigLayout {
  ext: number;
  cellH: number;
  satH: number;
  baseH: number;
  gap2: number;
  core: FlightRect;
  left: FlightRect;
  right: FlightRect;
  base: FlightRect;
  /** The SKILL chip's rect — the flight's second HOME (ADR-071). It nests
   *  inside `left`'s first cell, below the SKILL key, and is exposed on the
   *  layout so the console reads it the same way it reads `core` for the
   *  work card. */
  skillChip: FlightRect;
  /** The module block's floor — the base module's bottom edge, and the last
   *  thing on the board a reader actually looks at. */
  blockBottom: number;
  /** Air above the block, and the same again below it. */
  margin: number;
  cropY: number;
  cropH: number;
  crop: string;
}

/**
 * THE BOARD AT ONE HEIGHT. Pure, so `pda-viewbox` can walk it.
 *
 * `ext` is extra authoring units of height, 0 at the reference. The crop is
 * `CROP_H0 + ext`, the module block takes what the gaps and cells claim, and
 * **the remainder is halved above and below it** — so the board is centred at
 * every height by construction and there is no share left to mistune.
 *
 * ⚠ The split, the rounding and the ext arithmetic are `pdaFit`'s now
 * (2026-08-12) — U12/U14 turned out to be the general case, and readings 01
 * and 03 were carrying the same defect this fixed here. This board's OWN
 * numbers are unchanged: `configLayout(0)` is byte-identical, which is what
 * `pda-viewbox`'s elastic suite is for.
 */
/**
 * WHERE THE CHIP SITS INSIDE THE SKILL CELL — measured from the cell's own
 * top edge.
 *
 * The cell has KEY at y+24 and a 12-unit clearance below it. 36 lands the
 * chip's top 12 units past the KEY, with 11 units of air below the chip
 * against the cell's floor at rest — the SKILL cell's slack, spent on air
 * around the object that names it rather than on line spacing beneath a
 * text line that no longer renders.
 */
const SKILL_CHIP_TOP = 36;

export function configLayout(ext: number): ConfigLayout {
  const cellH = Math.min(CELL_H_MAX, CELL_H0 + CELL_GROW * ext);
  const grow = cellH - CELL_H0;
  const satH = SAT_H0 + grow * 2;
  const baseH = BASE_H0 + grow;
  const bandH = Math.max(CORE_H, satH);

  const gap1 = GAP1_0 + SHARE.gap1 * ext;
  const gap2 = GAP2_0 + SHARE.gap2 * ext;

  const bandY = OWNER.y + OWNER.h + gap1;
  const core = { x: CORE_X, y: bandY + (bandH - CORE_H) / 2, w: CORE_W, h: CORE_H };
  const satY = bandY + (bandH - satH) / 2;
  const baseY = bandY + bandH + gap2;
  const blockBottom = baseY + baseH;

  /* ⚠ THE MARGIN IS WHAT IS LEFT, AND IT IS SPLIT. The block grows by ~0.93
     of `ext` (0.66 from the gaps, the rest from the cells) against a crop
     that grows by 1.0, so the air widens slowly and can never go negative.
     ⚠ The horizontal margin is the SAME rule, not a special case: the crop is
     the content plus two insets, so the split returns exactly `CONFIG_INSET`. */
  const box = cropAround(
    { x: CONTENT_L, y: OWNER.y, w: CONTENT_R - CONTENT_L, h: blockBottom - OWNER.y },
    CROP_W,
    CROP_H0 + ext
  );

  /* THE CHIP'S HOME. The SKILL cell's `y` follows the cell's own bias
     ((cellH - CELL_H0) / 2 above the head — the R4 top-align preserved), so
     the chip's `y` is derived the same way rather than pinned to `left.y`. */
  const cellShift = (cellH - CELL_H0) / 2;
  const skillChip: FlightRect = {
    x: LEFT_X + PAD,
    y: satY + HEAD_H + cellShift + SKILL_CHIP_TOP,
    w: SKILL_CHIP_W,
    h: SKILL_CHIP_H,
  };

  return {
    ext,
    cellH,
    satH,
    baseH,
    gap2,
    core,
    left: { x: LEFT_X, y: satY, w: SAT_W, h: satH },
    right: { x: RIGHT_X, y: satY, w: SAT_W, h: satH },
    base: { x: BASE_X, y: baseY, w: BASE_W, h: baseH },
    skillChip,
    blockBottom,
    margin: box.marginY,
    cropY: box.cropY,
    cropH: box.cropH,
    crop: box.crop,
  };
}

/**
 * The extra height a field of this aspect can hold, free.
 *
 * ⚠ THE DRAWING STAYS WIDTH-BOUND BY CONSTRUCTION, which is the whole trick:
 * `meet` is `field.w / CROP_W` either way, so growing the crop's height to
 * exactly `CROP_W × aspect` costs NOTHING in rendered type and removes the
 * letterbox instead. Measured fields: 603×493 → ext 11, 850×760 → 82,
 * 845×950 → 297, 850×1120 → clamped.
 *
 * ⚠ **THIS BOARD GROWS ON ONE AXIS ONLY** (`maxW: 0`), unlike readings 01 and
 * 03. The width chain is the reference's module table verbatim and every x in
 * it is a measured handoff coordinate — widening the crop would either stretch
 * that table or float it in a wider margin, and the second is the dead panel
 * this helper exists to remove. So a WIDER field than the reference
 * letterboxes horizontally, on purpose, exactly as it did before U12.
 */
const CONFIG_FIT: FitSpec = { cropW: CROP_W, cropH: CROP_H0, maxW: 0, maxH: CONFIG_EXT_MAX };

export const configExt = (fieldAspect: number) => fitExt(CONFIG_FIT, fieldAspect).extH;

/** The board at rest — the reference's own proportions, and what every guard
 *  and the lab measure against. */
export const CONFIG_LAYOUT_0 = configLayout(0);
export const CONFIG_VIEWBOX = CONFIG_LAYOUT_0.crop;
export const CORE_RECT: FlightRect = CONFIG_LAYOUT_0.core;

/**
 * THE TYPE LADDER — the reference's RANKING, with its bottom rungs lifted to
 * the floor the owner set (ADR-070 U10: nothing letters under 12).
 *
 *   role        reference   here   why it moved
 *   title           30       22    the record's longest is CANDIDATE
 *                                  SCREENING (19 chars) against the
 *                                  reference's CAMPAIGN COPY (13); 22 is
 *                                  the largest that letters 19 in 263u
 *   value           11       14    the floor, plus the rank above the key
 *   owner name    11.5       14    near-parity with the value, exactly as
 *                                  the reference has it; bold + green
 *                                  carries the emphasis, not size
 *   question         9       13    demoted BELOW the value, which is the
 *                                  reference's own order and ADR-069's
 *                                  principle: the question is chrome
 *   field key      8.5     12.5    the floor +0.5
 *   chrome       6.5–8       12    the floor. This is where the reference's
 *                                  range is lost — it is bought back in
 *                                  ALPHA, which does not shrink with meet
 */
const FS = {
  title: 22,
  value: 14,
  owner: 14,
  q: 13,
  id: 13,
  lat: 13,
  ownerKey: 13,
  key: 12.5,
  chrome: 12,
} as const;

/** PT Mono's advance plus the tracking. */
const adv = (fs: number, track: number) => fs * (0.6 + track);
/**
 * ⚠ THE BASELINE STEP IS NOT THE LINE BOX. A line box is what a line
 * OCCUPIES; stepping consecutive baselines by it makes their glyph boxes
 * abut, and `getBBox` reports taller than 1.3 em — the lab's capture gate
 * flagged real collisions between the two wrapped lines of one value. 1.7 is
 * the house number, and the smoke's label-on-label walk is what holds it.
 */
const STEP = FS.value * 1.7;
const charsFor = (measure: number, fs: number) => Math.max(1, Math.floor(measure / adv(fs, 0.08)));

const SAT_MEASURE = SAT_W - PAD * 2;
const BASE_COL = BASE_W / 2;
const BASE_MEASURE = BASE_COL - PAD * 2;
const CORE_MEASURE = CORE_W - CORE_PAD * 2;
/** The seat's two columns. The worst pair is the person-led owner line (252u)
 *  beside `DECIDES ALONE` (124.8u) — 367 of 388, so the columns cannot meet. */
const OWNER_MEASURE = 250;
const OWNER_RIGHT = 128;

/**
 * ⚠ **THE LANE LADDER AND ITS VOCABULARY ARE `pdaGlyphs`' NOW** (2026-08-13) —
 * reading 01's grid card letters the same foot, and two copies of a measured
 * drawing is how they stop being one. `LaneMeter` there takes `k` (this card
 * mounts it at `CORE_K`) and its font size as a prop, because each card letters
 * at its own derived chrome rung.
 *
 * What it means has not changed: it is the capability LANE, generic by law,
 * already published, with exactly four values — so the gauge IS the record
 * rather than a rating of it, and NOT the retired DRAW PER RUN meter that
 * measured workload and needed a NEVER A PRICE caption to stay honest.
 */

/* ── The fit declaration ────────────────────────────────────────────────
   Every string this drawing letters, with the measure it has to fit in.
   `pda-viewbox` walks it for all twenty-seven streams: SVG `<text>` neither
   wraps nor reports overflow, so a value past its box vanishes at the edge
   with nothing on screen to say so. A lettered string missing from here is a
   defect in the drawing, not a gap in the guard.

   ⚠ EVERY MEASURE HERE IS HORIZONTAL, and the width chain never moves — so
   the fit is independent of `ext` and the guard walks it once. */
export interface ConfigLetterSpec {
  slot: string;
  text: string;
  fs: number;
  /** Tracking in em — the advance model needs it. */
  track: number;
  measure: number;
}

export const configSpecWidth = (s: ConfigLetterSpec) => s.text.length * adv(s.fs, s.track);

/** A cell: a key and its answer. */
interface CellDef {
  key: string;
  value: string;
}
interface GroupDef {
  q: string;
  part: "runs" | "rch" | "whr";
  cells: readonly [CellDef, CellDef];
}

/**
 * The three questions and their six answers — ADR-070 U9's slotting, which
 * the R4 handoff's own module table repeats unchanged.
 *
 * ⚠ `MODEL` ANSWERS WITH THE VERBS, NOT THE LANE. The lane is a GENERIC
 * capability tier by law — the map's envelope forbids naming a model family
 * and `cases-registry` fails on one — so it cannot be made concrete by naming
 * the model. `m[1]` is the concrete thing the record already holds, and the
 * tier is answered by the card's lane ladder instead.
 */
const groupsOf = (w: PdaWork): readonly GroupDef[] => {
  const c = w.cfg;
  return [
    {
      q: "WHAT RUNS IT",
      part: "runs",
      cells: [
        { key: "SKILL", value: c.skill },
        { key: "MODEL", value: c.laneVerbs },
      ],
    },
    {
      q: "WHAT IT CAN REACH",
      part: "rch",
      cells: [
        { key: "KNOWLEDGE GRAPH", value: c.graph },
        { key: "CONNECTORS", value: c.system },
      ],
    },
    {
      q: "WHERE IT RUNS",
      part: "whr",
      cells: [
        { key: "AGENT", value: c.agent },
        { key: "INTERFACE", value: c.surface },
      ],
    },
  ];
};

/** The wrapped lines a value takes. ⚠ `wrapLines` SLICES at its cap, so the
 *  line PAST the cap is declared with a ZERO measure — a sliced tail then
 *  fails the guard loudly instead of vanishing on screen. */
function valueSpecs(slot: string, value: string, fs: number, measure: number): ConfigLetterSpec[] {
  return wrapLines(value, charsFor(measure, fs), 3).map((line, i) => ({
    slot: `${slot}.L${i}`,
    text: line,
    fs,
    track: 0.08,
    measure: i < 2 ? measure : 0,
  }));
}
const valueLines = (value: string, fs: number, measure: number) =>
  wrapLines(value, charsFor(measure, fs), 2);

export function configurationLettering(work: PdaWork): ConfigLetterSpec[] {
  const groups = groupsOf(work);
  const specs: ConfigLetterSpec[] = [
    {
      slot: "ownerLabel",
      text: "WHO OWNS IT",
      fs: FS.ownerKey,
      track: 0.2,
      measure: OWNER_MEASURE,
    },
    { slot: "owner", text: work.owner, fs: FS.owner, track: 0.1, measure: OWNER_MEASURE },
    { slot: "decides", text: "DECIDES ALONE", fs: FS.chrome, track: 0.2, measure: OWNER_RIGHT },
    { slot: "autonomy", text: work.autonomy, fs: FS.lat, track: 0.22, measure: OWNER_RIGHT },
  ];

  /* THE SEAT'S SECOND LINE — what that seat actually owns (U7). Absent for
     person-led, which has no configured seat to gloss. */
  if (work.ownerNote) {
    specs.push({
      slot: "ownerNote",
      text: work.ownerNote,
      fs: FS.chrome,
      track: 0.14,
      measure: OWNER.w - 36,
    });
  }

  for (const g of groups) {
    const measure = g.part === "whr" ? BASE_MEASURE : SAT_MEASURE;
    const qMeasure = (g.part === "whr" ? BASE_W : SAT_W) - PAD * 2;
    specs.push({ slot: `${g.q}.q`, text: g.q, fs: FS.q, track: 0.14, measure: qMeasure });
    for (const cell of g.cells) {
      specs.push({
        slot: `${g.q}.${cell.key}.k`,
        text: cell.key,
        fs: FS.key,
        track: 0.18,
        measure,
      });
      /* ⚠ THE SKILL VALUE IS DELETED HERE AND DRAWN BY THE CHIP INSTEAD
         (ADR-071). The chip's own spec is declared below with the chip's own
         type and measure, so the guard walks the actual rendered string
         rather than a value the drawing no longer prints. */
      if (g.part === "runs" && cell.key === "SKILL") continue;
      specs.push(...valueSpecs(`${g.q}.${cell.key}`, cell.value, FS.value, measure));
    }
  }

  /* ⚠ THE CHIP DECLARES ITS OWN LETTERED STRINGS (ADR-071). The engine tag
     runs uppercase at CHIP_TAG_FS/CHIP_TAG_TRACK, the skill name at CHIP_FS
     with `.04em`. The measure is the chip's own inner width — SKILL_CHIP_W
     less its two 8-unit pads — so the guard walks against the chip's plate,
     not against the SKILL cell's 180-unit column. Absent for person-led
     work (`skillEngine === null`): there is no chip. */
  if (work.cfg.skillEngine) {
    specs.push({
      slot: "chip.engine",
      text: work.cfg.skillEngine.toUpperCase(),
      fs: 12,
      track: 0.18,
      measure: SKILL_CHIP_W - 16,
    });
    specs.push({
      slot: "chip.skill",
      text: work.cfg.skill,
      fs: CHIP_FS,
      track: 0.04,
      measure: SKILL_CHIP_W - 16,
    });
  }

  /* ⚠ THE CARD'S OWN STRINGS ARE DECLARED HERE. While the card was
     `Cartridge` they were lettered by a shared glyph and this declaration
     never saw them — the guard was walking a drawing with three invisible
     labels in it. Any reading that mounts a production glyph inherits that
     blind spot. */
  specs.push({ slot: "card.team", text: work.teamAb, fs: FS.chrome, track: 0.24, measure: 120 });
  specs.push({ slot: "card.id", text: work.id, fs: FS.id, track: 0.18, measure: 120 });
  specs.push({
    slot: "card.title",
    text: work.title,
    fs: FS.title,
    track: 0.01,
    measure: CORE_MEASURE,
  });
  specs.push({
    slot: "card.tier",
    text: laneLabel(work.lane),
    fs: FS.chrome,
    track: 0.2,
    measure: CORE_MEASURE - meterLabelDx(CORE_K),
  });

  specs.push({
    slot: "bar.label",
    text: "THE BAR",
    fs: FS.key,
    track: 0.18,
    measure: CORE_MEASURE,
  });
  specs.push(...valueSpecs("bar", work.cfg.bar, FS.value, CORE_MEASURE));

  return specs;
}

/* ── Sub-drawings ──────────────────────────────────────────────────────── */

/**
 * THE MODULE HOUSING AND ITS BAND ARE `substrateKit`'s NOW (2026-08-12).
 *
 * The R4 grammar — opaque fill, 1px border, a 2px top rule, and two opposed
 * 45° corner cuts on ADR-065's canonical TR+BL diagonal (owner, U13; R4 draws
 * TL+BR, and that is the one place the reference is overruled by a standing
 * rule instead of by arithmetic).
 *
 * ⚠ IT CUTS OPPOSITE TO ITS OWN HOUSING. `ConsoleFrame` keeps the TL+BR
 * override ADR-065 U2 gave it, so the plate and the console it sits in lean
 * different ways. That was the whole argument for the TL+BR cut here, and the
 * owner has overruled it; if the frame should follow, that is `console.css`
 * and its own pass.
 *
 * ⚠ Both paths were declared identically here and in the kit. Reading 03's
 * cards are meant to BE this object, so they share one definition rather than
 * two that agree today.
 */

/** A multi-conductor bundle — 8 parallel wires at 4 pitch behind a 45° hatch,
 *  the reference's one cable grammar on all five docks. */
function Ribbon({
  pts,
  hatch,
  stroke,
  fill,
  opacity,
  dashed,
  draw,
}: {
  pts: readonly Pt[];
  /** The hatched bands, in the reference's own rects — vertical runs only on
   *  the buses, exactly as the handoff specifies. */
  hatch: readonly (readonly [number, number, number, number])[];
  stroke: string;
  fill: string;
  opacity: number;
  dashed?: boolean;
  draw: number | null;
}) {
  /* ⚠ The class goes on each PATH, not the group: `fl-pda-wire` animates
     `stroke-dashoffset`, and reading 03 proves the per-path form. */
  const len = draw === null ? 0 : polylineLength(pts);
  return (
    <g opacity={opacity}>
      {/* ⚠ THE HATCH ARRIVES WITH ITS WIRES. It is a fill, so it cannot draw
          on — and left ungated it painted at full strength while the
          conductors were still travelling, which read as empty bands landing
          before their cables. Same delay, so the band assembles as one. */}
      <g
        className={draw === null ? undefined : "fl-pda-in"}
        style={{ animationDelay: `${draw}ms` }}
      >
        {hatch.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} fill={`url(#${fill})`} />
        ))}
      </g>
      <g stroke={stroke} fill="none" strokeWidth="1">
        {ribbonPaths(pts, 8, 4).map((d, i) => (
          <path
            key={i}
            d={d}
            strokeDasharray={dashed ? "4 3" : undefined}
            className={draw === null ? undefined : "fl-pda-wire"}
            style={
              draw === null
                ? undefined
                : ({ "--l": len, animationDelay: `${draw}ms` } as React.CSSProperties)
            }
          />
        ))}
      </g>
    </g>
  );
}

/**
 * A key and its answer.
 *
 * ⚠ ONE INK FOR EVERY ANSWER, AND THE KEY IN TENSOR GOLD (owner, and the R4
 * token law says the same: gold is wayfinding, and a field label is how the
 * reader finds the field). `--pda-ink` is `--gold-ink`, the 4.5:1 rung of
 * ADR-063 U2's ramp — NEVER `--gold` itself, which is the MARK rung and
 * measures ~1.1:1 as small text on the light theme's parchment.
 *
 * ⚠ `hideValue` DROPS THE VALUE LINE (ADR-071, 2026-08-19). The SKILL cell
 * in WHAT RUNS IT now hosts the SkillChip — a distinct object that flies to
 * the substrate carrier — so the cell keeps its KEY label but the value
 * text is deleted; the chip drawing carries it. Every OTHER cell letters
 * both.
 */
function Cell({
  x,
  y,
  cell,
  measure,
  led,
  hideValue,
}: {
  x: number;
  y: number;
  cell: CellDef;
  measure: number;
  led: boolean;
  hideValue?: boolean;
}) {
  return (
    <g>
      <text
        x={x + PAD}
        y={y + KEY_BASE}
        fontSize={FS.key}
        letterSpacing=".18em"
        fill="var(--pda-ink)"
      >
        {cell.key}
      </text>
      {hideValue
        ? null
        : valueLines(cell.value, FS.value, measure).map((line, i) => (
            <text
              key={i}
              x={x + PAD}
              y={y + VAL_BASE + STEP * i}
              fontSize={FS.value}
              letterSpacing=".08em"
              fill={led ? "var(--pda-txt3)" : "var(--pda-txt)"}
            >
              {line}
            </text>
          ))}
    </g>
  );
}

/**
 * A question module: the R4 housing, a header band carrying the question in
 * bold, and two cells.
 *
 * ⚠ NO DIVIDER BETWEEN THE CELLS. The owner's "clean separation between skill
 * and model" (2026-08-11) was a ruling against the hatch and the dashed inset
 * that were there; the R4 reference makes the gold key the separator instead,
 * and a rule between two blocks that already start with a gold word is the
 * chrome this pass is removing.
 */
function QNode({
  box,
  cellH,
  g,
  stacked,
  led,
  hot,
  onLit,
}: {
  box: FlightRect;
  cellH: number;
  g: GroupDef;
  stacked: boolean;
  led?: boolean;
  hot?: boolean;
  onLit: (k: string | null) => void;
}) {
  const { x, y, w, h } = box;
  /* The reference borders its satellites at dawn .25 — quiet, well under the
     core's gold and the seat's green. `--pda-hair2` is this console's own
     hairline at that weight, already re-derived for the light flip. */
  /* ADR-092: the satellites are estate line-work — dawn — and hover is the
     one transient hue. `--pda-line` is the estate's stroke, re-derived for
     light; the gold hairline stand-in is gone. */
  const stroke = hot ? "var(--pda-hot)" : "var(--pda-line)";
  const measure = stacked ? SAT_MEASURE : BASE_MEASURE;
  return (
    <g onMouseEnter={() => onLit(g.part)} onMouseLeave={() => onLit(null)}>
      <path d={housing(x, y, w, h, CUT)} fill="var(--pda-void)" />
      {/* THE DENSITY RULE: modules are OPAQUE so they pop off the bed. The
          lift is a dawn wash, which inverts correctly on the light flip —
          there it darkens the plate against parchment. */}
      <path d={housing(x, y, w, h, CUT)} fill="rgba(var(--dawn-rgb), 0.03)" />
      <path
        d={housing(x, y, w, h, CUT)}
        fill="none"
        stroke={stroke}
        strokeDasharray={led ? "5 4" : undefined}
      />
      {/* The header band, and the 2px top rule over it. ⚠ The rule STOPS at
          the cut: it runs to the corner the diagonal starts from, or it
          overshoots into the notch. */}
      <path d={band(x, y, w, HEAD_H, CUT)} fill="rgba(var(--dawn-rgb), 0.05)" />
      <line x1={x} y1={y + 1} x2={x + w - CUT} y2={y + 1} stroke={stroke} strokeWidth="2" />
      <line x1={x} y1={y + HEAD_H} x2={x + w} y2={y + HEAD_H} stroke="var(--pda-hair)" />
      <text
        x={x + PAD}
        y={y + 23}
        fontSize={FS.q}
        letterSpacing=".14em"
        fill={hot ? "var(--pda-hot)" : "var(--pda-txt)"}
      >
        {g.q}
      </text>
      {/* ⚠ THE ADDED AIR IS SPLIT, NOT POOLED. R4's cells are top-aligned and
          carry their slack at the bottom, so that bias is kept at rest; as the
          board grows, half of each cell's new height goes ABOVE its content
          instead of all of it below, which is the difference between a taller
          module and a module with a hole under it. */}
      {g.cells.map((c, i) => (
        <Cell
          key={c.key}
          x={x + (stacked ? 0 : i * BASE_COL)}
          y={y + HEAD_H + (cellH - CELL_H0) / 2 + (stacked ? i * cellH : 0)}
          cell={c}
          measure={measure}
          led={Boolean(led)}
          /* ⚠ WHAT RUNS IT's SKILL slot HOSTS THE CHIP (ADR-071). The KEY
             label stays; the value text is deleted here and drawn on the
             chip's own plate — see `SkillChip` in `ViewConfiguration`. */
          hideValue={g.part === "runs" && c.key === "SKILL"}
        />
      ))}
    </g>
  );
}

/**
 * THE WORK — the reference's core module, on the cartridge's silhouette.
 *
 * The gauge is the state mark ADR-062 needs: the reference's square-in-square
 * where a configuration is on record, and a crossed square where the work is
 * deliberately person-led.
 *
 * ⚠ THE SILHOUETTE MAY NOT MOVE. This box is the flight's destination and the
 * docking group must contain this card ALONE: `fill-box` means the transform
 * is measured against the group's own bbox, and a child reaching past the
 * rect moves the origin the whole flight is computed from.
 */
function SeatCard({ core, work, led }: { core: FlightRect; work: PdaWork; led: boolean }) {
  /* ADR-092: the seat IS the open record, so it takes the LATCH token — the
     same paint `Cartridge` gives the selected card, at `CORE_K`. */
  const stroke = "var(--pda-sel)";
  const d = housing(core.x, core.y, core.w, core.h, CORE_CUT);
  const gx = core.x + CORE_PAD;
  const gy = core.y + SEAT.markY;
  const headBase = core.y + SEAT.headBase;
  /* ⚠ THE BAR BLOCK IS SEATED, NOT STACKED. The reference pins its meter to
     the card's floor and lets the slack fall where it lands; at this size
     that put a 55-unit hole in the middle of the one bright object. 120
     splits it — 39 units of air above the block and 39 below, measured
     against the title's descenders and the meter's cap. */
  const barBase = core.y + SEAT.barLabel;
  const meterY = core.y + core.h - SEAT.footUp;
  return (
    <g>
      <path d={d} fill="var(--pda-void)" />
      <path d={d} fill="var(--pda-sel-wash)" />
      <path d={d} fill="none" stroke={stroke} strokeDasharray={led ? "5 4" : undefined} />
      <line
        x1={core.x}
        y1={core.y + SEAT.rule / 2}
        x2={core.x + core.w - CORE_CUT}
        y2={core.y + SEAT.rule / 2}
        stroke={stroke}
        strokeWidth={SEAT.rule}
      />

      {/* The state mark: the reference's 14-unit outline with a 5-unit fill.
          ⚠ Shared with reading 01's grid card, which mounts it at 14 / CORE_K. */}
      <StateMark x={gx} y={gy} side={SEAT.mark} led={led} stroke={stroke} />

      <text
        x={gx + SEAT.teamDx}
        y={headBase}
        fontSize={FS.chrome}
        letterSpacing=".24em"
        fill="var(--pda-txt2)"
      >
        {work.teamAb}
      </text>
      <text
        x={core.x + core.w - CORE_PAD}
        y={headBase}
        textAnchor="end"
        fontSize={FS.id}
        letterSpacing=".18em"
        fill="var(--pda-sel)"
      >
        {work.id}
      </text>

      <text
        x={gx}
        y={core.y + SEAT.titleBase}
        fontSize={FS.title}
        letterSpacing=".01em"
        fill={led ? "var(--pda-txt3)" : "var(--pda-txt)"}
      >
        {work.title}
      </text>

      <text x={gx} y={barBase} fontSize={FS.key} letterSpacing=".18em" fill="var(--pda-txt2)">
        THE BAR
      </text>
      {valueLines(work.cfg.bar, FS.value, CORE_MEASURE).map((line, i) => (
        <text
          key={i}
          x={gx}
          y={core.y + SEAT.barLine + STEP * i}
          fontSize={FS.value}
          letterSpacing=".08em"
          fill={led ? "var(--pda-txt3)" : "var(--pda-txt)"}
        >
          {line}
        </text>
      ))}

      <LaneMeter x={gx} y={meterY} lane={work.lane} fs={FS.chrome} k={CORE_K} />
    </g>
  );
}

/**
 * The seat. Green marks the human and is used nowhere else — the R4 role law,
 * which is ADR-070 U5's own distinction expressed as a colour rather than as
 * a line weight.
 */
function OwnerPlate({ work, led }: { work: PdaWork; led: boolean }) {
  const green = led ? "var(--pda-txt3)" : "var(--pda-grn)";
  const d = housing(OWNER.x, OWNER.y, OWNER.w, OWNER.h, CUT);
  const lx = OWNER.x + 18;
  const rx = OWNER.x + OWNER.w - 18;
  /* Centred on its own ink: three rows measuring 61.4 units in a 108-unit
     plate, which is 23.3 of air above and below. */
  const r1 = OWNER.y + 33;
  return (
    <g>
      <path d={d} fill="var(--pda-void)" />
      <path d={d} fill={led ? "rgba(var(--dawn-rgb), 0.03)" : "rgba(126, 159, 102, 0.07)"} />
      <path d={d} fill="none" stroke={green} strokeDasharray={led ? "5 4" : undefined} />
      <line
        x1={OWNER.x}
        y1={OWNER.y + 1}
        x2={OWNER.x + OWNER.w - CUT}
        y2={OWNER.y + 1}
        stroke={green}
        strokeWidth="2"
      />

      <text x={lx} y={r1} fontSize={FS.ownerKey} letterSpacing=".2em" fill="var(--pda-txt2)">
        WHO OWNS IT
      </text>
      <text
        x={rx}
        y={r1}
        textAnchor="end"
        fontSize={FS.chrome}
        letterSpacing=".2em"
        fill="var(--pda-txt3)"
      >
        DECIDES ALONE
      </text>

      <text x={lx} y={r1 + 26} fontSize={FS.owner} letterSpacing=".1em" fill={green}>
        {work.owner}
      </text>
      <text
        x={rx}
        y={r1 + 26}
        textAnchor="end"
        fontSize={FS.lat}
        letterSpacing=".22em"
        fill="var(--pda-txt)"
      >
        {work.autonomy}
      </text>

      {work.ownerNote ? (
        <text x={lx} y={r1 + 48} fontSize={FS.chrome} letterSpacing=".14em" fill="var(--pda-txt2)">
          {work.ownerNote}
        </text>
      ) : null}
    </g>
  );
}

/**
 * THE SUBSTRATE BED — the field the modules sit on, and the thing the
 * reference is named for.
 *
 * ⚠ ITS DENSITY RULE IS AN ALPHA CEILING, NOT A SIZE FLOOR: nothing here
 * exceeds ~.14, and the modules stay opaque so they pop. That is why the bed
 * survives this drawing's type lift unchanged while its LABELS did not — a
 * mark at .14 reads as texture at any scale, and a 4px letter reads as dirt.
 *
 * ⚠ AND IT SPANS THE WHOLE CROP, not the module block. R4 scatters its bed
 * across its own 744-unit stage, so every y here is a FRACTION of that mapped
 * onto the crop — which puts texture ABOVE the seat and below the base at
 * every height, instead of leaving the head bare and pooling a tail under the
 * board. The marks themselves never scale: a stretched via is a bug, not a
 * bed. Anything that lands under a module is simply hidden — they are opaque,
 * and R4's own note that the bed is "scattered clear of modules" is about
 * where it READS, not about where it exists.
 */
function SubstrateBed({ layout }: { layout: ConfigLayout }) {
  const at = (y: number) => layout.cropY + (y / R4_STAGE_H) * layout.cropH;
  const passives = [
    [56, 64],
    [806, 84],
    [96, 470],
    [816, 470],
    [70, 688],
    [700, 700],
  ] as const;
  const vias = [
    [40, 160],
    [90, 300],
    [150, 452],
    [240, 706],
    [420, 480],
    [520, 150],
    [640, 140],
    [760, 150],
    [856, 600],
    [300, 716],
    [660, 700],
    [560, 480],
    [220, 150],
    [360, 150],
  ] as const;
  /* The two meanders, from the reference — anchors on the board's own scale,
     diagonal legs a fixed 40 so they stay at 45°. */
  const m1 = `M20 ${at(140)}H180L220 ${at(140) + 40}V${at(400)}`;
  const m2 = `M868 ${at(440)}V${at(560)}L820 ${at(560) + 48}H700`;
  return (
    /* ⚠ ONE GROUP OPACITY IS THE ALPHA CEILING — but it is set against the
       RENDERED drawing, not the reference's 1:1 canvas. `meet` is 0.647 at
       the binding preset, so every 1-unit hairline here paints 0.65 device px
       and the browser pays for the rest in alpha: the reference's ~.14 bed
       arrives at ~.09 and disappears. 0.85 is what puts it back where the
       reference has it. */
    <g opacity="0.85" aria-hidden="true">
      {/* The ghost die — the card's own footprint, 20 units proud on every
          side. It is what the eye reads as the card's bezel. */}
      <rect
        x={layout.core.x - 20}
        y={layout.core.y - 20}
        width={layout.core.w + 40}
        height={layout.core.h + 40}
        fill="none"
        stroke="var(--pda-hair2)"
        strokeDasharray="4 5"
      />
      <path d={`${m1} ${m2}`} fill="none" stroke="var(--pda-hair2)" />
      <g fill="var(--pda-hair2)">
        {passives.map(([px, py]) => (
          <g key={`${px}-${py}`}>
            <rect x={px} y={at(py)} width={10} height={4} />
            <rect x={px} y={at(py) + 7} width={10} height={4} />
          </g>
        ))}
        {vias.map(([px, py]) => (
          <rect key={`v${px}-${py}`} x={px} y={at(py)} width={3} height={3} opacity="0.7" />
        ))}
      </g>
    </g>
  );
}

/* The arrival, in ms. The card carries the flight from t=0 (it is the object
   reading 01 handed over); the bed settles, the owner seats, the bundles draw
   on under it, the modules light — so the board assembles outward from the
   record rather than fading in as one picture. */
const T = { bed: 60, owner: 120, wire: 260, wireStep: 60, node: 380, nodeStep: 80 } as const;

export function ViewConfiguration({
  work,
  layout,
  lit,
  onLit,
  still,
  entry,
  skillEntry,
  skill,
}: {
  work: PdaWork;
  shapes: readonly PdaShape[];
  /** The board at the field's measured height — `configLayout(configExt(…))`.
   *  The console owns the measurement; this draws what it is handed. */
  layout: ConfigLayout;
  lit: string | null;
  onLit: (k: string | null) => void;
  still: boolean;
  entry: PdaEntry;
  /** The SKILL chip's own arrival gesture (ADR-071). Separate from `entry`
   *  because the chip and the work card fly to different homes — the chip
   *  goes 2↔3 while the card goes 1↔2, and their gestures never share a
   *  transition. `null` for streams whose join failed, which also skips the
   *  chip entirely. */
  skillEntry: PdaEntry | null;
  /** The roster entry the chip letters. `null` for person-led work. */
  skill: CaseSkillEntry | null;
}) {
  const led = !work.configured;
  const wire = led ? "var(--pda-txt3)" : "var(--pda-amb)";
  /* ⚠ GREEN IS THE HUMAN AND NOTHING ELSE (the R4 role law, which is why the
     seat's drop is the one green bundle on the board). What the stream runs
     on, reaches and runs in are all gold: none of them is a person. */
  const green = led ? "var(--pda-txt3)" : "var(--pda-grn)";
  const [runs, rch, whr] = groupsOf(work);
  const { core, left, right, base, cellH, gap2 } = layout;
  const coreB = core.y + core.h;
  const coreCY = core.y + core.h / 2;

  /* Every animated group drops its class once the pointer has moved, so a
     hover repaints without replaying the entrance. The DOCK is the one
     exception and it lives in state — see pda.css. */
  const inCls = still ? undefined : "fl-pda-in";
  const at = (ms: number) => (still ? undefined : { animationDelay: `${ms}ms` });
  let wireN = 0;
  const drawAt = () => (still ? null : T.wire + wireN++ * T.wireStep);
  const op = (part: string) => (lit === part ? 0.95 : 0.62);

  /* The buses keep the reference's shape as they lengthen: the 45° jog stays
     28 units and the two straight runs share the growth in its own ratio. */
  const run1 = 32.4 + 0.4 * (gap2 - GAP2_0);
  const jogTop = coreB + run1;
  const jogBot = jogTop + 28;

  return (
    <>
      {/* ⚠ ONE PATTERN PAIR PER MOUNT. The ids are stable because the fragment
          unmounts with the reading; `url(#…)` resolves against the document,
          so a second copy on the page would be a silent collision. */}
      <defs>
        <pattern id="fl-pda-hatch-au" width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M0 7L7 0" stroke="var(--pda-amb)" strokeOpacity="0.34" strokeWidth="1" />
        </pattern>
        <pattern id="fl-pda-hatch-vd" width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M0 7L7 0" stroke={green} strokeOpacity="0.4" strokeWidth="1" />
        </pattern>
      </defs>

      <g className={inCls} style={at(T.bed)}>
        <SubstrateBed layout={layout} />
      </g>

      <g className={inCls} style={at(T.owner)}>
        <OwnerPlate work={work} led={led} />
      </g>

      {/* ── THE FIVE DOCKS, one cable grammar (the handoff's own rule). The
              seat's drop is green because the seat is a PERSON; the other four
              are gold. ADR-070 U5's law — the seat is AUTHORITY, not data — is
              kept by COLOUR here rather than by weight or by a dashed line,
              and it is the reference's role law saying the same thing. ───── */}
      <Ribbon
        pts={[
          [444, OWNER.y + OWNER.h],
          [444, core.y],
        ]}
        hatch={[[430, OWNER.y + OWNER.h, 28, core.y - OWNER.y - OWNER.h]]}
        stroke={green}
        fill="fl-pda-hatch-vd"
        opacity={0.85}
        dashed={led}
        draw={drawAt()}
      />
      <Ribbon
        pts={[
          [core.x, coreCY],
          [left.x + left.w, coreCY],
        ]}
        hatch={[[left.x + left.w, coreCY - 14, core.x - left.x - left.w, 28]]}
        stroke={wire}
        fill="fl-pda-hatch-au"
        opacity={op("runs")}
        dashed={led}
        draw={drawAt()}
      />
      <Ribbon
        pts={[
          [core.x + core.w, coreCY],
          [right.x, coreCY],
        ]}
        hatch={[[core.x + core.w, coreCY - 14, right.x - core.x - core.w, 28]]}
        stroke={wire}
        fill="fl-pda-hatch-au"
        opacity={op("rch")}
        dashed={led}
        draw={drawAt()}
      />
      {/* BUS A and BUS B — two bundles off the card's floor, jogging 45° into
          the base module's two columns. Hatch on the vertical runs only. */}
      {[
        [376, 348],
        [512, 540],
      ].map(([from, to]) => (
        <Ribbon
          key={from}
          pts={[
            [from, coreB],
            [from, jogTop],
            [to, jogBot],
            [to, base.y],
          ]}
          hatch={[
            [from - 14, coreB, 28, run1],
            [to - 14, jogBot, 28, base.y - jogBot],
          ]}
          stroke={wire}
          fill="fl-pda-hatch-au"
          opacity={op("whr")}
          dashed={led}
          draw={drawAt()}
        />
      ))}

      <g className={inCls} style={at(T.node)}>
        <QNode
          box={left}
          cellH={cellH}
          g={runs}
          stacked
          led={led}
          hot={lit === "runs"}
          onLit={onLit}
        />
      </g>
      <g className={inCls} style={at(T.node + T.nodeStep)}>
        <QNode
          box={right}
          cellH={cellH}
          g={rch}
          stacked
          led={led}
          hot={lit === "rch"}
          onLit={onLit}
        />
      </g>
      <g className={inCls} style={at(T.node + 2 * T.nodeStep)}>
        <QNode
          box={base}
          cellH={cellH}
          g={whr}
          stacked={false}
          led={led}
          hot={lit === "whr"}
          onLit={onLit}
        />
      </g>

      {/* ── The one bright object. ⚠ THE DOCK GROUP HOLDS THE CARD ALONE:
              `fill-box` measures the transform against this group's own bbox,
              so anything reaching past the rect moves the flight's origin. ── */}
      <g
        className={entry.kind === "flight" ? "fl-pda-dock" : still ? undefined : "fl-pda-bloom"}
        style={
          entry.kind === "flight"
            ? ({
                "--dx": `${entry.dx}px`,
                "--dy": `${entry.dy}px`,
                "--dk": entry.dk,
              } as React.CSSProperties)
            : undefined
        }
      >
        <SeatCard core={core} work={work} led={led} />
      </g>
      {/* ── THE SKILL CHIP — the second flying object (ADR-071, morph since
              U1). The chip is the READING 02 HOME. On a 3→2 arrival the chip
              itself stays SEATED and hidden until touchdown (`fl-pda-chip-
              reveal`), while the RETURN MORPH above it carries the journey:
              the cell's wedge, projected into this board's own units, morphs
              back into the chip's rectangle and fades to reveal the real
              chip beneath — geometry-identical, so nothing pops. `null` for
              person-led (no encoded substrate) or a failed join, and the
              chip does not render. ── */}
      {skill ? (
        <g
          className={
            skillEntry?.kind === "flight" && skillEntry.morph
              ? "fl-pda-chip-reveal"
              : still || !skillEntry || skillEntry.kind === "flight"
                ? undefined
                : "fl-pda-in"
          }
          style={
            skillEntry?.kind === "flight" || still
              ? undefined
              : { animationDelay: `${T.node + T.nodeStep * 3}ms` }
          }
        >
          <SkillChip
            x={layout.skillChip.x}
            y={layout.skillChip.y}
            entry={{ short: skill.short, engine: skill.engine }}
          />
        </g>
      ) : null}
      {skill && skillEntry?.kind === "flight" && skillEntry.morph ? (
        <ChipMorphReturn
          morph={skillEntry.morph}
          entry={skillEntry}
          layout={layout}
          name={skill.short.toUpperCase()}
        />
      ) : null}
      {/* The bar's hover bed — a SIBLING of the dock group on purpose: the
          listener re-renders on hover, and the dock's entrance style must
          never re-evaluate mid-flight. */}
      <rect
        x={core.x}
        y={core.y + 100}
        width={core.w}
        height={100}
        fill="transparent"
        onMouseEnter={() => onLit("gat")}
        onMouseLeave={() => onLit(null)}
      />
    </>
  );
}

/**
 * The chip name's box in THIS BOARD's user units — the name flight's home on
 * reading 02 (ADR-071 U1). One derivation (`skillChipNameRect`, beside the
 * render in `pdaGlyphs`) so the flight lifts off exactly where the ink is.
 */
export const configSkillNameRect = (layout: ConfigLayout, name: string): FlightRect =>
  skillChipNameRect(layout.skillChip.x, layout.skillChip.y, name, 1);

/**
 * THE RETURN MORPH (3→2, ADR-071 U1) — the cell's wedge, projected into this
 * board's own units by the console, morphs back into the chip's rectangle
 * and fades to reveal the REAL chip seated beneath it (`fl-pda-chip-reveal`
 * keeps that chip hidden until touchdown, so the object never appears
 * twice). The name flies its own dock from the arc label's pose back onto
 * the chip's name — `--dr` replays the tangent orientation it left with.
 *
 * Same three layers as the carrier's `ChipMorphArrival`, with the skin's
 * colour ramp REVERSED via the `--skin-*` vars: lit gold anneals back into
 * the chip's quiet dawn wash on the way home.
 */
function ChipMorphReturn({
  morph,
  entry,
  layout,
  name,
}: {
  morph: ChipMorph;
  entry: PdaEntry & { kind: "flight" };
  layout: ConfigLayout;
  name: string;
}) {
  const box = configSkillNameRect(layout, name);
  const pathVars = {
    "--d-from": `path('${morph.from}')`,
    "--d-to": `path('${morph.to}')`,
  } as React.CSSProperties;
  const skinVars = {
    ...pathVars,
    "--skin-f0": "rgba(var(--gold-rgb), 0.28)",
    "--skin-s0": "var(--pda-sel)",
    "--skin-f1": "rgba(var(--dawn-rgb), 0.05)",
    "--skin-s1": "var(--pda-dim)",
  } as React.CSSProperties;
  return (
    <g pointerEvents="none" aria-hidden="true">
      <path className="fl-pda-chip-morph" style={pathVars} d={morph.to} fill="var(--pda-void)" />
      <path
        className="fl-pda-chip-morph fl-pda-chip-skin"
        style={skinVars}
        d={morph.to}
        strokeWidth="1.4"
      />
      <g
        className="fl-pda-chip-name"
        style={
          {
            "--dx": `${entry.dx}px`,
            "--dy": `${entry.dy}px`,
            "--dk": entry.dk,
            "--dr": `${entry.dr ?? 0}deg`,
          } as React.CSSProperties
        }
      >
        {/* The bbox anchor — see `ChipMorphArrival`'s note; same law here. */}
        <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="none" stroke="none" />
        <text
          x={box.x}
          y={box.y + box.h / 2 + CHIP_FS * 0.36}
          fontSize={CHIP_FS}
          letterSpacing={`${CHIP_NAME_TRACK}em`}
          fill="var(--pda-ink)"
        >
          {name}
        </text>
      </g>
    </g>
  );
}

/** Re-exported so `pda.css`'s dock duration and this drawing stay one pair. */
export { PDA_FLIGHT_MS };
