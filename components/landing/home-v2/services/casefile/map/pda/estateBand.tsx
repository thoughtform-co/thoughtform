"use client";

import type { FlightRect } from "./pdaFlight";
import type { PdaWork } from "./pdaRecord";
import type { CaseMapShapeKey } from "@/lib/cases/types";

/**
 * THE ESTATE BAND — twenty ghost cartridge footprints across the top of
 * reading 03, and the third home of the flying object.
 *
 * ⚠ **THE CARTRIDGE SILHOUETTE IS LAWFUL HERE, AND ONLY HERE ON THIS
 * READING** (owner, 2026-08-17). Reading 04 in earlier rounds tried to draw
 * the substrate patterns AS cartridges — bays, backplanes, cutaways — and
 * the owner ruled every one out with the same reason: the cartridge outline
 * means WORKSTREAM everywhere else on this console (reading 01 is twenty of
 * them, reading 02 seats one at its centre), so a substrate drawn in it
 * claimed to be a workstream. This band puts the silhouette back only in
 * the row that IS work; the strata below are drawn as bars with square
 * corners, which they were before U24 amended the outer chamfer away.
 *
 * ## Three homes for one object (ADR-069 → U2)
 *
 * The selected work is the persistent object on this instrument: reading 01
 * draws it as a full cartridge in the grid, reading 02 as the seat card at
 * `CORE_K`, and reading 03 as its footprint here. So the flight has a home
 * on EVERY reading pair now, not just 01 ↔ 02 — see `PdaConsole.entryFor`.
 *
 * ## What it letters
 *
 * ⚠ **NOTHING AT REST.** Twenty footprints at 40u wide cannot letter a
 * legible title — 6 chars × 12 × 0.68 = 49u fits _"W-017"_ at fs 12, but
 * the smoke's minPx would then land at 7.8px which is the surface's own
 * floor for CHROME, not for content. So the band says _"the estate has
 * twenty in it"_ as silhouettes, and lets the reader open a stream to
 * light one.
 *
 * When the reader has a stream open the SELECTED footprint takes the
 * lit-edge grammar — the same TR+BL diagonals `Cartridge`'s `sel` lights —
 * plus a gold wash. Configured streams draw a hairline outline; person-led
 * streams draw a DASHED outline, so the reader can tell at a glance that a
 * team's row includes work not bound to a Skill.
 *
 * ## Geometry
 *
 * ⚠ **CLUSTER GAPS DERIVE THE PITCH, NOT THE OTHER WAY ROUND** (the round-
 * nine lesson): a fixed pitch plus cluster gaps overruns the band's own
 * wall, so the pitch fills `W − totalGap` across `n` cells. The result is
 * a row that starts flush left, ends flush right, and drops a 2-unit comma
 * whenever the team code changes — 8 districts on the current record give
 * seven commas × 2u = 14u distributed through the row.
 */

/* ── The width chain — one row, twenty cells, tight pitch ───────────────── */
/** The band's own vertical block. */
export const ESTATE_BAND_H = 30;
export const ESTATE_CELL_W = 40;
export const ESTATE_CELL_H = 30;
/** The corner cut, proportional to the shipped cartridge's 14/176 ≈ 0.08. */
export const ESTATE_CUT = 4;
/** A tiny air gap when the team code changes — a comma between clusters. */
export const CLUSTER_GAP = 2;

/** A cartridge silhouette in the band's own space. Same TR+BL diagonal as
 *  the real cartridge, at the footprint's proportion. */
const footprintPath = (x: number, y: number, w: number, h: number) =>
  `M${x},${y} H${x + w - ESTATE_CUT} L${x + w},${y + ESTATE_CUT} V${y + h} H${x + ESTATE_CUT} L${x},${y + h - ESTATE_CUT} Z`;

export interface EstateSlot {
  id: string;
  team: string;
  x: number;
  y: number;
  w: number;
  h: number;
  configured: boolean;
}

/** Where each footprint sits, indexed by `works` position. Pure so the
 *  flight arithmetic and the fit guard measure the same rectangles. */
