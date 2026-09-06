"use client";

import { useCallback, useMemo, useState } from "react";

import type { CaseMapShapeKey, CaseSkillEntry } from "@/lib/cases/types";

import type { PdaEntry } from "./PdaEntry";
import { CORE_K, Cartridge } from "./pdaGlyphs";
import type { PdaShape, PdaWork } from "./pdaRecord";
import { MODULE, band, housing } from "./substrateKit";

/**
 * 03 · THE SUBSTRATE — the BACKPLANE (2026-08-28, owner: "the substrate is
 * sort of like a pie chart with different things. It feels inconsistent
 * with the rest").
 *
 * ⚠ **THIS REPLACES `PdaCarrier`'s DODECAGONAL CARRIER WHEN
 * `MAP_BACKPLANE` IS SET.** The carrier is a beautiful drawing but a
 * radial one, and reading 02 is a rectilinear PCB — so the two readings
 * spoke different languages. This reading answers the same question in
 * reading 02's grammar: five substrate BAYS around a central card,
 * ribbons where the selected work TAPS a bay, representative skill
 * plates inside each bay. The claim is the round-nine ruling ADR-070 U25
 * settled on for lab direction 12: continuous with reading 02 (same
 * card, same silhouette, same ribbon language), swapping the content
 * without inventing a new visual vocabulary.
 *
 * ⚠ **THE ADR-071 SKILL-CHIP MORPH IS DEFERRED WHILE THIS DRAWING IS ON
 * TRIAL** — the carrier had a specific plate-to-arc morph that lettered
 * a Skill name at the destination cell's arc; the Backplane has no arc
 * so the morph reduces to a rectangle-to-plate translation. Rather than
 * partially wire it, this pass leaves `skillEntry` unread and lets the
 * bay's own hairline lighting carry the "this is what runs the stream"
 * signal. Once the owner approves the direction the morph gets a proper
 * bay-plate landing, which is a straightforward `pdaFlight` call — see
 * §follow-up in the ADR update.
 *
 * ⚠ **`ViewCarrier`'s SIGNATURE IS PRESERVED** so `PdaConsole` can
 * conditionally render either drawing without threading a different
 * prop set through its render tree.
 */

/* ── R4 GEOMETRY, PORTED FROM `configLayout(0)` ─────────────────────────
   These rectangles are the reading-02 board at rest, offset into a
   BACKPLANE_VIEWBOX matching reading 02's own crop width. Same numbers
   on both readings is the whole point — a reader who has seen 02's
   modules recognises this drawing as the same instrument's supply side.
   ────────────────────────────────────────────────────────────────────── */

export const BACKPLANE_VIEWBOX = "0 0 932 762";

const OWNER = { x: 232, y: 20, w: 424, h: 108 } as const;
const SAT = { w: 204, h: 218 } as const;
const LEFT = { x: 4, y: 192, w: SAT.w, h: SAT.h } as const;
const RIGHT = { x: 680, y: 192, w: SAT.w, h: SAT.h } as const;

/** R4's BASE is 400 wide starting at x=244. Split into two bays with a
 *  10-unit gutter so the two halves letter independently. */
const BASE_Y = 532;
const BASE_H = 128;
const BASE_GUTTER = 10;
const BASE_L = { x: 244, y: BASE_Y, w: (400 - BASE_GUTTER) / 2, h: BASE_H } as const;
const BASE_R = { x: 244 + BASE_L.w + BASE_GUTTER, y: BASE_Y, w: BASE_L.w, h: BASE_H } as const;

/** The card, at the R4 core position. Reading 02's own core rect. */
const CORE_W = 176 * CORE_K;
const CORE_H = 136 * CORE_K;
const CORE_CX = 444;
const CORE_CY = 300;
const CORE_X = CORE_CX - CORE_W / 2;
const CORE_Y = CORE_CY - CORE_H / 2;

/**
 * BAY ORDER — five bays around the card, in the map's shape order
 * (VOICE · JUDGMENT · VALIDATION · STAKEHOLDER · PATTERN by convention).
 *
 * ⚠ **THE MAPPING IS INDEX-BASED, matching `MAP_SHAPES` in the record.**
 * `PdaShape.key` at index N gets bay N. If the record ever re-orders its
 * shapes the drawing follows deterministically.
 */
