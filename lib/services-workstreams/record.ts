/**
 * THE SERVICES AS WORKSTREAMS (2026-10-08, look-dev at
 * `/test/services-workstreams`): the ring's four cards re-cut as the three
 * creative workstreams a marketing team runs — production · operations ·
 * review — landing on the intelligence configuration that runs under all
 * three (owner: "the main thing that I'm selling … is the embedded model where
 * I come in and build those intelligence configurations").
 *
 * ⚠ ONE SECTION, ONE RECORD (CLAUDE.md, 2026-10-02). Nothing here is a copy:
 * Loop's work is `LOOP_INTELLIGENCE_MAP.works` filtered by its own `stream`
 * field and read through `runModeOf`; Suri's is `SURI_RUNS` and
 * `SURI_ITERATIONS`; Samako's is `SAMAKO_PRODUCT_SHOTS` and
 * `SAMAKO_AUTUMN_FILM`. What is authored here is the WORKSTREAM's own line
 * and the Samako entries that have no record of their own on the site yet
 * (each from `samako-ai-studio`'s README and record, by role, never by name).
 * `tests/lib/services-workstreams.test.ts` pins every reference `toBe`.
 *
 * PURE: no react, no three, no supabase. The bakes and the lab read it.
 */

import {
  RUN_MODE_LABEL,
  runModeOf,
  type RunMode,
} from "@/components/landing/home-v2/services/casefile/map/mapProjection";
import { SAMAKO_AUTUMN_FILM, SAMAKO_PRODUCT_SHOTS } from "@/lib/arcs/content/shared/samakoWork";
import { SURI_ITERATIONS, SURI_RUNS } from "@/lib/arcs/content/shared/suriWork";
import type { ArcBreakdown, ArcBreakdownFrame } from "@/lib/arcs/types";
import { LOOP_INTELLIGENCE_MAP } from "@/lib/cases/content/loop-earplugs";
import type { CaseMapStreamKey, CaseMapWork } from "@/lib/cases/types";

export { RUN_MODE_LABEL, type RunMode };

export type WorkClient = "loop" | "suri" | "samako";

export const CLIENT_NAME: Readonly<Record<WorkClient, string>> = {
  loop: "Loop",
  suri: "Suri",
  samako: "Samako",
};

/** Where a client's full work lives on the site, or null where it has no
 *  page of its own a reader may be sent to (Samako's breakdowns ride the
 *  X-Bionic proposal, which is addressed to one reader). */
export const CLIENT_HREF: Readonly<Record<WorkClient, string | null>> = {
  loop: "/arcs/loop/portfolio",
  suri: "/arcs/suri/configuration",
  samako: null,
};

/** One piece of work in a workstream: what it is, how far it runs without a
 *  person, the Skill it draws on, who decides, and the line of proof. */
export interface WorkEntry {
  id: string;
  client: WorkClient;
  title: string;
  runMode: RunMode;
  skill: string | null;
  /** The person, by role, who decides — the gate. */
  gate: string;
  /** One line of evidence, from the record. */
  proof: string | null;
  /** The record this entry was read from, by reference (the test's join). */
  source: unknown;
}

/** One worked run, the skill-run grammar (ADR-148) cut to a card. */
export interface WorkstreamRun {
  client: WorkClient;
  label: string;
  ask: string;
  skill: string;
  also: readonly string[];
  steps: readonly string[];
  gate: { who: string; line: string };
  evalCase: { name: string; with?: string; without?: string } | null;
  source: unknown;
}

/** Real output from the work, with its verdicts. */
export interface WorkstreamSpecimen {
  client: WorkClient;
  caption: string;
  frames: readonly ArcBreakdownFrame[];
  source: ArcBreakdown;
}

export interface Workstream {
  key: CaseMapStreamKey;
  /** The card's name. */
  name: string;
  /** The card's paragraph, ≤160 (`LEDE_MAX_CH`). */
  line: string;
  /** What the open card says it does — the drawer's `01 / WHAT`, two lines;
   *  the third, who it was proven at, is derived from the entries. */
  what: readonly [string, string];
  entries: readonly WorkEntry[];
  run: WorkstreamRun;
  specimen: WorkstreamSpecimen;
}

