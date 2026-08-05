"use client";

/**
 * The three-level diagram instrument (look-dev).
 *
 * One instrument, three levels, three DIFFERENT diagram types in one
 * wireframe line grammar (owner direction, 2026-08-05):
 *
 *   01 THE WORK          — plan view: team plates, stream nodes
 *   02 THE CONFIGURATION — sectional stack: the layers one stream runs through
 *   03 THE SUBSTRATES    — flow braid: 14 team lines through 5 shared engines
 *
 * Laws: no legends (every node self-explanatory in place); hierarchy is
 * positional (the person above; skill and model an interdependent pair —
 * neither outranks the other); no gradients; no italics; rendered type >= 9px.
 * The Arc's route notation is deliberately NOT used here — this surface may
 * not compete with the Arc.
 */

import { useMemo, useState } from "react";
import {
  ALL_STREAMS,
  DEFAULT_STREAM_ID,
  ENGINES,
  STREAM_BY_ID,
  STREAM_TEAM,
  TAGGED_SKILL_COUNT,
  TEAMS,
  teamEngineCounts,
  type EngineKey,
  type Stream,
  type Team,
} from "./streams";

type LevelId = 1 | 2 | 3;

const LEVELS: readonly { id: LevelId; code: string; name: string; form: string }[] = [
  { id: 1, code: "01", name: "THE WORK", form: "PLAN VIEW" },
  { id: 2, code: "02", name: "THE CONFIGURATION", form: "SECTION" },
  { id: 3, code: "03", name: "THE SUBSTRATES", form: "FLOW BRAID" },
];

const HINTS: Record<LevelId, string> = {
  1: "CLICK A STREAM — ITS CONFIGURATION OPENS AT 02",
  2: "ONE STREAM IN SECTION — PICK ANOTHER AT 01",
  3: "HOVER A SHAPE OR A TEAM — SHARED JUDGMENT LIGHTS",
};

export function Instrument() {
  const [level, setLevel] = useState<LevelId>(1);
  const [streamId, setStreamId] = useState(DEFAULT_STREAM_ID);

  const stream = STREAM_BY_ID.get(streamId) ?? ALL_STREAMS[0];
  const team = STREAM_TEAM.get(stream.id) ?? TEAMS[0];

  const openStream = (id: string) => {
    setStreamId(id);
    setLevel(2);
  };

  return (
    <div className="imd" data-level={level}>
      <div className="imd__head">
        <div className="imd__tabs" role="tablist" aria-label="Map level">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              role="tab"
              aria-selected={level === l.id}
              className={`imd__tab${level === l.id ? " is-on" : ""}`}
              onClick={() => setLevel(l.id)}
            >
              <b>{l.code}</b> {l.name} <i>/ {l.form}</i>
            </button>
          ))}
        </div>
        <div className="imd__sel">
          SELECTED <b>{stream.name}</b> / {team.name}
        </div>
      </div>

      <div className="imd__stage">
        {level === 1 && <WorkPlan onOpen={openStream} selectedId={stream.id} />}
        {level === 2 && <ConfigurationSection stream={stream} team={team} />}
        {level === 3 && <SubstrateBraid selectedTeamId={team.id} />}
      </div>

      <div className="imd__foot">
        <span>
          WORK IS THE UNIT <b>·</b> THE CONFIGURATION IS THE ASSET <b>·</b> THE MAP IS WHAT
          TRANSFERS
        </span>
        <span className="imd__hint">{HINTS[level]}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 01 · THE WORK — plan view                                           */
/* ------------------------------------------------------------------ */

function WorkPlan({ onOpen, selectedId }: { onOpen: (id: string) => void; selectedId: string }) {
  return (
    <div className="imd-plan">
      <div className="imd-plan__line">
        <span>
          ALL THE WORK ON RECORD — <b>{ALL_STREAMS.length} STREAMS</b> / {TEAMS.length} TEAMS /{" "}
          {TAGGED_SKILL_COUNT} SKILLS TAGGED
        </span>
        <span className="imd-plan__line-r">A STREAM IS A WORKFLOW — SKILLS SERVE IT</span>
      </div>
      <div className="imd-plan__grid">
        {TEAMS.map((t) => (
          <TeamPlate key={t.id} team={t} onOpen={onOpen} selectedId={selectedId} />
        ))}
      </div>
    </div>
  );
}

