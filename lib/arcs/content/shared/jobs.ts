import type { ArcClip, ArcSectionOf } from "../../types";

import { SAMAKO_AUTUMN_FILM, SAMAKO_PRODUCT_SHOTS } from "./samakoWork";
import { UNDER_THE_GLASS } from "./suriWork";

/**
 * FOUR CLIENT JOBS, ONE TEMPLATE (ADR-153 U1, owner 2026-10-09: "a template
 * where I can fill in the stuff, Suri, Samako. Ideally two example sections
 * per client … uniformize it"). One job per bucket, two per client: Samako's
 * strategy and review, Suri's production and ops, in the order the buckets
 * run on the vision's 2×2 and the engine's tiles.
 *
 * ⚠ EVERY NUMBER IS AS FILED, read 9 October 2026:
 *  - Strategy: `samako-ai-studio/records/eval-log.md`, Autumn Deals 02
 *    (6 October). Its review line still reads "not reviewed yet".
 *  - Production: Suri's showcase of Under the glass and `UNDER_THE_GLASS`.
 *  - Ops: the briefing skill's handover of 8 October (the skill at v2.13,
 *    rebuilt from 504 briefs; twelve evals, six new that week; the board
 *    record of the run on the week's iterations deck). No with-and-without
 *    result is filed for this skill, so none is drawn.
 *  - Review: the same log, wave 11's race (7 October), its review (8
 *    October, the reviewer's 14 of 15) and wave 12 (8 October, 6 of 6).
 *
 * ⚠ THE TITLE SAYS WHAT THE JOB WAS (owner, 2026-10-09: a working name
 * like "Under the glass" says nothing). Concrete and practical, in the
 * frame's top row; there is no head above it (U2). A tally draws a count
 * only where the record gives one; 504 is too many to draw and 0.1 px is
 * not a count, so those cells stand as numbers.
 *
 * ⚠ PEOPLE BY ROLE, NEVER BY NAME OR PRONOUN; no money; the films and
 * stills are the shared records' own objects, so a fix lands once.
 */

const film = (clip: ArcClip | undefined): ArcClip => {
  if (!clip) throw new Error("jobs: a shared breakdown lost its film");
  return clip;
};

const still = (i: number) => {
  const f = SAMAKO_PRODUCT_SHOTS.beats[0]?.frames?.[i];
  if (!f) throw new Error("jobs: the product shots lost a still");
  return f;
};
const shotKept = still(0);
const shotSentBack = still(1);

