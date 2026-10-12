import type { ArcSectionOf } from "../../types";

import { SAMAKO_AUTUMN_FILM_B, SAMAKO_PRODUCT_SHOTS } from "./samakoWork";
import { SURI_DRIVE_MAP } from "./suriDriveMap";

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
 * the line never restates the number (U4; registry-guarded). ⚠ U7 (owner,
 * 2026-10-11): the saving is ONE SENTENCE (`said`), the figure lit inside
 * it, under the mono kicker; the big numeral is gone ("people see time
 * saved and then they see weeks, big font, it just takes them out"). The
 * gate's line is one plain sentence about the decision the person makes,
 * or nothing. The band letters the client and the workstream only.
 *
 * ⚠ THE DRIVE JOB'S FIGURE IS THE MAP ITSELF (U7, owner: "we have an actual
 * cluster, an actual visual map of these things, why can't we use it
 * here?"): `SURI_DRIVE_MAP`, the mapped Drive reduced by
 * `scripts/arcs/prep-x-bionic-drive-map.mjs` to counts and positions, drawn
 * as a grain field. The four words on it are GENERIC by law, chosen on the
 * groups' own descriptions: never a product, a person or the client's term.
 *
 * ⚠ THE STACK CARD (owner, 2026-10-12, /test/proof-cards block 19): every
 * job draws as `top: "stack"`. Its `ask` states the PROBLEM, in a short
 * paragraph; `embed` is the first of the three moves (embed to identify the
 * problem, solve it together, scale it into the client's own system); the
 * time saved draws as two bars, `result.before` and `result.now`, the owner's
 * estimates as above. The gate and `said` stay on the record and are not
 * drawn by the stack card.
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
    title: "A motion ad for the autumn sale",
    top: "stack",
    n: 1,
    bucket: "production",
    client: "Samako",
    date: "6 Oct 2026",
    madeIn: "Claude Code",
    ask: "Meta's algorithm rewards creative variety. Motion ads convert well but cost the most to make, so Samako made few of them.",
    embed: "Identify the problem with the visual lead",
    scale: {
      tools: ["Claude Code", "Kling", "Veo", "Ads Manager"],
    },
    did: [
      "Wrote two story treatments from the brief",
      "Animated the shots on Kling, Veo, Seedance",
      "Composited the real product shot in code",
    ],
    gate: {
      who: "The client's visual lead",
      line: "Chooses the film that runs.",
    },
    figure: {
      kind: "clip",
      clip: SAMAKO_AUTUMN_FILM_B,
      caption: "Film B · 15 s, 9:16, in Dutch",
    },
    result: {
      label: "The return",
      before: "Days of motion design for each ad",
      now: "Two films from one brief, in a day",
      said: {
        pre: "A motion ad from an open brief, every product shot the photographer's own:",
        em: "no frame drawn by AI",
        post: ".",
      },
      allows:
        "Motion ads in the variety the algorithm rewards, at a cost that lets them run as variants.",
    },
  },
  {
    id: "job-ops",
    kind: "job",
    menuLabel: "Drive map · Suri",
    title: "Mapping the marketing Drive",
    top: "stack",
    n: 2,
    bucket: "ops",
    client: "Suri",
    date: "8 to 9 Oct 2026",
    madeIn: "Claude Code",
    ask: "Suri's 3.1 TB marketing Google Drive: 78 % of the files read tied to no campaign, found only by opening folder after folder.",
    embed: "Identify the problem with the library owner",
    scale: {
      tools: ["Claude", "Google Drive", "Monday", "Ads Manager"],
    },
    did: [
      "Read 41,450 files with a vision model",
      "Grouped the files by what they show",
      "Joined Monday and Figma to the same map",
    ],
    gate: {
      who: "The asset library owner",
      line: "Checks the groups before the team searches by them.",
    },
    /* The map as mapped: 82,307 items in 60 groups, every item a grain; the
       four words are generic, on the four largest groups of distinct kind
       (the second-largest kind of ad static is not named twice). The
       ledger it replaced (3.1 TB read only · 7,674 shoot video files ·
       36,387 shoot image files · 78 % of files read tied to no campaign)
       stays filed in the header note above. */
    figure: {
      kind: "map",
      caption: "The Drive as mapped, 9 Oct",
      map: SURI_DRIVE_MAP,
      labels: [
        { group: 18, text: "Ad statics" },
        { group: 21, text: "Shoot footage" },
        { group: 14, text: "Email designs" },
        { group: 8, text: "Product stills" },
      ],
    },
    result: {
      label: "Time saved",
      before: "Weeks opening folders by hand",
      now: "Two days, the whole Drive read",
      said: {
        pre: "The whole marketing Drive mapped in two days, against",
        em: "weeks by hand",
        post: ", estimated.",
      },
      allows: "Reuse the shoots the team already owns, found by what is in each picture.",
    },
  },
  {
    id: "job-review",
    kind: "job",
    menuLabel: "Renders · Samako",
    title: "A first pass on AI product renders",
    top: "stack",
    n: 3,
    bucket: "review",
    client: "Samako",
    date: "7 to 8 Oct 2026",
    madeIn: "Claude Code",
    ask: "AI renders get the product subtly wrong. Every render went to three people to be checked by eye.",
    embed: "Identify the problem with the creative team",
    scale: {
      tools: ["Claude Code", "Image models", "Review board"],
    },
    did: [
      "Wrote the product's own checks as evals",
      "Graded 18 shots on three models, blind",
      "Flagged every unsure render for a person",
    ],
    gate: {
      who: "The client's visual lead",
      line: "Agreed with the grading on 14 of 15 shots.",
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
      before: "Every render checked by eye",
      now: "Only the flagged renders reach a person",
      said: {
        pre: "About",
        em: "two hours a week",
        post: "back for the creative director, the art director and the brand manager, estimated.",
      },
      allows:
        "Review starts from the renders it flags as unsure, the jarring errors already caught.",
    },
  },
  {
    id: "job-strategy",
    kind: "job",
    menuLabel: "Briefs · Suri",
    title: "One brief format for every channel",
    top: "stack",
    n: 4,
    bucket: "strategy",
    client: "Suri",
    date: "4 Oct 2026",
    madeIn: "Cowork",
    ask: "Every writer and channel sent the studio a different brief, and the studio lead spent hours finding what each left out.",
    embed: "Identify the problem with the strategists",
    scale: {
      tools: ["Cowork", "Monday", "The studio"],
    },
    did: [
      "Asked for each missing field, one at a time",
      "Put every claim in brackets until approved",
      "Showed the ad names before writing them",
    ],
    gate: {
      who: "The strategist",
      line: "Marks the brief ready; it lands on the board with its ad names.",
    },
    figure: {
      kind: "flow",
      caption: "The brief skill, run on 4 Oct",
      steps: [
        { key: "The ask", notes: ["One line, from any channel"] },
        {
          key: "Brief skill",
          notes: ["Asks for each missing field", "Brackets every claim", "Proposes the ad names"],
          lit: true,
        },
        {
          key: "The brief",
          notes: ["12 fields, one format", "Channel formats and timing", "Approver named"],
        },
        { key: "Monday board", notes: ["Marked ready by the strategist"] },
      ],
      check: { at: 1, key: "Check", note: "Waits for answers, 3 of 3" },
    },
    result: {
      label: "Time saved",
      before: "Chasing what a brief left out",
      now: "Twelve fields, one format, before the studio",
      said: {
        pre: "The studio lead gets",
        em: "hours a week",
        post: "back from finding what a brief left out, estimated.",
      },
      allows:
        "Every brief reaches the studio complete and in its channel's shape, so the work starts sooner.",
    },
  },
];
