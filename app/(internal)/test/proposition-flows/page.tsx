import type { ReactNode } from "react";

import { BRANDMARK_PATHS, BRANDMARK_VIEWBOX } from "@/lib/brandmark/brandmarkPaths";

import "./flows.css";

/**
 * /test/proposition-flows: how the three framings sit on one picture (owner,
 * 2026-10-12: "two different frameworks that we need to see harmonize … just
 * flows right now. Just give me quickly a few options").
 *
 *   1. The plug-in: your teams · the intelligence configuration · your stack.
 *   2. The motion: adoption, then automation (upstream, downstream).
 *   3. The Arc: Navigate · Encode · Build, and the homepage's Build phase
 *      (the work in on the left, the layer in the middle, surfaces out).
 *
 * Three options, each the same vocabulary: green is people and their work,
 * gold is the configuration (the mark at the centre), white is what runs.
 * Plain SVG on the site's tokens; nothing here is wired into a page.
 */

const W = 1200;
const H = 580;

const TEAMS = ["Creative production", "Creative ops", "Creative review", "Creative strategy"];
const STACK = ["Claude Enterprise", "Shopify", "Analytics", "Agents"];
const WORK = ["Ad briefs", "Statics", "Feedback", "Reporting"];

type Pt = [number, number];

function Mark({ cx, cy, h }: { cx: number; cy: number; h: number }) {
  const k = h / BRANDMARK_VIEWBOX.h;
  const w = BRANDMARK_VIEWBOX.w * k;
  return (
    <g transform={`translate(${cx - w / 2} ${cy - h / 2}) scale(${k})`} className="pf-mark">
      {BRANDMARK_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
}

/** The configuration: the gate ring with the mark inside, as on both the
 *  homepage's Build and the equilibrium. */
function Hub({
  cx,
  cy,
  r = 78,
  sub = true,
}: {
  cx: number;
  cy: number;
  r?: number;
  sub?: boolean;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 16} className="pf-ring-outer" />
      <circle cx={cx} cy={cy} r={r} className="pf-ring" />
      <Mark cx={cx} cy={cy} h={r * 0.95} />
      <text x={cx} y={cy + r + 44} textAnchor="middle" className="pf-key pf-gold">
        INTELLIGENCE CONFIGURATION
      </text>
      {sub && (
        <text x={cx} y={cy + r + 64} textAnchor="middle" className="pf-note">
          context · skills · evals
        </text>
      )}
    </g>
  );
}

function Diamond({ at, kind }: { at: Pt; kind: "team" | "run" }) {
  const s = 9;
  const [x, y] = at;
  return (
    <path
      d={`M${x} ${y - s}L${x + s} ${y}L${x} ${y + s}L${x - s} ${y}Z`}
      className={kind === "team" ? "pf-dia-team" : "pf-dia-run"}
    />
  );
}

function Curve({
  from,
  to,
  kind,
  dashed,
}: {
  from: Pt;
  to: Pt;
  kind: "team" | "gold" | "run";
  dashed?: boolean;
}) {
  const mx = (from[0] + to[0]) / 2;
  const d = `M${from[0]} ${from[1]}C${mx} ${from[1]} ${mx} ${to[1]} ${to[0]} ${to[1]}`;
  return (
    <path
      d={d}
      className={`pf-line pf-line--${kind}`}
      strokeDasharray={dashed ? "3 6" : undefined}
      markerEnd={`url(#pf-arrow-${kind})`}
    />
  );
}

function Bracket({
  x0,
  x1,
  y,
  label,
  sub,
}: {
  x0: number;
  x1: number;
  y: number;
  label: string;
  sub: string;
}) {
  return (
    <g>
      <path d={`M${x0} ${y - 8}V${y}H${x1}V${y - 8}`} className="pf-bracket" />
      <text x={(x0 + x1) / 2} y={y + 26} textAnchor="middle" className="pf-key pf-gold">
        {label}
      </text>
      <text x={(x0 + x1) / 2} y={y + 46} textAnchor="middle" className="pf-note">
        {sub}
      </text>
    </g>
  );
}

function Defs() {
  return (
    <defs>
      {(["team", "gold", "run"] as const).map((k) => (
        <marker
          key={k}
          id={`pf-arrow-${k}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0 1L9 5L0 9Z" className={`pf-arrowhead pf-arrowhead--${k}`} />
        </marker>
      ))}
    </defs>
  );
}

function Svg({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pf-svg" role="img" aria-label={label}>
      <Defs />
      {children}
    </svg>
  );
}

/* ── Option A · One line ─────────────────────────────────────────────── */

function OptionA() {
  const hub: Pt = [600, 270];
  const lx = 250;
  const rx = 950;
  const ys = [170, 236, 302, 368];
  return (
    <Svg label="One line: your teams, the configuration, your stack">
      <text x={lx} y={70} textAnchor="middle" className="pf-arc">
        01 NAVIGATE
      </text>
      <text x={lx} y={92} textAnchor="middle" className="pf-head pf-green">
        Your teams
      </text>
      <text x={hub[0]} y={70} textAnchor="middle" className="pf-arc">
        02 ENCODE
      </text>
      <text x={rx} y={70} textAnchor="middle" className="pf-arc">
        03 BUILD
      </text>
      <text x={rx} y={92} textAnchor="middle" className="pf-head">
        Your stack
      </text>
      {ys.map((y, i) => (
        <g key={TEAMS[i]}>
          <Curve from={[lx + 12, y]} to={[hub[0] - 96, hub[1]]} kind="team" />
          <Diamond at={[lx, y]} kind="team" />
          <text x={lx - 20} y={y + 4} textAnchor="end" className="pf-label">
            {TEAMS[i].toUpperCase()}
          </text>
        </g>
      ))}
      {ys.map((y, i) => (
        <g key={STACK[i]}>
          <Curve from={[hub[0] + 96, hub[1]]} to={[rx - 12, y]} kind="run" />
          <Diamond at={[rx, y]} kind="run" />
          <text x={rx + 20} y={y + 4} className="pf-label">
            {STACK[i].toUpperCase()}
          </text>
        </g>
      ))}
      <Hub cx={hub[0]} cy={hub[1]} />
      <Bracket x0={lx} x1={hub[0] - 10} y={470} label="ADOPTION" sub="the team writes it down" />
      <Bracket x0={hub[0] + 10} x1={rx} y={470} label="AUTOMATION" sub="the stack runs it" />
    </Svg>
  );
}

/* ── Option B · The cross ────────────────────────────────────────────── */

function OptionB() {
  const hub: Pt = [600, 300];
  const lx = 220;
  const rx = 980;
  const ys = [214, 270, 330, 386];
  return (
    <Svg label="The cross: the motion across, where it plugs in down">
      {/* Down: your team above, writing it; your stack below, running it. */}
      <rect x={440} y={34} width={320} height={64} className="pf-plate pf-plate--team" />
      <text x={600} y={60} textAnchor="middle" className="pf-head pf-green">
        Your teams
      </text>
      <text x={600} y={82} textAnchor="middle" className="pf-note">
        production · ops · review · strategy
      </text>
      <path
        d={`M600 98V${hub[1] - 98}`}
        className="pf-line pf-line--team"
        strokeDasharray="3 6"
        markerEnd="url(#pf-arrow-team)"
      />
      <text x={616} y={150} className="pf-key pf-green">
        WRITE IT
      </text>
      <text x={616} y={170} className="pf-note">
        context, skills, evals
      </text>

      <path d={`M600 ${hub[1] + 150}V${hub[1] + 174}`} className="pf-line pf-line--gold" />
      <rect x={400} y={hub[1] + 174} width={400} height={64} className="pf-plate" />
      <text x={600} y={hub[1] + 200} textAnchor="middle" className="pf-head">
        Your stack
      </text>
      <text x={600} y={hub[1] + 222} textAnchor="middle" className="pf-note">
        Claude Enterprise · Shopify · Analytics
      </text>

      {/* Across: the work by hand becomes the same work, run by agents. */}
      <text x={lx} y={160} textAnchor="middle" className="pf-arc">
        01 NAVIGATE
      </text>
      <text x={lx} y={182} textAnchor="middle" className="pf-key pf-green">
        THE WORK, BY HAND
      </text>
      <text x={rx} y={160} textAnchor="middle" className="pf-arc">
        03 BUILD
      </text>
      <text x={rx} y={182} textAnchor="middle" className="pf-key">
        THE SAME WORK, RUN
      </text>
      {ys.map((y, i) => (
        <g key={`l-${WORK[i]}`}>
          <Curve from={[lx + 12, y]} to={[hub[0] - 96, hub[1]]} kind="team" />
          <Diamond at={[lx, y]} kind="team" />
          <text x={lx - 20} y={y + 4} textAnchor="end" className="pf-label">
            {WORK[i].toUpperCase()}
          </text>
        </g>
      ))}
      {ys.map((y, i) => (
        <g key={`r-${WORK[i]}`}>
          <Curve from={[hub[0] + 96, hub[1]]} to={[rx - 12, y]} kind="run" />
          <Diamond at={[rx, y]} kind="run" />
          <text x={rx + 20} y={y + 4} className="pf-label">
            {WORK[i].toUpperCase()}
          </text>
        </g>
      ))}
      <Hub cx={hub[0]} cy={hub[1]} sub={false} />
      <text x={hub[0] - 120} y={hub[1] - 104} textAnchor="end" className="pf-arc">
        02 ENCODE
      </text>
      <text x={lx} y={500} textAnchor="middle" className="pf-key pf-gold">
        ADOPTION
      </text>
      <text x={lx} y={520} textAnchor="middle" className="pf-note">
        the team does it, and writes it down
      </text>
      <text x={rx} y={500} textAnchor="middle" className="pf-key pf-gold">
        AUTOMATION
      </text>
      <text x={rx} y={520} textAnchor="middle" className="pf-note">
        agents run what was written
      </text>
    </Svg>
  );
}

/* ── Option C · The loop ─────────────────────────────────────────────── */

function OptionC() {
  const hub: Pt = [600, 320];
  const lx = 250;
  const rx = 950;
  const ys = [262, 318, 374, 430];
  return (
    <Svg label="The loop: downstream through the configuration, results back upstream">
      {/* Upstream: the results come back over the top to the team. */}
      <path
        d={`M${rx} 200C${rx} 120 ${lx} 120 ${lx} 200`}
        className="pf-line pf-line--team"
        strokeDasharray="3 6"
        markerEnd="url(#pf-arrow-team)"
      />
      <text x={600} y={84} textAnchor="middle" className="pf-key pf-green">
        UPSTREAM
      </text>
      <text x={600} y={104} textAnchor="middle" className="pf-note">
        results come back; the team decides and writes the next skill
      </text>
      <text x={lx} y={228} textAnchor="middle" className="pf-arc">
        NAVIGATE · YOUR TEAMS
      </text>
      <text x={rx} y={228} textAnchor="middle" className="pf-arc">
        BUILD · YOUR STACK
      </text>
      {ys.map((y, i) => (
        <g key={TEAMS[i]}>
          <Curve from={[lx + 12, y]} to={[hub[0] - 96, hub[1] + 20]} kind="team" />
          <Diamond at={[lx, y]} kind="team" />
          <text x={lx - 20} y={y + 4} textAnchor="end" className="pf-label">
            {TEAMS[i].toUpperCase()}
          </text>
        </g>
      ))}
      {ys.map((y, i) => (
        <g key={STACK[i]}>
          <Curve from={[hub[0] + 96, hub[1] + 20]} to={[rx - 12, y]} kind="run" />
          <Diamond at={[rx, y]} kind="run" />
          <text x={rx + 20} y={y + 4} className="pf-label">
            {STACK[i].toUpperCase()}
          </text>
        </g>
      ))}
      <Hub cx={hub[0]} cy={hub[1] + 20} r={70} sub={false} />
      <text x={hub[0]} y={hub[1] - 72} textAnchor="middle" className="pf-arc">
        ENCODE
      </text>
      <text x={600} y={544} textAnchor="middle" className="pf-note">
        first lap: adoption · every lap after: automation
      </text>
    </Svg>
  );
}

/* ── The page ────────────────────────────────────────────────────────── */

const MAP: { name: string; cells: [string, string, string] }[] = [
  { name: "The Arc", cells: ["Navigate", "Encode", "Build"] },
  { name: "Where it plugs in", cells: ["Your teams", "Intelligence configuration", "Your stack"] },
  { name: "The motion", cells: ["Adoption, upstream", "", "Automation, downstream"] },
  { name: "Homepage Build", cells: ["The work, in", "The layer", "Surfaces, out"] },
  {
    name: "Loop i3 (before)",
    cells: ["Trusted sources", "Encoded substrate", "Headless surfaces"],
  },
];

function Option({
  id,
  name,
  verdict,
  lede,
  reads,
  children,
}: {
  id: string;
  name: string;
  verdict?: string;
  lede: string;
  reads: string[];
  children: ReactNode;
}) {
  return (
    <section className="pf-block" id={id}>
      <header className="pf-block__head">
        <div className="pf-block__id">
          {id.toUpperCase()}
          {verdict ? <span className="pf-block__pick">{verdict}</span> : null}
        </div>
        <h2 className="pf-block__title">{name}</h2>
        <p className="pf-block__lede">{lede}</p>
      </header>
      <div className="pf-block__fig">{children}</div>
      <ul className="pf-block__reads">
        {reads.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </section>
  );
}

export default function PropositionFlowsRoute() {
  return (
    <main className="pf-root">
      <section className="pf-block pf-block--map" id="map">
        <header className="pf-block__head">
          <div className="pf-block__id">THE MAP</div>
          <h2 className="pf-block__title">One axis, named four ways.</h2>
          <p className="pf-block__lede">
            Every framing already runs left to right with the configuration in the middle. The only
            one that breaks the pattern is the old i3 picture, which put systems on the left. In
            every option below the left is always people and their work.
          </p>
        </header>
        <table className="pf-map">
          <tbody>
            {MAP.map((row) => (
              <tr key={row.name}>
                <th>{row.name}</th>
                {row.cells.map((c, i) => (
                  <td key={i} data-col={i}>
                    {c || "·"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Option
        id="a"
        name="One line"
        lede="The three framings are the same line. Teams on the left, the configuration in the middle, the stack on the right. Adoption is the left half, automation the right half."
        reads={[
          "Simplest, and it is the homepage's Build as it stands.",
          "Cost: the stack is both input and output, so data sources and surfaces share the right side.",
        ]}
      >
        <OptionA />
      </Option>

      <Option
        id="b"
        name="The cross"
        verdict="Recommended"
        lede="Two axes, so the two frameworks stay separate and meet in the middle. Across is the motion: the work by hand becomes the same work run by agents. Down is where it plugs in: the team above writes it, the stack below runs it."
        reads={[
          "Across is the homepage's Build. Down is the vision drawing (team, layer, Claude Enterprise).",
          "Proposal: the second section draws the across, the third section draws the down.",
        ]}
      >
        <OptionB />
      </Option>

      <Option
        id="c"
        name="The loop"
        lede="The line closed into the Arc. Work runs downstream through the configuration into the stack, and the results come back upstream to the team, who write the next skill."
        reads={[
          "Adoption is the first lap, automation every lap after.",
          "Cost: the layer section was written earlier as a progression, never a loop.",
        ]}
      >
        <OptionC />
      </Option>
    </main>
  );
}