type Bay = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };
const BAYS: readonly Bay[] = [OWNER, LEFT, RIGHT, BASE_L, BASE_R];

/* ── PLATE GRAMMAR (mirrors ADR-070 U16 accent-slab) ──────────────────── */
const ACCENT_W = 3;
const LABEL_GAP = 6;
const PLATE_H = 20;
const PLATE_GAP = 3;
const PLATE_PITCH = PLATE_H + PLATE_GAP;
const PLATES_PER_BAY = 3;
const STACK_TOP_GAP = 8;

/* ── REPRESENTATIVE PICKER ──────────────────────────────────────────────
   The reader does not need all 47 plates — that is the shipped carrier.
   Show the first N skills per shape (the record's order is authored, so
   this is a stable pick). Everything else counts as `+N MORE`. Pure so a
   guard could walk the same picks. */
function representatives(
  shape: PdaShape,
  skills: readonly CaseSkillEntry[]
): { picks: readonly CaseSkillEntry[]; more: number } {
  /* ⚠ Skills join on `engine` (case-insensitive against the shape's `name`,
     e.g. "Pattern"), NOT on the shape's `key`. `CaseSkillEntry` was authored
     with `engine` as the shape's own display name (types.ts:164). */
  const inShape = skills.filter((s) => s.engine.toLowerCase() === shape.name.toLowerCase());
  /* Flagship (the first encode) always leads — it takes the green accent. */
  const flagship = inShape.find((s) => s.flagship);
  const rest = inShape.filter((s) => s !== flagship);
  const picks = flagship
    ? [flagship, ...rest].slice(0, PLATES_PER_BAY)
    : rest.slice(0, PLATES_PER_BAY);
  const more = Math.max(0, inShape.length - picks.length);
  return { picks, more };
}

/* ── RIBBON HELPERS ─────────────────────────────────────────────────────
   A simple L-jog between the card edge and the bay edge — the R4 board's
   own ribbon grammar, single-line variant (the full hatched ribbon is
   heavy for five simultaneous runs). */
function cardAnchor(bay: Bay): { x: number; y: number } {
  const bx = bay.x + bay.w / 2;
  const by = bay.y + bay.h / 2;
  const dx = bx - CORE_CX;
  const dy = by - CORE_CY;
  const ratio = Math.abs(dx) / (CORE_W / 2) - Math.abs(dy) / (CORE_H / 2);
  if (ratio > 0) return { x: dx > 0 ? CORE_X + CORE_W : CORE_X, y: CORE_CY };
  return { x: CORE_CX, y: dy > 0 ? CORE_Y + CORE_H : CORE_Y };
}

function bayAnchor(bay: Bay): { x: number; y: number } {
  const bx = bay.x + bay.w / 2;
  const by = bay.y + bay.h / 2;
  const dx = CORE_CX - bx;
  const dy = CORE_CY - by;
  const ratio = Math.abs(dx) / (bay.w / 2) - Math.abs(dy) / (bay.h / 2);
  if (ratio > 0) return { x: dx > 0 ? bay.x + bay.w : bay.x, y: by };
  return { x: bx, y: dy > 0 ? bay.y + bay.h : bay.y };
}

function ribbonBetween(from: { x: number; y: number }, to: { x: number; y: number }): string {
  if (Math.abs(from.x - to.x) < 0.5 || Math.abs(from.y - to.y) < 0.5) {
    return `M${from.x} ${from.y} L${to.x} ${to.y}`;
  }
  return `M${from.x} ${from.y} L${to.x} ${from.y} L${to.x} ${to.y}`;
}

/* ── THE VIEW ─────────────────────────────────────────────────────────── */

export interface ViewBackplaneProps {
  shapes: readonly PdaShape[];
  skills: readonly CaseSkillEntry[];
  selected: PdaWork | null;
  still: boolean;
  entry: PdaEntry;
  /** ADR-071's skill chip flight. Read but not animated on this drawing —
   *  see the header comment. */
  skillEntry?: PdaEntry | null;
  onLit?: (key: string | null) => void;
}

