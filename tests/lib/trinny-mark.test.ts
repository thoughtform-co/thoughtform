/**
 * The turn (ADR-095): the client's mark, its pairing with ours, and the
 * beat's clock.
 *
 * Three copies of the mark derive from one numbers module and this is what
 * keeps them one — the SVG asset on disk, the inline fallback in the forked
 * prototype, and the extruded 3D target. The pairing and the clock are pure
 * and their properties are asserted here rather than read off a still.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildTarget } from "@/app/(marketing)/trinny-london/mark/buildTrinnyTarget";
import {
  assignByPolarRank,
  classifyRadius,
  MARK_CLASS_INNER,
  MARK_CLASS_RING,
  PAIR_SPLIT_RADIUS,
} from "@/app/(marketing)/trinny-london/mark/pairByPolarRank";
import {
  polygonPath,
  TRINNY_MARK_GLYPHS,
  TRINNY_MARK_RING,
  TRINNY_MARK_VIEWBOX,
  trinnyMarkPaths,
  trinnyMarkSvg,
} from "@/app/(marketing)/trinny-london/mark/trinnyMark";
import {
  morphOf,
  productEnter,
  productPose,
  TURN_MARK_CENTER_Y,
  TURN_MORPH_END,
  TURN_MORPH_START,
  turnProgress,
  turnRunway,
  washOf,
  veilOf,
  ctaInOf,
  ctaOutOf,
  TURN_VEIL_MAX,
} from "@/app/(marketing)/trinny-london/turn/turnClock";
import { turnDecodeFrame } from "@/app/(marketing)/trinny-london/turn/turnDecode";

const ROOT = process.cwd();
const SVG_PATH = join(ROOT, "public/trinny-london/trinny-london-mark.svg");
const PROTOTYPE = join(ROOT, "public/prototypes/v7/landing-trinny-london.html");
const ACTOR = join(
  ROOT,
  "components/landing/home-v2/DepthGatewayScene/BrandmarkPhysicsCoreActor.tsx"
);
const SCENE_GEOM = join(ROOT, "components/landing/home-v2/DepthGatewayScene/sceneGeom.ts");

/** A stand-in for the parked Thoughtform homes: a ring at r 0.48 with real
 *  depth, and two bars through the centre. Deterministic. */
