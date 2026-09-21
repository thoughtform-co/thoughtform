import { describe, expect, it } from "vitest";

import {
  kitEngagements,
  kitSections,
  KIT_CLIENTS,
  KIT_NOW,
} from "@/app/(internal)/test/arcs-instrument-kit/fixtures";
import { arcsInstrumentSections, instrumentSections } from "@/lib/sheet/arcs";
import { atOnWindow, axisWindow } from "@/lib/sheet/axis";
import {
  chaptersOf,
  compositionViolations,
  instrumentViolations,
  ordinalOf,
} from "@/lib/sheet/composition";
import {
  addDays,
  dayNumber,
  isoOfDay,
  letterDateDotted,
  mondayOf,
  todayIn,
} from "@/lib/sheet/dates";
import type { SheetSection } from "@/lib/sheet/types";

/**
 * The arcs instrument's law and its axis (ADR-118).
 *
 * ⚠ THE HALF A STILL CANNOT SHOW. The ship's rubric (blocks M and L) asks a
 * grader whether the marks look seated and the lit one looks chosen; whether
 * a mark sits at ITS OWN date, and whether the lit diamond IS the filled row,
 * are facts about the data — so they are asserted here, on the real overview,
 * on the kit, and on each way the law can be broken.
 */

const TODAY = "2026-09-21";

type Monitor = Extract<SheetSection, { kind: "monitor" }>;
type Log = Extract<SheetSection, { kind: "log" }>;

function split(sections: SheetSection[]): [Monitor, Log] {
  const [m, l] = sections;
  if (m?.kind !== "monitor" || l?.kind !== "log") throw new Error("not an instrument");
  return [m, l];
}

describe("the axis (ADR-118)", () => {
  it("counts days in UTC and finds the Monday", () => {
    expect(isoOfDay(dayNumber("2026-09-21"))).toBe("2026-09-21");
    expect(addDays("2026-02-27", 2)).toBe("2026-03-01");
    expect(mondayOf("2026-09-21")).toBe("2026-09-21"); // a Monday
    expect(mondayOf("2026-09-27")).toBe("2026-09-21"); // its Sunday
    expect(mondayOf("2026-07-27")).toBe("2026-07-27");
    expect(letterDateDotted("2026-09-12")).toBe("2026·09·12");
  });

  it("asks the practice's own clock for today, never the server's", () => {
    // 22:30 UTC on the 20th is already the 21st in Brussels (UTC+2 in September).
    expect(todayIn("Europe/Brussels", new Date("2026-09-20T22:30:00Z"))).toBe("2026-09-21");
    expect(todayIn("UTC", new Date("2026-09-20T22:30:00Z"))).toBe("2026-09-20");
  });

  it("draws the record's own stretch in whole weeks, one week of lead-in, NOW in the last", () => {
    const w = axisWindow("2026-07-27", TODAY);
    expect(w).toMatchObject({
      from: "2026-07-20",
      to: "2026-09-27",
      division: "week",
      divisionLabel: "1 week",
      rangeLabel: "20 Jul to 27 Sep 2026",
    });
    expect(w.ticks).toHaveLength(10);
    expect(w.ticks[0]).toEqual({ at: 0, label: "20 Jul" });
    // The division that holds today gives its label to NOW.
    expect(w.ticks[9].label).toBe("");
    expect(w.ticks.map((t) => t.at)).toEqual(w.ticks.map((_, i) => i / 10));
    // A date sits at the middle of its day.
    expect(atOnWindow(w, "2026-07-27")).toBeCloseTo(7.5 / 70, 12);
    expect(atOnWindow(w, TODAY)).toBeCloseTo(63.5 / 70, 12);
  });

  it("switches to months past sixteen weeks, and to quarters past two years", () => {
    const months = axisWindow("2026-01-10", TODAY);
    expect(months.division).toBe("month");
    expect(months.from).toBe("2025-12-01");
    expect(months.to).toBe("2026-09-30");
    expect(months.ticks.map((t) => t.label)).toEqual([
      "Dec 2025",
      "Jan 2026",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "",
    ]);

    const quarters = axisWindow("2023-01-01", TODAY);
    expect(quarters).toMatchObject({
      from: "2023-01-01",
      to: "2026-09-30",
      division: "quarter",
      rangeLabel: "1 Jan 2023 to 30 Sep 2026",
    });
    expect(quarters.ticks).toHaveLength(15);
    expect(quarters.ticks.filter((t) => t.label).map((t) => t.label)).toEqual([
      "2023",
      "2024",
      "2025",
      "2026",
    ]);
  });
});

