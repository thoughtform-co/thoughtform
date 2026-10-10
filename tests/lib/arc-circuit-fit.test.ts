import { describe, expect, it } from "vitest";

import { CIRCUIT_GLYPHS, PERSON_MARK } from "@/components/arcs/circuit/circuitGlyphData";
import {
  BAND_PX,
  CIRCUIT_STATES,
  CIR_VB,
  FS_FLOOR,
  OS,
  circuitGeom,
  letterWidth,
  renderedPx,
  type CirLetter,
  type Rect,
} from "@/components/arcs/circuit/circuitLayout";
import { CREW_VB, crewGeom } from "@/components/arcs/circuit/crewLayout";
import { ARCS } from "@/lib/arcs/registry";
import type { ArcSectionOf } from "@/lib/arcs/types";

/**
 * THE CIRCUIT's fit guard (ADR-133 U2) — the map measured against its own
 * declaration — and the crew's, which draws with the same primitives.
 *
 * ⚠ THE MAP IS STATIC SINCE U2: the pinned scene that posed one drawing three
 * ways is retired, so every part must rest at IDENTITY in every state (the
 * sheet still picks a pose by `data-cir-state`, and a stray pose would move a
 * node nobody asked to move).
 * ⚠ THE OBJECT COUNT IS PINNED (owner, 2026-09-28: the first cut carried forty
 * lettered things in one state and he could not say what the section was
 * about), and each small configuration letters its NAME ALONE (owner,
 * 2026-09-29: "I don't think we should see all the texts of the smaller
 * panels").
 * ⚠ AND THE NO-DIGIT WALK IS ON THE DRAWING, not only on the record: the
 * drawing uppercases and composes, and a string built in a renderer is outside
 * every content scanner (ADR-070 U15's `8 TEAMS`). The crew's record values
 * are the one sanctioned exception, and only on the record's side.
 */

const circuits = ARCS.flatMap((arc) =>
  arc.sections
    .filter((s): s is ArcSectionOf<"circuit"> => s.kind === "circuit")
    .map((s) => ({ name: `${arc.slug}#${s.id}`, s }))
);
/* ⚠ A crew set as a case card (`layout: "case"`, ADR-153 U5) draws in the
   job cards' housing (`ArcCrewCase`), never with these primitives; its
   particles have their own guard (`arc-crew-particles`). */
const crews = ARCS.flatMap((arc) =>
  arc.sections
    .filter((s): s is ArcSectionOf<"crew"> => s.kind === "crew" && s.layout !== "case")
    .map((s) => ({ name: `${arc.slug}#${s.id}`, s }))
);

const BINDING = BAND_PX["1280x720"];
const FLOOR_PX = 10;
const MAX_OBJECTS = 12;

/** The letter's ink box in its part's home units. */
function box(l: CirLetter): Rect {
  const w = letterWidth(l);
  const x = l.anchor === "middle" ? l.x - w / 2 : l.x;
  return { x, y: l.y - 0.78 * l.fs, w, h: 1.0 * l.fs };
}
const overlap = (a: Rect, b: Rect, slack = 0.5) =>
  a.x < b.x + b.w - slack &&
  b.x < a.x + a.w - slack &&
  a.y < b.y + b.h - slack &&
  b.y < a.y + a.h - slack;
const inside = (r: Rect, o: Rect) =>
  r.x >= o.x && r.y >= o.y && r.x + r.w <= o.x + o.w && r.y + r.h <= o.y + o.h;

