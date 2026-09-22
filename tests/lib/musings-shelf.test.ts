import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { coordStamp as arcCoordStamp } from "@/components/arcs/chrome";
import { beatOf, coverSpec, slugSeed, yearFraction } from "@/lib/musings/cover";
import {
  MUSINGS_COORDS,
  MUSINGS_MASTHEAD,
  MUSINGS_TITLE_TEXT,
  coordStamp,
} from "@/lib/musings/mastheadData";
import {
  SHELF_GAP_PX,
  SHELF_SPINE_PX,
  SHELF_ARRIVE_END,
  SHELF_ARRIVE_IN,
  SHELF_ARRIVE_OUT,
  SHELF_TURN,
  shelfClock,
  shelfGeom,
  shelfHinges,
  shelfIndex,
  shelfOffset,
  shelfPose,
  shelfArrive,
  shelfWidth,
  typedCount,
} from "@/lib/musings/shelfMath";

/**
 * The shelf's arithmetic (ADR-119 U1).
 *
 * The shelf is CSS 3D driven by a scroll writer, so nothing here can be seen
 * by a DOM guard until it is already on screen — which is exactly the shape
 * of defect this house keeps finding late (ADR-069 U1: the guard measured a
 * silhouette; ADR-070 U34: the guard measured a model of the drawing). So the
 * geometry is pure and it is checked here, and the smoke checks what the
 * browser does with it.
 */

const N = 5;
const G = shelfGeom(360);

describe("shelfHinges — the track", () => {
  it("starts at the origin and gives the open slab a full face", () => {
    const xs = shelfHinges(N, 0, G);
    expect(xs[0]).toBe(0);
    expect(xs[1]).toBe(G.w + G.gap);
    // Every slab after the open one is a spine's width apart.
    expect(xs[2] - xs[1]).toBe(G.spine + G.gap);
    expect(xs[4] - xs[3]).toBe(G.spine + G.gap);
  });

  it("widens wherever the open slab is, and only there", () => {
    const xs = shelfHinges(N, 2, G);
    expect(xs[1] - xs[0]).toBe(G.spine + G.gap);
    expect(xs[3] - xs[2]).toBe(G.w + G.gap);
    expect(xs[4] - xs[3]).toBe(G.spine + G.gap);
  });

  it("is the same total width whichever slab is open", () => {
    // The shelf re-flows; it does not grow. A track whose length depended on
    // the open card would slide the whole beat sideways every detent, on top
    // of the slide the reader is meant to see.
    for (let open = 0; open < N; open++) {
      const xs = shelfHinges(N, open, G);
      const end = xs[N - 1] + (N - 1 === open ? G.w : G.spine);
      expect(end).toBeCloseTo(shelfWidth(N, G), 9);
    }
  });

  it("is safe at one slab and at none", () => {
    expect(shelfHinges(1, 0, G)).toEqual([0]);
    expect(shelfHinges(0, 0, G)).toEqual([]);
    expect(shelfWidth(0, G)).toBe(0);
    expect(shelfWidth(1, G)).toBe(G.w);
  });
});

describe("shelfOffset — the slide", () => {
  it("stands the shelf still and walks the open slab along it", () => {
    // ⚠ The shelf does not slide past the reader — a row of records does not
    // move when you pull one out. The first slab's hinge is the shelf's left
    // end whichever slab is open, and the OPEN one walks right by one spine
    // pitch per step.
    for (let open = 0; open < N; open++) expect(shelfOffset(0, N, open, G)).toBe(0);
    for (let open = 1; open < N; open++) {
      expect(shelfOffset(open, N, open, G) - shelfOffset(open - 1, N, open - 1, G)).toBeCloseTo(
        G.spine + G.gap,
        9
      );
    }
  });

  it("keeps the open slab's travel inside the editorial band", () => {
    // At the registry's ceiling the furthest seat is (max − 1) × pitch, which
    // has to fit the band beside the face itself.
    const MAX = 7;
    const far = shelfOffset(MAX - 1, MAX, MAX - 1, G);
    expect(far).toBeCloseTo((MAX - 1) * (G.spine + G.gap), 9);
    expect(far + G.w).toBeLessThan(1200);
  });

  it("seats every other slab in track order, left to right", () => {
    for (let open = 0; open < N; open++) {
      let prev = -Infinity;
      for (let i = 0; i < N; i++) {
        const x = shelfOffset(i, N, open, G);
        expect(x).toBeGreaterThan(prev);
        prev = x;
      }
    }
  });

  it("never overlaps two slabs, at any open index", () => {
    // ⚠ THE EXTENT IS WHAT THE READER SEES OF A SLAB — a face where it is
    // open, a spine everywhere else. A model that gave every slab a face's
    // width would report gaps the drawing does not have.
    for (let open = 0; open < N; open++) {
      for (let i = 0; i < N - 1; i++) {
        const a = shelfOffset(i, N, open, G) + (i === open ? G.w : G.spine);
        const b = shelfOffset(i + 1, N, open, G);
        expect(b - a).toBeCloseTo(G.gap, 9);
      }
    }
  });

  it("clamps rather than throwing on an index outside the shelf", () => {
    expect(shelfOffset(-2, N, 0, G)).toBe(shelfOffset(0, N, 0, G));
    expect(shelfOffset(99, N, 0, G)).toBe(shelfOffset(N - 1, N, 0, G));
    expect(shelfOffset(0, 0, 0, G)).toBe(0);
  });
});

