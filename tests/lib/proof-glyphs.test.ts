import { describe, expect, it } from "vitest";

import {
  PROOF_GLYPHS,
  type GlyphPixel,
  type ProofGlyph,
} from "@/components/landing/home-v2/services/casefile/proofGlyphData";
import { CASES } from "@/lib/cases/registry";

/**
 * Proof glyph grammar — the particle-icon reference's ANTI-PATTERNS, made
 * mechanical (`.claude/skills/thoughtform-design/references/particle-icon-grammar.md`).
 *
 * Every rule below is a line from that document that a reviewer cannot
 * reliably check by eye on a 7×7 lattice at 16px: a drift pixel that quietly
 * landed on its own skeleton, a seventeenth pixel that broke restraint, two
 * claims that ended up under one mark. The drawing being GOOD is a design
 * judgment and stays with the owner; the drawing being LEGAL is arithmetic
 * and stays here.
 *
 * ⚠ These are ceilings, not targets. If a new glyph fails one, redraw the
 * glyph — widening a bound here converts a grammar into a suggestion.
 */

/** The lattice. Coordinates are `[col, row]`, both inclusive of 0 and 6. */
const GRID = 7;

/** Restraint (grammar §Anti-Patterns): never more than 16 skeleton+signal. */
const MAX_FORM_PIXELS = 16;

/** Every key the content module is allowed to name, and all of them drawn. */
const EXPECTED_KEYS = [
  "gap",
  "collapse",
  "ownership",
  "substrate",
  "board",
  "encode",
  "reuse",
  "envelope",
  "field",
  "threshold",
  "cadence",
  "holdfast",
  "masters",
  "level",
  "broadcast",
  "parallel",
] as const;

const entries = Object.entries(PROOF_GLYPHS);

const key = (p: GlyphPixel) => `${p[0]},${p[1]}`;
const layers = (g: ProofGlyph) =>
  [
    ["sk", g.sk],
    ["sig", g.sig],
    ["dr", g.dr],
  ] as const;

