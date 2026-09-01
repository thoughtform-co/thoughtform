"use client";

import type { NeedleStyle } from "../variants";

/**
 * CANDIDATE 2 — the corner astrolabe (`.hud__mdial`).
 *
 * A non-interactive dial seated in the corner the wordmark vacated on
 * 2026-09-01, inside the bottom chrome band. It draws a RECORD in three
 * registers of one fact:
 *
 *   · the NEEDLE is scroll depth, scrubbed and reversible;
 *   · the TICK RING is the journey — one tick per row at its own MEASURED
 *     depth, so the gaps are the reading (a corridor that runs six
 *     viewports owns six viewports of arc);
 *   · the DIAMOND is the section you are in, stepping tick to tick on the
 *     detent glide.
 *
 * The needle passes a tick as the reader reaches that section, and the
 * diamond confirms it. That is what makes it a record rather than a
 * metaphor — ADR-078 U1's ruling, where a drawing that had to be explained
 * before it meant anything was deleted for a dated axis of what actually
 * shipped.
 *
 * ⚠ NO DIGITS, AND NO ORDINAL IN COSTUME. The section's position is the
 * diamond's SEAT, not a count of marks and not a number — ADR-070 U28's
 * ruling ("the hub letters no count") and its own observation that every
 * pass wanting to say how much reaches for a digit first.
 *
 * ── Geometry ──────────────────────────────────────────────────────────
 *
 * A 100-unit viewBox, so every constant below reads as a percentage of the
 * dial and the three sizes (48/52/56) are one `width`.
 *
 * ⚠ EVERY SEATED RADIUS IS BOUND AGAINST THE APOTHEM, NOT THE RADIUS —
 * ADR-070 U34's finding, which is that a polygonal OUTER wall is worst at
 * its apothem `κ·R = cos(15°)·R`, 1.6 units nearer here than the
 * circumradius, and that measuring against the nominal radius reports
 * clearance on 19 of 47 labels that are actually through their own wall.
 * At R 46 the wall is 44.43 at the twelve edge midpoints; the tick ring's
 * outer end is 42 and the diamond's outermost point 42.4, so both clear it
 * at EVERY angle rather than only at the vertices.
 */

/** The housing's circumradius. */
const R_OUT = 46;
/** `cos(15°)` — the dodecagon's apothem ratio (ADR-070 U34's κ). */
const KAPPA = Math.cos(Math.PI / 12);
/** The wall at its nearest, i.e. what everything inside is bound against. */
const WALL = R_OUT * KAPPA;

/** The journey ring: one radial tick per row. */
const TICK_R0 = 36;
const TICK_R1 = 42;
/** The active row's diamond rides the ring's own middle. */
const MARK_R = 39;
const MARK_HALF = 3.4;
/** The needle, from just outside the hub to just inside the ring. */
const NEEDLE_R0 = 4;
const NEEDLE_R1 = 30;
const HUB_HALF = 2.4;

/* A drawing that has silently outgrown its housing is the one failure the
   apothem law exists to stop, so it is asserted at module load rather than
   left to a screenshot. */
if (Math.max(TICK_R1, MARK_R + MARK_HALF) > WALL) {
  throw new Error(`[mobile-hud-lab] dial ink crosses the apothem (${WALL.toFixed(2)})`);
}

/**
 * The twelve-sided housing, generated rather than typed.
 *
 * Diamonds never circles is the shape law, and the house's own answer to a
 * dial is twelve-sided (ADR-070 U33's compound carrier). Twelve is also the
 * bearing strip's twelve intervals, so the two candidates are one
 * instrument seen from two ends.
 */
const HOUSING = (() => {
  const pts: string[] = [];
  for (let k = 0; k < 12; k += 1) {
    const t = (-90 + k * 30) * (Math.PI / 180);
    pts.push(`${(50 + R_OUT * Math.cos(t)).toFixed(2)} ${(50 + R_OUT * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join(" L")} Z`;
})();

/**
 * The sweep is 300°, not 360°.
 *
 * A full turn reads as a CLOCK — the hand returns to where it started, and
 * an instrument whose end state is its start state cannot say "you are at
 * the end". 300° leaves a 60° gap at the bottom that IS the reading: the
 * needle enters at −150° and leaves at +150°, and the open arc is the part
 * of the journey there is none of.
 */
const SWEEP_DEG = 300;
const SWEEP_START = -150;
const angleOf = (depth: number) => SWEEP_START + SWEEP_DEG * depth;

export interface AstrolabeProps {
  /** One normalised depth per journey row, 0…1. Measured, not authored. */
  depths: readonly number[];
  /** Index into `JOURNEY_ROWS`. */
  activeRow: number;
  /** 48 · 52 · 56. */
  size: number;
  /** The needle-style knob. */
  needle: NeedleStyle;
  /** The detent-glide knob, ms — the diamond's step, never the needle's. */
  glideMs: number;
}

export function Astrolabe({ depths, activeRow, size, needle, glideMs }: AstrolabeProps) {
  const activeDepth = depths[activeRow] ?? 0;

  return (
    <div
      className="hud__mdial"
      aria-hidden="true"
      style={
        {
          "--mdial-size": `${size}px`,
          "--mhud-glide": `${glideMs}ms`,
          "--mdial-a": activeDepth,
        } as React.CSSProperties
      }
    >
      <svg
        className="hud__mdial__svg"
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path className="hud__mdial__housing" d={HOUSING} data-mhd-ink="housing" />

        {/* The journey. Each tick is a radial hairline at its row's own
            measured depth — `rotate` about the viewBox centre, so the
            drawing carries no per-tick trigonometry. */}
        {depths.map((d, i) => (
          <line
            key={i}
            className="hud__mdial__tick"
            data-mhd-ink="tick"
            x1="50"
            y1={50 - TICK_R1}
            x2="50"
            y2={50 - TICK_R0}
            style={{ rotate: `${angleOf(d)}deg` }}
          />
        ))}

        {/* DEPTH — the one scrubbed channel. `--mdial-depth` is written by
            the lab's scroll handler here and would ride `useLandingScroll`
            in production; see the note in `mobile-hud.css`. */}
        {needle === "wedge" ? (
          <path
            className="hud__mdial__needle"
            data-style="wedge"
            data-mhd-ink="needle"
            d={`M50 ${50 - NEEDLE_R1} L52.1 ${50 - NEEDLE_R0} L47.9 ${50 - NEEDLE_R0} Z`}
          />
        ) : (
          <line
            className="hud__mdial__needle"
            data-style="line"
            data-mhd-ink="needle"
            x1="50"
            y1={50 - NEEDLE_R0}
            x2="50"
            y2={50 - NEEDLE_R1}
          />
        )}

        {/* WHERE YOU ARE. It rides the ring's normal rather than staying
            level: a detent mark on a bezel is part of the bezel, and a
            diamond held upright reads as a sticker on top of the dial. */}
        <path
          className="hud__mdial__mark"
          data-mhd-ink="mark"
          d={
            `M50 ${50 - MARK_R - MARK_HALF} L${50 + MARK_HALF} ${50 - MARK_R} ` +
            `L50 ${50 - MARK_R + MARK_HALF} L${50 - MARK_HALF} ${50 - MARK_R} Z`
          }
        />

        {/* The bearing's origin. */}
        <path
          className="hud__mdial__hub"
          data-mhd-ink="hub"
          d={`M50 ${50 - HUB_HALF} L${50 + HUB_HALF} 50 L50 ${50 + HUB_HALF} L${50 - HUB_HALF} 50 Z`}
        />
      </svg>
    </div>
  );
}
