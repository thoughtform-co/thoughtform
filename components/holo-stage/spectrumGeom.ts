/**
 * spectrumGeom — BETWEEN TWO THINGS as a particle field (ADR-140).
 *
 * The spectrum's fallback is a flat rail from the tool to the collaborator,
 * two bands under it and three columns under those (ADR-136). A rail earns no
 * third dimension (the hologram grammar's first law: three quantities and a
 * floor), so this is not an isometric strip. What the drawing earns is the
 * PARTICLE material, and the one thing it has to say: software is
 * deterministic, intelligence is probabilistic.
 *
 * ONE field under the two bands. On the tool's side every mote is a LATTICE
 * mote — a crisp square frozen on a grid you can count. Across the overlap
 * (where the HTML's gold box and handle sit) the lattice DISSOLVES: each mote's
 * `order` rises from 0 to 1, its home is thrown off the grid by a seeded jitter,
 * and the dust shader lets it drift and softens it into a cloud mote. Past the
 * overlap it is all cloud. The HTML rail, bands, box, handle and words stay —
 * the DOM is the drawing's words and its one gold object.
 *
 * ⚠ THE GEOMETRY IS MEASURED, NOT MIRRORED. The field is built from the band
 * boxes the mount MEASURES in the track (`getBoundingClientRect`), so the CSS
 * that lays the bands out stays the one source and no percentage is restated
 * here (ADR-130 U4's crop law, on a flat drawing). The crop IS the track box,
 * one world unit per px, through the FLAT view (`stageFit`).
 *
 * ⚠ SEEDED, like every mote on the estate (`ISO_SEED`).
 */

import {
  ISO_BASIS_STAGE,
  ISO_SEED,
  mulberry32,
  type IsoFrame,
} from "@/components/arcs/framing/iso";

import { toFlat, type Vec3 } from "./stageFit";
import type { HoloStageSpec, StageDust, StageLine, StageSweep } from "./stageGeom";

/** A box in the track's own px. */
export interface SpectrumBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface SpectrumData {
  /** The track box. */
  w: number;
  h: number;
  /** The rail's centre line. */
  rail: { y: number };
  /** The two bands: software (from the tool's end), intelligence (from the collaborator's). */
  bands: readonly [SpectrumBox, SpectrumBox];
}

/** Px between lattice motes. */
export const SPECTRUM_PITCH = 7;
/** How far a dissolved mote may be thrown off its grid, in pitches. */
const SCATTER = 0.9;
/** The ruler under the rail: one tick per twelfth. */
const TICKS = 12;

export function spectrumFrame(d: Pick<SpectrumData, "w" | "h">): IsoFrame {
  return { w: d.w, h: d.h, ox: 0, oy: 0, k: 1, basis: ISO_BASIS_STAGE };
}

export function spectrumSpec(d: SpectrumData): HoloStageSpec {
  const [soft, intel] = d.bands;
  const x0 = Math.min(soft.x0, intel.x0);
  const x1 = Math.max(soft.x1, intel.x1);
  const y0 = Math.min(soft.y0, intel.y0);
  const y1 = Math.max(soft.y1, intel.y1);
  /* Where the two bands overlap is where the lattice dissolves. */
  const ov0 = Math.max(soft.x0, intel.x0);
  const ov1 = Math.min(soft.x1, intel.x1);
  const ovW = Math.max(1, ov1 - ov0);

  const rnd = mulberry32(ISO_SEED + 733);
  const points: Vec3[] = [];
  const order: number[] = [];
  const cols = Math.max(1, Math.floor((x1 - x0) / SPECTRUM_PITCH));
  const rows = Math.max(1, Math.floor((y1 - y0) / SPECTRUM_PITCH));
  const px = (x1 - x0) / cols;
  const py = (y1 - y0) / rows;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const hx = x0 + (i + 0.5) * px;
      const hy = y0 + (j + 0.5) * py;
      const k = Math.min(1, Math.max(0, (hx - ov0) / ovW));
      const o = k * k * (3 - 2 * k);
      /* ⚠ Draw the two randoms whether or not they are spent, so a mote's
         jitter never depends on how many lattice motes precede it. */
      const jx = (rnd() - 0.5) * 2;
      const jy = (rnd() - 0.5) * 2;
      const x = hx + o * jx * SCATTER * SPECTRUM_PITCH;
      const y = Math.min(y1, Math.max(y0, hy + o * jy * SCATTER * SPECTRUM_PITCH));
      points.push(toFlat(x, y));
      order.push(o);
    }
  }

  const dust: StageDust[] = [
    {
      id: "field",
      points,
      order,
      opacity: 0.5,
      role: "structure",
      size: 3.4,
      drift: SPECTRUM_PITCH * 0.5,
      /* On paper the field is the drawing: ink it back up (.45 × 1.7 ≈ .77). */
      inkScale: 1.7,
    },
  ];

  /* The ruler: a quiet tick under the rail at every twelfth — the rail is an
     axis, and this is the house's graduation (ADR-106), nothing lettered. */
  const lines: StageLine[] = [];
  for (let i = 0; i <= TICKS; i++) {
    const x = soft.x0 + ((intel.x1 - soft.x0) * i) / TICKS;
    const major = i % 3 === 0;
    lines.push({
      id: `tick-${i}`,
      points: [toFlat(x, d.rail.y + 3), toFlat(x, d.rail.y + (major ? 9 : 6))],
      role: "structure",
      width: 1,
      opacity: major ? 0.45 : 0.28,
      reveal: [0, 0.5],
      batch: true,
    });
  }

  const sweep: StageSweep = {
    axis: 0,
    from: x0 - 12,
    to: x1 + 12,
    window: [0.05, 0.62],
    width: 16,
  };

  return {
    id: "spectrum",
    frame: spectrumFrame(d),
    view: "flat",
    bounds: {
      min: [x0, -y1, 0],
      max: [x1, -Math.min(y0, d.rail.y), 0],
    },
    lines,
    faces: [],
    dust,
    anchors: [],
    sweep,
  };
}
