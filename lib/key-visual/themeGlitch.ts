/**
 * The hero key visual's theme-swap glitch — pure choreography (ADR-060).
 *
 * The landing hero has two plates, one per theme (ADR-058 Update 2). The
 * theme flip itself stays the HARD CUT ADR-058 §2 committed to: the
 * attribute, the module ref and the CSS all change in one synchronous task.
 * This describes a canvas laid OVER that already-flipped hero, holding the
 * outgoing plate and tearing it away — so the transition is a mask on top
 * of a cut, never a cross-fade of the cut itself.
 *
 * ⚠ NO DOM, NO CANVAS, NO TIME SOURCE IN THIS FILE. It is a function from
 * elapsed milliseconds to a description of what should be on screen, which
 * is what makes the invariant that matters testable without a browser: at
 * `done`, every band must read the NEW plate at native resolution with zero
 * offset, or removing the canvas pops.
 *
 * The vocabulary is the corridor's, not a new one:
 *   · `GRID = 3` — the pixel cadence shared by `ImageParticleGateway`,
 *     `seamPixelize` and the gateway grain. The mosaic resolves DOWN to it
 *     rather than to 1, then the last phase releases to native.
 *   · rank stagger 0.4 — `SEAM_RANK_STAGGER`, so the bands flip as a
 *     cascade rather than a uniform burst.
 *   · `alpha = 1 - t²` — the seam field's ease-out.
 *   · gold `176,139,66` / dawn `236,227,214` — the scanline fleck's ink,
 *     the same two triples the retired seam field painted with.
 */

/** The house pixel grid. The mosaic never resolves finer than this before
 *  the settle phase releases it. */
export const GLITCH_GRID = 3;

/** Coarsest mosaic cell, in source pixels, at the instant a band flips. */
export const GLITCH_CELL_MAX = 24;

/** Fraction of the run spent tearing the OLD plate before anything flips. */
export const GLITCH_TEAR_END = 0.22;

/** Fraction of the run by which every band has flipped and begun resolving. */
export const GLITCH_FLIP_END = 0.78;

/** Share of the flip window consumed by the rank cascade (SEAM_RANK_STAGGER). */
export const GLITCH_RANK_STAGGER = 0.4;

/** Default band count. 14 reads as slices at 1440×900 — coarser looks like
 *  a wipe, finer stops registering as tearing at all. */
export const GLITCH_BANDS = 14;

/** Default run length. Long enough to read as an event, short enough that a
 *  visitor toggling twice is not waiting on it. */
export const GLITCH_DURATION_MS = 640;

export type GlitchSource = "old" | "new";

export interface GlitchBand {
  /** Top edge as a fraction of the plate's painted height. */
  y0: number;
  /** Bottom edge as a fraction. Bands partition [0, 1] exactly. */
  y1: number;
  /** Which plate this band is showing. */
  source: GlitchSource;
  /** Horizontal tear, as a fraction of width. Signed. 0 at rest. */
  offsetX: number;
  /** Mosaic cell in source pixels. 1 = native. */
  cell: number;
  /** Band opacity. 1 at rest. */
  alpha: number;
}

export interface GlitchFrame {
  bands: GlitchBand[];
  /**
   * Scanline fleck: `null`, or a band-relative y plus an ink mix (0 = gold,
   * 1 = dawn). The controller draws a 1px line; the kernel decides where.
   */
  scanline: { y: number; mix: number; alpha: number } | null;
  /** True once the frame is the identity frame — new plate, nothing applied. */
  done: boolean;
}

export interface GlitchPlan {
  bands: number;
  durationMs: number;
  /** Flip order. `order[i]` is the rank (0 = first to flip) of band i. */
  order: number[];
  /** Per-band tear direction/scale, deterministic per seed. */
  tear: number[];
}

/* A tiny deterministic PRNG. `Math.random()` would make the choreography
   untestable and unreproducible between the two directions of a toggle. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Precompute a run.
 *
 * The flip ORDER is shuffled rather than top-to-bottom: a monotonic order
 * reads as a wipe, which is the one thing a glitch must not look like.
 */