/* ── Loop: the map's own estate ─────────────────────────────────────── */

function loopEntries(stream: CaseMapStreamKey): WorkEntry[] {
  return LOOP_INTELLIGENCE_MAP.works
    .filter((w: CaseMapWork) => w.stream === stream)
    .map((w) => ({
      id: w.id,
      client: "loop" as const,
      title: w.title,
      runMode: runModeOf(w) ?? "hand",
      skill: w.cfg ? w.cfg.s[0] : null,
      gate: w.cfg ? w.cfg.o : "By hand",
      proof: w.evals,
      source: w,
    }));
}

/* ── Suri: the three runs and the review ────────────────────────────── */

const factOf = (b: ArcBreakdown, label: string): string | null =>
  b.facts.find((f) => f.label === label)?.value ?? null;

const caseLine = (c: { name: string; with?: string }) =>
  c.with ? `${c.name} · ${c.with}` : c.name;

/* The run mode is AUTHORED for Suri and Samako: their records are skills in
   the client's own Claude, not the map's `cfg.a`. A skill asked in chat is a
   prompt; one that runs the scripts on a laptop is a tool; one that grades
   on its own, three times, is an agent. */
const SURI_BRIEF: WorkEntry = {
  id: "suri-briefing",
  client: "suri",
  title: "Brief and ad names",
  runMode: "prompt",
  skill: SURI_RUNS.briefing.skill.name,
  gate: SURI_RUNS.briefing.decide.who,
  proof: caseLine(SURI_RUNS.briefing.evals.cases[0]),
  source: SURI_RUNS.briefing,
};
const SURI_ITERATE: WorkEntry = {
  id: "suri-iterations",
  client: "suri",
  title: "Iterations of a winner",
  runMode: "tool",
  skill: SURI_RUNS.iterations.skill.name,
  gate: SURI_RUNS.iterations.decide.who,
  proof: caseLine(SURI_RUNS.iterations.evals.cases[0]),
  source: SURI_RUNS.iterations,
};
const SURI_RETOUCH: WorkEntry = {
  id: "suri-video",
  client: "suri",
  title: "Video retouch",
  runMode: "tool",
  skill: SURI_RUNS.video.skill.name,
  gate: SURI_RUNS.video.decide.who,
  proof: caseLine(SURI_RUNS.video.evals.cases[0]),
  source: SURI_RUNS.video,
};
const SURI_REVIEW: WorkEntry = {
  id: "suri-review",
  client: "suri",
  title: "Layouts read before the review",
  runMode: "prompt",
  skill: "design-review",
  gate: "The head of design",
  proof: `Words spelled right · ${factOf(SURI_ITERATIONS, "Words spelled right")}`,
  source: SURI_ITERATIONS,
};

/* ── Samako: two breakdowns on the site, the rest from its README ───── */

const SAMAKO_SHOTS: WorkEntry = {
  id: "samako-shots",
  client: "samako",
  title: "Product shots",
  runMode: "tool",
  skill: "visuals",
  gate: "The client's reviewer",
  proof: `Drawn right · ${factOf(SAMAKO_PRODUCT_SHOTS, "Best model")}`,
  source: SAMAKO_PRODUCT_SHOTS,
};
const SAMAKO_FILM: WorkEntry = {
  id: "samako-film",
  client: "samako",
  title: "Autumn sale film",
  runMode: "tool",
  skill: "visuals",
  gate: "The creative strategist",
  proof: factOf(SAMAKO_AUTUMN_FILM, "Length"),
  source: SAMAKO_AUTUMN_FILM,
};
const SAMAKO_CLICKUP: WorkEntry = {
  id: "samako-clickup",
  client: "samako",
  title: "Brief to ClickUp, named",
  runMode: "prompt",
  skill: "clickup",
  gate: "The creative strategist",
  proof: "Shown before it is filed",
  source: null,
};
const SAMAKO_OPS: WorkEntry = {
  id: "samako-creative-ops",
  client: "samako",
  title: "Where production stands",
  runMode: "prompt",
  skill: "creative-ops",
  gate: "The creative strategist",
  proof: "Reads and proposes, never assigns",
  source: null,
};
const SAMAKO_GRADER: WorkEntry = {
  id: "samako-grader",
  client: "samako",
  title: "Every brief graded three times",
  runMode: "agent",
  skill: "mother",
  gate: "The strategist",
  proof: "A run that did not answer casts no vote",
  source: null,
};
const SAMAKO_BLIND: WorkEntry = {
  id: "samako-blind",
  client: "samako",
  title: "Frames read blind to the model",
  runMode: "tool",
  skill: "visuals",
  gate: "The client's reviewer",
  proof: factOf(SAMAKO_PRODUCT_SHOTS, "Read"),
  source: SAMAKO_PRODUCT_SHOTS,
};

