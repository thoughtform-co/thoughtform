import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { KIT_CEILING, kitSections } from "@/app/(internal)/test/arcs-instrument-kit/fixtures";
import {
  BOARD_BOX_PX,
  CFG_FLOOR_PX,
  CFG_FS,
  CONFIG_CROPS,
  CROP_SWITCH,
  configGeom,
  cropFor,
  fillOf,
  letterWidth,
  type ConfigGeom,
  type Rect,
} from "@/components/sheet/config/configLayout";
import type { Pt } from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";
import { ARCS } from "@/lib/arcs/registry";
import { STACK } from "@/lib/arcs/stack";
import { arcsInstrumentSections } from "@/lib/sheet/arcs";
import { configurationViolations } from "@/lib/sheet/composition";
import type { SheetConfiguration, SheetSection } from "@/lib/sheet/types";

/**
 * The `/arcs` dossier's configuration board, measured before it is drawn
 * (ADR-118 U2).
 *
 * ⚠ SVG `<text>` DOES NOT WRAP, ELLIPSISE OR REPORT OVERFLOW: a label past its
 * measure simply vanishes, and a chip laid over a bus reads as wiring. None
 * of that is visible to a DOM walk, so the layout DECLARES every lettered
 * string with its measure and every object with its box, and this walks the
 * declaration for every real proposal and the kit's ceiling on all four crops.
 * It is ADR-100's idiom (`arc-board-fit`) one surface over.
 *
 * ⚠ AND THE BOARD IS DERIVED, SO ITS INPUT IS PINNED. Each proposal's board is
 * read off its own prose (`lib/sheet/configuration.ts`); the pins below are
 * what that reading says, `toEqual`, so a proposal edit that moves a chip
 * fails HERE, by name, instead of redrawing an owner's page in silence.
 */

const TODAY = "2026-09-21";
const EPS = 0.5;

type Log = Extract<SheetSection, { kind: "log" }>;
const logOf = (sections: SheetSection[]) => sections[1] as Log;
const realLog = logOf(arcsInstrumentSections(TODAY));
const kitLog = logOf(kitSections());

const boards = (log: Log) =>
  log.dossiers
    .filter((d) => d.configuration)
    .map((d) => [d.id, d.configuration as SheetConfiguration] as const);

const REAL = boards(realLog);
const KIT = boards(kitLog);
const ALL = [...REAL, ...KIT];

describe("the board is read off the proposal (ADR-118 U2)", () => {
  it("draws a configuration for every proposal and for nothing else", () => {
    const withBoard = realLog.dossiers.filter((d) => d.configuration).map((d) => d.id);
    expect(withBoard.sort()).toEqual(
      [
        ...ARCS.filter((a) => a.sections.some((s) => s.kind === "configuration")).map(
          (a) => a.slug
        ),
        "trinny-london-pitch",
      ].sort()
    );
    expect(withBoard.sort()).toEqual([
      "hungry-minds-proposal",
      "perfect-ted-proposal",
      "suri-proposal",
      "trinny-london-pitch",
    ]);
  });

  it("pins what each proposal's own prose says it runs on and inside", () => {
    const pinned = Object.fromEntries(
      REAL.map(([id, c]) => [
        id,
        {
          rows: c.rows.map((r) => [r.name, r.tag ?? "", r.ghost ? "ghost" : ""].join("|")),
          links: c.links.map((l) => `${l.name}×${l.users}`),
        },
      ])
    );
    expect(pinned).toEqual({
      "hungry-minds-proposal": {
        rows: [
          "Strategy and briefing|M1|",
          "Composition|M2|",
          "Staging imagery|M2|",
          "Localisation||ghost",
        ],
        links: ["Claude×3", "Image generation×1", "Figma×2"],
      },
      "suri-proposal": {
        rows: ["Imagery|M1|", "Composition|M2|", "Ads|M3|"],
        links: ["Claude×3", "Image generation×1", "Figma×1"],
      },
      "perfect-ted-proposal": {
        rows: ["Imagery|M1|", "Composition|M2|", "Ads|M3|"],
        links: ["Claude×3", "Image generation×1", "Figma×1"],
      },
      "trinny-london-pitch": {
        rows: [
          "Setup, insight and briefing|M1|",
          "Asset generation and design|M2|",
          "Creative operations and scaling|M3|",
        ],
        links: ["Claude×3", "Figma×3", "Monday×3", "Slack×3"],
      },
    });
  });

  it("never letters a placeholder: a bracketed next team is not drawn", () => {
    for (const [id, c] of REAL)
      for (const r of c.rows) expect(r.name, `${id}/${r.id}`).not.toMatch(/[[\]]/);
  });

  it("keeps every board inside the layout's ceilings, the kit's AT them", () => {
    for (const [id, c] of ALL) expect(configurationViolations(c, id)).toEqual([]);
    expect(KIT_CEILING.rows.filter((r) => !r.ghost)).toHaveLength(4);
    expect(KIT_CEILING.links).toHaveLength(8);
  });

  it("names a stack item only through the vocabulary's own spelling", () => {
    const names = new Set(STACK.map((s) => s.name));
    for (const [id, c] of REAL)
      for (const l of c.links) expect(names.has(l.name), `${id}: ${l.name}`).toBe(true);
  });
});

