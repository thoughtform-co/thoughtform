import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  RACK_DEPTH,
  RACK_ORIGIN,
  rackClock,
  rackIndex,
  rackPose,
  rackSlot,
  wrapDistance,
} from "@/lib/musings/rackMath";
import { beatOf, coverSpec, slugSeed, yearFraction } from "@/lib/musings/cover";

/**
 * The jukebox's arithmetic (ADR-119).
 *
 * The rack is CSS 3D driven by a scroll writer, so nothing here can be seen
 * by a DOM guard until it is already on screen — which is exactly the shape
 * of defect this house keeps finding late (ADR-069 U1: the guard measured a
 * silhouette; ADR-070 U34: the guard measured a model of the drawing). So the
 * geometry is pure and it is checked here, and the smoke checks what the
 * browser does with it.
 */

const N = 5;

describe("wrapDistance", () => {
  it("is zero on the front card and signed either side", () => {
    expect(wrapDistance(2, 2, N)).toBe(0);
    expect(wrapDistance(1, 2, N)).toBe(-1);
    expect(wrapDistance(3, 2, N)).toBe(1);
  });

  it("wraps, so the rack is a loop and not a strip with two ends", () => {
    expect(wrapDistance(0, 4, N)).toBe(1);
    expect(wrapDistance(4, 0, N)).toBe(-1);
  });

  it("never exceeds half the rack in either direction", () => {
    for (let n = 1; n <= 12; n++)
      for (let a = 0; a < n; a++)
        for (let i = 0; i < n; i++)
          expect(Math.abs(wrapDistance(i, a, n))).toBeLessThanOrEqual(n / 2);
  });

  it("resolves the even-count tie one way, so a pose is a pure function of (i, active)", () => {
    // 6 cards: card 3 is equidistant from card 0 both ways.
    expect(wrapDistance(3, 0, 6)).toBe(3);
    expect(wrapDistance(0, 3, 6)).toBe(-3);
  });

  it("is safe at zero cards", () => {
    expect(wrapDistance(0, 0, 0)).toBe(0);
  });
});

describe("rackSlot", () => {
  it("faces the front card at the reader and brings it forward", () => {
    const front = rackSlot(0);
    expect(front.rotY).toBe(0);
    expect(front.xPercent).toBe(0);
    expect(front.scale).toBe(1);
    expect(front.opacity).toBe(1);
    expect(front.z).toBeGreaterThan(0);
    expect(front.dim).toBe(1);
  });

  it("angles the side cards TOWARD the centre", () => {
    // A card seated left (d < 0) rotates POSITIVE about Y, bringing its right
    // edge forward. Flip this and the rack fans away from the reader.
    const left = rackSlot(-1);
    const right = rackSlot(1);
    expect(left.xPercent).toBeLessThan(0);
    expect(left.rotY).toBeGreaterThan(0);
    expect(right.xPercent).toBeGreaterThan(0);
    expect(right.rotY).toBeLessThan(0);
  });

  it("is symmetric about the front card", () => {
    for (let a = 1; a <= RACK_DEPTH + 1; a++) {
      const l = rackSlot(-a);
      const r = rackSlot(a);
      expect(l.xPercent).toBeCloseTo(-r.xPercent, 10);
      expect(l.rotY).toBeCloseTo(-r.rotY, 10);
      expect(l.z).toBe(r.z);
      expect(l.scale).toBe(r.scale);
      expect(l.opacity).toBe(r.opacity);
      expect(l.zIndex).toBe(r.zIndex);
    }
  });

  it("recedes monotonically: further back, smaller, dimmer, lower", () => {
    const run = [0, 1, 2, 3].map((d) => rackSlot(d));
    for (let i = 1; i < run.length; i++) {
      expect(run[i].z).toBeLessThan(run[i - 1].z);
      expect(run[i].scale).toBeLessThan(run[i - 1].scale);
      expect(run[i].opacity).toBeLessThanOrEqual(run[i - 1].opacity);
      expect(Math.abs(run[i].rotY)).toBeGreaterThanOrEqual(Math.abs(run[i - 1].rotY));
      expect(run[i].zIndex).toBeLessThan(run[i - 1].zIndex);
    }
  });

  it("draws RACK_DEPTH cards either side and parks the rest at zero", () => {
    // The whole point of the lift's one real change: the archived drawing
    // handled |d| <= 1 and parked everything else, which is a triptych. A
    // rack is what the owner asked for.
    for (let a = 0; a <= RACK_DEPTH; a++) expect(rackSlot(a).opacity).toBeGreaterThan(0);
    expect(rackSlot(RACK_DEPTH + 1).opacity).toBe(0);
    expect(RACK_DEPTH).toBe(2);
  });

  it("parks a hidden card on the side it left on, so it travels in rather than fading in", () => {
    expect(Math.sign(rackSlot(-3).xPercent)).toBe(-1);
    expect(Math.sign(rackSlot(3).xPercent)).toBe(1);
  });
});