export function ViewBackplane({
  shapes,
  skills,
  selected,
  still: _still,
  entry: _entry,
  skillEntry: _skillEntry,
  onLit,
}: ViewBackplaneProps) {
  const [hotBay, setHotBay] = useState<CaseMapShapeKey | null>(null);
  const setHot = useCallback(
    (key: CaseMapShapeKey | null) => {
      setHotBay(key);
      onLit?.(key);
    },
    [onLit]
  );

  const bayList = useMemo(
    () =>
      shapes.map((shape, i) => {
        const bay = BAYS[i];
        if (!bay) return null;
        const tapped = selected ? selected.taps.includes(shape.key) : false;
        const { picks, more } = representatives(shape, skills);
        return { shape, bay, tapped, picks, more };
      }),
    [shapes, skills, selected]
  );

  return (
    <>
      {/* ── RIBBONS FIRST, so the bays overpaint their endpoints ────── */}
      {bayList.map((b) => {
        if (!b) return null;
        if (!b.tapped) return null;
        const from = cardAnchor(b.bay);
        const to = bayAnchor(b.bay);
        return (
          <path
            key={`rib-${b.shape.key}`}
            d={ribbonBetween(from, to)}
            fill="none"
            stroke="var(--pda-amb)"
            strokeOpacity={0.72}
            strokeWidth={2}
          />
        );
      })}

      {/* Dim ribbons for untapped bays — the estate is present but quiet. */}
      {bayList.map((b) => {
        if (!b) return null;
        if (b.tapped) return null;
        const from = cardAnchor(b.bay);
        const to = bayAnchor(b.bay);
        return (
          <path
            key={`rib-dim-${b.shape.key}`}
            d={ribbonBetween(from, to)}
            fill="none"
            stroke="var(--pda-dim)"
            strokeOpacity={0.28}
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        );
      })}

      {/* ── BAYS ─────────────────────────────────────────────────────── */}
      {bayList.map((b) => {
        if (!b) return null;
        return (
          <BayGroup
            key={b.shape.key}
            bay={b.bay}
            shape={b.shape}
            tapped={b.tapped}
            hot={hotBay === b.shape.key}
            picks={b.picks}
            more={b.more}
            onHover={setHot}
          />
        );
      })}

      {/* ── THE CARD ─────────────────────────────────────────────────── */}
      {selected ? (
        <g>
          <Cartridge
            x={CORE_X}
            y={CORE_Y}
            w={CORE_W}
            h={CORE_H}
            k={CORE_K}
            work={selected}
            state={selected.configured ? "cfg" : "led"}
            sel
          />
        </g>
      ) : (
        <path
          d={housing(CORE_X, CORE_Y, CORE_W, CORE_H, 14 * CORE_K)}
          fill="var(--pda-void)"
          stroke="var(--pda-hair2)"
          strokeDasharray="5 4"
        />
      )}
    </>
  );
}

/* ── ONE BAY ──────────────────────────────────────────────────────────── */

