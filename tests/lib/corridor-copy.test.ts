import { describe, expect, it } from "vitest";

import {
  CORRIDOR_COPY_STATIONS,
  DEFAULT_PHASE_SUBS,
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
    // ADR-143 U6: the glyphs' words are the homepage's, and the Build column
    // is ABSENT, so `CopyAnchors` keeps the scene's labels and its gold Model.
    expect(copy.phaseSubs).toBe(DEFAULT_PHASE_SUBS);
    expect(DEFAULT_PHASE_SUBS).toEqual({ navigate: "See", encode: "Crystallize", build: "Ship" });
    expect("stack" in copy, "no column unless a route passes one").toBe(false);
    expect("stack" in resolveCorridorCopy({}), "an empty override passes none").toBe(false);
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

  it("merges the glyphs' words and passes a route's Build column through", () => {
    const stack = {
      surfacesTitle: "T",
      surfacesSub: "s",
      surfaceLabels: ["a", "b", "c", "d", "e"],
      surfaceLit: null,
    };
    const copy = resolveCorridorCopy({ phaseSubs: { build: "Hand over" }, stack });
    expect(copy.phaseSubs).toEqual({ ...DEFAULT_PHASE_SUBS, build: "Hand over" });
    expect(DEFAULT_PHASE_SUBS.build, "the defaults are never written").toBe("Ship");
    expect(copy.stack).toBe(stack);
  });
});