export function createGlitchPlan(
  seed: number,
  opts: { bands?: number; durationMs?: number } = {}
): GlitchPlan {
  const bands = Math.max(2, Math.floor(opts.bands ?? GLITCH_BANDS));
  const durationMs = Math.max(1, opts.durationMs ?? GLITCH_DURATION_MS);
  const rand = mulberry32(seed);

  const order = Array.from({ length: bands }, (_, i) => i);
  for (let i = bands - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  // Tear magnitude per band: mostly small, occasionally a big slip. The
  // sign is what sells it as a tear rather than a shake.
  const tear = Array.from({ length: bands }, () => {
    const r = rand();
    const magnitude = r < 0.18 ? 0.05 + rand() * 0.05 : rand() * 0.02;
    return rand() < 0.5 ? -magnitude : magnitude;
  });

  return { bands, durationMs, order, tear };
}

/**
 * The frame at `elapsedMs`.
 *
 * Three phases, and the third exists solely so the end state is the
 * identity: without it the run would finish on a 3px mosaic and removing
 * the canvas would pop back to a sharp image.
 */
export function glitchFrame(plan: GlitchPlan, elapsedMs: number): GlitchFrame {
  const t = clamp01(elapsedMs / plan.durationMs);
  const bands: GlitchBand[] = [];

  if (t >= 1) {
    for (let i = 0; i < plan.bands; i++) {
      bands.push({
        y0: i / plan.bands,
        y1: (i + 1) / plan.bands,
        source: "new",
        offsetX: 0,
        cell: 1,
        alpha: 1,
      });
    }
    return { bands, scanline: null, done: true };
  }

  // Phase A — the old plate tears. Ramps in and back out so the first
  // painted frame is the plate as it actually was.
  const tearT = t < GLITCH_TEAR_END ? t / GLITCH_TEAR_END : 0;
  const tearGain = tearT === 0 ? 0 : Math.sin(tearT * Math.PI);

  // Phase B — bands flip on a rank cascade.
  const flipSpan = GLITCH_FLIP_END - GLITCH_TEAR_END;
  const flipT = clamp01((t - GLITCH_TEAR_END) / flipSpan);

  for (let i = 0; i < plan.bands; i++) {
    const rank = plan.order[i] / plan.bands;
    const start = rank * GLITCH_RANK_STAGGER;
    // Every band still completes by flipT = 1, so no band is left behind
    // when the settle phase begins.
    const local = clamp01((flipT - start) / (1 - start));
    const flipped = local > 0;

    let cell = 1;
    let alpha = 1;
    if (flipped) {
      // Resolve: coarse at the instant of the flip, down to the house grid.
      cell = GLITCH_CELL_MAX + (GLITCH_GRID - GLITCH_CELL_MAX) * local;
      // The seam field's ease-out, inverted — a band arrives faint and firms.
      alpha = 1 - (1 - local) * (1 - local) * 0.55;
    }

    // `|| 0` normalises -0 (a negative tear at zero gain). Harmless to
    // draw, but -0 fails `Object.is(x, 0)` and reverses `1/x`, so the
    // rest-state zero stays canonical rather than signed.
    const offsetX = plan.tear[i] * tearGain || 0;

    bands.push({
      y0: i / plan.bands,
      y1: (i + 1) / plan.bands,
      source: flipped ? "new" : "old",
      offsetX,
      cell,
      alpha,
    });
  }

  // Phase C — release the mosaic from the grid to native. Runs across the
  // whole tail so the last band to flip still gets a settle.
  const settleT = clamp01((t - GLITCH_FLIP_END) / (1 - GLITCH_FLIP_END));
  if (settleT > 0) {
    for (const band of bands) {
      band.cell = 1 + (band.cell - 1) * (1 - settleT);
      band.alpha = band.alpha + (1 - band.alpha) * settleT;
    }
  }

  // The fleck rides the flip phase only — a stray scanline during the
  // settle would be the last thing on screen, which reads as a defect
  // rather than a flourish.
  const scanline =
    flipT > 0 && settleT === 0
      ? {
          y: (plan.tear[Math.floor(flipT * plan.bands) % plan.bands] + 1) / 2,
          mix: flipT > 0.5 ? 1 : 0,
          alpha: 0.5 * Math.sin(flipT * Math.PI),
        }
      : null;

  return { bands, scanline, done: false };
}

/**
 * `object-fit: cover` as numbers.
 *
 * The two plates have slightly different aspect ratios (2880×1620 vs
 * 2912×1632), so the canvas cannot reuse one mapping for both — each is
 * cover-fitted to the same box independently, exactly as CSS does it.
 */
export function coverRect(
  imgW: number,
  imgH: number,
  boxW: number,
  boxH: number
): { x: number; y: number; w: number; h: number } {
  if (imgW <= 0 || imgH <= 0 || boxW <= 0 || boxH <= 0) {
    return { x: 0, y: 0, w: boxW, h: boxH };
  }
  const scale = Math.max(boxW / imgW, boxH / imgH);
  const w = imgW * scale;
  const h = imgH * scale;
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h };
}
