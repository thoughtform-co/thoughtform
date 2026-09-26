/**
 * The map phone lab's record — ONE projection of the live Loop record that
 * every direction draws from, and that `tests/lib/map-phone-lab.test.ts`
 * walks. A lab page sits outside every content scanner (`cases-registry`
 * walks `CASES` objects, not components), so nothing is lettered here that
 * this module did not produce: a direction that composes a string of its own
 * is the `8 TEAMS` defect (ADR-070 U15) waiting to happen.
 *
 * Three-free and DOM-free. Strings keep the RECORD's case (sentence case for
 * titles and answers) — the desktop drawings uppercase at render, the phone
 * directions choose per role.
 */

import { selectWorks } from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";
import type {
  CaseMapDistrict,
  CaseMapShape,
  CaseMapShapeKey,
  CaseMapWork,
  CaseSkillEntry,
} from "@/lib/cases/types";

/** Two readings since ADR-126 — the layer left production's rail, so the lab
 *  (a window onto production, never a copy) shows two. The directions' LAYER
 *  branches are unreachable now and go with the retirement commit. */
export type MplReading = "work" | "configuration";
export const MPL_READINGS: readonly MplReading[] = ["work", "configuration"];
/** The rail's two stations, the production names (`PdaConsole`). */
export const MPL_STATIONS = [
  { id: "work", name: "WORK" },
  { id: "configuration", name: "CONFIGURATION" },
] as const;

export interface MplRecord {
  shapes: readonly CaseMapShape[];
  districts: readonly CaseMapDistrict[];
  works: readonly CaseMapWork[];
  skills: readonly CaseSkillEntry[];
}

/** One shown stream, answered. Person-led streams answer with the record's
 *  own absence strings (`pdaRecord.ts`'s PERSON), never an empty cell. */
export interface MplStream {
  id: string;
  title: string;
  dept: string;
  deptName: string;
  deptShort: string;
  configured: boolean;
  /** The capability lane (`Everyday`…), or `Person-led`. */
  lane: string;
  owner: string;
  bar: string;
  /** The Skill (the roster's own short label) and the lane's verbs. */
  runs: string;
  runsHow: string;
  /** The knowledge graph and the first system it reaches. */
  reaches: string;
  reachesVia: string;
  /** The agent and the interface — the interface dropped where it repeats
   *  the agent (three streams read "Scheduled agent" twice in production). */
  runsIn: string;
  runsInVia: string;
  taps: readonly CaseMapShapeKey[];
}

export interface MplDept {
  id: string;
  name: string;
  short: string;
  streams: readonly MplStream[];
}

export interface MplSkill {
  id: string;
  short: string;
  flagship: boolean;
}

export interface MplShape {
  key: CaseMapShapeKey;
  name: string;
  /** The shape said as a sentence — the record's `meaning`, verbatim. */
  meaning: string;
  skills: readonly MplSkill[];
}

export interface MplModel {
  streams: readonly MplStream[];
  depts: readonly MplDept[];
  shapes: readonly MplShape[];
}

/** The record's absence, in its own words (`pdaRecord.ts`'s PERSON). */
const PERSON = {
  owner: "The person does the work",
  runs: "Nothing runs it",
  reaches: "Nothing bound",
  runsIn: "No agent",
} as const;

function stream(
  work: CaseMapWork,
  district: CaseMapDistrict | undefined,
  skills: readonly CaseSkillEntry[]
): MplStream {
  const c = work.cfg;
  const base = {
    id: work.id,
    title: work.title,
    dept: work.dist,
    deptName: district?.name ?? work.dist,
    deptShort: district?.ab ?? work.dist,
    bar: work.bar,
    taps: work.shapes,
  };
  if (!c) {
    return {
      ...base,
      configured: false,
      lane: "Person-led",
      owner: PERSON.owner,
      runs: PERSON.runs,
      runsHow: "",
      reaches: PERSON.reaches,
      reachesVia: "",
      runsIn: PERSON.runsIn,
      runsInVia: "",
    };
  }
  const skill = skills.find((s) => s.id === c.skillId);
  const iface = c.u[0];
  return {
    ...base,
    configured: true,
    lane: `${work.lane ?? ""}`,
    owner: c.p[0],
    runs: skill?.short ?? c.s[0],
    runsHow: c.m[1],
    reaches: c.g[0],
    reachesVia: c.k[0],
    runsIn: c.a,
    runsInVia: iface.toLowerCase() === c.a.toLowerCase() ? "" : iface,
  };
}

