import { describe, expect, it } from "vitest";

import { CIRCUIT_GLYPHS, PERSON_MARK } from "@/components/arcs/circuit/circuitGlyphData";
import {
  BAND_PX,
  CIRCUIT_STATES,
  CIR_VB,
  FS_FLOOR,
  cartSeats,
  circuitGeom,
  letterWidth,
  renderedPx,
  type CirLetter,
  type CirPart,
  type CircuitState,
  type Pose,
  type Rect,
} from "@/components/arcs/circuit/circuitLayout";
import { CREW_VB, crewGeom } from "@/components/arcs/circuit/crewLayout";
import { ARCS } from "@/lib/arcs/registry";
import type { ArcSectionOf } from "@/lib/arcs/types";

/**
 * THE CIRCUIT's fit guard (ADR-133) — the drawing measured against its own
 * declaration, in EVERY state it is shown in.
 *
 * ⚠ ONE DRAWING, THREE POSES. A letter that fits at its home can still land on
 * another part's letter once its part travels, so the overlap and crop walks
 * run on the POSED boxes, state by state, over the parts shown in that state.
 * The floor is the rendered size, `fs × k × meet`: a name that rides a scale
 * down to a cartridge has to clear the floor where it LANDS.
 *
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
const crews = ARCS.flatMap((arc) =>
  arc.sections
    .filter((s): s is ArcSectionOf<"crew"> => s.kind === "crew")
    .map((s) => ({ name: `${arc.slug}#${s.id}`, s }))
);

const BINDING = BAND_PX["1280x720"];
const FLOOR_PX = 10;

/** The letter's ink box in its part's home units: the baseline less the
 *  ascender, plus the descender. */
function box(l: CirLetter): Rect {
  const w = letterWidth(l);
  const x = l.anchor === "middle" ? l.x - w / 2 : l.x;
  return { x, y: l.y - 0.78 * l.fs, w, h: 1.0 * l.fs };
}
const posed = (r: Rect, p: Pose): Rect => ({
  x: p.tx + p.k * r.x,
  y: p.ty + p.k * r.y,
  w: p.k * r.w,
  h: p.k * r.h,
});
const overlap = (a: Rect, b: Rect, slack = 0.5) =>
  a.x < b.x + b.w - slack &&
  b.x < a.x + a.w - slack &&
  a.y < b.y + b.h - slack &&
  b.y < a.y + a.h - slack;
const shown = (p: CirPart, s: CircuitState) => p.poses[s].o === 1 && !p.poses[s].shut;

