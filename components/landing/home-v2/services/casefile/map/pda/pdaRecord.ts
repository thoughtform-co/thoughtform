import type {
  CaseMapDistrict,
  CaseMapShape,
  CaseMapShapeKey,
  CaseMapStreamKey,
  CaseMapWork,
  CaseSkillEntry,
} from "@/lib/cases/types";

import {
  MASS_BAND,
  RUN_MODES,
  RUN_MODE_LABEL,
  type RunMode,
  SEAT,
  STREAM_ORDER,
  districtShapes,
  districtTrenched,
  isPersonLed,
  mapTotals,
  runModeOf,
} from "../mapProjection";

/**
 * THE PDA'S RECORD — what the three views draw, derived from the live case.
 *
 * PURE. No react, no DOM. The drawing is a faithful port of the owner's
 * `thoughtform-intelligence-map-v18.html`; this module is what connects it to
 * the record the registry test guards, so the panel cannot drift into
 * publishing numbers the case no longer holds.
 */

/* ⚠ THE GRID OF TWENTY IS GONE (ADR-126). `PDA_COLS / PDA_ROWS / PDA_SHOWN`
   sized a 4×5 estate of every department; the WORK reading is the marketing
   estate now — the streams that carry a `stream`, in three columns — and its
   count is `shown.length`, its ceiling `WORK_COLUMN_SLOTS` per column
   (`mapProjection`). A guard that wants "the number on the board" reads the
   plan, never a constant. */

export interface PdaWork {
  id: string;
  /** Uppercased for the drawing; the record stores sentence case. */
  title: string;
  team: string;
  teamAb: string;
  teamName: string;
  configured: boolean;
  /** Capability lane, or PERSON-LED. */
  lane: string;
  /** How much it decides alone — em dash when nothing is configured. */
  autonomy: string;
  /** Draw meter cells, 0–5. Read against the workload, NEVER a price. */
  draw: number;
  band: string;
  /**
   * REFERENCE INTO THE CASE'S SKILLS ROSTER (ADR-071).
   *
   * ⚠ NULL FOR PERSON-LED STREAMS. `cfg` is null there and there is no
   * encoded substrate to reference — the reading 02 chip and the flight to
   * reading 03 both key off this being set.
   *
   * A configured stream always has one — `pdaRecord` is where the join is
   * resolved (`skills.find(s => s.id === cfg.skillId)`), so a missing entry
   * (a typo in the record, a roster edit that dropped the id) resolves to
   * `null` here rather than throwing, and `cases-registry.test.ts` catches
   * it upstream.
   */
  skillId: string | null;
  /** The seat that owns the work — `cfg.p[0]`. */
  owner: string;
  /**
   * WHAT THAT SEAT ACTUALLY OWNS — `cfg.p[1]`, and it had no home on any
   * drawing until 2026-08-10 (ADR-070 U7). The record has always carried the
   * pair; reading 02 printed the role and dropped the half that says what the
   * role is FOR, which is the half a reader cannot infer.
   *
   * `null` for person-led work: there is no configured seat to gloss, and the
   * owner line already states the absence in full.
   */
  ownerNote: string | null;
  /** The shapes of judgment this stream draws on. Reading 02's substrate row
   *  draws ONE BAR PER TAP and nothing else, so this is what decides how many
   *  bars it seats — the estate's other shapes belong to reading 03. */
  taps: readonly CaseMapShapeKey[];
  /**
   * THE WORK READING'S TWO AXES (ADR-126). `stream` is the record's own
   * creative workstream — the column — and `null` off the marketing estate.
   * `run` is how far the stream runs without a person, derived from its run
   * mode (`runModeOf`): the row inside the column. `null` only for a run mode
   * the table does not know, which the registry refuses upstream; the plan
   * throws on it rather than seating the card in a silent row.
   */
  stream: CaseMapStreamKey | null;
  run: RunMode | null;
  /** The run's group head, uppercased for the drawing ("A PROMPT"). */
  runLabel: string;
  /** What reading 02 actually prints. */
  cfg: PdaAnswers;
}

