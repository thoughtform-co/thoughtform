import type { ArcSectionOf } from "../../types";

import { SAMAKO_AUTUMN_FILM_B, SAMAKO_PRODUCT_SHOTS } from "./samakoWork";

/**
 * FOUR CLIENT JOBS, ONE TEMPLATE (ADR-153 U1, owner 2026-10-09: "a template
 * where I can fill in the stuff, Suri, Samako. Ideally two example sections
 * per client … uniformize it"). One job per workstream, two per client, in
 * the order the workstreams run on the vision and the engine: creative
 * production, ops, review, strategy (U4).
 *
 * ⚠ U4 (owner, 2026-10-10) RE-CUT ALL FOUR TO THE WORK HE NAMED: the
 * motion ad is film B ("use the other one"), the ops job is the Drive map
 * and its search by meaning ("where is that?"), the review job is the first
 * pass on AI product renders, the strategy job is the brief skill. Every
 * figure as filed, read 10 October 2026:
 *  - Production: `samako-ai-studio/records/eval-log.md`, film B of the
 *    Autumn Deals round (6 October): no product frame drawn by a model,
 *    three cold reads, not reviewed yet.
 *  - Ops: `suri-ai-studio`, the Drive map (8 to 9 October, commits 24ecd54,
 *    d9ca99a, afed625): 3.1 TB read only, 41,450 files read, 82,307 items in
 *    60 groups, 78 % of the files read tied to no campaign, Monday and Figma
 *    joined. Its groups are Claude's names and nobody has used the page yet.
 *  - Review: the Samako log's wave 11 (7 October, 15 of 18 blind) and its
 *    review (8 October, the client's lead agreed on 14 of 15).
 *  - Strategy: Suri's brief skill as run on 4 October (`SURI_RUNS`): twelve
 *    fields, `brief-waits-for-answers` 3 of 3.
 *
 * ⚠ THE TIME FIGURES ARE THE OWNER'S ESTIMATES, AND SAY SO (owner,
 * 2026-10-10: the Drive map "saved weeks", the brief skill "saves hours",
 * the render review "a couple of hours a week"). No job has a filed time
 * or money figure; each line opens "Estimated". The motion ad's return is
 * the filed count instead.
 *
 * ⚠ THE RETURN READS IN TWO STEPS, the saving and then what it allows, and
 * the line never restates the number (U4; registry-guarded).
 *
 * ⚠ PEOPLE BY ROLE, NEVER BY NAME OR PRONOUN; no money; the films and
 * stills are the shared records' own objects, so a fix lands once.
 */

const still = (i: number) => {
  const f = SAMAKO_PRODUCT_SHOTS.beats[0]?.frames?.[i];
  if (!f) throw new Error("jobs: the product shots lost a still");
  return f;
};
const shotKept = still(0);
const shotSentBack = still(1);