function syntheticBase(count: number): Float32Array {
  const out = new Float32Array(count * 3);
  const ringN = Math.round(count * 0.55);
  const barN = count - ringN;
  for (let i = 0; i < count; i++) {
    let x: number;
    let y: number;
    if (i < ringN) {
      const a = (i / ringN) * Math.PI * 2;
      x = 0.48 * Math.cos(a);
      y = 0.48 * Math.sin(a);
    } else {
      // Two bars through the centre, every point unique (t advances with j).
      const j = i - ringN;
      const t = (j / barN) * 0.9 - 0.45;
      if (j % 2 === 0) {
        x = t;
        y = ((j % 7) - 3) * 0.004;
      } else {
        x = ((j % 5) - 2) * 0.004;
        y = t;
      }
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = i % 2 === 0 ? 0.05 : -0.05;
  }
  return out;
}

describe("the mark's three copies", () => {
  it("the SVG asset on disk is the generator's exact bytes", () => {
    expect(existsSync(SVG_PATH)).toBe(true);
    expect(readFileSync(SVG_PATH, "utf8")).toBe(trinnyMarkSvg());
  });

  it("the prototype's inline fallback carries every path the module emits", () => {
    const html = readFileSync(PROTOTYPE, "utf8");
    const inline = html.match(/<svg class="tl-turn__mark"[^>]*>[\s\S]*?<\/svg>/)?.[0] ?? "";
    expect(inline, 'an inline <svg class="tl-turn__mark"> inside #turn').not.toBe("");
    expect(inline).toContain('fill="currentColor"');
    expect(inline).toContain(`viewBox="0 0 ${TRINNY_MARK_VIEWBOX} ${TRINNY_MARK_VIEWBOX}"`);
    for (const d of trinnyMarkPaths()) expect(inline).toContain(`d="${d}"`);
    expect(inline).toContain('fill-rule="evenodd"');
  });

  it("the numbers are a ring around an axis-aligned monogram inside the box", () => {
    expect(TRINNY_MARK_RING.inner).toBeLessThan(TRINNY_MARK_RING.outer);
    expect(TRINNY_MARK_RING.outer * 2).toBe(TRINNY_MARK_VIEWBOX);
    for (const poly of TRINNY_MARK_GLYPHS) {
      expect(poly.length).toBeGreaterThanOrEqual(4);
      for (let i = 0; i < poly.length; i++) {
        const [x, y] = poly[i];
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(TRINNY_MARK_VIEWBOX);
        expect(y).toBeLessThanOrEqual(TRINNY_MARK_VIEWBOX);
        const [nx, ny] = poly[(i + 1) % poly.length];
        expect(x === nx || y === ny, `edge ${i} of a glyph is axis-aligned`).toBe(true);
      }
      // The monogram stays inside the ring's hole: every vertex under the
      // inner radius, which is what lets ONE radius split classify it.
      for (const [x, y] of poly) {
        const r = Math.hypot(x - TRINNY_MARK_VIEWBOX / 2, y - TRINNY_MARK_VIEWBOX / 2);
        expect(r / TRINNY_MARK_RING.outer).toBeLessThan(0.75);
      }
    }
    expect(
      polygonPath([
        [0, 0],
        [10, 0],
        [10, 5],
        [0, 5],
      ])
    ).toBe("M0 0H10V5H0Z");
  });
});

describe("assignByPolarRank", () => {
  const COUNT = 900;
  const base = syntheticBase(COUNT);

  it("assigns every slot, preserving its class, deterministically", () => {
    const target = syntheticBase(1500);
    const a = assignByPolarRank(base, target, COUNT);
    const b = assignByPolarRank(base, target, COUNT);
    expect(a).toHaveLength(COUNT * 3);
    expect(Array.from(a)).toEqual(Array.from(b));
    for (let i = 0; i < COUNT; i++) {
      expect(
        Number.isFinite(a[i * 3]) && Number.isFinite(a[i * 3 + 1]) && Number.isFinite(a[i * 3 + 2])
      ).toBe(true);
      expect(classifyRadius(a[i * 3], a[i * 3 + 1])).toBe(
        classifyRadius(base[i * 3], base[i * 3 + 1])
      );
    }
  });

  it("is the identity when the target IS the base", () => {
    const a = assignByPolarRank(base, base, COUNT);
    expect(Array.from(a)).toEqual(Array.from(base));
  });

  it("pairs by angular rank within a class — the ring flows to the ring in order", () => {
    const target = syntheticBase(1500);
    const a = assignByPolarRank(base, target, COUNT);
    for (const cls of [MARK_CLASS_RING, MARK_CLASS_INNER]) {
      const slots: number[] = [];
      for (let i = 0; i < COUNT; i++) {
        if (classifyRadius(base[i * 3], base[i * 3 + 1]) === cls) slots.push(i);
      }
      const angle = (buf: Float32Array, i: number) => Math.atan2(buf[i * 3 + 1], buf[i * 3]);
      const radius = (buf: Float32Array, i: number) => Math.hypot(buf[i * 3], buf[i * 3 + 1]);
      // The implementation's own total order (angle, radius, depth, index) —
      // the bars put many slots on ONE angle, and a tie broken differently
      // here would compare assigned angles the pairing never ranked.
      slots.sort(
        (p, q) =>
          angle(base, p) - angle(base, q) ||
          radius(base, p) - radius(base, q) ||
          base[p * 3 + 2] - base[q * 3 + 2] ||
          p - q
      );
      let last = -Infinity;
      for (const i of slots) {
        const t = angle(a, i);
        expect(t + 1e-9).toBeGreaterThanOrEqual(last);
        last = t;
      }
    }
  });

  it("takes a uniform SUBSET when the target outnumbers the slots — no two slots share a point", () => {
    const target = syntheticBase(2400);
    const a = assignByPolarRank(base, target, COUNT);
    const seen = new Set<string>();
    for (let i = 0; i < COUNT; i++) {
      seen.add(`${a[i * 3]},${a[i * 3 + 1]},${a[i * 3 + 2]}`);
    }
    expect(seen.size).toBe(COUNT);
  });

  it("the split sits between the base's ring and the monogram's reach", () => {
    expect(PAIR_SPLIT_RADIUS).toBeGreaterThan(0.36);
    expect(PAIR_SPLIT_RADIUS).toBeLessThan(0.444);
  });
});

describe("buildTarget — the client's mark as a wireframe in the parked mark's space", () => {
  const COUNT = 1200;
  const base = syntheticBase(COUNT);
  const target = buildTarget(base, COUNT);

  it("returns one finite target per slot on the same 0.5 half-extent", () => {
    expect(target).toHaveLength(COUNT * 3);
    let maxXY = 0;
    let maxZ = 0;
    for (let i = 0; i < COUNT; i++) {
      const x = target[i * 3];
      const y = target[i * 3 + 1];
      const z = target[i * 3 + 2];
      expect(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)).toBe(true);
      maxXY = Math.max(maxXY, Math.abs(x), Math.abs(y));
      maxZ = Math.max(maxZ, Math.abs(z));
    }
    expect(maxXY).toBeLessThanOrEqual(0.5 + 1e-6);
    expect(maxXY).toBeGreaterThan(0.47);
    // Extruded to the base's own depth (±0.05 here), so the two wireframes
    // are one material in Z.
    expect(maxZ).toBeGreaterThan(0.035);
    expect(maxZ).toBeLessThan(0.075);
  });

  it("keeps every slot in its class — ring to ring, bars to the monogram", () => {
    let ring = 0;
    for (let i = 0; i < COUNT; i++) {
      const cls = classifyRadius(base[i * 3], base[i * 3 + 1]);
      expect(classifyRadius(target[i * 3], target[i * 3 + 1])).toBe(cls);
      if (cls === MARK_CLASS_RING) ring++;
    }
    // The synthetic base is 55 % ring by construction.
    expect(ring / COUNT).toBeGreaterThan(0.5);
    expect(ring / COUNT).toBeLessThan(0.62);
  });

  it("is deterministic", () => {
    expect(Array.from(buildTarget(base, COUNT))).toEqual(Array.from(target));
  });
});

