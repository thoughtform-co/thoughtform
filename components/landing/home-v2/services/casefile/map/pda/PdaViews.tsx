"use client";

import { CONFIG_VIEWBOX } from "./PdaConfiguration";
import { type FitExt, type FitSpec, cropAround, fitExt } from "./pdaFit";
import type { FlightRect } from "./pdaFlight";
import type { PdaEntry } from "./PdaEntry";
import { CARD, CARD_BOX, Cartridge } from "./pdaGlyphs";
import type { PdaWork } from "./pdaRecord";
import { CARRIER_VIEWBOX } from "./PdaCarrier";
import { housing } from "./substrateKit";

/**
 * READING 01 · THE WORK — LEDGER + HERO (2026-08-28, owner: "the work one
 * feels too clustered. Maybe there's a way of reducing the amount of cards
 * or maybe stacking them").
 *
 * The 4×5 grid of twenty small cartridges lettered at ~5–7px effective at
 * the binding 1280×720 preset — the standing density defect ADR-063
 * §Outstanding recorded and no crop lever could reach. This pass replaces
 * the grid with a LEDGER on the left (20 rows of ~20-unit pitch, grouped
 * by team district with small heads) and a HERO on the right (the shared
 * `Cartridge` glyph at `HERO_K = 1.85` — larger than the seat card at
 * `CORE_K = 1.7`, so the flight into reading 02 reads as a subtle dock).
 * The hero is the persistent object's home on this reading now: the same
 * cartridge that flies into the seat, at a slightly greater scale.
 *
 * ⚠ **THE READER SEES AT MOST ONE CARD, and it is the one they will open.**
 * Hover any ledger row and the hero previews it. Click a row and the hero
 * flies. The ledger keeps the ESTATE legible at a glance; the hero keeps
 * the SELECTION legible at reading size. Twenty is still the shape, but
 * nineteen of them are ledger rows now.
 *
 * ⚠ **READINGS 02 AND 03 HAVE THEIR OWN FILES** (`PdaConfiguration`,
 * `PdaCarrier`) — this one keeps the shared `VIEW_BOX` record.
 *
 * ⚠ **`gridRect(i, layout)` IS A COMPAT ALIAS FOR `heroRect(layout)`** —
 * the grid has one home per selection now, so every `i` resolves to the
 * same rect. The existing per-slot iteration in `pda-flight.test.ts` and
 * `pda-card.test.ts` stays green by construction.
 */

/**
 * EACH READING CROPS ITS OWN VIEWBOX (ADR-063 U1), AND EVERY CROP IS ELASTIC
 * (2026-08-12). See `pdaFit` for the mechanism.
 *
 * ⚠ RE-MEASURE AFTER ANY GEOMETRY CHANGE. `tests/lib/pda-viewbox.test.ts`
 * re-checks these bounds against the drawing's declared extents; the smoke
 * measures real glyph boxes against them.
 */

/** The start pose as inline custom properties. `flPdaDock` reads these. */
function dockVars(entry: PdaEntry): React.CSSProperties | undefined {
  if (entry.kind !== "flight") return undefined;
  return {
    "--dx": `${entry.dx}px`,
    "--dy": `${entry.dy}px`,
    "--dk": entry.dk,
  } as React.CSSProperties;
}

/* ── 01 · the work ──────────────────────────────────────────────────────
   Landscape composition: a ledger of 20 workstream rows on the left and one
   large hero cartridge on the right. Twenty is the shape, but it is drawn
   as index + preview rather than as a grid of duplicates.
   ────────────────────────────────────────────────────────────────────── */

/**
 * THE HERO'S SCALE — the cartridge at 1.85 × its base box.
 *
 * ⚠ **STRICTLY LARGER THAN `CORE_K`** so the flight into reading 02 reads
 * as a settling dock rather than a pure translation: `dk = CORE_K / HERO_K
 * = 1.7 / 1.85 ≈ 0.919` — the hero shrinks about 8 % as it lands, which is
 * exactly the "moves and settles into its slot" affordance an interactive
 * preview needs. See `pda-flight.test.ts`: the `dk < 1` guarantee is what
 * the console's rest-shrink test above already asserts.
 */
export const HERO_K = 1.85;

const HERO_W = CARD_BOX.w * HERO_K;
const HERO_H = CARD_BOX.h * HERO_K;

