import type {
  CaseMapDistrict,
  CaseMapShape,
  CaseMapShapeKey,
  CaseMapWork,
} from "@/lib/cases/types";

import {
  MASS_BAND,
  SEAT,
  districtShapes,
  districtTrenched,
  isPersonLed,
  mapTotals,
  worksInDistrict,
} from "../mapProjection";

/**
 * THE PDA'S RECORD — what the three views draw, derived from the live case.
 *
 * PURE. No react, no DOM. The drawing is a faithful port of the owner's
 * `thoughtform-intelligence-map-v18.html`; this module is what connects it to
 * the record the registry test guards, so the panel cannot drift into
 * publishing numbers the case no longer holds.
 */

/** The grid is four across and five down. Twenty is a shape, not a budget. */
export const PDA_COLS = 4;
export const PDA_ROWS = 5;
export const PDA_SHOWN = PDA_COLS * PDA_ROWS;

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

function answers(work: CaseMapWork): PdaAnswers {
  const c = work.cfg;
  if (!c) {
    return {
      skill: up(PERSON.skill),
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
  return {
    skill: up(c.s[0]),
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
 * THE TWENTY, chosen round-robin across the teams.
 *
 * ⚠ PERSON-LED WORK IS FIRST IN EVERY TEAM'S QUEUE, which is what guarantees
 * all three survive the cut. A map that shows only what was configured shows
 * what was built and hides what was not, and the negative space is the
 * reading leadership takes — it cannot be an editorial casualty of a grid
 * that happens to hold twenty.
 *
 * Round-robin rather than "the twenty biggest" for the second reason: taking
 * by draw alone would empty the smaller teams off the board entirely, and the
 * board's claim is that this is the whole estate.
 */
export function selectWorks(
  districts: readonly CaseMapDistrict[],
  works: readonly CaseMapWork[]
): PdaWork[] {
  const queues = districts.map((d) =>
    [...worksInDistrict(works, d.id)].sort((a, b) => {
      const pa = isPersonLed(a) ? 0 : 1;
      const pb = isPersonLed(b) ? 0 : 1;
      return pa - pb || b.mass - a.mass || a.id.localeCompare(b.id);
    })
  );

  const out: CaseMapWork[] = [];
  for (let round = 0; out.length < PDA_SHOWN; round += 1) {
    let took = 0;
    for (const q of queues) {
      if (out.length >= PDA_SHOWN) break;
      const next = q[round];
      if (!next) continue;
      out.push(next);
      took += 1;
    }
    if (!took) break;
  }

  /* Back into the record's own order, so a team's streams stay adjacent on
     the grid the way they are adjacent in the record. */
  const picked = new Set(out.map((w) => w.id));
  return works
    .filter((w) => picked.has(w.id))
    .map((w) =>
      toPdaWork(
        w,
        districts.find((d) => d.id === w.dist)
      )
    );
}

/** One record, projected onto what the drawing letters. Exported so the fit
 *  guard can measure ALL twenty-seven, not just the twenty on the grid. */
export function toPdaWork(work: CaseMapWork, district: CaseMapDistrict | undefined): PdaWork {
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
    owner: (work.cfg?.p[0] ?? "The person does the work").toUpperCase(),
    ownerNote: work.cfg ? work.cfg.p[1].toUpperCase() : null,
    taps: work.shapes,
    cfg: answers(work),
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

export type PdaView = 1 | 2 | 3;

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
  if (view === 3) {
    return {
      title: "03 · The substrate",
      body: `${totals.mains === 5 ? "Five" : totals.mains} shapes recur across the estate. One team pays to encode each. Every team after that draws on it for nothing.`,
    };
  }
  return {
    title: "01 · The work",
    body: `${shown} of ${totals.modules} streams. A filled cartridge has a configuration on record. A crossed one is deliberately person-led.`,
  };
}

export const pdaTotals = mapTotals;