describe("the circuit (ADR-133)", () => {
  it("is registered at least once", () => {
    expect(circuits.length).toBeGreaterThan(0);
  });

  for (const { name, s } of circuits) {
    describe(name, () => {
      const g = circuitGeom(s);
      const letters = g.parts.flatMap((p) => p.letters.map((l) => ({ p, l })));

      it("every lettered string fits its measure, and no tail is sliced", () => {
        for (const { l } of letters) {
          expect(l.measure, `${l.slot} "${l.text}" was sliced`).toBeGreaterThan(0);
          expect(letterWidth(l), `${l.slot} "${l.text}"`).toBeLessThanOrEqual(l.measure + 1e-6);
        }
      });

      it("no string on the drawing carries a digit", () => {
        for (const { l } of letters) expect(l.text, l.slot).not.toMatch(/\d/);
      });

      for (const st of CIRCUIT_STATES) {
        describe(`state ${st}`, () => {
          const live = letters.filter(({ p }) => shown(p, st));

          it("paints at or above the 10px floor at the binding band", () => {
            for (const { p, l } of live) {
              const px = renderedPx(l.fs, p.poses[st].k, BINDING);
              expect(px, `${l.slot} at ${px.toFixed(2)}px`).toBeGreaterThanOrEqual(FLOOR_PX);
            }
            expect(renderedPx(FS_FLOOR, 1, BINDING)).toBeGreaterThanOrEqual(FLOOR_PX);
          });

          it("every letter sits inside the crop", () => {
            for (const { p, l } of live) {
              const b = posed(box(l), p.poses[st]);
              expect(b.x, l.slot).toBeGreaterThanOrEqual(0);
              expect(b.y, l.slot).toBeGreaterThanOrEqual(0);
              expect(b.x + b.w, l.slot).toBeLessThanOrEqual(CIR_VB.w);
              expect(b.y + b.h, l.slot).toBeLessThanOrEqual(CIR_VB.h);
            }
          });

          it("no two letters print on one another", () => {
            const boxes = live.map(({ p, l }) => ({ slot: l.slot, b: posed(box(l), p.poses[st]) }));
            for (let i = 0; i < boxes.length; i += 1) {
              for (let j = i + 1; j < boxes.length; j += 1) {
                expect(overlap(boxes[i].b, boxes[j].b), `${boxes[i].slot} × ${boxes[j].slot}`).toBe(
                  false
                );
              }
            }
          });

          it("every wire shown lands on the objects it joins", () => {
            const rects = new Map<string, Rect>();
            for (const p of g.parts) {
              const r = p.modules[0]?.rect;
              if (!r) continue;
              const pose = p.poses[st];
              if (p.morph) {
                // The morphing plate's box per state is its path's own.
                const nums = p.morph[st].match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
                const xs = nums.filter((_, k) => k % 2 === 0);
                const ys = nums.filter((_, k) => k % 2 === 1);
                const x = Math.min(...xs);
                const y = Math.min(...ys);
                rects.set(p.id, { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y });
              } else {
                rects.set(p.id, posed(r, pose));
              }
            }
            const near = (pt: readonly [number, number], r: Rect) =>
              pt[0] >= r.x - 16 &&
              pt[0] <= r.x + r.w + 16 &&
              pt[1] >= r.y - 16 &&
              pt[1] <= r.y + r.h + 16;
            for (const w of g.wires.filter((x) => x.on[st])) {
              for (const [k, end] of [
                [0, w.ends[0]],
                [w.pts.length - 1, w.ends[1]],
              ] as const) {
                const r = rects.get(end);
                if (!r) continue; // a bus end, not a module
                expect(near(w.pts[k], r), `${w.id} → ${end}`).toBe(true);
              }
            }
          });
        });
      }

      it("the work is seated in beat b and in beat c, and every configuration has a team", () => {
        const ids = s.machine.configs.map((c) => c.id);
        expect(ids).toContain(s.work.id);
        const seated = cartSeats(s.people.teams).map((c) => c.id);
        expect(new Set(seated)).toEqual(new Set(ids));
      });

      it("no two cartridges overlap in beat b", () => {
        const seats = cartSeats(s.people.teams);
        for (let i = 0; i < seats.length; i += 1) {
          for (let j = i + 1; j < seats.length; j += 1) {
            expect(
              overlap(seats[i].rect, seats[j].rect, 0),
              `${seats[i].id} × ${seats[j].id}`
            ).toBe(false);
          }
        }
      });

      it("a shared configuration is shared by ADJACENT teams only", () => {
        for (const seat of cartSeats(s.people.teams)) {
          if (seat.teams.length === 1) continue;
          expect(seat.teams.length).toBe(2);
          expect(Math.abs(seat.teams[0] - seat.teams[1])).toBe(1);
        }
      });

      it("the core's plate morphs through one command structure", () => {
        const core = g.parts.find((p) => p.id === "core");
        expect(core?.morph).toBeDefined();
        const shape = (d: string) => d.replace(/-?\d+(\.\d+)?/g, "#");
        const [a, b, c] = CIRCUIT_STATES.map((st) => shape(core?.morph?.[st] ?? ""));
        expect(b).toBe(a);
        expect(c).toBe(a);
      });

      it("every part is at identity in its home state", () => {
        const home: Record<string, CircuitState> = {
          ledger: "a",
          sat: "a",
          rail: "a",
          die: "a",
          core: "a",
          "core-name": "a",
          "core-x": "a",
          cart: "b",
          seat: "b",
          freed: "b",
          layer: "c",
          socket: "c",
        };
        for (const p of g.parts) {
          const st = home[p.group];
          if (!st) continue;
          const pose = p.poses[st];
          expect([pose.tx, pose.ty, pose.k, pose.o], `${p.id} at ${st}`).toEqual([0, 0, 1, 1]);
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

describe("the crew (ADR-133)", () => {
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
      it("digits letter on the record's values alone, never on the plan", () => {
        for (const l of g.letters) {
          if (/^record-[^.]+\.value\./.test(l.slot)) continue;
          expect(l.text, l.slot).not.toMatch(/\d/);
        }
      });
      it("the plan's readouts are empty: no value is ever drawn on the client's side", () => {
        const planValues = g.letters.filter((l) => /^plan-.*\.value/.test(l.slot));
        expect(planValues).toEqual([]);
      });
    });
  }
});