describe("the circuit (ADR-133 U2)", () => {
  it("is registered at least once", () => {
    expect(circuits.length).toBeGreaterThan(0);
  });

  for (const { name, s } of circuits) {
    describe(name, () => {
      const g = circuitGeom(s);
      const letters = g.parts.flatMap((p) => p.letters.map((l) => ({ p, l })));
      const objects = g.parts.filter((p) => p.group !== "bed");

      it("every lettered string fits its measure, and no tail is sliced", () => {
        for (const { l } of letters) {
          expect(l.measure, `${l.slot} "${l.text}" was sliced`).toBeGreaterThan(0);
          expect(letterWidth(l), `${l.slot} "${l.text}"`).toBeLessThanOrEqual(l.measure + 1e-6);
        }
      });

      it("no string on the drawing carries a digit", () => {
        for (const { l } of letters) expect(l.text, l.slot).not.toMatch(/\d/);
      });

      it("shows fewer than a dozen objects", () => {
        expect(objects.length, objects.map((p) => p.id).join(", ")).toBeLessThanOrEqual(
          MAX_OBJECTS
        );
      });

      it("every part rests at identity, in every state", () => {
        for (const p of g.parts) {
          for (const st of CIRCUIT_STATES) {
            const pose = p.poses[st];
            expect([pose.tx, pose.ty, pose.k, pose.o], `${p.id} at ${st}`).toEqual([0, 0, 1, 1]);
            expect(pose.shut ?? false, `${p.id} shut at ${st}`).toBe(false);
            expect(pose.fold ?? 0, `${p.id} folded at ${st}`).toBe(0);
          }
          expect(p.morph, `${p.id} morphs`).toBeUndefined();
        }
      });

      it("paints at or above the 10px floor at the binding band", () => {
        for (const { l } of letters) {
          const px = renderedPx(l.fs, 1, BINDING);
          expect(px, `${l.slot} at ${px.toFixed(2)}px`).toBeGreaterThanOrEqual(FLOOR_PX);
        }
        expect(renderedPx(FS_FLOOR, 1, BINDING)).toBeGreaterThanOrEqual(FLOOR_PX);
      });

      it("every letter sits inside the crop, and inside a plate of its own part", () => {
        for (const { p, l } of letters) {
          const b = box(l);
          expect(inside(b, { x: 0, y: 0, w: CIR_VB.w, h: CIR_VB.h }), l.slot).toBe(true);
          expect(
            p.modules.some((m) => inside(b, m.rect)),
            `${l.slot} prints off its plate`
          ).toBe(true);
        }
      });

      it("no two letters print on one another", () => {
        const boxes = letters.map(({ l }) => ({ slot: l.slot, b: box(l) }));
        for (let i = 0; i < boxes.length; i += 1) {
          for (let j = i + 1; j < boxes.length; j += 1) {
            expect(overlap(boxes[i].b, boxes[j].b), `${boxes[i].slot} × ${boxes[j].slot}`).toBe(
              false
            );
          }
        }
      });

      it("no two plates print on one another", () => {
        const rects = objects.flatMap((p) => p.modules.map((m) => ({ id: m.id, b: m.rect })));
        for (let i = 0; i < rects.length; i += 1) {
          for (let j = i + 1; j < rects.length; j += 1) {
            expect(overlap(rects[i].b, rects[j].b, 0), `${rects[i].id} × ${rects[j].id}`).toBe(
              false
            );
          }
        }
      });

      it("every wire lands on the objects it joins", () => {
        const byPart = new Map(g.parts.map((p) => [p.id, p.modules.map((m) => m.rect)]));
        const on = (pt: readonly [number, number], r: Rect) =>
          pt[0] >= r.x - 1 && pt[0] <= r.x + r.w + 1 && pt[1] >= r.y - 1 && pt[1] <= r.y + r.h + 1;
        for (const w of g.wires) {
          for (const [k, end] of [
            [0, w.ends[0]],
            [w.pts.length - 1, w.ends[1]],
          ] as const) {
            const rs = byPart.get(end);
            expect(rs, `${w.id} → ${end} is not an object`).toBeDefined();
            expect(
              (rs ?? []).some((r) => on(w.pts[k], r)),
              `${w.id} → ${end}`
            ).toBe(true);
          }
        }
      });

      it("every card is the board's card, and faces the marketing OS", () => {
        const minis = g.parts.filter((p) => p.id.startsWith("mini-"));
        expect(minis.map((p) => p.id.slice(5))).toEqual(s.configs.map((c) => c.id));
        const osCx = OS.x + OS.w / 2;
        for (const p of minis) {
          const c = s.configs.find((x) => `mini-${x.id}` === p.id);
          // The name and one line, as the board's card letters them; the
          // plates around it letter nothing ("not all the texts of the
          // smaller panels", owner).
          expect(
            p.letters.map((l) => l.text),
            p.id
          ).toEqual([c?.name.toUpperCase(), c?.line]);
          const card = p.modules.find((m) => m.id.endsWith("-card"));
          const ctx = p.modules.find((m) => m.id.endsWith("-context"));
          expect(card && ctx, `${p.id}: the card and its context`).toBeTruthy();
          if (!card || !ctx) continue;
          // THE EXACT SAME CARD: the board chip's 264 x 104, its top-right
          // cut alone, its gold (owner: "all at the same height").
          expect([card.rect.w, card.rect.h, card.cut, card.notch], p.id).toEqual([
            264,
            104,
            20,
            "tr",
          ]);
          expect(card.paint).toBe("gold");
          // The gold context plate sits between the card and the OS.
          const cardCx = card.rect.x + card.rect.w / 2;
          const ctxCx = ctx.rect.x + ctx.rect.w / 2;
          expect(Math.sign(ctxCx - cardCx), `${p.id}: context faces away`).toBe(
            Math.sign(osCx - cardCx)
          );
          expect(ctx.paint, `${p.id}: the context is what the team writes`).toBe("gold");
          expect(p.modules.find((m) => m.id.endsWith("-owner"))?.paint).toBe("green");
        }
      });

      it("the marketing OS is not a card: a twelve-sided plate, the largest object", () => {
        const os = g.parts.find((p) => p.id === "os")?.modules[0];
        expect(os?.shape).toBe("dodecagon");
        expect(os?.rect.w).toBe(os?.rect.h);
        const others = objects.flatMap((p) => p.modules).filter((m) => m.id !== "os");
        for (const m of others) {
          expect(m.rect.w * m.rect.h, m.id).toBeLessThan((os?.rect.w ?? 0) * (os?.rect.h ?? 0));
        }
      });
    });
  }
});