describe("turnClock", () => {
  const VH = 1000;
  const HEIGHT = VH + 1200;

  it("progress runs 0 → 1 from the top's arrival to the runway's end, monotone", () => {
    expect(turnRunway(HEIGHT, VH)).toBe(1200);
    expect(turnProgress(VH, HEIGHT, VH)).toBe(0);
    expect(turnProgress(VH + 300, HEIGHT, VH)).toBe(0);
    expect(turnProgress(-1200, HEIGHT, VH)).toBe(1);
    expect(turnProgress(-2000, HEIGHT, VH)).toBe(1);
    let last = -1;
    for (let top = VH; top >= -1200; top -= 25) {
      const p = turnProgress(top, HEIGHT, VH);
      expect(p).toBeGreaterThanOrEqual(last);
      last = p;
    }
    // The stage pins at top 0 — inside the window, so the first flight
    // happens while the last card is still leaving.
    expect(turnProgress(0, HEIGHT, VH)).toBeCloseTo(VH / (VH + 1200), 6);
  });

  it("the particle morph opens after the last card has cleared the mark and settles before the products", () => {
    expect(morphOf(0)).toBe(0);
    expect(morphOf(TURN_MORPH_START)).toBe(0);
    expect(morphOf((TURN_MORPH_START + TURN_MORPH_END) / 2)).toBeCloseTo(0.5, 6);
    expect(morphOf(TURN_MORPH_END)).toBe(1);
    expect(morphOf(1)).toBe(1);
    expect(productEnter(0, TURN_MORPH_START)).toBe(0);
    expect(productEnter(3, 1)).toBe(1);
    // Later products enter later.
    for (let k = 1; k < 4; k++)
      expect(productEnter(k, 0.6)).toBeLessThanOrEqual(productEnter(k - 1, 0.6));
  });

  it("a product settles exactly on its rest and starts far out, invisible", () => {
    const rest = { cx: 300, cy: 200 };
    const settled = productPose(0, 1, rest, 1600, 1000);
    expect(Math.abs(settled.dx)).toBeLessThan(1e-9);
    expect(Math.abs(settled.dy)).toBeLessThan(6 + 1e-9); // the bounded drift
    expect(settled.dr).toBe(0);
    expect(settled.scale).toBe(1);
    expect(settled.opacity).toBe(1);
    const far = productPose(0, 0, rest, 1600, 1000);
    expect(far.opacity).toBe(0);
    expect(far.scale).toBeCloseTo(0.7, 6);
    expect(Math.hypot(far.dx, far.dy)).toBeGreaterThan(300);
    // The two flights alternate direction.
    const farOdd = productPose(1, 0, rest, 1600, 1000);
    expect(Math.sign(far.dr)).toBe(-Math.sign(farOdd.dr));
  });

  it("the mark's on-stage centre is the actor's weld, re-derived from its sources", () => {
    const actor = readFileSync(ACTOR, "utf8");
    const geom = readFileSync(SCENE_GEOM, "utf8");
    const dist = Number(actor.match(/^const CENTER_DISTANCE = ([\d.]+);/m)?.[1]);
    const off = Number(actor.match(/^const CENTER_Y_OFFSET = ([\d.]+);/m)?.[1]);
    const fov = Number(geom.match(/^export const CAMERA_FOV = ([\d.]+);/m)?.[1]);
    expect(Number.isFinite(dist) && Number.isFinite(off) && Number.isFinite(fov)).toBe(true);
    const derived = 0.5 + off / (2 * dist * Math.tan((fov * Math.PI) / 360));
    expect(Math.abs(derived - TURN_MARK_CENTER_Y)).toBeLessThan(0.005);
  });
});