describe("rackPose", () => {
  it("starts every card on the stacked plane", () => {
    const p = rackPose(0, 0, 0);
    expect(p.transform).toContain(`translateZ(${RACK_ORIGIN.z.toFixed(1)}px)`);
    expect(p.transform).toContain(`scale(${RACK_ORIGIN.scale.toFixed(3)})`);
    expect(p.opacity).toBe(0);
  });

  it("lands every drawn card on its slot once both clocks are spent", () => {
    for (let d = -RACK_DEPTH; d <= RACK_DEPTH; d++) {
      const slot = rackSlot(d);
      const p = rackPose(d, 1, 1);
      expect(p.transform).toContain(`translateX(${slot.xPercent.toFixed(2)}%)`);
      expect(p.transform).toContain(`translateZ(${slot.z.toFixed(1)}px)`);
      expect(p.transform).toContain(`rotateY(${slot.rotY.toFixed(2)}deg)`);
      expect(p.transform).toContain(`scale(${slot.scale.toFixed(3)})`);
      expect(p.opacity).toBeCloseTo(slot.opacity, 6);
      expect(p.zIndex).toBe(slot.zIndex);
    }
  });

  it("seats the front card on entry alone — the fan opens the rack around it", () => {
    const shut = rackPose(0, 1, 0);
    const open = rackPose(0, 1, 1);
    expect(shut.transform).toBe(open.transform);
    expect(shut.opacity).toBeCloseTo(open.opacity, 6);
    // ...while a side card is still stacked with the fan shut.
    expect(rackPose(1, 1, 0).opacity).toBe(0);
  });

  it("carries no filter once a card has arrived at the front", () => {
    expect(rackPose(0, 1, 1).filter).toBe("none");
    expect(rackPose(1, 1, 1).filter).toMatch(/^brightness\(/);
  });

  it("is continuous in both clocks", () => {
    for (let d = -RACK_DEPTH; d <= RACK_DEPTH; d++) {
      let prev = rackPose(d, 0, 0).opacity;
      for (let i = 1; i <= 200; i++) {
        const t = i / 200;
        const o = rackPose(d, t, t).opacity;
        expect(Math.abs(o - prev)).toBeLessThan(0.06);
        prev = o;
      }
    }
  });

  it("clamps out-of-range clocks rather than extrapolating", () => {
    expect(rackPose(0, 2, 2).transform).toBe(rackPose(0, 1, 1).transform);
    expect(rackPose(0, -1, -1).transform).toBe(rackPose(0, 0, 0).transform);
  });
});

describe("rackIndex — the detent", () => {
  it("rounds to a whole card, per the owner's ruling", () => {
    expect(rackIndex(0.49, N)).toBe(0);
    expect(rackIndex(0.5, N)).toBe(1);
    expect(rackIndex(2.7, N)).toBe(3);
  });

  it("stays inside the rack", () => {
    expect(rackIndex(-3, N)).toBe(0);
    expect(rackIndex(99, N)).toBe(N - 1);
    expect(rackIndex(0, 0)).toBe(0);
  });
});

describe("rackClock", () => {
  it("rests shut at the top of the runway and open at its end", () => {
    const a = rackClock(0, N);
    expect(a.entry).toBe(0);
    expect(a.fan).toBe(0);
    expect(a.index).toBe(0);
    const b = rackClock(1, N);
    expect(b.entry).toBe(1);
    expect(b.fan).toBe(1);
    expect(b.index).toBeCloseTo(N - 1, 6);
  });

  it("assembles before it fans, and fans before it reads", () => {
    // The beat has to be one object arriving, then a rack opening, then a
    // reader flipping through it — in that order, or it reads as a jumble.
    const mid = rackClock(0.14, N);
    expect(mid.entry).toBeGreaterThan(0.5);
    expect(mid.fan).toBeLessThan(0.7);
    expect(rackIndex(mid.index, N)).toBe(0);
  });

  it("gives every card a whole step of the reading band", () => {
    const seen = new Set<number>();
    for (let i = 0; i <= 1000; i++) seen.add(rackIndex(rackClock(i / 1000, N).index, N));
    expect([...seen].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
  });

  it("advances monotonically", () => {
    let prev = -1;
    for (let i = 0; i <= 1000; i++) {
      const idx = rackClock(i / 1000, N).index;
      expect(idx).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = idx;
    }
  });

  it("holds the drift inside the lift's own few degrees", () => {
    for (let i = 0; i <= 200; i++)
      expect(Math.abs(rackClock(i / 200, N).drift)).toBeLessThanOrEqual(3.0001);
  });

  it("is safe at one card", () => {
    const c = rackClock(0.6, 1);
    expect(c.index).toBe(0);
    expect(rackIndex(c.index, 1)).toBe(0);
  });
});

describe("cover — the drawn record", () => {
  it("reads the beat off the tags in the ARC's order, not the author's", () => {
    expect(beatOf(["navigate", "practice"])).toBe("navigate");
    expect(beatOf(["practice", "encode"])).toBe("encode");
    expect(beatOf(["build", "practice"])).toBe("build");
    // Two beats: the earlier one wins, deterministically either way round.
    expect(beatOf(["build", "navigate"])).toBe("navigate");
    expect(beatOf(["navigate", "build"])).toBe("navigate");
  });

  it("draws no glyph for a post with no Arc tag", () => {
    expect(beatOf(["practice"])).toBeNull();
    expect(beatOf([])).toBeNull();
    expect(coverSpec({ slug: "x", date: "2026-01-01", tags: ["practice"] }).beat).toBeNull();
  });

  it("is case-insensitive on the tag", () => {
    expect(beatOf(["Encode"])).toBe("encode");
  });

  it("seeds stably from the slug", () => {
    expect(slugSeed("navigate-the-intelligence")).toBe(slugSeed("navigate-the-intelligence"));
    expect(slugSeed("a")).not.toBe(slugSeed("b"));
    for (const s of ["a", "b", "encode-the-context", ""]) {
      const v = slugSeed(s);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("plots the date from the STRING, so no reader's time zone moves the mark", () => {
    expect(yearFraction("2026-01-01")).toBeCloseTo(0.5 / 365, 4);
    expect(yearFraction("2026-12-31")).toBeCloseTo(364.5 / 365, 4);
    expect(yearFraction("2026-07-02")).toBeCloseTo(0.5, 2);
    // A leap year divides by 366 and shifts everything past February.
    expect(yearFraction("2024-03-01")).toBeCloseTo(60.5 / 366, 4);
    expect(yearFraction("2026-03-01")).toBeCloseTo(59.5 / 365, 4);
  });

  it("falls back to the middle on an unparseable date rather than throwing", () => {
    expect(yearFraction("nonsense")).toBe(0.5);
  });

  it("seats every mark clear of the box's own edges", () => {
    for (const date of ["2026-01-01", "2026-06-15", "2026-12-31"]) {
      const spec = coverSpec({ slug: "s", date, tags: ["encode"] });
      expect(spec.markX).toBeGreaterThanOrEqual(14);
      expect(spec.markX).toBeLessThanOrEqual(86);
      for (const g of spec.ghostX) {
        expect(g).toBeGreaterThan(6);
        expect(g).toBeLessThan(94);
      }
      expect(spec.pitch).toBeGreaterThanOrEqual(9);
      expect(spec.pitch).toBeLessThanOrEqual(15);
    }
  });

  it("gives two posts of one beat different substrates", () => {
    const a = coverSpec({
      slug: "navigate-the-intelligence",
      date: "2026-09-14",
      tags: ["navigate"],
    });
    const b = coverSpec({ slug: "encode-the-context", date: "2026-09-07", tags: ["encode"] });
    expect(a.markX).not.toBeCloseTo(b.markX, 3);
  });
});

describe("the rung is mirrored by hand, so pin it", () => {
  const ROOT = join(__dirname, "..", "..");
  const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

  const HOOK = "components/landing/home-v2/musings/useMusingsScroll.ts";
  const SHEET = "components/landing/home-v2/musings/musings.css";
  const RUNG = "(min-width: 961px) and (prefers-reduced-motion: no-preference)";

  it("the writer and the sheet name the SAME query", () => {
    // A writer and a sheet that disagree about the rung is a rack posed in 3D
    // inside a box laid out as a flat rail, or a flat rail whose cards have
    // been given absolute seats. Neither errors and neither is visible in a
    // still taken at the other rung.
    expect(read(HOOK)).toContain(`MUSINGS_RACK_MEDIA = "${RUNG}"`);
    expect(read(SHEET)).toContain(`@media ${RUNG} {`);
  });

  it("the sheet gates every 3D rule on BOTH the rung and the stamp", () => {
    // `an absent stamp means shown` is the house's polarity law: the rest
    // state is the rail, which is what a phone, a reduced-motion reader and a
    // page whose script never ran all get. A `perspective` outside the
    // stamp's scope would pose nothing and clip everything.
    const sheet = read(SHEET);
    const rung = sheet.slice(sheet.indexOf(`@media ${RUNG} {`));
    for (const decl of ["perspective:", "transform-style: preserve-3d"])
      expect(rung).toContain(decl);
    for (const line of sheet.split("\n")) {
      if (!/perspective:|position: absolute/.test(line)) continue;
      // Every such rule inside the rung block is written against the stamp.
      if (rung.includes(line)) expect(rung).toContain("[data-mu-ready]");
    }
  });

  it("the writer clears the footer's stamp on every path that stops writing", () => {
    // ⚠ `#contact` is `position: sticky; bottom: 0` while `data-ft-reveal` is
    // present, and a sticky-bottom box is pulled UP to the frame's floor from
    // anywhere above its seat — so an armed stamp with no writer paints the
    // whole footer through the transparent era stage. Three exits have to
    // clear it: the inert rung, unmount, and scrolling back above the rack.
    const hook = read(HOOK);
    const clears = hook.match(/removeAttribute\("data-ft-reveal"\)/g) ?? [];
    expect(clears.length).toBeGreaterThanOrEqual(3);
    expect(hook).toContain('setAttribute("data-ft-reveal"');
  });

  it("the writer holds no per-frame React state", () => {
    // ADR-002: one writer, CSS custom properties. The drawing this rack is
    // lifted from called `setState` in its rAF on every scroll event — a
    // re-render across every card, every frame, on a page running a WebGL
    // corridor two stations up. The detent is the ONLY thing that may.
    const hook = read(HOOK);
    const sets = hook.match(/setState\(/g) ?? [];
    // Two in `park()` (the front reset and the `live` flag) and two on the
    // live path, all four behind a CHANGED check.
    expect(sets.length).toBeLessThanOrEqual(4);
    expect(hook).toContain("frontRef");
  });
});