/**
 * THE FOUR ANSWERS, and the note behind each.
 *
 * Reading 02 asked four questions and printed no answers — every authored
 * value in `CaseMapConfiguration` was dropped by this projection, so the
 * configuration read the same for all twenty-seven streams. These are those
 * values, NAMES ONLY: the drawing letters the name and the readout carries the
 * note, which is the same division ADR-062 settled for the city (the material
 * language carries provenance; a value is never written down twice).
 *
 * ⚠ ONE ELEMENT, NOT THE JOIN, for what a stream can reach. `k` runs to 35
 * characters joined ("Planning system · Resource planning") against a
 * 151-unit measure, which is 121 % — it cannot be lettered in the module at
 * any size that clears the floor. The full join is in `rchNote`, where it has
 * 108 characters of room, so nothing is lost: it moves to the hover.
 *
 * ⚠ NO PAIR MARK between the Skill and its lane. They ARE an interdependent
 * pair — the owner's ruling — but this surface has NO LEGEND by law, and a
 * glyph a reader cannot resolve is worse than the two lines standing together
 * inside one module. Considered and rejected, 2026-08-08.
 */
export interface PdaAnswers {
  /** WHAT RUNS IT — the Skill, then the lane it runs on. */
  skill: string;
  /**
   * ⚠ THE SKILL'S ENGINE, in the roster's own case (ADR-071). It labels the
   * chip's engine tag ("VOICE") and it is what carries the chip's material
   * pattern to the right substrate region on the carrier. `null` for
   * person-led streams (no encoded substrate to file under) and for a
   * configured stream whose join failed — the chip does not render then.
   */
  skillEngine: string | null;
  laneRun: string;
  /**
   * WHAT THE LANE ACTUALLY DOES — `m[1]`, the verbs.
   *
   * ⚠ ADDED BECAUSE `laneRun` IS INSIDER SHORTHAND. The owner's read of the
   * drawing (2026-08-11): _"model — everyday lane? What does everyday lane
   * mean?"_ — and nothing on the surface answers it. The lane is deliberately
   * a GENERIC capability tier, because the map's envelope forbids naming a
   * model family and `cases-registry` fails on one; so the tier cannot be
   * made concrete by naming the model. The verbs can: `Generate / critique /
   * revise` is what the reader can actually picture.
   *
   * Production's reading 02 still letters `laneRun` — this is additive.
   */
  laneVerbs: string;
  runsNote: string;
  /**
   * WHAT IT CAN REACH — the knowledge graph it queries, then the first
   * system it acts on (ADR-070 U9, owner).
   *
   * ⚠ THE GRAPH IS REACHED, NOT INHERITED, and that is the whole point of
   * the re-slot: a graph is answered through a connector on request, while
   * CONTEXT is what the stream carries in before it asks anything. Drawn in
   * the adjacent-domain hand, beside the connector that gets to it.
   */
  graph: string;
  system: string;
  rchNote: string;
  /**
   * WHERE IT RUNS — the agent that carries it, then the interface a person
   * meets it on (ADR-070 U9, owner). `surface` is the record's `u`, which
   * was drawn under CAN REACH until now: an interface is where the work is
   * MET, never something the work reaches.
   */
  agent: string;
  surface: string;
  /**
   * ⚠ CONTEXT IS RECORD-ONLY ON READING 02 SINCE ADR-070 U9. The owner
   * replaced WHAT IT INHERITS with WHERE IT RUNS, and with the hover readout
   * already deleted (U3) there is nowhere left on this reading that letters
   * it. It stays on the projection because the city's unit sheet and the
   * config lab's four archetypes still draw it — deleting it here would take
   * those with it. `inhNote` is retained for the same reason.
   */
  context: string;
  inhNote: string;
  /** WHAT IT IS HELD TO — the bar itself, which is the only honest answer. */
  bar: string;
  gatNote: string;
  /** The readout's rest state: why this lane and not a lighter one. */
  why: string;
}

/**
 * PERSON-LED WORK STILL ANSWERS ALL FOUR.
 *
 * The negative space is the reading leadership takes, so the modules print
 * what is NOT bound rather than emptying out — the same copy the city's unit
 * sheet uses, so the two surfaces cannot drift into describing the same
 * absence differently.
 */
const PERSON = {
  skill: "Not bound to a Skill",
  laneRun: "No lane",
  laneVerbs: "Nothing runs it",
  runsNote: "The person does the work",
  system: "Nothing bound",
  /* WHERE IT RUNS, answered honestly: nowhere. The pair reads `No agent` /
     `No interface` rather than emptying out, so the absence is a reading
     instead of a drawing that failed to load. */
  agent: "No agent",
  surface: "No interface",
  rchNote: "Nothing bound",
  context: "Context held by the person",
  graph: "No graph",
  inhNote: "Context held by the person",
} as const;

/** The drawing is uppercase throughout; the record stores sentence case. */
const up = (s: string) => s.toUpperCase();

