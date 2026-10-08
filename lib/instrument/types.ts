/**
 * lib/instrument — ONE RECORD AT FIVE ALTITUDES (ADR-154).
 *
 * The intelligence configuration is six answers around one piece of work:
 * the model, the context, the evaluations, the data, the interface, the
 * owner. The site had drawn it through three question sets and nine figure
 * kinds; this is the one record every altitude is a projection of, and the
 * one drawing (`components/instrument/Instrument.tsx`) that renders it.
 *
 * ⚠ THE SIX ARE CANON (owner, 2026-10-08): `questions`' six. The five of
 * `configuration` and the five facts of `board` arrive through `adapt.ts`.
 *
 * ⚠ THE LAW, pinned by `tests/lib/instrument-record.test.ts`: the parts are
 * exactly `PART_ORDER`; `lit` is a subset of {context, evals} — what the team
 * writes; exactly one part is `human` and it is the owner (ADR-100: green is
 * the person and nothing else). An altitude is offered only when the record
 * carries it (`altitudesOf`), so no housing is ever drawn empty.
 *
 * Types only, like `lib/arcs/types.ts`: no runtime import but the arcs' own
 * `ArcImage`.
 */

import type { ArcImage } from "@/lib/arcs/types";

export type PartId = "model" | "context" | "evals" | "data" | "interface" | "owner";

/** The owner's layout: the left column, then the right. */
export const PART_ORDER: readonly PartId[] = [
  "model",
  "context",
  "evals",
  "data",
  "interface",
  "owner",
] as const;

/**
 * quiet   chosen and connected for everyone (the plate and the seam)
 * lit     what the team writes (gold)
 * human   the person (green; the owner, and only the owner)
 * pending not built yet (dashed, with a state chip)
 * ghost   named but not drawn (dim)
 */
export type PartState = "quiet" | "lit" | "human" | "pending" | "ghost";

export const ALTITUDES = ["org", "plugin", "work", "run", "check"] as const;
export type Altitude = (typeof ALTITUDES)[number];

export interface InstrumentPart {
  id: PartId;
  /** "The context" */
  title: string;
  /** "What it knows" */
  question: string;
  /** One line, a sentence. */
  answer: string;
  state: PartState;
}

export interface InstrumentWork {
  label: string;
  name: string;
  line: string;
  bar: { label: string; line: string };
  image?: ArcImage;
}

/** One run of the work: the five stations the skill-run drew (ADR-148). */
export interface InstrumentRun {
  ask: string;
  skill: { name: string; also?: readonly string[] };
  steps: readonly string[];
  decide: { who: string; line: string };
}

export type CheckState = "pass" | "review" | "block" | "not-run";

export interface InstrumentCheck {
  id: string;
  label: string;
  /** A gate: the work fails on it. */
  gate?: true;
  state: CheckState;
}

/** A named node outside the housing: the marketplace, the account, the socket. */
export interface InstrumentNode {
  label: string;
  name: string;
  line?: string;
}

export interface InstrumentSkill {
  id: string;
  name: string;
  state: PartState;
  /** The skill that reads the others (the mother); drawn at the centre. */
  reads?: true;
  /** The skill that sorts every remark (the father); drawn beside the evals. */
  sorts?: true;
}

export interface InstrumentPlugin {
  label: string;
  name: string;
  skills: readonly InstrumentSkill[];
  /** Above the frame: the marketplace, then the account that sets the model. */
  above: readonly [InstrumentNode, InstrumentNode];
  /** The bar under the frame: where you meet it. */
  bar: { line: string };
}

export interface InstrumentWorkstream {
  id: string;
  name: string;
  line?: string;
  /** Which parts this workstream writes itself; absent, it reads the plugin's. */
  lit?: readonly PartId[];
}

export interface InstrumentOrg {
  label: string;
  name: string;
  /** The OS at the centre: the plugin, as the organisation sees it. */
  os: { name: string; line: string };
  workstreams: readonly InstrumentWorkstream[];
  /** What the OS plugs into: the enterprise setup. */
  socket?: InstrumentNode;
}

export interface InstrumentRecord {
  id: string;
  /** In `PART_ORDER`. */
  parts: readonly [
    InstrumentPart,
    InstrumentPart,
    InstrumentPart,
    InstrumentPart,
    InstrumentPart,
    InstrumentPart,
  ];
  work: InstrumentWork;
  run?: InstrumentRun;
  checks?: readonly InstrumentCheck[];
  plugin?: InstrumentPlugin;
  org?: InstrumentOrg;
  /** The mark on the lit parts, e.g. "You write this". */
  tag: string;
  /** The drawing's accessible name, per altitude it carries. */
  alt: Partial<Record<Altitude, string>> & { work: string };
}

/** The altitudes a record can be drawn at, in zoom order. Pinned: a picker
 *  offers these and nothing else. */
export function altitudesOf(record: InstrumentRecord): Altitude[] {
  return ALTITUDES.filter((a) => {
    if (a === "work") return true;
    if (a === "org") return !!record.org;
    if (a === "plugin") return !!record.plugin;
    if (a === "run") return !!record.run;
    return !!record.checks?.length;
  });
}

export function partOf(record: InstrumentRecord, id: PartId): InstrumentPart {
  const hit = record.parts.find((p) => p.id === id);
  if (!hit) throw new Error(`instrument ${record.id}: no part ${id}`);
  return hit;
}

/** The record law, as a list of faults (empty = lawful). */
export function recordFaults(record: InstrumentRecord): string[] {
  const faults: string[] = [];
  const ids = record.parts.map((p) => p.id);
  if (ids.join() !== PART_ORDER.join()) faults.push(`parts are ${ids.join(",")}, not PART_ORDER`);
  for (const p of record.parts) {
    if (p.state === "lit" && p.id !== "context" && p.id !== "evals") {
      faults.push(`${p.id} is lit; only the context and the evaluations are written by the team`);
    }
    if (p.state === "human" && p.id !== "owner") faults.push(`${p.id} is human; only the owner is`);
  }
  if (!record.parts.some((p) => p.id === "owner" && p.state === "human")) {
    faults.push("the owner is not human");
  }
  if (record.plugin) {
    const reads = record.plugin.skills.filter((s) => s.reads).length;
    if (reads > 1) faults.push(`${reads} skills read the others; one does`);
  }
  for (const a of altitudesOf(record)) {
    if (!record.alt[a]) faults.push(`no alt for the ${a} altitude`);
  }
  return faults;
}
