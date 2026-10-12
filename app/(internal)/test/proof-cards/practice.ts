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
}

export const PRACTICE: Record<string, Practice> = {
  "job-production": {
    brief: "A 15-second autumn sale ad for paid social, in Dutch, from an open brief.",
    up: "An open brief and the photographer's product shots",
    job: "One room drawn, animated on three video models",
    down: "Films ready for the visual lead to choose",
    before: "A motion designer on each ad",
    now: "Cut from the brief, checked in three cold reads",
  },
  "job-ops": {
    brief: "Map the 3.1 TB marketing Google Drive by what is in each file.",
    up: "41,450 files read, Monday and Figma joined",
    job: "Grouped by what each file shows",
    down: "Shoots the team already owns, found and reused",
    before: "Weeks opening folders by hand",
    now: "Two days, the whole Drive read",
  },
  "job-review": {
    brief: "Catch the AI product renders that get the product wrong, before review.",
    up: "18 shots from three image models",
    job: "Graded blind against the product's own checks",
    down: "Review starts from the unsure ones",
    before: "Every render checked by eye",
    now: "Only the flagged renders reach a person",
  },
  "job-strategy": {
    brief: "One brief format for every channel, complete before it reaches the studio.",
    up: "A one-line ask, from any channel",
    job: "Each missing field asked for, one at a time",
    down: "The studio starts from a complete brief",
    before: "Chasing what a brief left out",
    now: "Twelve fields, one format, before the studio",
  },
};