function answers(work: CaseMapWork, skills: readonly CaseSkillEntry[]): PdaAnswers {
  const c = work.cfg;
  if (!c) {
    return {
      skill: up(PERSON.skill),
      skillEngine: null,
      laneRun: up(PERSON.laneRun),
      laneVerbs: up(PERSON.laneVerbs),
      runsNote: up(PERSON.runsNote),
      system: up(PERSON.system),
      agent: up(PERSON.agent),
      surface: up(PERSON.surface),
      rchNote: up(PERSON.rchNote),
      context: up(PERSON.context),
      graph: up(PERSON.graph),
      inhNote: up(PERSON.inhNote),
      bar: up(work.bar),
      gatNote: up(work.evals),
      /* No lane was chosen, so there is no "why this lane" to print. The bar
         is what the person is holding themselves to, which is the reading. */
      why: up(work.bar),
    };
  }
  /* ⚠ THE SKILL NAME COMES FROM THE ROSTER (ADR-071, 2026-08-19). Reading 02
     letters the chip and reading 03 letters the cell, and the flight between
     them cannot land wrong because both strings are the SAME roster entry.
     Fallback to `c.s[0]` is a safety net — `cases-registry.test.ts` fails on
     a missing join, so the fallback should never fire in production. */
  const rosterSkill = skills.find((s) => s.id === c.skillId);
  const skillName = rosterSkill?.short ?? c.s[0];
  return {
    skill: up(skillName),
    skillEngine: rosterSkill?.engine ?? null,
    laneRun: up(c.m[0]),
    laneVerbs: up(c.m[1]),
    runsNote: up(`${c.s[1]} — ${c.m[1]}`),
    system: up(c.k[0]),
    agent: up(c.a),
    surface: up(c.u[0]),
    rchNote: up(`${c.k.join(" · ")} · ${c.u.join(" · ")}`),
    context: up(c.c[0]),
    graph: up(c.g[0]),
    inhNote: up(`${c.c[1]} · ${c.g[1]}`),
    bar: up(work.bar),
    /* Who answers for the gate, and how it is checked. `o` is not always the
       seat that sets the bar (`p[0]`, on the plate above), so it belongs
       here rather than being assumed from the owner. */
    gatNote: up(`${c.o} — ${work.evals}`),
    why: up(c.why),
  };
}

/**
 * THE MARKETING ESTATE (ADR-126, owner 2026-09-26: "my main audiences are
 * marketing and studio teams … clustered around creative production,
 * creative operations, and creative review").
 *
 * Every stream that carries a `stream` — the twelve marketing and studio
 * streams on the record — ordered by column (`STREAM_ORDER`), then by how far
 * it runs without a person (`RUN_MODES`, low to high), then by the record's
 * own order. Nothing is chosen: the reading shows exactly what the record
 * files under the three workstreams, so a stream authored onto one appears,
 * and one authored off them does not, with no editorial step between.
 *
 * ⚠ PERSON-LED WORK STAYS. A map that shows only what was configured shows
 * what was built and hides what was not, and the negative space is the
 * reading leadership takes; `hand` is the last run in every column.
 *
 * The signature keeps `districts` (the team codes on the cartridges come from
 * it) so every caller — the console, the labs, five guards — is unchanged.
 */
export function selectWorks(
  districts: readonly CaseMapDistrict[],
  works: readonly CaseMapWork[],
  skills: readonly CaseSkillEntry[]
): PdaWork[] {
  const col = (w: CaseMapWork) => (w.stream ? STREAM_ORDER.indexOf(w.stream) : -1);
  const shown = works
    .map((w, i) => ({ w, i }))
    .filter(({ w }) => col(w) >= 0)
    .map(({ w, i }) => ({
      w,
      i,
      pw: toPdaWork(
        w,
        districts.find((d) => d.id === w.dist),
        skills
      ),
    }))
    .sort((a, b) => {
      const ca = col(a.w);
      const cb = col(b.w);
      if (ca !== cb) return ca - cb;
      const ra = a.pw.run ? RUN_MODES.indexOf(a.pw.run) : RUN_MODES.length;
      const rb = b.pw.run ? RUN_MODES.indexOf(b.pw.run) : RUN_MODES.length;
      return ra - rb || a.i - b.i;
    });
  return shown.map((s) => s.pw);
}

/* ── The plan: what reading 01 draws, before any geometry ─────────────────
   One column per workstream, each a run of group heads and cards. Pure and
   record-only; `PdaViews.workLayout` turns it into rects. Declared here so
   the phone list, the fit guard and the drawing all read ONE grouping. */