function BayGroup({
  bay,
  shape,
  tapped,
  hot,
  picks,
  more,
  onHover,
}: {
  bay: Bay;
  shape: PdaShape;
  tapped: boolean;
  hot: boolean;
  picks: readonly CaseSkillEntry[];
  more: number;
  onHover: (key: CaseMapShapeKey | null) => void;
}) {
  const d = housing(bay.x, bay.y, bay.w, bay.h, MODULE.cut);
  const bandD = band(bay.x, bay.y, bay.w, MODULE.head, MODULE.cut);
  const stackTop = bay.y + MODULE.head + STACK_TOP_GAP;
  const bodyX = bay.x + MODULE.pad;
  const innerW = bay.w - MODULE.pad * 2;
  const strokeInk = tapped ? "var(--pda-hair2)" : hot ? "var(--pda-hair2)" : "var(--pda-hair)";
  const nameFill = tapped || hot ? "var(--pda-txt)" : "var(--pda-txt2)";
  /* ⚠ **`--pda-txt2`, NOT `--pda-txt3`** — `txt3` is `rgba(--dawn-rgb, 0.38)`
     which measures 2.38:1 in light against the console ground and fails the
     4.5:1 map-palette contrast smoke (ADR-063 U2). The count is still chrome-
     subordinate to the shape name; alpha/size/tracking already rank it. */
  const countFill = tapped ? "var(--pda-hot)" : "var(--pda-txt2)";

  return (
    <g
      data-bay={shape.key}
      data-tapped={tapped ? "" : undefined}
      onMouseEnter={() => onHover(shape.key)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Housing: opaque + wash + hairline — R4's density rule. */}
      <path d={d} fill="var(--pda-void)" />
      <path d={d} fill={tapped ? "rgba(var(--dawn-rgb), 0.05)" : "rgba(var(--dawn-rgb), 0.02)"} />
      <path d={d} fill="none" stroke={strokeInk} strokeDasharray={tapped ? undefined : "5 3"} />
      {/* Header band with a 2px top rule (R4's bright rule). */}
      <path
        d={bandD}
        fill={tapped ? "rgba(var(--dawn-rgb), 0.07)" : "rgba(var(--dawn-rgb), 0.03)"}
      />
      <line
        x1={bay.x}
        y1={bay.y + 1}
        x2={bay.x + bay.w - MODULE.cut}
        y2={bay.y + 1}
        stroke={strokeInk}
        strokeWidth={2}
      />
      <line
        x1={bay.x}
        y1={bay.y + MODULE.head}
        x2={bay.x + bay.w}
        y2={bay.y + MODULE.head}
        stroke="var(--pda-hair)"
      />
      {/* Shape name (left) + skill count (right), on one baseline. */}
      <text x={bodyX} y={bay.y + 24} fontSize={13} letterSpacing=".14em" fill={nameFill}>
        {shape.name}
      </text>
      <text
        x={bay.x + bay.w - MODULE.pad}
        y={bay.y + 24}
        textAnchor="end"
        fontSize={12}
        letterSpacing=".14em"
        fill={countFill}
      >
        {String(shape.skills).padStart(2, "0")}
      </text>

      {/* Representative skill plates. Green accent on the flagship (first). */}
      {picks.map((skill, k) => {
        const py = stackTop + k * PLATE_PITCH;
        if (py + PLATE_H > bay.y + bay.h - 18) return null; /* Would not fit */
        const first = k === 0;
        return (
          <g key={skill.id}>
            <rect
              x={bodyX}
              y={py}
              width={innerW}
              height={PLATE_H}
              fill={tapped ? "rgba(var(--dawn-rgb), 0.06)" : "rgba(var(--dawn-rgb), 0.025)"}
            />
            <rect
              x={bodyX}
              y={py}
              width={ACCENT_W}
              height={PLATE_H}
              fill={first ? "var(--pda-grn)" : "var(--pda-amb)"}
              fillOpacity={tapped ? (first ? 1 : 0.7) : first ? 0.55 : 0.32}
            />
            <text
              x={bodyX + ACCENT_W + LABEL_GAP}
              y={py + PLATE_H - 6}
              fontSize={11}
              letterSpacing=".06em"
              fill={tapped ? "var(--pda-txt)" : "var(--pda-txt2)"}
            >
              {skill.short.toUpperCase()}
            </text>
            {/* ⚠ **NO ENGINE TAG.** Every plate inside a bay named VOICE
               belongs to VOICE by construction — the tag would repeat the
               bay's own head next to itself, and in light mode `--pda-txt3`
               plus that repetition failed the 4.5:1 contrast walk in the
               map palette smoke (2026-08-28 design pass). Deleted for
               clarity AND for contrast, in that order. */}
          </g>
        );
      })}

      {/* + N MORE — the honest remainder. `--pda-txt2` for the same
         contrast reason as `countFill` above. */}
      {more > 0 ? (
        <text
          x={bodyX}
          y={bay.y + bay.h - 9}
          fontSize={10}
          letterSpacing=".14em"
          fill={tapped ? "var(--pda-hot)" : "var(--pda-txt2)"}
        >
          {`+${more} MORE`}
        </text>
      ) : null}
    </g>
  );
}
