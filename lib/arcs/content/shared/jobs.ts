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
 *  - Ops: the briefing skill as the eval log files it (`suri-ai-studio/
 *    records/eval-log.md`, 4 October: `ai-studio-strategy` 7 of 7 cases pass
 *    three runs each, 1.00 with the plugin, 0.71 above the runs without it;
 *    3 October: brief-waits-for-answers at 0.95 overall). The 8 October
 *    handover's own counts (the briefs read, the version, the evals) are
 *    not in a record this page can cite, so they are not drawn.
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
 * drawn. A tally draws the count only where the number is one. The return's
 * line never restates its value (the proposal system, 2026-10-10).
 *
 * ⚠ THE STRATEGY JOB SHOWS FILM A; the owner asked for Film B ("Alles op z'n
 * plek", the room resetting itself, then the range hopping in). Its file is
 * on the Samako drive, which this machine does not mount; the clip swaps in
 * once `autumn-b.mp4` and its poster are under `public/arcs/samako/`.
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
    title: "Six autumn sale ads for Samako, from one brief",
    n: 1,
    bucket: "strategy",
    client: "Samako",
    date: "6 Oct 2026",
    madeIn: "Claude Code",
    ask: "Sale statics for the autumn offer, with complete creative freedom.",
    did: [
      "A story and a layout for every frame",
      "One house, drawn once, in every shot",
      "The real product photo, placed in code",
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
      line: "Two films and four statics from one open brief, the product never drawn and every model call priced.",
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
      line: "A video's retouching and masking now happen in Claude, and the editor's afternoon goes to the next cut.",
    },
  },
  {
    id: "job-ops",
    kind: "job",
    menuLabel: "Ops · Suri",
    title: "A briefing skill, written with the producer",
    n: 3,
    bucket: "ops",
    client: "Suri",
    date: "8 Oct 2026",
    madeIn: "Cowork",
    ask: "One format for every brief the studio gets, whatever team it comes from, filed where the work runs.",
    did: [
      "Reads the deck, the comments and the board",
      "Asks each open question before it files",
      "Files the brief in the studio's own format",
    ],
    gate: {
      who: "The creative lead",
      line: "Gave the one yes before anything was written to the board.",
    },
    figure: {
      kind: "ledger",
      caption: "The skill's own checks, as run",
      rows: [
        { label: "Cases", value: "7 of 7 pass, three runs each" },
        { label: "With it", value: "1.00" },
        { label: "Without it", value: "0.29" },
        { label: "Run on", value: "The studio's own briefs" },
        { label: "Reviewed", value: "Not yet, by the studio" },
      ],
    },
    result: {
      value: "7 of 7",
      line: "Every brief now passes the studio's checks before it files; without the skill, fewer than one in three did.",
      tally: [{ of: 7, lit: 7 }],
    },
  },
  {
    id: "job-review",
    kind: "job",
    menuLabel: "Review · Samako",
    title: "A pre-review of every AI product shot",
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
      line: "Product shots right first time on the model now in use, up from four of the same set on the one before.",
      tally: [
        { of: 18, lit: 4, dim: true },
        { of: 18, lit: 15 },
      ],
    },
  },
];