describe("the instrument's law (ADR-118)", () => {
  const real = arcsInstrumentSections(TODAY);

  it("passes the real overview and the kit, and the document law defers to it", () => {
    expect(instrumentViolations(real)).toEqual([]);
    expect(compositionViolations(real)).toEqual([]);
    expect(instrumentViolations(kitSections())).toEqual([]);
    expect(instrumentViolations(kitSections("fills"))).toEqual([]); // a DOM fake, not a data one
  });

  it("gives neither frame an ordinal, and makes both chapters", () => {
    expect(ordinalOf(real, 0)).toBeNull();
    expect(ordinalOf(real, 1)).toBeNull();
    expect(chaptersOf(real)).toEqual([
      { id: "monitor", label: "Monitor", primary: true },
      { id: "log", label: "Log", primary: true },
    ]);
  });

  it("refuses the EVEN fake by name: marks spread like a bullet row are not at their dates", () => {
    const v = instrumentViolations(kitSections("even"));
    expect(v.some((s) => /not seated at its date/.test(s))).toBe(true);
  });

  it("fails each way a monitor and a log can stop being one device", () => {
    const [monitor, log] = split(real);
    const other = log.groups[log.groups.length - 1].rows[0].id;
    const cases: [string, SheetSection[], RegExp][] = [
      ["the order", [log, monitor], /monitor then log/],
      [
        "a document section beside them",
        [monitor, log, { kind: "close", id: "x" }],
        /monitor then log/,
      ],
      [
        "the lit mark is not the choice",
        [{ ...monitor, lit: other }, log],
        /lit mark is not the selected row/,
      ],
      [
        "a mark on no lane",
        [
          {
            ...monitor,
            plot: {
              ...monitor.plot,
              marks: monitor.plot.marks.map((m, i) => (i === 0 ? { ...m, lane: "nowhere" } : m)),
            },
          },
          log,
        ],
        /sits on no lane/,
      ],
      [
        "a count that disagrees with the diamonds",
        [
          {
            ...monitor,
            terminus: monitor.terminus.map((r) =>
              r.label === "Marks" ? { ...r, value: "99" } : r
            ),
          },
          log,
        ],
        /Marks reading/,
      ],
      [
        "an engagement filed after now",
        [
          {
            ...monitor,
            plot: { ...monitor.plot, now: { ...monitor.plot.now, date: "2026-08-01" } },
          },
          log,
        ],
        /filed after now/,
      ],
      [
        "a row with no dossier",
        [monitor, { ...log, dossiers: log.dossiers.slice(1) }],
        /rows are not its dossiers/,
      ],
      [
        "a group read oldest first",
        [
          monitor,
          {
            ...log,
            groups: log.groups.map((g) =>
              g.rows.length > 1 ? { ...g, rows: [...g.rows].reverse() } : g
            ),
          },
        ],
        /newest first/,
      ],
      [
        "the kind sections in kind order rather than by their newest filing",
        [monitor, { ...log, groups: [...log.groups].reverse() }],
        /sections are not in order of their newest filing/,
      ],
      [
        "a row filed under another kind's section",
        [
          monitor,
          {
            ...log,
            groups: log.groups.map((g, i) =>
              i === 0 ? { ...g, rows: [...g.rows, log.groups[1].rows[0]] } : g
            ),
          },
        ],
        /sits in the .+ section/,
      ],
      [
        "a configuration past its ceiling",
        [
          monitor,
          {
            ...log,
            dossiers: log.dossiers.map((d) =>
              d.configuration
                ? {
                    ...d,
                    configuration: {
                      ...d.configuration,
                      links: Array.from({ length: 9 }, (_, i) => ({
                        id: `x${i}`,
                        kind: "ops" as const,
                        kicker: "Ops",
                        name: `Tool ${i}`,
                        users: 1,
                      })),
                    },
                  }
                : d
            ),
          },
        ],
        /configuration of 9 links/,
      ],
      [
        "a link no workstream names",
        [
          monitor,
          {
            ...log,
            dossiers: log.dossiers.map((d) =>
              d.configuration
                ? {
                    ...d,
                    configuration: {
                      ...d.configuration,
                      links: d.configuration.links.map((l) => ({ ...l, users: 0 })),
                    },
                  }
                : d
            ),
          },
        ],
        /is named by 0 of/,
      ],
    ];
    for (const [name, ladder, re] of cases) {
      const v = instrumentViolations(ladder);
      expect(
        v.some((s) => re.test(s)),
        `${name}: ${v.join(" / ") || "no violation"}`
      ).toBe(true);
    }
  });
});

