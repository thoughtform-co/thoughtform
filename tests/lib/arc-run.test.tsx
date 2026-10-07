import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ArcBreakdown, breakdownLength } from "@/components/arcs/ArcBreakdown";
import { ArcSkillRun, SKILL_RUN_NOT_RUN, SKILL_RUN_STATIONS } from "@/components/arcs/ArcSkillRun";
import { SURI_CONFIGURATION_ARC } from "@/lib/arcs/content/suri-configuration";

/**
 * The skill run's markup (ADR-148): five stations on one rail in the chrome's
 * own words, the fifth the one lit object, the evals under the rail, and a
 * case that has not run saying so instead of drawing a number.
 */
const runs = SURI_CONFIGURATION_ARC.sections.filter((s) => s.kind === "skill-run");

function mount(i: number) {
  const s = runs[i];
  if (s?.kind !== "skill-run") throw new Error("no run");
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(<ArcSkillRun section={s} index={i} />);
  return { s, host };
}

describe("ArcSkillRun (ADR-148)", () => {
  it("draws the five stations in the chrome's words, the last one lit", () => {
    for (let i = 0; i < runs.length; i += 1) {
      const { host } = mount(i);
      const stations = [...host.querySelectorAll<HTMLElement>(".arc-run__stn")];
      expect(stations).toHaveLength(5);
      stations.forEach((st, n) => {
        expect(st.querySelector(".arc-run__key")?.textContent).toBe(
          `${n + 1} · ${SKILL_RUN_STATIONS[n]}`
        );
      });
      expect(host.querySelectorAll(".arc-run__stn--lit")).toHaveLength(1);
      expect(stations[4].classList.contains("arc-run__stn--lit")).toBe(true);
    }
  });

  it("letters the record's steps, checks and evals, and no attribute but data-run-*", () => {
    for (let i = 0; i < runs.length; i += 1) {
      const { s, host } = mount(i);
      expect(
        [...host.querySelectorAll('[data-run-station="steps"] li')].map((l) => l.textContent)
      ).toEqual([...s.steps]);
      expect(host.querySelectorAll("[data-run-gate]")).toHaveLength(
        s.checks.filter((c) => c.gate).length
      );
      expect(host.querySelectorAll("[data-run-case]")).toHaveLength(s.evals.cases.length);
      for (const c of s.evals.cases) {
        const row = host.querySelector(`[data-run-case="${c.name}"]`)!;
        if (c.with) expect(row.textContent).toContain(c.with);
        else expect(row.textContent).toContain(SKILL_RUN_NOT_RUN);
      }
      expect(host.innerHTML).not.toMatch(/data-arc-(?!reveal)/);
      expect(host.querySelector("svg")).toBeNull();
    }
  });

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