export type WorkRun = { mode: RunMode; label: string; ids: readonly string[] };
export interface WorkColumn {
  stream: CaseMapStreamKey;
  runs: readonly WorkRun[];
}
export interface WorkPlan {
  columns: readonly WorkColumn[];
  /** Every card on the reading, in drawing order — the flight's slot index. */
  ids: readonly string[];
}

/**
 * Group the shown streams into columns and runs. ⚠ THROWS on a stream whose
 * run mode the table does not know — the registry makes that unreachable in
 * production, and a silent row would be the `8 TEAMS` class of defect (a
 * drawing composing what no guard scans).
 */
export function workPlan(shown: readonly PdaWork[]): WorkPlan {
  const columns: WorkColumn[] = [];
  for (const stream of STREAM_ORDER) {
    const inCol = shown.filter((w) => w.stream === stream);
    if (!inCol.length) continue;
    const runs: WorkRun[] = [];
    for (const mode of RUN_MODES) {
      const ids = inCol.filter((w) => w.run === mode).map((w) => w.id);
      if (ids.length) runs.push({ mode, label: RUN_MODE_LABEL[mode].toUpperCase(), ids });
    }
    const lost = inCol.find((w) => w.run === null);
    if (lost) throw new Error(`[pda] ${lost.id} runs on a mode the ladder does not place`);
    columns.push({ stream, runs });
  }
  return { columns, ids: columns.flatMap((c) => c.runs.flatMap((r) => r.ids)) };
}

/** One record, projected onto what the drawing letters. Exported so the fit
 *  guard can measure ALL twenty-seven, not just the twelve on the reading. */
export function toPdaWork(
  work: CaseMapWork,
  district: CaseMapDistrict | undefined,
  skills: readonly CaseSkillEntry[]
): PdaWork {
  const person = isPersonLed(work);
  return {
    id: work.id,
    title: work.title.toUpperCase(),
    team: work.dist,
    teamAb: district?.id ?? work.dist,
    teamName: (district?.name ?? "").toUpperCase(),
    configured: !person,
    lane: person ? "PERSON-LED" : `${work.lane}`.toUpperCase(),
    autonomy: person ? "—" : SEAT[work.seat].label.toUpperCase(),
    draw: work.mass,
    band: MASS_BAND[work.mass].toUpperCase(),
    /* ⚠ RESOLVED HERE, ONCE, so the console reads it and the flight measures
       against it. `null` for person-led work (no encoded substrate to point
       at) and for a configured stream whose roster join failed — the guard
       makes the second case impossible in production, but the record has to
       survive it in test fixtures. */
    skillId: work.cfg && skills.some((s) => s.id === work.cfg?.skillId) ? work.cfg.skillId : null,
    owner: (work.cfg?.p[0] ?? "The person does the work").toUpperCase(),
    ownerNote: work.cfg ? work.cfg.p[1].toUpperCase() : null,
    taps: work.shapes,
    stream: work.stream ?? null,
    run: runModeOf(work),
    runLabel: (runModeOf(work) ? RUN_MODE_LABEL[runModeOf(work)!] : "").toUpperCase(),
    cfg: answers(work, skills),
  };
}

/* ── View 03 · the crossing ─────────────────────────────────────────────
   ⚠ DERIVED FROM THE WHOLE RECORD, not from the twenty. A team draws on a
   shape through ANY of its work, and this view's claim is about the estate.
   The two views count different things on purpose, and the foot says which. */

export interface PdaTeam {
  id: string;
  ab: string;
  name: string;
  /** Streams on the board for this team — the twenty's share. */
  shown: number;
  taps: CaseMapShapeKey[];
  /** The shape this team paid to encode, if any. */
  trenched: CaseMapShapeKey | undefined;
}

export interface PdaShape {
  key: CaseMapShapeKey;
  name: string;
  skills: number;
  gloss: string;
  /** What "good" is tested against on this shape — the shared eval method. */
  evalMethod: string;
  /**
   * The shape said as a SENTENCE — reading 03's paragraph, and the only prose
   * on this console.
   *
   * ⚠ NOT UPPERCASED IN THE PROJECTION, alone among these fields. Every other
   * string here is chrome and shouts; this one is meant to be read, and mono
   * caps at 13 units is the least readable thing a paragraph can be.
   */
  meaning: string;
  /** Teams that draw on it. */
  teams: number;
  /** The team that paid to encode it. */
  trenchedBy: string;
}

