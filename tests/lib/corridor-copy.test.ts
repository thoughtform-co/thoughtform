import { describe, expect, it } from "vitest";

import {
  CORRIDOR_COPY_STATIONS,
  DEFAULT_SIGNAL_COPY,
  phoneSignalTitleHtml,
  resolveCorridorCopy,
} from "@/lib/home-v2/corridorCopy";
import { stationById } from "@/lib/home-v2/corridorMap";

/**
 * The corridor's copy seam (ADR-143 U3). With nothing passed it IS today's
 * copy, by reference, so `/` and every route but the workshop's third cut
 * render byte-identical.
 */
describe("corridor copy", () => {
  it("is the corridor map's own content when nothing is passed", () => {
    const copy = resolveCorridorCopy();
    for (const id of CORRIDOR_COPY_STATIONS) {
      expect(copy.stations[id], id).toBe(stationById(id)?.content);
    }
    expect(copy.signal).toBe(DEFAULT_SIGNAL_COPY);
    expect(resolveCorridorCopy({}).signal).toBe(DEFAULT_SIGNAL_COPY);
  });

  it("keeps the homepage's signal line verbatim", () => {
    expect(DEFAULT_SIGNAL_COPY).toEqual({
      titleHtml: "WE EMBED IN YOUR TEAM<br><em>UNTIL IT RUNS WITHOUT US.</em>",
      ariaLabel: "We embed in your team until it runs without us",
      cta: "HOW IT LOOKS IN PRACTICE",
      ticker: true,
    });
    expect(phoneSignalTitleHtml(DEFAULT_SIGNAL_COPY.titleHtml)).toBe(
      "WE EMBED IN YOUR TEAM <em>UNTIL IT RUNS WITHOUT US.</em>"
    );
  });

  it("merges an override: a caption replaces support and floor, nothing else", () => {
    const copy = resolveCorridorCopy({
      stations: { diagnostic: "A<br>B" },
      signal: { cta: "GO", ticker: false },
    });
    const base = stationById("diagnostic")!.content!;
    expect(copy.stations.diagnostic).toEqual({
      ...base,
      supportHtml: "A<br>B",
      floorHtml: "A<br>B",
    });
    expect(copy.stations.navigate).toBe(stationById("navigate")?.content);
    expect(copy.signal).toEqual({ ...DEFAULT_SIGNAL_COPY, cta: "GO", ticker: false });
    expect(base.supportHtml, "the map is never written").not.toBe("A<br>B");
  });
});
