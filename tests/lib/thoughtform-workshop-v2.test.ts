import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { WORKSHOP_V2_JOURNEY_ORDER } from "@/app/(marketing)/arcs/thoughtform/workshop-v2/journey";
import { WORKSHOP_JOURNEY_ORDER } from "@/app/(marketing)/arcs/thoughtform/workshop-v1/journey";
import { GROUPS } from "@/lib/arcs/clients";
import { THOUGHTFORM_WORKSHOP_V2_ARC } from "@/lib/arcs/content/thoughtform-workshop-v2";
import { getArcAt } from "@/lib/arcs/registry";
import { getThoughtformWorkshopContent } from "@/lib/v7-parse";

/**
 * The second cut's route guard (ADR-139).
 *
 * ⚠ DELIBERATELY NOT A COPY OF v1's PARSE TEST. This route reads the SAME
 * prototype through the SAME function with the SAME removed stations, so
 * `thoughtform-workshop-parse.test.ts` already guards the markup for both;
 * a second copy of those ten assertions would be ten more things to edit
 * when the prototype moves, and they would drift the first time somebody
 * edited one file and not the other. What is pinned here is only what is
 * TRUE OF THIS ROUTE AND NOT OF v1: that it shares rather than forks, and
 * the one wiring step nothing else in the suite notices.
 */

const ARCS_DIR = join(__dirname, "..", "..", "app", "(marketing)", "arcs");
const routeFile = (...p: string[]) => readFileSync(join(ARCS_DIR, ...p), "utf8");

const WORKSHOP_PARSE_OPTIONS = {
  removeStations: [
    "definition",
    "missing-layer",
    "intelligence-layer",
    "continuum",
    "practice",
    "buildQuote",
    "build",
  ],
  corridorMountId: "home-corridor-mount",
} as const;