export function estateSlots(
  works: readonly PdaWork[],
  y0: number,
  bandLeft: number,
  bandWidth: number
): EstateSlot[] {
  if (works.length === 0) return [];
  const changes = countClusterChanges(works);
  const totalGap = changes * CLUSTER_GAP;
  const pitch = (bandWidth - totalGap) / works.length;

  let x = bandLeft;
  let last: string | null = null;
  return works.map((w) => {
    if (last !== null && w.team !== last) x += CLUSTER_GAP;
    last = w.team;
    /* The cartridge centres inside its pitch — pitch is the ROOM the slot
       owns, the footprint itself is fixed-width. A wider pitch reads as a
       comma, not a wider card. */
    const cellX = x + (pitch - ESTATE_CELL_W) / 2;
    const slot: EstateSlot = {
      id: w.id,
      team: w.team,
      x: cellX,
      y: y0,
      w: ESTATE_CELL_W,
      h: ESTATE_CELL_H,
      configured: w.configured,
    };
    x += pitch;
    return slot;
  });
}

function countClusterChanges(works: readonly PdaWork[]): number {
  let n = 0;
  let last: string | null = null;
  for (const w of works) {
    if (last !== null && w.team !== last) n += 1;
    last = w.team;
  }
  return n;
}

/**
 * The selected work's footprint rect, or `null` when nothing is open — what
 * the flight uses as its third home. `pda-flight` measures the same rect
 * this function computes, so a slot moved by a cluster comma cannot leave
 * the flight landing on empty space.
 */
export function estateFootprint(
  works: readonly PdaWork[],
  selectedId: string | null,
  y0: number,
  bandLeft: number,
  bandWidth: number
): FlightRect | null {
  if (!selectedId) return null;
  const slot = estateSlots(works, y0, bandLeft, bandWidth).find((s) => s.id === selectedId);
  return slot ? { x: slot.x, y: slot.y, w: slot.w, h: slot.h } : null;
}

/* ── The band itself ────────────────────────────────────────────────────── */

/**
 * The band, with a single selected footprint carrying the lit grammar. The
 * `onHover` and `onOpen` callbacks let the estate band OPEN a stream on
 * click — closing the flight's loop by letting the reader jump from the
 * substrate back into a different configuration without leaving reading 03.
 *
 * ⚠ CLICKING THE FOOTPRINT OPENS THE STREAM, not the substrate. This is
 * the third home of ADR-069's flying object: on the click the reading
 * switches to 02, and the seat card FLIES from the footprint's position.
 * See `PdaConsole.open`.
 */
export function EstateBand({
  works,
  y0,
  bandLeft,
  bandWidth,
  selectedId,
  onOpen,
  onHover,
  hover,
  still,
}: {
  works: readonly PdaWork[];
  y0: number;
  bandLeft: number;
  bandWidth: number;
  selectedId: string | null;
  /** Called when the reader activates a footprint — reading 02 opens. */
  onOpen?: (id: string) => void;
  /** Called on hover in / hover out for the reader to see which stream is
   *  under the pointer without opening it. */
  onHover?: (id: string | null) => void;
  hover?: string | null;
  /** True in labs and in the still-arrived state; drops the arrival class. */
  still?: boolean;
}) {
  const slots = estateSlots(works, y0, bandLeft, bandWidth);
  return (
    <g aria-label="Estate footprints">
      {slots.map((s, i) => {
        const isSel = selectedId === s.id;
        const isHot = hover === s.id;
        const d = footprintPath(s.x, s.y, s.w, s.h);
        const stroke =
          isSel || isHot ? "var(--pda-hot)" : s.configured ? "var(--pda-hair2)" : "var(--pda-hair)";
        const fill = isSel
          ? "rgba(240, 200, 106, 0.14)"
          : s.configured
            ? "rgba(var(--dawn-rgb), 0.04)"
            : "none";
        const cls = still ? "fl-pda-hit" : `fl-pda-hit fl-pda-in`;

        return (
          <g
            key={s.id}
            className={cls}
            style={still ? undefined : { animationDelay: `${i * 12}ms` }}
            role={onOpen ? "button" : undefined}
            tabIndex={onOpen ? 0 : undefined}
            aria-label={`${s.id}${s.configured ? "" : ", person-led"}`}
            onClick={onOpen ? () => onOpen(s.id) : undefined}
            onKeyDown={
              onOpen
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpen(s.id);
                    }
                  }
                : undefined
            }
            onMouseEnter={onHover ? () => onHover(s.id) : undefined}
            onMouseLeave={onHover ? () => onHover(null) : undefined}
          >
            {/* The hit area — a solid transparent rect, so a person-led
                footprint's `fill: none` outline still clicks in the middle
                (the same lesson `Cartridge` learned in ADR-062). */}
            <rect x={s.x} y={s.y} width={s.w} height={s.h} fill="transparent" />
            <path d={d} fill={fill} />
            <path
              d={d}
              fill="none"
              stroke={stroke}
              strokeDasharray={s.configured ? undefined : "3 3"}
            />
            {isSel ? (
              /* THE LIT EDGES — the cartridge's own selection grammar
                 scaled to the footprint. Both diagonals light because the
                 silhouette is symmetric under this diagonal pair (the
                 harmonisation's own argument). */
              <g stroke="var(--pda-hot)" strokeWidth={1.2}>
                <line x1={s.x + s.w - ESTATE_CUT} y1={s.y} x2={s.x + s.w} y2={s.y + ESTATE_CUT} />
                <line x1={s.x + ESTATE_CUT} y1={s.y + s.h} x2={s.x} y2={s.y + s.h - ESTATE_CUT} />
              </g>
            ) : null}
          </g>
        );
      })}
    </g>
  );
}

