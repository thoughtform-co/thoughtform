"use client";

import { LADDER_INTERVALS, LADDER_TICKS } from "../variants";

/**
 * CANDIDATE 1 — the top-edge bearing strip (`.hud__mstrip`).
 *
 * The rail's 13-tick ladder, turned through 90° and laid along the very top
 * edge of the phone, with ONE lit detent travelling it. ADR-031 Update 2 is
 * explicit that the ladder is load-bearing rail identity and may never be
 * removed — at ≤960 it is, along with the rail that carries it, and this is
 * the identity coming back in the one band the frame still owns.
 *
 * ⚠ POSITION IS A PURE FUNCTION OF THE ACTIVE ROW INTO A MEASURED TABLE —
 * the ADR-031 U9 grammar, unchanged. The table is recomputed on layout
 * (mount + `ResizeObserver`), the active row is resolved by an
 * IntersectionObserver, and NOTHING here reads scroll. A strip whose detent
 * tracked `scrollY` would be a progress bar with ticks on it, which is
 * exactly the read round 1 of `/test/hud-instruments-lab` was rejected for
 * ("it just feels like showing progression" — detent-proportional placement
 * makes an instrument a SCALE, and a scale is a progress bar however it is
 * styled).
 *
 * ⚠ IT PRINTS NO NAME AND NO DIGIT. The TR corner names the section
 * (ADR-055) and it is nine pixels away in the same band; a second label
 * there is the said-twice defect. The lit tick IS the label.
 *
 * `data-mhd-ink` is the capture's handle — every element that actually
 * paints carries it, so the band / contrast / collision gates measure the
 * drawing rather than a wrapper's bounding box.
 */

export interface BearingStripProps {
  /**
   * One rung per journey row: `detents[row]` is that section's tick index,
   * 0…12. Measured and monotonic — see `detentTable` in the shell.
   */
  detents: readonly number[];
  /** Index into `JOURNEY_ROWS`. */
  activeRow: number;
  /** The tick-ink knob. Written as a scoped override of `--mhud-line`. */
  alpha: number;
  /** The detent-glide knob, ms. */
  glideMs: number;
}

export function BearingStrip({ detents, activeRow, alpha, glideMs }: BearingStripProps) {
  /* Before the table has been measured every rung is 0, which would seat
     the detent on the first tick and then glide it out — a motion the
     reader never made. The strip holds the FIRST rung until the table
     lands (the `data-ready` gate's reasoning, one instrument down). */
  const detent = detents[activeRow] ?? 0;

  return (
    <div
      className="hud__mstrip"
      aria-hidden="true"
      style={
        {
          "--mhud-line": `rgba(var(--dawn-rgb), ${alpha})`,
          "--mhud-glide": `${glideMs}ms`,
        } as React.CSSProperties
      }
    >
      <div className="hud__mstrip__ladder">
        {Array.from({ length: LADDER_TICKS }, (_, i) => (
          <i
            key={i}
            className="hud__mstrip__tick"
            data-mhd-ink="tick"
            /* Majors on every third rung — 0 · 3 · 6 · 9 · 12, so the
               twelve intervals read as four spans without a numeral. */
            data-major={i % 3 === 0 || undefined}
            style={{ "--i": i } as React.CSSProperties}
          />
        ))}
        <i
          className="hud__mstrip__detent"
          data-mhd-ink="detent"
          data-mhd-detent={detent}
          style={{ "--mstrip-d": detent } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

/**
 * The ladder's rung for a normalised depth, snapped and kept MONOTONIC.
 *
 * ⚠ THE SNAP MUST STAY STRICTLY INCREASING, AND ROUNDING ALONE DOES NOT.
 * Two sections whose measured depths round onto one rung make the detent
 * STAND STILL across a section change — the instrument saying nothing at
 * the exact moment it has something to say, with no error and nothing on
 * screen to explain it. Seven rows onto thirteen rungs always fits, so the
 * fix is free: each rung is at least one past the last.
 *
 * The reverse pass matters as much. Clamping only forward pushes a late
 * cluster off the end of the ladder (rows 5 and 6 both wanting rung 12
 * would put one at 13), so the forward pass is followed by a backward one
 * that pulls the tail back inside — after which the sequence is monotonic
 * AND inside `[0, 12]` by construction.
 *
 * Exported for the shell and for anything that later wants to pin it.
 */
export function snapDetents(depths: readonly number[]): number[] {
  const out = depths.map((d) =>
    Math.max(0, Math.min(LADDER_INTERVALS, Math.round(d * LADDER_INTERVALS)))
  );
  for (let i = 1; i < out.length; i += 1) {
    if (out[i] <= out[i - 1]) out[i] = out[i - 1] + 1;
  }
  /* ⚠ THE TAIL HAS TO BE PULLED BACK ONTO THE LADDER BEFORE THE REVERSE
     PASS, OR THE REVERSE PASS HAS NOTHING TO PUSH AGAINST. The measured
     table clamps the last row's depth to 1 (its part begins inside the
     final viewport, past `maxScroll`), so the last two rows routinely
     round onto rung 12 together and the forward pass hands rung 13 to a
     ladder that ends at 12 — a detent painted off the right edge, with
     every earlier rung still perfectly correct. */
  out[out.length - 1] = Math.min(out[out.length - 1], LADDER_INTERVALS);
  for (let i = out.length - 2; i >= 0; i -= 1) {
    if (out[i] >= out[i + 1]) out[i] = out[i + 1] - 1;
  }
  /* If the row count ever exceeds the rungs this goes negative rather than
     drawing something wrong quietly. Seven against thirteen has 6 rungs of
     slack; the throw is what makes an eighth section a build failure
     instead of a detent painted off the left edge. */
  if (out.some((v) => v < 0 || v > LADDER_INTERVALS)) {
    throw new Error(
      `[mobile-hud-lab] ${depths.length} journey rows will not fit ${LADDER_TICKS} ticks`
    );
  }
  return out;
}