describe("shelfPose", () => {
  it("has exactly TWO angles, and that is the whole difference from a fan", () => {
    // The owner: the posts not in view are "rotated 90° so we see the side".
    // A rack has every card at its own angle; a shelf has open and closed.
    for (let open = 0; open < N; open++) {
      const turns = new Set<number>();
      for (let i = 0; i < N; i++) turns.add(shelfPose(i, N, open, G).turn);
      expect([...turns].sort((a, b) => a - b)).toEqual([0, SHELF_TURN]);
    }
    expect(SHELF_TURN).toBe(90);
  });

  it("turns AWAY from the reader", () => {
    // `rotateY(+90)` maps the face's +x to −z, i.e. into the scene. At −90
    // the face swings toward the reader and, under the rig's perspective,
    // reaches over its neighbour on the way across.
    expect(shelfPose(1, N, 0, G).transform).toContain("rotateY(90deg)");
    expect(shelfPose(1, N, 0, G).transform).not.toContain("rotateY(-90deg)");
  });

  it("rotates LAST, so the slide runs along the shelf and not into it", () => {
    const t = shelfPose(3, N, 0, G).transform;
    expect(t.indexOf("translateX")).toBeLessThan(t.indexOf("rotateY"));
    expect(t.indexOf("translateY")).toBeLessThan(t.indexOf("translateX"));
  });

  it("paints the open slab over its neighbours", () => {
    // Nothing overlaps at rest, but a slab mid-turn sweeps through the space
    // beside it — which is exactly when the reader is looking.
    const open = shelfPose(2, N, 2, G);
    expect(open.zIndex).toBeGreaterThan(shelfPose(1, N, 2, G).zIndex);
    expect(open.zIndex).toBeGreaterThan(shelfPose(3, N, 2, G).zIndex);
  });

  it("emits a transform the writer can assign verbatim", () => {
    expect(shelfPose(0, N, 0, G).transform).toBe(
      "translateY(-50%) translateX(0.00px) rotateY(0deg)"
    );
    expect(shelfPose(1, N, 0, G).transform).toBe(
      `translateY(-50%) translateX(${(G.w + G.gap).toFixed(2)}px) rotateY(90deg)`
    );
  });
});

describe("shelfIndex — the detent", () => {
  it("rounds to a whole slab, per the owner's ruling", () => {
    expect(shelfIndex(0.49, N)).toBe(0);
    expect(shelfIndex(0.5, N)).toBe(1);
    expect(shelfIndex(2.7, N)).toBe(3);
  });

  it("stays on the shelf", () => {
    expect(shelfIndex(-3, N)).toBe(0);
    expect(shelfIndex(99, N)).toBe(N - 1);
    expect(shelfIndex(0, 0)).toBe(0);
  });
});

