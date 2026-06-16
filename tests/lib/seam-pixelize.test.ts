import { describe, expect, it } from "vitest";

import {
  SEAM_BRANDMARK_ASPECT,
  SEAM_PIXEL_GRID,
  clamp01,
  dispersePixel,
  getServicesTargetHalfPx,
  snapToGrid,
  type SeamLayout,
  type SeamParticleInput,
} from "@/lib/home-v2/seamPixelize";

/**
 * `seamPixelize` is the dispersal kernel for the corridor → Services
 * pixel-field exit (ADR-021 Phase 2). These tests pin its visible
 * contract: assemble at `seamMorph = 0`, fully faded at
 * `seamMorph = 1`, deterministic, grid-snapped, and the Services
 * half-width helper matches the CSS clamp it shares with the
 * projected brandmark actor.
 */

const VIEWPORT = { vw: 1500, vh: 900 } as const;

function makeLayout(overrides: Partial<SeamLayout> = {}): SeamLayout {
  return {
    centerX: VIEWPORT.vw * 0.5,
    centerY: VIEWPORT.vh * 0.5,
    halfPx: getServicesTargetHalfPx(VIEWPORT.vw),
    aspect: SEAM_BRANDMARK_ASPECT,
    gridSize: SEAM_PIXEL_GRID,
    seamMorph: 0,
    ...overrides,
  };
}

function makeParticle(overrides: Partial<SeamParticleInput> = {}): SeamParticleInput {
  return {
    homeX: 0,
    homeY: 0,
    seedX: 123.456,
    seedY: 987.654,
    rank: 0,
    count: 100,
    ...overrides,
  };
}

describe("seamPixelize — math primitives", () => {
  it("clamp01 saturates outside [0,1] and passes through interior values", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(0)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(1)).toBe(1);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(NaN)).toBe(0);
  });

  it("snapToGrid floors to the nearest grid multiple and is the identity at grid <= 0", () => {
    expect(snapToGrid(0, 3)).toBe(0);
    expect(snapToGrid(2, 3)).toBe(0);
    expect(snapToGrid(3, 3)).toBe(3);
    expect(snapToGrid(8.7, 3)).toBe(6);
    expect(snapToGrid(-1, 3)).toBe(-3);
    expect(snapToGrid(7, 0)).toBe(7);
    expect(snapToGrid(7, -2)).toBe(7);
  });
});

describe("seamPixelize — getServicesTargetHalfPx", () => {
  it("matches the CSS clamp(220, 21vw, 360) source-of-truth divided by 2", () => {
    // The CSS rule in `home-v2.css` for `data-services-brandmark`
    // sets `width: clamp(220px, 21vw, 360px)`. The half-width
    // helper must yield half of that at every viewport width.
    const cases = [
      { vw: 320, expectedWidth: 220 }, // narrow → lower-bound 220px
      { vw: 1048, expectedWidth: 220 }, // 21vw=220.08 → still ~lower bound
      { vw: 1500, expectedWidth: 315 }, // 21vw=315 → preferred
      { vw: 1715, expectedWidth: 360 }, // 21vw=360.15 → upper bound capped
      { vw: 2400, expectedWidth: 360 }, // wide → upper bound 360px
    ];
    for (const { vw, expectedWidth } of cases) {
      const half = getServicesTargetHalfPx(vw);
      expect(half * 2).toBeCloseTo(expectedWidth, 0);
    }
  });

  it("monotonically non-decreases with viewport width", () => {
    let prev = -Infinity;
    for (let vw = 100; vw <= 4000; vw += 100) {
      const half = getServicesTargetHalfPx(vw);
      expect(half).toBeGreaterThanOrEqual(prev);
      prev = half;
    }
  });
});