describe("the turn's ground and the mark it puts away", () => {
  it("the wash swells and RESOLVES — the beat ends on the page's own ground", () => {
    // ADR-095 U1: the first cut slid an opaque slab up over the stage and the
    // owner rejected it. Nothing covers the turn now, so the wash has to come
    // back to nothing by the end or the seam it avoided would just move.
    expect(washOf(0)).toBe(0);
    expect(washOf(0.3)).toBe(0);
    expect(washOf(0.7)).toBeCloseTo(1, 5);
    expect(washOf(0.85)).toBeCloseTo(1, 5);
    expect(washOf(1)).toBe(0);
    let peak = 0;
    for (let p = 0; p <= 1.0001; p += 0.01) peak = Math.max(peak, washOf(p));
    expect(peak).toBeCloseTo(1, 5);
  });

  it("the mark is veiled back, never all the way out", () => {
    expect(veilOf(0)).toBe(0);
    expect(veilOf(0.5)).toBe(0);
    expect(veilOf(1)).toBeCloseTo(TURN_VEIL_MAX, 5);
    expect(TURN_VEIL_MAX).toBeLessThan(1);
    // It gets out of the copy's way BEFORE the copy arrives.
    expect(veilOf(0.72)).toBeGreaterThan(veilOf(0.6));
    expect(ctaInOf(0.6)).toBe(0);
  });

  it("the copy types in, holds lit, then un-types — two clocks, never overlapping", () => {
    expect(ctaInOf(0.5)).toBe(0);
    expect(ctaInOf(0.78)).toBeCloseTo(1, 5);
    expect(ctaOutOf(0.85)).toBe(0);
    expect(ctaOutOf(1)).toBeCloseTo(1, 5);
    // The hold: fully lit and not yet leaving.
    expect(ctaInOf(0.84)).toBeCloseTo(1, 5);
    expect(ctaOutOf(0.84)).toBe(0);
  });
});

describe("turnDecodeFrame — the scrubbed decode", () => {
  const FINALS = [
    "Trinny London · The proposal",
    "AI-first, inside Trinny London.",
    "What Loop Earplugs owns now, built for the people who run Trinny London.",
    "The configuration",
  ] as const;
  const rand = () => 0.5;
  const resolved = (out: string, final: string) => {
    let n = 0;
    for (let i = 0; i < final.length; i++) if (out[i] === final[i]) n++;
    return n;
  };

  it("holds every line's LENGTH while it decodes — the geometry cannot change", () => {
    for (let p = 0; p <= 1.0001; p += 0.02) {
      for (let i = 0; i < FINALS.length; i++) {
        const out = turnDecodeFrame(FINALS, i, p, 0, rand);
        // Either not started (the ghost alone holds the box) or full length.
        expect(out.length === 0 || out.length === FINALS[i].length).toBe(true);
      }
    }
  });

  it("resolves monotonically forward and dissolves monotonically back", () => {
    for (let i = 0; i < FINALS.length; i++) {
      let last = -1;
      for (let p = 0; p <= 1.0001; p += 0.02) {
        const n = resolved(turnDecodeFrame(FINALS, i, p, 0, rand), FINALS[i]);
        expect(n).toBeGreaterThanOrEqual(last);
        last = n;
      }
      // ⚠ The dissolve CONTRACTS: a resolved character becomes nothing, so
      // the string shortens from the left (the kernel's own documented
      // behaviour) and its LENGTH is the monotone measure, not a per-index
      // match — a scramble glyph can coincide with the final character.
      let prev = Infinity;
      for (let p = 0; p <= 1.0001; p += 0.02) {
        const n = turnDecodeFrame(FINALS, i, 1, p, rand).length;
        expect(n).toBeLessThanOrEqual(prev);
        prev = n;
      }
    }
  });

  it("every line is blank at the start, lit together at the end, gone after the out", () => {
    for (let i = 0; i < FINALS.length; i++) {
      expect(turnDecodeFrame(FINALS, i, 0, 0, rand)).toBe("");
      expect(turnDecodeFrame(FINALS, i, 1, 0, rand)).toBe(FINALS[i]);
      expect(turnDecodeFrame(FINALS, i, 1, 1, rand)).toBe("");
      // The un-type runs last line FIRST — the block empties from the bottom.
      const early = 0.3;
      const bottom = turnDecodeFrame(FINALS, FINALS.length - 1, 1, early, rand).length;
      const top = turnDecodeFrame(FINALS, 0, 1, early, rand).length;
      expect(bottom / FINALS[3].length).toBeLessThan(top / FINALS[0].length);
    }
  });

  it("never scrambles whitespace, and is deterministic for a given random", () => {
    for (let p = 0.62; p < 1; p += 0.05) {
      const out = turnDecodeFrame(FINALS, 2, p, 0, rand);
      if (!out) continue;
      for (let i = 0; i < FINALS[2].length; i++) {
        if (FINALS[2][i] === " ") expect(out[i]).toBe(" ");
      }
      expect(turnDecodeFrame(FINALS, 2, p, 0, rand)).toBe(out);
    }
  });
});
