"use client";

/* Adoption to automation, as three ruled panels (owner, 2026-10-12, after
   unsiloed.ai: "in the section afterwards, we can highlight adoption and
   automation and how they are connected").

   Unsiloed's grammar: a cell is a technical drawing over a caption band, the
   cells share their edges, and the drawings are records (a file, its
   fields, where they route), never pictures of ideas. Ours run 01 adopt ·
   02 write it down · 03 automate, under the Arc's three words, and ONE gold
   thread runs through all three at the same height, crossing the cell
   borders on a square: the layer is what connects adoption to automation.

   Every drawing is 400 × 260; its words are SVG text at 13 units, which
   letters at 12px or more from a 370px cell up. Illustrative records, by
   role, no figures. Arrival only, the thread drawing left to right. */

import type { CSSProperties, ReactNode } from "react";

import { useArrive } from "../useArrive";

const VW = 400;
const VH = 260;
const TY = 130; // the thread's height in every cell

function Fig({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="mo-svg" role="img" aria-label={label}>
      {children}
    </svg>
  );
}

function Thread({ d, delay }: { d: string; delay: number }) {
  return (
    <path
      d={d}
      className="mo-thread mo-draw"
      pathLength={1}
      style={{ "--d": `${delay}ms` } as CSSProperties}
    />
  );
}

const Sq = ({ x, y, s = 7 }: { x: number; y: number; s?: number }) => (
  <rect x={x - s / 2} y={y - s / 2} width={s} height={s} className="mo-sq" />
);

/* ── 01 · Adopt: the team on real work, one correction kept ─────────── */

function Adopt() {
  const bars = [
    [64, 150, "t"],
    [84, 190, ""],
    [100, 170, ""],
    [116, 120, "hit"],
    [132, 180, ""],
    [148, 160, ""],
    [164, 110, ""],
  ] as const;
  return (
    <Fig label="A brief in a working session, with a correction from creative review">
      <rect x={24} y={22} width={150} height={20} className="mo-tab" />
      <text x={32} y={36} className="mo-t mo-t--dim">
        spring_brief.md
      </text>
      <rect x={24} y={42} width={226} height={176} className="mo-box" />
      {bars.map(([y, w, k]) => (
        <rect
          key={y}
          x={38}
          y={y}
          width={w}
          height={k === "t" ? 8 : 5}
          className={k === "hit" ? "mo-bar mo-bar--hit" : k === "t" ? "mo-bar mo-bar--t" : "mo-bar"}
        />
      ))}
      <rect x={24} y={194} width={226} height={24} className="mo-band" />
      <text x={137} y={210} textAnchor="middle" className="mo-t mo-t--dim">
        WORKING SESSION
      </text>
      {/* the correction, by role */}
      <path d={`M158 ${118}H196`} className="mo-wire mo-wire--team" />
      <rect x={196} y={TY - 26} width={164} height={52} className="mo-note" />
      <text x={206} y={TY - 7} className="mo-t mo-t--sans">
        Lead with the fabric.
      </text>
      <text x={206} y={TY + 15} className="mo-t mo-t--team">
        CREATIVE REVIEW
      </text>
      <text x={24} y={244} className="mo-t mo-t--dim">
        Kept: one correction
      </text>
      <Thread d={`M360 ${TY}H${VW}`} delay={500} />
      <Sq x={VW} y={TY} />
    </Fig>
  );
}

/* ── 02 · Write it down: the correction becomes the layer ───────────── */

function Encode() {
  const notes = [
    { y: 90, t: "Fabric first" },
    { y: 130, t: "No “unleash”" },
    { y: 170, t: "Two claims max" },
  ];
  const rows = [
    { y: 88, k: "CONTEXT", v: "fabric first" },
    { y: 136, k: "CONTEXT", v: "never “unleash”" },
    { y: 184, k: "EVAL", v: "two claims max" },
  ];
  return (
    <Fig label="Three corrections written into the layer as context and an eval">
      <Thread d={`M0 ${TY}H18`} delay={1000} />
      <rect x={18} y={44} width={140} height={172} className="mo-box" />
      <text x={30} y={62} className="mo-t mo-t--dim">
        [ NOTES ]
      </text>
      {notes.map((n) => (
        <text key={n.y} x={30} y={n.y + 4} className="mo-t mo-t--sans">
          {n.t}
        </text>
      ))}
      {notes.map((n, i) => {
        const r = rows[i];
        const mx = 186;
        return (
          <g key={n.y}>
            <path d={`M158 ${n.y}H${mx}V${r.y - 6}H214`} className="mo-wire mo-wire--gold" />
            <Sq x={mx} y={(n.y + r.y - 6) / 2} s={6} />
          </g>
        );
      })}
      <rect x={214} y={44} width={172} height={172} className="mo-box mo-box--gold" />
      <text x={226} y={64} className="mo-t mo-t--gold">
        [ THE LAYER ]
      </text>
      {rows.map((r) => (
        <g key={r.y}>
          <text x={226} y={r.y - 2} className="mo-t mo-t--gold">
            {r.k}
          </text>
          <text x={226} y={r.y + 16} className="mo-t">
            {r.v}
          </text>
        </g>
      ))}
      <Thread d={`M386 ${TY}H${VW}`} delay={1500} />
      <Sq x={0} y={TY} />
      <Sq x={VW} y={TY} />
    </Fig>
  );
}