export function crossing(
  shapes: readonly CaseMapShape[],
  districts: readonly CaseMapDistrict[],
  works: readonly CaseMapWork[],
  shown: readonly PdaWork[]
): { teams: PdaTeam[]; shapes: PdaShape[] } {
  const teams = districts.map((d) => {
    const trenched = districtTrenched(shapes, works, d.id);
    return {
      id: d.id,
      ab: d.id,
      name: d.name.toUpperCase(),
      shown: shown.filter((w) => w.team === d.id).length,
      taps: districtShapes(shapes, works, d.id),
      trenched: trenched[0],
    };
  });

  return {
    teams,
    shapes: shapes.map((s) => ({
      key: s.key,
      name: s.label.toUpperCase(),
      skills: s.skills,
      gloss: s.gloss.toUpperCase(),
      evalMethod: s.evalMethod.toUpperCase(),
      /* ⚠ VERBATIM. The paragraph is prose and stays in the case module's own
         sentence case — see `PdaShape.meaning`. */
      meaning: s.meaning,
      teams: teams.filter((t) => t.taps.includes(s.key)).length,
      trenchedBy: teams.find((t) => t.trenched === s.key)?.ab ?? "—",
    })),
  };
}

/* ── The foot ───────────────────────────────────────────────────────────
   A title and one sentence per view. This is the owner's ask: the drawing
   carries its own provenance, but nothing on the panel said what the reader
   was looking AT. The counts are interpolated so a record edit cannot leave
   the prose claiming a number the drawing no longer shows. */

/** Two readings since ADR-126 — the carrier left the rail. */
export type PdaView = 1 | 2;

export function footCopy(
  view: PdaView,
  totals: ReturnType<typeof mapTotals>,
  shown: number
): { title: string; body: string } {
  if (view === 2) {
    return {
      title: "02 · The configuration",
      body: "What one stream is actually made of. Four parts on record, and an owner who sits outside the boundary.",
    };
  }
  /* ADR-126: the marketing estate on two axes. No "teams" (the district
     guard's own failure mode) and no digit the drawing composes — both
     counts are the record's. */
  return {
    title: "01 · The work",
    body: `${shown} of ${totals.modules} streams: the marketing and studio work, by workstream and by how far each runs without a person. A crossed cartridge is deliberately person-led.`,
  };
}

export const pdaTotals = mapTotals;

/* ── The phone's two readings (ADR-107 U2, two since ADR-126) ──────────
   Below the console's gate the drawings are dropped for LISTS, one per
   reading, keyed on the same `view` the rail selects. 01 is the estate by
   workstream with each row's run; 02 is the projection behind the board.
   Pure, DOM-free, walked by `tests/lib/pda-phone-readings.test.ts` under the
   envelope — a string composed at render time is outside every content
   scanner (ADR-070 U15's `8 TEAMS`). */

export const PDA_PHONE_VIEW: Record<PdaView, "work" | "configuration"> = {
  1: "work",
  2: "configuration",
};

export interface PdaPhoneConfigRow {
  id: string;
  title: string;
  teamName: string;
  configured: boolean;
  /** WHAT RUNS IT — the Skill, then the lane's verbs (never the tier: the
   *  envelope keeps the model class generic, and the verbs are what a
   *  reader can picture). Person-led: the record's own absence. */
  runs: string;
  /** WHAT IT CAN REACH — the graph it queries, then the first system. */
  reach: string;
  /** WHERE IT RUNS — the agent, then the interface a person meets it on. */
  where: string;
}

/** 02 as a ledger: the twenty on the board, each answered with the R4
 *  board's own three answers (`RUNS · REACH · WHERE`). */
export function phoneConfiguration(shown: readonly PdaWork[]): PdaPhoneConfigRow[] {
  return shown.map((w) => ({
    id: w.id,
    title: w.title,
    teamName: w.teamName,
    configured: w.configured,
    runs: w.configured ? `${w.cfg.skill} · ${w.cfg.laneVerbs}` : w.cfg.runsNote,
    reach: w.configured ? `${w.cfg.graph} · ${w.cfg.system}` : w.cfg.rchNote,
    where: `${w.cfg.agent} · ${w.cfg.surface}`,
  }));
}

/* `phoneLayer` — the third list — left with the third reading (ADR-126).
   The carrier and its lab stay on disk until the owner has read the two
   readings live (ADR-070 U35); the phone's LAYER list was console wiring,
   not the drawing, and went with the wiring. */
