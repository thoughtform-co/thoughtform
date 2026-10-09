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
 * frame's top row; there is no head above it (U2).
 *
 * ⚠ ONE RETURN A JOB, IN A DECISION MAKER'S WORDS (U3, owner 2026-10-09,
 * after the practice's adviser: put a number against each activity). The
 * production job's 2 to 3 hours is the video editor's own account in the
 * team's week-one debrief; no job has a filed money figure, so none is
 * drawn. A tally draws the count only where the number is one.
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
      "Rewrote round one around a story per frame",
      "Kept one cast and set across every shot",
      "Placed the real product photo in every frame",
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
    result: {
      value: "6 ads",
      line: "Two 15-second films and four statics, from one open brief.",
      tally: [
        { of: 2, lit: 2 },
        { of: 4, lit: 4 },
      ],
    },
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
      "Cut 31 raw clips down to two shots",
      "Revealed the message under the moving glass",
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
    result: {
      value: "2–3 hrs",
      line: "Retouching and masking now take 2 to 3 hours a video in Claude, not a full manual session.",
    },
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
      "Filled the card already on the board",
      "Sent the open questions as one reply",
    ],
    gate: {
      who: "The creative lead",
      line: "Gave the one yes before anything was written to the board.",
    },
    figure: {
      kind: "ledger",
      caption: "The board item as filed",
      rows: [
        { label: "Item", value: "1, no new card" },
        { label: "Sub-items", value: "3, all video" },
        { label: "Docs", value: "1 overview, 3 sub-item docs" },
        { label: "Left alone", value: "Status, editor, hours" },
        { label: "Next day", value: "Editor assigned, deadline moved" },
      ],
    },
    result: {
      value: "5",
      line: "Problems caught in the brief before any editing began, from clashing copy to a deadline with no editor.",
      tally: [{ of: 5, lit: 5 }],
    },
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
      "Hid which model made each shot, then graded",
      "Matched the grades to the client's reviewer",
    ],
    gate: {
      who: "The client's visual lead",
      line: "Rejected the one shot the AI grading had passed.",
    },
    figure: {
      kind: "pair",
      ratio: "1:1",
      caption: "Kept and rejected, graded blind",
      a: { src: shotKept.src, alt: shotKept.alt, label: shotKept.label, verdict: "kept" },
      b: {
        src: shotSentBack.src,
        alt: shotSentBack.alt,
        label: shotSentBack.label,
        verdict: "rejected",
      },
    },
    result: {
      value: "15 of 18",
      line: "Product shots right first time on the model now in use, up from 4 of 18 on the one before.",
      tally: [
        { of: 18, lit: 4, dim: true },
        { of: 18, lit: 15 },
      ],
    },
  },
];