/* ── 03 · Automate: the layer routes the work to agents ─────────────── */

function Automate() {
  const jobs = [
    { y: 52, k: "BRIEFS", f: "spring_angles.md" },
    { y: 130, k: "STATICS", f: "hero_4x5_de.png" },
    { y: 208, k: "PRE-REVIEW", f: "review_notes.md" },
  ];
  return (
    <Fig label="The layer routes briefs, statics and the pre-review to agents">
      <Thread d={`M0 ${TY}H22`} delay={1700} />
      <rect x={22} y={TY - 15} width={74} height={30} className="mo-chip" />
      <text x={59} y={TY + 4} textAnchor="middle" className="mo-t mo-t--ground">
        LAYER
      </text>
      {jobs.map((j, i) => (
        <g key={j.k}>
          <path
            d={`M96 ${TY}C140 ${TY} 132 ${j.y} 176 ${j.y}`}
            className="mo-thread mo-draw"
            pathLength={1}
            style={{ "--d": `${1950 + i * 120}ms` } as CSSProperties}
          />
          <rect x={176} y={j.y - 30} width={206} height={22} className="mo-head" />
          <text x={186} y={j.y - 15} className="mo-t">
            [ {j.k} ]
          </text>
          <text x={372} y={j.y - 15} textAnchor="end" className="mo-t mo-t--dim">
            agent
          </text>
          <rect x={176} y={j.y - 8} width={206} height={30} className="mo-box" />
          <path d={`M188 ${j.y + 1}V${j.y + 8}H196`} className="mo-wire" />
          <text x={202} y={j.y + 12} className="mo-t mo-t--dim">
            {j.f}
          </text>
        </g>
      ))}
      <Sq x={0} y={TY} />
    </Fig>
  );
}

const CELLS = [
  {
    n: "01",
    step: "Adopt",
    arc: "Navigate",
    title: "The team works with Claude.",
    body: "On real briefs, statics and reviews, with the people who run them. Every correction is a decision someone made, and it is kept.",
    fig: <Adopt />,
  },
  {
    n: "02",
    step: "Write it down",
    arc: "Encode",
    title: "Corrections become the layer.",
    body: "What the team fixes is written as context, a skill or an eval: how X-Bionic sounds, how the work is done, what good looks like.",
    fig: <Encode />,
  },
  {
    n: "03",
    step: "Automate",
    arc: "Build",
    title: "Agents run what was written.",
    body: "Each line written down lets an agent take a longer task by itself. The team reviews what comes back and moves upstream.",
    fig: <Automate />,
  },
];

export function MotionPanels() {
  const ref = useArrive<HTMLDivElement>();
  return (
    <div className="mo" ref={ref}>
      <header className="mo-headline">
        <div>
          <div className="xb-eyebrow">One motion</div>
          <h2 className="xb-title">
            Adoption becomes
            <br />
            <span>automation.</span>
          </h2>
        </div>
        <p className="xb-body mo-lede">
          Adoption is where the layer gets written: the team uses Claude on real work and keeps what
          it corrects. Automation is what the layer makes possible. The gold thread between them is
          the layer itself.
        </p>
      </header>
      <div className="mo-grid">
        {CELLS.map((c) => (
          <section key={c.n} className="mo-cell">
            <div className="mo-cell__fig">{c.fig}</div>
            <div className="mo-cell__cap">
              <div className="mo-cell__step">
                <span>
                  {c.n} · {c.step}
                </span>
                <span className="mo-cell__arc">{c.arc}</span>
              </div>
              <h3 className="mo-cell__title">{c.title}</h3>
              <p className="mo-cell__body">{c.body}</p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