/* ── The gallery band — a manifold with five lane markers ───────────────── */

export const GALLERY_H = 20;

/**
 * ⚠ **THE FIVE LANES ARE ORDERED TO MATCH `SECTION_ORDER`** — so a
 * conductor from a footprint to its tapped stratum does not have to cross
 * the gallery. That is a hard constraint of the section drawing and it is
 * asserted by `pda-substrate-fit`; changing the order here without changing
 * the strata will produce visibly crossed conductors.
 */
export const GALLERY_LANES: readonly CaseMapShapeKey[] = [
  "stakeholder",
  "voice",
  "validation",
  "judgment",
  "pattern",
];

/** A shape's own lane x-position inside the gallery band. Same math as
 *  the shaft below, so the two align vertically. */
export function laneX(shape: CaseMapShapeKey, bandLeft: number, bandWidth: number): number {
  const i = GALLERY_LANES.indexOf(shape);
  if (i < 0) return bandLeft + bandWidth / 2;
  const inner = bandWidth - 80;
  const pitch = inner / (GALLERY_LANES.length - 1);
  return bandLeft + 40 + i * pitch;
}

export function GalleryBand({
  y0,
  bandLeft,
  bandWidth,
}: {
  y0: number;
  bandLeft: number;
  bandWidth: number;
}) {
  const cy = y0 + GALLERY_H / 2;
  return (
    <g aria-hidden="true">
      <rect
        x={bandLeft}
        y={y0}
        width={bandWidth}
        height={GALLERY_H}
        fill="rgba(var(--dawn-rgb), 0.03)"
      />
      <line x1={bandLeft} y1={cy} x2={bandLeft + bandWidth} y2={cy} stroke="var(--pda-hair2)" />
      {GALLERY_LANES.map((k) => {
        const x = laneX(k, bandLeft, bandWidth);
        return (
          <rect
            key={k}
            x={x - 3}
            y={cy - 3}
            width={6}
            height={6}
            transform={`rotate(45 ${x} ${cy})`}
            fill="var(--pda-amb)"
            fillOpacity={0.6}
          />
        );
      })}
    </g>
  );
}

/** The block height contributed by the estate band + gallery band + two
 *  small gaps. This is what the strata block subtracts from the plate's
 *  own height. */
export const BAND_GAP = 6;
export const ESTATE_BLOCK_H = ESTATE_BAND_H + BAND_GAP + GALLERY_H + BAND_GAP;

/** Where the estate band starts, given the drawing's own top pad. */
export const estateBandY = (padTop: number): number => padTop;
export const galleryBandY = (padTop: number): number => padTop + ESTATE_BAND_H + BAND_GAP;
