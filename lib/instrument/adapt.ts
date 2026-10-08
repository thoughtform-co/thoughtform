/**
 * adapt — the three old shapes, read into the one record (ADR-154).
 *
 * Nothing is retyped during the migration: a page keeps its `questions`,
 * `configuration` or `board` record and the instrument reads it through one
 * of these. Pure; `instrument-record.test.ts` pins the mappings on the real
 * records.
 *
 *   fromQuestions      the identity: the six, already in the owner's order
 *   fromConfiguration  the five questions of the proposals' picker:
 *                        runs → model · bar → evals · reach → data ·
 *                        where → interface · owner → owner;
 *                      the context is the one thing the five never said,
 *                      and the one thing the team writes, so it is authored
 *   fromBoard          the five facts of the configured board:
 *                        seat → owner · layer → context · tools → interface ·
 *                        card → the work · reach → the org's socket
 */

import type { ArcSectionOf, BoardState } from "@/lib/arcs/types";

import type { InstrumentPart, InstrumentRecord, PartId } from "./types";

type QuestionsBody = Pick<ArcSectionOf<"questions">, "work" | "left" | "right" | "tag" | "alt">;

export function fromQuestions(id: string, q: QuestionsBody): InstrumentRecord {
  const parts = [...q.left, ...q.right].map(
    (x): InstrumentPart => ({
      id: x.id as PartId,
      title: x.title,
      question: x.question,
      answer: x.answer,
      state: x.lit ? "lit" : x.human ? "human" : "quiet",
    })
  );
  return {
    id,
    parts: parts as unknown as InstrumentRecord["parts"],
    work: q.work,
    tag: q.tag,
    alt: { work: q.alt },
  };
}

type ConfigurationTeam = ArcSectionOf<"configuration">["teams"][number];

/** The words the six carry when the source never said them. */
const TITLES: Record<PartId, { title: string; question: string }> = {
  model: { title: "The model", question: "What runs it" },
  context: { title: "The context", question: "What it knows" },
  evals: { title: "The evaluations", question: "How we know it is good" },
  data: { title: "The data", question: "What it can reach" },
  interface: { title: "The interface", question: "Where you meet it" },
  owner: { title: "The owner", question: "Who answers for it" },
};

function part(
  id: PartId,
  answer: string,
  state: InstrumentPart["state"] = "quiet"
): InstrumentPart {
  return { id, ...TITLES[id], answer, state };
}

export function fromConfiguration(
  id: string,
  team: ConfigurationTeam,
  context: string,
  evalsLit = true,
  tag = "You write this"
): InstrumentRecord {
  return {
    id,
    parts: [
      part("model", team.runs),
      part("context", context, "lit"),
      part("evals", team.bar, evalsLit ? "lit" : "quiet"),
      part("data", team.reach),
      part("interface", team.where),
      part("owner", team.owner, "human"),
    ],
    work: {
      label: "The work",
      name: team.name,
      line: team.work,
      bar: { label: "Good looks like", line: team.bar },
    },
    tag,
    alt: {
      work: `${team.name} at the centre, with six questions wired around it: the context and the evaluations lit, the owner in green`,
    },
  };
}

export function fromBoard(
  id: string,
  state: BoardState<"configured">,
  evals: string,
  tag = "You write this"
): InstrumentRecord {
  const layer = state.layer.rows.map((r) => r.tag).join(", ") || state.layer.sub || "";
  return {
    id,
    parts: [
      part("model", state.tools.items[0]?.name ?? ""),
      part("context", layer, "lit"),
      part("evals", evals, "lit"),
      part(
        "data",
        state.tools.items
          .slice(1)
          .map((t) => t.name)
          .join(", ")
      ),
      part("interface", state.tools.items.map((t) => t.name).join(", ")),
      part("owner", state.seat.a, "human"),
    ],
    work: {
      label: "The work",
      name: state.card.name,
      line: state.card.work,
      bar: { label: "Good looks like", line: evals },
    },
    org: {
      label: state.label,
      name: state.seat.q,
      os: { name: state.card.name, line: state.card.work },
      workstreams: [{ id: "work", name: state.card.name }],
      socket: { label: state.reach.label, name: state.reach.value },
    },
    tag,
    alt: { work: state.alt, org: state.alt },
  };
}
