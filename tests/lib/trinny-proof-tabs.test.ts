import { describe, expect, it } from "vitest";

import { trinnyProofTracks } from "@/app/(marketing)/arcs/trinny-london/proposal/proof/proofOrder";
import {
  filmTab,
  proofTabLabel,
  proofTabs,
} from "@/app/(marketing)/arcs/trinny-london/proposal/proof/proofTabs";
import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";

/**
 * ADR-094 U1 — the proof card's tab row.
 *
 * The row exists because two cards printed everything they had at once
 * (owner, 2026-09-10: "overwhelming"), and the fix is only honest if the
 * stations come from the RECORD. So these pin the derivation, not a list:
 * which cards switch, how many stations each gets, and that every name is a
 * real handle rather than a string typed on the route.
 */
describe("the proof cards' tab rows", () => {
  const tracks = trinnyProofTracks();
  const byId = (id: string) => tracks.find((t) => t.id === id)!;

  it("switches the two crammed cards and the map, and nothing else", () => {
    // The ads card is SIX SHOTS AT 4:5 — a contact sheet, which is one
    // object however many pictures are in it. The map brings its own rail
    // (portalled into the head), so it is absent from this table by design;
    // a copy of its three readings here would be a second switch for one
    // piece of state.
    expect(proofTabs(byId("studio").visual)).toBeNull();
    expect(proofTabs(byId("ai-transformation").visual)).toBeNull();
    expect(proofTabs(byId("atl-films").visual)).toHaveLength(2);
    expect(proofTabs(byId("tooling").visual)).toHaveLength(4);
  });

  it("takes the tools' stations from PROJECT_CASES, not from the route", () => {
    const visual = byId("tooling").visual;
    if (visual.kind !== "tools") throw new Error("the tooling card stopped being a tools field");
    const stations = proofTabs(visual)!;
    expect(stations.map((s) => s.id)).toEqual([...visual.toolIds]);
    for (const s of stations) {
      const rec = PROJECT_CASES.find((c) => c.id === s.id);
      expect(rec, `${s.id} is a canonical tool`).toBeTruthy();
      expect(s.name).toBe(rec!.tab);
    }
  });

  it("takes a film's handle off its label, and drops the client half", () => {
    // "Smug Owl · Loop ATL" → "Smug Owl". The client is already the card's
    // own kicker one slot to the left of this rail, and the full label is
    // still under the frame.
    expect(filmTab("Smug Owl · Loop ATL")).toBe("Smug Owl");
    expect(filmTab("DJ Neighbour · Loop ATL")).toBe("DJ Neighbour");
    // A label with no separator is its own handle rather than an empty tab.
    expect(filmTab("Untitled")).toBe("Untitled");

    const visual = byId("atl-films").visual;
    if (visual.kind !== "films") throw new Error("the ATL card stopped being a films field");
    const stations = proofTabs(visual)!;
    for (const [i, s] of stations.entries()) {
      expect(s.name).toBe(filmTab(visual.films[i].label));
      expect(s.name).not.toMatch(/loop/i);
      expect(s.name.length, `${s.name} fits a header-bar box`).toBeLessThanOrEqual(14);
    }
  });

  it("gives every station a distinct id, so React keys and the rail agree", () => {
    for (const t of tracks) {
      const stations = proofTabs(t.visual);
      if (!stations) continue;
      expect(new Set(stations.map((s) => s.id)).size, `${t.id} station ids`).toBe(stations.length);
      for (const s of stations) expect(s.name.trim(), `${t.id} station name`).not.toBe("");
    }
  });

  it("names the row for what it selects between", () => {
    expect(proofTabLabel("films")).toMatch(/film/i);
    expect(proofTabLabel("tools")).toMatch(/tool/i);
  });
});
