import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ToolGallery } from "@/components/landing/home-v2/services/casefile/ToolGallery";
import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";

/**
 * The tools plate's markup, pinned (ADR-072).
 *
 * `ToolGallery` is the casefile's tool dossier — the bay (FEED line, the
 * one walkthrough button around the authored wireframe, the fused watch
 * bar) and the four capability blocks. ADR-072 lifts that body out into
 * `ToolField` so the portfolio arc can mount the SAME bay at page scale.
 * An extraction that changes one attribute on the landing would be a
 * regression nobody reads in a diff, so the markup is pinned BEFORE the
 * extraction and the pin is what proves byte-identity after it.
 *
 * The snapshot is the blanket; the explicit pins below name the strings
 * the ring smoke asserts live, so a snapshot update cannot silently
 * re-bless a deleted affordance (the RUN plate, the corner brackets, the
 * transport chevrons — all owner-deleted, ADR-068 U3/U7).
 */
const noop = () => {};

const render = (activeIdx: number) =>
  renderToStaticMarkup(<ToolGallery tools={PROJECT_CASES} activeIdx={activeIdx} onActive={noop} />);

describe("ToolGallery markup (ADR-072 pin)", () => {
  it("renders each station byte-for-byte as pinned", () => {
    PROJECT_CASES.forEach((_, i) => {
      expect(render(i)).toMatchSnapshot(`station ${i}`);
    });
  });

  it("keeps the owner's bay grammar on every station", () => {
    PROJECT_CASES.forEach((tool, i) => {
      const html = render(i);
      // The FEED line and the fused watch bar — the one affordance.
      expect(html).toContain(`FEED · IN SERVICE <em>${tool.year} —</em>`);
      expect(html).toContain(`WALKTHROUGH · <em>${tool.walkthrough?.duration}</em>`);
      expect(html).toContain("Watch walkthrough");
      expect(html).toContain(`<b>${tool.walkthrough?.duration}</b>`);
      // The wireframe is the evidence — never an <img>, never a filter.
      expect(html).toContain(`class="fl-wire fl-wire--${tool.id}"`);
      expect(html).not.toContain("fl-shot__img");
      // Four blocks, keyed by position, seated on the 120 + 55i ladder.
      expect(html.match(/class="fl-detail__plate"/g)?.length).toBe(4);
      [120, 175, 230, 285].forEach((ms) => {
        expect(html).toContain(`animation-delay:${ms}ms`);
      });
      // Deleted chrome stays deleted.
      expect(html).not.toContain("fl-bay__br");
      expect(html).not.toContain("fl-run");
      expect(html).not.toMatch(/\bT-\d/);
    });
  });

  it("labels the button with the function, the duration and the drawn interface", () => {
    const html = render(0);
    expect(html).toContain(
      'aria-label="Watch the Briefing Agent walkthrough — 1:20. Interface, drawn."'
    );
  });
});
