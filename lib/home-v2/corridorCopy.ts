import type {
  CorridorCopyOverride,
  CorridorCopyStationId,
  CorridorSignalCopy,
} from "@/lib/v7-parse/types";

import { stationById, type NodeContent } from "./corridorMap";

/**
 * The corridor's own copy, ONE RECORD PER ROUTE (ADR-143 U3).
 *
 * The three station captions and the epilogue's signal line are read by
 * five surfaces: the desktop station blocks and caption card
 * (`CorridorStationHeaders`), the phone readouts (`StationTitle`), the
 * phone signal block (`MobileEpilogueSignal`), and the no-WebGL fallback
 * (`HomeCorridor`). They read it here, through `CorridorCopyContext`, so
 * a route can say its own corridor without a fork of any of them.
 *
 * ⚠ IDENTITY WHEN NOTHING IS PASSED. `resolveCorridorCopy()` hands back
 * the corridor map's own `content` objects by reference and the signal
 * strings below, so `/` and every route that passes no `copy` render
 * byte-identical. `corridor-copy.test.ts` pins it.
 *
 * Pure: no React, no DOM. Titles and telemetry are never overridden; a
 * station's caption replaces its `supportHtml` and `floorHtml` together.
 */

export const CORRIDOR_COPY_STATIONS: readonly CorridorCopyStationId[] = [
  "navigate",
  "diagnostic",
  "intelligence",
];

export const DEFAULT_SIGNAL_COPY: Readonly<CorridorSignalCopy> = {
  // The accent sits on the CLOSING phrase, which is where every other
  // headline on the site puts it ("Tools the team builds itself", "Plot
  // your course.") — owner, 2026-07-27, and unchanged since.
  //
  // ⚠ THE SUBJECT OF THIS BEAT IS OURS NOW, NOT THE MARKET'S (owner,
  // 2026-09-09 — supersedes the 2026-07-27 BUILD/OWN inversion, which is
  // recorded below because the reasoning still binds one level up).
  //
  // It used to read "EVERYONE IS RACING TO / BUILD THIS CAPABILITY." with
  // "WE HELP YOU OWN YOURS" as its CTA — a claim about OpenAI, Anthropic
  // and Palantir, with our own position as a four-word clause hanging off
  // their headline. That inversion was real and it worked while the race
  // was news; once it stopped being news the headline had nothing left to
  // do, and the subordinate clause was always the actual argument.
  //
  // So the hierarchy inverts rather than the verbs: OWNERSHIP is the
  // title, and the race demotes to the layer where its evidence already
  // lives — the ticker underneath. Nothing is thrown away. The ticker
  // stops being proof of a claim we are making and becomes the reason the
  // claim is urgent, which is a better job for three real headlines, and
  // and the note that used to tie them together is gone.
  //
  // ⚠ THE TITLE IS THE CAPABILITY, IN THE HOUSE'S OWN WORDS (owner,
  // 2026-09-14: "we can simplify it by saying 'AI capability your team
  // owns'" — supersedes the 2026-09-09 pair below). It is the services
  // masthead's own authored line (`serviceData.ts`), so the beat and the
  // offer it leads into say one thing in one voice.
  //
  // The 2026-09-09 shape it replaces, recorded because the reasoning still
  // binds one level up: "AN INTELLIGENCE LAYER YOU OWN, / AND A TEAM THAT
  // RUNS IT." — the PAIR from `04-the-offering.md` ("a layer nobody curates
  // freezes; a trained team with no layer evaporates; the pair is the
  // product"). The owner collapsed it to the capability; the pair is still
  // what the offer below unpacks.
  //
  // ⚠ AND IT MAY NEVER SAY "SELF-SUFFICIENT" — the same reference bans
  // the word outright: say the behaviour, because the abstraction hides
  // the mechanics that make it real. "Your team owns" is the behaviour;
  // "a self-sufficient team" is the abstraction.
  //
  // ⚠ THE TITLE IS THE GOAL THE ARC HANDS TO THE PROOF (owner, 2026-09-26,
  // ADR-126 — supersedes the 2026-09-14 line above on THIS surface only).
  // "AI CAPABILITY / YOUR TEAM OWNS." printed twice: here and as the
  // services masthead, with the whole proof pile between. The masthead
  // keeps it (it is the proposition, above the offer); this beat says what
  // the pile beneath it illustrates — we embed, until the team runs it
  // without us — which is also what the ticker's four headlines argue
  // for. "Runs without us" is the behaviour, said the language bank's way.
  // The ticker and the CTA (HOW IT LOOKS IN PRACTICE) are untouched. A
  // draft in the site's register, for the owner's voice.
  titleHtml: "WE EMBED IN YOUR TEAM<br><em>UNTIL IT RUNS WITHOUT US.</em>",
  // ⚠ THE PHONE'S REGION LABEL is the third thing that moves with the
  // title (`MobileEpilogueSignal`).
  ariaLabel: "We embed in your team until it runs without us",
  // ⚠ THE BUTTON NAMES WHERE IT LANDS: the proof stack at `#services`.
  // "HOW IT LOOKS IN PRACTICE" since 2026-09-21 (owner); the history is
  // beside the desktop CTA in `CorridorStationHeaders`.
  cta: "HOW IT LOOKS IN PRACTICE",
  ticker: true,
};

export interface CorridorCopy {
  stations: Record<CorridorCopyStationId, NodeContent | undefined>;
  signal: Readonly<CorridorSignalCopy>;
}

export function resolveCorridorCopy(override?: CorridorCopyOverride): CorridorCopy {
  const stations = {} as Record<CorridorCopyStationId, NodeContent | undefined>;
  for (const id of CORRIDOR_COPY_STATIONS) {
    const content = stationById(id)?.content;
    const caption = override?.stations?.[id];
    stations[id] =
      content && caption !== undefined
        ? { ...content, supportHtml: caption, floorHtml: caption }
        : content;
  }
  const signal = override?.signal
    ? { ...DEFAULT_SIGNAL_COPY, ...override.signal }
    : DEFAULT_SIGNAL_COPY;
  return { stations, signal };
}

/** The phone sets the signal title against a narrow box, so its one
 *  authored `<br>` becomes a space and the gold `<em>` marks the turn. */
export function phoneSignalTitleHtml(titleHtml: string): string {
  return titleHtml.replace(/<br\s*\/?>/gi, " ");
}
