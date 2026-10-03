import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { AP_HOGESCHOOL_JOURNEY_ORDER } from "@/app/(marketing)/arcs/ap-hogeschool/lecture/journey";
import { PROMPT_TO_LOOP_SLIDES } from "@/app/(marketing)/arcs/ap-hogeschool/lecture/promptToLoopSlides";
import { WORKSHOP_JOURNEY_ORDER } from "@/app/(marketing)/arcs/thoughtform/workshop-v1/journey";
import { AP_HOGESCHOOL_ARC } from "@/lib/arcs/content/ap-hogeschool";
import { FRONTIER_CURVE } from "@/lib/arcs/content/shared/frontierCurve";
import { HAND_IT_TO_AN_AGENT } from "@/lib/arcs/content/shared/handItToAnAgent";
import {
  TOM_ANCHOR_IMAGE,
  TOM_BENCH_EXAMPLE,
  TOM_PATH_STAGES,
  TOM_WALL_CAPTION,
  TOM_WALL_MEDIA,
} from "@/lib/arcs/content/shared/tom-on-the-moon";

/**
 * The AP Hogeschool lecture's route guard (ADR-141).
 *
 * ⚠ THE SHAPE IS THE SECOND CUT'S OWN TEST (`thoughtform-workshop-v2.test.ts`),
 * and for its reason: this route reads the SAME prototype through the SAME
 * function with the SAME removed stations, so the parse test already guards
 * the markup for all three own routes, and the folder walk there covers this
 * folder's `OWN_ROUTE_SLUGS` row. What is pinned here is only what is TRUE OF
 * THIS ROUTE AND NOT OF THE OTHER TWO: that it shares rather than forks, that
 * its tail is the student cut, and that its worlds are the shared records.
 */

const ARCS_DIR = join(__dirname, "..", "..", "app", "(marketing)", "arcs");
const routeFile = (...p: string[]) => readFileSync(join(ARCS_DIR, ...p), "utf8");

const REMOVED_STATIONS = [
  "definition",
  "missing-layer",
  "intelligence-layer",
  "continuum",
  "practice",
  "buildQuote",
  "build",
] as const;