function TeamPlate({
  team,
  onOpen,
  selectedId,
}: {
  team: Team;
  onOpen: (id: string) => void;
  selectedId: string;
}) {
  const counts = teamEngineCounts(team);
  const skillCount = team.streams.reduce((n, s) => n + s.skills.length, 0);
  return (
    <section className="imd-plate">
      <header className="imd-plate__head">
        <span className="imd-plate__team">{team.name}</span>
        <span
          className="imd-plate__count"
          title={`${team.streams.length} streams · ${skillCount} skills`}
        >
          {team.streams.length}·{skillCount}
        </span>
      </header>
      <div className="imd-plate__streams">
        {team.streams.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`imd-stream${s.id === selectedId ? " is-sel" : ""}`}
            onClick={() => onOpen(s.id)}
          >
            <span className="imd-stream__mark" aria-hidden />
            <span className="imd-stream__name">{s.name}</span>
            <span
              className="imd-stream__meta"
              title={`${s.skills.length} skills serve this stream`}
            >
              {s.skills.length}
            </span>
          </button>
        ))}
      </div>
      <footer className="imd-plate__engines" aria-label="Shapes this team draws on">
        {ENGINES.map((e) => {
          const n = counts.get(e.key) ?? 0;
          return (
            <i
              key={e.key}
              className={n > 0 ? "is-on" : ""}
              title={`${e.label} · ${n}`}
              aria-hidden
            />
          );
        })}
      </footer>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 02 · THE CONFIGURATION — sectional stack                            */
/* ------------------------------------------------------------------ */

const VB_W = 640;
const VB_H = 368;
/** The spine sits left of centre — the right margin belongs to the person's annotations. */
const CX = 250;

function rhombus(cx: number, cy: number, halfW: number, halfD: number) {
  return `M ${cx} ${cy - halfD} L ${cx + halfW} ${cy} L ${cx} ${cy + halfD} L ${cx - halfW} ${cy} Z`;
}

function chevron(cx: number, y: number) {
  return `M ${cx - 5} ${y} L ${cx} ${y + 6} L ${cx + 5} ${y}`;
}

/** Greedy wrap on separators, max two lines — annotations never leave the frame. */
function wrap2(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  const words = text.split(" ");
  let first = "";
  for (const w of words) {
    const next = first ? `${first} ${w}` : w;
    if (next.length > max && first) break;
    first = next;
  }
  const rest = text.slice(first.length).trim();
  return rest ? [first, rest] : [first];
}

