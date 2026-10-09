import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ArcBreakdown, breakdownLength } from "@/components/arcs/ArcBreakdown";
import { SURI_CONFIGURATION_ARC } from "@/lib/arcs/content/suri-configuration";

/**
 * A case breakdown's markup (ADR-148 U5, U6): Prompt to Loop's slide shell as
 * data, the hero with the film or the page, then one slide per beat. (The
 * skill run that shared this file left with its kind, ADR-154 U1: the
 * instrument draws a run now, `instrument-record.test.ts`.)
 */
describe("ArcBreakdown (ADR-148 U5)", () => {
  /* ADR-148 U5, U6: Suri's own cases are breakdowns in Prompt to Loop's
     format: the hero with the film (or the page, scrolling in its window),
     then one slide per beat, each with its evidence. */
  it("draws every case breakdown as a hero and one slide per beat", () => {
    const secs = SURI_CONFIGURATION_ARC.sections.filter((s) => s.kind === "breakdown");
    expect(secs.length).toBeGreaterThan(1);
    for (const sec of secs) {
      if (sec.kind !== "breakdown") continue;
      const host = document.createElement("div");
      host.innerHTML = renderToStaticMarkup(<ArcBreakdown section={sec} index={0} />);
      const slides = [...host.querySelectorAll<HTMLElement>("section.ptl-sec")];
      expect(slides).toHaveLength(breakdownLength(sec));
      expect(slides.map((el) => el.id)).toEqual([sec.id, ...sec.breakdown.beats.map((b) => b.id)]);
      const hero = host.querySelector(".arc-job__film")!;
      if (sec.breakdown.film)
        expect(hero.querySelector("video")?.getAttribute("src")).toBe(sec.breakdown.film.src);
      else
        expect(hero.querySelector(".arc-job__scroll img")?.getAttribute("src")).toBe(
          sec.breakdown.page?.src
        );
      const index = [...host.querySelectorAll(".arc-job__index a")].map((a) =>
        a.getAttribute("href")
      );
      expect(index).toEqual(sec.breakdown.beats.map((b) => `#${b.id}`));
      sec.breakdown.beats.forEach((b) => {
        const el = host.querySelector(`[data-case-beat="${b.id}"]`)!;
        if (b.frames) {
          expect(el.querySelectorAll("img")).toHaveLength(b.frames.length);
          const scrolls = b.frames.filter((f) => f.ratio === "scroll").length;
          expect(el.querySelectorAll(".arc-job__scroll[tabindex]")).toHaveLength(scrolls);
        }
        if (b.rows) expect(el.querySelectorAll(".arc-job__rows > div")).toHaveLength(b.rows.length);
        if (b.figures)
          expect(el.querySelectorAll(".arc-job__figures > div")).toHaveLength(b.figures.length);
      });
    }
  });
});
