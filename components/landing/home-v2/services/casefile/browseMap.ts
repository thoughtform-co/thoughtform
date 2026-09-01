/**
 * THE BROWSE MAP — which client, which row, and what the crossing costs.
 *
 * PURE. No react, no three, no DOM, no clock (the `pdaFlight.ts` pattern):
 * the callers read ONE number off a custom property and this decides the
 * rest, so `tests/lib/casefile-browse-map.test.ts` can check the arithmetic.
 * A scrollspy written inline is a scrollspy nobody can check — and this one
 * has three readers (the casefile's style observer, the stage's scroll hook
 * and the smoke spec's band targeting), which is exactly the shape that
 * drifts.
 *
 * ── The table ────────────────────────────────────────────────────────────
 * ADR-056 U13 gave the browse band ONE EQUAL QUARTER per directory row,
 * because `CASES` holds one client and four tracks. That arithmetic is a
 * special case of a SEGMENT TABLE laid out in viewport heights:
 *
 *   [client 0 · rows × ROW_VH][seam · SEAM_VH][client 1 · rows × ROW_VH]…
 *
 * normalized onto [0, 1] — the domain `--svc-proof-browse` already
 * publishes. A client band is sized by its OWN row count (two clients need
 * not carry four tracks each) and every seam is one `SEAM_VH`.
 *
 * ⚠ **AT N = 1 THE TABLE IS ONE BAND `[0, 1]` AND EVERY FUNCTION HERE
 * DEGENERATES TO THE ARITHMETIC IT REPLACED, TO THE LAST REPRESENTABLE
 * DIGIT.** `browseTargetFor` returns `(rowIdx + 0.5) / rows`, which IS
 * `selectTrack`'s click-pins-scroll formula; `browseState` runs
 * `rowFromBrowse` on the raw value, which IS the U13 spy. That identity is
 * the acceptance proof for the whole mechanism, and the unit test asserts it
 * with `===` rather than a tolerance — `start + x * (end − start)` is
 * `0 + x * 1`, and both operations are exact.
 *
 * ── The seam ─────────────────────────────────────────────────────────────
 * A client swap is not a row swap: the grammar stays, the RECORD under it is
 * replaced. So the crossing is a crossfade in the casefile's own
 * arrival/departure language — `--svc-client-out` runs the outgoing client
 * off through the seam's first half, `--svc-client-in` brings the incoming
 * one on through the second — and the IDENTITY SWAP happens at the midpoint,
 * where both sides are already invisible.
 *
 * ⚠ **THE SWAP WINDOW MUST SIT ENTIRELY INSIDE THE INVISIBLE STRETCH.** The
 * hysteresis that stops a reader parked on the midpoint flickering between
 * two clients is what would otherwise expose the change: a held identity is
 * only free while the panel carrying it paints nothing. `smootherstep`
 * clears 0.95 by t = 0.406 and stays under 0.05 until t = 0.594, so
 * `SEAM_SWAP_HYSTERESIS` is 0.06 and the window [0.44, 0.56] lands with
 * room on both sides (1.4 % of opacity at either edge). The unit test pins
 * that containment rather than the constant.
 */

/** One band of the browse domain, in browse-fraction space [0, 1]. */
export type BrowseSegment =
  | {
      kind: "client";
      /** Index into the case list the table was built from. */
      clientIdx: number;
      start: number;
      end: number;
      /** Directory rows this client carries — the band's own divisor. */
      rows: number;
    }
  | {
      kind: "seam";
      /** The client whose band ENDS here; the next one begins after it. */
      after: number;
      start: number;
      end: number;
    };

/** Where a browse reading lands, and what each side of a seam owes. */
export interface BrowseReading {
  clientIdx: number;
  rowIdx: number;
  /** Reveal factor for the client panels — 1 everywhere but a seam. */
  clientIn: number;
  /** Departure factor for the client panels — 0 everywhere but a seam. */
  clientOut: number;
}

/** The spy's live position, which hysteresis needs and a fraction cannot carry. */
export interface BrowseCursor {
  clientIdx: number;
  rowIdx: number;
}