describe("proof glyph grammar", () => {
  it("draws every key the register names, and nothing speculative", () => {
    expect(Object.keys(PROOF_GLYPHS).sort()).toEqual([...EXPECTED_KEYS].sort());
  });

  it("keeps every pixel on the 7×7 lattice", () => {
    for (const [name, glyph] of entries) {
      for (const [layer, pixels] of layers(glyph)) {
        for (const [col, row] of pixels) {
          expect(Number.isInteger(col), `${name}.${layer} col ${col}`).toBe(true);
          expect(Number.isInteger(row), `${name}.${layer} row ${row}`).toBe(true);
          expect(col, `${name}.${layer} [${col},${row}] col`).toBeGreaterThanOrEqual(0);
          expect(col, `${name}.${layer} [${col},${row}] col`).toBeLessThan(GRID);
          expect(row, `${name}.${layer} [${col},${row}] row`).toBeGreaterThanOrEqual(0);
          expect(row, `${name}.${layer} [${col},${row}] row`).toBeLessThan(GRID);
        }
      }
    }
  });

  it("holds the restraint ceiling — at most 16 skeleton+signal pixels", () => {
    for (const [name, glyph] of entries) {
      const form = glyph.sk.length + glyph.sig.length;
      expect(form, `${name} draws ${form} form pixels`).toBeGreaterThan(0);
      expect(form, `${name} draws ${form} form pixels`).toBeLessThanOrEqual(MAX_FORM_PIXELS);
    }
  });

  it("carries 1–3 signal pixels — the eye lands somewhere, and only there", () => {
    for (const [name, glyph] of entries) {
      expect(glyph.sig.length, `${name} signal`).toBeGreaterThanOrEqual(1);
      expect(glyph.sig.length, `${name} signal`).toBeLessThanOrEqual(3);
    }
  });

  it("carries 1–2 drift pixels — no form ships without the machine trace", () => {
    // "Icons with zero drift pixels" is the grammar's own listed
    // anti-pattern: the displaced pixel IS the brand's human+machine
    // duality at icon scale, so a glyph that omits it has stopped being one
    // of these marks and become clip art.
    for (const [name, glyph] of entries) {
      expect(glyph.dr.length, `${name} drift`).toBeGreaterThanOrEqual(1);
      expect(glyph.dr.length, `${name} drift`).toBeLessThanOrEqual(2);
    }
  });

  it("never repeats a pixel inside one layer", () => {
    for (const [name, glyph] of entries) {
      for (const [layer, pixels] of layers(glyph)) {
        const seen = pixels.map(key);
        expect(new Set(seen).size, `${name}.${layer} repeats a pixel`).toBe(seen.length);
      }
    }
  });

  it("never lets a drift pixel land on the form it is displaced from", () => {
    // The grammar: "Drift pixels must not land on existing skeleton/signal
    // positions — they ARE the displacement." A drift on top of a skeleton
    // pixel is invisible: it renders as the same cell at a lower alpha, so
    // the icon silently loses its machine trace with nothing on screen to
    // say so.
    for (const [name, glyph] of entries) {
      const form = new Set([...glyph.sk, ...glyph.sig].map(key));
      for (const pixel of glyph.dr) {
        expect(form.has(key(pixel)), `${name} drift [${key(pixel)}] sits on a form pixel`).toBe(
          false
        );
      }
    }
  });

  it("displaces every drift pixel exactly one unit along ONE axis", () => {
    // "Offset it by exactly ±1 grid unit along the axis with more room."
    // ONE axis, so a DIAGONAL neighbour does not qualify — at this scale a
    // diagonal offset reads as a second form pixel rather than as the same
    // pixel nudged, which is the whole point of the layer.
    for (const [name, glyph] of entries) {
      for (const pixel of glyph.dr) {
        const adjacent = glyph.sk.some(([col, row]) => {
          const dc = Math.abs(col - pixel[0]);
          const dr = Math.abs(row - pixel[1]);
          return dc + dr === 1;
        });
        expect(
          adjacent,
          `${name} drift [${key(pixel)}] is not one axis-step from any skeleton pixel`
        ).toBe(true);
      }
    }
  });

  it("gives every claim a distinguishable mark", () => {
    // The distinguishability FLOOR, not a similarity metric: two glyphs with
    // an identical pixel set print the same drawing beside two different
    // claims, and the register's grammar — one mark, one claim — is gone
    // with nothing failing. Reading them apart WITHOUT labels beyond this
    // point is the owner's design call.
    const fingerprints = new Map<string, string[]>();
    for (const [name, glyph] of entries) {
      const print = layers(glyph)
        .map(([layer, pixels]) => `${layer}:${[...pixels.map(key)].sort().join("|")}`)
        .join(" ");
      fingerprints.set(print, [...(fingerprints.get(print) ?? []), name]);
    }
    const collisions = [...fingerprints.values()].filter((names) => names.length > 1);
    expect(
      collisions,
      `glyphs share an identical pixel set: ${JSON.stringify(collisions)}`
    ).toEqual([]);
  });

  it("resolves every glyph key the case registry names", () => {
    // The cross-import is the point: `lib/cases/**` stores a string and this
    // module owns the drawing, so nothing in either module can tell on its
    // own that the two halves still agree. (`cases-registry.test.ts` asserts
    // the same join from the content side — one guard per module, so a
    // deletion on either side fails where it happened.)
    const known = new Set(Object.keys(PROOF_GLYPHS));
    const missing: string[] = [];
    for (const c of CASES) {
      for (const track of c.casefile.tracks) {
        for (const block of track.blocks ?? []) {
          if (block.glyph === undefined) continue;
          if (!known.has(block.glyph)) {
            missing.push(`${c.slug}/${track.id} "${block.title}" → "${block.glyph}"`);
          }
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