describe("seamPixelize — dispersePixel: assembled state (seamMorph = 0)", () => {
  it("places each particle exactly at its grid-snapped home pixel position", () => {
    const layout = makeLayout({ seamMorph: 0 });
    const particle = makeParticle({ homeX: 0.25, homeY: -0.1 });

    const out = dispersePixel(particle, layout);

    const expectedHomePxX = layout.centerX + particle.homeX * layout.halfPx * 2;
    const expectedHomePxY = layout.centerY + particle.homeY * layout.halfPx * 2 * layout.aspect;

    expect(out.x).toBe(snapToGrid(expectedHomePxX, SEAM_PIXEL_GRID));
    expect(out.y).toBe(snapToGrid(expectedHomePxY, SEAM_PIXEL_GRID));
  });

  it("paints every particle at full alpha at seamMorph = 0", () => {
    const layout = makeLayout({ seamMorph: 0 });
    for (let rank = 0; rank < 100; rank++) {
      const out = dispersePixel(
        makeParticle({ homeX: rank / 100 - 0.5, homeY: 0.1, rank, count: 100 }),
        layout
      );
      expect(out.alpha).toBe(1);
    }
  });
});

describe("seamPixelize — dispersePixel: full dispersal (seamMorph >= 1)", () => {
  it("forces alpha to 0 for every particle at seamMorph = 1", () => {
    const layout = makeLayout({ seamMorph: 1 });
    for (let rank = 0; rank < 100; rank++) {
      const out = dispersePixel(
        makeParticle({
          homeX: 0.3,
          homeY: 0.2,
          rank,
          count: 100,
          seedX: rank * 17.3,
          seedY: rank * 23.5,
        }),
        layout
      );
      expect(out.alpha).toBe(0);
    }
  });

  it("clamps overshoot (seamMorph > 1) to the same fully-faded state", () => {
    const layout = makeLayout({ seamMorph: 5 });
    const out = dispersePixel(makeParticle(), layout);
    expect(out.alpha).toBe(0);
  });
});

describe("seamPixelize — dispersePixel: grid-snap invariant", () => {
  it("always returns x and y on multiples of the grid size, at any seamMorph", () => {
    const grid = SEAM_PIXEL_GRID;
    const layout = makeLayout();
    for (let i = 0; i < 50; i++) {
      const morph = i / 49;
      const probe: SeamLayout = { ...layout, seamMorph: morph };
      for (let r = 0; r < 50; r++) {
        const particle = makeParticle({
          homeX: ((r * 13) % 100) / 100 - 0.5,
          homeY: ((r * 7) % 100) / 100 - 0.5,
          seedX: r * 91.7,
          seedY: r * 41.3,
          rank: r,
          count: 50,
        });
        const out = dispersePixel(particle, probe);
        // `Math.abs` normalises `-0` (which `%` produces for
        // negative inputs) to `+0` so the strict `Object.is`
        // comparison in `.toBe(0)` passes regardless of sign.
        expect(Math.abs(out.x % grid)).toBe(0);
        expect(Math.abs(out.y % grid)).toBe(0);
      }
    }
  });

  it("honours a custom gridSize override", () => {
    const layout = makeLayout({ gridSize: 5, seamMorph: 0.5 });
    const out = dispersePixel(makeParticle({ homeX: 0.3 }), layout);
    expect(Math.abs(out.x % 5)).toBe(0);
    expect(Math.abs(out.y % 5)).toBe(0);
  });
});

describe("seamPixelize — dispersePixel: determinism", () => {
  it("returns identical output for identical input (no Math.random inside)", () => {
    const particle = makeParticle({
      homeX: 0.21,
      homeY: -0.18,
      seedX: 432.1,
      seedY: 67.9,
      rank: 17,
      count: 64,
    });
    const layout = makeLayout({ seamMorph: 0.42 });

    const a = dispersePixel(particle, layout);
    const b = dispersePixel(particle, layout);
    const c = dispersePixel(particle, layout);

    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });

  it("colorMix is stable per particle and depends only on seedX (not seamMorph)", () => {
    const particle = makeParticle({ seedX: 555 });
    const a = dispersePixel(particle, makeLayout({ seamMorph: 0 }));
    const b = dispersePixel(particle, makeLayout({ seamMorph: 0.5 }));
    const c = dispersePixel(particle, makeLayout({ seamMorph: 1 }));
    expect(a.colorMix).toBeCloseTo(b.colorMix, 6);
    expect(b.colorMix).toBeCloseTo(c.colorMix, 6);
  });

  it("colorMix sits in [0, 1] for arbitrary seedX values", () => {
    const seeds = [-1234.5, -1, 0, 0.001, 12.3, 999.999, 12345.678];
    for (const seedX of seeds) {
      const out = dispersePixel(makeParticle({ seedX }), makeLayout());
      expect(out.colorMix).toBeGreaterThanOrEqual(0);
      expect(out.colorMix).toBeLessThanOrEqual(1);
    }
  });
});

