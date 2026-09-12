import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import type { ConsoleStation } from "@/components/landing/home-v2/services/casefile/console/ConsoleRail";
import type { CaseTrackVisual } from "@/lib/cases/types";

/**
 * The proof card's tab row — what a card switches between, and what the
 * stations are called (ADR-094 U1).
 *
 * Owner, 2026-09-10: the ATL and tooling cards printed BOTH films and ALL
 * FOUR wireframes into one panel — "that's overwhelming" — and the fix is
 * the house's own rail, moved into the card's header bar. Three of the four
 * cards switch; the ads card does not (six shots at 4:5 is a contact sheet,
 * not a crammed panel).
 *
 * ⚠ THE STATIONS ARE DERIVED, NEVER AUTHORED HERE. The record already names
 * everything this row needs — `CaseFilm.label` and `ProjectCase.tab` — and a
 * second list of names on the route is a second place for a rename to land.
 * That is `proofOrder.ts`'s law one level down: content by REFERENCE, and
 * the route owns only the sequence.
 *
 * ⚠ AND THE MAP IS ABSENT FROM THIS TABLE ON PURPOSE. `PdaConsole` owns its
 * three readings and the flight that carries the selected work between them;
 * its rail is PORTALLED into the head (`railHost`) rather than re-derived,
 * because a copy of those stations here would be a second switch for one
 * piece of state.
 *
 * Pure and react-free, so vitest can walk it (`trinny-proof-tabs.test.ts`).
 */

/** The rail's accessible name, per kind — what this row selects between. */
export function proofTabLabel(kind: CaseTrackVisual["kind"]): string {
  return kind === "films" ? "Above-the-line films" : "Production tools";
}

/**
 * ⚠ A FILM'S HANDLE IS THE PART BEFORE THE MIDDLE DOT. `label` reads
 * "Smug Owl · Loop ATL" — the client half is the same on every film and on
 * the card's own kicker, so a rail printing it twice would say the client
 * three times in one header band. The caption under the frame still carries
 * the full label; this is the handle alone.
 */
export function filmTab(label: string): string {
  const [head] = label.split("·");
  return (head ?? label).trim();
}

/**
 * The stations a card's field switches on, or `null` where the field is one
 * object (`intelligence-map`, whose console brings its own rail).
 */
export function proofTabs(visual: CaseTrackVisual): readonly ConsoleStation[] | null {
  if (visual.kind === "films") {
    return visual.films.map((film) => ({ id: film.src, name: filmTab(film.label) }));
  }
  if (visual.kind === "tools") {
    return visual.toolIds.map((id) => ({
      id,
      // A tool with no record still gets a station rather than vanishing
      // from the row: the field below it draws nothing, which is visible,
      // where a silently shorter rail is not.
      name: PROJECT_CASES.find((c) => c.id === id)?.tab ?? id.toUpperCase(),
    }));
  }
  /* ⚠ AND THE STUDIO'S SHEETS ARE ABSENT FOR THE MAP'S REASON (ADR-094 U3).
     The card DOES switch between them now — the ads, the rule the studio
     drew for when AI may make an image, the limit it refuses to cross — but
     `SheetsPlate` owns which sheet is open, exactly as `PdaConsole` owns
     which reading is, and it portals its own rail into the card's slot. A
     copy of those three stations here would be a second switch for one piece
     of state, and the plate would still be showing whichever sheet IT
     thought was open. */
  return null;
}
