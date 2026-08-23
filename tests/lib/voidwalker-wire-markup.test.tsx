import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { VOIDWALKER_WIREFRAMES } from "@/components/landing/home-v2/voidwalker/wireframes/voidwalkerWireframes";
import { VOIDWALKER_BEATS } from "@/lib/voidwalker/voidwalkerData";
import { VW_WIRE_IDS, VW_WIRE_LABELS } from "@/lib/voidwalker/voidwalkerWireLabels";

/**
 * The through-line's drawings, pinned against what they DECLARE they
 * letter (ADR-074, the `tool-gallery-markup` precedent). Rendered to static
 * markup and walked as text: every text-bearing element is a declared
 * label (sorted-array equality, so a duplicated label inside one drawing
 * fails too), nothing carries a digit or a currency glyph, no `<img>`, and
 * exactly ONE gold object per drawing.
 */

/** Every element whose OWN text (not its descendants') is non-empty. */
function ownTexts(html: string): string[] {
  const out: string[] = [];
  // Text nodes between tags; an element's own text is whatever sits
  // directly between its open tag and the next tag.
  const re = />([^<>]+)</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const t = m[1]!
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, "&")
      .trim();
    if (t) out.push(t);
  }
  return out;
}

describe("voidwalker wireframes — markup", () => {
  it("the registry is total over the story beats' wires", () => {
    const wires = VOIDWALKER_BEATS.flatMap((b) => (b.wire ? [b.wire] : [])).sort();
    expect(Object.keys(VOIDWALKER_WIREFRAMES).sort()).toEqual(wires);
    expect(Object.keys(VOIDWALKER_WIREFRAMES).sort()).toEqual([...VW_WIRE_IDS].sort());
  });

  for (const id of VW_WIRE_IDS) {
    describe(id, () => {
      const Wire = VOIDWALKER_WIREFRAMES[id];
      const html = renderToStaticMarkup(<Wire />);

      it("is a hidden drawing in its own scope, with no image and no digit", () => {
        expect(html).toMatch(
          new RegExp(`^<div class="vw-wire vw-wire--${id}" aria-hidden="true">`)
        );
        expect(html).toContain('class="vw-wire__in"');
        expect(html).not.toMatch(/<img\b/);
        for (const t of ownTexts(html)) {
          expect(t, `"${t}" carries a figure`).not.toMatch(/\d/);
          expect(t, `"${t}" carries currency`).not.toMatch(/[$€£¥]/);
        }
      });

      it("letters exactly what it declares", () => {
        expect([...ownTexts(html)].sort()).toEqual([...VW_WIRE_LABELS[id]].sort());
      });

      it("every label is a micro-label, and there is one gold object", () => {
        // Every text-bearing element is a `.vw-wire__lbl`.
        const labelled = html.match(/class="[^"]*\bvw-wire__lbl\b[^"]*"[^>]*>[^<]+</g) ?? [];
        expect(labelled.length).toBe(VW_WIRE_LABELS[id].length);
        expect(html.match(/data-gold=""/g)?.length, "one gold object").toBe(1);
        // A gold PLATE letters through an inner label (the light walk's
        // bedOf() starts at the parent); a gold MARK is an SVG shape.
        const plate = html.match(
          /class="vw-wire__cta" data-gold=""><span class="vw-wire__lbl">[^<]+<\/span>/
        );
        const mark = html.match(/<circle[^>]*data-gold=""/);
        expect(Boolean(plate) !== Boolean(mark), "gold is a plate OR a mark").toBe(true);
      });

      it("stays inside the node budget", () => {
        const nodes = (html.match(/<[a-z]/g) ?? []).length;
        expect(nodes, `${nodes} elements`).toBeLessThanOrEqual(50);
      });
    });
  }
});