describe("the six questions' marks (ADR-133)", () => {
  const all = { ...CIRCUIT_GLYPHS, person: PERSON_MARK };
  for (const [key, g] of Object.entries(all)) {
    it(`${key} keeps the particle-icon grammar`, () => {
      const px = [...g.sk, ...g.sig, ...g.dr];
      for (const [c, r] of px) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(6);
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(6);
      }
      expect(new Set(px.map(([c, r]) => `${c},${r}`)).size, "a pixel is drawn twice").toBe(
        px.length
      );
      expect(g.sk.length + g.sig.length).toBeLessThanOrEqual(16);
      expect(g.sig.length).toBeGreaterThanOrEqual(1);
      expect(g.sig.length).toBeLessThanOrEqual(3);
      if (key !== "person") {
        expect(g.dr.length).toBeGreaterThanOrEqual(1);
        expect(g.dr.length).toBeLessThanOrEqual(2);
      }
      for (const [c, r] of g.dr) {
        const one = g.sk.some(
          ([sc, sr]) => (Math.abs(sc - c) === 1 && sr === r) || (Math.abs(sr - r) === 1 && sc === c)
        );
        expect(one, `${key} drift ${c},${r} is not one unit off the skeleton`).toBe(true);
      }
    });
  }
  it("no two questions print the same mark", () => {
    const keys = Object.values(CIRCUIT_GLYPHS).map((g) =>
      JSON.stringify([...g.sk, ...g.sig].map(([c, r]) => `${c},${r}`).sort())
    );
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("the crew (ADR-133 U5)", () => {
  it("is registered at least once", () => {
    expect(crews.length).toBeGreaterThan(0);
  });
  for (const { name, s } of crews) {
    describe(name, () => {
      const g = crewGeom(s);
      it("every lettered string fits its measure, and no tail is sliced", () => {
        for (const l of g.letters) {
          expect(l.measure, `${l.slot} "${l.text}" was sliced`).toBeGreaterThan(0);
          expect(letterWidth(l), `${l.slot} "${l.text}"`).toBeLessThanOrEqual(l.measure + 1e-6);
        }
      });
      it("paints at or above the floor, inside the crop, with no two letters on one another", () => {
        const boxes = g.letters.map((l) => ({ slot: l.slot, b: box(l) }));
        for (const l of g.letters) {
          expect(renderedPx(l.fs, 1, BINDING), l.slot).toBeGreaterThanOrEqual(FLOOR_PX);
        }
        for (const { slot, b } of boxes) {
          expect(
            b.x >= 0 && b.y >= 0 && b.x + b.w <= CREW_VB.w && b.y + b.h <= CREW_VB.h,
            slot
          ).toBe(true);
        }
        for (let i = 0; i < boxes.length; i += 1) {
          for (let j = i + 1; j < boxes.length; j += 1) {
            expect(overlap(boxes[i].b, boxes[j].b), `${boxes[i].slot} × ${boxes[j].slot}`).toBe(
              false
            );
          }
        }
      });
      it("digits letter on the record's lines alone", () => {
        for (const l of g.letters) {
          if (/^row-[^.]+\.line\./.test(l.slot)) continue;
          expect(l.text, l.slot).not.toMatch(/\d/);
        }
      });
      it("draws Loop's record alone: one row per role, the role then its workstream", () => {
        expect(g.letters.some((l) => l.slot.startsWith("plan-"))).toBe(false);
        const seats = g.modules.filter((m) => m.id.endsWith("-seat"));
        const outs = g.modules.filter((m) => m.id.endsWith("-out"));
        expect(seats).toHaveLength(4);
        expect(outs).toHaveLength(4);
        // Left to right: every seat ends before its plate begins, on one row.
        seats.forEach((seat, i) => {
          expect(seat.paint, seat.id).toBe("green");
          expect(outs[i].paint, outs[i].id).toBe("gold");
          expect(seat.rect.x + seat.rect.w, seat.id).toBeLessThan(outs[i].rect.x);
          expect(seat.rect.y, seat.id).toBe(outs[i].rect.y);
        });
      });
      it("the role and the workstream letter at one size, and every seat carries one mark", () => {
        const who = g.letters.filter((l) => /\.who\./.test(l.slot));
        const work = g.letters.filter((l) => /\.work\./.test(l.slot));
        expect(work).toHaveLength(4);
        for (const l of [...who, ...work]) expect(l.fs, l.slot).toBe(work[0].fs);
        expect(g.marks.filter((m) => m.kind === "person" && m.cell === 3)).toHaveLength(4);
      });
      it("no two plates meet", () => {
        const rects = g.modules.map((m) => ({ id: m.id, b: m.rect }));
        for (let i = 0; i < rects.length; i += 1) {
          for (let j = i + 1; j < rects.length; j += 1) {
            expect(overlap(rects[i].b, rects[j].b, 0), `${rects[i].id} × ${rects[j].id}`).toBe(
              false
            );
          }
        }
      });
      it("every letter sits inside a plate", () => {
        for (const l of g.letters) {
          const b = box(l);
          expect(
            g.modules.some((m) => inside(b, m.rect)),
            `${l.slot} prints off its plate`
          ).toBe(true);
        }
      });
    });
  }
});