function ConfigurationSection({ stream, team }: { stream: Stream; team: Team }) {
  const n = stream.skills.length;
  const skillLines = stream.skills.map((s) => s.name);
  // Vertical cursor layout: gaps flex with skill-name lines so nothing collides.
  const y = {
    entry: 16,
    person: 62,
    pair: 144,
    names: 182, // first skill-name line under the pair
    ctx: 182 + skillLines.length * 13 + 24,
    gate: 0,
    out: 0,
  };
  y.gate = y.ctx + 76;
  y.out = y.gate + 34;

  const reach = stream.surface
    ? `${stream.reach} · VIA ${stream.surface === "MIMIR" ? "MÍMIR" : "VESPER"}`
    : stream.reach;
  const checkpointLines = wrap2(stream.checkpoint, 28);
  // 20 chars ≈ 136px at 10px PT Mono + 0.08em tracking: the two annotation
  // columns clear the centre line with margin (measured — 26 collided).
  const contextLines = wrap2(stream.context, 20);
  const reachLines = wrap2(reach, 20);

  return (
    <svg
      className="imd-svg"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`Configuration section for ${stream.name}`}
    >
      {/* spine */}
      <line className="imd-hair" x1={CX} y1={y.entry + 8} x2={CX} y2={y.out - 6} />

      {/* the work arrives */}
      <text className="imd-t imd-t--ink" x={CX} y={y.entry} textAnchor="middle">
        {stream.name} / {team.name} — THE WORK ARRIVES
      </text>
      <path className="imd-line" d={chevron(CX, y.person - 38)} />

      {/* PERSON — above everything: sets the bar */}
      <path className="imd-plate-line" d={rhombus(CX, y.person, 150, 24)} />
      <text className="imd-t imd-t--gold" x={CX} y={y.person + 3.5} textAnchor="middle">
        PERSON / {stream.role}
      </text>
      <line className="imd-hair" x1={CX + 152} y1={y.person} x2={CX + 172} y2={y.person} />
      <text className="imd-t imd-t--dim" x={CX + 176} y={y.person - 8}>
        SETS THE BAR / OWNS EXCEPTIONS
      </text>
      {checkpointLines.map((line, i) => (
        <text key={line} className="imd-t imd-t--dim" x={CX + 176} y={y.person + 4 + i * 12}>
          {line}
        </text>
      ))}
      <path className="imd-line" d={chevron(CX, y.pair - 32)} />

      {/* SKILL <-> MODEL — one interdependent pair, below the person */}
      <path className="imd-plate-line" d={rhombus(CX - 125, y.pair, 105, 24)} />
      <text className="imd-t imd-t--gold" x={CX - 125} y={y.pair - 1} textAnchor="middle">
        SKILL / {n} ENCODED
      </text>
      <text className="imd-t imd-t--dim" x={CX - 125} y={y.pair + 11} textAnchor="middle">
        WHAT GOOD MEANS HERE
      </text>
      <path className="imd-plate-line" d={rhombus(CX + 125, y.pair, 105, 24)} />
      <text className="imd-t imd-t--gold" x={CX + 125} y={y.pair - 1} textAnchor="middle">
        MODEL / {stream.lane} LANE
      </text>
      <text className="imd-t imd-t--dim" x={CX + 125} y={y.pair + 11} textAnchor="middle">
        RENTED CAPABILITY
      </text>
      {/* the coupling — neither outranks the other */}
      <path
        className="imd-line"
        d={`M ${CX - 14} ${y.pair - 7} L ${CX + 14} ${y.pair - 7}`}
        markerEnd="url(#imdArrow)"
      />
      <path
        className="imd-line"
        d={`M ${CX + 14} ${y.pair + 7} L ${CX - 14} ${y.pair + 7}`}
        markerEnd="url(#imdArrow)"
      />
      <text className="imd-t imd-t--dim" x={CX} y={y.pair - 15} textAnchor="middle">
        NEEDS ITS CAPABILITY
      </text>
      <text className="imd-t imd-t--dim" x={CX} y={y.pair + 23} textAnchor="middle">
        NEEDS ITS JUDGMENT
      </text>

      {/* the encoded skills, named under the skill plate */}
      {skillLines.map((name, i) => (
        <text
          key={name}
          className="imd-t imd-t--dim"
          x={CX - 125}
          y={y.names + i * 13}
          textAnchor="middle"
        >
          {name}
        </text>
      ))}
      <path className="imd-line" d={chevron(CX, y.ctx - 32)} />

      {/* CONTEXT · REACH — what grounds it, what it may touch */}
      <path className="imd-plate-line" d={rhombus(CX, y.ctx, 150, 24)} />
      <line className="imd-hair" x1={CX} y1={y.ctx - 22} x2={CX} y2={y.ctx + 22} />
      <text className="imd-t imd-t--gold" x={CX - 74} y={y.ctx + 3.5} textAnchor="middle">
        CONTEXT
      </text>
      <text className="imd-t imd-t--gold" x={CX + 74} y={y.ctx + 3.5} textAnchor="middle">
        REACH
      </text>
      {contextLines.map((line, i) => (
        <text
          key={line}
          className="imd-t imd-t--dim"
          x={CX - 74}
          y={y.ctx + 36 + i * 12}
          textAnchor="middle"
        >
          {line}
        </text>
      ))}
      {reachLines.map((line, i) => (
        <text
          key={line}
          className="imd-t imd-t--dim"
          x={CX + 74}
          y={y.ctx + 36 + i * 12}
          textAnchor="middle"
        >
          {line}
        </text>
      ))}
      <path className="imd-line" d={chevron(CX, y.gate - 20)} />

      {/* EVALS — the gate every run passes */}
      <line className="imd-gate" x1={CX - 72} y1={y.gate} x2={CX - 14} y2={y.gate} />
      <line className="imd-gate" x1={CX + 14} y1={y.gate} x2={CX + 72} y2={y.gate} />
      <line className="imd-gate" x1={CX - 72} y1={y.gate + 7} x2={CX - 14} y2={y.gate + 7} />
      <line className="imd-gate" x1={CX + 14} y1={y.gate + 7} x2={CX + 72} y2={y.gate + 7} />
      <text className="imd-t imd-t--gold" x={CX - 82} y={y.gate + 7} textAnchor="end">
        EVALS
      </text>
      <text className="imd-t imd-t--dim" x={CX + 82} y={y.gate + 7}>
        THE GATE EVERY RUN PASSES · {stream.status}
      </text>

      {/* what lands */}
      <path className="imd-line" d={chevron(CX, y.out - 12)} />
      <text className="imd-t imd-t--ink" x={CX} y={y.out + 6} textAnchor="middle">
        {stream.output}
      </text>

      <defs>
        <marker id="imdArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path
            d="M 0 0 L 6 3 L 0 6"
            fill="none"
            stroke="rgba(var(--gold-rgb), 0.8)"
            strokeWidth="1"
          />
        </marker>
      </defs>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* 03 · THE SUBSTRATES — flow braid                                    */
/* ------------------------------------------------------------------ */

/**
 * Braid geometry. Fourteen vertical strands fan in from the team stack and
 * drop through the five channels. Circuit grammar carries the meaning:
 * a diamond tick at a crossing = a skill on record (connection); a plain
 * crossing carries nothing. The 47 ticks on the grid ARE the 47 skills.
 */
const BRAID_LABEL_X = 124;
const BRAID_COL0_X = 190;
const BRAID_COL_W = 28;
const BRAID_TOP_Y = 40;
const CHANNEL_Y: Record<EngineKey, number> = {
  judgment: 84,
  voice: 148,
  validation: 212,
  stakeholder: 276,
  pattern: 340,
};
const CHANNEL_END_X = 618;

function SubstrateBraid({ selectedTeamId }: { selectedTeamId: string }) {
  const [hotTeam, setHotTeam] = useState<string | null>(null);
  const [hotEngine, setHotEngine] = useState<EngineKey | null>(null);

  const strands = useMemo(() => buildBraid(), []);

  const teamLit = (id: string) => {
    if (hotTeam) return hotTeam === id;
    if (hotEngine) return strands.find((p) => p.team.id === id)!.engines.includes(hotEngine);
    return id === selectedTeamId;
  };
  const engineLit = (key: EngineKey) => {
    if (hotEngine) return hotEngine === key;
    if (hotTeam) return strands.find((p) => p.team.id === hotTeam)!.engines.includes(key);
    return false;
  };
  const anyHot = hotTeam !== null || hotEngine !== null;

  return (
    <svg
      className="imd-svg"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Fourteen team strands crossing five shared substrate engines; a tick at a crossing is a skill on record"
    >
      <text className="imd-t imd-t--ink" x={8} y={18}>
        ONE SHARED LAYER — {TAGGED_SKILL_COUNT} SKILLS AT THE CROSSINGS, ENCODED ONCE, DRAWN ACROSS
        TEAMS
      </text>

      {/* the strands (under the rails, over nothing) */}
      {strands.map((p) => {
        const lit = teamLit(p.team.id);
        return (
          <g
            key={p.team.id}
            className={`imd-strand${lit ? " is-lit" : ""}${anyHot && !lit ? " is-dim" : ""}`}
            onMouseEnter={() => setHotTeam(p.team.id)}
            onMouseLeave={() => setHotTeam(null)}
          >
            <text className="imd-t imd-t--team" x={BRAID_LABEL_X} y={p.labelY + 3} textAnchor="end">
              {p.team.short}
            </text>
            <path className="imd-strand__line" d={p.d} />
            <path className="imd-strand__hit" d={p.d} />
            <path
              className="imd-strand__end"
              d={`M ${p.colX - 4} ${p.endY} L ${p.colX} ${p.endY + 5} L ${p.colX + 4} ${p.endY}`}
            />
          </g>
        );
      })}

      {/* the five channels, drawn over the strands so a plain crossing reads as a pass-under */}
      {ENGINES.map((e) => {
        const cy = CHANNEL_Y[e.key];
        const lit = engineLit(e.key);
        return (
          <g
            key={e.key}
            className={`imd-channel${lit ? " is-lit" : ""}${anyHot && !lit ? " is-dim" : ""}`}
            onMouseEnter={() => setHotEngine(e.key)}
            onMouseLeave={() => setHotEngine(null)}
          >
            <line
              className="imd-rail"
              x1={BRAID_COL0_X - 34}
              y1={cy - 5}
              x2={CHANNEL_END_X}
              y2={cy - 5}
            />
            <line
              className="imd-rail"
              x1={BRAID_COL0_X - 34}
              y1={cy + 5}
              x2={CHANNEL_END_X}
              y2={cy + 5}
            />
            <text className="imd-t imd-t--gold" x={BRAID_COL0_X - 34} y={cy - 11}>
              {e.label} — {e.verb}
            </text>
            <text className="imd-t imd-t--dim" x={CHANNEL_END_X} y={cy + 19} textAnchor="end">
              {e.skills} SKILLS / {e.teams} TEAMS
            </text>
            <rect
              x={BRAID_COL0_X - 34}
              y={cy - 14}
              width={CHANNEL_END_X - BRAID_COL0_X + 34}
              height={28}
              fill="transparent"
            />
          </g>
        );
      })}

      {/* connection ticks last — a skill on record at its crossing */}
      {strands.map((p) => {
        const lit = teamLit(p.team.id);
        return (
          <g
            key={p.team.id}
            className={`imd-strand${lit ? " is-lit" : ""}${anyHot && !lit ? " is-dim" : ""}`}
          >
            {p.ticks.map((t, i) => (
              <path key={i} className="imd-tick" d={rhombus(t.x, t.y, 3.2, 3.2)}>
                <title>{`${p.team.name} · ${t.engine} · ${t.count} SKILL${t.count > 1 ? "S" : ""} ON RECORD`}</title>
              </path>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

interface BraidStrand {
  team: Team;
  labelY: number;
  colX: number;
  d: string;
  ticks: { x: number; y: number; engine: string; count: number }[];
  engines: EngineKey[];
  endY: number;
}

function buildBraid(): BraidStrand[] {
  return TEAMS.map((team, i) => {
    const labelY = 44 + i * 23.2;
    const colX = BRAID_COL0_X + i * BRAID_COL_W;
    const counts = teamEngineCounts(team);
    const engines = ENGINES.filter((e) => (counts.get(e.key) ?? 0) > 0).map((e) => e.key);
    const last = engines[engines.length - 1];
    const endY = CHANNEL_Y[last] + 16;
    const midX = (BRAID_LABEL_X + 8 + colX) / 2;
    const d =
      `M ${BRAID_LABEL_X + 8} ${labelY}` +
      ` C ${midX} ${labelY} ${midX} ${BRAID_TOP_Y} ${colX} ${BRAID_TOP_Y}` +
      ` L ${colX} ${endY}`;
    // One tick per skill, centred on the crossing — the 47 ticks on the grid
    // ARE the 47 tagged skills, so the count stays checkable by eye.
    const ticks = engines.flatMap((key) => {
      const count = counts.get(key) ?? 0;
      const label = ENGINES.find((e) => e.key === key)!.label;
      return Array.from({ length: count }, (_, c) => ({
        x: colX + (c - (count - 1) / 2) * 8,
        y: CHANNEL_Y[key],
        engine: label,
        count,
      }));
    });
    return { team, labelY, colX, d, ticks, engines, endY };
  });
}