export function buildModel(rec: MplRecord): MplModel {
  const shownIds = new Set(selectWorks(rec.districts, rec.works, rec.skills).map((w) => w.id));
  const byId = new Map(rec.districts.map((d) => [d.id, d] as const));
  const streams = rec.works
    .filter((w) => shownIds.has(w.id))
    .map((w) => stream(w, byId.get(w.dist), rec.skills));
  const depts = rec.districts
    .map((d) => ({
      id: d.id,
      name: d.name,
      short: d.ab,
      streams: streams.filter((s) => s.dept === d.id),
    }))
    .filter((d) => d.streams.length > 0);
  const shapes = rec.shapes.map((s) => {
    const run = rec.skills
      .filter((k) => k.engine.toLowerCase() === s.key)
      .map((k) => ({ id: k.id, short: k.short, flagship: k.flagship === true }));
    run.sort((a, b) => Number(b.flagship) - Number(a.flagship));
    return { key: s.key, name: s.label, meaning: s.meaning, skills: run };
  });
  return { streams, depts, shapes };
}

/** The persistent object's default — the first configured stream shown. */
export function defaultSel(model: MplModel): string {
  return (model.streams.find((s) => s.configured) ?? model.streams[0])?.id ?? "";
}

export function streamOf(model: MplModel, sel: string): MplStream {
  return model.streams.find((s) => s.id === sel) ?? model.streams[0]!;
}

/** The shape the selected stream opens LAYER on: its first tap. */
export function shapeFor(model: MplModel, s: MplStream): MplShape {
  return model.shapes.find((sh) => sh.key === s.taps[0]) ?? model.shapes[0]!;
}

/* ── What each direction letters, per reading ─────────────────────────────
   The components render these lists and nothing else; the unit test walks
   them for every stream × reading. `open` is the shape a reader has opened
   in LAYER (defaults to the stream's first tap). */

export type MplDirection = "pick" | "rows" | "deck";

export function lettering(
  v: MplDirection,
  model: MplModel,
  r: MplReading,
  sel: string,
  open?: CaseMapShapeKey
): string[] {
  const s = streamOf(model, sel);
  const shape = model.shapes.find((sh) => sh.key === open) ?? shapeFor(model, s);
  const answers = [
    s.owner,
    s.runs,
    s.runsHow,
    s.reaches,
    s.reachesVia,
    s.runsIn,
    s.runsInVia,
  ].filter(Boolean);
  if (r === "work") {
    if (v === "pick") {
      // The tiles letter the team code; their accessible names are the titles.
      return [...model.streams.flatMap((x) => [x.dept, x.title]), s.title, s.deptName, s.lane];
    }
    if (v === "rows") return model.depts.map((d) => d.short);
    return model.depts.flatMap((d) => [d.name, ...d.streams.flatMap((x) => [x.title, x.lane])]);
  }
  if (r === "configuration") {
    const keys = ["Owner", "Runs", "Reaches", "Runs in"];
    if (v === "rows") return [s.title, ...keys, s.owner, s.runs, s.reaches, s.runsIn];
    if (v === "deck") {
      // Every stream's card is in the track, one swipe apart.
      return model.streams.flatMap((x) => [
        ...keys,
        "The bar",
        x.title,
        x.bar,
        ...[x.owner, x.runs, x.runsHow, x.reaches, x.reachesVia, x.runsIn, x.runsInVia].filter(
          Boolean
        ),
      ]);
    }
    return [...keys, "The bar", s.title, s.bar, ...answers];
  }
  // layer
  if (v === "rows") {
    return [
      ...model.shapes.map((sh) => sh.name),
      shape.meaning,
      ...shape.skills.map((k) => k.short),
    ];
  }
  if (v === "pick") {
    return [
      ...model.shapes.map((sh) => sh.name),
      shape.meaning,
      ...shape.skills.map((k) => k.short),
    ];
  }
  return model.shapes.flatMap((sh) => [sh.name, sh.meaning, ...sh.skills.map((k) => k.short)]);
}