/* ------------------------------------------------------------ geometry */

const inside = (r: Rect, b: { w: number; h: number }) =>
  r.x >= -EPS && r.y >= -EPS && r.x + r.w <= b.w + EPS && r.y + r.h <= b.h + EPS;
const overlap = (a: Rect, b: Rect, gap = 0) =>
  a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;
const within = ([x, y]: Pt, r: Rect, e = 0.01) =>
  x > r.x + e && x < r.x + r.w - e && y > r.y + e && y < r.y + r.h - e;
const onEdge = ([x, y]: Pt, r: Rect) =>
  (Math.abs(x - r.x) < 0.01 || Math.abs(x - (r.x + r.w)) < 0.01) &&
  y >= r.y - 0.01 &&
  y <= r.y + r.h + 0.01
    ? true
    : (Math.abs(y - r.y) < 0.01 || Math.abs(y - (r.y + r.h)) < 0.01) &&
      x >= r.x - 0.01 &&
      x <= r.x + r.w + 0.01;

/** Two segments cross (touching end to end does not count). */
function cross(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const o = (p: Pt, q: Pt, r: Pt) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const d1 = o(c, d, a);
  const d2 = o(c, d, b);
  const d3 = o(a, b, c);
  const d4 = o(a, b, d);
  return d1 * d2 < -1e-9 && d3 * d4 < -1e-9;
}
/** A point's distance from a segment. */
function dist(p: Pt, a: Pt, b: Pt): number {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;
  const l2 = (bx - ax) ** 2 + (by - ay) ** 2;
  const t =
    l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / l2));
  return Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay)));
}
const segs = (pts: readonly Pt[]) => pts.slice(1).map((p, i) => [pts[i], p] as const);

function modulesOf(g: ConfigGeom) {
  return [
    { id: "die", rect: g.die },
    ...g.chips.map((c) => ({ id: `chip.${c.id}`, rect: c.rect })),
  ];
}