describe("shelfClock", () => {
  it("rests shut at the top of the runway and open at its end", () => {
    const a = shelfClock(0, N);
    expect(a.entry).toBe(0);
    expect(a.index).toBe(0);
    const b = shelfClock(1, N);
    expect(b.entry).toBe(1);
    expect(b.index).toBeCloseTo(N - 1, 6);
  });

  it("arrives before it reads", () => {
    // The owner's own order: the era empties, the head decodes, THEN the
    // cards come into view. The shelf may not start stepping under a head
    // that is still resolving.
    const mid = shelfClock(0.14, N);
    expect(mid.entry).toBeGreaterThan(0.5);
    expect(shelfIndex(mid.index, N)).toBe(0);
  });

  it("gives every slab a whole step of the reading band", () => {
    const seen = new Set<number>();
    for (let i = 0; i <= 1000; i++) seen.add(shelfIndex(shelfClock(i / 1000, N).index, N));
    expect([...seen].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
  });

  it("advances monotonically", () => {
    let prev = -1;
    for (let i = 0; i <= 1000; i++) {
      const idx = shelfClock(i / 1000, N).index;
      expect(idx).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = idx;
    }
  });

  it("holds the yaw STILL once the beat has arrived", () => {
    // ⚠ A drift that tracked the reading position would swing the whole
    // shelf every time a slab turned — two motions on one gesture, and the
    // one the reader is following is the smaller of the two.
    const a = shelfClock(0.4, N).drift;
    for (let i = 0.4; i <= 1; i += 0.02) expect(shelfClock(i, N).drift).toBeCloseTo(a, 9);
    for (let i = 0; i <= 200; i++)
      expect(Math.abs(shelfClock(i / 200, N).drift)).toBeLessThanOrEqual(4.0001);
  });

  it("is safe at one slab", () => {
    const c = shelfClock(0.6, 1);
    expect(c.index).toBe(0);
    expect(shelfIndex(c.index, 1)).toBe(0);
  });
});

describe("shelfArrive — the bounded burst", () => {
  it("opens AFTER the head has resolved, never with it", () => {
    // The owner's order: the text appears with a glitch effect, THEN the cards
    // come into view. `SHELF_HEAD_IN` closes at 0.24.
    expect(SHELF_ARRIVE_IN).toBeGreaterThan(0.24);
    expect(shelfClock(SHELF_ARRIVE_IN, N).head).toBeCloseTo(1, 6);
  });

  it("holds the shelf open past the reading band's own end", () => {
    // A shelf that shut while the last slab was being read would take the
    // reading away to play an animation.
    expect(SHELF_ARRIVE_END).toBeGreaterThan(0.94);
    expect(shelfArrive("in", 0.94)).toBe("in");
  });

  it("is a hysteresis, so resting on the edge does not re-trigger it", () => {
    expect(SHELF_ARRIVE_OUT).toBeLessThan(SHELF_ARRIVE_IN);
    expect(shelfArrive("in", (SHELF_ARRIVE_IN + SHELF_ARRIVE_OUT) / 2)).toBe("in");
    expect(shelfArrive("await", (SHELF_ARRIVE_IN + SHELF_ARRIVE_OUT) / 2)).toBe("await");
  });

  it("closes on the way back and on the way past, and re-opens either way", () => {
    expect(shelfArrive("in", 0.1)).toBe("out");
    expect(shelfArrive("in", 0.99)).toBe("out");
    expect(shelfArrive("out", 0.5)).toBe("in");
  });

  it("keeps `await` and `out` APART", () => {
    // ⚠ Both paint nothing, but `out` plays the close and `await` has never
    // been seen — collapsing them shuts the shelf on the way IN.
    expect(shelfArrive("await", 0.1)).toBe("await");
    expect(shelfArrive("await", 0.99)).toBe("await");
    expect(shelfArrive("out", 0.1)).toBe("out");
  });

  it("seeds `in` on a deep reload past the threshold, never `await`", () => {
    // Landing mid-beat plays the arrival once and ends on the cascade, which
    // is what the reader would have seen had they scrolled to it.
    expect(shelfArrive(null, 0.5)).toBe("in");
    expect(shelfArrive(null, 0)).toBe("await");
  });

  it("leaves the state alone on a non-finite reading", () => {
    // A rect read during a relayout hands this NaN, and the one thing a burst
    // must never do is fire because a measurement was briefly unavailable.
    expect(shelfArrive("await", Number.NaN)).toBe("await");
    expect(shelfArrive("in", Number.POSITIVE_INFINITY)).toBe("in");
  });
});

describe("the masthead", () => {
  it("carries the two designations, one state chip and a two-line title", () => {
    // The services masthead's own anatomy: one gold survey element, the em on
    // the SECOND line. More than one gold thing is the ration broken.
    expect(MUSINGS_MASTHEAD.titleLines).toHaveLength(2);
    expect(MUSINGS_MASTHEAD.titleLines.filter((l) => l.em)).toHaveLength(1);
    expect(MUSINGS_MASTHEAD.titleLines[1].em).toBe(true);
    expect(MUSINGS_MASTHEAD.state).toBe("OPEN");
  });

  it("authors every display string UPPERCASE, because the sheet transforms none", () => {
    // ⚠ ADR-092: `text-transform: uppercase` on a PP Neue Montreal element is
    // a finding the type ratchet fails, so the case lives in the record — the
    // way `SERVICES_MASTHEAD` carries its own.
    for (const line of MUSINGS_MASTHEAD.titleLines) expect(line.text).toBe(line.text.toUpperCase());
    expect(MUSINGS_MASTHEAD.desigTitle).toBe(MUSINGS_MASTHEAD.desigTitle.toUpperCase());
    expect(MUSINGS_MASTHEAD.desigBrief).toBe(MUSINGS_MASTHEAD.desigBrief.toUpperCase());
    // The brief is PROSE and stays sentence case — it is the one run that types.
    expect(MUSINGS_MASTHEAD.brief).not.toBe(MUSINGS_MASTHEAD.brief.toUpperCase());
  });

  it("letters no digit but the designations' own index", () => {
    // The copy law: a station's brief makes no claim the station cannot show,
    // and a count of posts is a number that goes stale on the next commit.
    expect(MUSINGS_MASTHEAD.brief).not.toMatch(/\d/);
    expect(MUSINGS_TITLE_TEXT).not.toMatch(/\d/);
  });

  it("stamps the same coordinates the arcs' own chrome would", () => {
    // ⚠ `coordStamp` is COPIED rather than imported (the landing's import
    // doctrine), so the two arithmetics are pinned against each other. A copy
    // that drifted would print a different survey on one surface with nothing
    // failing.
    for (const salt of [1, 2, 7])
      expect(coordStamp("musings", salt)).toBe(arcCoordStamp("musings", salt));
    expect(MUSINGS_COORDS).toEqual([coordStamp("musings", 1), coordStamp("musings", 2)]);
    for (const c of MUSINGS_COORDS) expect(c).toMatch(/^\d{4} \/ \d{4}$/);
  });
});

describe("the head's clock", () => {
  it("is blank at the top, whole through the reading band, and blank again at the end", () => {
    expect(shelfClock(0, N).head).toBeCloseTo(0, 6);
    expect(shelfClock(0.3, N).head).toBeCloseTo(1, 6);
    expect(shelfClock(0.8, N).head).toBeCloseTo(1, 6);
    expect(shelfClock(1, N).head).toBeCloseTo(0, 6);
  });

  it("resolves before the shelf starts stepping, and holds through every step", () => {
    // The owner's own order: the era empties, the head decodes, THEN the
    // cards come into view. A head still resolving over a shelf already
    // turning is two arrivals at once.
    expect(shelfClock(0.24, N).head).toBeCloseTo(1, 6);
    expect(shelfIndex(shelfClock(0.24, N).index, N)).toBe(0);
    for (let i = 24; i <= 84; i++) expect(shelfClock(i / 100, N).head).toBeGreaterThan(0.999);
  });

  it("rises and falls once, with no plateau of its own inside the windows", () => {
    let prev = 0;
    let peaked = false;
    for (let i = 0; i <= 1000; i++) {
      const h = shelfClock(i / 1000, N).head;
      expect(h).toBeGreaterThanOrEqual(-1e-9);
      expect(h).toBeLessThanOrEqual(1 + 1e-9);
      if (h + 1e-9 < prev) peaked = true;
      // ⚠ Once it has turned over it may never rise again: a head that
      // un-typed and re-typed inside one beat is a flicker, which is the one
      // thing this station may not do.
      else if (peaked) expect(h).toBeLessThanOrEqual(prev + 1e-9);
      prev = h;
    }
    expect(peaked).toBe(true);
  });
});

describe("typedCount", () => {
  it("shows the first character the instant the run opens", () => {
    // A typewriter that stands on an empty line for a fifth of its window
    // reads as a stall, not as typing.
    expect(typedCount(40, 0)).toBe(0);
    expect(typedCount(40, 0.001)).toBe(1);
    expect(typedCount(40, 1)).toBe(40);
  });

  it("is monotonic and clamped", () => {
    let prev = -1;
    for (let i = 0; i <= 200; i++) {
      const n = typedCount(37, i / 100 - 0.5);
      expect(n).toBeGreaterThanOrEqual(prev);
      expect(n).toBeLessThanOrEqual(37);
      prev = n;
    }
    expect(typedCount(0, 1)).toBe(0);
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
    // A writer and a sheet that disagree about the rung is a shelf posed in
    // 3D inside a box laid out as a flat rail, or a flat rail whose cards
    // have been given absolute seats. Neither errors and neither is visible
    // in a still taken at the other rung.
    expect(read(HOOK)).toContain(`MUSINGS_RACK_MEDIA = "${RUNG}"`);
    expect(read(SHEET)).toContain(`@media ${RUNG} {`);
  });

  it("the sheet's two px terms are the track's own", () => {
    // ⚠ The track is laid out in `shelfMath.ts` and the spine is DRAWN in the
    // sheet. A disagreement is slabs that overlap or stand apart, and nothing
    // errors — the writer's arithmetic is self-consistent either way.
    const sheet = read(SHEET);
    expect(sheet).toContain(`--mu-spine: ${SHELF_SPINE_PX}px;`);
    expect(sheet).toContain(`--mu-shelf-gap: ${SHELF_GAP_PX}px;`);
  });

  it("the pivot carries NO grouping property, on any rung", () => {
    // ⚠ `overflow` other than visible, `clip-path` other than none, an
    // `opacity` under 1 and a `filter` other than none each force
    // `transform-style: flat` on the element that declares them (CSS
    // Transforms 2 sec. 3) — whatever that element also says about
    // preserve-3d. A flattened pivot renders its 90-degree spine as a
    // zero-width strip, with the transform applied, the element measurable,
    // and every geometry gate green. The face takes them; it has no 3D
    // children of its own.
    const sheet = read(SHEET);
    // Every rule block whose selector ENDS on `.mu-card` (optionally with an
    // attribute qualifier) — i.e. the pivot itself, at any rung.
    // `.mu-card__front`, `.mu-card__spine` and any descendant are not it.
    const pivots = [...sheet.matchAll(/([^{}]*)\{([^{}]*)\}/g)].filter(([, sel]) =>
      /(^|[\s,>])\.mu-card(\[[^\]]*\])?\s*$/.test(sel)
    );
    expect(pivots.length).toBeGreaterThanOrEqual(2);
    for (const [, , body] of pivots) {
      expect(body).not.toMatch(/(^|[\s;])overflow\s*:(?!\s*visible)/);
      expect(body).not.toMatch(/(^|[\s;])clip-path\s*:(?!\s*none)/);
      expect(body).not.toMatch(/(^|[\s;])filter\s*:(?!\s*none)/);
      expect(body).not.toMatch(/(^|[\s;])opacity\s*:/);
    }
  });

  it("the aperture carries the house's ONE pair of numbers, on all three hosts", () => {
    /* ⚠ A THIRD COPY JOINS A TWO-HOST LOCKSTEP. 720ms in / 420ms out on
       `cubic-bezier(0.65, 0, 0.35, 1)` is ADR-097 U12's settled pair — the
       caption card's own expo-out is 84 % open at 90ms, which is right on a
       509px card and 2.5× too fast in pixels on an object this size. One
       host changing alone is a house grammar running a different clock on one
       surface, which is exactly the shape of drift nothing on screen reports. */
    const IN = "720ms cubic-bezier(0.65, 0, 0.35, 1)";
    const OUT = "420ms cubic-bezier(0.65, 0, 0.35, 1)";
    const hosts = [
      SHEET,
      "components/landing/home-v2/services/proof-stack/proof-stack.css",
      "app/(marketing)/arcs/trinny-london/proposal/trinny-london.css",
    ];
    for (const host of hosts) {
      const css = read(host);
      expect(css, `${host} carries the aperture's in`).toContain(IN);
      expect(css, `${host} carries the aperture's out`).toContain(OUT);
    }
  });

  it("gates every aperture rule on the stamp AND the rung", () => {
    // Both hidden states key on `data-mu-arrive`'s PRESENCE, so a rule outside
    // the stamp's scope would hide a shelf nothing was ever going to open —
    // on a phone, under reduced motion and on a page whose script never ran.
    const sheet = read(SHEET);
    for (const m of sheet.matchAll(/\[data-mu-arrive="(await|out|in)"\]/g)) {
      const before = sheet.slice(0, m.index ?? 0);
      expect(before.lastIndexOf(`@media ${RUNG} {`)).toBeGreaterThan(-1);
      expect(before).toContain("[data-mu-ready]");
    }
    expect(read(HOOK)).toContain('removeAttribute("data-mu-arrive")');
  });

  it("the writer publishes no opacity and no filter per card", () => {
    // They left with the fan: on a shelf a closed slab is not a dimmed slab,
    // it is a slab seen edge-on. Re-introducing either as an element style is
    // the flattening above, arriving from the writer instead of the sheet.
    const hook = read(HOOK);
    expect(hook).not.toMatch(/style\.opacity\s*=/);
    expect(hook).not.toMatch(/style\.filter\s*=/);
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
    // ADR-002: one writer, CSS custom properties. The drawing this shelf is
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