describe("seamPixelize — dispersePixel: rank stagger + lift", () => {
  it("low-rank particles begin dispersing earlier than high-rank ones", () => {
    // At a low seamMorph the highest-rank particle should still be
    // pinned at its home (localT <= 0), while the lowest-rank
    // particle has already started moving (localT > 0).
    const layout = makeLayout({ seamMorph: 0.05 });
    const homeX = 0;
    const homeY = -0.4; // off-centre so lift is observable

    const lowRank = dispersePixel(makeParticle({ homeX, homeY, rank: 0, count: 100 }), layout);
    const highRank = dispersePixel(makeParticle({ homeX, homeY, rank: 99, count: 100 }), layout);

    const expectedHomeY = layout.centerY + homeY * layout.halfPx * 2 * layout.aspect;
    const snappedHome = snapToGrid(expectedHomeY, SEAM_PIXEL_GRID);

    // High-rank particle hasn't started yet → still at home, alpha 1.
    expect(highRank.y).toBe(snappedHome);
    expect(highRank.alpha).toBe(1);

    // Low-rank particle has begun lifting: y must be ABOVE the home
    // (smaller in viewport pixel coords because the +y axis grows
    // downward) and alpha must have dropped.
    expect(lowRank.y).toBeLessThan(snappedHome);
    expect(lowRank.alpha).toBeLessThan(1);
  });

  it("partial dispersal lifts particles upward (negative y delta from home)", () => {
    const layout = makeLayout({ seamMorph: 0.6 });
    const homeY = 0.0;
    const out = dispersePixel(
      makeParticle({ homeX: 0, homeY, rank: 5, count: 100, seedY: 500 }),
      layout
    );
    const expectedHomePxY = layout.centerY + homeY * layout.halfPx * 2 * layout.aspect;
    expect(out.y).toBeLessThan(snapToGrid(expectedHomePxY, SEAM_PIXEL_GRID));
  });
});

describe("seamPixelize — dispersePixel: edge cases", () => {
  it("treats count <= 0 as count = 1 instead of dividing by zero", () => {
    const layout = makeLayout({ seamMorph: 0.5 });
    const out = dispersePixel(makeParticle({ rank: 0, count: 0 }), layout);
    expect(Number.isFinite(out.x)).toBe(true);
    expect(Number.isFinite(out.y)).toBe(true);
    expect(out.alpha).toBeGreaterThanOrEqual(0);
    expect(out.alpha).toBeLessThanOrEqual(1);
  });

  it("handles a single-particle field (count = 1) without divide-by-zero", () => {
    const layout = makeLayout({ seamMorph: 0.5 });
    const out = dispersePixel(makeParticle({ rank: 0, count: 1 }), layout);
    expect(Number.isFinite(out.alpha)).toBe(true);
    expect(out.alpha).toBeGreaterThanOrEqual(0);
    expect(out.alpha).toBeLessThanOrEqual(1);
  });

  it("alpha is monotonically non-increasing as seamMorph grows for the lowest-rank particle", () => {
    // The lowest-rank particle has `localT = seamMorph / (1 - stagger)`
    // (no offset), so its alpha = 1 - localT^2 is monotone non-
    // increasing. Pin the contract.
    const particle = makeParticle({ rank: 0, count: 100, homeY: 0.2 });
    let prev = 2;
    for (let i = 0; i <= 20; i++) {
      const morph = i / 20;
      const out = dispersePixel(particle, makeLayout({ seamMorph: morph }));
      expect(out.alpha).toBeLessThanOrEqual(prev + 1e-9);
      prev = out.alpha;
    }
  });
});
