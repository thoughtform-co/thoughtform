/**
 * Layout for the voidwalker time tunnel's LONGITUDINAL RAILS (ADR-081 U5).
 *
 * ⚠ THREE-FREE, and that is load-bearing (`landing-performance` doctrine
 * and the same rule `voidwalkerFlightConfig` carries). This returns plain
 * arrays; `VoidwalkerTimeTunnel` wraps them in buffer attributes. A
 * `three` import here would drag the WebGL stack into the landing's
 * First Load JS.
 *
 * ── Why the rails exist ──────────────────────────────────────────────
 *
 * The tunnel's dot shell twists every ring by `r * 0.19` specifically so
 * consecutive rings do NOT line up into stripes — the right call for the
 * dots (aligned rings read as a cage) and the reason the tunnel had
 * volume but no DIRECTION: at rest it was concentric ovals, which is a
 * target painted on a wall, not a bore. Volume and direction are two
 * jobs and they get two layers. The grammar is `LatentWormholeWalls`'
 * from the corridor next door, whose own note is the argument: rails
 * converging toward the optical axis are "the single strongest cue that
 * the user is flying through a tunnel and not past a flat picture".
 *
 * ── The wrap contract ────────────────────────────────────────────────
 *
 * ⚠ A DASH IS ONE RIGID SEGMENT AND BOTH ENDS MUST WRAP TOGETHER. The
 * shader wraps camera-relative (`mod(uCamZ - z, span)`) so the tunnel is
 * infinite. Wrapping each VERTEX on its own z lets the modulo boundary
 * fall between the two ends of one dash per rail per cycle, and that
 * dash then stretches the entire length of the tunnel — once per wrap,
 * forever. So a dash carries its start as `anchor` (the value that
 * wraps) and its extent as `offset` (applied after), and every dash must
 * lie fully inside its own slot. `railDashesFitSlots` is the guard.
 */

/** Dashes per rail across one wrap span. Broken rather than continuous
 *  so a rail reads as travelled distance rather than a drawn wire, and
 *  so the near end never becomes one long smear. */
export const RAIL_DASHES = 34;

/** Fraction of each dash slot that is ink. The remainder is the gap.
 *  ⚠ MUST STAY BELOW 1 — at 1 a dash exactly touches the next slot and
 *  the rail is continuous again; above 1 it straddles the wrap. */
export const RAIL_DASH_DUTY = 0.44;

/** Every Nth rail stops short of the full span so the shell never closes
 *  into a cage — the worry the dot walls' per-ring twist was answering,
 *  addressed here without giving up the alignment that makes a rail a
 *  rail. */
export const RAIL_PARTIAL_EVERY = 3;
export const RAIL_PARTIAL_FRAC = 0.55;

export interface VwRailLayout {
  /** Flat xyz triples, two per dash. Z is always 0 — the shader derives
   *  it from `anchor` + `offset` so both ends wrap as one. */
  positions: number[];
  /** The wrapping z of each vertex's dash. Equal for both ends. */
  anchors: number[];
  /** Axial extent from the anchor: 0 for the start vertex, negative for
   *  the end. */
  offsets: number[];
  /** Per-rail brightness, repeated per vertex. */
  ranks: number[];
  /** Dash count per rail, in rail order. */
  dashesPerRail: number[];
}

/**
 * Build the rail layout for a shell of the given radii and wrap span.
 *
 * Deterministic — no `Math.random`, so the tunnel is byte-identical
 * across reloads and captures (the same contract the dot shell's own
 * `aRank` carries).
 */
export function buildVoidwalkerRailLayout(
  railCount: number,
  span: number,
  shellRx: number,
  shellRy: number
): VwRailLayout {
  const positions: number[] = [];
  const anchors: number[] = [];
  const offsets: number[] = [];
  const ranks: number[] = [];
  const dashesPerRail: number[] = [];
  if (railCount <= 0 || span <= 0) {
    return { positions, anchors, offsets, ranks, dashesPerRail };
  }

  const slot = span / RAIL_DASHES;
  for (let r = 0; r < railCount; r++) {
    // A small angular offset from the wall rings' own phase keeps a rail
    // from sitting exactly on a column of dots.
    const a = (r / railCount) * Math.PI * 2 + 0.11;
    const x = Math.cos(a) * shellRx;
    const y = Math.sin(a) * shellRy;
    const rank = 0.35 + 0.65 * Math.abs(Math.sin(r * 12.9898));
    const dashes =
      r % RAIL_PARTIAL_EVERY === 1 ? Math.round(RAIL_DASHES * RAIL_PARTIAL_FRAC) : RAIL_DASHES;
    dashesPerRail.push(dashes);
    for (let d = 0; d < dashes; d++) {
      const anchor = -d * slot;
      positions.push(x, y, 0, x, y, 0);
      anchors.push(anchor, anchor);
      offsets.push(0, -slot * RAIL_DASH_DUTY);
      ranks.push(rank, rank);
    }
  }
  return { positions, anchors, offsets, ranks, dashesPerRail };
}

/**
 * Does every dash lie fully inside its own slot?
 *
 * ⚠ THIS IS THE WRAP GUARD, and it is the one property no visual check
 * reliably catches: a straddling dash paints a full-length streak for a
 * single frame per wrap cycle, which a contact sheet will miss and a
 * reader will not.
 */
export function railDashesFitSlots(span: number): boolean {
  if (span <= 0) return false;
  const slot = span / RAIL_DASHES;
  const inkLength = slot * RAIL_DASH_DUTY;
  return RAIL_DASH_DUTY > 0 && RAIL_DASH_DUTY < 1 && inkLength < slot;
}
