import type { ArcBenchExample } from "../../types";

/**
 * THE WRITING BENCH's RECORD (ADR-128 B2, hoisted by ADR-139): the practice's
 * own writing Skill and its four named checks, with a first draft that fails
 * and the same text rewritten, on the bench that shows a Skill and its evals
 * running.
 *
 * ⚠ HOISTED FOR THE REASON `shared/frontierCurve.ts` WAS. Two pages now show
 * this bench — the workshop archetype and its second cut — and it is one
 * piece of evidence about one Skill, not two. A copy would be two records of
 * the same four checks, drifting apart the first time a check is reworded.
 * The archetype's rendered output is unchanged: the same object, by
 * reference.
 *
 * ⚠ IT IS TEXT, NOT PICTURES, AND DELIBERATELY (ADR-131): a base fork may
 * not carry a client's imagery, and writing is the one craft every room in
 * the building shares, so the example reads for a studio, a finance team and
 * an engineering team alike.
 */
export const WRITING_BENCH: ArcBenchExample = {
  id: "writing",
  task: "Reads a paragraph against the house's own writing rules and answers four named questions about it.",
  checks: [
    {
      id: "plain",
      label: "Plain words",
      line: "The shortest words that carry it, and no word a reader would have to look up.",
    },
    {
      id: "claim",
      label: "A claim, checked",
      line: "A claim a reader could check, or it is cut. Nothing asserted that nobody measured.",
    },
    {
      id: "hype",
      label: "No hype",
      line: "No revolutionary, no game-changing, no unlock, no seamless. The work is the argument.",
    },
    {
      id: "voice",
      label: "One voice",
      line: "One person, with a position. Not a committee, and not a brochure.",
    },
  ],
  inputs: [
    {
      id: "draft",
      label: "A first draft",
      brief: "The opening paragraph of a proposal, written fast, before anyone read it back.",
      output: {
        kind: "text",
        text: "Our revolutionary AI platform unlocks seamless transformation across your organisation, and teams see dramatic gains from day one.",
        marks: [
          {
            span: "revolutionary",
            check: "hype",
            state: "block",
            note: "A word the work has to earn, doing the work's job instead.",
          },
          {
            span: "seamless",
            check: "hype",
            state: "block",
            note: "Nothing is seamless. It names a feeling, not a behaviour.",
          },
          {
            span: "dramatic gains",
            check: "claim",
            state: "block",
            note: "Nobody measured this, so it cannot be written down.",
          },
        ],
      },
      results: [
        {
          check: "plain",
          state: "review",
          note: "Long words carrying little, three in one sentence.",
        },
        {
          check: "claim",
          state: "block",
          note: "Two claims nobody measured, and no source on either.",
        },
        {
          check: "hype",
          state: "block",
          note: "Revolutionary, unlocks, seamless, dramatic. In one sentence.",
        },
        { check: "voice", state: "review", note: "No position in it, and nobody in it." },
      ],
      verdict: {
        state: "block",
        label: "Does not go out",
        line: "Rewrite it: claims nobody measured, in words nobody would say.",
      },
      actions: ["Goes back with the notes attached, and nothing ships until they are cut."],
    },
    {
      id: "rewrite",
      label: "The same, rewritten",
      brief: "The same paragraph after the checks were read, with the unmeasured claims cut.",
      output: {
        kind: "text",
        text: "We make your team self-sufficient with AI and leave them with a configuration they run. At Loop that meant four pieces of work, each one on the record.",
        marks: [
          {
            span: "self-sufficient",
            check: "plain",
            state: "pass",
            note: "The word the team used about itself, so it stays.",
          },
          {
            span: "a configuration they run",
            check: "claim",
            state: "pass",
            note: "Checkable: either they run it or they do not.",
          },
          {
            span: "on the record",
            check: "claim",
            state: "pass",
            note: "Points at evidence the reader can open on this page.",
          },
        ],
      },
      results: [
        {
          check: "plain",
          state: "pass",
          note: "Short words, and none a reader would have to look up.",
        },
        {
          check: "claim",
          state: "pass",
          note: "Both claims point at something the reader can open.",
        },
        { check: "hype", state: "pass", note: "None left." },
        {
          check: "voice",
          state: "review",
          note: "Strong, though the middle sentence could name the work.",
        },
      ],
      verdict: {
        state: "review",
        label: "Goes out, with a note",
        line: "Publishable. One note left: name the pieces of work, or link them.",
      },
      actions: ["Publish, and link each piece of work from the record."],
    },
  ],
  skill: {
    folder: "writing/",
    files: [
      {
        name: "SKILL.md",
        line: "What the house sounds like, and the four checks every paragraph is read against.",
      },
      {
        name: "evals/",
        line: "The cases on file: the paragraphs that must pass, and the ones that must not.",
      },
      {
        name: "references/banned.md",
        line: "The words the house does not use, each with the reason it was cut.",
      },
      {
        name: "references/voice.md",
        line: "Passages from the owner's own writing, as the thing a draft is supposed to sound like.",
      },
    ],
  },
  rules: [
    {
      band: "fixed",
      check: "hype",
      line: "The banned words are a list, and the list is checked word for word.",
    },
    {
      band: "fixed",
      check: "claim",
      line: "A claim with no source attached is cut before anyone else reads the draft.",
    },
    {
      band: "adapt",
      check: "plain",
      line: "Plain is judged, not counted: a technical room is allowed its technical words.",
    },
    {
      band: "free",
      line: "How long a paragraph runs, and where it breaks. Nobody checks that, and nobody should.",
    },
  ],
  cases: [
    {
      id: "brochure",
      label: "The brochure paragraph",
      line: "The first draft above. It has to come back blocked, on the claim check and on the hype check.",
      expect: "block",
      checks: ["claim", "hype"],
    },
    {
      id: "rewrite",
      label: "The same, rewritten",
      line: "Has to pass the claim and hype checks, and may still be sent back on voice.",
      expect: "review",
      checks: ["plain", "claim", "hype", "voice"],
    },
    {
      id: "technical",
      label: "A note written for engineers",
      line: "Full of technical words, and it has to pass: plain is judged against the room, not against a word list.",
      expect: "pass",
      checks: ["plain"],
    },
  ],
  record: "The practice's own writing Skill, the one every page on this site is read against.",
};