describe("the board fits every crop (ADR-118 U2)", () => {
  for (const crop of CONFIG_CROPS) {
    describe(`the ${crop.id} crop (${crop.w} × ${crop.h}, ${crop.arrangement})`, () => {
      for (const [id, c] of ALL) {
        const g = configGeom(c, crop);
        const mods = modulesOf(g);

        it(`${id}: every string and its longest word inside its measure, no tail sliced`, () => {
          for (const l of g.letters) {
            expect(l.measure, `${l.slot} is a sliced tail: "${l.text}"`).toBeGreaterThan(0);
            const w = letterWidth(l);
            expect(
              w,
              `${l.slot} "${l.text}" ${w.toFixed(1)} > ${l.measure.toFixed(1)}`
            ).toBeLessThanOrEqual(l.measure + EPS);
            for (const word of l.text.split(" ")) {
              const ww = letterWidth({ ...l, text: word });
              expect(ww, `${l.slot} word "${word}"`).toBeLessThanOrEqual(l.measure + EPS);
            }
          }
        });

        it(`${id}: every letter inside its own object`, () => {
          const rects = new Map<string, Rect>([
            ["die", g.die],
            ...g.rows.map((r) => [`row.${r.id}`, r.rect] as [string, Rect]),
            ...g.chips.map((ch) => [`chip.${ch.id}`, ch.rect] as [string, Rect]),
          ]);
          for (const l of g.letters) {
            const r = rects.get(l.owner);
            expect(r, `${l.slot}: no owner ${l.owner}`).toBeDefined();
            if (!r) continue;
            const w = letterWidth(l);
            const x0 = l.anchor === "end" ? l.x - w : l.x;
            expect(x0, `${l.slot} left`).toBeGreaterThanOrEqual(r.x - EPS);
            expect(x0 + w, `${l.slot} right`).toBeLessThanOrEqual(r.x + r.w + EPS);
            // Ascender to descender, 0.78 em up and 0.24 em down.
            expect(l.y - 0.78 * l.fs, `${l.slot} top`).toBeGreaterThanOrEqual(r.y - EPS);
            expect(l.y + 0.24 * l.fs, `${l.slot} bottom`).toBeLessThanOrEqual(r.y + r.h + EPS);
          }
        });

        it(`${id}: every object inside the crop, the rows inside the die, nothing overlapping`, () => {
          for (const m of mods) expect(inside(m.rect, crop), `${m.id} leaves the crop`).toBe(true);
          for (const r of g.rows) {
            expect(r.rect.y, r.id).toBeGreaterThanOrEqual(g.headFloor - EPS);
            expect(r.rect.y + r.rect.h, r.id).toBeLessThanOrEqual(g.die.y + g.die.h + EPS);
          }
          for (let i = 0; i < mods.length; i++)
            for (let j = i + 1; j < mods.length; j++)
              expect(
                overlap(mods[i].rect, mods[j].rect, 6),
                `${mods[i].id} crowds ${mods[j].id}`
              ).toBe(false);
        });

        it(`${id}: every bus runs from its chip to the die, around every other object`, () => {
          expect(g.buses.map((b) => b.id)).toEqual(c.links.map((l) => l.id));
          for (const b of g.buses) {
            const chip = g.chips.find((ch) => ch.id === b.id)!;
            expect(b.pts[0], `${b.id} leaves its chip`).toEqual(chip.port);
            expect(onEdge(b.pts[0], chip.rect), `${b.id} starts on its chip's edge`).toBe(true);
            expect(onEdge(b.pts[b.pts.length - 1], g.die), `${b.id} lands on the die`).toBe(true);
            // The bus's whole band keeps off every object it does not join.
            const half = ((b.wires - 1) / 2) * 3.5;
            for (const m of mods) {
              if (m.id === "die" || m.id === `chip.${b.id}`) continue;
              for (const [p, q] of segs(b.pts))
                for (let t = 0; t <= 1; t += 0.05) {
                  const pt: Pt = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
                  const grown = {
                    x: m.rect.x - half,
                    y: m.rect.y - half,
                    w: m.rect.w + 2 * half,
                    h: m.rect.h + 2 * half,
                  };
                  expect(within(pt, grown), `${b.id} runs through ${m.id}`).toBe(false);
                }
            }
          }
        });

        it(`${id}: no two buses cross or touch`, () => {
          for (let i = 0; i < g.buses.length; i++)
            for (let j = i + 1; j < g.buses.length; j++) {
              const [a, b] = [g.buses[i], g.buses[j]];
              const clear = ((a.wires - 1) / 2) * 3.5 + ((b.wires - 1) / 2) * 3.5 + 2;
              for (const [p, q] of segs(a.pts))
                for (const [r, s] of segs(b.pts)) {
                  expect(cross(p, q, r, s), `${a.id} crosses ${b.id}`).toBe(false);
                  const d = Math.min(dist(p, r, s), dist(q, r, s), dist(r, p, q), dist(s, p, q));
                  expect(d, `${a.id} and ${b.id} run ${d.toFixed(1)} apart`).toBeGreaterThanOrEqual(
                    clear
                  );
                }
            }
        });

        it(`${id}: the board's traces run off the free edges, clear of every object`, () => {
          for (const gh of g.ghosts)
            for (const m of mods) {
              if (m.id === "die") continue;
              for (const [p, q] of segs(gh.pts))
                expect(
                  overlap(
                    {
                      x: Math.min(p[0], q[0]) - 6,
                      y: Math.min(p[1], q[1]) - 6,
                      w: Math.abs(q[0] - p[0]) + 12,
                      h: Math.abs(q[1] - p[1]) + 12,
                    },
                    m.rect
                  ),
                  `${gh.id} runs through ${m.id}`
                ).toBe(false);
            }
        });
      }
    });
  }
});