/* ── The runs (face B) ──────────────────────────────────────────────── */

function suriRun(key: keyof typeof SURI_RUNS, label: string): WorkstreamRun {
  const r = SURI_RUNS[key];
  const evalCase = r.evals.cases.find((c) => c.with) ?? r.evals.cases[0] ?? null;
  return {
    client: "suri",
    label,
    ask: r.ask,
    skill: r.skill.name,
    also: r.skill.also ?? [],
    steps: r.steps,
    gate: { who: r.decide.who, line: r.decide.line },
    evalCase,
    source: r,
  };
}

/* ── The specimens (face C) ─────────────────────────────────────────── */

const framesOf = (b: ArcBreakdown): ArcBreakdownFrame[] =>
  b.beats.flatMap((beat) => beat.frames ?? []);

/* ── The three workstreams ──────────────────────────────────────────── */

export const WORKSTREAMS: readonly Workstream[] = [
  {
    key: "production",
    name: "Creative production",
    line: "Ads, iterations and films at the team's pace, every frame read against the real product before a person looks at it.",
    what: [
      "Briefs become ads, variants and films in the team's own tools",
      "Every frame read against the real product before a person looks",
    ],
    entries: [...loopEntries("production"), SURI_ITERATE, SURI_RETOUCH, SAMAKO_SHOTS, SAMAKO_FILM],
    run: suriRun("iterations", "Iterations"),
    specimen: {
      client: "samako",
      caption: "Product shots · kept and sent back",
      frames: framesOf(SAMAKO_PRODUCT_SHOTS),
      source: SAMAKO_PRODUCT_SHOTS,
    },
  },
  {
    key: "operations",
    name: "Creative operations",
    line: "Briefs, names and the production queue kept by the setup, so the team spends its hours on the work and not on the tracking.",
    what: [
      "Briefs written, named and filed where the team already works",
      "The production queue read and proposed, never assigned",
    ],
    entries: [...loopEntries("operations"), SURI_BRIEF, SAMAKO_CLICKUP, SAMAKO_OPS],
    run: suriRun("briefing", "Briefing + naming"),
    specimen: {
      client: "samako",
      caption: "Autumn sale · from brief to film",
      frames: framesOf(SAMAKO_AUTUMN_FILM),
      source: SAMAKO_AUTUMN_FILM,
    },
  },
  {
    key: "review",
    name: "Creative review",
    line: "What good looks like, written down: checks and cases that read every piece first, with your team as the last gate.",
    what: [
      "What good looks like, written down as checks and cases",
      "Every piece read first, with your team as the last gate",
    ],
    entries: [...loopEntries("review"), SURI_REVIEW, SAMAKO_GRADER, SAMAKO_BLIND],
    run: suriRun("video", "Video retouch"),
    specimen: {
      client: "suri",
      caption: "Iterations · the review before the review",
      frames: framesOf(SURI_ITERATIONS),
      source: SURI_ITERATIONS,
    },
  },
];

/* ── The intelligence configuration is the WHOLE SECTION, not a card ──
   (owner, 2026-10-08: "the intelligence configuration is the entire thing,
   and the rest of the cards correspond to each of the different
   workstreams"). The masthead names it; the three cards are its
   workstreams; a card opens its detail. Nothing else draws it. */

/** Every client that appears in a workstream, in order of first appearance. */
export function clientsOf(ws: Workstream): WorkClient[] {
  const seen: WorkClient[] = [];
  for (const e of ws.entries) if (!seen.includes(e.client)) seen.push(e.client);
  return seen;
}