describe("the kit exercises what the record does not hold yet (ADR-118)", () => {
  const [monitor, log] = split(kitSections());

  it("pins NOW, so a still of it is the same on every day", () => {
    expect(monitor.plot.now.date).toBe(KIT_NOW);
  });

  it("holds a three-engagement client, a run in progress, a same-day pair and an entering lane", () => {
    /* Counted per CLIENT, not per section: since U2 the sections are kinds,
       and a production section of five would satisfy "three in a group"
       with no client holding three. */
    const rows = log.groups.flatMap((g) => g.rows);
    const perClient = new Map<string, number>();
    for (const r of rows) perClient.set(r.name, (perClient.get(r.name) ?? 0) + 1);
    expect(Math.max(...perClient.values())).toBeGreaterThanOrEqual(3);
    expect(monitor.plot.marks.some((m) => m.standing === "running")).toBe(true);
    const twins = monitor.plot.marks.filter((m) => m.slot !== undefined);
    expect(twins.map((m) => m.slot)).toEqual([-0.5, 0.5]);
    expect(new Set(twins.map((m) => `${m.lane}|${m.date}`)).size).toBe(1);
    expect(monitor.plot.lanes.some((l) => l.since)).toBe(true);
  });

  it("sections a client's keynote beside a house format's V2 cut, and draws the ceiling", () => {
    const keynotes = log.groups.find((g) => g.id === "keynote")!;
    expect(keynotes.rows.map((r) => [r.name, r.engagement])).toEqual([
      ["The fixture keynote", "House format · V2"],
      ["Meridian", "The keynote"],
    ]);
    const ceiling = log.dossiers.find((d) => d.id === "northwind-proposal")!.configuration!;
    expect(ceiling.rows.filter((r) => !r.ghost)).toHaveLength(4);
    expect(ceiling.links).toHaveLength(8);
  });

  it("orders the log by filing and the monitor by registry, whatever order the registry is in", () => {
    /* ADR-118 U1, kept by U2. The kit's own registry order already IS its
       filing order, so it cannot tell the two apart; reversed, it can. The
       log's sections must not move (newest filing first) while the lanes
       follow the registry they were handed. */
    const reversed = [...KIT_CLIENTS].reverse();
    const [m, l] = split(instrumentSections(kitEngagements(), reversed, KIT_NOW));
    expect(l.groups.map((g) => g.id)).toEqual(log.groups.map((g) => g.id));
    expect(l.groups.map((g) => g.id)).toEqual(["production", "keynote", "workshop"]);
    expect(m.plot.lanes.filter((x) => !x.id.startsWith("formats-")).map((x) => x.id)).toEqual(
      reversed.map((c) => c.slug)
    );
    expect(instrumentViolations([m, l])).toEqual([]);
  });
});