describe("every clipped ring closes both of its contours (ADR-118 U2)", () => {
  it("returns each evenodd contour to its own first point in instrument.css", () => {
    /* Written as one open path — the outer contour's last point straight to
       the inner's first — the two bridges crossed down the left side and
       `evenodd` painted a bow-tie: a left edge full width at the corners and
       nothing at mid-height, on the monitor, the dossier and every block.
       The smoke reads the pixel; this reads the declaration. */
    const css = readFileSync(
      join(__dirname, "..", "..", "components/sheet/instrument.css"),
      "utf8"
    );
    const rings = [...css.matchAll(/polygon\(\s*evenodd,([\s\S]*?)\);/g)].map((m) =>
      m[1]
        .split(/,\s*(?![^(]*\))/)
        .map((p) => p.replace(/\s+/g, " ").trim())
        .filter(Boolean)
    );
    expect(rings.length, "the monitor/dossier ring and the block's ring").toBeGreaterThanOrEqual(2);
    for (const pts of rings) {
      const close = pts.indexOf(pts[0], 1);
      expect(close, `the outer contour never returns to ${pts[0]}`).toBeGreaterThan(2);
      const inner = pts.slice(close + 1);
      expect(inner.length, "an inner contour").toBeGreaterThan(3);
      expect(inner[inner.length - 1], "the inner contour closes").toBe(inner[0]);
    }
  });
});

describe("the crop a box shows (ADR-118 U2)", () => {
  it("mirrors the container queries in instrument.css by hand, and says so", () => {
    const css = readFileSync(
      join(__dirname, "..", "..", "components/sheet/instrument.css"),
      "utf8"
    );
    expect(css).toContain(`@container cfg (min-width: ${CROP_SWITCH.minWidthPx}px) {`);
    expect(css).toContain(
      `@container cfg (min-width: ${CROP_SWITCH.minWidthPx}px) and (min-aspect-ratio: ${Math.round(CROP_SWITCH.midAspect * 1000)} / 1000)`
    );
    expect(css).toContain(
      `@container cfg (min-width: ${CROP_SWITCH.minWidthPx}px) and (min-aspect-ratio: ${Math.round(CROP_SWITCH.wideAspect * 1000)} / 1000)`
    );
    // The switches sit at the geometric mean of their two crops' aspects.
    const aspect = (id: string) => {
      const c = CONFIG_CROPS.find((x) => x.id === id)!;
      return c.w / c.h;
    };
    expect(CROP_SWITCH.midAspect).toBeCloseTo(Math.sqrt(aspect("mid") * aspect("tall")), 2);
    expect(CROP_SWITCH.wideAspect).toBeCloseTo(Math.sqrt(aspect("wide") * aspect("mid")), 2);
  });

  it("fills the owner's reference boxes, and letters them above the type floor", () => {
    const minName = Math.min(CFG_FS.name, CFG_FS.note, CFG_FS.chipName);
    const minKicker = Math.min(CFG_FS.kicker, CFG_FS.chipKicker, CFG_FS.tag);
    for (const [shape, box] of Object.entries(BOARD_BOX_PX)) {
      const crop = CONFIG_CROPS.find((c) => c.id === cropFor(box.w, box.h))!;
      const meet = Math.min(box.w / crop.w, box.h / crop.h);
      expect(
        fillOf(crop, box.w, box.h),
        `${shape}: the ${crop.id} crop fills its box`
      ).toBeGreaterThan(0.9);
      expect(
        minName * meet,
        `${shape}: a name paints ${(minName * meet).toFixed(1)}px`
      ).toBeGreaterThanOrEqual(CFG_FLOOR_PX.name);
      expect(
        minKicker * meet,
        `${shape}: a kicker paints ${(minKicker * meet).toFixed(1)}px`
      ).toBeGreaterThanOrEqual(CFG_FLOOR_PX.kicker);
    }
  });
});
