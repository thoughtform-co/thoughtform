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
  owner: string;
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
      toPda(
        w,
        districts.find((d) => d.id === w.dist)
      )
    );
}

function toPda(work: CaseMapWork, district: CaseMapDistrict | undefined): PdaWork {
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