describe("the AP Hogeschool lecture (ADR-141)", () => {
  /**
   * ⚠ IT SHARES v1's PROTOTYPE, SHEET AND ROOT CLASS, and that is a decision
   * rather than an accident: the corridor half is the same page. The day it
   * stops being, all three fork together — never one of them — because the
   * stylesheet, `usePortraitDeck` and `useWorkshopFlow` all reach `.tw-root`
   * globally and a half-fork would leave two routes fighting over it.
   */
  it("shares the corridor with v1 rather than forking it", () => {
    const page = routeFile("ap-hogeschool", "lecture", "page.tsx");
    expect(page, "renders v1's root class").toContain('className="tw-root"');
    expect(page, "imports v1's route sheet").toContain(
      '"../../thoughtform/workshop-v1/thoughtform-workshop.css"'
    );
    expect(page, "reads v1's prototype").toContain("getThoughtformWorkshopContent");
    for (const station of REMOVED_STATIONS) {
      expect(page, `removes ${station}, as v1 does`).toContain(`"${station}"`);
    }
    const portals = routeFile("ap-hogeschool", "lecture", "WorkshopPortals.tsx");
    expect(portals, "reuses v1's proof, never a copy").toContain(
      '"../../thoughtform/workshop-v1/WorkshopProof"'
    );
    expect(portals, "reuses v1's About flow").toContain(
      '"../../thoughtform/workshop-v1/flow/useWorkshopFlow"'
    );
    /* The two orders are equal TODAY; the files are separate so they need
       not stay equal. A deliberately weak pin. */
    expect([...AP_HOGESCHOOL_JOURNEY_ORDER]).toEqual([...WORKSHOP_JOURNEY_ORDER]);
  });

  /**
   * ⚠ THE SHARED SHEET MUST WIN ON SPECIFICITY, NEVER ON ORDER (ADR-141 U1).
   * The bundler does not keep import order for a sheet three routes share: on
   * this route it put v1's sheet BEFORE landing.css, so its equal-specificity
   * `.tw-root .tw-arc` lost to `.station:not(.hero)` — the station kept its
   * side padding (every beat in an ~820px column at 2000px wide) and
   * `content-visibility: auto` came back, in dev and in production, and on a
   * phone the 140/220 station padding too (the ≤960 rung's
   * `.station:not(.hero):not(.station--cover)` is (0,3,0)), with every guard
   * green. So the rule that releases the station names it BY ID: an id
   * outranks every class-based station rule the landing has, in any order.
   */
  it("releases the workshop station on specificity, not on sheet order", () => {
    const weight = (sel: string) => {
      const s = sel.replace(/::[\w-]+/g, "");
      const ids = (s.match(/#[\w-]+/g) ?? []).length;
      const classes = (s.match(/\.[\w-]+|\[[^\]]+\]|:(?!not\()[\w-]+/g) ?? []).length;
      return ids * 1000 + classes;
    };
    const sheet = routeFile("thoughtform", "workshop-v1", "thoughtform-workshop.css");
    const release = sheet.match(
      /([^{}/]+)\{\s*display:\s*block;\s*padding:\s*0;\s*content-visibility:\s*visible;/
    );
    expect(release, "the station-release rule is in v1's sheet").not.toBeNull();
    const selector = release![1].trim();
    expect(selector, "it names the station by id").toMatch(/#workshop\b/);
    const landing = readFileSync(
      join(process.cwd(), "components", "landing", "v7", "landing.css"),
      "utf8"
    );
    for (const pad of [".station:not(.hero)", ".station:not(.hero):not(.station--cover)"]) {
      expect(landing, `the landing still pads stations on ${pad}`).toContain(pad);
      expect(weight(selector), `outranks ${pad}`).toBeGreaterThan(weight(pad));
    }
  });

  /**
   * ⚠ NO SWITCH. The second cut's worked-example switch is what makes its
   * practical chapter one piece of work followed five ways; this page has no
   * practical chapter, so the island is not mounted and no section carries a
   * panel stamp. A switch over nothing is a control that does nothing.
   */
  it("carries no worked-example switch", () => {
    const tail = routeFile("ap-hogeschool", "lecture", "WorkshopTail.tsx");
    expect(tail, "the tail mounts no switch").not.toContain("ArcWorkedSwitch");
    for (const s of AP_HOGESCHOOL_ARC.sections) {
      expect(s.worked, `${s.id}: a panel stamp on a page with no switch`).toBeUndefined();
    }
  });

  /**
   * The student cut: the second cut's opening slide first, BY REFERENCE (ADR-141
   * U2, owner 2026-10-02: it replaced the Today readout), the close last, and
   * the whole thing inside the archetype's seven-to-sixteen (ADR-131's law, one
   * screen a section). The hero's first action lands on that slide.
   */
  it("opens on the shared board, closes on the close, and stays inside the law", () => {
    const sections = AP_HOGESCHOOL_ARC.sections;
    expect(sections[0], "the opening is v2's, by reference").toBe(HAND_IT_TO_AN_AGENT);
    expect(
      sections.some((s) => s.id === "today"),
      "the Today readout is gone"
    ).toBe(false);
    expect(AP_HOGESCHOOL_ARC.hero.actions?.[0]?.href).toBe(`#${HAND_IT_TO_AN_AGENT.id}`);
    expect(sections.at(-1)?.kind).toBe("close");
    expect(sections.length).toBeGreaterThanOrEqual(7);
    expect(sections.length).toBeLessThanOrEqual(16);

    /* The lecture's own claim: the situation ends on the real question, the
       one world follows it, and the three built worlds come after the board. */
    const ids = sections.map((s) => s.id);
    expect(ids.indexOf("configuration")).toBe(ids.indexOf("real-question") + 1);
    expect(ids.indexOf("tom-on-the-moon")).toBeGreaterThan(ids.indexOf("configuration"));
    expect(ids.indexOf("itp-wall")).toBeGreaterThan(ids.indexOf("tom-verdict"));
    expect(ids.indexOf("this-week")).toBeGreaterThan(ids.indexOf("itp-wall"));
    /* The anchor beat is replaced by the Prompt to Loop slides (ADR-141 U3),
       which the tail mounts right before the ambition beat. */
    expect(ids.includes("two-anchors"), "the anchor beat is gone").toBe(false);
    expect(ids[ids.indexOf("ambition") - 1]).toBe("itp-wall");
  });

  /**
   * ⚠ THE WORLDS ARE THE SHARED RECORDS, BY REFERENCE (ADR-136's law, a third
   * reader). A copy typed on this page would drift the day the course's
   * anchor is re-pinned, with nothing on screen to say so.
   */
  it("mounts Tom on the Moon and the curve by reference", () => {
    const sections = AP_HOGESCHOOL_ARC.sections;
    const path = sections.find((s) => s.kind === "path");
    expect(path?.kind === "path" && path.stages, "the Tom path").toBe(TOM_PATH_STAGES);
    const bench = sections.find((s) => s.kind === "bench");
    expect(bench?.kind === "bench" && bench.example, "the Tom bench").toBe(TOM_BENCH_EXAMPLE);
    const wall = sections.find((s) => s.id === "tom-scale");
    expect(wall?.kind === "media" && wall.media, "the Tom wall").toBe(TOM_WALL_MEDIA);
    expect(wall?.kind === "media" && wall.caption, "the Tom wall's caption").toBe(TOM_WALL_CAPTION);
    const board = sections.find((s) => s.kind === "questions");
    expect(board?.kind === "questions" && board.work.image?.src, "the board's anchor").toBe(
      TOM_ANCHOR_IMAGE.src
    );
    const curve = sections.find((s) => s.kind === "curve");
    expect(curve?.kind === "curve" && curve.lanes, "the frontier record").toBe(
      FRONTIER_CURVE.lanes
    );
  });

  /**
   * The one picture this page adds. The registry checks a `media.src` by
   * prefix only, so a wall the asset script never wrote would pass every
   * other guard and render a broken frame in the room.
   */
  it("the nine-sector wall is on disk", () => {
    const wall = AP_HOGESCHOOL_ARC.sections.find((s) => s.id === "itp-wall");
    expect(wall?.kind).toBe("media");
    const src = wall?.kind === "media" ? wall.media.src : "";
    expect(src.startsWith("/arcs/ap-hogeschool/")).toBe(true);
    expect(existsSync(join(process.cwd(), "public", src)), `${src} on disk`).toBe(true);
  });

  /**
   * The Prompt to Loop breakdown (ADR-141 U3): thirteen slides, the owner's
   * own markup verbatim under arc heads. Every id is prefixed so none can
   * collide with the page's stations or beats, every in-page link lands on a
   * slide, and every picture and the film are on disk (a body is a string,
   * so nothing else would notice a missing file).
   */
  it("carries the Prompt to Loop slides whole, prefixed and on disk", () => {
    expect(PROMPT_TO_LOOP_SLIDES).toHaveLength(13);
    const ids = PROMPT_TO_LOOP_SLIDES.map((s) => s.id);
    expect(new Set(ids).size).toBe(13);
    for (const slide of PROMPT_TO_LOOP_SLIDES) {
      expect(slide.id.startsWith("ptl-"), slide.id).toBe(true);
      expect(slide.pre && slide.em && slide.sub, `${slide.id}: a whole head`).toBeTruthy();
      for (const [, href] of slide.body.matchAll(/href="#([^"]+)"/g)) {
        expect(ids, `${slide.id}: #${href} lands on a slide`).toContain(href);
      }
      for (const [, src] of slide.body.matchAll(/(?:src|poster)="(\/arcs\/[^"]+)"/g)) {
        expect(existsSync(join(process.cwd(), "public", src)), `${src} on disk`).toBe(true);
      }
      expect(slide.body, `${slide.id}: no inlined media`).not.toContain("data:image");
    }
  });
});
