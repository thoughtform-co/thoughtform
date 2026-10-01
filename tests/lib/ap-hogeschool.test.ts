import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { AP_HOGESCHOOL_JOURNEY_ORDER } from "@/app/(marketing)/arcs/ap-hogeschool/journey";
import { WORKSHOP_JOURNEY_ORDER } from "@/app/(marketing)/arcs/thoughtform-workshop/journey";
import { AP_HOGESCHOOL_ARC } from "@/lib/arcs/content/ap-hogeschool";
import { FRONTIER_CURVE } from "@/lib/arcs/content/shared/frontierCurve";
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
    const page = routeFile("ap-hogeschool", "page.tsx");
    expect(page, "renders v1's root class").toContain('className="tw-root"');
    expect(page, "imports v1's route sheet").toContain(
      '"../thoughtform-workshop/thoughtform-workshop.css"'
    );
    expect(page, "reads v1's prototype").toContain("getThoughtformWorkshopContent");
    for (const station of REMOVED_STATIONS) {
      expect(page, `removes ${station}, as v1 does`).toContain(`"${station}"`);
    }
    const portals = routeFile("ap-hogeschool", "WorkshopPortals.tsx");
    expect(portals, "reuses v1's proof, never a copy").toContain(
      '"../thoughtform-workshop/WorkshopProof"'
    );
    expect(portals, "reuses v1's About flow").toContain(
      '"../thoughtform-workshop/flow/useWorkshopFlow"'
    );
    /* The two orders are equal TODAY; the files are separate so they need
       not stay equal. A deliberately weak pin. */
    expect([...AP_HOGESCHOOL_JOURNEY_ORDER]).toEqual([...WORKSHOP_JOURNEY_ORDER]);
  });

  /**
   * ⚠ NO SWITCH. The second cut's worked-example switch is what makes its
   * practical chapter one piece of work followed five ways; this page has no
   * practical chapter, so the island is not mounted and no section carries a
   * panel stamp. A switch over nothing is a control that does nothing.
   */
  it("carries no worked-example switch", () => {
    const tail = routeFile("ap-hogeschool", "WorkshopTail.tsx");
    expect(tail, "the tail mounts no switch").not.toContain("ArcWorkedSwitch");
    for (const s of AP_HOGESCHOOL_ARC.sections) {
      expect(s.worked, `${s.id}: a panel stamp on a page with no switch`).toBeUndefined();
    }
  });

  /**
   * The student cut: a readout first (where we go, and the worlds the room
   * will see), the close last, and the whole thing inside the archetype's
   * seven-to-sixteen (ADR-131's law, one screen a section).
   */
  it("opens on the readout, closes on the close, and stays inside the law", () => {
    const sections = AP_HOGESCHOOL_ARC.sections;
    const first = sections[0];
    expect(first.kind).toBe("list-groups");
    expect(first.kind === "list-groups" && first.layout).toBe("readout");
    expect(first.id).toBe("today");
    expect(sections.at(-1)?.kind).toBe("close");
    expect(sections.length).toBeGreaterThanOrEqual(7);
    expect(sections.length).toBeLessThanOrEqual(16);

    /* The lecture's own claim: the situation ends on the real question, the
       one world follows it, and the three built worlds come after the board. */
    const ids = sections.map((s) => s.id);
    expect(ids.indexOf("configuration")).toBe(ids.indexOf("real-question") + 1);
    expect(ids.indexOf("tom-on-the-moon")).toBeGreaterThan(ids.indexOf("configuration"));
    expect(ids.indexOf("itp-wall")).toBeGreaterThan(ids.indexOf("tom-verdict"));
    expect(ids.indexOf("this-week")).toBeGreaterThan(ids.indexOf("two-anchors"));
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
});