/**
 * THE CROP AT REST — landscape 780 × 636 (aspect 1.226, ≈ 1280×720's own).
 *
 * ⚠ **THE ASPECT IS THE CONTRACT**, and matching it to the binding preset
 * is what pays for the type here (ADR-070 U11's finding, one reading over).
 * `meet` is the minimum of the two ratios, so a landscape crop in a
 * landscape field renders at ~0.77 rather than the near-square crop's 0.62,
 * which is the whole 25 % type lift this pass buys before a font size moves.
 * The rest of the density comes from spending 20 rows on lines instead of
 * cards.
 *
 * ⚠ **CONTENT BLOCK: (16, 22) → (764, 620)** — the ledger and the hero live
 * inside a uniform 16-unit inset. `cropAround` splits any elasticity as
 * margin around the block (the same law reading 02 uses since ADR-070 U14).
 */
const CROP_INSET = 16;
const CONTENT_TOP = 22;

/** THE LEDGER's outer box.
 *
 * ⚠ **INWARD, UP AND BIGGER** (2026-08-28 U2, owner: "the overview of the
 * different skills on the left can be a bit bigger in terms of font size,
 * maybe also a bit inwards, maybe also a bit higher, so it's nicely
 * aligned"). LEDGER_X 16→34 (18 units inboard of the crop wall), LEDGER_Y0
 * 60→48 (12 units up toward the header rule at y=42), LEDGER_H 560→572 (to
 * keep the ledger's bottom at y=620). The taller box raises the derived
 * rowH from ~20 to ~21.3, which lifts the derived title/code/lane sizes
 * automatically — the floor lifts below lock the growth in on every field. */
const LEDGER_X = 34;
const LEDGER_W = 310;
const LEDGER_Y0 = 48;
const LEDGER_H = 572; /* to y=620 */

/** THE HERO's box, centred vertically in the ledger's height.
 *
 * ⚠ **TOWARD CENTRE, WITH ROOM FOR THE ROLODEX STACK** (2026-08-28 U2,
 * owner: "the campaign copy, like cart, should be a bit more to the
 * center. Maybe we can create a stacked effect of other cards behind it").
 * HERO_X used to be right-anchored flush at `780 - CROP_INSET - HERO_W` =
 * 438.4; now 400 leaves ~54 units on the LEFT (space between the ledger's
 * right edge at 344 and the hero) and ~38 units on the RIGHT for two ghost
 * cartridge silhouettes to peek out from behind the hero. See the Rolodex
 * comment below. */
const HERO_X = 400;
const HERO_Y = Math.round(LEDGER_Y0 + LEDGER_H / 2 - HERO_H / 2);

/** THE HEADER STRIP — one line above the ledger, chrome only. */
const HEADER_Y = CONTENT_TOP + 14;

const CROP_W = 780;
const CROP_H = 636;

/**
 * ⚠ THE ELASTICITY GOES INTO CROP MARGINS, not into the block.
 *
 * Reading 02 grows its BUS runs on tall fields (the drawing itself changes
 * shape); reading 01's ledger stays a fixed 20-row stack and the hero stays
 * one card, so the extension is pure air around the block. On a tall panel
 * the drawing sits centred with breathing room above and below rather than
 * anchored to the head with slack collecting under the foot. Width elasticity
 * is trivial: the crop's aspect already matches the widest reference field.
 */
/**
 * ⚠ **`maxH` MUST ABSORB THE FULL PORTRAIT LETTERBOX** — the crop's aspect
 * is landscape (1.226), so at portrait fields the field is height-bound and
 * `meet` shrinks the whole drawing. Growing the crop's height on those
 * fields lets `cropAround` push the extension into margins (the block stays
 * fixed and centered). At 1280×1440 (field 603×1177, aspect w/h = 0.512)
 * the crop wants to reach ~1520 tall to bring the letterbox under
 * `wasStatic × 0.55`. 900 is enough for every reference field the smoke
 * walks (measured), and the resting crop is byte-identical since ext=0.
 */
const WORK_FIT: FitSpec = {
  cropW: CROP_W,
  cropH: CROP_H,
  maxW: 60,
  maxH: 900,
};

export interface WorkLayout {
  block: FlightRect;
  marginX: number;
  marginY: number;
  crop: string;
  ledger: {
    x: number;
    y: number;
    w: number;
    h: number;
    /** Per-row baseline pitch. */
    rowH: number;
    /** District head pitch. Smaller than a row. */
    headH: number;
  };
  hero: FlightRect;
  headerY: number;
}

