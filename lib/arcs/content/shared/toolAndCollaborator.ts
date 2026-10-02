import type { ArcSectionOf } from "../../types";

/**
 * Tool and collaborator: the spectrum's RECORD (ADR-136, hoisted by ADR-139
 * U1). Four pages show this beat: the workshop archetype, its second cut, the
 * course's class-one deck and the AP Hogeschool lecture. Each spreads this
 * into its `spectrum` section and authors only its own head (ADR-072: share
 * the evidence, author the frame), so a change to the drawing lands on all
 * four at once. `arcs-registry` pins the references `toBe`.
 *
 * ⚠ THE MIDDLE IS SCHWARTZ'S TURN (ADR-139 U1, owner 2026-10-02). It was
 * "a third skill: brief it, give it room, judge what comes back"; the
 * nuance it lacked is that the collaborator a room pictures is a peer who
 * knows what is interesting and when it is done, and the one it has is not
 * that. So the line says which one to work with, and `source` credits it.
 */
export const TOOL_AND_COLLABORATOR: Pick<
  ArcSectionOf<"spectrum">,
  "poles" | "middle" | "bands" | "source"
> = {
  poles: [
    {
      label: "Tool",
      head: "Executes commands",
      lines: [
        "You say exactly what to do",
        "It does that, or fails clearly",
        "You check every result",
      ],
    },
    {
      label: "Collaborator",
      head: "Interprets intent",
      lines: [
        "You explain what you are after",
        "It works out the steps",
        "You agree on what good looks like",
      ],
    },
  ],
  middle: {
    label: "AI sits here",
    head: "Both, at once",
    line: "Treat it as the collaborator it actually is: give it what it does well, and keep the judging.",
  },
  bands: { start: "Software", end: "Intelligence" },
  source: "After Matthew Schwartz, Claude-shaped science, Anthropic",
};