/**
 * How far past a shared band edge the browse value must travel before the
 * spy crosses it, as a fraction of ONE CLIENT'S band. ~26px of scroll at a
 * 2-viewport band on a 900px viewport — enough that rest jitter and
 * rubber-banding never flip a row, small enough to be imperceptible.
 *
 * Lifted verbatim from `ServicesCasefile` (ADR-056 U13) so the component and
 * this module cannot hold two values; the component imports it back.
 */
export const BROWSE_HYSTERESIS = 0.04;

/**
 * The same idea one level up, as a fraction of ONE SEAM. Held around the
 * midpoint, and deliberately smaller than the stretch where both clocks read
 * under 0.05 — see the seam note in the file header.
 */
export const SEAM_SWAP_HYSTERESIS = 0.06;

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Smootherstep on the unit interval — C2-continuous at both ends, the curve
 *  the casefile's every other reveal already rides. */
function smootherstep01(x: number): number {
  const t = clamp01(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Total browse length in viewport heights — the constants module's input. */
export function browseBandVh(rowCounts: readonly number[], rowVh: number, seamVh: number): number {
  let total = 0;
  for (let i = 0; i < rowCounts.length; i++) {
    total += rowCounts[i] * rowVh;
    if (i < rowCounts.length - 1) total += seamVh;
  }
  return total;
}

/**
 * The ordered band table, normalized onto [0, 1].
 *
 * ⚠ The normalization is what makes N = 1 exact: the single client's band is
 * `0 / total` → `total / total`, i.e. `0` → `1`, with no rounding anywhere.
 */
export function browseSegments(
  rowCounts: readonly number[],
  rowVh: number,
  seamVh: number
): BrowseSegment[] {
  const total = browseBandVh(rowCounts, rowVh, seamVh);
  if (!(total > 0)) return [];
  const out: BrowseSegment[] = [];
  let at = 0;
  for (let i = 0; i < rowCounts.length; i++) {
    const w = rowCounts[i] * rowVh;
    out.push({
      kind: "client",
      clientIdx: i,
      start: at / total,
      end: (at + w) / total,
      rows: rowCounts[i],
    });
    at += w;
    if (i < rowCounts.length - 1) {
      out.push({ kind: "seam", after: i, start: at / total, end: (at + seamVh) / total });
      at += seamVh;
    }
  }
  return out;
}

/** How many clients the table holds — the hook's "is there a seam" question. */
export function browseClientCount(segments: readonly BrowseSegment[]): number {
  let n = 0;
  for (const s of segments) if (s.kind === "client") n += 1;
  return n;
}

function clientSegment(
  segments: readonly BrowseSegment[],
  clientIdx: number
): Extract<BrowseSegment, { kind: "client" }> | null {
  for (const s of segments) if (s.kind === "client" && s.clientIdx === clientIdx) return s;
  return null;
}

/** The band a reading falls in. Past the last edge is the last band. */
function segmentAt(segments: readonly BrowseSegment[], browse: number): BrowseSegment | null {
  if (!segments.length) return null;
  const b = clamp01(browse);
  for (const s of segments) if (b < s.end) return s;
  return segments[segments.length - 1];
}

/**
 * Next active row for a browse reading WITHIN one client's band, honouring
 * hysteresis. Moved here verbatim from `ServicesCasefile` (ADR-056 U13) —
 * same expressions, same order, same constant — so the component and the
 * tests read one arithmetic.
 */
export function rowFromBrowse(
  browse: number,
  current: number,
  rowCount: number,
  hysteresis: number = BROWSE_HYSTERESIS
): number {
  const raw = Math.min(rowCount - 1, Math.max(0, Math.floor(browse * rowCount)));
  if (raw === current) return current;
  if (raw > current) return browse >= raw / rowCount + hysteresis ? raw : current;
  return browse <= (raw + 1) / rowCount - hysteresis ? raw : current;
}

/**
 * The two seam clocks for a browse reading — the hook's whole share of this
 * module. Row-agnostic on purpose: `useServicesStageScroll` does not know
 * what a track is and must not learn.
 *
 * Positional, not directional: which side is "outgoing" depends only on
 * where in the seam the reader is, so scrolling back up runs the same two
 * ramps in reverse and the crossing is reversible by construction.
 */
export function browseSeamClocks(
  browse: number,
  segments: readonly BrowseSegment[]
): { clientIn: number; clientOut: number } {
  const seg = segmentAt(segments, browse);
  if (!seg || seg.kind !== "seam") return { clientIn: 1, clientOut: 0 };
  const span = seg.end - seg.start;
  const t = span > 0 ? clamp01((clamp01(browse) - seg.start) / span) : 0;
  return t < 0.5
    ? { clientIn: 1, clientOut: smootherstep01(t / 0.5) }
    : { clientIn: smootherstep01((t - 0.5) / 0.5), clientOut: 0 };
}

/**
 * The whole reading: which client, which row, and both seam clocks.
 *
 * `current` is the spy's live position — hysteresis is a memory, and a pure
 * function of the fraction alone cannot have one. Inside a client's band
 * that memory is the ROW; inside a seam it is the CLIENT.
 */
export function browseState(
  browse: number,
  segments: readonly BrowseSegment[],
  current: BrowseCursor,
  hysteresis: number = BROWSE_HYSTERESIS
): BrowseReading {
  const seg = segmentAt(segments, browse);
  const clocks = browseSeamClocks(browse, segments);
  if (!seg) return { clientIdx: current.clientIdx, rowIdx: current.rowIdx, ...clocks };

  if (seg.kind === "client") {
    const span = seg.end - seg.start;
    const local = span > 0 ? clamp01((clamp01(browse) - seg.start) / span) : 0;
    // Hysteresis only means anything against a row of the SAME client — a
    // band the reader has just arrived in takes its raw row, or the held
    // index would be read against a row count that may not contain it.
    const rowIdx =
      current.clientIdx === seg.clientIdx
        ? rowFromBrowse(local, current.rowIdx, seg.rows, hysteresis)
        : Math.min(seg.rows - 1, Math.max(0, Math.floor(local * seg.rows)));
    return { clientIdx: seg.clientIdx, rowIdx, ...clocks };
  }

  // A SEAM. The identity is held across the midpoint (see the header) and
  // the row is the segment's own end: the client BEFORE the seam shows its
  // last row, the client AFTER it shows its first — which reads as "frozen
  // at its last" going down and "lands on its last" coming back up, from
  // one expression.
  const span = seg.end - seg.start;
  const t = span > 0 ? clamp01((clamp01(browse) - seg.start) / span) : 0;
  const before = seg.after;
  const after = seg.after + 1;
  const clientIdx =
    current.clientIdx >= after
      ? t <= 0.5 - SEAM_SWAP_HYSTERESIS
        ? before
        : after
      : t >= 0.5 + SEAM_SWAP_HYSTERESIS
        ? after
        : before;
  const rows = clientSegment(segments, clientIdx)?.rows ?? 1;
  return {
    clientIdx,
    rowIdx: clientIdx === before ? Math.max(0, rows - 1) : 0,
    ...clocks,
  };
}

/** A row's own sub-band inside its client's band, in browse-fraction space. */
export function browseRowBand(
  segments: readonly BrowseSegment[],
  clientIdx: number,
  rowIdx: number
): { start: number; end: number } {
  const seg = clientSegment(segments, clientIdx);
  if (!seg) return { start: 0, end: 1 };
  const rows = Math.max(1, seg.rows);
  const i = Math.min(rows - 1, Math.max(0, rowIdx));
  const span = seg.end - seg.start;
  return { start: seg.start + (i / rows) * span, end: seg.start + ((i + 1) / rows) * span };
}

/**
 * The browse fraction a row's CLICK pins the scroll to — its band's centre.
 *
 * ⚠ At N = 1 this is `(rowIdx + 0.5) / rows` to the last bit, which is the
 * expression `selectTrack` carried inline since U13: `seg.start` is `0` and
 * `seg.end − seg.start` is `1`, and both `x + 0` and `x * 1` are exact.
 * The click-pins-scroll contract is what stops the spy overriding the click
 * one frame later — never remove one side of it without the other.
 */
export function browseTargetFor(
  segments: readonly BrowseSegment[],
  clientIdx: number,
  rowIdx: number
): number {
  const seg = clientSegment(segments, clientIdx);
  if (!seg) return 0;
  const rows = Math.max(1, seg.rows);
  const i = Math.min(rows - 1, Math.max(0, rowIdx));
  return seg.start + ((i + 0.5) / rows) * (seg.end - seg.start);
}