/**
 * THE READING AT ONE FIELD SHAPE. Pure, so `pda-viewbox` can walk it.
 *
 * ⚠ Elasticity buys ZERO type (see `pdaFit`) — it centres the drawing in the
 * panel and nothing more. What buys the type here is the landscape crop and
 * the composition change from 20 cards to 20 rows + 1 hero.
 */
export function workLayout(ext: FitExt): WorkLayout {
  const block: FlightRect = {
    x: CROP_INSET,
    y: CONTENT_TOP,
    w: CROP_W - CROP_INSET * 2,
    h: CROP_H - CONTENT_TOP - CROP_INSET,
  };
  const box = cropAround(block, WORK_FIT.cropW + ext.extW, WORK_FIT.cropH + ext.extH);
  return {
    block,
    marginX: box.marginX,
    marginY: box.marginY,
    crop: box.crop,
    ledger: {
      x: LEDGER_X,
      y: LEDGER_Y0,
      w: LEDGER_W,
      h: LEDGER_H,
      rowH: 20,
      headH: 24,
    },
    hero: { x: HERO_X, y: HERO_Y, w: HERO_W, h: HERO_H },
    headerY: HEADER_Y,
  };
}

export const workExt = (fieldAspect: number) => fitExt(WORK_FIT, fieldAspect);

/** The reading at rest — what the labs mount and what every guard measures. */
export const WORK_LAYOUT_0 = workLayout({ extW: 0, extH: 0 });

/**
 * THE HERO'S BOX ON A GIVEN LAYOUT — the flight's source (and its
 * destination, for the 2→1 return).
 *
 * ⚠ The hero moves with the layout (elastic margins) but only its ORIGIN
 * translates; its size is invariant (`HERO_W × HERO_H`).
 */
export const heroRect = (layout: WorkLayout): FlightRect => layout.hero;

/**
 * ⚠ **BACKWARD-COMPAT ALIAS FOR THE OLD 4×5 GRID.** The grid is one home
 * per selection since 2026-08-28 — every `i` returns the same hero rect,
 * so the existing test loops in `pda-flight.test.ts` and `pda-card.test.ts`
 * keep asserting the SAME invariant (rect similarity, flight continuity)
 * without editing every call site. Prefer `heroRect(layout)` in new code.
 */
export const gridRect = (_i: number, layout: WorkLayout): FlightRect => heroRect(layout);

/* ── The ledger's arithmetic ────────────────────────────────────────────
   Pure so the render loop is a projection. */

interface LedgerLine {
  kind: "head" | "row";
  y: number;
  work?: PdaWork;
  district?: string;
}

/**
 * Lay out N rows grouped by district. Districts appear in first-seen order.
 * Row and head pitches are DERIVED from the actual line count so the stack
 * always fits its box — the record's district partitioning depends on how
 * many person-led streams `selectWorks` promotes and cannot be pinned at
 * layout time.
 */
function ledgerLines(
  works: readonly PdaWork[],
  layout: WorkLayout
): { lines: LedgerLine[]; rowH: number; headH: number } {
  const groups = new Map<string, PdaWork[]>();
  for (const w of works) {
    const list = groups.get(w.teamName) ?? [];
    list.push(w);
    groups.set(w.teamName, list);
  }

  const nHeads = groups.size;
  const nRows = works.length;
  /* HEAD : ROW pitch is 1.15 : 1 (a district name letters at 9.5 vs the
     row's 11 title). Total pitch units budget = layout.ledger.h. */
  const pitchUnits = nHeads * 1.15 + nRows;
  const rowH = Math.min(24, layout.ledger.h / pitchUnits);
  const headH = rowH * 1.15;

  const lines: LedgerLine[] = [];
  let y = layout.ledger.y;
  for (const [district, list] of groups) {
    lines.push({ kind: "head", y, district });
    y += headH;
    for (const w of list) {
      lines.push({ kind: "row", y, work: w });
      y += rowH;
    }
  }
  return { lines, rowH, headH };
}

/**
 * A cartridge that flies gets a HEAD START. Unchanged from the grid pass —
 * the hero flies while the ledger raster-in staggers, so letting the hero
 * begin ~90ms first keeps the travel readable.
 */
