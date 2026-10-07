import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

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

  /* ADR-148 U4: the video workstream carries its first real job under the
     run: the film, then one beat per record entry, each with its evidence. */
  it("draws a run's real job under it, and only where the record has one", () => {
    for (let i = 0; i < runs.length; i += 1) {
      const { s, host } = mount(i);
      const job = host.querySelector("[data-run-job]");
      if (!s.job) {
        expect(job).toBeNull();
        continue;
      }
      expect(job?.querySelector("video")?.getAttribute("src")).toBe(s.job.film.src);
      const beats = [...host.querySelectorAll<HTMLElement>("[data-run-beat]")];
      expect(beats.map((b) => b.dataset.runBeat)).toEqual(s.job.beats.map((b) => b.id));
      s.job.beats.forEach((b, n) => {
        const el = beats[n];
        if (b.frames) expect(el.querySelectorAll("img")).toHaveLength(b.frames.length);
        if (b.rows) expect(el.querySelectorAll(".arc-job__rows > div")).toHaveLength(b.rows.length);
        if (b.figures)
          expect(el.querySelectorAll(".arc-job__figures > div")).toHaveLength(b.figures.length);
      });
    }
    expect(runs.some((s) => s.kind === "skill-run" && s.job)).toBe(true);
  });
});