export const X_BIONIC_JOBS: readonly ArcSectionOf<"job">[] = [
  {
    id: "job-production",
    kind: "job",
    menuLabel: "Motion ad · Samako",
    title: "A 15-second motion ad for the autumn sale",
    n: 1,
    bucket: "production",
    client: "Samako",
    date: "6 Oct 2026",
    madeIn: "Claude Code",
    ask: "A short motion ad for the autumn sale, in Dutch, for paid social, from an open brief.",
    did: [
      "Drew the room once, for every shot",
      "Animated the scenes on three video models",
      "Checked the cut in three cold reads",
    ],
    gate: {
      who: "The client's visual lead",
      line: "Chooses between film A and film B. Not reviewed yet.",
    },
    figure: {
      kind: "clip",
      clip: SAMAKO_AUTUMN_FILM_B,
      caption: "Film B · 15 s, 9:16, in Dutch",
    },
    result: {
      label: "Product drawn by AI",
      value: "0 frames",
      line: "Every product shot is the photographer's original, set into the scene in code.",
      allows:
        "Motion ads for paid social without a motion designer on each one: a better return on ad creation cost.",
    },
  },
  {
    id: "job-ops",
    kind: "job",
    menuLabel: "Drive map · Suri",
    title: "The marketing Drive, mapped and searchable by meaning",
    n: 2,
    bucket: "ops",
    client: "Suri",
    date: "8 to 9 Oct 2026",
    madeIn: "Claude Code",
    ask: "Find what the team already owns across the marketing Drive, without opening every folder.",
    did: [
      "Read 41,450 files with a vision model",
      "Grouped the files by what they show",
      "Joined Monday and Figma to the same map",
    ],
    gate: {
      who: "The asset library owner",
      line: "Not reviewed yet: Claude named the groups, and the owner has yet to use the page.",
    },
    figure: {
      kind: "ledger",
      caption: "The Drive as mapped, 9 Oct",
      rows: [
        { label: "Drive", value: "3.1 TB, read only" },
        { label: "Map", value: "82,307 items, 60 groups" },
        { label: "Shoot video", value: "7,674 files" },
        { label: "Shoot images", value: "36,387 files" },
        { label: "No campaign", value: "78% of files read" },
      ],
    },
    result: {
      label: "Time saved",
      value: "Weeks",
      line: "Estimated, against mapping the Drive by hand.",
      allows: "Reuse the shoots the team already owns, found by what is in each picture.",
    },
  },
  {
    id: "job-review",
    kind: "job",
    menuLabel: "Renders · Samako",
    title: "A first-pass review of AI product renders",
    n: 3,
    bucket: "review",
    client: "Samako",
    date: "7 to 8 Oct 2026",
    madeIn: "Claude Code",
    ask: "Catch the AI renders that get the product wrong, before the creative team reviews them.",
    did: [
      "Wrote the product's own checks as evals",
      "Graded 18 shots on three models, blind",
      "Flagged every unsure render for a person",
    ],
    gate: {
      who: "The client's visual lead",
      line: "Agreed with the grading on 14 of 15 shots, and rejected the one it had passed.",
    },
    figure: {
      kind: "pair",
      ratio: "1:1",
      caption: "Graded blind, 7 Oct",
      a: { src: shotKept.src, alt: shotKept.alt, label: shotKept.label, verdict: "kept" },
      b: {
        src: shotSentBack.src,
        alt: shotSentBack.alt,
        label: shotSentBack.label,
        verdict: "rejected",
      },
    },
    result: {
      label: "Time saved",
      value: "2 hrs/wk",
      line: "Estimated, for the creative director, the art director and the brand manager.",
      allows:
        "Review starts from the renders it flags as unsure, the jarring errors already caught.",
    },
  },
  {
    id: "job-strategy",
    kind: "job",
    menuLabel: "Briefs · Suri",
    title: "One brief format for every channel",
    n: 4,
    bucket: "strategy",
    client: "Suri",
    date: "4 Oct 2026",
    madeIn: "Cowork",
    ask: "Briefs that arrive complete and in one shape, whoever writes them.",
    did: [
      "Asked for each missing field, one at a time",
      "Put every claim in brackets until approved",
      "Showed the ad names before writing them",
    ],
    gate: {
      who: "The strategist",
      line: "Marks the brief ready. It lands as a Monday item, with its ad names.",
    },
    figure: {
      kind: "ledger",
      caption: "The brief skill, run on 4 Oct",
      rows: [
        { label: "Fields", value: "12, in one format" },
        { label: "Channel", value: "Formats and timing named" },
        { label: "Approver", value: "Named in the brief" },
        { label: "Status", value: "Ready, marked by a person" },
        { label: "Check", value: "Waits for answers, 3 of 3" },
      ],
    },
    result: {
      label: "Time saved",
      value: "Hours",
      line: "Estimated: the studio lead's time each week, finding what a brief left out.",
      allows:
        "Every brief reaches the studio complete and in its channel's shape, so the work starts sooner.",
    },
  },
];