const RASTER_LEAD_MS = 90;

export function ViewWork({
  works,
  totalWorks,
  hover,
  onHover,
  onOpen,
  still,
  selId,
  showSel,
  entry,
  layout,
}: {
  works: readonly PdaWork[];
  /** The registry's total workstream count, for the header's SHOWN / OF. */
  totalWorks: number;
  hover: string | null;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
  still: boolean;
  /** The record the reader has open, if they have opened one. */
  selId: string;
  showSel: boolean;
  entry: PdaEntry;
  /** The reading at this field's shape — the same object the flight measures. */
  layout: WorkLayout;
}) {
  const { lines, rowH, headH } = ledgerLines(works, layout);
  const totalShown = works.length;
  /* The hero previews the hovered row, falling back to the current
     selection. This is the LEDGER + HERO reading's central affordance:
     the reader hovers to preview and clicks to open. */
  const previewId = hover ?? selId;
  const heroWork = works.find((w) => w.id === previewId) ?? works[0];
  if (!heroWork) return null;

  const isHeroSel = showSel && heroWork.id === selId;
  const flies = isHeroSel && entry.kind === "flight";
  const blooms = isHeroSel && entry.kind === "bloom" && !still;
  /* ⚠ **THE ROLL IS THE HERO'S ENTRY ANIMATION SINCE 2026-08-28 U2** (owner:
     "create a stacked effect of other cards behind it… like a carousel, like
     a sort of Rolodex"). The hero's group takes a `key={heroKey}` that
     changes with the previewed work id, so React remounts the group on every
     hover/selection change inside reading 01 and the `fl-pda-roll` animation
     restarts — the card rotates into place from a slight offset, over the
     static ghost silhouettes behind it. During a flight or bloom, `heroKey`
     is pinned so the docked group is not disturbed mid-animation (dock is a
     view-change animation, roll is a same-view content swap — they never
     co-occur and the class list makes that explicit). */
  const heroKey = flies || blooms ? "hero-persistent" : heroWork.id;
  const heroCls = flies
    ? "fl-pda-hit fl-pda-hero fl-pda-dock"
    : blooms
      ? "fl-pda-hit fl-pda-hero fl-pda-bloom"
      : `fl-pda-hit fl-pda-hero${still ? "" : " fl-pda-roll"}`;
  /* THE GHOST STACK — two silhouettes offset behind the hero. Silhouettes
     rather than `Cartridge` instances because a production glyph carries
     three declared strings (id, team code, title) and any reading that
     mounts one inherits them as invisible labels — the same defect
     `Cartridge`'s constant `CARD_BOX` fixed one revision back. Static —
     they do NOT re-mount on preview change, only the hero does. */
  const heroCut = CARD.cut * HERO_K;
  const ghost1 = housing(
    layout.hero.x + 8,
    layout.hero.y + 6,
    layout.hero.w,
    layout.hero.h,
    heroCut
  );
  const ghost2 = housing(
    layout.hero.x + 16,
    layout.hero.y + 12,
    layout.hero.w,
    layout.hero.h,
    heroCut
  );

  return (
    <>
      {/* ── HEADER STRIP ─────────────────────────────────────────────── */}
      <g className="fl-pda-header" aria-hidden="true">
        <text
          x={LEDGER_X}
          y={layout.headerY}
          fontSize={11}
          letterSpacing=".18em"
          fill="var(--pda-txt2)"
        >
          INDEX · STREAMS BY TEAM
        </text>
        <text
          x={LEDGER_X + LEDGER_W}
          y={layout.headerY}
          textAnchor="end"
          fontSize={11}
          letterSpacing=".18em"
          fill="var(--pda-hot)"
        >
          {`${totalShown} / ${totalWorks}`}
        </text>
        {/* The header rule — a hairline the ledger reads against. */}
        <line
          x1={LEDGER_X}
          y1={layout.headerY + 6}
          x2={LEDGER_X + LEDGER_W}
          y2={layout.headerY + 6}
          stroke="var(--pda-hair)"
        />
      </g>

      {/* ── LEDGER ───────────────────────────────────────────────────── */}
      {lines.map((line, i) => {
        if (line.kind === "head") {
          return (
            <g key={`h-${i}`} className="fl-pda-ledger-head" aria-hidden="true">
              {/* ⚠ **`--pda-txt2`, NOT `--pda-txt3`** (2026-08-28 contrast
                 fix). `--pda-txt3` is `rgba(--dawn-rgb, 0.38)` = 2.38:1 in
                 light and fails the 4.5:1 map-palette contrast smoke. `txt2`
                 keeps the district head clearly chrome-subordinate to the
                 stream title beneath it (fs + tracking do the ranking) but
                 stays legible on both grounds. */}
              <text
                x={LEDGER_X}
                y={line.y + headH * 0.72}
                fontSize={Math.max(8, rowH * 0.5)}
                letterSpacing=".22em"
                fill="var(--pda-txt2)"
              >
                {(line.district ?? "").toUpperCase()}
              </text>
            </g>
          );
        }

        const w = line.work!;
        const isSel = showSel && w.id === selId;
        const isHover = hover === w.id;
        const rowFill = isSel
          ? "rgba(240, 200, 106, 0.10)"
          : isHover
            ? "rgba(240, 200, 106, 0.04)"
            : "transparent";
        const rowInk = isSel
          ? "var(--pda-hot)"
          : w.configured
            ? "var(--pda-txt)"
            : "var(--pda-txt2)"; /* person-led stays dim but readable */
        const laneShort = w.configured ? w.lane : "PERSON-LED";
        /* Floors lifted 2026-08-28 U2 (owner: "a bit bigger in terms of font
           size"). The derived sizes already grow with rowH — the FLOORS lock
           the growth in at every reference viewport so the ledger never
           drops back to the previous 7.5/9/7 minimum. */
        const codeFs = Math.max(8.5, rowH * 0.42);
        const titleFs = Math.max(10, rowH * 0.52);
        const laneFs = Math.max(8, rowH * 0.4);

        /* The ledger row is one entry: a diamond, the code, the title, the
           lane tag. Click sets selection and opens (single-click preserves
           the pre-2026-08-28 UX). */
        return (
          <g
            key={w.id}
            className="fl-pda-hit fl-pda-ledger-row"
            role="button"
            tabIndex={0}
            aria-label={`${w.title}, ${w.configured ? `${w.lane} lane` : "person-led"}${
              isSel ? ", open" : ""
            }`}
            onClick={() => onOpen(w.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen(w.id);
              }
            }}
            onMouseEnter={() => onHover(w.id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(w.id)}
            onBlur={() => onHover(null)}
          >
            {/* The row's own hit / paint rect. `transparent` — an unfilled
                rect hit-tests on its stroke alone (Cartridge's own bug one
                pass ago), so a person-led row would swallow its middle. */}
            <rect x={LEDGER_X} y={line.y} width={LEDGER_W} height={rowH} fill={rowFill} />
            {/* The diamond glyph — the mark that says CONFIGURED. Filled
                for configured, open outline for person-led. */}
            <path
              d={dot(LEDGER_X + 6, line.y + rowH / 2, 3)}
              fill={w.configured ? "var(--pda-hot)" : "none"}
              stroke={w.configured ? "none" : "var(--pda-txt3)"}
            />
            {/* Stream code, uppercase mono, left-anchored past the diamond. */}
            <text
              x={LEDGER_X + 18}
              y={line.y + rowH * 0.68}
              fontSize={codeFs}
              letterSpacing=".18em"
              fill="var(--pda-txt2)"
            >
              {w.id}
            </text>
            {/* Title — the record's own name, the largest thing on the row. */}
            <text
              x={LEDGER_X + 62}
              y={line.y + rowH * 0.68}
              fontSize={titleFs}
              letterSpacing=".02em"
              fill={rowInk}
              fontWeight={isSel ? 700 : 400}
            >
              {truncate(w.title, 22)}
            </text>
            {/* Lane, right-anchored, tracked wide as chrome. */}
            <text
              x={LEDGER_X + LEDGER_W - 4}
              y={line.y + rowH * 0.68}
              textAnchor="end"
              fontSize={laneFs}
              letterSpacing=".2em"
              fill="var(--pda-txt2)"
            >
              {laneShort}
            </text>
            {/* Selection underline — one hairline in gold at the row's base. */}
            {isSel ? (
              <line
                x1={LEDGER_X + 16}
                y1={line.y + rowH - 1}
                x2={LEDGER_X + LEDGER_W - 4}
                y2={line.y + rowH - 1}
                stroke="var(--pda-hot)"
                strokeWidth={1}
              />
            ) : null}
            {/* Selection caret pointing into the hero. */}
            {isSel ? (
              <path
                d={`M${LEDGER_X + LEDGER_W + 2},${line.y + rowH / 2 - 3} L${LEDGER_X + LEDGER_W + 8},${line.y + rowH / 2} L${LEDGER_X + LEDGER_W + 2},${line.y + rowH / 2 + 3} Z`}
                fill="var(--pda-hot)"
              />
            ) : null}
          </g>
        );
      })}

      {/* ── ROLODEX GHOSTS ─────────────────────────────────────────────
          Two silhouette outlines offset behind the hero — the "stack" the
          Rolodex composition needs. Rendered as SIBLINGS of the hero AND
          BEFORE IT in DOM order so the hero paints ON TOP (SVG z is
          document-order). They are declaratively hidden from AT via
          aria-hidden and pointer-inert; they inherit the group's `fl-pda-in`
          on first mount and stay put on subsequent preview changes (only
          the hero re-mounts on key change).
          ⚠ NEVER children of the hero group. `.fl-pda-dock` and `.fl-pda-
          bloom` use `transform-box: fill-box` with a centred origin, and
          any child extending outside the hero's path box would move the
          flight's measured origin — a bug the `Cartridge`'s own pad fringe
          already sits SIBLING for (pda.css line 280+). */}
      {still ? null : (
        <g className="fl-pda-rolodex" aria-hidden="true" pointerEvents="none">
          <path
            d={ghost2}
            fill="rgba(var(--dawn-rgb), 0.02)"
            stroke="var(--pda-txt3)"
            strokeWidth={0.6}
            opacity={0.5}
          />
          <path
            d={ghost1}
            fill="rgba(var(--dawn-rgb), 0.03)"
            stroke="var(--pda-txt3)"
            strokeWidth={0.75}
            opacity={0.7}
          />
        </g>
      )}

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      {/* The hero is a Cartridge at HERO_K, positioned in its layout box.
          When it flies (kind==='flight' on the SELECTED work), the group
          takes the dock class and reads --dx/--dy/--dk from its own style.
          When the reader is hovering a different row than the current
          selection, the hero shows the HOVER content but does NOT fly
          (the flight is bound to the selected id).
          ⚠ **`key={heroKey}` UNMOUNTS AND REMOUNTS ON PREVIEW CHANGE** so
          the `fl-pda-roll` animation restarts. During a flight/bloom the
          key is pinned so the docked group holds its animation. */}
      <g
        key={heroKey}
        className={heroCls}
        style={
          flies
            ? dockVars(entry)
            : still || blooms
              ? undefined
              : { animationDelay: `${entry.kind === "flight" ? RASTER_LEAD_MS : 0}ms` }
        }
        aria-hidden="true"
      >
        <Cartridge
          x={layout.hero.x}
          y={layout.hero.y}
          w={layout.hero.w}
          h={layout.hero.h}
          state={isHeroSel ? "cfg" : heroWork.configured ? "cfg" : "led"}
          work={heroWork}
          k={HERO_K}
          sel={isHeroSel}
        />
      </g>

      {/* ── OPEN CTA — the gold-tick affordance under the hero ──────── */}
      {isHeroSel ? null : (
        <g className="fl-pda-cta" aria-hidden="true">
          <text
            x={layout.hero.x + layout.hero.w}
            y={layout.hero.y + layout.hero.h + 22}
            textAnchor="end"
            fontSize={10}
            letterSpacing=".24em"
            fill="var(--pda-hot)"
          >
            CLICK TO OPEN CONFIGURATION →
          </text>
        </g>
      )}
    </>
  );
}

/* ── Small primitives ─────────────────────────────────────────────────── */

function dot(cx: number, cy: number, r: number): string {
  return `M${cx - r},${cy} L${cx},${cy - r} L${cx + r},${cy} L${cx},${cy + r} Z`;
}

function truncate(text: string, per: number): string {
  return text.length <= per ? text : `${text.slice(0, per - 1)}…`;
}

/**
 * THE CROPS AT REST — one per reading. Production renders none of them
 * unchanged; the labs mount them.
 */
export const VIEW_BOX: Record<1 | 2 | 3, string> = {
  1: WORK_LAYOUT_0.crop,
  2: CONFIG_VIEWBOX,
  3: CARRIER_VIEWBOX,
};
