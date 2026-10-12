/**
 * Round two's lab copy (owner, 2026-10-12, on 3C): the title comes off, so
 * the left column opens on the client, a short descriptive brief and the
 * workstream; the right column draws the time saved as the job's upstream
 * and downstream in practice. Every fact here is the jobs record's own
 * (`shared/jobs.ts`), only shortened; nothing is new. LAB-LOCAL: if a
 * direction wins, the brief and the flow move into the record.
 */

export interface Practice {
  /** The brief, short and descriptive: what the job is, in plain words. */
  brief: string;
  /** What feeds the job, the job, and what it feeds, in practice. */
  up: string;
  job: string;
  down: string;
  /** Before and now, for the side-by-side and the bars. */
  before: string;
  now: string;
  /* round three (owner, 2026-10-12): the top bar names the job in a few
     words; the brief is one paragraph that states the PROBLEM; the steps
     open on the adoption half, embedding with the team and handing the
     system to them, before what Claude did. ⚠ The embed and empower lines
     are authored from the record's roles and gate, for the owner to check. */
  name: string;
  problem: string;
  embed: string;
  empower: string;
  /* U3: the vision's three moves, his words, no first person on the page */
  identify: string;
  plug: string;
}

export const PRACTICE: Record<string, Practice> = {
  "job-production": {
    brief: "A 15-second autumn sale ad for paid social, in Dutch, from an open brief.",
    up: "An open brief and the photographer's product shots",
    job: "One room drawn, animated on three video models",
    down: "Films ready for the visual lead to choose",
    before: "A motion designer on each ad",
    now: "Cut from the brief, checked in three cold reads",
    name: "A motion ad for the autumn sale",
    problem:
      "Samako needed a 15-second autumn sale ad for paid social. Each one meant a motion designer, and the product had to stay as photographed.",
    embed: "What the ad must show, with the visual lead",
    empower: "The visual lead chooses the film that runs",
    identify: "Identify the problem with the visual lead",
    plug: "A skill, plugged into Samako's own system",
  },
  "job-ops": {
    brief: "Map the 3.1 TB marketing Google Drive by what is in each file.",
    up: "41,450 files read, Monday and Figma joined",
    job: "Grouped by what each file shows",
    down: "Shoots the team already owns, found and reused",
    before: "Weeks opening folders by hand",
    now: "Two days, the whole Drive read",
    name: "Mapping the marketing Drive",
    problem:
      "Suri's 3.1 TB marketing Google Drive: 78 % of the files read tied to no campaign, found only by opening folder after folder.",
    embed: "Where a search stalls, with the library owner",
    empower: "The library owner checks and keeps the map",
    identify: "Identify the problem with the library owner",
    plug: "A skill, plugged into Suri's own system",
  },
  "job-review": {
    brief: "Catch the AI product renders that get the product wrong, before review.",
    up: "18 shots from three image models",
    job: "Graded blind against the product's own checks",
    down: "Review starts from the unsure ones",
    before: "Every render checked by eye",
    now: "Only the flagged renders reach a person",
    name: "A first pass on AI product renders",
    problem:
      "AI renders get the product subtly wrong. Every render went to three people to be checked by eye.",
    embed: "The errors the creative team catches by eye",
    empower: "The visual lead checks the grading",
    identify: "Identify the problem with the creative team",
    plug: "A skill, plugged into Samako's own system",
  },
  "job-strategy": {
    brief: "One brief format for every channel, complete before it reaches the studio.",
    up: "A one-line ask, from any channel",
    job: "Each missing field asked for, one at a time",
    down: "The studio starts from a complete brief",
    before: "Chasing what a brief left out",
    now: "Twelve fields, one format, before the studio",
    name: "One brief format for every channel",
    problem:
      "Every writer and channel sent the studio a different brief, and the studio lead spent hours finding what each left out.",
    embed: "What a brief leaves out, with the strategists",
    empower: "The strategist marks each brief ready",
    identify: "Identify the problem with the strategists",
    plug: "A skill, plugged into Suri's own system",
  },
};