describe("the workshop's second cut (ADR-139)", () => {
  /**
   * ⚠ THE ONE SILENT FAILURE MODE. A static folder under `/arcs/<group>/`
   * shadows the dynamic `[slug]/[leaf]` segment, and its
   * `generateStaticParams` must filter the arc out or the build emits a
   * prerender nobody can reach. Nothing errors when it is missed — the page
   * simply exists twice and one copy is dead — so this walks the folders
   * rather than pinning a list, and a future own route is covered the day it
   * is created. Since ADR-142 an own route is two levels deep, and a folder
   * that renders a page is either an arc (filtered by its id) or one of its
   * group's `pages` (a pitch, the corridor variant), never neither.
   */
  it("every own-route folder is filtered out of the dynamic segment", () => {
    const dirs = (path: string) =>
      readdirSync(path, { withFileTypes: true })
        .filter((e) => e.isDirectory() && !e.name.startsWith("[") && !e.name.startsWith("_"))
        .map((e) => e.name);
    const renders = (...p: string[]) => {
      try {
        readFileSync(join(ARCS_DIR, ...p, "page.tsx"), "utf8");
        return true;
      } catch {
        return false;
      }
    };
    const own = dirs(ARCS_DIR).flatMap((group) =>
      dirs(join(ARCS_DIR, group))
        .filter((leaf) => renders(group, leaf))
        .map((leaf) => ({ group, leaf }))
    );
    expect(
      own.map((o) => `${o.group}/${o.leaf}`),
      "the arcs namespace has own routes to filter"
    ).toContain("thoughtform/workshop-v2");
    // A page at `/arcs/<group>` would shadow the group's listing.
    for (const group of dirs(ARCS_DIR)) {
      expect(renders(group), `/arcs/${group}: a group folder renders no page of its own`).toBe(
        false
      );
    }
    const leafPage = routeFile("[slug]", "[leaf]", "page.tsx");
    for (const { group, leaf } of own) {
      const here = `/arcs/${group}/${leaf}`;
      const arc = getArcAt(group, leaf);
      if (arc) {
        expect(leafPage, `${here}: an own route with no OWN_ROUTE_SLUGS row`).toContain(
          `"${arc.slug}"`
        );
      } else {
        const pages = GROUPS.find((g) => g.slug === group)?.pages ?? [];
        expect(
          pages.map((p) => p.href),
          `${here}: a folder that is neither an arc nor a page of its group`
        ).toContain(here);
      }
    }
  });

  /**
   * ⚠ IT SHARES v1's PROTOTYPE, SHEET AND ROOT CLASS, and that is a decision
   * rather than an accident: the corridor half is the same page. The day it
   * stops being, all three fork together — never one of them — because the
   * stylesheet, `usePortraitDeck` and `useWorkshopFlow` all reach `.tw-root`
   * globally and a half-fork would leave two routes fighting over it.
   */
  it("shares the corridor with v1 rather than forking it", () => {
    const page = routeFile("thoughtform", "workshop-v2", "page.tsx");
    expect(page, "renders v1's root class").toContain('className="tw-root"');
    expect(page, "imports v1's route sheet").toContain('"../workshop-v1/thoughtform-workshop.css"');
    expect(page, "reads v1's prototype").toContain("getThoughtformWorkshopContent");
    for (const station of WORKSHOP_PARSE_OPTIONS.removeStations) {
      expect(page, `removes ${station}, as v1 does`).toContain(`"${station}"`);
    }
    const portals = routeFile("thoughtform", "workshop-v2", "WorkshopPortals.tsx");
    expect(portals, "reuses v1's proof, never a copy").toContain('"../workshop-v1/WorkshopProof"');
    expect(portals, "reuses v1's About flow").toContain('"../workshop-v1/flow/useWorkshopFlow"');
    /* The two orders are equal TODAY. The files are separate so they need
       not stay equal; this only records that nothing has diverged yet, and
       it is a deliberately weak pin. */
    expect([...WORKSHOP_V2_JOURNEY_ORDER]).toEqual([...WORKSHOP_JOURNEY_ORDER]);
  });

  it("the parsed body still carries both slots this route mounts into", () => {
    const html = getThoughtformWorkshopContent(WORKSHOP_PARSE_OPTIONS).bodyHtml;
    expect(html.match(/data-tw-proof-root/g)?.length, "one proof slot").toBe(1);
    expect(html.match(/data-tw-arc-root/g)?.length, "one arc slot").toBe(1);
  });

  /**
   * ⚠ THE OPENING IS THE BOARD IN MINIATURE, as on v1: the page hands over
   * from the corridor into the workshop with a promise of the picture the
   * room meets at the configuration, and the lit plates are the two the
   * team writes.
   */
  it("opens on the board and closes on the practical chapter", () => {
    const sections = THOUGHTFORM_WORKSHOP_V2_ARC.sections;
    expect(sections[0].kind).toBe("hero-board");
    expect(sections.at(-1)?.kind).toBe("close");

    /* The second cut's own claim: the framing ends on the market, and
       everything after it is the configuration actually built. */
    const ids = sections.map((s) => s.id);
    expect(ids.indexOf("ground"), "the ground follows the curve").toBe(
      ids.indexOf("the-curve") + 1
    );
    /* ADR-139 U1: the hull answers the turn's question (a person or an
       agent?) and hands to the horizon (what an agent needs to run long). */
    expect(ids.indexOf("agent-shaped"), "the hull answers the turn").toBe(
      ids.indexOf("person-or-agent") + 1
    );
    expect(ids.indexOf("the-horizon"), "and hands to the horizon").toBe(
      ids.indexOf("agent-shaped") + 1
    );
    expect(ids.indexOf("signal"), "the market closes the framing").toBeLessThan(
      ids.indexOf("made-real-voice")
    );
    /* ⚠ THE BENCH IS NOT SWITCHED, and it is the last beat of the chapter:
       the writing Skill is the only one of the three whose evals are written
       down, so the chapter goes wide on five beats and deep on one. */
    const bench = sections.find((s) => s.kind === "bench");
    expect(bench?.worked, "the bench carries no worked-example panel").toBeUndefined();
    expect(ids.indexOf("the-bench")).toBeGreaterThan(ids.indexOf("when-wrong-reference"));
  });
});