export const X_BIONIC_JOBS: readonly ArcSectionOf<"job">[] = [
  {
    id: "job-strategy",
    kind: "job",
    menuLabel: "Strategy · Samako",
    title: "Autumn sale ads, reworked from a flat first round",
    n: 1,
    bucket: "strategy",
    client: "Samako",
    date: "6 Oct 2026",
    madeIn: "Claude Code",
    ask: "Sale statics for the autumn offer, with complete creative freedom.",
    did: [
      "Restarted from a story per frame",
      "Drew one house set, attached to every shot",
      "Composited the real product in code",
    ],
    gate: {
      who: "The client's visual lead",
      line: "Picks film A or B, and the statics. Not reviewed yet.",
    },
    figure: {
      kind: "clip",
      clip: film(SAMAKO_AUTUMN_FILM.film),
      caption: "Film A · 15 s, 9:16, in Dutch",
    },
    cells: [
      {
        value: "2 + 4",
        key: "Films and statics from one brief",
        tally: [
          { of: 2, lit: 2 },
          { of: 4, lit: 4 },
        ],
      },
      {
        value: "3 of 3",
        key: "Cold reads that got the joke, was 0 of 3",
        tally: [
          { of: 3, lit: 0, dim: true },
          { of: 3, lit: 3 },
        ],
      },
      {
        value: "0",
        key: "Pieces with the product drawn by a model",
        tally: [{ of: 6, lit: 0 }],
      },
    ],
  },
  {
    id: "job-production",
    kind: "job",
    menuLabel: "Production · Suri",
    title: "A Black Friday teaser, cut from raw footage",
    n: 2,
    bucket: "production",
    client: "Suri",
    date: "6 Oct 2026",
    madeIn: "Cowork",
    ask: "A Black Friday teaser from the shoot: edit only, no generated footage.",
    did: [
      "Cut 31 clips to two locked-off shots",
      "Printed the message under the moving glass",
      "Cleaned the steel, kept its brushed grain",
    ],
    gate: {
      who: "The video editor",
      line: "Cut the film down to the card, and said when the steel looked AI.",
    },
    figure: {
      kind: "clip",
      clip: film(UNDER_THE_GLASS.film),
      caption: "The teaser · 16.16 s, 9:16",
    },
    cells: [
      {
        value: "31 clips",
        key: "Raw clips, two of them in the teaser",
        tally: [{ of: 31, lit: 2 }],
      },
      {
        value: "7",
        key: "Versions, each one answering a note",
        tally: [{ of: 7, lit: 7 }],
      },
      { value: "0.1 px", key: "Offset at the cut between the two shots" },
    ],
  },
  {
    id: "job-ops",
    kind: "job",
    menuLabel: "Ops · Suri",
    title: "A six-slide brief, filed on the studio's board",
    n: 3,
    bucket: "ops",
    client: "Suri",
    date: "8 Oct 2026",
    madeIn: "Cowork",
    ask: "The week's iterations deck, briefed onto the studio's Monday board.",
    did: [
      "Read the deck and its four resolved comments",
      "Filled the briefer's placeholder card",
      "Sent the gaps as one reply in the thread",
    ],
    gate: {
      who: "The creative lead",
      line: "Gave the one yes before anything was written to the board.",
    },
    figure: {
      kind: "ledger",
      caption: "The item as written",
      rows: [
        { label: "Item", value: "1, no new card" },
        { label: "Sub-items", value: "3, all video" },
        { label: "Docs", value: "1 overview, 3 sub-item docs" },
        { label: "Left alone", value: "Status, editor, hours" },
        { label: "Next day", value: "Editor assigned, deadline moved" },
      ],
    },
    cells: [
      { value: "504", key: "Briefs read to build the skill, Jan to Oct" },
      {
        value: "12",
        key: "Briefing evals, six of them new this week",
        tally: [{ of: 12, lit: 6 }],
      },
      {
        value: "5",
        key: "Flags raised before the editor started",
        tally: [{ of: 5, lit: 5 }],
      },
    ],
  },
  {
    id: "job-review",
    kind: "job",
    menuLabel: "Review · Samako",
    title: "Three image models, tested blind on the real product",
    n: 4,
    bucket: "review",
    client: "Samako",
    date: "7 to 8 Oct 2026",
    madeIn: "Claude Code",
    ask: "Which model draws the CleanDetect Pro exactly, in hero, in-use and room shots?",
    did: [
      "Drew the same 18 shots on three models",
      "Shuffled the frames; six readers, blind",
      "Read the reviewer's 16 pins back from Figma",
    ],
    gate: {
      who: "The client's visual lead",
      line: "Sent back the one frame the read had passed. The model changed only by pull request.",
    },
    figure: {
      kind: "pair",
      ratio: "1:1",
      caption: "Kept and sent back, read blind",
      a: { src: shotKept.src, alt: shotKept.alt, label: shotKept.label, verdict: "kept" },
      b: {
        src: shotSentBack.src,
        alt: shotSentBack.alt,
        label: shotSentBack.label,
        verdict: "rejected",
      },
    },
    cells: [
      {
        value: "15 of 18",
        key: "Right on gpt-image-2; the others 5 and 4",
        tally: [
          { of: 18, lit: 15 },
          { of: 18, lit: 5, dim: true },
          { of: 18, lit: 4, dim: true },
        ],
      },
      {
        value: "14 of 15",
        key: "Reviewer's pins that match the blind read",
        tally: [{ of: 15, lit: 14 }],
      },
      {
        value: "6 of 6",
        key: "In-use shots from the side, was 1 of 9",
        tally: [
          { of: 9, lit: 1, dim: true },
          { of: 6, lit: 6 },
        ],
      },
    ],
  },
];
